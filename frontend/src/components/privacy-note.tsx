export function PrivacyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-[var(--muted)]">
      {children}
    </p>
  );
}
