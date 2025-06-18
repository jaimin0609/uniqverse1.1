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
        }), CredentialsProvider({
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

                // Check if email is verified
                if (!user.emailVerified) {
                    throw new Error("Please verify your email address before signing in. Check your inbox for a verification email.");
                }

                return user;
            },
        }),
    ], callbacks: {
        async signIn({ user, account, profile }) {
            console.log("SignIn Callback - Provider:", account?.provider);
            console.log("SignIn Callback - User:", user ? { id: user.id, email: user.email, role: user.role } : null);

            // Handle Google OAuth account linking
            if (account?.provider === "google" && user?.email) {
                try {
                    // Check if there's an existing user with this email
                    const existingUser = await db.user.findUnique({
                        where: { email: user.email },
                        include: {
                            accounts: true
                        }
                    });

                    console.log("SignIn Callback - Existing User:", existingUser);

                    if (existingUser) {
                        // Check if this Google account is already linked
                        const googleAccount = existingUser.accounts.find(
                            acc => acc.provider === "google" && acc.providerAccountId === account.providerAccountId
                        );

                        if (!googleAccount) {
                            // Link the Google account to the existing user
                            await db.account.create({
                                data: {
                                    userId: existingUser.id,
                                    type: account.type,
                                    provider: account.provider,
                                    providerAccountId: account.providerAccountId,
                                    refresh_token: account.refresh_token,
                                    access_token: account.access_token,
                                    expires_at: account.expires_at,
                                    token_type: account.token_type,
                                    scope: account.scope,
                                    id_token: account.id_token,
                                    session_state: account.session_state,
                                }
                            });
                            console.log("SignIn Callback - Linked Google account to existing user");
                        }

                        // Ensure user has proper role
                        if (!existingUser.role) {
                            await db.user.update({
                                where: { id: existingUser.id },
                                data: { role: "CUSTOMER" }
                            });
                            console.log("SignIn Callback - Updated user role to CUSTOMER");
                        }

                        // Update the user object to use the existing user's ID
                        user.id = existingUser.id;
                        user.role = existingUser.role || "CUSTOMER";
                    }
                } catch (error) {
                    console.error("SignIn Callback - Error with account linking:", error);
                    // Allow sign-in to continue even if linking fails
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
    }, pages: {
        signIn: "/auth/login",
        error: "/auth/error",
        verifyRequest: "/auth/verify",
        // Remove newUser redirect to prevent Google OAuth users from being sent to register
        // newUser: "/auth/register",
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