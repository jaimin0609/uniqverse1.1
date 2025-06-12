"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    User,
    Store,
    CreditCard,
    Bell,
    Shield,
    Save,
    MapPin,
    Phone,
    Mail,
    Globe,
    Building,
    Calendar
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    businessName: z.string().optional(),
    businessDescription: z.string().optional(),
    businessAddress: z.string().optional(),
    businessPhone: z.string().optional(),
    businessWebsite: z.string().optional(),
    taxId: z.string().optional(),
});

const notificationSchema = z.object({
    orderNotifications: z.boolean(),
    lowStockAlerts: z.boolean(),
    paymentNotifications: z.boolean(),
    marketingEmails: z.boolean(),
    weeklyReports: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;

interface VendorProfile {
    id: string;
    name: string;
    email: string;
    businessName?: string;
    businessDescription?: string;
    businessAddress?: string;
    businessPhone?: string;
    businessWebsite?: string;
    taxId?: string;
    createdAt: string;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
}

export default function VendorSettingsPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState<VendorProfile | null>(null);
    const [activeTab, setActiveTab] = useState("profile");

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            email: "",
            businessName: "",
            businessDescription: "",
            businessAddress: "",
            businessPhone: "",
            businessWebsite: "",
            taxId: "",
        },
    });

    const notificationForm = useForm<NotificationFormData>({
        resolver: zodResolver(notificationSchema),
        defaultValues: {
            orderNotifications: true,
            lowStockAlerts: true,
            paymentNotifications: true,
            marketingEmails: false,
            weeklyReports: true,
        },
    });

    // Redirect if not vendor
    useEffect(() => {
        if (!session?.user || session.user.role !== "VENDOR") {
            router.push("/");
            return;
        }
    }, [session, router]);

    // Load vendor profile
    useEffect(() => {
        const fetchProfile = async () => {
            if (!session?.user || session.user.role !== "VENDOR") return;

            try {
                const response = await fetch("/api/vendor/profile");
                if (!response.ok) {
                    throw new Error("Failed to fetch profile");
                }

                const data = await response.json();
                setProfile(data.profile);

                // Update form with fetched data
                profileForm.reset({
                    name: data.profile.name || "",
                    email: data.profile.email || "",
                    businessName: data.profile.businessName || "",
                    businessDescription: data.profile.businessDescription || "",
                    businessAddress: data.profile.businessAddress || "",
                    businessPhone: data.profile.businessPhone || "",
                    businessWebsite: data.profile.businessWebsite || "",
                    taxId: data.profile.taxId || "",
                });

                // Load notification preferences if available
                if (data.notifications) {
                    notificationForm.reset(data.notifications);
                }

            } catch (error) {
                console.error("Error fetching profile:", error);
                toast.error("Failed to load profile data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [session, profileForm, notificationForm]);

    const onProfileSubmit = async (data: ProfileFormData) => {
        setIsSaving(true);
        try {
            const response = await fetch("/api/vendor/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            const result = await response.json();
            setProfile(result.profile);

            // Update session if name changed
            if (data.name !== session?.user?.name) {
                await update({ name: data.name });
            }

            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const onNotificationSubmit = async (data: NotificationFormData) => {
        setIsSaving(true);
        try {
            const response = await fetch("/api/vendor/notifications", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to update notification preferences");
            }

            toast.success("Notification preferences updated");
        } catch (error) {
            console.error("Error updating notifications:", error);
            toast.error("Failed to update notification preferences");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Vendor Settings</h1>
                <p className="text-gray-600">Manage your profile and business settings</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="business" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Business
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Account
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Update your personal details and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...profileForm}>
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter your name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={profileForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email Address *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter your email" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={isSaving}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="business" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Business Information</CardTitle>
                            <CardDescription>
                                Manage your business details and legal information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...profileForm}>
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                    <FormField
                                        control={profileForm.control}
                                        name="businessName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Business Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your business name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={profileForm.control}
                                        name="businessDescription"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Business Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe your business"
                                                        rows={3}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={profileForm.control}
                                        name="businessAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Business Address</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter your business address"
                                                        rows={2}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="businessPhone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Business Phone</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter phone number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={profileForm.control}
                                            name="businessWebsite"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Website</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://yourwebsite.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={profileForm.control}
                                        name="taxId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tax ID / EIN</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your tax ID" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Required for tax reporting and payments
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={isSaving}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>
                                Choose what notifications you want to receive
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...notificationForm}>
                                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                                    <div className="space-y-4">
                                        <FormField
                                            control={notificationForm.control}
                                            name="orderNotifications"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Order Notifications</FormLabel>
                                                        <FormDescription>
                                                            Get notified when you receive new orders
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
                                            control={notificationForm.control}
                                            name="lowStockAlerts"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Low Stock Alerts</FormLabel>
                                                        <FormDescription>
                                                            Get notified when products are running low
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
                                            control={notificationForm.control}
                                            name="paymentNotifications"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Payment Notifications</FormLabel>
                                                        <FormDescription>
                                                            Get notified about payment status updates
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
                                            control={notificationForm.control}
                                            name="weeklyReports"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Weekly Reports</FormLabel>
                                                        <FormDescription>
                                                            Receive weekly sales and performance reports
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
                                            control={notificationForm.control}
                                            name="marketingEmails"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Marketing Emails</FormLabel>
                                                        <FormDescription>
                                                            Receive tips and promotional updates
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

                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={isSaving}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {isSaving ? "Saving..." : "Save Preferences"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="account" className="space-y-6">
                    {profile && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Information</CardTitle>
                                <CardDescription>
                                    View your account details and statistics
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{profile.totalProducts}</div>
                                        <div className="text-sm text-gray-600">Total Products</div>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{profile.totalOrders}</div>
                                        <div className="text-sm text-gray-600">Total Orders</div>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">${profile.totalRevenue.toFixed(2)}</div>
                                        <div className="text-sm text-gray-600">Total Revenue</div>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-sm font-medium">Member Since</div>
                                        <div className="text-sm text-gray-600">
                                            {new Date(profile.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Account Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <User className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <div className="font-medium">{profile.name}</div>
                                                <div className="text-sm text-gray-600">Full Name</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <div className="font-medium">{profile.email}</div>
                                                <div className="text-sm text-gray-600">Email Address</div>
                                            </div>
                                        </div>
                                        {profile.businessName && (
                                            <div className="flex items-center gap-3">
                                                <Building className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <div className="font-medium">{profile.businessName}</div>
                                                    <div className="text-sm text-gray-600">Business Name</div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <div className="font-medium">
                                                    {new Date(profile.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="text-sm text-gray-600">Member Since</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
