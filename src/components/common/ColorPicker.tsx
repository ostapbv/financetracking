import React from 'react';
import { Check } from 'lucide-react';

const PALETTE = [
  '#3B82F6', // Blue
  '#0EA5E9', // Sky
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#84CC16', // Lime
  '#EAB308', // Yellow
  '#F59E0B', // Amber
  '#F97316', // Orange
  '#EF4444', // Red / Coral
  '#F43F5E', // Rose
  '#EC4899', // Pink
  '#D946EF', // Fuchsia
  '#8B5CF6', // Purple
  '#6366F1', // Indigo
  '#64748B', // Slate
  '#1E293B', // Dark Navy
];

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {PALETTE.map((color) => {
        const isSelected = value.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            style={{ backgroundColor: color }}
            title={color}
          >
            {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
          </button>
        );
      })}
    </div>
  );
};
