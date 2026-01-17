"use client";
import MoleculeBankTable from "@/components/MoleculeBank/MoleculeBankTable";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useEffect } from "react";

const Page = () => {
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  return (
    <DefaultLayout>
      <div className="flex min-h-full flex-col gap-6 overflow-hidden">
        <div className="relative mt-4 overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-[0_40px_120px_-60px_rgba(30,64,175,0.9)]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/40 via-indigo-500/40 to-transparent blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-400/40 via-sky-500/40 to-transparent blur-3xl" />
          <div className="relative z-10 flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
              Molecular Library
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Explore a curated molecule bank
            </h2>
            <p className="max-w-2xl text-sm text-white/80">
              Search structures, compare molecular weights, and jump straight to
              research with a single click.
            </p>
          </div>
        </div>

        <MoleculeBankTable />
        <div className="flex-1" />
      </div>
    </DefaultLayout>
  );
};

export default Page;
