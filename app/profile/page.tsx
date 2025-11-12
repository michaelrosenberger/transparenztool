"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";

type Occupation = "Farmer" | "Logistik" | "Enduser";

const VEGETABLES = [
  "Tomatoes",
  "Carrots",
  "Potatoes",
  "Salad",
  "Cucumbers",
  "Peppers",
  "Onions",
  "Cabbage",
  "Broccoli",
  "Cauliflower",
];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [fullName, setFullName] = useState("");
  const [occupation, setOccupation] = useState<Occupation | "">("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [vegetables, setVegetables] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Load profile data from user metadata
      const metadata = user.user_metadata || {};
      setFullName(metadata.full_name || "");
      setOccupation(metadata.occupation || "");
      setStreet(metadata.street || "");
      setZipCode(metadata.zip_code || "");
      setCity(metadata.city || "");
      setAddressCoordinates(metadata.address_coordinates || null);
      setVegetables(metadata.vegetables || []);
      setProfileImage(metadata.profile_image || "");
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = async () => {
    // Only validate if all address fields are filled
    if (!street || !zipCode || !city) {
      setAddressCoordinates(null);
      return null;
    }

    setValidatingAddress(true);
    try {
      const fullAddress = `${street}, ${zipCode} ${city}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        setAddressCoordinates(coords);
        return coords;
      } else {
        setAddressCoordinates(null);
        return null;
      }
    } catch (error) {
      console.error("Address validation error:", error);
      setAddressCoordinates(null);
      return null;
    } finally {
      setValidatingAddress(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Validate address if all fields are provided
      let coordinates = addressCoordinates;
      if (street && zipCode && city) {
        coordinates = await validateAddress();
        if (!coordinates) {
          setMessage({ 
            type: "error", 
            text: "Could not validate the address. Please check that the street, zip code, and city are correct." 
          });
          setSaving(false);
          return;
        }
      }

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          occupation: occupation,
          street: street,
          zip_code: zipCode,
          city: city,
          address_coordinates: coordinates,
          vegetables: vegetables,
          profile_image: profileImage,
        },
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size must be less than 5MB" });
      return;
    }

    setUploadingImage(true);
    setMessage(null);

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setProfileImage(publicUrl);
      setMessage({ type: "success", text: "Image uploaded successfully! Don't forget to save your profile." });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to upload image" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Validate passwords
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      setSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Profile Settings</h1>
            <p>{user?.email}</p>
          </div>
        </div>
      </Container>

      <Container asPage>

        <AlertDialog open={!!message} onOpenChange={() => setMessage(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {message?.type === "success" ? "Success" : "Error"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {message?.text}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction onClick={() => setMessage(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>

        {/* Profile Information */}
        <Card title="Profile Information" className="mb-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            {/* Profile Image Upload - Only for Farmers */}
            {occupation === "Farmer" && (
              <div className="space-y-2">
                <Label>Profile Image</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileImage} alt={fullName || "Profile"} />
                    <AvatarFallback>
                      {fullName ? fullName.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Max 5MB. Supported formats: JPG, PNG, GIF
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Select
                value={occupation}
                onValueChange={(value) => setOccupation(value as Occupation)}
              >
                <SelectTrigger                 
                  className="w-full"
                >
                  <SelectValue placeholder="Select your occupation" />
                </SelectTrigger>
                <SelectContent
                  className="w-full"
                >
                  <SelectItem value="Farmer">Farmer</SelectItem>
                  <SelectItem value="Logistik">Logistik</SelectItem>
                  <SelectItem value="Enduser">Enduser</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address Fields - Only for Farmers and Logistik */}
            {occupation !== "Enduser" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="street">Street (Optional)</Label>
                  <Input
                    id="street"
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Enter your street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code (Optional)</Label>
                    <Input
                      id="zipCode"
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="Enter zip code"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City (Optional)</Label>
                    <Input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                {/* Address Validation Status */}
                {street && zipCode && city && (
                  <div className="p-3 rounded-md bg-gray-50 border border-gray-200">
                    {addressCoordinates ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <span>✓</span>
                        <span className="text-sm">
                          Address validated
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-700">
                        <span>⚠</span>
                        <span className="text-sm">
                          Address will be validated when you save your profile
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Vegetables Multi-Select - Only for Farmers */}
            {occupation === "Farmer" && (
              <div className="space-y-2">
                <Label>Available Vegetables (Optional)</Label>
                <MultiSelect
                  values={vegetables}
                  onValuesChange={setVegetables}
                >
                  <MultiSelectTrigger className="w-full">
                    <MultiSelectValue placeholder="Select vegetables you grow..." />
                  </MultiSelectTrigger>
                  <MultiSelectContent>
                    <MultiSelectGroup>
                      {VEGETABLES.map((vegetable) => (
                        <MultiSelectItem key={vegetable} value={vegetable}>
                          {vegetable}
                        </MultiSelectItem>
                      ))}
                    </MultiSelectGroup>
                  </MultiSelectContent>
                </MultiSelect>
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              size="lg"
              className="w-full"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Card>

        {/* Change Password */}
        <Card title="Change Password">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <p className="text-xs">
                Must be at least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button
              type="submit"
              disabled={saving || !newPassword || !confirmPassword}
              size="lg"
              className="w-full"
            >
              {saving ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </Card>
      </Container>
    </>
  );
}
