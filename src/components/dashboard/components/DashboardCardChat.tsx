"use client";
import { useUser } from "@/app/context/UserContext";
import React from "react";
const ChartThree: React.FC = () => {
  const user = useUser();

  return (
    <div className="group relative col-span-12 overflow-hidden rounded-2xl border border-stroke/70 bg-white/80 px-6 pb-6 pt-7 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-40px_rgba(59,130,246,0.6)] dark:border-white/10 dark:bg-[#111827]/80 sm:px-7.5 xl:col-span-5">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-primary/30 via-cyan-400/30 to-transparent blur-2xl" />
        <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-transparent blur-2xl" />
      </div>

      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div>
          <h5 className="text-xl font-semibold text-slate-900 dark:text-white">
            Collaborate with team
          </h5>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
            Live collaboration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-emerald-500">Online</span>
        </div>
      </div>

      <div className="relative z-10">
        <div id="chartThree" className="mx-auto flex justify-center">
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-indigo-500/40 blur-md" />
              <img
                className="relative h-10 w-10 rounded-full border border-white/40 object-cover"
                src={user.photo}
                alt="User avatar"
              />
            </div>

            <div className="flex w-full max-w-[340px] flex-col rounded-2xl border border-white/60 bg-white/70 p-4 shadow-[0_10px_40px_-25px_rgba(15,23,42,0.5)] backdrop-blur dark:border-white/10 dark:bg-slate-800/70">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {user.firstName}{" "}
                </span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-300">
                  11:46
                </span>
              </div>
              <p className="py-2.5 text-sm font-normal text-slate-700 dark:text-slate-100">
                That's awesome. I think we are making a pretty good progress
              </p>
              <span className="text-xs font-semibold text-emerald-500">
                Delivered
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartThree;
