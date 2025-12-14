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
        className={`fixed left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-[#0f1419] duration-300 ease-linear lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-gray-800/50">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#3C50E0] to-[#5B6CF0] shadow-lg shadow-blue-500/20">
              <Image
                width={22}
                height={22}
                src={"/images/logo/dna.svg"}
                alt="Logo"
                priority
              />
            </div>
            <div>
              <span className="text-lg font-semibold text-white tracking-tight">Gimzo</span>
              <span className="block text-[10px] text-gray-500 font-medium tracking-wider">MOLECULAR RESEARCH</span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 no-scrollbar">
          {menuItems.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              <h3 className="px-3 mb-3 text-[10px] font-semibold text-gray-500 tracking-wider">
                {group.section}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item, itemIndex) => {
                  const isActive = pathname === item.route;
                  return (
                    <li key={itemIndex}>
                      <Link
                        href={item.route}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                          isActive
                            ? "bg-gradient-to-r from-[#3C50E0]/20 to-[#3C50E0]/5 text-white border-l-2 border-[#3C50E0]"
                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                        }`}
                      >
                        <span className={`${isActive ? 'text-[#3C50E0]' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`}>
                          {item.icon}
                        </span>
                        {item.label}
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3C50E0]" />
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
        <div className="p-4 border-t border-gray-800/50">
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#3C50E0]/10 to-transparent border border-[#3C50E0]/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-[#3C50E0]/20 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L8.5 4.5L12 5L9.5 7.5L10 11L7 9.5L4 11L4.5 7.5L2 5L5.5 4.5L7 1Z" fill="#3C50E0"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-white">Gimzo Pro</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              Unlock advanced AI models & unlimited molecule generation
            </p>
            <button className="w-full py-2 text-xs font-medium text-white bg-[#3C50E0] rounded-lg hover:bg-[#3C50E0]/90 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
