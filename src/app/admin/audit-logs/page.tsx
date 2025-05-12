"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, AlertTriangle, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

interface AdminAuditLog {
    id: string;
    action: string;
    details: string;
    createdAt: string;
    User: {
        name: string | null;
        email: string;
    };
}

interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export default function AdminAuditLogsPage() {
    const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();
    const currentPage = parseInt(searchParams.get("page") || "1", 10);

    // Format action string to be more readable
    const formatAction = (action: string) => {
        return action
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    // Fetch audit logs
    useEffect(() => {
        const fetchAuditLogs = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/admin/audit-logs?page=${currentPage}&pageSize=20`);

                if (!response.ok) {
                    throw new Error("Failed to fetch audit logs");
                }

                const data = await response.json();
                setAuditLogs(data.logs);
                setPagination(data.pagination);
            } catch (err) {
                console.error("Error fetching audit logs:", err);
                setError("Failed to load audit logs. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAuditLogs();
    }, [currentPage]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        router.push(`/admin/audit-logs?page=${newPage}`);
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Audit Logs</h1>
                    <p className="text-gray-600">View a record of all administrative actions</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Admin
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Details
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {auditLogs.length > 0 ? (
                                auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{log.User.name || "Unknown"}</div>
                                            <div className="text-xs text-gray-500">{log.User.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${log.action.includes("create") ? "bg-green-100 text-green-800" :
                                                    log.action.includes("update") ? "bg-blue-100 text-blue-800" :
                                                        log.action.includes("delete") ? "bg-red-100 text-red-800" :
                                                            log.action.includes("login") ? "bg-purple-100 text-purple-800" :
                                                                "bg-gray-100 text-gray-800"
                                                }`}>
                                                {formatAction(log.action)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{log.details}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No audit logs found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <Button
                                variant="outline"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{Math.min((currentPage - 1) * pagination.pageSize + 1, pagination.total)}</span> to{" "}
                                    <span className="font-medium">{Math.min(currentPage * pagination.pageSize, pagination.total)}</span> of{" "}
                                    <span className="font-medium">{pagination.total}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <Button
                                        variant="outline"
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                    </Button>

                                    {/* Page numbers */}
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        const pageNum = currentPage <= 3
                                            ? i + 1
                                            : currentPage >= pagination.totalPages - 2
                                                ? pagination.totalPages - 4 + i
                                                : currentPage - 2 + i;

                                        if (pageNum > 0 && pageNum <= pagination.totalPages) {
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                            ? "z-10 bg-primary text-white border-primary"
                                                            : "bg-white text-gray-500 hover:bg-gray-50"
                                                        }`}
                                                    onClick={() => handlePageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        }
                                        return null;
                                    })}

                                    <Button
                                        variant="outline"
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === pagination.totalPages}
                                    >
                                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                    </Button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 bg-blue-50 p-4 border border-blue-100 rounded-md">
                <div className="flex items-start">
                    <FileText className="h-6 w-6 text-blue-500 mr-3 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-medium text-blue-800">About Admin Audit Logs</h3>
                        <p className="mt-1 text-sm text-blue-600">
                            This page shows a complete record of actions performed by administrators.
                            Every action is logged with details about who performed it and when, ensuring
                            accountability and traceability.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}