import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import Favorites from "./pages/Favorites";
import type { ActiveTab } from "./types";

function VideosComingSoon() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-2xl font-semibold text-slate-50">Videos</div>
      <p className="max-w-md text-sm text-slate-400">
        📹 Video memories are coming soon. You&apos;ll be able to store and
        browse your family clips right here.
      </p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "albums":
        return <Gallery />;
      case "favorites":
        return <Favorites />;
      case "videos":
        return <VideosComingSoon />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative">
        <Header setSidebarOpen={setSidebarOpen} activeTab={activeTab} />
        <div className="p-6 max-w-7xl mx-auto">{renderPage()}</div>
      </main>
    </div>
  );
}
