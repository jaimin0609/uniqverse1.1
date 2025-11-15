import React from 'react';
import Link from 'next/link';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    theme?: 'default' | 'mono-dark' | 'mono-white';
    href?: string;
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({
    size = 'md',
    theme = 'default',
    href = '/',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'h-6',
        md: 'h-8',
        lg: 'h-10',
        xl: 'h-12'
    };

    const textSizes = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-3xl'
    };

    // Color schemes for different themes
    const colors = {
        default: {
            primary: '#2563eb',
            text: '#1f2937',
            dot: '#dc2626'
        },
        'mono-dark': {
            primary: '#374151',
            text: '#1f2937',
            dot: '#6b7280'
        },
        'mono-white': {
            primary: '#ffffff',
            text: '#ffffff',
            dot: '#e5e7eb'
        }
    };

    const currentColors = colors[theme];

    const LogoContent = (
        <div className={`flex items-center space-x-2.5 ${className}`}>
            {/* Solar System Logo: U in circle with orbiting dot */}
            <div className={`${sizeClasses[size]} flex items-center justify-center relative`}>
                <svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    {/* Outer circle (orbit path - invisible guide) */}
                    <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="none"
                        fill="none"
                    />

                    {/* Main U shape in center */}
                    <path
                        d="M14 12C14 12 14 18 14 22C14 26.418 17.582 30 22 30C26.418 30 30 26.418 30 22C30 18 30 12 30 12"
                        stroke={currentColors.primary}
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                    />

                    {/* Orbiting dot with animation */}
                    <circle
                        cx="24"
                        cy="4"
                        r="2.5"
                        fill={currentColors.dot}
                    >
                        {/* Solar system orbit animation */}
                        <animateTransform
                            attributeName="transform"
                            attributeType="XML"
                            type="rotate"
                            from="0 24 24"
                            to="360 24 24"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </svg>
            </div>

            {/* Brand name */}
            <div className="flex flex-col">
                <span
                    className={`font-semibold tracking-tight leading-none ${textSizes[size]}`}
                    style={{ color: currentColors.text }}
                >
                    UselfUnik
                </span>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="inline-flex items-center hover:opacity-80 transition-opacity">
                {LogoContent}
            </Link>
        );
    }

    return LogoContent;
};

export default Logo;