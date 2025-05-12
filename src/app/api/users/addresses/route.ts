import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for address creation and updates
const addressSchema = z.object({
    type: z.enum(["SHIPPING", "BILLING"]).default("SHIPPING"),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    company: z.string().optional(),
    address1: z.string().min(5, "Address line 1 is required"),
    address2: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().optional(),
    postalCode: z.string().min(3, "Postal code is required"),
    country: z.string().min(2, "Country is required"),
    phone: z.string().optional(),
    isDefault: z.boolean().default(false),
});

// GET - Get all addresses for a user
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const addresses = await db.address.findMany({
            where: { userId: session.user.id },
            orderBy: [
                { isDefault: 'desc' },
                { updatedAt: 'desc' }
            ]
        });

        return NextResponse.json({ addresses });

    } catch (error) {
        console.error("Error fetching addresses:", error);
        return NextResponse.json(
            { message: "Failed to fetch addresses" },
            { status: 500 }
        );
    }
}

// POST - Create a new address
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validationResult = addressSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { message: "Invalid address data", errors: validationResult.error.errors },
                { status: 400 }
            );
        }

        const addressData = validationResult.data;

        // If this is set as default, update all other addresses to not be default
        if (addressData.isDefault) {
            await db.address.updateMany({
                where: {
                    userId: session.user.id,
                    type: addressData.type
                },
                data: { isDefault: false }
            });
        }

        // If this is the first address of this type, make it default
        const existingAddresses = await db.address.count({
            where: {
                userId: session.user.id,
                type: addressData.type
            }
        });

        if (existingAddresses === 0) {
            addressData.isDefault = true;
        }

        const address = await db.address.create({
            data: {
                ...addressData,
                userId: session.user.id,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            message: "Address created successfully",
            address
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating address:", error);
        return NextResponse.json(
            { message: "Failed to create address" },
            { status: 500 }
        );
    }
}

// PATCH - Update an existing address
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { message: "Address ID is required" },
                { status: 400 }
            );
        }

        // Verify the address belongs to the user
        const existingAddress = await db.address.findFirst({
            where: {
                id,
                userId: session.user.id
            }
        });

        if (!existingAddress) {
            return NextResponse.json(
                { message: "Address not found" },
                { status: 404 }
            );
        }

        const body = await req.json();
        const updateSchema = addressSchema.partial();
        const validationResult = updateSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { message: "Invalid address data", errors: validationResult.error.errors },
                { status: 400 }
            );
        }

        const addressData = validationResult.data;

        // If setting as default, update all other addresses of this type
        if (addressData.isDefault) {
            await db.address.updateMany({
                where: {
                    userId: session.user.id,
                    type: addressData.type || existingAddress.type,
                    NOT: { id }
                },
                data: { isDefault: false }
            });
        }

        const updatedAddress = await db.address.update({
            where: { id },
            data: {
                ...addressData,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            message: "Address updated successfully",
            address: updatedAddress
        });

    } catch (error) {
        console.error("Error updating address:", error);
        return NextResponse.json(
            { message: "Failed to update address" },
            { status: 500 }
        );
    }
}

// DELETE - Remove an address
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { message: "Address ID is required" },
                { status: 400 }
            );
        }

        // Verify the address belongs to the user
        const existingAddress = await db.address.findFirst({
            where: {
                id,
                userId: session.user.id
            }
        });

        if (!existingAddress) {
            return NextResponse.json(
                { message: "Address not found" },
                { status: 404 }
            );
        }

        // Delete the address
        await db.address.delete({
            where: { id }
        });

        // If this was a default address, set another address as default if available
        if (existingAddress.isDefault) {
            const nextAddress = await db.address.findFirst({
                where: {
                    userId: session.user.id,
                    type: existingAddress.type
                },
                orderBy: { updatedAt: 'desc' }
            });

            if (nextAddress) {
                await db.address.update({
                    where: { id: nextAddress.id },
                    data: { isDefault: true }
                });
            }
        }

        return NextResponse.json({
            message: "Address deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting address:", error);
        return NextResponse.json(
            { message: "Failed to delete address" },
            { status: 500 }
        );
    }
}