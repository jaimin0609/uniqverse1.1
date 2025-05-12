"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { PromotionType } from "@/lib/prisma-types";
import {
    PlusCircle,
    Trash2,
    Edit,
    Eye,
    EyeOff,
    ChevronDown,
    Filter,
    SlidersHorizontal,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminLoading } from "@/components/admin/admin-loading";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { truncate } from "@/utils/format";

interface Promotion {
    id: string;
    title: string;
    description: string | null;
    type: PromotionType;
    imageUrl: string | null;
    videoUrl: string | null;
    linkUrl: string | null;
    position: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
}

export default function PromotionsPage() {
    const router = useRouter();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/promotions");
            if (response.ok) {
                const data = await response.json();
                setPromotions(data);
            } else {
                console.error("Failed to fetch promotions");
            }
        } catch (error) {
            console.error("Error fetching promotions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePromotionStatus = async (id: string, currentStatus: boolean) => {
        try {
            const promotion = promotions.find(p => p.id === id);
            if (!promotion) return;

            const response = await fetch(`/api/promotions/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...promotion,
                    isActive: !currentStatus,
                }),
            });

            if (response.ok) {
                // Update the local state
                setPromotions(
                    promotions.map(p =>
                        p.id === id ? { ...p, isActive: !currentStatus } : p
                    )
                );
            }
        } catch (error) {
            console.error("Error updating promotion status:", error);
        }
    };

    const deletePromotion = async (id: string) => {
        if (!confirm("Are you sure you want to delete this promotion?")) return;

        try {
            const response = await fetch(`/api/promotions/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                // Remove from local state
                setPromotions(promotions.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error("Error deleting promotion:", error);
        }
    };

    // Check if a promotion is active based on dates and isActive flag
    const isPromotionActive = (promotion: Promotion) => {
        if (!promotion.isActive) return false;

        const now = new Date();
        const startDate = new Date(promotion.startDate);
        const endDate = new Date(promotion.endDate);

        return now >= startDate && now <= endDate;
    };

    return (
        <div className="space-y-6">
            <AdminHeader
                title="Promotions Management"
                description="Create and manage your promotional banners, sliders, and coupons."
            >
                <Button onClick={() => router.push("/admin/promotions/new")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Promotion
                </Button>
            </AdminHeader>

            <Tabs defaultValue="promotions" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="promotions">Promotions</TabsTrigger>
                    <TabsTrigger value="coupons">Coupons</TabsTrigger>
                </TabsList>

                <TabsContent value="promotions" className="space-y-4">
                    {isLoading ? (
                        <AdminLoading />
                    ) : promotions.length === 0 ? (
                        <AdminEmptyState
                            title="No promotions yet"
                            description="Create your first promotional campaign to engage customers and drive sales."
                            action={
                                <Button onClick={() => router.push("/admin/promotions/new")}>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Create Promotion
                                </Button>
                            }
                        />
                    ) : (
                        <div className="bg-white rounded-md border shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {promotions.map((promotion) => (
                                        <TableRow key={promotion.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{truncate(promotion.title, 30)}</span>
                                                    {promotion.description && (
                                                        <span className="text-sm text-gray-500">
                                                            {truncate(promotion.description, 40)}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        promotion.type === "BANNER"
                                                            ? "default"
                                                            : promotion.type === "SLIDER"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                >
                                                    {promotion.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(promotion.startDate), "MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(promotion.endDate), "MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                {isPromotionActive(promotion) ? (
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
                                                            onClick={() => router.push(`/admin/promotions/${promotion.id}`)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => togglePromotionStatus(promotion.id, promotion.isActive)}
                                                        >
                                                            {promotion.isActive ? (
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
                                                            onClick={() => deletePromotion(promotion.id)}
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
                </TabsContent>

                <TabsContent value="coupons">
                    <div className="p-4 text-center">
                        <Button onClick={() => router.push("/admin/promotions/coupons")}>
                            Manage Coupons
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
