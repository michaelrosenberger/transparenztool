"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Container from "@/app/components/Container";
import Card from "@/app/components/Card";

export default function DebugAuthPage() {
  const [authData, setAuthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      // Get user from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get auth check from API
      const response = await fetch('/api/auth/check');
      const apiData = await response.json();
      
      // Get roles directly from database
      let roles = null;
      if (user) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);
        roles = rolesData;
      }
      
      setAuthData({
        clientUser: user,
        apiResponse: apiData,
        databaseRoles: roles,
      });
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <Container asPage>
        <Card>
          <p>Loading...</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container asPage>
      <Card>
        <h1 className="text-2xl font-bold mb-4">Auth Debug Info</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-bold">Client User:</h2>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
              {JSON.stringify(authData.clientUser, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="font-bold">API Response (/api/auth/check):</h2>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
              {JSON.stringify(authData.apiResponse, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="font-bold">Database Roles (user_roles table):</h2>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
              {JSON.stringify(authData.databaseRoles, null, 2)}
            </pre>
          </div>
        </div>
      </Card>
    </Container>
  );
}
