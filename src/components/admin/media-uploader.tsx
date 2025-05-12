"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface MediaUploaderProps {
    value: string;
    onChange: (value: string) => void;
    accept?: string;
    maxFiles?: number;
}

export function MediaUploader({
    value,
    onChange,
    accept = "*/*",
    maxFiles = 1,
}: MediaUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (files.length > maxFiles) {
            setError(`You can only upload ${maxFiles} file(s) at a time`);
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // This is a simplified implementation - in a real app, you'd upload to a server
            // For now, we'll just use a URL.createObjectURL as a placeholder
            const urls = Array.from(files).map(file => URL.createObjectURL(file));
            onChange(urls[0]); // Just take the first one for now
        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const handleClear = () => {
        onChange("");
    };

    return (
        <div className="space-y-4">
            {value ? (
                <div className="relative rounded-md overflow-hidden border bg-background">
                    {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <div className="relative aspect-video w-full">
                            <Image
                                src={value}
                                alt="Uploaded media"
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-4 aspect-video bg-muted">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                    )}
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleClear}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center bg-muted/50">
                    <div className="mb-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-sm text-center mb-4">
                        <p className="font-medium">Drag and drop or click to upload</p>
                        <p className="text-muted-foreground">
                            Upload media files (max {maxFiles})
                        </p>
                    </div>
                    <Label htmlFor="media-upload" className="cursor-pointer">
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={isUploading}
                            className="cursor-pointer"
                        >
                            {isUploading ? "Uploading..." : "Select File"}
                        </Button>
                        <Input
                            id="media-upload"
                            type="file"
                            accept={accept}
                            onChange={handleUpload}
                            disabled={isUploading}
                            className="hidden"
                            multiple={maxFiles > 1}
                        />
                    </Label>
                    {error && <p className="text-destructive text-sm mt-2">{error}</p>}
                </div>
            )}
        </div>
    );
}
