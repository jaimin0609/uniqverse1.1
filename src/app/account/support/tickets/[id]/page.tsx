import { TicketDetail } from "@/components/support/TicketDetail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const metadata = {
    title: "Support Ticket - Uniqverse",
    description: "View and manage your support ticket",
};

export default async function CustomerTicketDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);    // Redirect to login if not authenticated
    if (!session?.user) {
        redirect("/auth/login?callbackUrl=/account/support/tickets/" + resolvedParams.id);
    }

    // Check if ticket exists and belongs to user (for security)
    const ticket = await db.supportTicket.findUnique({
        where: {
            id: resolvedParams.id,
            userId: session.user.id,
        },
        select: { id: true },
    });

    // Redirect if ticket not found or doesn't belong to user
    if (!ticket) {
        redirect("/account/support/tickets");
    }

    return (
        <div className="container max-w-5xl py-10">
            <TicketDetail ticketId={resolvedParams.id} />
        </div>
    );
}