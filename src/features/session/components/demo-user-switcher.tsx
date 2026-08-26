"use client";

import { useState } from "react";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { DEMO_USERS, type DemoUser } from "@/features/session/demo-users";

type DemoUserSwitcherProps = {
  currentUser: DemoUser;
};

// This intentionally small switcher makes the mocked sharing scenario
// reproducible for reviewers without exposing a client-controlled access ID.
export function DemoUserSwitcher({ currentUser }: DemoUserSwitcherProps) {
  const [isSwitching, setIsSwitching] = useState(false);

  async function switchUser(userId: string) {
    if (userId === currentUser.id || isSwitching) {
      return;
    }

    setIsSwitching(true);

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to switch demo user");
      }

      window.location.reload();
    } catch (error) {
      setIsSwitching(false);
      toast.error(
        error instanceof Error ? error.message : "Unable to switch demo user",
      );
    }
  }

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <Users aria-hidden="true" className="size-4" />
      <span className="sr-only">Demo user</span>
      {isSwitching ? (
        <Loader2 aria-label="Switching user" className="size-4 animate-spin" />
      ) : (
        <select
          aria-label="Demo user"
          className="max-w-32 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => void switchUser(event.target.value)}
          value={currentUser.id}
        >
          {DEMO_USERS.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}
