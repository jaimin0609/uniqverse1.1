import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Configure connection to iDrive e2 using S3 compatibility
 * 
 * You'll need to set these environment variables in your .env file:
 * IDRIVE_E2_ACCESS_KEY - Your iDrive e2 access key
 * IDRIVE_E2_SECRET_KEY - Your iDrive e2 secret key
 * IDRIVE_E2_ENDPOINT - Your iDrive e2 endpoint (e.g., uniqverse.u6c4.sg04.idrivee2-96.com)
 * IDRIVE_E2_REGION - Your iDrive e2 region (e.g., singapore)
 * IDRIVE_E2_BUCKET - Your iDrive e2 bucket name
 */

// Create S3 client instance for iDrive e2
export const e2Client = new S3Client({
    region: process.env.IDRIVE_E2_REGION || "singapore",
    endpoint: `https://${process.env.IDRIVE_E2_ENDPOINT || "uniqverse.u6c4.sg04.idrivee2-96.com"}`,
    credentials: {
        accessKeyId: process.env.IDRIVE_E2_ACCESS_KEY || "",
        secretAccessKey: process.env.IDRIVE_E2_SECRET_KEY || "",
    },
    forcePathStyle: true, // Required for some S3-compatible services
});

// Bucket for storing uploaded files
export const e2Bucket = process.env.IDRIVE_E2_BUCKET || "uniqverse";

// Helper function to get a pre-signed URL for private objects (valid for 24 hours)
export const getPreSignedUrl = async (key: string, expiresIn = 86400): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: e2Bucket,
        Key: key,
    });

    try {
        const url = await getSignedUrl(e2Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error("Error generating pre-signed URL:", error);
        return "";
    }
};