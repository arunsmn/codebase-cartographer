import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-node-border px-6 py-4">
      <div className="flex items-center gap-2">
        <Logo />
        <span className="font-mono text-sm font-semibold text-text-primary">
          Codebase Cartographer
        </span>
      </div>
      <a
        href="https://github.com/arunsmn/codebase-cartographer"
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-text-secondary hover:text-accent"
      >
        View source →
      </a>
    </header>
  );
}
