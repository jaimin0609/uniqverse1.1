// This file re-exports types from the Prisma client
import { $Enums } from '../generated/prisma';

// Re-export the enum types
export type PromotionType = $Enums.PromotionType;
export type DiscountType = $Enums.DiscountType;
export type UserRole = $Enums.UserRole;

// Export constant enum values for use in code
export const PromotionType = {
    BANNER: 'BANNER',
    POPUP: 'POPUP',
    SLIDER: 'SLIDER'
} as const;

export const DiscountType = {
    PERCENTAGE: 'PERCENTAGE',
    FIXED_AMOUNT: 'FIXED_AMOUNT'
} as const;

export const UserRole = {
    USER: 'USER',
    ADMIN: 'ADMIN'
} as const;
