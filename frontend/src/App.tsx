import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import Albums from "./pages/Albums";
import Favorites from "./pages/Favorites";
import type { ActiveTab } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "gallery":
        return <Gallery />;
      case "albums":
        return <Albums />;
      case "favorites":
        return <Favorites />;
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
