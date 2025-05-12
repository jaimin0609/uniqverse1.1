import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Support - Uniqverse",
    description: "Get help and support for your Uniqverse account",
};

export default async function SupportPage() {
    const session = await getServerSession(authOptions);

    // Redirect to login if not authenticated
    if (!session?.user) {
        redirect("/auth/login?callbackUrl=/support");
    }

    return (
        <div className="container max-w-5xl py-10">
            <h1 className="text-3xl font-bold mb-6">Customer Support</h1>
            <p className="text-gray-600 mb-8">
                Our support team is here to help. Please fill out the form below with details about your issue,
                and we'll get back to you as soon as possible.
            </p>

            <SupportTicketForm />
        </div>
    );
}