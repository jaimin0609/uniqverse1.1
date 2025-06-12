"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    PlusCircle,
    Trash2,
    Edit,
    Eye,
    EyeOff,
    ChevronDown,
    Filter,
    SlidersHorizontal,
    Tag,
    Clock,
} from "lucide-react";
import { DiscountType } from "@/lib/prisma-types";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminLoading } from "@/components/admin/admin-loading";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { formatCurrency } from "@/utils/format";

interface Coupon {
    id: string;
    code: string;
    description: string | null;
    discountType: DiscountType;
    discountValue: number;
    minimumPurchase: number | null;
    maximumDiscount: number | null;
    usageLimit: number | null;
    usageCount: number;
    isActive: boolean;
    showOnBanner: boolean;
    startDate: string;
    endDate: string;
    createdAt: string;
    _count?: {
        couponUsages: number;
    };
}

export default function CouponsPage() {
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/coupons");
            if (response.ok) {
                const data = await response.json();
                setCoupons(data);
            } else {
                console.error("Failed to fetch coupons");
            }
        } catch (error) {
            console.error("Error fetching coupons:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
        try {
            const coupon = coupons.find(c => c.id === id);
            if (!coupon) return;

            const response = await fetch(`/api/coupons/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...coupon,
                    isActive: !currentStatus,
                }),
            });

            if (response.ok) {
                // Update the local state
                setCoupons(
                    coupons.map(c =>
                        c.id === id ? { ...c, isActive: !currentStatus } : c
                    )
                );
            }
        } catch (error) {
            console.error("Error updating coupon status:", error);
        }
    };

    const deleteCoupon = async (id: string) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;

        try {
            const response = await fetch(`/api/coupons/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                // Remove from local state
                setCoupons(coupons.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error("Error deleting coupon:", error);
        }
    };

    // Check if a coupon is active based on dates and isActive flag
    const isCouponActive = (coupon: Coupon) => {
        if (!coupon.isActive) return false;

        const now = new Date();
        const startDate = new Date(coupon.startDate);
        const endDate = new Date(coupon.endDate);

        return now >= startDate && now <= endDate;
    };

    // Format the discount value
    const formatDiscount = (coupon: Coupon) => {
        if (coupon.discountType === "PERCENTAGE") {
            return `${coupon.discountValue}%`;
        } else {
            return formatCurrency(coupon.discountValue);
        }
    };

    // Check if a coupon has reached its usage limit
    const hasReachedLimit = (coupon: Coupon) => {
        return coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit;
    };

    return (
        <div className="space-y-6">
            <AdminHeader
                title="Coupon Management"
                description="Create and manage discount coupons for your store."
            >
                <Button onClick={() => router.push("/admin/promotions/coupons/new")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Coupon
                </Button>
            </AdminHeader>

            <div className="space-y-4">
                {isLoading ? (
                    <AdminLoading />
                ) : coupons.length === 0 ? (
                    <AdminEmptyState
                        title="No coupons yet"
                        description="Create your first coupon to offer discounts to your customers."
                        action={
                            <Button onClick={() => router.push("/admin/promotions/coupons/new")}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Create Coupon
                            </Button>
                        }
                    />
                ) : (
                    <div className="bg-white rounded-md border shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Valid Period</TableHead>
                                    <TableHead>Usage</TableHead>
                                    <TableHead>Banner</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coupons.map((coupon) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <div className="flex items-center">
                                                    <Tag className="h-4 w-4 mr-2 text-blue-500" />
                                                    <span className="font-mono font-bold">{coupon.code}</span>
                                                </div>
                                                {coupon.description && (
                                                    <span className="text-sm text-gray-500 mt-1">
                                                        {coupon.description}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{formatDiscount(coupon)}</span>
                                                {coupon.minimumPurchase && (
                                                    <span className="text-xs text-gray-500">
                                                        Min: {formatCurrency(coupon.minimumPurchase)}
                                                    </span>
                                                )}
                                                {coupon.maximumDiscount && (
                                                    <span className="text-xs text-gray-500">
                                                        Max: {formatCurrency(coupon.maximumDiscount)}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                                <div className="text-sm">
                                                    <div>{format(new Date(coupon.startDate), "MMM dd, yyyy")}</div>
                                                    <div className="text-gray-500">to {format(new Date(coupon.endDate), "MMM dd, yyyy")}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{coupon.usageCount} used</span>                                                {coupon.usageLimit && (
                                                    <span className="text-xs text-gray-500">
                                                        Limit: {coupon.usageLimit}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {coupon.showOnBanner ? (
                                                <Badge variant="default" className="bg-purple-100 text-purple-800">
                                                    On Banner
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-500">
                                                    Hidden
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {hasReachedLimit(coupon) ? (
                                                <Badge variant="destructive">Limit Reached</Badge>
                                            ) : isCouponActive(coupon) ? (
                                                <Badge variant="success">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <SlidersHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(`/admin/promotions/coupons/${coupon.id}`)}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => toggleCouponStatus(coupon.id, coupon.isActive)}
                                                    >
                                                        {coupon.isActive ? (
                                                            <>
                                                                <EyeOff className="h-4 w-4 mr-2" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => deleteCoupon(coupon.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
