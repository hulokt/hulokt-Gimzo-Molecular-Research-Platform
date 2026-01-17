"use client";
import dynamic from "next/dynamic";
import React from "react";

import CTACard from "./components/CTACard";
import { AtomIcon, MessageCircle, Network, SearchIcon } from "lucide-react";

const DashboardCardMap = dynamic(
  () => import("@/components/dashboard/components/DashboardCardMap"),
  {
    ssr: false,
  },
);

const DashboardCardChat = dynamic(
  () => import("@/components/dashboard/components/DashboardCardChat"),
  {
    ssr: false,
  },
);

const Index: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="relative mb-6 mt-4 overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-[0_40px_120px_-60px_rgba(30,64,175,0.9)]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/40 via-indigo-500/40 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-400/40 via-sky-500/40 to-transparent blur-3xl" />
        <div className="relative z-10 flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
            Molecular Research Dashboard
          </p>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Insights, collaboration, and discovery in one place
          </h2>
          <p className="max-w-xl text-sm text-white/80">
            Track molecule activity, explore compounds, and connect with your
            research network in real-time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CTACard
          subtitle="get access to more molecules"
          title="Molecule Bank"
          href="/molecule-bank"
        >
          <AtomIcon />
        </CTACard>
        <CTACard
          subtitle="get access to more molecules"
          title="Generate Molecule"
          href="/model"
        >
          <Network />
        </CTACard>
        <CTACard
          subtitle="get access to more molecules"
          title="Search Compounds"
          href="/research"
        >
          <SearchIcon />
        </CTACard>
        <CTACard
          subtitle="get access to more molecules"
          title="Collaborative Research"
          href="/message"
        >
          <MessageCircle />
        </CTACard>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <DashboardCardChat />
        <DashboardCardMap />
      </div>
    </div>
  );
};

export default Index;
