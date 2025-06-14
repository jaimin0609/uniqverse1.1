import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export interface CloudinaryUploadOptions {
    folder?: string;
    public_id?: string;
    transformation?: {
        width?: number;
        height?: number;
        crop?: string;
        quality?: string | number;
        fetch_format?: string;
        flags?: string;
    };
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    format?: string;
}

export interface CloudinaryUploadResult {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    secure_url: string;
    url: string;
    bytes: number;
}

/**
 * Upload buffer to Cloudinary
 */
export async function uploadToCloudinary(
    buffer: Buffer,
    filename: string,
    options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            public_id: options.public_id || filename.split('.')[0],
            folder: options.folder || 'uploads',
            resource_type: options.resource_type || 'auto',
            format: options.format,
            transformation: options.transformation,
            overwrite: true,
            invalidate: true
        };

        cloudinary.uploader.upload_stream(
            uploadOptions as any,
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result as CloudinaryUploadResult);
                }
            }
        ).end(buffer);
    });
}

/**
 * Upload file from URL to Cloudinary
 */
export async function uploadFromUrlToCloudinary(
    url: string,
    options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
    const uploadOptions = {
        folder: options.folder || 'uploads',
        resource_type: options.resource_type || 'auto',
        transformation: options.transformation,
        overwrite: true,
        invalidate: true
    };

    return cloudinary.uploader.upload(url, uploadOptions);
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
}

/**
 * Generate optimized image URL
 */
export function generateOptimizedUrl(
    publicId: string,
    options: {
        width?: number;
        height?: number;
        quality?: string | number;
        format?: string;
        crop?: string;
    } = {}
): string {
    return cloudinary.url(publicId, {
        secure: true,
        ...options
    });
}

/**
 * Generate responsive image URLs
 */
export function generateResponsiveUrls(
    publicId: string,
    sizes: number[] = [300, 600, 1200]
): Array<{ width: number; url: string }> {
    return sizes.map(width => ({
        width,
        url: generateOptimizedUrl(publicId, {
            width,
            quality: 'auto',
            format: 'auto',
            crop: 'fill'
        })
    }));
}
