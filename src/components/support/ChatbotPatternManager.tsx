"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Plus,
    Trash2,
    MessageSquare,
    Save,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type ChatPattern = {
    id: string;
    patterns: string[];
    response: string;
};

export default function ChatbotPatternManager() {
    const [chatPatterns, setChatPatterns] = useState<ChatPattern[]>([]);
    const [fallbackResponses, setFallbackResponses] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    // Link dialog state
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [linkText, setLinkText] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [activeResponseId, setActiveResponseId] = useState<string | null>(null);
    const [activeFallbackIndex, setActiveFallbackIndex] = useState<number | null>(null);

    // Load initial data from the database
    useEffect(() => {
        const fetchPatterns = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/support/chatbot');

                if (!response.ok) {
                    throw new Error('Failed to fetch patterns');
                }

                const data = await response.json();

                if (data.success && data.data) {
                    // Transform database patterns to our format
                    const loadedPatterns = data.data.patterns.map((pattern: any) => ({
                        id: pattern.id,
                        patterns: pattern.triggers.map((trigger: any) => trigger.phrase),
                        response: pattern.response
                    }));

                    // Get fallback responses
                    const loadedFallbacks = data.data.fallbacks.map((fallback: any) => fallback.response);

                    setChatPatterns(loadedPatterns);
                    setFallbackResponses(loadedFallbacks.length > 0 ? loadedFallbacks : [""]);
                }
            } catch (error) {
                console.error('Error fetching patterns:', error);
                toast.error("Failed to load chatbot patterns. Please refresh the page.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatterns();
    }, []);

    const addNewPattern = () => {
        const newPattern: ChatPattern = {
            id: `temp_${Date.now()}`,
            patterns: [""],
            response: ""
        };
        setChatPatterns([...chatPatterns, newPattern]);
    };

    const removePattern = (id: string) => {
        setChatPatterns(chatPatterns.filter(pattern => pattern.id !== id));
    };

    const updatePatternText = (id: string, index: number, value: string) => {
        setChatPatterns(chatPatterns.map(pattern => {
            if (pattern.id === id) {
                const newPatterns = [...pattern.patterns];
                newPatterns[index] = value;
                return { ...pattern, patterns: newPatterns };
            }
            return pattern;
        }));
    };

    const addPatternText = (id: string) => {
        setChatPatterns(chatPatterns.map(pattern => {
            if (pattern.id === id) {
                return { ...pattern, patterns: [...pattern.patterns, ""] };
            }
            return pattern;
        }));
    };

    const removePatternText = (id: string, index: number) => {
        setChatPatterns(chatPatterns.map(pattern => {
            if (pattern.id === id) {
                const newPatterns = [...pattern.patterns];
                newPatterns.splice(index, 1);
                return { ...pattern, patterns: newPatterns };
            }
            return pattern;
        }));
    };

    const updateResponse = (id: string, value: string) => {
        setChatPatterns(chatPatterns.map(pattern => {
            if (pattern.id === id) {
                return { ...pattern, response: value };
            }
            return pattern;
        }));
    };

    const addFallbackResponse = () => {
        setFallbackResponses([...fallbackResponses, ""]);
    };

    const updateFallbackResponse = (index: number, value: string) => {
        const newFallbacks = [...fallbackResponses];
        newFallbacks[index] = value;
        setFallbackResponses(newFallbacks);
    };

    const removeFallbackResponse = (index: number) => {
        const newFallbacks = [...fallbackResponses];
        newFallbacks.splice(index, 1);
        setFallbackResponses(newFallbacks);
    };

    const movePatternUp = (index: number) => {
        if (index === 0) return;
        const newPatterns = [...chatPatterns];
        [newPatterns[index - 1], newPatterns[index]] = [newPatterns[index], newPatterns[index - 1]];
        setChatPatterns(newPatterns);
    };

    const movePatternDown = (index: number) => {
        if (index === chatPatterns.length - 1) return;
        const newPatterns = [...chatPatterns];
        [newPatterns[index], newPatterns[index + 1]] = [newPatterns[index + 1], newPatterns[index]];
        setChatPatterns(newPatterns);
    };

    const saveChanges = async () => {
        // Validate patterns
        const emptyPatterns = chatPatterns.filter(
            pattern => pattern.patterns.some(p => !p.trim()) || !pattern.response.trim()
        );

        if (emptyPatterns.length > 0) {
            toast.error("Some patterns or responses are empty. Please fill all fields before saving.");
            return;
        }

        // Validate fallbacks
        if (fallbackResponses.some(response => !response.trim())) {
            toast.error("Some fallback responses are empty. Please fill all fields before saving.");
            return;
        }

        setIsSaving(true);

        try {
            // Save to the database via API
            const response = await fetch('/api/support/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatPatterns,
                    fallbackResponses,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save patterns');
            }

            const data = await response.json();

            if (data.success) {
                toast.success("Chatbot patterns saved successfully!");
                setShowSuccessMessage(true);
                setTimeout(() => setShowSuccessMessage(false), 3000);
            } else {
                throw new Error(data.error || 'Unknown error occurred');
            }
        } catch (error) {
            console.error("Error saving patterns:", error);
            toast.error("Failed to save chatbot patterns. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-6 w-6 mr-2 animate-spin" />
                <p>Loading chatbot patterns...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Chatbot Pattern Management</h2>
                <div className="flex gap-2">
                    <Button onClick={addNewPattern} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Pattern
                    </Button>
                    <Button onClick={saveChanges} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {showSuccessMessage && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-green-800">Changes Saved Successfully</h3>
                        <p className="text-green-700 text-sm mt-1">
                            Your chatbot patterns have been updated. The changes will be reflected in the chatbot responses.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-medium text-amber-800">Important Information</h3>
                    <p className="text-amber-700 text-sm mt-1">
                        The order of patterns matters! The chatbot checks patterns from top to bottom and uses the first match.
                        Use the up/down arrows to adjust pattern priority.
                    </p>
                    <p className="text-amber-700 text-sm mt-1">
                        You can use markdown-style links in your responses, like [support page](/support), to create clean, clickable links.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="patterns" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="patterns" className="text-base py-3">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Response Patterns
                    </TabsTrigger>
                    <TabsTrigger value="fallbacks" className="text-base py-3">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Fallback Responses
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="patterns" className="space-y-6">
                    {chatPatterns.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No patterns defined. Add your first pattern to get started.</p>
                            <Button onClick={addNewPattern} className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Pattern
                            </Button>
                        </div>
                    ) : (
                        chatPatterns.map((pattern, patternIndex) => (
                            <div
                                key={pattern.id}
                                className="bg-white p-6 rounded-lg border border-gray-200 relative"
                            >
                                <div className="absolute right-2 top-2 flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => movePatternUp(patternIndex)}
                                        disabled={patternIndex === 0}
                                        className="h-8 w-8"
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => movePatternDown(patternIndex)}
                                        disabled={patternIndex === chatPatterns.length - 1}
                                        className="h-8 w-8"
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removePattern(pattern.id)}
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="pr-20">
                                    <h3 className="text-lg font-medium mb-4">Pattern #{patternIndex + 1}</h3>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Trigger Phrases/Keywords
                                            </label>
                                            <p className="text-sm text-gray-500 mb-2">
                                                Enter words or phrases that should trigger this response
                                            </p>

                                            {pattern.patterns.map((text, index) => (
                                                <div key={index} className="flex gap-2 mb-2">
                                                    <Input
                                                        value={text}
                                                        onChange={(e) => updatePatternText(pattern.id, index, e.target.value)}
                                                        placeholder="e.g., shipping, delivery time"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => removePatternText(pattern.id, index)}
                                                        disabled={pattern.patterns.length === 1}
                                                        className="flex-shrink-0"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addPatternText(pattern.id)}
                                                className="mt-2"
                                            >
                                                <Plus className="h-3 w-3 mr-2" />
                                                Add Another Phrase
                                            </Button>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Response
                                                </label>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={() => {
                                                        setActiveResponseId(pattern.id);
                                                        setActiveFallbackIndex(null);
                                                        setLinkText("");
                                                        setLinkUrl("");
                                                        setIsLinkDialogOpen(true);
                                                    }}
                                                >
                                                    <LinkIcon className="h-3 w-3 mr-1" />
                                                    Add Link
                                                </Button>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-2">
                                                The response the chatbot will give when this pattern is matched.
                                            </p>
                                            <Textarea
                                                value={pattern.response}
                                                onChange={(e) => updateResponse(pattern.id, e.target.value)}
                                                placeholder="Enter the response message..."
                                                className="h-24"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {chatPatterns.length > 0 && (
                        <Button onClick={addNewPattern} variant="outline" className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Pattern
                        </Button>
                    )}
                </TabsContent>

                <TabsContent value="fallbacks" className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium mb-4">Fallback Responses</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            These responses are used when no pattern matches the user's input. The system will randomly select one of these responses.
                        </p>

                        {fallbackResponses.map((response, index) => (
                            <div key={index} className="mb-3">
                                <div className="flex justify-end mb-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => {
                                            setActiveResponseId(null);
                                            setActiveFallbackIndex(index);
                                            setLinkText("");
                                            setLinkUrl("");
                                            setIsLinkDialogOpen(true);
                                        }}
                                    >
                                        <LinkIcon className="h-3 w-3 mr-1" />
                                        Add Link
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Textarea
                                        value={response}
                                        onChange={(e) => updateFallbackResponse(index, e.target.value)}
                                        placeholder="Enter a fallback response..."
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => removeFallbackResponse(index)}
                                        disabled={fallbackResponses.length <= 1}
                                        className="flex-shrink-0 self-start"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addFallbackResponse}
                            className="mt-2"
                        >
                            <Plus className="h-3 w-3 mr-2" />
                            Add Fallback Response
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Link Insert Dialog */}
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Insert Link</DialogTitle>
                        <DialogDescription>
                            Add a clickable link to your chatbot response.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="linkText" className="text-right text-sm font-medium">
                                Link Text
                            </label>
                            <Input
                                id="linkText"
                                value={linkText}
                                onChange={(e) => setLinkText(e.target.value)}
                                className="col-span-3"
                                placeholder="Click here"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="linkUrl" className="text-right text-sm font-medium">
                                URL
                            </label>
                            <Input
                                id="linkUrl"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="col-span-3"
                                placeholder="/support or https://example.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            if (!linkText || !linkUrl) {
                                toast.error("Both link text and URL are required");
                                return;
                            }

                            // Format the link in markdown style
                            const formattedLink = `[${linkText}](${linkUrl})`;

                            // Insert into the appropriate response
                            if (activeResponseId) {
                                // Insert into a pattern response
                                setChatPatterns(patterns =>
                                    patterns.map(p => {
                                        if (p.id === activeResponseId) {
                                            return { ...p, response: p.response + formattedLink };
                                        }
                                        return p;
                                    })
                                );
                            } else if (activeFallbackIndex !== null) {
                                // Insert into a fallback response
                                const newFallbacks = [...fallbackResponses];
                                newFallbacks[activeFallbackIndex] += formattedLink;
                                setFallbackResponses(newFallbacks);
                            }

                            setIsLinkDialogOpen(false);
                            toast.success("Link added successfully");
                        }}>
                            Insert Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}