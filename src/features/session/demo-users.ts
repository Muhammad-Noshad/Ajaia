// These stable demo identities make the sharing workflow reviewable without
// pretending that this assessment starter implements production authentication.
export const DEMO_USERS = [
  {
    id: "alice",
    name: "Alice Morgan",
    email: "alice@example.test",
  },
  {
    id: "bob",
    name: "Bob Chen",
    email: "bob@example.test",
  },
  {
    id: "casey",
    name: "Casey Patel",
    email: "casey@example.test",
  },
] as const;

export type DemoUser = (typeof DEMO_USERS)[number];

export const DEFAULT_DEMO_USER_ID = DEMO_USERS[0].id;

export function getDemoUser(userId: string | undefined): DemoUser | undefined {
  return DEMO_USERS.find((user) => user.id === userId);
}
