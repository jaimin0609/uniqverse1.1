// Authentication service module for testing
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function registerUser(userData: { name: string, email: string, password: string }) {
    try {
        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { email: userData.email },
        });

        if (existingUser) {
            return {
                success: false,
                message: 'User with this email already exists',
                status: 400
            };
        }

        // Hash password
        const hashedPassword = await hash(userData.password, 12);

        // Create user
        const user = await db.user.create({
            data: {
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
            },
        });

        return {
            success: true,
            message: 'User created successfully',
            status: 201
        };
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}
