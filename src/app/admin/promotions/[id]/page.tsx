"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, UseFormProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, CheckIcon, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { PromotionType } from "@/lib/prisma-types";
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
import { MediaUploader } from "@/components/admin/media-uploader";

const promotionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    type: z.enum(["BANNER", "POPUP", "SLIDER"]).refine(
        (val): val is PromotionType => Object.values(PromotionType).includes(val as PromotionType),
        { message: "Invalid promotion type" }
    ),
    imageUrl: z.string().optional().nullable(),
    videoUrl: z.string().optional().nullable(),
    linkUrl: z.string().optional().nullable(),
    position: z.coerce.number().min(0),
    startDate: z.date(),
    endDate: z.date(),
    isActive: z.boolean(),
}).refine(data => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
});

type PromotionFormValues = z.infer<typeof promotionSchema>;

// Add explicit type for resolvers to avoid TypeScript errors
type FormResolver = Partial<
    UseFormProps<PromotionFormValues> & {
        resolver: any;
    }
>;

interface PromotionProps {
    params: {
        id?: string;
    };
}

export default function PromotionForm({ params }: PromotionProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<PromotionFormValues>({
        resolver: zodResolver(promotionSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            type: "BANNER",
            imageUrl: null,
            videoUrl: null,
            linkUrl: null,
            position: 0,
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            isActive: true,
        },
    });

    const isEditing = !!params.id;

    useEffect(() => {
        if (isEditing) {
            fetchPromotion();
        }
    }, [isEditing]);

    const fetchPromotion = async () => {
        try {
            setIsFetching(true);
            const response = await fetch(`/api/promotions/${params.id}`);
            if (response.ok) {
                const data = await response.json();

                // Format the data for the form
                form.reset({
                    ...data,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                });
            } else {
                console.error("Failed to fetch promotion");
                router.push("/admin/promotions");
            }
        } catch (error) {
            console.error("Error fetching promotion:", error);
        } finally {
            setIsFetching(false);
        }
    };

    const onSubmit = async (values: PromotionFormValues) => {
        try {
            setSubmitting(true);

            const url = isEditing
                ? `/api/promotions/${params.id}`
                : "/api/promotions";

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                router.push("/admin/promotions");
            } else {
                const error = await response.json();
                console.error("Error saving promotion:", error);
            }
        } catch (error) {
            console.error("Error saving promotion:", error);
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
                title={isEditing ? "Edit Promotion" : "Create Promotion"}
                description={
                    isEditing
                        ? "Update your promotion details."
                        : "Create a new promotional campaign to engage customers."
                }
            >
                <Button
                    variant="outline"
                    onClick={() => router.push("/admin/promotions")}
                >
                    Cancel
                </Button>
            </AdminHeader>            <div className="bg-white rounded-md border shadow-sm p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control as any}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Summer Sale" />
                                        </FormControl>
                                        <FormDescription>
                                            The title of your promotion.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Promotion Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a promotion type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="BANNER">Banner</SelectItem>
                                                <SelectItem value="SLIDER">Slider</SelectItem>
                                                <SelectItem value="POPUP">Popup</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            How this promotion will be displayed.
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
                                            placeholder="Get 20% off on all summer products!"
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        A brief description of the promotion.
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
                                                    disabled={(date) =>
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
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
                                                            new Date().setHours(0, 0, 0, 0)
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control as any}
                                name="position"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display Position</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Order in which this promotion appears (0 = highest priority).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="linkUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Link URL</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value || ""}
                                                placeholder="https://example.com/summer-sale"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Where users will be directed when clicking the promotion (optional).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control as any}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Promotion Image</FormLabel>
                                    <FormControl>
                                        <MediaUploader
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            accept="image/*"
                                            maxFiles={1}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Upload an image for your promotion (recommended size: 1200×600px).
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="videoUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Promotion Video URL</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            value={field.value || ""}
                                            placeholder="https://example.com/videos/summer-sale.mp4"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        URL to a video for your promotion (optional).
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active Status</FormLabel>
                                        <FormDescription>
                                            Enable or disable this promotion.
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
                                onClick={() => router.push("/admin/promotions")}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isEditing ? "Update Promotion" : "Create Promotion"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
