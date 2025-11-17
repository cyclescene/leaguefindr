import type { User } from "@clerk/nextjs/server";
import type { JwtPayload } from "@clerk/types";

declare global {
  interface CustomJwtSessionClaims extends JwtPayload {
    appRole?: "admin" | "organizer" | "user";
    role?: "authenticated";
    emailVerified?: boolean;
  }

  namespace Clerk {
    interface UserPublicMetadata {
      role?: "admin" | "organizer" | "user";
    }

  }
}

export interface ClerkUser extends User {
  publicMetadata: Clerk.UserPublicMetadata;
}
