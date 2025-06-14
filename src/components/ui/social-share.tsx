'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, Facebook, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface SocialShareProps {
    title: string;
    description?: string;
    url?: string;
    image?: string;
    hashtags?: string[];
    className?: string;
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SocialShare({
    title,
    description,
    url,
    image,
    hashtags = [],
    className = '',
    variant = 'ghost',
    size = 'sm'
}: SocialShareProps) {
    const [copied, setCopied] = useState(false);
    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    // Use current URL if none provided
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareText = description || title;
    const hashtagText = hashtags.length > 0 ? hashtags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ') : '';

    // Native Web Share API
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    // Fallback to copy to clipboard
                    handleCopyLink();
                }
            }
        } else {
            handleCopyLink();
        }
    };    // Copy link to clipboard
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Link copied to clipboard!');

            // Clear any existing timeout
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }

            copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
            toast.error('Failed to copy link');
        }
    };

    // Social media sharing URLs
    const socialUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}&hashtags=${encodeURIComponent(hashtagText.replace(/#/g, ''))}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(title)}${image ? `&media=${encodeURIComponent(image)}` : ''}`,
        reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`
    };

    const openSocialShare = (platform: keyof typeof socialUrls) => {
        window.open(socialUrls[platform], '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Share this content</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Native share (if supported) */}
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                    <>
                        <DropdownMenuItem onClick={handleNativeShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share...
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}

                {/* Social media platforms */}
                <DropdownMenuItem onClick={() => openSocialShare('facebook')}>
                    <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                    Facebook
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => openSocialShare('twitter')}>
                    <Twitter className="mr-2 h-4 w-4 text-blue-400" />
                    Twitter
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => openSocialShare('linkedin')}>
                    <Linkedin className="mr-2 h-4 w-4 text-blue-700" />
                    LinkedIn
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => openSocialShare('whatsapp')}>
                    <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                    WhatsApp
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => openSocialShare('pinterest')}>
                    <div className="mr-2 h-4 w-4 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                    </div>
                    Pinterest
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => openSocialShare('reddit')}>
                    <div className="mr-2 h-4 w-4 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">R</span>
                    </div>
                    Reddit
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => openSocialShare('telegram')}>
                    <div className="mr-2 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">T</span>
                    </div>
                    Telegram
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Copy link */}
                <DropdownMenuItem onClick={handleCopyLink}>
                    {copied ? (
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                    ) : (
                        <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? 'Copied!' : 'Copy link'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Simple inline share buttons for more prominent placement
export function SocialShareButtons({
    title,
    description,
    url,
    image,
    hashtags = [],
    className = ''
}: SocialShareProps) {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const hashtagText = hashtags.length > 0 ? hashtags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ') : '';

    const socialUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}&hashtags=${encodeURIComponent(hashtagText.replace(/#/g, ''))}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`
    };

    const openSocialShare = (platform: keyof typeof socialUrls) => {
        window.open(socialUrls[platform], '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy link:', error);
            toast.error('Failed to copy link');
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-sm text-gray-600 mr-2">Share:</span>

            <Button
                variant="outline"
                size="icon"
                onClick={() => openSocialShare('facebook')}
                className="h-8 w-8"
                title="Share on Facebook"
            >
                <Facebook className="h-4 w-4 text-blue-600" />
            </Button>

            <Button
                variant="outline"
                size="icon"
                onClick={() => openSocialShare('twitter')}
                className="h-8 w-8"
                title="Share on Twitter"
            >
                <Twitter className="h-4 w-4 text-blue-400" />
            </Button>

            <Button
                variant="outline"
                size="icon"
                onClick={() => openSocialShare('linkedin')}
                className="h-8 w-8"
                title="Share on LinkedIn"
            >
                <Linkedin className="h-4 w-4 text-blue-700" />
            </Button>

            <Button
                variant="outline"
                size="icon"
                onClick={() => openSocialShare('whatsapp')}
                className="h-8 w-8"
                title="Share on WhatsApp"
            >
                <MessageCircle className="h-4 w-4 text-green-600" />
            </Button>

            <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="h-8 w-8"
                title="Copy link"
            >
                <Copy className="h-4 w-4" />
            </Button>
        </div>
    );
}
