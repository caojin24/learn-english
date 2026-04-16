import { ReactNode } from "react";

interface AppShellProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  hideHeaderText?: boolean;
  children: ReactNode;
}

export function AppShell({ title, subtitle, onBack, rightSlot, hideHeaderText, children }: AppShellProps) {
  const shouldRenderHeader = onBack || rightSlot || !hideHeaderText;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-8 pt-4 text-ink sm:px-6">
      {shouldRenderHeader ? (
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-2xl shadow-bubble transition active:scale-95"
                aria-label="返回首页"
              >
                ←
              </button>
            ) : null}
            {hideHeaderText ? null : (
              <div>
                <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-ink/70 sm:text-base">{subtitle}</p> : null}
              </div>
            )}
          </div>
          <div>{rightSlot}</div>
        </header>
      ) : null}
      {children}
    </main>
  );
}
