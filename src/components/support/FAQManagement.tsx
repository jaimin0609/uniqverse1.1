"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

type FAQ = {
    id: string;
    question: string;
    answer: string;
    category: string;
};

interface FAQManagementProps {
    initialFAQs?: FAQ[];
    categories: string[];
}

export default function FAQManagement({
    initialFAQs = [],
    categories = ["General", "Orders", "Shipping", "Returns", "Accounts", "Products"],
}: FAQManagementProps) {
    const [faqs, setFaqs] = useState<FAQ[]>(initialFAQs);
    const [isSaving, setIsSaving] = useState(false);

    const addNewFAQ = () => {
        const newFAQ: FAQ = {
            id: `faq_${Date.now()}`,
            question: "",
            answer: "",
            category: categories[0],
        };
        setFaqs([...faqs, newFAQ]);
    };

    const removeFAQ = (id: string) => {
        setFaqs(faqs.filter((faq) => faq.id !== id));
    };

    const updateFAQ = (id: string, field: keyof FAQ, value: string) => {
        setFaqs(
            faqs.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq))
        );
    };

    const saveFAQs = async () => {
        // Validate FAQs before saving
        const invalidFAQs = faqs.filter(
            (faq) => !faq.question.trim() || !faq.answer.trim()
        );

        if (invalidFAQs.length > 0) {
            toast.error("Please complete all FAQ fields before saving");
            return;
        }

        setIsSaving(true);

        try {
            // Here you would call your API to save the FAQs
            // For now, we'll simulate a successful API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            toast.success("FAQs saved successfully");
        } catch (error) {
            console.error("Error saving FAQs:", error);
            toast.error("Failed to save FAQs. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Manage FAQs</h2>
                <Button onClick={addNewFAQ}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New FAQ
                </Button>
            </div>

            <div className="space-y-6">
                {faqs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No FAQs available. Add your first FAQ to get started.</p>
                        <Button onClick={addNewFAQ} className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Add First FAQ
                        </Button>
                    </div>
                ) : (
                    faqs.map((faq) => (
                        <div
                            key={faq.id}
                            className="bg-white p-6 rounded-lg border border-gray-200"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor={`question-${faq.id}`}
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Question
                                        </label>
                                        <Input
                                            id={`question-${faq.id}`}
                                            value={faq.question}
                                            onChange={(e) =>
                                                updateFAQ(faq.id, "question", e.target.value)
                                            }
                                            placeholder="Enter FAQ question"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor={`answer-${faq.id}`}
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Answer
                                        </label>
                                        <Textarea
                                            id={`answer-${faq.id}`}
                                            value={faq.answer}
                                            onChange={(e) =>
                                                updateFAQ(faq.id, "answer", e.target.value)
                                            }
                                            placeholder="Enter FAQ answer"
                                            className="h-24"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor={`category-${faq.id}`}
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Category
                                        </label>
                                        <select
                                            id={`category-${faq.id}`}
                                            value={faq.category}
                                            onChange={(e) =>
                                                updateFAQ(faq.id, "category", e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {categories.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex md:flex-col justify-end gap-2">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeFAQ(faq.id)}
                                        title="Remove FAQ"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {faqs.length > 0 && (
                <div className="flex justify-end">
                    <Button onClick={saveFAQs} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save FAQs
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}