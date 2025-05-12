"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Define the shipping form schema
const shippingFormSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(2, "City must be at least 2 characters"),
    state: z.string().min(2, "State must be at least 2 characters"),
    postalCode: z.string().min(4, "Postal code must be at least 4 characters"),
    country: z.string().min(2, "Country must be at least 2 characters"),
    shippingMethod: z.enum(["standard", "express", "overnight"]),
    // Optional fields
    company: z.string().optional(),
    apartment: z.string().optional(),
    notes: z.string().optional(),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

interface ShippingFormProps {
    onSubmit: (data: ShippingFormValues) => void;
}

export default function ShippingForm({ onSubmit }: ShippingFormProps) {
    const router = useRouter();
    const [isBillingSame, setIsBillingSame] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
    } = useForm<ShippingFormValues>({
        resolver: zodResolver(shippingFormSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            postalCode: "",
            country: "United States",
            shippingMethod: "standard",
            company: "",
            apartment: "",
            notes: "",
        },
    });

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Contact Information */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name*
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    {...register("firstName")}
                                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.firstName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name*
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    {...register("lastName")}
                                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.lastName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address*
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    {...register("email")}
                                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number*
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    {...register("phone")}
                                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                                    Company (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="company"
                                    {...register("company")}
                                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                    Street Address*
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    {...register("address")}
                                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.address && (
                                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-1">
                                    Apartment, Suite, etc. (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="apartment"
                                    {...register("apartment")}
                                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                        City*
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        {...register("city")}
                                        className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.city && (
                                        <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                                        State/Province*
                                    </label>
                                    <input
                                        type="text"
                                        id="state"
                                        {...register("state")}
                                        className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.state && (
                                        <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                                        Postal Code*
                                    </label>
                                    <input
                                        type="text"
                                        id="postalCode"
                                        {...register("postalCode")}
                                        className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.postalCode && (
                                        <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                                        Country*
                                    </label>
                                    <select
                                        id="country"
                                        {...register("country")}
                                        className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="United States">United States</option>
                                        <option value="Canada">Canada</option>
                                        <option value="United Kingdom">United Kingdom</option>
                                        <option value="Australia">Australia</option>
                                        <option value="Germany">Germany</option>
                                        <option value="France">France</option>
                                        <option value="Japan">Japan</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {errors.country && (
                                        <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Address Checkbox */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="billingSame"
                            checked={isBillingSame}
                            onChange={() => setIsBillingSame(!isBillingSame)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="billingSame" className="ml-2 block text-sm text-gray-700">
                            Billing address is the same as shipping address
                        </label>
                    </div>

                    {/* Shipping Method */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Shipping Method</h3>
                        <div className="space-y-3">
                            <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    value="standard"
                                    {...register("shippingMethod")}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <div className="ml-3 flex flex-1 justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">Standard Shipping</p>
                                        <p className="text-sm text-gray-500">Delivery in 3-5 business days</p>
                                    </div>
                                    <p className="font-medium">$5.00</p>
                                </div>
                            </label>

                            <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    value="express"
                                    {...register("shippingMethod")}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <div className="ml-3 flex flex-1 justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">Express Shipping</p>
                                        <p className="text-sm text-gray-500">Delivery in 2-3 business days</p>
                                    </div>
                                    <p className="font-medium">$12.00</p>
                                </div>
                            </label>

                            <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    value="overnight"
                                    {...register("shippingMethod")}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <div className="ml-3 flex flex-1 justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">Overnight Shipping</p>
                                        <p className="text-sm text-gray-500">Delivery next business day</p>
                                    </div>
                                    <p className="font-medium">$25.00</p>
                                </div>
                            </label>
                        </div>
                        {errors.shippingMethod && (
                            <p className="mt-1 text-sm text-red-600">{errors.shippingMethod.message}</p>
                        )}
                    </div>

                    {/* Order Notes */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                            Order Notes (Optional)
                        </label>
                        <textarea
                            id="notes"
                            rows={3}
                            {...register("notes")}
                            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Special instructions for delivery"
                        />
                    </div>

                    {/* Form Buttons */}
                    <div className="flex justify-between pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/shop")}
                        >
                            Return to Shop
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Processing..." : "Continue to Payment"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}