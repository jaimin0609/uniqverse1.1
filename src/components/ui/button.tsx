import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 cubic-bezier(0.34, 1.56, 0.64, 1) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
    {
        variants: {
            variant: {
                default: "bg-gradient-primary text-primary-foreground shadow-md hover:shadow-lg hover:shadow-colored hover:-translate-y-1 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]",
                destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 hover:-translate-y-1 active:translate-y-0",
                outline: "border-2 border-primary bg-transparent text-primary shadow-sm hover:bg-gradient-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-md hover:shadow-colored",
                secondary: "bg-glass backdrop-blur-md text-secondary-foreground shadow-sm border border-white/20 hover:bg-secondary/90 hover:-translate-y-1 hover:shadow-md",
                ghost: "bg-transparent text-foreground hover:bg-accent/10 hover:text-accent hover:-translate-y-0.5 hover:shadow-sm",
                link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
                gradient: "bg-gradient-accent text-accent-foreground shadow-md hover:shadow-lg hover:shadow-pink-500/25 hover:-translate-y-1 hover:scale-[1.02]",
                glass: "bg-glass backdrop-blur-lg text-foreground border border-white/30 shadow-lg hover:bg-white/20 hover:-translate-y-1 hover:shadow-xl",
            },
            size: {
                default: "h-11 px-6 py-2.5",
                sm: "h-9 rounded-md px-4 text-xs",
                lg: "h-14 rounded-xl px-10 text-base",
                icon: "h-10 w-10",
                xl: "h-16 rounded-2xl px-12 text-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";

export { Button, buttonVariants };