import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { db } from "./db";

// Auth options configuration for NextAuth
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                }
            }
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await db.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                });

                if (!user || !user.password) {
                    return null;
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!passwordMatch) {
                    return null;
                }

                return user;
            },
        }),
    ], callbacks: {
        async signIn({ user, account, profile }) {
            console.log("SignIn Callback - Provider:", account?.provider);
            console.log("SignIn Callback - User:", user ? { id: user.id, email: user.email, role: user.role } : null);

            // Allow all sign-ins, but ensure user has proper role
            if (account?.provider === "google" && user?.email) {
                // For Google OAuth, ensure the user has a role
                try {
                    const existingUser = await db.user.findUnique({
                        where: { email: user.email },
                        select: { id: true, role: true }
                    });

                    console.log("SignIn Callback - Existing User:", existingUser);

                    if (existingUser && !existingUser.role) {
                        // Update user with default role if it's missing
                        await db.user.update({
                            where: { id: existingUser.id },
                            data: { role: "CUSTOMER" }
                        });
                        console.log("SignIn Callback - Updated user role to CUSTOMER");
                    }
                } catch (error) {
                    console.error("SignIn Callback - Error ensuring user role:", error);
                    return false; // Block sign-in if there's a database error
                }
            }
            console.log("SignIn Callback - Success");
            return true;
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    ...session.user,
                    id: token.id as string,
                    name: token.name as string,
                    email: token.email as string,
                    image: token.picture as string | null,
                    role: token.role as UserRole
                };
            }
            return session;
        }, async jwt({ token, user }) {
            console.log("JWT Callback - User:", user ? { id: user.id, email: user.email, role: user.role } : null);
            console.log("JWT Callback - Token before:", { id: token.id, email: token.email, role: token.role });

            if (user) {
                token.id = user.id;
                token.role = user.role as UserRole || "CUSTOMER"; // Default to CUSTOMER if role is undefined
            } else if (token.email) {
                const existingUser = await db.user.findUnique({
                    where: {
                        email: token.email,
                    },
                    select: {
                        id: true,
                        role: true
                    }
                });

                if (existingUser) {
                    token.id = existingUser.id;
                    token.role = existingUser.role as UserRole;
                }
            }

            console.log("JWT Callback - Token after:", { id: token.id, email: token.email, role: token.role });
            return token;
        },
    },
    events: {
        async signIn({ user, account, profile, isNewUser }) {
            console.log("Event - SignIn:", {
                userId: user.id,
                email: user.email,
                provider: account?.provider,
                isNewUser
            });
        },
        async createUser({ user }) {
            console.log("Event - CreateUser:", { userId: user.id, email: user.email, role: user.role });
        },
        async linkAccount({ user, account, profile }) {
            console.log("Event - LinkAccount:", { userId: user.id, provider: account.provider });
        }
    },
    pages: {
        signIn: "/auth/login",
        error: "/auth/error",
        verifyRequest: "/auth/verify",
        newUser: "/auth/register",
        // Remove signOut to prevent redirect loops
    },
    session: {
        strategy: "jwt",
        // Increase maxAge for better mobile compatibility
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    // Add useSecureCookies and cookie settings for better mobile support
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
        sessionToken: {
            name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },    // Add debug for production to help troubleshoot
    debug: process.env.NODE_ENV === "development" || process.env.NEXTAUTH_DEBUG === "true",
    secret: process.env.NEXTAUTH_SECRET,
};