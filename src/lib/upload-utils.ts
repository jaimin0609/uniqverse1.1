// Environment checker utility for upload functionality
import { NextResponse } from "next/server";

interface EnvironmentConfig {
    hasIDriveConfig: boolean;
    hasAWSConfig: boolean;
    hasLocalConfig: boolean;
    recommendation: string;
}

export function checkUploadEnvironment(): EnvironmentConfig {
    const hasIDriveConfig = !!(
        process.env.IDRIVE_E2_ACCESS_KEY &&
        process.env.IDRIVE_E2_SECRET_KEY &&
        process.env.IDRIVE_E2_ENDPOINT &&
        process.env.IDRIVE_E2_BUCKET
    );

    const hasAWSConfig = !!(
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_REGION &&
        process.env.AWS_S3_BUCKET
    );

    const hasLocalConfig = !!(
        process.env.UPLOAD_DIR
    );

    let recommendation = "";

    if (!hasIDriveConfig && !hasAWSConfig && !hasLocalConfig) {
        recommendation = "No upload configuration found. Please set up iDrive E2, AWS S3, or local storage.";
    } else if (hasIDriveConfig) {
        recommendation = "Using iDrive E2 for file uploads.";
    } else if (hasAWSConfig) {
        recommendation = "Using AWS S3 for file uploads.";
    } else if (hasLocalConfig) {
        recommendation = "Using local storage for file uploads.";
    }

    return {
        hasIDriveConfig,
        hasAWSConfig,
        hasLocalConfig,
        recommendation
    };
}

export function createUploadErrorResponse(error: string): NextResponse {
    console.error("Upload error:", error);

    const envCheck = checkUploadEnvironment();

    return NextResponse.json({
        error: "Failed to upload file",
        details: error,
        configuration: envCheck
    }, { status: 500 });
}
