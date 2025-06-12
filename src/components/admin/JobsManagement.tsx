"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    Plus,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Search,
    Calendar,
    MapPin,
    Briefcase,
    Users,
    Clock,
    DollarSign,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface JobPosition {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
    requirements: string[];
    benefits: string[];
    salaryMin?: number;
    salaryMax?: number;
    isPublished: boolean;
    closingDate?: string;
    createdAt: string;
    updatedAt: string;
    _count: {
        applications: number;
    };
}

const JOB_TYPES = [
    { value: "FULL_TIME", label: "Full Time" },
    { value: "PART_TIME", label: "Part Time" },
    { value: "CONTRACT", label: "Contract" },
    { value: "INTERNSHIP", label: "Internship" },
    { value: "REMOTE", label: "Remote" },
];

export function JobsManagement() {
    const [jobs, setJobs] = useState<JobPosition[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<JobPosition[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<JobPosition | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        department: "",
        location: "",
        type: "",
        description: "",
        requirements: [""],
        benefits: [""],
        salaryMin: "",
        salaryMax: "",
        closingDate: "",
        isPublished: false,
    });

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        filterJobs();
    }, [jobs, searchTerm, statusFilter]);

    const fetchJobs = async () => {
        try {
            const response = await fetch('/api/jobs?admin=true');
            if (!response.ok) throw new Error('Failed to fetch jobs');
            const data = await response.json();
            setJobs(data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const filterJobs = () => {
        let filtered = jobs;

        if (searchTerm) {
            filtered = filtered.filter(job =>
                job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(job => {
                if (statusFilter === "published") return job.isPublished;
                if (statusFilter === "draft") return !job.isPublished;
                if (statusFilter === "expired") return job.closingDate && new Date(job.closingDate) < new Date();
                return true;
            });
        }

        setFilteredJobs(filtered);
    };

    const resetForm = () => {
        setFormData({
            title: "",
            department: "",
            location: "",
            type: "",
            description: "",
            requirements: [""],
            benefits: [""],
            salaryMin: "",
            salaryMax: "",
            closingDate: "",
            isPublished: false,
        });
        setEditingJob(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayInput = (name: "requirements" | "benefits", index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: prev[name].map((item, i) => i === index ? value : item)
        }));
    };

    const addArrayItem = (name: "requirements" | "benefits") => {
        setFormData(prev => ({
            ...prev,
            [name]: [...prev[name], ""]
        }));
    };

    const removeArrayItem = (name: "requirements" | "benefits", index: number) => {
        setFormData(prev => ({
            ...prev,
            [name]: prev[name].filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!formData.title || !formData.department || !formData.location || !formData.type || !formData.description) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Filter out empty requirements and benefits
        const cleanedData = {
            ...formData,
            requirements: formData.requirements.filter(req => req.trim() !== ""),
            benefits: formData.benefits.filter(benefit => benefit.trim() !== ""),
            salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
            salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
            closingDate: formData.closingDate || undefined,
        };

        try {
            const url = editingJob ? `/api/jobs/${editingJob.id}` : '/api/jobs';
            const method = editingJob ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save job');
            }

            toast.success(editingJob ? 'Job updated successfully' : 'Job created successfully');
            setIsCreateDialogOpen(false);
            resetForm();
            fetchJobs();
        } catch (error) {
            console.error('Error saving job:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to save job');
        }
    };

    const handleEdit = (job: JobPosition) => {
        setFormData({
            title: job.title,
            department: job.department,
            location: job.location,
            type: job.type,
            description: job.description,
            requirements: job.requirements.length > 0 ? job.requirements : [""],
            benefits: job.benefits.length > 0 ? job.benefits : [""],
            salaryMin: job.salaryMin?.toString() || "",
            salaryMax: job.salaryMax?.toString() || "",
            closingDate: job.closingDate ? new Date(job.closingDate).toISOString().split('T')[0] : "",
            isPublished: job.isPublished,
        });
        setEditingJob(job);
        setIsCreateDialogOpen(true);
    };

    const handleDelete = async (jobId: string) => {
        if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`/api/jobs/${jobId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete job');
            }

            toast.success('Job deleted successfully');
            fetchJobs();
        } catch (error) {
            console.error('Error deleting job:', error);
            toast.error('Failed to delete job');
        }
    };

    const togglePublishStatus = async (job: JobPosition) => {
        try {
            const response = await fetch(`/api/jobs/${job.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: !job.isPublished }),
            });

            if (!response.ok) {
                throw new Error('Failed to update job status');
            }

            toast.success(`Job ${!job.isPublished ? 'published' : 'unpublished'} successfully`);
            fetchJobs();
        } catch (error) {
            console.error('Error updating job status:', error);
            toast.error('Failed to update job status');
        }
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
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search jobs..."
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
                            <SelectItem value="all">All Jobs</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Job
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingJob ? 'Edit Job Position' : 'Create New Job Position'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="title">Job Title *</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="department">Department *</Label>
                                    <Input
                                        id="department"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="location">Location *</Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="type">Job Type *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => handleSelectChange("type", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select job type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {JOB_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows={4}
                                />
                            </div>

                            <div>
                                <Label>Requirements</Label>
                                {formData.requirements.map((req, index) => (
                                    <div key={index} className="flex gap-2 mt-2">
                                        <Input
                                            value={req}
                                            onChange={(e) => handleArrayInput("requirements", index, e.target.value)}
                                            placeholder="Enter requirement"
                                        />
                                        {formData.requirements.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeArrayItem("requirements", index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addArrayItem("requirements")}
                                    className="mt-2"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Requirement
                                </Button>
                            </div>

                            <div>
                                <Label>Benefits</Label>
                                {formData.benefits.map((benefit, index) => (
                                    <div key={index} className="flex gap-2 mt-2">
                                        <Input
                                            value={benefit}
                                            onChange={(e) => handleArrayInput("benefits", index, e.target.value)}
                                            placeholder="Enter benefit"
                                        />
                                        {formData.benefits.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeArrayItem("benefits", index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addArrayItem("benefits")}
                                    className="mt-2"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Benefit
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="salaryMin">Minimum Salary</Label>
                                    <Input
                                        id="salaryMin"
                                        name="salaryMin"
                                        type="number"
                                        value={formData.salaryMin}
                                        onChange={handleInputChange}
                                        placeholder="50000"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="salaryMax">Maximum Salary</Label>
                                    <Input
                                        id="salaryMax"
                                        name="salaryMax"
                                        type="number"
                                        value={formData.salaryMax}
                                        onChange={handleInputChange}
                                        placeholder="80000"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="closingDate">Closing Date</Label>
                                <Input
                                    id="closingDate"
                                    name="closingDate"
                                    type="date"
                                    value={formData.closingDate}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isPublished"
                                    checked={formData.isPublished}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                                    className="rounded border-gray-300"
                                />
                                <Label htmlFor="isPublished">Publish immediately</Label>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" className="flex-1">
                                    {editingJob ? 'Update Job' : 'Create Job'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Jobs Grid */}
            <div className="grid gap-6">
                {filteredJobs.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No jobs found</h3>
                            <p className="text-gray-500 mb-4">
                                {searchTerm || statusFilter !== "all"
                                    ? "Try adjusting your search criteria"
                                    : "Create your first job position to get started"
                                }
                            </p>
                            {!searchTerm && statusFilter === "all" && (
                                <Button onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Job
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    filteredJobs.map((job) => (
                        <Card key={job.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <Badge variant={job.isPublished ? "default" : "secondary"}>
                                                {job.isPublished ? "Published" : "Draft"}
                                            </Badge>
                                            <Badge variant="outline">{job.type.replace('_', ' ')}</Badge>
                                            {job.closingDate && new Date(job.closingDate) < new Date() && (
                                                <Badge variant="destructive">Expired</Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Briefcase className="h-4 w-4" />
                                                {job.department}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {job.location}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {job._count.applications} applications
                                            </div>
                                            {job.closingDate && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    Closes {new Date(job.closingDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => togglePublishStatus(job)}
                                        >
                                            {job.isPublished ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(job)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(job.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button asChild size="sm">
                                            <Link href={`/admin/jobs/applications?jobId=${job.id}`}>
                                                View Applications
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                                {(job.salaryMin || job.salaryMax) && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <DollarSign className="h-4 w-4" />
                                        {job.salaryMin && job.salaryMax
                                            ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                                            : job.salaryMin
                                                ? `From $${job.salaryMin.toLocaleString()}`
                                                : `Up to $${job.salaryMax?.toLocaleString()}`
                                        }
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
