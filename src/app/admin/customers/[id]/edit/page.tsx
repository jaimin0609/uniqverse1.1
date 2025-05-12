"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Form validation schema
const formSchema = z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email address"),
    role: z.enum(["CUSTOMER", "ADMIN", "VENDOR"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditCustomerPage() {
    const params = useParams();
    const router = useRouter();
    const customerId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize form
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "CUSTOMER",
        },
    });

    // Fetch customer data
    useEffect(() => {
        const fetchCustomerData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/admin/customers/${customerId}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch customer data");
                }

                const data = await response.json();

                // Set form values
                form.reset({
                    name: data.name || "",
                    email: data.email,
                    role: data.role,
                });
            } catch (err) {
                console.error("Error fetching customer:", err);
                setError("Failed to load customer data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomerData();
    }, [customerId, form]);

    // Form submission handler
    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/admin/customers/${customerId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error("Failed to update customer");
            }

            toast.success("Customer updated successfully");
            router.push(`/admin/customers/${customerId}`);
        } catch (err) {
            console.error("Error updating customer:", err);
            toast.error("Failed to update customer. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md my-4 text-center">
                <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">{error}</p>
                <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div>
            {/* Header with back button */}
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-2">
                    <Link href={`/admin/customers/${customerId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Customer
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Edit Customer</h1>
                <p className="text-gray-500">Update customer information</p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Full name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Email address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>User Role</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CUSTOMER">Customer</SelectItem>
                                            <SelectItem value="VENDOR">Vendor</SelectItem>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" asChild>
                                <Link href={`/admin/customers/${customerId}`}>
                                    Cancel
                                </Link>
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}