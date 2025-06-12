import { Metadata } from "next";
import { JobsManagement } from "@/components/admin/JobsManagement";

export const metadata: Metadata = {
    title: "Job Management | Admin Dashboard",
    description: "Manage job positions and applications for Uniqverse careers page.",
};

export default function JobsManagementPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
                <p className="text-gray-600 mt-2">
                    Manage job positions and view applications for your careers page.
                </p>
            </div>
            <JobsManagement />
        </div>
    );
}
