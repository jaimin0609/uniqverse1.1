"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface JobApplicationFormProps {
    jobId: string;
}

export function JobApplicationForm({ jobId }: JobApplicationFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeUploading, setResumeUploading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: session?.user?.email || "",
        phone: "",
        resumeUrl: "",
        coverLetter: "",
        experience: "",
        education: "",
        availability: "",
        expectedSalary: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Please upload a PDF or Word document");
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setResumeFile(file);
        setResumeUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'resumes');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const { url } = await response.json();
            setFormData(prev => ({ ...prev, resumeUrl: url }));
            toast.success("Resume uploaded successfully");
        } catch (error) {
            console.error('Resume upload error:', error);
            toast.error("Failed to upload resume. Please try again.");
            setResumeFile(null);
        } finally {
            setResumeUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session) {
            toast.error("Please sign in to apply for jobs");
            router.push('/auth/signin');
            return;
        }

        // Validate required fields
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/jobs/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobPositionId: jobId,
                    ...formData,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit application');
            }

            setIsSubmitted(true);
            toast.success("Application submitted successfully!");
        } catch (error) {
            console.error('Application submission error:', error);
            toast.error(error instanceof Error ? error.message : "Failed to submit application. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Submitted!</h3>
                <p className="text-gray-600 mb-4">
                    Thank you for your interest! We'll review your application and get back to you soon.
                </p>
                <Button
                    variant="outline"
                    onClick={() => router.push('/careers')}
                    className="w-full"
                >
                    View Other Positions
                </Button>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign In Required</h3>
                <p className="text-gray-600 mb-4">
                    Please sign in to apply for this position.
                </p>
                <Button
                    onClick={() => router.push('/auth/signin')}
                    className="w-full"
                >
                    Sign In to Apply
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        placeholder="John"
                    />
                </div>
                <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        placeholder="Doe"
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="john@example.com"
                />
            </div>

            <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+1 (555) 123-4567"
                />
            </div>

            <div>
                <Label htmlFor="resume">Resume *</Label>
                <div className="mt-1">
                    <input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                    />
                    <Label
                        htmlFor="resume"
                        className="cursor-pointer inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {resumeUploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4 mr-2" />
                        )}
                        {resumeFile ? resumeFile.name : 'Upload Resume (PDF, DOC, DOCX)'}
                    </Label>
                    {formData.resumeUrl && (
                        <p className="text-sm text-green-600 mt-1">✓ Resume uploaded successfully</p>
                    )}
                </div>
            </div>

            <div>
                <Label htmlFor="coverLetter">Cover Letter</Label>
                <Textarea
                    id="coverLetter"
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleInputChange}
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    rows={4}
                />
            </div>

            <div>
                <Label htmlFor="experience">Relevant Experience</Label>
                <Textarea
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="Describe your relevant work experience..."
                    rows={3}
                />
            </div>

            <div>
                <Label htmlFor="education">Education</Label>
                <Input
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    placeholder="Your educational background..."
                />
            </div>

            <div>
                <Label htmlFor="availability">Availability</Label>
                <Select onValueChange={(value) => handleSelectChange("availability", value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="When can you start?" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="immediately">Immediately</SelectItem>
                        <SelectItem value="2-weeks">2 weeks notice</SelectItem>
                        <SelectItem value="1-month">1 month</SelectItem>
                        <SelectItem value="2-months">2 months</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="expectedSalary">Expected Salary (Optional)</Label>
                <Input
                    id="expectedSalary"
                    name="expectedSalary"
                    value={formData.expectedSalary}
                    onChange={handleInputChange}
                    placeholder="e.g., $80,000 - $100,000"
                />
            </div>

            <Button
                type="submit"
                disabled={isSubmitting || !formData.resumeUrl}
                className="w-full"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting Application...
                    </>
                ) : (
                    'Submit Application'
                )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
                By submitting this application, you agree to our Terms of Service and Privacy Policy.
            </p>
        </form>
    );
}
