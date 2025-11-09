import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
    variant?: 'full' | 'icon' | 'text';
    theme?: 'default' | 'mono-dark' | 'mono-white';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    href?: string;
    showTagline?: boolean;
}

const sizeClasses = {
    sm: { icon: 'h-6 w-6', text: 'text-lg' },
    md: { icon: 'h-8 w-8', text: 'text-xl' },
    lg: { icon: 'h-10 w-10', text: 'text-2xl' },
    xl: { icon: 'h-12 w-12', text: 'text-3xl' }
};

export const Logo: React.FC<LogoProps> = ({
    variant = 'full',
    theme = 'default',
    size = 'md',
    className = '',
    href = '/',
    showTagline = false
}) => {
    const getIconSrc = () => {
        switch (theme) {
            case 'mono-dark':
                return '/uselfunik-icon-mono-dark.svg';
            case 'mono-white':
                return '/uselfunik-icon-mono-white.svg';
            default:
                return '/uselfunik-icon-new.svg';
        }
    };

    const getTextClasses = () => {
        const baseClasses = `font-bold ${sizeClasses[size].text}`;

        switch (theme) {
            case 'mono-dark':
                return `${baseClasses} text-gray-900 dark:text-gray-100`;
            case 'mono-white':
                return `${baseClasses} text-white`;
            default:
                return `${baseClasses} bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent`;
        }
    };

    const LogoContent = () => (
        <div className={`flex items-center ${variant === 'full' ? 'space-x-3' : ''} ${className}`}>
            {variant !== 'text' && (
                <Image
                    src={getIconSrc()}
                    alt="UselfUnik Logo"
                    width={48}
                    height={48}
                    className={sizeClasses[size].icon}
                    priority
                />
            )}

            {variant !== 'icon' && (
                <div className="flex flex-col">
                    <span className={getTextClasses()}>
                        UselfUnik
                    </span>
                    {showTagline && (
                        <span className="text-xs text-blue-500 opacity-80 font-normal tracking-wider">
                            BE UNIQUELY YOU
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="hover:opacity-90 transition-opacity">
                <LogoContent />
            </Link>
        );
    }

    return <LogoContent />;
};

export default Logo;