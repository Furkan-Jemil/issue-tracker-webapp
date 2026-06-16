import React from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md h-full border-l border-border bg-card p-6 shadow-xl relative flex flex-col animate-in slide-in-from-right duration-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close drawer"
          className="absolute right-4 top-4 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent p-1 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {title && <h3 className="text-lg font-semibold leading-none tracking-tight mb-6">{title}</h3>}
        <div className="flex-1 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}
