// Authentication API endpoint tests using simplified approach without Next.js dependencies
import { hash } from 'bcryptjs';
import { registerUser } from './auth-service';

// Mock dependencies
jest.mock('@/lib/db', () => ({
    db: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}));

// Import after mocking
import { db } from '@/lib/db';

// Create properly typed mocks
const mockDb = db as jest.Mocked<typeof db>;
const mockHash = hash as jest.MockedFunction<typeof hash>;

describe('Auth API Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        it('should create a new user successfully', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            };

            // Mock database responses
            (mockDb.user.findUnique as jest.Mock).mockResolvedValue(null); // User doesn't exist
            (mockHash as jest.Mock).mockResolvedValue('hashedPassword123');
            (mockDb.user.create as jest.Mock).mockResolvedValue({
                id: '1',
                name: userData.name,
                email: userData.email,
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const result = await registerUser(userData);

            expect(result.status).toBe(201);
            expect(result.success).toBe(true);
            expect(result.message).toBe('User created successfully');
            expect(mockDb.user.findUnique).toHaveBeenCalledWith({
                where: { email: userData.email },
            });
            expect(mockHash).toHaveBeenCalledWith(userData.password, 12);
            expect(mockDb.user.create).toHaveBeenCalled();
        });

        it('should return error if user already exists', async () => {
            const userData = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123',
            };

            // Mock existing user
            (mockDb.user.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                email: userData.email,
            });

            const result = await registerUser(userData);

            expect(result.status).toBe(400);
            expect(result.success).toBe(false);
            expect(result.message).toBe('User with this email already exists');
            expect(mockDb.user.create).not.toHaveBeenCalled();
        });

        it('should handle database errors gracefully', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            };

            (mockDb.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

            try {
                await registerUser(userData);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });
});
