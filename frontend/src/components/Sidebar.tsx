import React, { type Dispatch, type SetStateAction } from "react";
import NavItem from "./NavItem";
import { Grid, Video, FolderHeart, Heart } from "lucide-react";
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
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:relative z-40 w-72 h-screen bg-slate-900 border-r border-slate-800 
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Branding */}
        <div className="p-8 flex flex-col items-center border-b border-slate-800/50">
          <img src={MASCOT_URL} className="w-24 h-24 object-contain drop-shadow-xl" />
          <h1 className="text-2xl font-bold mt-4">Our Frame</h1>
          <p className="text-xs text-slate-500 mt-1">Collecting moments</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
          <NavItem
            icon={Grid}
            label="Home"
            active={activeTab === "home"}
            onClick={() => {
              setActiveTab("home");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={Video}
            label="Gallery"
            active={activeTab === "gallery"}
            onClick={() => {
              setActiveTab("gallery");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={FolderHeart}
            label="Albums"
            active={activeTab === "albums"}
            onClick={() => {
              setActiveTab("albums");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={Heart}
            label="Favorites"
            active={activeTab === "favorites"}
            onClick={() => {
              setActiveTab("favorites");
              setSidebarOpen(false);
            }}
          />
        </nav>
      </aside>
    </>
  );
}
