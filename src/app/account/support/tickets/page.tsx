import { CustomerTicketList } from "@/components/support/CustomerTicketList";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const metadata = {
    title: "My Support Tickets - Uniqverse",
    description: "View and manage your support tickets",
};

export default async function CustomerTicketsPage() {
    const session = await getServerSession(authOptions);

    // Redirect to login if not authenticated
    if (!session?.user) {
        redirect("/auth/login?callbackUrl=/account/support/tickets");
    }

    return (
        <div className="container max-w-5xl py-10">
            <CustomerTicketList />
        </div>
    );
}