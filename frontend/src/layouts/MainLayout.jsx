import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PageTransition from "../components/animations/PageTransition";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-warm-200 text-ink transition-colors duration-200 dark:bg-warm-950 dark:text-warm-100 lg:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top_right,rgba(196,106,74,0.10),transparent_34rem)] dark:bg-[radial-gradient(circle_at_top_right,rgba(231,166,138,0.10),transparent_30rem)]">
        <Navbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 xl:py-8">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
