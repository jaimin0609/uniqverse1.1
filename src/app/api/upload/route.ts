import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { e2Client, e2Bucket, getPreSignedUrl } from "@/lib/idrive-e2";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Process the uploaded file
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const folder = formData.get("folder") as string || "general";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "File type not supported. Only JPEG, PNG, WEBP, and GIF are allowed." },
                { status: 400 }
            );
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File size exceeds 5MB limit" },
                { status: 400 }
            );
        }

        // Generate a unique filename
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        const uniqueId = uuidv4();
        const fileName = `${uniqueId}.${fileExtension}`;

        // Define the folder structure in iDrive e2 based on user role and folder
        const userRole = session.user.role?.toLowerCase() || "user";
        const folderPath = `${folder}/${userRole}/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
        const key = `${folderPath}/${fileName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

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

        // Create a media record in the database with the key for future reference
        const media = await db.media.create({
            data: {
                id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                filename: fileName,
                originalFilename: file.name,
                // Store both the key and the pre-signed URL
                url: preSignedUrl,
                // Add the object key so we can generate new URLs later
                alt: key, // Using alt field to store the object key
                filesize: file.size,
                mimetype: file.type,
                userId: session.user.id,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            url: preSignedUrl,
            id: media.id,
            name: media.filename,
            key: key, // Return the object key for reference
        });
    } catch (error) {
        console.error("Error uploading file to iDrive e2:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
