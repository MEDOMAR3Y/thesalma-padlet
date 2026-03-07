import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const PRESET_COLORS = [
  '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529', '#000000',
  '#fff3cd', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
  '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#022c22',
  '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554',
  '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3b0764',
  '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', '#500724',
  '#fed7d7', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a',
  '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#1e1b4b',
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ color, onChange, label = 'اللون' }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(color);

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      onChange(value);
    }
  };

  const handleNativeChange = (value: string) => {
    setHexInput(value);
    onChange(value);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 h-9 px-3 rounded-lg border border-input bg-background hover:bg-muted/50 transition-colors w-full"
          >
            <div
              className="w-5 h-5 rounded-full border border-border shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-muted-foreground font-mono">{color}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-3" align="start">
          <div className="space-y-3">
            {/* Color grid */}
            <div className="grid grid-cols-10 gap-1">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setHexInput(c); }}
                  className={`w-5 h-5 rounded-sm border transition-all hover:scale-125 ${color === c ? 'border-foreground ring-1 ring-primary/50 scale-110' : 'border-border/30'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Native color picker + hex input */}
            <div className="flex items-center gap-2">
              <label className="relative cursor-pointer">
                <input
                  type="color"
                  value={color}
                  onChange={e => handleNativeChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="w-8 h-8 rounded-lg border-2 border-border"
                  style={{ backgroundColor: color }}
                />
              </label>
              <Input
                value={hexInput}
                onChange={e => handleHexChange(e.target.value)}
                placeholder="#000000"
                className="font-mono text-sm h-8 flex-1"
                dir="ltr"
                maxLength={7}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
