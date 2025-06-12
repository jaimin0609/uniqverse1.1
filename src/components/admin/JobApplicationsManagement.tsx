"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Search,
    Download,
    User,
    Mail,
    Phone,
    Calendar,
    FileText,
    Eye,
    MessageSquare,
    Loader2,
    ExternalLink,
    Filter
} from "lucide-react";
import { toast } from "sonner";

interface JobApplication {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    resumeUrl?: string;
    coverLetter?: string;
    experience?: string;
    education?: string;
    availability?: string;
    expectedSalary?: string;
    status: string;
    submittedAt: string;
    reviewedAt?: string;
    notes?: string;
    jobPosition: {
        id: string;
        title: string;
        department: string;
    };
    user: {
        id: string;
        name?: string;
        email: string;
    };
}

const APPLICATION_STATUSES = [
    { value: "PENDING", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    { value: "REVIEWING", label: "Reviewing", color: "bg-blue-100 text-blue-800" },
    { value: "INTERVIEWED", label: "Interviewed", color: "bg-purple-100 text-purple-800" },
    { value: "OFFERED", label: "Offered", color: "bg-green-100 text-green-800" },
    { value: "ACCEPTED", label: "Accepted", color: "bg-green-200 text-green-900" },
    { value: "REJECTED", label: "Rejected", color: "bg-red-100 text-red-800" },
    { value: "WITHDRAWN", label: "Withdrawn", color: "bg-gray-100 text-gray-800" },
];

export function JobApplicationsManagement() {
    const searchParams = useSearchParams();
    const jobIdFilter = searchParams.get('jobId');

    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [jobFilter, setJobFilter] = useState(jobIdFilter || "all");
    const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchApplications();
        fetchJobs();
    }, []);

    useEffect(() => {
        filterApplications();
    }, [applications, searchTerm, statusFilter, jobFilter]);

    const fetchApplications = async () => {
        try {
            const response = await fetch('/api/jobs/applications?admin=true');
            if (!response.ok) throw new Error('Failed to fetch applications');
            const data = await response.json();
            setApplications(data);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async () => {
        try {
            const response = await fetch('/api/jobs?admin=true');
            if (!response.ok) throw new Error('Failed to fetch jobs');
            const data = await response.json();
            setJobs(data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    const filterApplications = () => {
        let filtered = applications;

        if (searchTerm) {
            filtered = filtered.filter(app =>
                `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.jobPosition.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(app => app.status === statusFilter);
        }

        if (jobFilter !== "all") {
            filtered = filtered.filter(app => app.jobPosition.id === jobFilter);
        }

        setFilteredApplications(filtered);
    };

    const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
        setIsUpdating(true);
        try {
            const response = await fetch(`/api/jobs/applications/${applicationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, notes }),
            });

            if (!response.ok) {
                throw new Error('Failed to update application');
            }

            toast.success('Application updated successfully');
            fetchApplications();

            if (selectedApplication?.id === applicationId) {
                setSelectedApplication(prev => prev ? { ...prev, status, notes } : null);
            }
        } catch (error) {
            console.error('Error updating application:', error);
            toast.error('Failed to update application');
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        const statusInfo = APPLICATION_STATUSES.find(s => s.value === status);
        return statusInfo?.color || "bg-gray-100 text-gray-800";
    };

    const downloadResume = (resumeUrl: string, applicantName: string) => {
        const link = document.createElement('a');
        link.href = resumeUrl;
        link.download = `${applicantName}_Resume.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {APPLICATION_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                {status.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={jobFilter} onValueChange={setJobFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by job" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        {jobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                                {job.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Applications List */}
            <div className="grid gap-4">
                {filteredApplications.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No applications found</h3>
                            <p className="text-gray-500">
                                {searchTerm || statusFilter !== "all" || jobFilter !== "all"
                                    ? "Try adjusting your search criteria"
                                    : "No job applications have been submitted yet"
                                }
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredApplications.map((application) => (
                        <Card key={application.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">
                                            {application.firstName} {application.lastName}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Applied for: <span className="font-medium">{application.jobPosition.title}</span>
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <Badge className={getStatusBadgeColor(application.status)}>
                                                {APPLICATION_STATUSES.find(s => s.value === application.status)?.label || application.status}
                                            </Badge>
                                            <Badge variant="outline">
                                                {application.jobPosition.department}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Mail className="h-4 w-4" />
                                                {application.email}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Phone className="h-4 w-4" />
                                                {application.phone}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Applied {new Date(application.submittedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {application.resumeUrl && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => downloadResume(application.resumeUrl!, `${application.firstName}_${application.lastName}`)}
                                            >
                                                <Download className="h-4 w-4 mr-1" />
                                                Resume
                                            </Button>
                                        )}
                                        <Dialog open={isDetailDialogOpen && selectedApplication?.id === application.id}
                                            onOpenChange={(open) => {
                                                setIsDetailDialogOpen(open);
                                                if (!open) setSelectedApplication(null);
                                            }}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedApplication(application)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View Details
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                                {selectedApplication && (
                                                    <ApplicationDetailDialog
                                                        application={selectedApplication}
                                                        onStatusUpdate={updateApplicationStatus}
                                                        isUpdating={isUpdating}
                                                    />
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </CardHeader>
                            {application.coverLetter && (
                                <CardContent>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        <span className="font-medium">Cover Letter:</span> {application.coverLetter}
                                    </p>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

function ApplicationDetailDialog({
    application,
    onStatusUpdate,
    isUpdating
}: {
    application: JobApplication;
    onStatusUpdate: (id: string, status: string, notes?: string) => void;
    isUpdating: boolean;
}) {
    const [status, setStatus] = useState(application.status);
    const [notes, setNotes] = useState(application.notes || "");

    const handleStatusUpdate = () => {
        onStatusUpdate(application.id, status, notes);
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>
                    {application.firstName} {application.lastName} - {application.jobPosition.title}
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <p className="text-sm">{application.email}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-gray-700">Phone</Label>
                        <p className="text-sm">{application.phone}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-gray-700">Availability</Label>
                        <p className="text-sm">{application.availability || "Not specified"}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-gray-700">Expected Salary</Label>
                        <p className="text-sm">{application.expectedSalary || "Not specified"}</p>
                    </div>
                </div>

                {/* Resume */}
                {application.resumeUrl && (
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Resume</Label>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                        >
                            <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Resume
                            </a>
                        </Button>
                    </div>
                )}

                {/* Cover Letter */}
                {application.coverLetter && (
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Cover Letter</Label>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm whitespace-pre-line">{application.coverLetter}</p>
                        </div>
                    </div>
                )}

                {/* Experience */}
                {application.experience && (
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Experience</Label>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm whitespace-pre-line">{application.experience}</p>
                        </div>
                    </div>
                )}

                {/* Education */}
                {application.education && (
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Education</Label>
                        <p className="text-sm">{application.education}</p>
                    </div>
                )}

                {/* Status Update */}
                <div className="border-t pt-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {APPLICATION_STATUSES.map((statusOption) => (
                                        <SelectItem key={statusOption.value} value={statusOption.value}>
                                            {statusOption.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Submitted</Label>
                            <p className="text-sm">{new Date(application.submittedAt).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this application..."
                            rows={3}
                        />
                    </div>

                    <Button
                        onClick={handleStatusUpdate}
                        disabled={isUpdating}
                        className="w-full"
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update Application'
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
}
