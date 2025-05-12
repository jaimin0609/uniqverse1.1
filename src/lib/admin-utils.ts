import { db } from "@/lib/db";
import { randomUUID } from "crypto";

type AdminAction =
    | "product_create"
    | "product_update"
    | "product_delete"
    | "order_update"
    | "user_update"
    | "settings_update"
    | "review_moderate"
    | "category_create"
    | "category_update"
    | "category_delete"
    | "customer_view"
    | "customer_update"
    | "customer_delete"
    | "login"
    | "logout";

/**
 * Logs an admin action to the AdminAuditLog table
 * @param action The type of action performed
 * @param details Additional details about the action
 * @param userId The ID of the admin who performed the action
 */
export async function logAdminAction(
    action: AdminAction | string,
    details: string,
    userId: string
) {
    try {
        await db.adminAuditLog.create({
            data: {
                id: randomUUID(),
                action,
                details,
                performedById: userId,
            },
        });
    } catch (error) {
        console.error("Failed to log admin action:", error);
        // We don't throw here to prevent disrupting the main flow
    }
}

/**
 * Get admin audit logs with pagination
 */
export async function getAdminAuditLogs(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    try {
        const logs = await db.adminAuditLog.findMany({
            take: pageSize,
            skip,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                User: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        const total = await db.adminAuditLog.count();

        return {
            logs,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    } catch (error) {
        console.error("Failed to fetch admin audit logs:", error);
        throw error;
    }
}