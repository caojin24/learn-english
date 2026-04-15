interface ModuleCardProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onClick: () => void;
}

export function ModuleCard({ icon, title, subtitle, color, onClick }: ModuleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[154px] flex-col items-start justify-between rounded-[30px] ${color} p-5 text-left shadow-bubble transition active:scale-[0.98]`}
    >
      <span className="text-4xl">{icon}</span>
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-ink/70">{subtitle}</p>
      </div>
    </button>
  );
}
