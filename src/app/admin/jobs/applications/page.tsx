import { Metadata } from "next";
import { JobApplicationsManagement } from "@/components/admin/JobApplicationsManagement";

export const metadata: Metadata = {
    title: "Job Applications | Admin Dashboard",
    description: "Manage job applications and candidate information.",
};

export default function JobApplicationsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
                <p className="text-gray-600 mt-2">
                    Review and manage job applications from candidates.
                </p>
            </div>
            <JobApplicationsManagement />
        </div>
    );
}
