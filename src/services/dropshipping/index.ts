import { db } from "@/lib/db";
import { Supplier } from "@prisma/client";

/**
 * Service functions for dropshipping operations
 */

export interface DropshippingSettingsData {
    autoProcess: boolean;
    autoSendOrders: boolean;
    statusCheckInterval: number;
    defaultShippingDays: number;
    notificationEmail: string | null;
    profitMargin: number;
    automaticFulfillment: boolean;
    notifyCustomerOnShipment: boolean;
    defaultSupplier: string | null;
    supplierNotes: string | null;
}

/**
 * Fetch the dropshipping settings
 * @returns The dropshipping settings or default settings if none exist
 */
export async function getDropshippingSettings() {
    let settings = await db.dropshippingSettings.findFirst();

    if (!settings) {
        // Return default settings
        return {
            autoProcess: true,
            autoSendOrders: false,
            statusCheckInterval: 12,
            defaultShippingDays: 7,
            notificationEmail: null,
            profitMargin: 30,
            automaticFulfillment: true,
            notifyCustomerOnShipment: true,
            defaultSupplier: null,
            supplierNotes: null,
        };
    }

    return settings;
}

/**
 * Update or create the dropshipping settings
 * @param data The settings data to save
 * @returns The updated or created settings
 */
export async function saveDropshippingSettings(data: DropshippingSettingsData) {
    const currentSettings = await db.dropshippingSettings.findFirst();

    if (currentSettings) {
        // Update existing settings
        return await db.dropshippingSettings.update({
            where: { id: currentSettings.id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
    } else {
        // Create new settings
        return await db.dropshippingSettings.create({
            data,
        });
    }
}

/**
 * Get all active suppliers
 */
export async function getActiveSuppliers(): Promise<Supplier[]> {
    return await db.supplier.findMany({
        where: {
            status: "ACTIVE",
        },
        orderBy: {
            name: 'asc',
        },
    });
}
