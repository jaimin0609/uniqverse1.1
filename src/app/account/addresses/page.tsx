'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    MapPin,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Check,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Address {
    id: string;
    name: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
}

export default function AddressesPage() {
    const { data: session } = useSession();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchAddresses = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/users/addresses');

                if (response.ok) {
                    const data = await response.json();
                    setAddresses(data.addresses);
                } else {
                    setError('Failed to load addresses');
                }
            } catch (error) {
                setError('An error occurred while loading addresses');
                console.error('Error fetching addresses:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchAddresses();
        }
    }, [session]);

    const handleSetAsDefault = async (id: string) => {
        try {
            const response = await fetch(`/api/users/addresses/${id}/default`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Update the addresses with the new default
                setAddresses(prev => prev.map(address => ({
                    ...address,
                    isDefault: address.id === id
                })));
                setSuccess('Default address updated successfully');

                // Clear success message after a few seconds
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError('Failed to update default address');
            }
        } catch (error) {
            setError('An error occurred while updating the address');
            console.error('Error updating default address:', error);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteAddressId(id);
    };

    const confirmDelete = async () => {
        if (!deleteAddressId) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/users/addresses/${deleteAddressId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setAddresses(prev => prev.filter(address => address.id !== deleteAddressId));
                setSuccess('Address deleted successfully');

                // Clear success message after a few seconds
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError('Failed to delete address');
            }
        } catch (error) {
            setError('An error occurred while deleting the address');
            console.error('Error deleting address:', error);
        } finally {
            setIsDeleting(false);
            setDeleteAddressId(null);
        }
    };

    const cancelDelete = () => {
        setDeleteAddressId(null);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">My Addresses</h1>
                <Link href="/account/addresses/new">
                    <Button className="flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Address
                    </Button>
                </Link>
            </div>

            {success && (
                <div className="flex items-center p-4 mb-6 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p>{success}</p>
                </div>
            )}

            {error && (
                <div className="flex items-center p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-600">Loading your addresses...</p>
                </div>
            ) : addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map(address => (
                        <div
                            key={address.id}
                            className={`p-6 rounded-lg border ${address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                                }`}
                        >
                            {address.isDefault && (
                                <span className="inline-flex items-center mb-3 text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                    Default Address
                                </span>
                            )}
                            <h3 className="font-medium mb-1">{address.name}</h3>
                            <div className="text-gray-700 space-y-1 mb-4">
                                <p>{address.street}</p>
                                <p>{address.city}, {address.state} {address.postalCode}</p>
                                <p>{address.country}</p>
                            </div>

                            <div className="flex space-x-3 mt-4">
                                {!address.isDefault && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSetAsDefault(address.id)}
                                    >
                                        Set as default
                                    </Button>
                                )}
                                <Link href={`/account/addresses/${address.id}/edit`}>
                                    <Button variant="outline" size="sm" className="flex items-center">
                                        <Pencil className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center text-red-600 hover:text-red-700 hover:border-red-200"
                                    onClick={() => handleDeleteClick(address.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        Add a shipping address to make checkout faster next time you shop with us.
                    </p>
                    <Link href="/account/addresses/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Address
                        </Button>
                    </Link>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteAddressId && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
                        <h3 className="text-lg font-medium mb-2">Delete Address</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this address? This action cannot be undone.
                        </p>
                        <div className="flex space-x-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={cancelDelete}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Address'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}