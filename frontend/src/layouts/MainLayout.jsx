import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PageTransition from "../components/animations/PageTransition";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 lg:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.08),transparent_32rem)] dark:bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.08),transparent_30rem)]">
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
