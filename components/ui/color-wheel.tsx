'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Extended color palette with gradients
export const COLOR_PALETTE = [
  // Reds & Pinks
  { name: 'Red', value: '#EF4444' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Fuchsia', value: '#D946EF' },
  // Purples
  { name: 'Purple', value: '#A855F7' },
  { name: 'Violet', value: '#7C3AED' },
  // Blues
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Cyan', value: '#06B6D4' },
  // Teals & Greens
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Green', value: '#22C55E' },
  // Yellows & Oranges
  { name: 'Lime', value: '#84CC16' },
  { name: 'Yellow', value: '#FBBF24' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Orange', value: '#F97316' },
  // Neutrals
  { name: 'Gray', value: '#6B7280' },
  { name: 'Slate', value: '#64748B' },
  { name: 'Stone', value: '#78716C' },
  { name: 'Zinc', value: '#71717A' },
];

interface ColorWheelProps {
  value: string;
  onChange: (color: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ColorWheel({ value, onChange, size = 'md' }: ColorWheelProps) {
  const gridCols = size === 'sm' ? 'grid-cols-4' : size === 'lg' ? 'grid-cols-6' : 'grid-cols-5';
  const colorSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-8 h-8' : 'w-7 h-7';

  return (
    <div className={cn('grid gap-2', gridCols)}>
      {COLOR_PALETTE.map(color => (
        <button
          key={color.value}
          onClick={() => onChange(color.value)}
          className={cn(
            'rounded-lg border-2 transition-all cursor-pointer hover:scale-110',
            colorSize,
            value === color.value
              ? 'border-stone-900 dark:border-stone-100 ring-2 ring-offset-1 dark:ring-offset-stone-900 scale-110'
              : 'border-stone-200 dark:border-stone-700'
          )}
          style={{ backgroundColor: color.value }}
          title={color.name}
        />
      ))}
    </div>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">{label}</label>
      )}
      <ColorWheel value={value} onChange={onChange} size="md" />
    </div>
  );
}
