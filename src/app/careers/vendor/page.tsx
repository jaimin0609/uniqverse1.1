"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import {
    Store,
    User,
    Building,
    FileText,
    Send,
    CheckCircle,
    ArrowLeft
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const vendorApplicationSchema = z.object({
    businessName: z.string().min(1, "Business name is required"),
    businessType: z.string().min(1, "Business type is required"),
    businessDescription: z.string().min(50, "Description must be at least 50 characters"),
    businessAddress: z.string().min(1, "Business address is required"),
    businessPhone: z.string().min(10, "Valid phone number is required"),
    businessWebsite: z.string().url("Valid website URL is required").optional().or(z.literal("")),
    taxId: z.string().min(1, "Tax ID is required"),
    bankAccount: z.string().min(1, "Bank account information is required"),
    expectedMonthlyVolume: z.string().min(1, "Expected monthly volume is required"),
    productCategories: z.array(z.string()).min(1, "Select at least one product category"),
    hasBusinessLicense: z.boolean().refine(val => val === true, "Business license is required"),
    agreesToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
    agreeToCommission: z.boolean().refine(val => val === true, "You must agree to the commission structure"),
});

type VendorApplicationData = z.infer<typeof vendorApplicationSchema>;

const businessTypes = [
    "Sole Proprietorship",
    "Partnership",
    "LLC",
    "Corporation",
    "Non-Profit",
    "Other"
];

const productCategories = [
    "Electronics",
    "Clothing & Fashion",
    "Home & Garden",
    "Health & Beauty",
    "Sports & Outdoors",
    "Books & Media",
    "Toys & Games",
    "Automotive",
    "Food & Beverages",
    "Handmade & Crafts",
    "Other"
];

const volumeOptions = [
    "Under $1,000",
    "$1,000 - $5,000",
    "$5,000 - $25,000",
    "$25,000 - $100,000",
    "Over $100,000"
];

export default function VendorApplicationPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [existingApplication, setExistingApplication] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const form = useForm<VendorApplicationData>({
        resolver: zodResolver(vendorApplicationSchema),
        defaultValues: {
            businessName: "",
            businessType: "",
            businessDescription: "",
            businessAddress: "",
            businessPhone: "",
            businessWebsite: "",
            taxId: "",
            bankAccount: "",
            expectedMonthlyVolume: "",
            productCategories: [],
            hasBusinessLicense: false,
            agreesToTerms: false,
            agreeToCommission: false,
        },
    });

    useEffect(() => {
        if (session?.user) {
            checkExistingApplication();
        } else {
            setLoading(false);
        }
    }, [session]);

    const checkExistingApplication = async () => {
        try {
            const response = await fetch("/api/vendor/apply");
            if (response.ok) {
                const data = await response.json();
                if (data.hasApplication) {
                    setExistingApplication(data.application);
                }
            }
        } catch (error) {
            console.error("Error checking existing application:", error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: VendorApplicationData) => {
        if (!session?.user) {
            toast.error("You must be logged in to apply");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/vendor/apply", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to submit application");
            }

            setIsSubmitted(true);
            toast.success("Application submitted successfully!");
        } catch (error) {
            console.error("Error submitting application:", error);
            toast.error("Failed to submit application");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!session?.user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Login Required</CardTitle>
                        <CardDescription>
                            You must be logged in to apply as a vendor
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Link href="/auth/signin" className="block">
                                <Button className="w-full">Sign In</Button>
                            </Link>
                            <Link href="/auth/signup" className="block">
                                <Button variant="outline" className="w-full">Create Account</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (session.user.role === "VENDOR") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Already a Vendor</CardTitle>
                        <CardDescription>
                            You are already registered as a vendor
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/vendor">
                            <Button className="w-full">Go to Vendor Dashboard</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (existingApplication) {
        const statusColors = {
            PENDING: "bg-yellow-100 text-yellow-800",
            UNDER_REVIEW: "bg-blue-100 text-blue-800",
            APPROVED: "bg-green-100 text-green-800",
            REJECTED: "bg-red-100 text-red-800"
        };

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Application Status</CardTitle>
                        <CardDescription>
                            Your vendor application has been submitted
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <Badge className={`${statusColors[existingApplication.status as keyof typeof statusColors]} text-sm px-3 py-1`}>
                                {existingApplication.status.replace('_', ' ')}
                            </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-medium">Business Name:</span> {existingApplication.businessName}
                            </div>
                            <div>
                                <span className="font-medium">Submitted:</span> {new Date(existingApplication.submittedAt).toLocaleDateString()}
                            </div>
                            {existingApplication.reviewedAt && (
                                <div>
                                    <span className="font-medium">Reviewed:</span> {new Date(existingApplication.reviewedAt).toLocaleDateString()}
                                </div>
                            )}
                            {existingApplication.rejectionReason && (
                                <div className="bg-red-50 p-3 rounded">
                                    <span className="font-medium text-red-800">Rejection Reason:</span>
                                    <p className="text-red-700 mt-1">{existingApplication.rejectionReason}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 p-3 rounded text-sm">
                            {existingApplication.status === 'PENDING' && (
                                <p className="text-blue-800">Your application is waiting for admin review. We'll email you once it's processed.</p>
                            )}
                            {existingApplication.status === 'UNDER_REVIEW' && (
                                <p className="text-blue-800">Your application is currently under review. We'll contact you if we need additional information.</p>
                            )}
                            {existingApplication.status === 'APPROVED' && (
                                <p className="text-green-800">Congratulations! Your application has been approved. You should now have vendor access.</p>
                            )}
                            {existingApplication.status === 'REJECTED' && (
                                <p className="text-red-800">Your application was not approved. You may submit a new application after addressing the concerns mentioned above.</p>
                            )}
                        </div>

                        <Link href="/careers">
                            <Button variant="outline" className="w-full">Back to Careers</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <CardTitle>Application Submitted!</CardTitle>
                        <CardDescription>
                            Thank you for your vendor application. We'll review it and get back to you within 3-5 business days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• We'll verify your business information</li>
                                    <li>• Our team will review your application</li>
                                    <li>• You'll receive an email with the decision</li>
                                    <li>• If approved, you'll get access to the vendor portal</li>
                                </ul>
                            </div>
                            <Link href="/careers">
                                <Button className="w-full">Back to Careers</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-6">
                    <Link href="/careers">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Careers
                        </Button>
                    </Link>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Become a Vendor Partner</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Join our marketplace and start selling your products to thousands of customers.
                        Fill out the application below to get started.
                    </p>
                </div>

                {/* Benefits Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Store className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">Easy Setup</h3>
                            <p className="text-sm text-gray-600">
                                Get your store up and running quickly with our intuitive vendor tools
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <User className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">Large Customer Base</h3>
                            <p className="text-sm text-gray-600">
                                Access thousands of potential customers actively looking for products
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Building className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">Professional Tools</h3>
                            <p className="text-sm text-gray-600">
                                Manage inventory, orders, and analytics with our comprehensive dashboard
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Vendor Application Form
                        </CardTitle>
                        <CardDescription>
                            Please provide accurate information about your business. All fields marked with * are required.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Business Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Business Information</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="businessName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Business Name *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Your Business Name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="businessType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Business Type *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select business type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {businessTypes.map((type) => (
                                                                <SelectItem key={type} value={type}>
                                                                    {type}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="businessDescription"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Business Description *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe your business, products, and what makes you unique..."
                                                        rows={4}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Minimum 50 characters. This will help us understand your business better.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="businessAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Business Address *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Your full business address"
                                                        rows={2}
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
                                            name="businessPhone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Business Phone *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+1 (555) 123-4567" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="businessWebsite"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Business Website</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://yourwebsite.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Financial Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Financial Information</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="taxId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tax ID / EIN *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="XX-XXXXXXX" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Required for tax reporting
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="expectedMonthlyVolume"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Expected Monthly Sales Volume *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select volume range" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {volumeOptions.map((option) => (
                                                                <SelectItem key={option} value={option}>
                                                                    {option}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="bankAccount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bank Account Information *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Bank name and account details" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    This information will be securely stored for payment processing
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Product Categories */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Product Information</h3>

                                    <FormField
                                        control={form.control}
                                        name="productCategories"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Product Categories *</FormLabel>
                                                <FormDescription>
                                                    Select all categories that apply to your products
                                                </FormDescription>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {productCategories.map((category) => (
                                                        <FormField
                                                            key={category}
                                                            control={form.control}
                                                            name="productCategories"
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem
                                                                        key={category}
                                                                        className="flex flex-row items-start space-x-3 space-y-0"
                                                                    >
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(category)}
                                                                                onCheckedChange={(checked) => {
                                                                                    return checked
                                                                                        ? field.onChange([...field.value, category])
                                                                                        : field.onChange(
                                                                                            field.value?.filter(
                                                                                                (value) => value !== category
                                                                                            )
                                                                                        )
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="text-sm font-normal">
                                                                            {category}
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                )
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Terms and Agreements */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Terms and Agreements</h3>

                                    <FormField
                                        control={form.control}
                                        name="hasBusinessLicense"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        I have a valid business license *
                                                    </FormLabel>
                                                    <FormDescription>
                                                        You must have proper business registration and licensing
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="agreeToCommission"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        I agree to the commission structure *
                                                    </FormLabel>
                                                    <FormDescription>
                                                        5% commission on all sales. Payments processed monthly.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="agreesToTerms"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        I agree to the Terms of Service and Privacy Policy *
                                                    </FormLabel>
                                                    <FormDescription>
                                                        <Link href="/terms" className="text-blue-600 hover:underline">
                                                            Terms of Service
                                                        </Link>
                                                        {" and "}
                                                        <Link href="/privacy" className="text-blue-600 hover:underline">
                                                            Privacy Policy
                                                        </Link>
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex justify-end pt-6">
                                    <Button type="submit" size="lg" disabled={isSubmitting}>
                                        <Send className="h-4 w-4 mr-2" />
                                        {isSubmitting ? "Submitting Application..." : "Submit Application"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
