import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-utils";

// Extend the next-auth types to include role property
declare module "next-auth" {
    interface User {
        role?: string;
    }

    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            image?: string | null;
            role?: string;
        }
    }

    interface JWT {
        id: string;
        role?: string;
    }
}

// Initialize NextAuth handler with the options from auth-utils
const handler = NextAuth(authOptions);

// Export the handler functions
export { handler as GET, handler as POST };