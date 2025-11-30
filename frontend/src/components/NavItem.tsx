import React from "react";

interface NavItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function NavItem({ icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group ${
        active
          ? "bg-indigo-500/10 text-indigo-400 font-semibold"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      }`}
    >
      <Icon
        size={20}
        className={active ? "scale-110" : "group-hover:scale-110"}
      />
      <span>{label}</span>
    </button>
  );
}
