'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Package, ChevronLeft, ChevronRight, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Order {
    id: string;
    orderNumber: string;
    createdAt: string;
    totalAmount: number;
    status: string;
    items: number;
}

export default function OrdersPage() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [filterOpen, setFilterOpen] = useState(false);

    const ordersPerPage = 5;

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            try {
                const statusQuery = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
                const response = await fetch(`/api/users/orders?page=${currentPage}&limit=${ordersPerPage}${statusQuery}`);

                if (response.ok) {
                    const data = await response.json();
                    setOrders(data.orders);
                    setTotalPages(Math.ceil(data.total / ordersPerPage));
                } else {
                    console.error('Failed to fetch orders');
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchOrders();
        }
    }, [session, currentPage, statusFilter]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const statusOptions = [
        { value: 'all', label: 'All Orders' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">My Orders</h1>

                {/* Filter button (mobile) */}
                <div className="md:hidden">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={() => setFilterOpen(!filterOpen)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>

                {/* Filter dropdown (desktop) */}
                <div className="hidden md:block">
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Mobile filter dropdown */}
            {filterOpen && (
                <div className="md:hidden mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm">Filter by status</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {statusOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setStatusFilter(option.value);
                                        setFilterOpen(false);
                                    }}
                                    className={`text-sm py-2 px-3 rounded-md ${statusFilter === option.value
                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                        : 'bg-white border border-gray-200'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-600">Loading your orders...</p>
                </div>
            ) : orders.length > 0 ? (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {orders.map(order => (
                                <li key={order.id} className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                        <div className="mb-4 lg:mb-0">
                                            <p className="font-semibold">Order #{order.orderNumber}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Placed on {new Date(order.createdAt).toLocaleDateString()} • {Array.isArray(order.items) ? order.items.length : 1} {Array.isArray(order.items) && order.items.length === 1 ? 'item' : 'items'}
                                            </p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium 
                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                                            order.status === 'delivered' ? 'bg-teal-100 text-teal-800' :
                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'}`}
                                            >
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>

                                            <span className="font-medium">${typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}</span>

                                            <Link href={`/account/orders/${order.id}`}>
                                                <Button variant="outline" size="sm">
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center space-x-2 mt-8">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Prev
                            </Button>

                            <div className="flex items-center space-x-1">
                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const page = i + 1;
                                    const isActive = page === currentPage;

                                    // Only show a window of pages around the current page for large page counts
                                    if (
                                        totalPages <= 7 ||
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <Button
                                                key={page}
                                                variant={isActive ? "default" : "outline"}
                                                size="sm"
                                                className={`w-8 ${isActive ? "pointer-events-none" : ""}`}
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </Button>
                                        );
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return <span key={page}>...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        When you place an order, it will appear here so you can track its progress.
                    </p>
                    <Link href="/shop">
                        <Button>Browse Products</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}