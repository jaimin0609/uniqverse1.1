import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
    /**
     * Extend the built-in session types
     */
    interface Session {
        user: {
            id: string;
            role: UserRole;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    /**
     * Extend the built-in JWT types
     */
    interface JWT {
        id: string;
        role: UserRole;
    }
}