"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Save, Trash2, AlertCircle, CheckCircle, Shield, Key, Globe, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";

// Define supplier API templates for common platforms
const supplierTemplates = [
    {
        name: "Custom API",
        endpoint: "",
        authType: "api_key",
        description: "Custom API configuration for your specific supplier"
    },
    {
        name: "AliExpress Dropshipping",
        endpoint: "https://api.aliexpress.com/v1/",
        authType: "api_key",
        description: "Connect to AliExpress dropshipping API"
    },
    {
        name: "Oberlo",
        endpoint: "https://api.oberlo.com/v1/",
        authType: "oauth",
        description: "Oberlo dropshipping integration"
    },
    {
        name: "Spocket",
        endpoint: "https://api.spocket.co/v1/",
        authType: "api_key",
        description: "Spocket suppliers integration"
    },
    {
        name: "Modalyst",
        endpoint: "https://api.modalyst.co/v2/",
        authType: "api_key",
        description: "Modalyst dropshipping platform"
    },
    {
        name: "CJDropshipping",
        endpoint: "https://developers.cjdropshipping.com/api2.0/",
        authType: "api_key",
        description: "CJ Dropshipping integration"
    }
];

interface SupplierFormData {
    name: string;
    description: string;
    website: string;
    contactEmail: string;
    contactPhone: string;
    apiKey: string;
    apiEndpoint: string;
    apiSecret?: string;
    apiUsername?: string;
    apiPassword?: string;
    status: string;
    averageShipping: number | string;
    webhookUrl?: string;
    apiHeaderAuth?: string;
}

export default function AddSupplierPage({ params }: { params?: { id: string } }) {
    const router = useRouter();
    const [formData, setFormData] = useState<SupplierFormData>({
        name: "",
        description: "",
        website: "",
        contactEmail: "",
        contactPhone: "",
        apiKey: "",
        apiEndpoint: "",
        apiSecret: "",
        apiUsername: "",
        apiPassword: "",
        status: "ACTIVE",
        averageShipping: "",
        webhookUrl: "",
        apiHeaderAuth: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [connectionTested, setConnectionTested] = useState(false);
    const [connectionSuccess, setConnectionSuccess] = useState(false);
    const [testDetails, setTestDetails] = useState("");
    const [apiAuthType, setApiAuthType] = useState("api_key");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activePlatformTemplate, setActivePlatformTemplate] = useState("custom");

    // Check if we're in edit mode
    useEffect(() => {
        if (params?.id) {
            setEditMode(true);
            fetchSupplierData(params.id);
        }
    }, [params]);

    const fetchSupplierData = async (id: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/suppliers/${id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch supplier data");
            }
            const supplier = await response.json();

            // Set the form data with supplier details
            setFormData({
                name: supplier.name || "",
                description: supplier.description || "",
                website: supplier.website || "",
                contactEmail: supplier.contactEmail || "",
                contactPhone: supplier.contactPhone || "",
                apiKey: supplier.apiKey || "",
                apiEndpoint: supplier.apiEndpoint || "",
                apiSecret: supplier.apiSecret || "",
                apiUsername: supplier.apiUsername || "",
                apiPassword: supplier.apiPassword || "",
                status: supplier.status || "ACTIVE",
                averageShipping: supplier.averageShipping || "",
                webhookUrl: supplier.webhookUrl || "",
                apiHeaderAuth: supplier.apiHeaderAuth || "",
            });

            // Set active template based on endpoint match (or default to custom)
            const matchedTemplate = supplierTemplates.find(
                template => template.endpoint === supplier.apiEndpoint
            );
            setActivePlatformTemplate(matchedTemplate ? matchedTemplate.name : "Custom API");

            // Set API auth type
            if (supplier.apiKey) {
                setApiAuthType("api_key");
            } else if (supplier.apiUsername && supplier.apiPassword) {
                setApiAuthType("basic_auth");
            } else if (supplier.apiHeaderAuth) {
                setApiAuthType("header_auth");
            } else {
                setApiAuthType("none");
            }
        } catch (error) {
            console.error("Error fetching supplier:", error);
            toast.error("Failed to load supplier details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Reset connection test when API details change
        if (name === 'apiKey' || name === 'apiEndpoint' || name === 'apiSecret' ||
            name === 'apiUsername' || name === 'apiPassword' || name === 'apiHeaderAuth') {
            setConnectionTested(false);
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Allow empty string or valid numbers
        if (value === '' || !isNaN(Number(value))) {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleTemplateChange = (templateName: string) => {
        const template = supplierTemplates.find(t => t.name === templateName) || supplierTemplates[0];
        setActivePlatformTemplate(templateName);

        // Update form with template data
        setFormData(prev => ({
            ...prev,
            apiEndpoint: template.endpoint,
        }));

        // Set auth type based on template
        setApiAuthType(template.authType || "api_key");

        // Reset connection test
        setConnectionTested(false);
    };

    const testConnection = async () => {
        setIsLoading(true);
        setConnectionTested(false);
        setTestDetails("");

        try {
            // Create test data based on auth type
            const testData: any = {
                apiEndpoint: formData.apiEndpoint
            };

            switch (apiAuthType) {
                case "api_key":
                    testData.apiKey = formData.apiKey;
                    testData.apiSecret = formData.apiSecret;
                    break;
                case "basic_auth":
                    testData.apiUsername = formData.apiUsername;
                    testData.apiPassword = formData.apiPassword;
                    break;
                case "header_auth":
                    testData.apiHeaderAuth = formData.apiHeaderAuth;
                    break;
            }

            // Send test request to backend
            const response = await fetch("/api/admin/suppliers/test-connection", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(testData),
            });

            const result = await response.json();

            if (result.success) {
                setConnectionSuccess(true);
                setTestDetails(result.message || "Connection successful! API responded properly.");
                toast.success("API connection successful");
            } else {
                setConnectionSuccess(false);
                setTestDetails(result.error || "Connection failed. Please check your API credentials and endpoint.");
                toast.error("API connection failed");
            }
        } catch (error) {
            console.error("Error testing connection:", error);
            setConnectionSuccess(false);
            setTestDetails("An error occurred while testing the connection.");
            toast.error("Error testing connection");
        } finally {
            setConnectionTested(true);
            setIsLoading(false);
        }
    };

    const saveSupplier = async () => {
        // Basic validation
        if (!formData.name.trim()) {
            toast.error("Supplier name is required");
            return;
        }

        setIsSaving(true);
        try {
            const method = editMode ? "PUT" : "POST";
            const url = editMode
                ? `/api/admin/suppliers/${params?.id}`
                : "/api/admin/suppliers";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    averageShipping: formData.averageShipping ? Number(formData.averageShipping) : null,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save supplier");
            }

            toast.success(editMode ? "Supplier updated successfully" : "Supplier added successfully");
            router.push("/admin/suppliers");
        } catch (error) {
            console.error("Error saving supplier:", error);
            toast.error("Failed to save supplier");
        } finally {
            setIsSaving(false);
        }
    };

    const deleteSupplier = async () => {
        if (!editMode || !params?.id) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/suppliers/${params.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete supplier");
            }

            toast.success("Supplier deleted successfully");
            router.push("/admin/suppliers");
        } catch (error) {
            console.error("Error deleting supplier:", error);
            toast.error("Failed to delete supplier");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <AdminHeader
                title={editMode ? "Edit Supplier" : "Add Supplier"}
                description={editMode ? "Update supplier details and API connection" : "Add a new dropshipping supplier"}
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/admin/suppliers")}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        {editMode && (
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isDeleting || isSaving || isLoading}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        )}
                        <Button
                            onClick={saveSupplier}
                            disabled={isSaving || isLoading}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving..." : "Save Supplier"}
                        </Button>
                    </div>
                }
            />

            {isLoading && !editMode ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
            ) : (
                <Tabs defaultValue="general">
                    <TabsList className="mb-6">
                        <TabsTrigger value="general">General Information</TabsTrigger>
                        <TabsTrigger value="api">API Connection</TabsTrigger>
                        <TabsTrigger value="shipping">Shipping Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <Card>
                            <CardHeader>
                                <CardTitle>Supplier Details</CardTitle>
                                <CardDescription>
                                    Basic information about the supplier
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Supplier Name *</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter supplier name"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) =>
                                                setFormData(prev => ({ ...prev, status: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Active</SelectItem>
                                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input
                                            id="website"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleInputChange}
                                            placeholder="https://supplier-website.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contactEmail">Contact Email</Label>
                                        <Input
                                            id="contactEmail"
                                            name="contactEmail"
                                            type="email"
                                            value={formData.contactEmail}
                                            onChange={handleInputChange}
                                            placeholder="contact@supplier.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contactPhone">Contact Phone</Label>
                                        <Input
                                            id="contactPhone"
                                            name="contactPhone"
                                            value={formData.contactPhone}
                                            onChange={handleInputChange}
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe this supplier and their products..."
                                        rows={4}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="api">
                        <Card>
                            <CardHeader>
                                <CardTitle>API Connection</CardTitle>
                                <CardDescription>
                                    Configure the connection to the supplier's API for automated ordering
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <Label>Platform Template</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {supplierTemplates.map((template) => (
                                            <div
                                                key={template.name}
                                                className={`border rounded-lg p-4 cursor-pointer transition-colors ${activePlatformTemplate === template.name
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'hover:border-gray-300'
                                                    }`}
                                                onClick={() => handleTemplateChange(template.name)}
                                            >
                                                <div className="font-medium mb-1">{template.name}</div>
                                                <div className="text-sm text-gray-500">{template.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="apiEndpoint">API Endpoint URL</Label>
                                    <div className="flex">
                                        <div className="flex-grow">
                                            <Input
                                                id="apiEndpoint"
                                                name="apiEndpoint"
                                                value={formData.apiEndpoint}
                                                onChange={handleInputChange}
                                                placeholder="https://api.supplier.com/v1/"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        The base URL for the supplier's API
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label>Authentication Method</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div
                                            className={`border rounded-lg p-3 cursor-pointer flex items-start ${apiAuthType === 'api_key' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                                                }`}
                                            onClick={() => setApiAuthType('api_key')}
                                        >
                                            <Key className="h-5 w-5 mr-2 mt-0.5 text-gray-700" />
                                            <div>
                                                <div className="font-medium">API Key</div>
                                                <div className="text-xs text-gray-500">
                                                    Authentication using an API key and optional secret
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`border rounded-lg p-3 cursor-pointer flex items-start ${apiAuthType === 'basic_auth' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                                                }`}
                                            onClick={() => setApiAuthType('basic_auth')}
                                        >
                                            <Shield className="h-5 w-5 mr-2 mt-0.5 text-gray-700" />
                                            <div>
                                                <div className="font-medium">Basic Auth</div>
                                                <div className="text-xs text-gray-500">
                                                    Username and password authentication
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`border rounded-lg p-3 cursor-pointer flex items-start ${apiAuthType === 'header_auth' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                                                }`}
                                            onClick={() => setApiAuthType('header_auth')}
                                        >
                                            <Database className="h-5 w-5 mr-2 mt-0.5 text-gray-700" />
                                            <div>
                                                <div className="font-medium">Header Authentication</div>
                                                <div className="text-xs text-gray-500">
                                                    Custom header authentication value
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {apiAuthType === 'api_key' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="apiKey">API Key</Label>
                                            <Input
                                                id="apiKey"
                                                name="apiKey"
                                                value={formData.apiKey}
                                                onChange={handleInputChange}
                                                placeholder="Enter API key"
                                                type="password"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="apiSecret">API Secret (Optional)</Label>
                                            <Input
                                                id="apiSecret"
                                                name="apiSecret"
                                                value={formData.apiSecret || ""}
                                                onChange={handleInputChange}
                                                placeholder="Enter API secret"
                                                type="password"
                                            />
                                        </div>
                                    </div>
                                )}

                                {apiAuthType === 'basic_auth' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="apiUsername">Username</Label>
                                            <Input
                                                id="apiUsername"
                                                name="apiUsername"
                                                value={formData.apiUsername || ""}
                                                onChange={handleInputChange}
                                                placeholder="Enter username"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="apiPassword">Password</Label>
                                            <Input
                                                id="apiPassword"
                                                name="apiPassword"
                                                value={formData.apiPassword || ""}
                                                onChange={handleInputChange}
                                                placeholder="Enter password"
                                                type="password"
                                            />
                                        </div>
                                    </div>
                                )}

                                {apiAuthType === 'header_auth' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="apiHeaderAuth">Authorization Header Value</Label>
                                        <Input
                                            id="apiHeaderAuth"
                                            name="apiHeaderAuth"
                                            value={formData.apiHeaderAuth || ""}
                                            onChange={handleInputChange}
                                            placeholder="Bearer token or other header value"
                                        />
                                        <p className="text-sm text-gray-500">
                                            Will be sent as "Authorization" header
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                                    <Input
                                        id="webhookUrl"
                                        name="webhookUrl"
                                        value={formData.webhookUrl || ""}
                                        onChange={handleInputChange}
                                        placeholder="https://yourdomain.com/api/webhooks/supplier"
                                    />
                                    <p className="text-sm text-gray-500">
                                        URL to receive webhook notifications from this supplier
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        onClick={testConnection}
                                        disabled={
                                            isLoading ||
                                            !formData.apiEndpoint ||
                                            (apiAuthType === 'api_key' && !formData.apiKey) ||
                                            (apiAuthType === 'basic_auth' && (!formData.apiUsername || !formData.apiPassword)) ||
                                            (apiAuthType === 'header_auth' && !formData.apiHeaderAuth)
                                        }
                                        variant="outline"
                                    >
                                        Test Connection
                                    </Button>

                                    {connectionTested && (
                                        <div className={`mt-4 p-4 rounded-md ${connectionSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
                                            <div className="flex items-center mb-2">
                                                {connectionSuccess ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                                ) : (
                                                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                                )}
                                                <span className={`font-medium ${connectionSuccess ? 'text-green-700' : 'text-red-700'}`}>
                                                    {connectionSuccess ? 'Connection Successful' : 'Connection Failed'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">{testDetails}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="shipping">
                        <Card>
                            <CardHeader>
                                <CardTitle>Shipping Settings</CardTitle>
                                <CardDescription>
                                    Configure shipping preferences for this supplier
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="averageShipping">
                                        Average Shipping Time (Days)
                                    </Label>
                                    <Input
                                        id="averageShipping"
                                        name="averageShipping"
                                        type="number"
                                        min="0"
                                        value={formData.averageShipping}
                                        onChange={handleNumberChange}
                                        placeholder="E.g., 7"
                                    />
                                    <p className="text-sm text-gray-500">
                                        The average time it takes for this supplier to ship products
                                    </p>
                                </div>

                                {/* Additional shipping settings can be added here */}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Supplier</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this supplier? This action cannot be undone.
                            Products associated with this supplier will remain but will no longer be linked to the supplier.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteSupplier} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Delete Supplier"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}