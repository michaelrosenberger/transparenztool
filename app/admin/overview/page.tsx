"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkAdminAuth } from "@/lib/auth/checkAdminAuth";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Pencil, Trash2, Store } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  user_id: string;
  full_name?: string;
  occupation?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email?: string;
  last_sign_in_at?: string;
}

type SortField = "email" | "last_sign_in_at" | "occupation" | "full_name";
type SortDirection = "asc" | "desc";

interface CombinedUser {
  id: string;
  email: string;
  full_name?: string;
  occupation?: string;
  last_sign_in_at?: string;
  street?: string;
  zip_code?: string;
  city?: string;
  profile_image?: string;
  vegetables?: string[];
  address_coordinates?: { lat: number; lng: number };
  is_admin?: boolean;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<CombinedUser[]>([]);
  const [sortField, setSortField] = useState<SortField>("email");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      try {
        const { user, isAdmin } = await checkAdminAuth();
        
        if (!user) {
          router.push("/login");
          return;
        }

        if (!isAdmin) {
          router.push("/");
          return;
        }

        await loadUsers();
        setLoading(false);
      } catch (error) {
        console.error('Error in checkUserAndLoadData:', error);
        router.push("/");
      }
    };

    checkUserAndLoadData();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      
      if (!response.ok) {
        setUsers([]);
        return;
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      setUsers([]);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedUsers = () => {
    return [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "email":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "full_name":
          aValue = a.full_name || "";
          bValue = b.full_name || "";
          break;
        case "occupation":
          aValue = a.occupation || "";
          bValue = b.occupation || "";
          break;
        case "last_sign_in_at":
          aValue = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
          bValue = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nie";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${deleteUserId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Löschen");
      }

      setUsers(users.filter(u => u.id !== deleteUserId));
      setMessage({ type: "success", text: "Benutzer erfolgreich gelöscht" });
      setDeleteUserId(null);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Fehler beim Löschen des Benutzers" });
    } finally {
      setDeleting(false);
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-8 px-2 lg:px-3"
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Verwaltung</h1>
            <p>Alle registrierten Benutzer und ihre Informationen</p>
          </div>
        </div>
      </Container>

      <Container asPage>
        <Card title={`Benutzer (${users.length})`}>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="email" label="E-Mail" />
                </TableHead>
                <TableHead>
                  <SortButton field="full_name" label="Name" />
                </TableHead>
                <TableHead>
                  <SortButton field="occupation" label="Beruf" />
                </TableHead>
                <TableHead>
                  <SortButton field="last_sign_in_at" label="Letzte Aktivität" />
                </TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedUsers().map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="pl-5">{user.email}</TableCell>
                  <TableCell>{user.full_name || "-"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.occupation || "Nicht angegeben"}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(user.last_sign_in_at || null)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        title="Benutzer bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {user.occupation === "Produzenten" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/produzenten/${user.id}`)}
                          title="Geschäftsprofil bearbeiten"
                        >
                          <Store className="h-4 w-4" />
                        </Button>
                      )}
                      {!user.is_admin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteUserId(user.id)}
                          title="Benutzer löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button className="mt-6 flex ml-auto" onClick={() => router.push('/admin/produzenten/new')}>
            Neuer Produzent
          </Button>
      </Card>
      </Container>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diesen Benutzer löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className=""
            >
              {deleting ? "Löscht..." : "Löschen"}
            </AlertDialogAction>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success/Error Message Dialog */}
      <AlertDialog open={!!message} onOpenChange={() => setMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {message?.type === "success" ? "Erfolg" : "Fehler"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {message?.text}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setMessage(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
