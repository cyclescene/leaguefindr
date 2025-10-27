import type { User } from "@clerk/nextjs/server";

declare global {
  namespace Clerk {
    interface UserPublicMetadata {
      role?: "admin" | "user";
    }
  }
}

export interface ClerkUser extends User {
  publicMetadata: Clerk.UserPublicMetadata;
}
