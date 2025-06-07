'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Package, MapPin, Heart, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientPrice } from '@/components/ui/client-price';
import { handleLogout } from '@/utils/logout-utils';

interface Order {
    id: string;
    orderNumber: string;
    createdAt: string;
    totalAmount: number;
    status: string;
    items: number;
}

interface UserProfile {
    name: string;
    email: string;
    image?: string;
    addresses: {
        id: string;
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        isDefault: boolean;
    }[];
}

export default function AccountPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login?callbackUrl=/account');
        }

        if (status === 'authenticated') {
            // Fetch user profile data
            const fetchUserData = async () => {
                try {
                    const profileResponse = await fetch('/api/users');
                    const ordersResponse = await fetch('/api/users/orders?limit=3');

                    if (profileResponse.ok && ordersResponse.ok) {
                        const profileData = await profileResponse.json();
                        const ordersData = await ordersResponse.json();

                        setProfile(profileData);
                        setRecentOrders(ordersData.orders);
                    } else {
                        console.error('Failed to fetch user data');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchUserData();
        }
    }, [status, router]);

    if (status === 'loading' || isLoading) {
        return (
            <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Loading your account...</p>
            </div>
        );
    }

    if (!session) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">My Account</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column - Account Navigation */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200">
                            <div className="relative h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                                {session.user?.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt={session.user.name || 'User avatar'}
                                        fill
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="h-8 w-8 text-blue-600" />
                                )}
                            </div>
                            <div>
                                <h2 className="font-semibold text-lg">{session.user?.name}</h2>
                                <p className="text-gray-600 text-sm">{session.user?.email}</p>
                                {/* Display user role badge */}
                                {session.user?.role && (
                                    <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium ${session.user.role === 'admin'
                                        ? 'bg-purple-100 text-purple-800'
                                        : session.user.role === 'vendor'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                        {session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <nav className="space-y-2">
                            <Link
                                href="/account"
                                className="flex items-center space-x-3 p-3 rounded-md bg-blue-50 text-blue-700 font-medium"
                            >
                                <User className="h-5 w-5" />
                                <span>Account Overview</span>
                            </Link>
                            <Link
                                href="/account/orders"
                                className="flex items-center space-x-3 p-3 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                <ShoppingBag className="h-5 w-5" />
                                <span>My Orders</span>
                            </Link>
                            <Link
                                href="/account/addresses"
                                className="flex items-center space-x-3 p-3 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                <MapPin className="h-5 w-5" />
                                <span>Addresses</span>
                            </Link>
                            <Link
                                href="/account/wishlist"
                                className="flex items-center space-x-3 p-3 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                <Heart className="h-5 w-5" />
                                <span>Wishlist</span>
                            </Link>
                            <Link
                                href="/account/settings"
                                className="flex items-center space-x-3 p-3 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                <User className="h-5 w-5" />
                                <span>Settings</span>
                            </Link>
                        </nav>                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleLogout();
                                }}
                            >
                                Log Out
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column - Account Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* Account Summary Section */}
                    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-4">Account Summary</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-2 mb-2">
                                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-medium">Orders</h3>
                                </div>
                                <p className="text-2xl font-semibold">{recentOrders.length || 0}</p>
                                <Link href="/account/orders" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                                    View all orders
                                </Link>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-2 mb-2">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-medium">Addresses</h3>
                                </div>
                                <p className="text-2xl font-semibold">{profile?.addresses?.length || 0}</p>
                                <Link href="/account/addresses" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                                    Manage addresses
                                </Link>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Heart className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-medium">Wishlist</h3>
                                </div>
                                <p className="text-2xl font-semibold">-</p>
                                <Link href="/account/wishlist" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                                    View wishlist
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Recent Orders Section */}
                    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Recent Orders</h2>
                            <Link href="/account/orders" className="text-sm text-blue-600 hover:underline">
                                View all
                            </Link>
                        </div>

                        {recentOrders.length > 0 ? (
                            <div className="space-y-4">
                                {recentOrders.map((order) => (
                                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex flex-col sm:flex-row justify-between mb-2">
                                            <div>
                                                <p className="font-medium">#{order.orderNumber}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleDateString()} · {Array.isArray(order.items) ? order.items.length : 1} {Array.isArray(order.items) && order.items.length === 1 ? 'item' : 'items'}
                                                </p>
                                            </div>
                                            <div className="mt-2 sm:mt-0">
                                                <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium 
                          ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}
                                                >
                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold">
                                                {typeof order.totalAmount === 'number' ?
                                                    <ClientPrice amount={order.totalAmount} /> :
                                                    '$0.00'}
                                            </p>
                                            <Link href={`/account/orders/${order.id}`}>
                                                <Button variant="outline" size="sm">
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
                                <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No orders yet</h3>
                                <p className="text-gray-500 mb-4">Start shopping to see your orders here</p>
                                <Link href="/shop">
                                    <Button>Browse Products</Button>
                                </Link>
                            </div>
                        )}
                    </section>

                    {/* Personal Information Section */}
                    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Personal Information</h2>
                            <Link href="/account/profile">
                                <Button variant="outline" size="sm">
                                    Edit
                                </Button>
                            </Link>
                        </div>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                                <dd className="mt-1 text-gray-900">{profile?.name || session?.user?.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                                <dd className="mt-1 text-gray-900">{profile?.email || session?.user?.email}</dd>
                            </div>
                        </dl>
                    </section>

                    {/* Default Address Section */}
                    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Default Address</h2>
                            <Link href="/account/addresses">
                                <Button variant="outline" size="sm">
                                    Manage
                                </Button>
                            </Link>
                        </div>

                        {profile?.addresses && profile.addresses.some(addr => addr.isDefault) ? (
                            profile.addresses
                                .filter(addr => addr.isDefault)
                                .map(address => (
                                    <div key={address.id}>
                                        <p>{address.street}</p>
                                        <p>
                                            {address.city}, {address.state} {address.postalCode}
                                        </p>
                                        <p>{address.country}</p>
                                    </div>
                                ))
                        ) : (
                            <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
                                <MapPin className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                                <h3 className="text-base font-medium text-gray-900 mb-1">No addresses saved</h3>
                                <p className="text-gray-500 mb-4 max-w-xs mx-auto">
                                    Add a shipping address to make checkout faster
                                </p>
                                <Link href="/account/addresses/new">
                                    <Button variant="outline">Add Address</Button>
                                </Link>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}