"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";

type Occupation = "Farmer" | "Logistik" | "Enduser";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [occupation, setOccupation] = useState<Occupation | "">("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  
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
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          occupation: occupation,
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-white">Profile Settings</h1>
        <p className="text-gray-300 mb-8">{user?.email}</p>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 border border-green-400 text-green-700"
                : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Information */}
        <Card title="Profile Information" className="mb-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2 text-black">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="occupation" className="block text-sm font-medium mb-2 text-black">
                Occupation
              </label>
              <select
                id="occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value as Occupation)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select your occupation</option>
                <option value="Farmer">Farmer</option>
                <option value="Logistik">Logistik</option>
                <option value="Enduser">Enduser</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-black text-white font-medium py-3 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </Card>

        {/* Change Password */}
        <Card title="Change Password">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-2 text-black">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter new password"
              />
              <p className="text-xs text-gray-600 mt-1">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-black">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !newPassword || !confirmPassword}
              className="w-full rounded-full bg-black text-white font-medium py-3 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Changing..." : "Change Password"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
