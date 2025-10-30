import type { User } from "@clerk/nextjs/server";
import type { JwtPayload } from "@clerk/types";

declare global {
  interface CustomJwtSessionClaims extends JwtPayload {
    role?: "admin" | "user";
    emailVerified?: boolean;
  }

  namespace Clerk {
    interface UserPublicMetadata {
      role?: "admin" | "user";
      organizationName?: string;
    }

  }
}

export interface ClerkUser extends User {
  publicMetadata: Clerk.UserPublicMetadata;
}
