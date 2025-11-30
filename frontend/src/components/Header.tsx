import { Menu, Search } from "lucide-react";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
}

export default function Header({ setSidebarOpen, activeTab }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-semibold capitalize text-slate-200">{activeTab}</h2>
      </div>

      <div className="relative w-full max-w-md hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
        <input
          type="text"
          placeholder="Search memories..."
          className="w-full bg-slate-900 border border-slate-800 rounded-full py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:ring-indigo-500/50"
        />
      </div>
    </header>
  );
}
