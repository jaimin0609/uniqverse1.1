import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { e2Client, e2Bucket, getPreSignedUrl } from "@/lib/idrive-e2";
import { checkUploadEnvironment, createUploadErrorResponse } from "@/lib/upload-utils";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check upload environment configuration
        const envConfig = checkUploadEnvironment();

        if (!envConfig.hasIDriveConfig && !envConfig.hasAWSConfig && !envConfig.hasLocalConfig) {
            console.error("No upload configuration found:", envConfig.recommendation);
            return NextResponse.json({
                error: "Upload service not configured",
                details: envConfig.recommendation,
                suggestion: "Please contact administrator to configure file upload service"
            }, { status: 503 });
        }

        // Process the uploaded file
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const folder = formData.get("folder") as string || "general";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type based on folder
        let validTypes: string[];
        let errorMessage: string;

        if (folder === "resumes") {
            validTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ];
            errorMessage = "File type not supported. Only PDF, DOC, and DOCX are allowed for resumes.";
        } else {
            validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
            errorMessage = "File type not supported. Only JPEG, PNG, WEBP, and GIF are allowed.";
        }

        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: errorMessage },
                { status: 400 }
            );
        }

        // Validate file size based on folder
        let maxSize: number;
        let sizeErrorMessage: string;

        if (folder === "resumes") {
            maxSize = 10 * 1024 * 1024; // 10MB for resumes
            sizeErrorMessage = "File size exceeds 10MB limit";
        } else {
            maxSize = 5 * 1024 * 1024; // 5MB for images
            sizeErrorMessage = "File size exceeds 5MB limit";
        }

        if (file.size > maxSize) {
            return NextResponse.json(
                { error: sizeErrorMessage },
                { status: 400 }
            );
        }

        // Generate a unique filename
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        const uniqueId = uuidv4();

        // For resumes, preserve a more descriptive filename structure
        let fileName: string;
        if (folder === "resumes") {
            const timestamp = Date.now();
            fileName = `resume_${timestamp}_${uniqueId}.${fileExtension}`;
        } else {
            fileName = `${uniqueId}.${fileExtension}`;
        }

        // Define the folder structure based on user role and folder
        const userRole = session.user.role?.toLowerCase() || "user";
        const folderPath = `${folder}/${userRole}/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
        const key = `${folderPath}/${fileName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let uploadUrl: string;
        let mediaRecord: any;

        // Try iDrive e2 first if configured
        if (envConfig.hasIDriveConfig) {
            try {
                // Upload to iDrive e2
                const uploadParams = {
                    Bucket: e2Bucket,
                    Key: key,
                    Body: buffer,
                    ContentType: file.type,
                };

                await e2Client.send(new PutObjectCommand(uploadParams));

                // Generate pre-signed URL for the uploaded file (valid for 24 hours)
                const preSignedUrl = await getPreSignedUrl(key, 86400);

                if (!preSignedUrl) {
                    throw new Error("Failed to generate pre-signed URL");
                }

                uploadUrl = preSignedUrl;

                // Create a media record in the database
                mediaRecord = await db.media.create({
                    data: {
                        id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        filename: fileName,
                        originalFilename: file.name,
                        url: uploadUrl,
                        alt: key, // Store the object key for future reference
                        filesize: file.size,
                        mimetype: file.type,
                        userId: session.user.id,
                        updatedAt: new Date(),
                    },
                });

            } catch (error) {
                console.error("iDrive e2 upload failed:", error);
                return createUploadErrorResponse(`iDrive e2 upload failed: ${error}`);
            }
        } else {
            // Fallback: create a placeholder URL for development
            // In production, you should configure proper file storage
            uploadUrl = `https://via.placeholder.com/400x300/cccccc/666666?text=${encodeURIComponent(file.name)}`;

            mediaRecord = await db.media.create({
                data: {
                    id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    filename: fileName,
                    originalFilename: file.name,
                    url: uploadUrl,
                    alt: `placeholder-${fileName}`,
                    filesize: file.size,
                    mimetype: file.type,
                    userId: session.user.id,
                    updatedAt: new Date(),
                },
            });

            console.warn("Using placeholder image URL - configure iDrive e2 or AWS S3 for production");
        }

        return NextResponse.json({
            url: uploadUrl,
            id: mediaRecord.id,
            name: mediaRecord.filename,
            key: key,
            isPlaceholder: !envConfig.hasIDriveConfig && !envConfig.hasAWSConfig
        });
    } catch (error) {
        console.error("Error in upload API:", error);
        return createUploadErrorResponse(`Upload failed: ${error}`);
    }
}
