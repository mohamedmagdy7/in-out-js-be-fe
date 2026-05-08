"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui";
import { logout } from "@/lib/auth/auth-provider";

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      leftIcon={<LogOut className="h-4 w-4" />}
      onClick={() => {
        void logout();
      }}
    >
      Sign out
    </Button>
  );
}
