import React, { type Dispatch, type SetStateAction } from "react";
import NavItem from "./NavItem";
import { 
  Grid, 
  Video, 
  FolderHeart, 
  Heart, 
  Search, // Added Search icon for Phase 2
  BookOpen, // Added BookOpen icon for Journaling/Phase 5
} from "lucide-react";
import type { ActiveTab } from "../types";

const MASCOT_URL = "/mascot.png";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: Dispatch<SetStateAction<ActiveTab>>;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {

  // Function to handle navigation and close sidebar
  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:relative z-40 w-72 h-screen bg-slate-900 border-r border-slate-800 
          transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Branding (Enhanced) */}
        <div className="p-6 pt-8 flex flex-col items-center border-b border-slate-800/50">
          <img src={MASCOT_URL} className="w-20 h-20 object-contain drop-shadow-xl" alt="App Mascot" />
          <h1 className="text-3xl font-extrabold text-teal-400 mt-3 tracking-wider">
            Our Frame
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Kotcherlakota Vault</p>
        </div>

        {/* --- Primary Navigation (Current Features) --- */}
        <nav className="flex-none px-6 space-y-1 mt-8">
          <p className="text-xs font-semibold uppercase text-slate-500/70 mb-2">Library</p>
          <NavItem
            icon={Grid}
            label="Home (Slideshow)"
            active={activeTab === "home"}
            onClick={() => handleNavClick("home")}
          />
          <NavItem
            icon={FolderHeart}
            label="Albums"
            active={activeTab === "albums"}
            onClick={() => handleNavClick("albums")}
          />
          <NavItem
            icon={Heart}
            label="Favorites"
            active={activeTab === "favorites"}
            onClick={() => handleNavClick("favorites")}
          />
          <NavItem
            icon={Video}
            label="Videos"
            active={activeTab === "videos"}
            isComingSoon={true} // Mark Videos as coming soon
            onClick={() => handleNavClick("videos" as ActiveTab)}
          />
        </nav>

        {/* --- AI & Feature Roadmap (Coming Soon) --- */}
        <nav className="flex-1 px-6 space-y-1 mt-8 border-t border-slate-800 pt-6 overflow-y-auto">
          <p className="text-xs font-semibold uppercase text-slate-500/70 mb-2">AI & Roadmap</p>
          <NavItem
            icon={Search}
            label="Semantic Search"
            active={activeTab === "search"}
            isComingSoon={true} // Mark Search as coming soon (Phase 2)
            onClick={() => handleNavClick("search" as ActiveTab)}
            comingSoonColor="text-pink-400"
          />
          <NavItem
            icon={BookOpen}
            label="Journaling"
            active={activeTab === "journal"}
            isComingSoon={true} // Mark Journaling as coming soon (Phase 5)
            onClick={() => handleNavClick("journal" as ActiveTab)}
            comingSoonColor="text-amber-400"
          />
        </nav>
        
        {/* Footer/User Slot */}
        <div className="p-4 border-t border-slate-800/50">
            <div className="flex items-center space-x-3 text-sm text-slate-400">
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">K</div>
                <p>Hello, Kotcherlakota!</p>
            </div>
        </div>
      </aside>
    </>
  );
}