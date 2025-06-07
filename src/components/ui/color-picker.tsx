'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    className?: string;
}

const PRESET_COLORS = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#84cc16',
    '#gray-500', '#gray-700', '#gray-900'
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn('w-full justify-start', className)}
                >
                    <div
                        className="w-4 h-4 rounded border mr-2"
                        style={{ backgroundColor: value }}
                    />
                    {value}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="space-y-3">
                    <Input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-8"
                    />
                    <Input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="#000000"
                    />
                    <div className="grid grid-cols-6 gap-2">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                className="w-8 h-8 rounded border hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                    onChange(color);
                                    setIsOpen(false);
                                }}
                            />
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
