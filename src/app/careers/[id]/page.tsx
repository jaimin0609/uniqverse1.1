import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobApplicationForm } from "@/components/careers/JobApplicationForm";
import { db } from "@/lib/db";
import { MapPin, Clock, Briefcase, DollarSign, Calendar } from "lucide-react";

interface JobDetailPageProps {
    params: { id: string };
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
    const job = await getJob(params.id);

    if (!job) {
        return {
            title: "Job Not Found | Uniqverse",
            description: "The job position you're looking for could not be found.",
        };
    }

    return {
        title: `${job.title} - ${job.department} | Uniqverse Careers`,
        description: job.description.substring(0, 155) + "...",
    };
}

async function getJob(id: string) {
    try {
        const job = await db.jobPosition.findUnique({
            where: {
                id,
                isPublished: true,
                OR: [
                    { closingDate: null },
                    { closingDate: { gte: new Date() } }
                ]
            },
        });
        return job;
    } catch (error) {
        console.error("Error fetching job:", error);
        return null;
    }
}

function formatJobType(type: string) {
    return type.replace('_', ' ');
}

function formatSalary(min?: number | null, max?: number | null) {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return null;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
    const job = await getJob(params.id);

    if (!job) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Job Header */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>

                                <div className="flex flex-wrap gap-4 mb-6">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Briefcase className="h-5 w-5" />
                                        <span>{job.department}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin className="h-5 w-5" />
                                        <span>{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Clock className="h-5 w-5" />
                                        <span>{formatJobType(job.type)}</span>
                                    </div>
                                    {formatSalary(job.salaryMin, job.salaryMax) && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <DollarSign className="h-5 w-5" />
                                            <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                                        </div>
                                    )}
                                    {job.closingDate && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="h-5 w-5" />
                                            <span>Apply by {new Date(job.closingDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Job Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Description */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Job Description</h2>
                                <div className="prose prose-gray max-w-none">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                        {job.description}
                                    </p>
                                </div>
                            </div>

                            {/* Requirements */}
                            {job.requirements && job.requirements.length > 0 && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Requirements</h2>
                                    <ul className="space-y-2">
                                        {job.requirements.map((requirement, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                                <span className="text-gray-700">{requirement}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Benefits */}
                            {job.benefits && job.benefits.length > 0 && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Benefits</h2>
                                    <ul className="space-y-2">
                                        {job.benefits.map((benefit, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                                                <span className="text-gray-700">{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Application Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Apply for this Position</h2>
                                <JobApplicationForm jobId={job.id} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
