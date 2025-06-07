// Authentication service tests using simplified approach
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
    hash: jest.fn().mockImplementation((password: string, saltRounds: number) => Promise.resolve('hashedPassword123')),
}));

// Import after mocking
import { db } from '@/lib/db';

// Create properly typed mocks
const mockDb = db as jest.Mocked<typeof db>;
const mockHash = hash as jest.MockedFunction<typeof hash>;

describe('Auth Service - registerUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new user successfully', async () => {
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        };

        // Mock database responses
        mockDb.user.findUnique.mockResolvedValue(null); // User doesn't exist
        mockHash.mockResolvedValueOnce('hashedPassword123');
        mockDb.user.create.mockResolvedValue({
            id: '1',
            name: userData.name,
            email: userData.email,
            role: 'USER',
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);

        const result = await registerUser(userData);

        expect(result.success).toBe(true);
        expect(result.status).toBe(201);
        expect(result.message).toBe('User created successfully');
        expect(mockDb.user.findUnique).toHaveBeenCalledWith({
            where: { email: userData.email },
        });
        expect(mockHash).toHaveBeenCalledWith(userData.password, 12);
        expect(mockDb.user.create).toHaveBeenCalledWith({
            data: {
                name: userData.name,
                email: userData.email,
                password: 'hashedPassword123',
            },
        });
    });

    it('should return error if user already exists', async () => {
        const userData = {
            name: 'Test User',
            email: 'existing@example.com',
            password: 'password123',
        };

        // Mock existing user
        mockDb.user.findUnique.mockResolvedValue({
            id: '1',
            email: userData.email,
        } as any);

        const result = await registerUser(userData);

        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        expect(result.message).toBe('User with this email already exists');
        expect(mockDb.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        };

        mockDb.user.findUnique.mockRejectedValue(new Error('Database error'));

        try {
            await registerUser(userData);
            fail('Should have thrown an error');
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe('Database error');
        }
    });
});
