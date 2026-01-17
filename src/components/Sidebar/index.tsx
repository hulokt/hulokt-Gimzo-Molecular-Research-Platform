"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import { ChevronLeft, X } from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

// Custom molecular icons for a professional look
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const MoleculeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="5" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="15" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="8.5" y1="6.5" x2="6.5" y2="11" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="11.5" y1="6.5" x2="13.5" y2="11" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="7.5" y1="13" x2="12.5" y2="13" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const ModelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M10 18V10" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 10L17 6" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 10L3 6" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const ResearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="12" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

const MessagesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V12C17 13.1046 16.1046 14 15 14H7L3 17V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="7" cy="8.5" r="1" fill="currentColor"/>
    <circle cx="10" cy="8.5" r="1" fill="currentColor"/>
    <circle cx="13" cy="8.5" r="1" fill="currentColor"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 1V3M10 17V19M19 10H17M3 10H1M16.364 3.636L14.95 5.05M5.05 14.95L3.636 16.364M16.364 16.364L14.95 14.95M5.05 5.05L3.636 3.636" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const menuItems = [
  {
    section: "MAIN",
    items: [
      { icon: <DashboardIcon />, label: "Dashboard", route: "/" },
      { icon: <MoleculeIcon />, label: "Molecule Bank", route: "/molecule-bank" },
      { icon: <ModelIcon />, label: "AI Model", route: "/model" },
      { icon: <ResearchIcon />, label: "Research", route: "/research" },
    ]
  },
  {
    section: "COLLABORATE",
    items: [
      { icon: <MessagesIcon />, label: "Messages", route: "/message" },
    ]
  },
  {
    section: "SETTINGS",
    items: [
      { icon: <SettingsIcon />, label: "Settings", route: "/settings" },
    ]
  }
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`fixed left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-x-hidden overflow-y-hidden border-r border-white/40 bg-white/60 backdrop-blur-2xl shadow-[0_30px_90px_-60px_rgba(15,23,42,0.45)] duration-300 ease-linear dark:border-white/10 dark:bg-slate-900/70 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/25 via-sky-400/25 to-transparent blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-transparent blur-3xl" />
        </div>
        {/* Logo Section */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/40 px-5 py-6 dark:border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3C50E0] to-[#5B6CF0] shadow-lg shadow-blue-500/20">
              <Image
                width={22}
                height={22}
                src={"/images/logo/dna.svg"}
                alt="Logo"
                priority
              />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                Gimzo
              </span>
              <span className="block text-[10px] font-medium tracking-wider text-slate-500 dark:text-slate-400">
                MOLECULAR RESEARCH
              </span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 no-scrollbar flex-1 overflow-x-hidden overflow-y-auto px-3 py-5">
          {menuItems.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              <h3 className="mb-3 px-3 text-[10px] font-semibold tracking-wider text-slate-400/80 dark:text-slate-500">
                {group.section}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item, itemIndex) => {
                  const isActive = pathname === item.route;
                  return (
                    <li key={itemIndex}>
                      <Link
                        href={item.route}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "border border-primary/20 bg-white/70 text-slate-900 shadow-sm ring-1 ring-primary/10 dark:bg-slate-800/70 dark:text-white"
                            : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                        }`}
                      >
                        <span
                          className={`transition-colors ${
                            isActive
                              ? "text-primary"
                              : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200"
                          }`}
                        >
                          {item.icon}
                        </span>
                        {item.label}
                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom Section - Pro Card */}
        <div className="relative z-10 border-t border-white/40 p-4 dark:border-white/10">
          <div className="rounded-2xl border border-primary/20 bg-white/70 p-4 shadow-sm dark:bg-slate-900/70">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/20">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L8.5 4.5L12 5L9.5 7.5L10 11L7 9.5L4 11L4.5 7.5L2 5L5.5 4.5L7 1Z" fill="#3C50E0"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Gimzo Pro
              </span>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-300">
              Unlock advanced AI models & unlimited molecule generation
            </p>
            <button className="w-full rounded-xl bg-gradient-to-r from-primary to-indigo-500 py-2 text-xs font-semibold text-white transition-colors hover:from-primary/90 hover:to-indigo-500/90">
              Coming Soon
            </button>
          </div>
        </div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
