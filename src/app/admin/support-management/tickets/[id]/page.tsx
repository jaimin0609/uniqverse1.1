import { AdminTicketDetail } from "@/components/admin/AdminTicketDetail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const metadata = {
    title: "Ticket Details - Admin Support Management",
    description: "Manage customer support ticket details",
};

export default async function AdminTicketDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    // Security check: redirect if not admin
    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect("/admin");
    }

    // Check if ticket exists (for security)
    const ticket = await db.supportTicket.findUnique({
        where: {
            id: resolvedParams.id,
        },
        select: { id: true },
    });

    // Redirect if ticket not found
    if (!ticket) {
        redirect("/admin/support-management/tickets");
    } return (
        <div className="container py-6">
            <AdminTicketDetail ticketId={resolvedParams.id} />
        </div>
    );
}