import { db } from './src/lib/db';

async function updateUserRole() {
    try {
        // First, let's see all users and their current roles
        const users = await db.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        });

        console.log('Current users and their roles:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.name}) - Role: ${user.role} - ID: ${user.id}`);
        });

        // Replace 'USER_EMAIL_HERE' with the actual email of the user you want to update
        const userEmailToUpdate = 'jaimin0609@gmail.com'; // Change this to the correct email

        // Update user role using Prisma (this should work better than raw SQL)
        const updatedUser = await db.user.update({
            where: { email: userEmailToUpdate },
            data: { role: 'ADMIN' as any },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        });

        console.log(`\nSuccessfully updated user role:`);
        console.log(`Email: ${updatedUser.email}`);
        console.log(`Name: ${updatedUser.name}`);
        console.log(`New Role: ${updatedUser.role}`);

    } catch (error) {
        console.error('Error updating user role:', error);

        // If Prisma update fails, try raw SQL as fallback
        console.log('\nTrying with raw SQL...');

        try {
            const userEmailToUpdate = 'jaimin0609@gmail.com'; // Change this to the correct email

            // Use raw SQL with proper enum casting
            const result = await db.$executeRaw`
                UPDATE "User" 
                SET "role" = CAST(${'ADMIN'} AS "UserRole")
                WHERE "email" = ${userEmailToUpdate}
            `;

            console.log(`Raw SQL update affected ${result} rows`);

            // Verify the update
            const verifyUser = await db.user.findUnique({
                where: { email: userEmailToUpdate },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true
                }
            });

            console.log('Verification - Updated user:', verifyUser);

        } catch (rawError) {
            console.error('Raw SQL also failed:', rawError);
        }
    } finally {
        await db.$disconnect();
    }
}

updateUserRole();
