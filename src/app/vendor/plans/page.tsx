import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import VendorPlanSelector from "@/components/vendor/VendorPlanSelector";

export const metadata: Metadata = {
    title: "Vendor Plans - Uniqverse",
    description: "Choose the perfect plan for your business needs and scale as you grow",
};

export default async function VendorPlansPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/auth/login");
    }

    if (session.user.role !== "VENDOR") {
        redirect("/");
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Plans</h1>
                    <p className="text-gray-600 mt-2">
                        Choose the perfect plan for your business and unlock powerful features to grow your sales.
                    </p>
                </div>

                <VendorPlanSelector
                    isVendor={true}
                    className="mb-8"
                />

                {/* Additional information section */}
                <div className="mt-12 bg-gray-50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Why Upgrade Your Plan?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">Lower Fees</div>
                            <p className="text-sm text-gray-600">
                                Higher plans offer significantly lower commission rates, saving you money as you scale.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">More Features</div>
                            <p className="text-sm text-gray-600">
                                Advanced analytics, bulk management tools, and priority support to grow your business.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-2">Performance Bonuses</div>
                            <p className="text-sm text-gray-600">
                                Earn up to 1.5% additional bonuses based on your customer satisfaction and performance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
