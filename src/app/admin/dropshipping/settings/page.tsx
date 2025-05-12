"use client";

import { useState, useEffect } from "react";
import { RotateCw, Save, AlertCircle } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DropshippingSettings {
    autoProcess: boolean;
    autoSendOrders: boolean;
    statusCheckInterval: number;
    defaultShippingDays: number;
    notificationEmail: string;
    profitMargin: number;
    automaticFulfillment: boolean;
    notifyCustomerOnShipment: boolean;
    defaultSupplier: string | null;
    supplierNotes: string;
}

export default function DropshippingSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<DropshippingSettings>({
        autoProcess: true,
        autoSendOrders: false,
        statusCheckInterval: 12,
        defaultShippingDays: 7,
        notificationEmail: "",
        profitMargin: 30,
        automaticFulfillment: true,
        notifyCustomerOnShipment: true,
        defaultSupplier: null,
        supplierNotes: ""
    });
    const [suppliers, setSuppliers] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        fetchSuppliers();
        fetchSettings();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await fetch("/api/admin/suppliers");
            if (!response.ok) {
                throw new Error("Failed to fetch suppliers");
            }
            const data = await response.json();
            setSuppliers(data.suppliers || []);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error("Failed to load suppliers");
        }
    };

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/admin/dropshipping/settings");
            if (!response.ok) {
                throw new Error("Failed to fetch dropshipping settings");
            }
            const data = await response.json();
            setSettings(data.settings);
        } catch (error) {
            console.error("Error fetching dropshipping settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            const response = await fetch("/api/admin/dropshipping/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                throw new Error("Failed to save settings");
            }

            toast.success("Dropshipping settings saved successfully");
        } catch (error) {
            console.error("Error saving dropshipping settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof DropshippingSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center h-[400px]">
                <RotateCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <AdminHeader
                title="Dropshipping Settings"
                description="Configure global dropshipping options and automation"
            />

            <form onSubmit={(e) => {
                e.preventDefault();
                saveSettings();
            }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Automation Settings</CardTitle>
                            <CardDescription>
                                Configure how automatic dropshipping processes work
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="autoProcess">Automatic Order Processing</Label>
                                    <p className="text-sm text-gray-500">
                                        Automatically process dropshipping when orders are placed
                                    </p>
                                </div>
                                <Switch
                                    id="autoProcess"
                                    checked={settings.autoProcess}
                                    onCheckedChange={(value) => handleChange("autoProcess", value)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="autoSendOrders">Automatic Order Sending</Label>
                                    <p className="text-sm text-gray-500">
                                        Automatically send orders to supplier APIs when processing
                                    </p>
                                </div>
                                <Switch
                                    id="autoSendOrders"
                                    checked={settings.autoSendOrders}
                                    onCheckedChange={(value) => handleChange("autoSendOrders", value)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="automaticFulfillment">Automatic Order Fulfillment</Label>
                                    <p className="text-sm text-gray-500">
                                        Mark orders as fulfilled when all items are shipped by suppliers
                                    </p>
                                </div>
                                <Switch
                                    id="automaticFulfillment"
                                    checked={settings.automaticFulfillment}
                                    onCheckedChange={(value) => handleChange("automaticFulfillment", value)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="notifyCustomerOnShipment">Customer Shipping Notifications</Label>
                                    <p className="text-sm text-gray-500">
                                        Send email to customers when suppliers ship their products
                                    </p>
                                </div>
                                <Switch
                                    id="notifyCustomerOnShipment"
                                    checked={settings.notifyCustomerOnShipment}
                                    onCheckedChange={(value) => handleChange("notifyCustomerOnShipment", value)}
                                />
                            </div>

                            <div className="pt-2">
                                <Label htmlFor="statusCheckInterval">Status Check Interval (hours)</Label>
                                <p className="text-sm text-gray-500 mb-2">
                                    How often to check for supplier order status updates
                                </p>
                                <Input
                                    id="statusCheckInterval"
                                    type="number"
                                    min="1"
                                    max="72"
                                    value={settings.statusCheckInterval}
                                    onChange={(e) => handleChange("statusCheckInterval", parseInt(e.target.value))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Default Settings</CardTitle>
                            <CardDescription>
                                Configure default values for dropshipping orders
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="defaultSupplier">Default Supplier</Label>
                                <p className="text-sm text-gray-500 mb-2">
                                    Used for products without a specific supplier
                                </p>
                                <Select
                                    value={settings.defaultSupplier || ""}
                                    onValueChange={(value) => handleChange("defaultSupplier", value || null)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a default supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">No default supplier</SelectItem>
                                        {suppliers.filter(s => s.id).map(supplier => (
                                            <SelectItem key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="defaultShippingDays">Default Shipping Days</Label>
                                <p className="text-sm text-gray-500 mb-2">
                                    Estimated days for shipping when not provided by supplier
                                </p>
                                <Input
                                    id="defaultShippingDays"
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={settings.defaultShippingDays}
                                    onChange={(e) => handleChange("defaultShippingDays", parseInt(e.target.value))}
                                />
                            </div>

                            <div>
                                <Label htmlFor="profitMargin">Default Profit Margin (%)</Label>
                                <p className="text-sm text-gray-500 mb-2">
                                    Default markup percentage for dropshipped products
                                </p>
                                <Input
                                    id="profitMargin"
                                    type="number"
                                    min="0"
                                    max="1000"
                                    value={settings.profitMargin}
                                    onChange={(e) => handleChange("profitMargin", parseInt(e.target.value))}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                        <CardDescription>
                            Configure how you receive notifications about dropshipping
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <Label htmlFor="notificationEmail">Notification Email</Label>
                            <p className="text-sm text-gray-500 mb-2">
                                Email address to receive dropshipping notifications and alerts
                            </p>
                            <Input
                                id="notificationEmail"
                                type="email"
                                value={settings.notificationEmail}
                                onChange={(e) => handleChange("notificationEmail", e.target.value)}
                                placeholder="your-email@example.com"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Default Supplier Notes</CardTitle>
                        <CardDescription>
                            Notes to include with all dropshipping orders sent to suppliers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={settings.supplierNotes}
                            onChange={(e) => handleChange("supplierNotes", e.target.value)}
                            placeholder="Enter any notes you'd like to include with all supplier orders..."
                            rows={4}
                        />
                    </CardContent>
                </Card>

                {settings.autoSendOrders && (
                    <Alert variant="warning" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Automatic Order Sending is Enabled</AlertTitle>
                        <AlertDescription>
                            Orders will be automatically sent to suppliers via their APIs when processed.
                            Make sure all supplier connections are properly configured and tested.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <RotateCw className="mr-2 h-4 w-4 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}