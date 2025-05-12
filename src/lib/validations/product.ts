import * as z from "zod";

export const productSchema = z.object({
    name: z.string().min(2, { message: "Product name must be at least 2 characters" }),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
    price: z.coerce
        .number()
        .min(0.01, { message: "Price must be greater than 0" })
        .refine((val) => !isNaN(val), { message: "Price must be a valid number" }),
    compareAtPrice: z.coerce
        .number()
        .min(0, { message: "Compare at price must be greater than or equal to 0" })
        .refine((val) => !isNaN(val), { message: "Compare at price must be a valid number" })
        .nullable()
        .optional(),
    stock: z.coerce
        .number()
        .int({ message: "Stock must be a whole number" })
        .min(0, { message: "Stock must be greater than or equal to 0" })
        .refine((val) => !isNaN(val), { message: "Stock must be a valid number" }),
    categoryId: z.string().min(1, { message: "Please select a category" }),
    images: z.array(z.string()).min(1, { message: "At least one product image is required" }),
    isFeatured: z.boolean().default(false),
    isCustomizable: z.boolean().default(false),
});

export const productVariantSchema = z.object({
    name: z.string().min(1, { message: "Variant name is required" }),
    sku: z.string().optional(),
    price: z.coerce
        .number()
        .min(0.01, { message: "Price must be greater than 0" })
        .refine((val) => !isNaN(val), { message: "Price must be a valid number" }),
    compareAtPrice: z.coerce
        .number()
        .min(0, { message: "Compare at price must be greater than or equal to 0" })
        .refine((val) => !isNaN(val), { message: "Compare at price must be a valid number" })
        .nullable()
        .optional(),
    stock: z.coerce
        .number()
        .int({ message: "Stock must be a whole number" })
        .min(0, { message: "Stock must be greater than or equal to 0" })
        .refine((val) => !isNaN(val), { message: "Stock must be a valid number" }),
    options: z.array(
        z.object({
            name: z.string().min(1, { message: "Option name is required" }),
            value: z.string().min(1, { message: "Option value is required" }),
        })
    ),
});

export const categorySchema = z.object({
    name: z.string().min(2, { message: "Category name must be at least 2 characters" }),
    description: z.string().optional(),
    parentId: z.string().optional(),
    image: z.string().optional(),
});

export const productFormSchema = z.object({
    name: z
        .string()
        .min(3, "Product name must be at least 3 characters")
        .max(100, "Product name must be less than 100 characters"),
    slug: z
        .string()
        .optional()
        .refine(
            (value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
            {
                message: "Slug can only contain lowercase letters, numbers, and hyphens",
            }
        ),
    description: z
        .string()
        .min(10, "Description must be at least 10 characters"),
    price: z
        .number()
        .min(0, "Price must be a positive number")
        .or(z.string().regex(/^\d*\.?\d*$/).transform(Number)),
    compareAtPrice: z
        .number()
        .min(0, "Compare at price must be a positive number")
        .nullable()
        .optional()
        .or(
            z.string()
                .regex(/^\d*\.?\d*$/)
                .transform((val) => (val === "" ? null : Number(val)))
        ),
    inventory: z
        .number()
        .int("Inventory must be a whole number")
        .min(0, "Inventory must be a non-negative number")
        .or(z.string().regex(/^\d+$/).transform(Number)),
    images: z
        .array(z.string())
        .min(1, "At least one product image is required"),
    categoryId: z
        .string()
        .min(1, "Category is required"),
    isPublished: z
        .boolean()
        .default(true),
    isFeatured: z
        .boolean()
        .default(false),
    variants: z
        .record(z.array(z.string()))
        .optional()
});

export type ProductFormValues = z.infer<typeof productFormSchema>;