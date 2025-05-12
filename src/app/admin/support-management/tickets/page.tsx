import { AdminTicketDashboard } from "@/components/admin/AdminTicketDashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Support Management - Admin Dashboard",
    description: "Manage customer support tickets",
};

export default async function AdminSupportDashboardPage() {
    const session = await getServerSession(authOptions);

    // Security check: redirect if not admin
    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect("/admin");
    }

    return (
        <div className="container py-6">
            <h1 className="text-2xl font-bold mb-6">Support Ticket Management</h1>
            <AdminTicketDashboard />
        </div>
    );
}