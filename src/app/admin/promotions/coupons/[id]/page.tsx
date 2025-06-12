"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, UseFormProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, CheckIcon, Loader2, Tag } from "lucide-react";
import { cn } from "@/utils/cn";
import { DiscountType } from "@/lib/prisma-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { AdminHeader } from "@/components/admin/admin-header";
import {
    MultiSelect,
    MultiSelectOption,
} from "@/components/admin/multi-select";

const couponSchema = z.object({
    code: z.string().min(1, "Coupon code is required").max(20, "Coupon code must be less than 20 characters"),
    description: z.string().optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).refine(
        (val): val is DiscountType => Object.values(DiscountType).includes(val as DiscountType),
        { message: "Invalid discount type" }
    ),
    discountValue: z.coerce.number().min(0.01, "Discount value must be greater than 0"),
    minimumPurchase: z.coerce.number().min(0).nullable().optional(),
    maximumDiscount: z.coerce.number().min(0).nullable().optional(),
    usageLimit: z.coerce.number().min(1).nullable().optional(),
    startDate: z.date(),
    endDate: z.date(),
    isActive: z.boolean().default(true),
    showOnBanner: z.boolean().default(false),
    productIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
}).refine(data => {
    // Validate percentage is between 0 and 100
    if (data.discountType === "PERCENTAGE" && (data.discountValue < 0 || data.discountValue > 100)) {
        return false;
    }
    return true;
}, {
    message: "Percentage discount must be between 0 and 100",
    path: ["discountValue"],
}).refine(data => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
});

type CouponFormValues = z.infer<typeof couponSchema>;

// Add explicit type for resolvers to avoid TypeScript errors
type FormResolver = Partial<
    UseFormProps<CouponFormValues> & {
        resolver: any;
    }
>;

interface ProductOption {
    id: string;
    name: string;
}

interface CategoryOption {
    id: string;
    name: string;
}

interface CouponProps {
    params: Promise<{
        id?: string;
    }>;
}

export default function CouponForm({ params }: CouponProps) {
    const router = useRouter();
    const [isFetching, setIsFetching] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [couponId, setCouponId] = useState<string | undefined>(undefined);

    const form = useForm<CouponFormValues>({
        resolver: zodResolver(couponSchema) as any,
        defaultValues: {
            code: "",
            description: "",
            discountType: "PERCENTAGE",
            discountValue: 10,
            minimumPurchase: null,
            maximumDiscount: null,
            usageLimit: null,
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            isActive: true,
            showOnBanner: false,
            productIds: [],
            categoryIds: [],
        },
    });

    const isEditing = !!couponId;
    const watchDiscountType = form.watch("discountType"); useEffect(() => {
        // Handle async params
        const handleParams = async () => {
            const resolvedParams = await params;
            setCouponId(resolvedParams.id);
        };
        handleParams();
    }, [params]);

    useEffect(() => {
        fetchProductsAndCategories();

        if (isEditing && couponId) {
            fetchCoupon();
        }
    }, [isEditing, couponId]);

    const fetchProductsAndCategories = async () => {
        try {
            // Fetch products
            const productsResponse = await fetch("/api/products?limit=100");
            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                setProducts(
                    productsData.products.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                    }))
                );
            }            // Fetch categories
            const categoriesResponse = await fetch("/api/categories");
            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                setCategories(
                    (categoriesData.categories || []).map((c: any) => ({
                        id: c.id,
                        name: c.name,
                    }))
                );
            }
        } catch (error) {
            console.error("Error fetching products and categories:", error);
        }
    }; const fetchCoupon = async () => {
        if (!couponId) return;

        try {
            setIsFetching(true);
            const response = await fetch(`/api/coupons/${couponId}`);
            if (response.ok) {
                const data = await response.json();

                // Format the data for the form
                form.reset({
                    ...data,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                    productIds: data.products?.map((p: any) => p.id) || [],
                    categoryIds: data.categories?.map((c: any) => c.id) || [],
                });
            } else {
                console.error("Failed to fetch coupon");
                router.push("/admin/promotions/coupons");
            }
        } catch (error) {
            console.error("Error fetching coupon:", error);
        } finally {
            setIsFetching(false);
        }
    }; const onSubmit = async (values: CouponFormValues) => {
        try {
            setSubmitting(true);

            const url = isEditing && couponId
                ? `/api/coupons/${couponId}`
                : "/api/coupons";

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                router.push("/admin/promotions/coupons");
            } else {
                const error = await response.json();
                console.error("Error saving coupon:", error);
            }
        } catch (error) {
            console.error("Error saving coupon:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (isFetching) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminHeader
                title={isEditing ? "Edit Coupon" : "Create Coupon"}
                description={
                    isEditing
                        ? "Update your coupon details."
                        : "Create a new discount coupon for your customers."
                }
            >
                <Button
                    variant="outline"
                    onClick={() => router.push("/admin/promotions/coupons")}
                >
                    Cancel
                </Button>
            </AdminHeader>

            <div className="bg-white rounded-md border shadow-sm p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control as any}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coupon Code</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                                <Input
                                                    {...field}
                                                    className="pl-10 font-mono uppercase"
                                                    value={field.value.toUpperCase()}
                                                    placeholder="SUMMER20"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            The unique code customers will enter at checkout.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="discountType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Discount Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select discount type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                                <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Choose whether the discount is a percentage or fixed amount.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control as any}
                                name="discountValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {watchDiscountType === "PERCENTAGE"
                                                ? "Discount Percentage"
                                                : "Discount Amount"}
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                {watchDiscountType === "PERCENTAGE" ? (
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        className="pr-8"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                ) : (
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step={0.01}
                                                        className="pl-6"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                )}
                                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                    {watchDiscountType === "PERCENTAGE" ? "%" : ""}
                                                </span>
                                                {watchDiscountType === "FIXED_AMOUNT" && (
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                        $
                                                    </span>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            {watchDiscountType === "PERCENTAGE"
                                                ? "The percentage discount to apply (e.g., 20 for 20%)."
                                                : "The fixed amount to discount (e.g., 10 for $10 off)."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="minimumPurchase"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum Purchase</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                    $
                                                </span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    className="pl-6"
                                                    {...field}
                                                    value={field.value === null ? "" : field.value}
                                                    onChange={(e) => {
                                                        const value = e.target.value === "" ? null : parseFloat(e.target.value);
                                                        field.onChange(value);
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Minimum order amount required (leave empty for no minimum).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="maximumDiscount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Maximum Discount</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                    $
                                                </span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    className="pl-6"
                                                    {...field}
                                                    value={field.value === null ? "" : field.value}
                                                    onChange={(e) => {
                                                        const value = e.target.value === "" ? null : parseFloat(e.target.value);
                                                        field.onChange(value);
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Maximum discount amount (leave empty for no limit).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control as any}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            value={field.value || ""}
                                            placeholder="20% off all summer products"
                                            rows={2}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        A brief description of the coupon for internal reference.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control as any}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Start Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>End Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date <
                                                        new Date(
                                                            form.getValues("startDate") ||
                                                            new Date()
                                                        )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control as any}
                            name="usageLimit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Usage Limit</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            step={1}
                                            {...field}
                                            value={field.value === null ? "" : field.value}
                                            onChange={(e) => {
                                                const value = e.target.value === "" ? null : parseInt(e.target.value);
                                                field.onChange(value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Maximum number of times this coupon can be used (leave empty for unlimited).
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control as any}
                                name="productIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Applicable Products</FormLabel>
                                        <FormControl>
                                            <MultiSelect
                                                options={products.map(p => ({
                                                    value: p.id,
                                                    label: p.name,
                                                }))}
                                                selectedValues={field.value || []}
                                                onChange={field.onChange}
                                                placeholder="Select products..."
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Select products this coupon applies to (leave empty for all products).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="categoryIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Applicable Categories</FormLabel>
                                        <FormControl>
                                            <MultiSelect
                                                options={categories.map(c => ({
                                                    value: c.id,
                                                    label: c.name,
                                                }))}
                                                selectedValues={field.value || []}
                                                onChange={field.onChange}
                                                placeholder="Select categories..."
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Select categories this coupon applies to (leave empty for all categories).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control as any}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active Status</FormLabel>
                                        <FormDescription>
                                            Enable or disable this coupon.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="showOnBanner"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Show on Promotional Banner</FormLabel>
                                        <FormDescription>
                                            Display this coupon code on the promotional banner for easy customer access.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/admin/promotions/coupons")}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isEditing ? "Update Coupon" : "Create Coupon"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
