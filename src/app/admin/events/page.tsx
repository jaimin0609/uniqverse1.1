import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/prisma-types";
import { Plus, Edit, Trash2, Eye, Calendar } from "lucide-react";

export default async function AdminEventsPage() {
    const session = await auth();

    // Check if the user is authenticated and has the ADMIN role
    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/signin?callbackUrl=/admin/events");
    }

    // Fetch all events
    const events = await db.event.findMany({
        orderBy: [
            { position: 'asc' },
            { startDate: 'desc' },
        ],
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Event Management</h1>
                <Button asChild>
                    <Link href="/admin/events/new">
                        <Plus className="mr-2 h-4 w-4" /> Create New Event
                    </Link>
                </Button>
            </div>

            {events.length === 0 ? (
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                    <h3 className="text-lg font-medium mb-2">No Events Found</h3>
                    <p className="text-gray-600 mb-4">Create your first event to showcase on the homepage.</p>
                    <Button asChild>
                        <Link href="/admin/events/new">
                            <Plus className="mr-2 h-4 w-4" /> Create New Event
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date Range
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {events.map((event) => {
                                    const isActive = event.isActive &&
                                        new Date(event.startDate) <= new Date() &&
                                        new Date(event.endDate) >= new Date();

                                    return (
                                        <tr key={event.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 relative">
                                                        {event.contentType === "image" && event.imageUrl ? (
                                                            <img
                                                                className="h-10 w-10 rounded-md object-cover"
                                                                src={event.imageUrl}
                                                                alt={event.title}
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                                                <Calendar className="h-5 w-5 text-gray-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                                        {event.description && (
                                                            <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                {event.description.length > 50
                                                                    ? `${event.description.substring(0, 50)}...`
                                                                    : event.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{event.contentType}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{event.position}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {format(new Date(event.startDate), 'MMM d, yyyy')} to {format(new Date(event.endDate), 'MMM d, yyyy')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex justify-center space-x-2">
                                                    <Link href={`/admin/events/${event.id}`} className="text-blue-600 hover:text-blue-900">
                                                        <Eye className="h-5 w-5" />
                                                    </Link>
                                                    <Link href={`/admin/events/${event.id}/edit`} className="text-amber-600 hover:text-amber-900">
                                                        <Edit className="h-5 w-5" />
                                                    </Link>
                                                    <Link href={`/admin/events/${event.id}/delete`} className="text-red-600 hover:text-red-900">
                                                        <Trash2 className="h-5 w-5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Tips for Creating Effective Events</h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Use high-quality images or videos for maximum impact</li>
                    <li>Keep text overlays brief and easy to read</li>
                    <li>Ensure adequate contrast between text and background</li>
                    <li>Set proper start and end dates to control when events are displayed</li>
                    <li>Use position numbers to control the order of multiple events</li>
                    <li>Preview your events on the homepage to ensure they look good on all devices</li>
                </ul>
            </div>
        </div>
    );
}
