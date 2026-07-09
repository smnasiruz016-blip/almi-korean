import type { ReactNode } from "react";

// Centered auth-card shell — matches the AlmiPrep reference ((auth)/layout.tsx +
// signup card). Vertically centers a max-w-md bordered card with generous top
// padding so the heading always clears the sticky family nav.
export function AuthCard({
  heading,
  sub,
  children,
  footer,
}: {
  heading: string;
  sub?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center bg-almi-bg px-6 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-almi-bg-peach bg-almi-paper p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-almi-ink">{heading}</h1>
          {sub && <p className="mt-2 text-sm text-almi-text-muted">{sub}</p>}
          {children}
        </div>
        {footer && (
          <p className="mt-6 text-center text-sm text-almi-text-muted">{footer}</p>
        )}
      </div>
    </main>
  );
}
