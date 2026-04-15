import { ReactNode } from "react";

interface SettingSelectProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}

export function SettingSelect({ label, value, onChange, children }: SettingSelectProps) {
  return (
    <label className="flex flex-col gap-2 rounded-[24px] bg-white/85 p-4 shadow-bubble">
      <span className="text-sm font-semibold text-ink/70">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[48px] rounded-2xl border-none bg-skysoft px-4 font-semibold text-ink outline-none"
      >
        {children}
      </select>
    </label>
  );
}
