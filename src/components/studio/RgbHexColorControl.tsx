import React, { useState, useEffect } from 'react';
import { clampByte, hexToRgb, normalizeHex, rgbToHex } from '../../utils/lightingLogic';

interface RgbHexColorControlProps {
  label: string;
  color: string;
  onChange: (nextHex: string) => void;
  subtitle?: string;
}

export const RgbHexColorControl: React.FC<RgbHexColorControlProps> = ({
  label,
  color,
  onChange,
  subtitle,
}) => {
  const safeHex = normalizeHex(color, '#ffffff');
  const rgb = hexToRgb(safeHex);
  const [hexDraft, setHexDraft] = useState(safeHex.toUpperCase());

  useEffect(() => {
    setHexDraft(safeHex.toUpperCase());
  }, [safeHex]);

  const handleHexChange = (raw: string) => {
    setHexDraft(raw.toUpperCase());
    const trimmed = raw.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(trimmed)) {
      onChange(normalizeHex(trimmed, safeHex));
      return;
    }
    const rgbMatch = trimmed.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
    if (rgbMatch) {
      onChange(
        rgbToHex(
          parseInt(rgbMatch[1], 10),
          parseInt(rgbMatch[2], 10),
          parseInt(rgbMatch[3], 10)
        )
      );
    }
  };

  const handleHexBlur = () => {
    const normalized = normalizeHex(hexDraft, safeHex);
    setHexDraft(normalized.toUpperCase());
    if (normalized !== safeHex) {
      onChange(normalized);
    }
  };

  const handleChannelChange = (channel: 'r' | 'g' | 'b', rawVal: string) => {
    const parsed = rawVal === '' ? 0 : parseInt(rawVal, 10);
    if (Number.isNaN(parsed)) return;
    const next = {
      ...rgb,
      [channel]: clampByte(parsed),
    };
    onChange(rgbToHex(next.r, next.g, next.b));
  };

  return (
    <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-2 text-xs font-mono">
      <div className="flex items-center justify-between gap-2 text-zinc-400">
        <span className="truncate">{label}</span>
        <span className="text-[10px] text-zinc-300 tabular-nums shrink-0">
          rgb({rgb.r}, {rgb.g}, {rgb.b})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} color swatch`}
          value={safeHex}
          onChange={(e) => onChange(normalizeHex(e.target.value, safeHex))}
          className="w-8 h-7 bg-transparent border border-zinc-700/80 cursor-pointer rounded shrink-0"
        />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            aria-label={`${label} HEX code`}
            value={hexDraft}
            onChange={(e) => handleHexChange(e.target.value)}
            onBlur={handleHexBlur}
            placeholder="#FFFFFF"
            className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-100 uppercase tracking-wider focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {(['r', 'g', 'b'] as const).map((channel) => (
          <label
            key={channel}
            className="flex items-center gap-1 px-1.5 py-1 bg-zinc-950 border border-zinc-800 rounded focus-within:border-red-500"
          >
            <span
              className={`text-[10px] font-bold uppercase ${
                channel === 'r'
                  ? 'text-red-400'
                  : channel === 'g'
                  ? 'text-emerald-400'
                  : 'text-sky-400'
              }`}
            >
              {channel}
            </span>
            <input
              type="number"
              min={0}
              max={255}
              aria-label={`${label} ${channel.toUpperCase()} channel`}
              value={rgb[channel]}
              onChange={(e) => handleChannelChange(channel, e.target.value)}
              className="w-full bg-transparent text-[11px] text-zinc-100 text-right tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </label>
        ))}
      </div>

      {subtitle && <div className="text-[10px] text-zinc-500 truncate">{subtitle}</div>}
    </div>
  );
};
