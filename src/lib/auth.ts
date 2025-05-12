// Export the auth options and getServerSession from auth-utils.ts
import { authOptions } from './auth-utils';
import { getServerSession } from 'next-auth/next';

// Helper function to get the current session
export async function auth() {
    return await getServerSession(authOptions);
}

// Re-export authOptions for use elsewhere
export { authOptions };
