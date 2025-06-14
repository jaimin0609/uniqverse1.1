'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User, Building, Phone, Mail, Globe, FileText,
    Clock, CheckCircle, XCircle, AlertCircle,
    Calendar, DollarSign, Package, TrendingUp,
    Eye, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ClientDate } from '@/components/ui/client-date';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface VendorApplication {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        createdAt: string;
    };
    businessName: string;
    businessType: string;
    businessDescription: string;
    businessAddress: string;
    businessPhone: string;
    businessWebsite?: string;
    taxId: string;
    expectedMonthlyVolume: string;
    productCategories: string[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
    submittedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
}

const statusConfig = {
    PENDING: {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
    },
    UNDER_REVIEW: {
        label: 'Under Review',
        color: 'bg-blue-100 text-blue-800',
        icon: AlertCircle,
    },
    APPROVED: {
        label: 'Approved',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
    },
    REJECTED: {
        label: 'Rejected',
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
    },
};

export default function AdminVendorApplicationsPage() {
    const [applications, setApplications] = useState<VendorApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectionDialog, setShowRejectionDialog] = useState(false);
    const [applicationToReject, setApplicationToReject] = useState<string | null>(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await fetch('/api/admin/vendor/applications');
            if (!response.ok) throw new Error('Failed to fetch applications');
            const data = await response.json();
            setApplications(data.applications || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load vendor applications');
        } finally {
            setLoading(false);
        }
    };

    const handleApplicationAction = async (
        applicationId: string,
        action: 'approve' | 'reject',
        rejectionReason?: string
    ) => {
        setProcessing(applicationId); try {
            const response = await fetch(`/api/admin/vendor/applications/${applicationId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action,
                    rejectionReason,
                }),
            });

            if (!response.ok) throw new Error('Failed to process application');

            const data = await response.json();

            // Update local state
            setApplications(prev =>
                prev.map(app =>
                    app.id === applicationId
                        ? { ...app, status: action === 'approve' ? 'APPROVED' : 'REJECTED', rejectionReason }
                        : app
                )
            );

            toast.success(`Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`);

            // Close dialogs if open
            setShowRejectionDialog(false);
            setSelectedApplication(null);
            setRejectionReason('');
            setApplicationToReject(null);
        } catch (error) {
            console.error('Error processing application:', error);
            toast.error(`Failed to ${action} application`);
        } finally {
            setProcessing(null);
        }
    };

    const handleRejectClick = (applicationId: string) => {
        setApplicationToReject(applicationId);
        setShowRejectionDialog(true);
    };

    const handleRejectConfirm = () => {
        if (applicationToReject && rejectionReason.trim()) {
            handleApplicationAction(applicationToReject, 'reject', rejectionReason);
        }
    };

    const filteredApplications = applications.filter(app => {
        if (activeTab === 'all') return true;
        return app.status.toLowerCase() === activeTab.replace('_', '').toLowerCase();
    });

    const getStatusStats = () => {
        return {
            all: applications.length,
            pending: applications.filter(app => app.status === 'PENDING').length,
            underreview: applications.filter(app => app.status === 'UNDER_REVIEW').length,
            approved: applications.filter(app => app.status === 'APPROVED').length,
            rejected: applications.filter(app => app.status === 'REJECTED').length,
        };
    };

    const stats = getStatusStats();

    if (loading) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Vendor Applications</h1>
                    <p className="text-gray-600">Manage vendor applications and approvals</p>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Vendor Applications</h1>
                <p className="text-gray-600">Manage vendor applications and approvals</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <div className="ml-2">
                                <p className="text-sm font-medium text-gray-600">Total</p>
                                <p className="text-2xl font-bold">{stats.all}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <div className="ml-2">
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 text-blue-500" />
                            <div className="ml-2">
                                <p className="text-sm font-medium text-gray-600">Under Review</p>
                                <p className="text-2xl font-bold">{stats.underreview}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div className="ml-2">
                                <p className="text-sm font-medium text-gray-600">Approved</p>
                                <p className="text-2xl font-bold">{stats.approved}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <div className="ml-2">
                                <p className="text-sm font-medium text-gray-600">Rejected</p>
                                <p className="text-2xl font-bold">{stats.rejected}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">All ({stats.all})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="underreview">Under Review ({stats.underreview})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {filteredApplications.length === 0 ? (
                        <Card>
                            <CardContent className="p-12">
                                <div className="text-center">
                                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {activeTab === 'all' ? 'No vendor applications submitted yet.' : `No ${activeTab} applications found.`}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredApplications.map((application) => {
                                const StatusIcon = statusConfig[application.status].icon;
                                return (
                                    <Card key={application.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {application.businessName}
                                                        </h3>
                                                        <Badge className={cn("px-2 py-1", statusConfig[application.status].color)}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {statusConfig[application.status].label}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <User className="w-4 h-4 mr-2" />
                                                            {application.user.name}
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Mail className="w-4 h-4 mr-2" />
                                                            {application.user.email}
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Building className="w-4 h-4 mr-2" />
                                                            {application.businessType}
                                                        </div>                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            <ClientDate
                                                                date={application.submittedAt}
                                                                format="short"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Package className="w-4 h-4 text-gray-500" />
                                                        <div className="flex flex-wrap gap-1">
                                                            {application.productCategories.map((category) => (
                                                                <Badge key={category} variant="secondary" className="text-xs">
                                                                    {category}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {application.rejectionReason && (
                                                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                                            <p className="text-sm text-red-800">
                                                                <strong>Rejection Reason:</strong> {application.rejectionReason}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 ml-4">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setSelectedApplication(application)}
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View Details
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>Vendor Application Details</DialogTitle>
                                                                <DialogDescription>
                                                                    Complete application information for {application.businessName}
                                                                </DialogDescription>
                                                            </DialogHeader>

                                                            {selectedApplication && (
                                                                <div className="space-y-6">
                                                                    {/* Business Information */}
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Business Information</h4>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <div>
                                                                                <Label className="text-xs text-gray-500">Business Name</Label>
                                                                                <p className="text-sm font-medium">{selectedApplication.businessName}</p>
                                                                            </div>
                                                                            <div>
                                                                                <Label className="text-xs text-gray-500">Business Type</Label>
                                                                                <p className="text-sm font-medium">{selectedApplication.businessType}</p>
                                                                            </div>
                                                                            <div className="md:col-span-2">
                                                                                <Label className="text-xs text-gray-500">Business Description</Label>
                                                                                <p className="text-sm">{selectedApplication.businessDescription}</p>
                                                                            </div>
                                                                            <div className="md:col-span-2">
                                                                                <Label className="text-xs text-gray-500">Business Address</Label>
                                                                                <p className="text-sm">{selectedApplication.businessAddress}</p>
                                                                            </div>
                                                                            <div>
                                                                                <Label className="text-xs text-gray-500">Phone</Label>
                                                                                <p className="text-sm">{selectedApplication.businessPhone}</p>
                                                                            </div>
                                                                            {selectedApplication.businessWebsite && (
                                                                                <div>
                                                                                    <Label className="text-xs text-gray-500">Website</Label>
                                                                                    <p className="text-sm">{selectedApplication.businessWebsite}</p>
                                                                                </div>
                                                                            )}
                                                                            <div>
                                                                                <Label className="text-xs text-gray-500">Tax ID</Label>
                                                                                <p className="text-sm">{selectedApplication.taxId}</p>
                                                                            </div>
                                                                            <div>
                                                                                <Label className="text-xs text-gray-500">Expected Monthly Volume</Label>
                                                                                <p className="text-sm">{selectedApplication.expectedMonthlyVolume}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Product Categories */}
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Product Categories</h4>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {selectedApplication.productCategories.map((category) => (
                                                                                <Badge key={category} variant="secondary">
                                                                                    {category}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Application Status */}
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Application Status</h4>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <StatusIcon className="w-4 h-4" />
                                                                            <Badge className={statusConfig[selectedApplication.status].color}>
                                                                                {statusConfig[selectedApplication.status].label}
                                                                            </Badge>
                                                                        </div>                                                                        <p className="text-sm text-gray-600">
                                                                            Submitted: <ClientDate
                                                                                date={selectedApplication.submittedAt}
                                                                                format="short"
                                                                            />
                                                                        </p>
                                                                        {selectedApplication.reviewedAt && (
                                                                            <p className="text-sm text-gray-600">
                                                                                Reviewed: <ClientDate
                                                                                    date={selectedApplication.reviewedAt}
                                                                                    format="short"
                                                                                />
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    {/* Action Buttons */}
                                                                    {selectedApplication.status === 'PENDING' && (
                                                                        <div className="flex gap-2 pt-4 border-t">
                                                                            <Button
                                                                                onClick={() => handleApplicationAction(selectedApplication.id, 'approve')}
                                                                                disabled={processing === selectedApplication.id}
                                                                                className="flex-1"
                                                                            >
                                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                                {processing === selectedApplication.id ? 'Processing...' : 'Approve'}
                                                                            </Button>
                                                                            <Button
                                                                                variant="destructive"
                                                                                onClick={() => {
                                                                                    handleRejectClick(selectedApplication.id);
                                                                                }}
                                                                                disabled={processing === selectedApplication.id}
                                                                                className="flex-1"
                                                                            >
                                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                                Reject
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </DialogContent>
                                                    </Dialog>

                                                    {application.status === 'PENDING' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleApplicationAction(application.id, 'approve')}
                                                                disabled={processing === application.id}
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                {processing === application.id ? 'Processing...' : 'Approve'}
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleRejectClick(application.id)}
                                                                disabled={processing === application.id}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Rejection Dialog */}
            <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this vendor application. This will be sent to the applicant.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="rejection-reason">Rejection Reason</Label>
                            <Textarea
                                id="rejection-reason"
                                placeholder="Enter the reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
                                Cancel
                            </Button>                            <Button
                                variant="destructive"
                                onClick={handleRejectConfirm}
                                disabled={!rejectionReason.trim() || (applicationToReject !== null && processing === applicationToReject)}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                {applicationToReject !== null && processing === applicationToReject ? 'Processing...' : 'Reject Application'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
