"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, UseFormProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/utils/cn";

// Form validation schema
const eventFormSchema = z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    description: z.string().optional(),
    imageUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    videoUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    contentType: z.enum(["image", "video"]),
    textOverlay: z.string().optional(),
    textPosition: z.string().default("center"),
    textColor: z.string().default("#FFFFFF"),
    textSize: z.string().default("text-2xl"),
    textShadow: z.boolean().default(false),
    backgroundColor: z.string().optional().or(z.literal("")),
    opacity: z.number().min(0).max(100).default(100),
    effectType: z.enum(["none", "fade", "zoom", "slide"]).default("none"),
    linkUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    startDate: z.date(),
    endDate: z.date(),
    isActive: z.boolean().default(true),
    position: z.number().int().min(0).default(0),
});

export default function NewEventPage() {
    const router = useRouter();
    const [previewUrl, setPreviewUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);    // Extract the form schema type
    type EventFormValues = z.infer<typeof eventFormSchema>;

    // Add explicit type for form resolver to avoid TypeScript errors
    type FormResolver = Partial<
        UseFormProps<EventFormValues> & {
            resolver: any;
        }
    >;

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            imageUrl: "",
            videoUrl: "",
            contentType: "image",
            textOverlay: "",
            textPosition: "center",
            textColor: "#FFFFFF",
            textSize: "text-2xl",
            textShadow: false,
            backgroundColor: "",
            opacity: 100,
            effectType: "none",
            linkUrl: "",
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Default to 30 days
            isActive: true,
            position: 0,
        },
    });

    const contentType = form.watch("contentType");
    const imageUrl = form.watch("imageUrl");
    const videoUrl = form.watch("videoUrl");
    const textColor = form.watch("textColor");
    const textPosition = form.watch("textPosition");
    const opacity = form.watch("opacity");
    const textShadow = form.watch("textShadow");
    const textSize = form.watch("textSize");
    const backgroundColor = form.watch("backgroundColor");

    // Update preview URL when image or video URL changes
    useState(() => {
        if (contentType === "image" && imageUrl) {
            setPreviewUrl(imageUrl);
        } else if (contentType === "video" && videoUrl) {
            setPreviewUrl(videoUrl);
        } else {
            setPreviewUrl("");
        }
    });

    // Helper function to get text position class
    const getTextPositionClass = (position: string) => {
        switch (position) {
            case "top-left":
                return "items-start justify-start text-left";
            case "top-center":
                return "items-start justify-center text-center";
            case "top-right":
                return "items-start justify-end text-right";
            case "center-left":
                return "items-center justify-start text-left";
            case "center":
                return "items-center justify-center text-center";
            case "center-right":
                return "items-center justify-end text-right";
            case "bottom-left":
                return "items-end justify-start text-left";
            case "bottom-center":
                return "items-end justify-center text-center";
            case "bottom-right":
                return "items-end justify-end text-right";
            default:
                return "items-center justify-center text-center";
        }
    };

    // Form submission handler
    async function onSubmit(values: z.infer<typeof eventFormSchema>) {
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/events", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to create event");
            }

            toast.success("Event created successfully");
            router.push("/admin/events");
            router.refresh();
        } catch (error) {
            console.error("Error creating event:", error);
            toast.error("Failed to create event");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Create New Event</h1>
                <p className="text-gray-600">Create a new showcase event for the homepage</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <h2 className="text-xl font-semibold border-b pb-2">Basic Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter event title" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="position"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Position (Order)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        placeholder="Display order"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Lower numbers display first
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter event description"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
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
                                                                    "w-full pl-3 text-left font-normal",
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
                                        control={form.control}
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
                                                                    "w-full pl-3 text-left font-normal",
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
                                </div>

                                <h2 className="text-xl font-semibold border-b pb-2 mt-8">Content Settings</h2>
                                <FormField
                                    control={form.control}
                                    name="contentType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Content Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select content type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="image">Image</SelectItem>
                                                    <SelectItem value="video">Video</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {contentType === "image" ? (
                                    <FormField
                                        control={form.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Image URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://example.com/image.jpg" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Use a high-quality image (recommended size: 1920x1080px)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="videoUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Video URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://example.com/video.mp4" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Use a direct link to an MP4 video file
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="backgroundColor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Background Color (optional)</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input placeholder="#000000" {...field} />
                                                </FormControl>
                                                <Input
                                                    type="color"
                                                    value={field.value || "#000000"}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    className="w-12 p-1 h-10"
                                                />
                                            </div>
                                            <FormDescription>
                                                Used as fallback if no image/video is provided
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="opacity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Content Opacity: {field.value}%</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    value={[field.value]}
                                                    min={0}
                                                    max={100}
                                                    step={5}
                                                    onValueChange={(values) => field.onChange(values[0])}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="effectType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Effect Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select effect type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="fade">Fade</SelectItem>
                                                    <SelectItem value="zoom">Zoom</SelectItem>
                                                    <SelectItem value="slide">Slide</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <h2 className="text-xl font-semibold border-b pb-2 mt-8">Text Overlay</h2>
                                <FormField
                                    control={form.control}
                                    name="textOverlay"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Text Overlay</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter text to display over the image/video"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="textPosition"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Text Position</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select text position" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="top-left">Top Left</SelectItem>
                                                        <SelectItem value="top-center">Top Center</SelectItem>
                                                        <SelectItem value="top-right">Top Right</SelectItem>
                                                        <SelectItem value="center-left">Center Left</SelectItem>
                                                        <SelectItem value="center">Center</SelectItem>
                                                        <SelectItem value="center-right">Center Right</SelectItem>
                                                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                                        <SelectItem value="bottom-center">Bottom Center</SelectItem>
                                                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="textSize"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Text Size</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select text size" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="text-sm">Small</SelectItem>
                                                        <SelectItem value="text-base">Medium</SelectItem>
                                                        <SelectItem value="text-lg">Large</SelectItem>
                                                        <SelectItem value="text-xl">Extra Large</SelectItem>
                                                        <SelectItem value="text-2xl">2XL</SelectItem>
                                                        <SelectItem value="text-3xl">3XL</SelectItem>
                                                        <SelectItem value="text-4xl">4XL</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="textColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Text Color</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input placeholder="#FFFFFF" {...field} />
                                                    </FormControl>
                                                    <Input
                                                        type="color"
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(e.target.value)}
                                                        className="w-12 p-1 h-10"
                                                    />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="textShadow"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Text Shadow</FormLabel>
                                                    <FormDescription>
                                                        Add shadow to make text more readable
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
                                </div>

                                <FormField
                                    control={form.control}
                                    name="linkUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Link URL (optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://example.com/page" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Where users will go when clicking the event
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <h2 className="text-xl font-semibold border-b pb-2 mt-8">Publishing</h2>
                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    Active Status
                                                </FormLabel>
                                                <FormDescription>
                                                    Enable or disable this event
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

                                <div className="pt-4 flex justify-end space-x-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push('/admin/events')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Creating..." : "Create Event"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md sticky top-6">
                        <h2 className="text-xl font-semibold mb-4">Preview</h2>

                        <div className="border rounded-lg overflow-hidden">
                            <div className="relative h-64 w-full bg-gray-100">
                                {backgroundColor && (
                                    <div
                                        className="absolute inset-0"
                                        style={{ backgroundColor, opacity: opacity / 100 }}
                                    />
                                )}

                                {contentType === "image" && imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        style={{ opacity: opacity / 100 }}
                                    />
                                ) : contentType === "video" && videoUrl ? (
                                    <video
                                        src={videoUrl}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        style={{ opacity: opacity / 100 }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        {contentType === "image" ? "Image preview" : "Video preview"}
                                    </div>
                                )}

                                {/* Text overlay */}
                                <div
                                    className={cn(
                                        "absolute inset-0 flex p-4",
                                        getTextPositionClass(textPosition)
                                    )}
                                >
                                    {form.watch("textOverlay") && (
                                        <div
                                            className={cn(
                                                "max-w-full px-3 py-2 rounded",
                                                textSize,
                                                textShadow ? "text-shadow" : ""
                                            )}
                                            style={{ color: textColor }}
                                        >
                                            {form.watch("textOverlay")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4 text-sm">
                            <h3 className="font-medium">Tips for best results:</h3>
                            <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                <li>Use high-quality images with 16:9 aspect ratio</li>
                                <li>Ensure good contrast between text and background</li>
                                <li>Keep text brief and easy to read</li>
                                <li>Test different positions and effects</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
