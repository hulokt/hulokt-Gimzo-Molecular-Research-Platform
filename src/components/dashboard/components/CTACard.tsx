import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { ReactNode } from "react";

interface CTACardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  href: string;
}

const CTACard: React.FC<CTACardProps> = ({
  title,
  subtitle,
  children,
  href,
}) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-stroke/70 bg-white/80 px-7.5 py-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_30px_80px_-40px_rgba(59,130,246,0.6)] dark:border-white/10 dark:bg-[#111827]/80">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-primary/30 via-sky-400/30 to-transparent blur-2xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-transparent blur-2xl" />
      </div>

      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-sky-400/20 to-indigo-500/20 text-primary shadow-inner transition-all duration-300 group-hover:scale-105 dark:text-white">
        <span className="text-primary dark:text-white">{children}</span>
      </div>

      <div className="relative z-10 mt-4 flex items-end justify-between">
        <div>
          <h4 className="text-title-md font-semibold text-slate-900 dark:text-white">
            {title}
          </h4>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
            {subtitle}
          </span>
        </div>
      </div>
      <Link
        href={href}
        className="relative z-10 mt-4 inline-flex items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-slate-900 to-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-300 hover:from-primary hover:to-indigo-500 dark:from-slate-700 dark:to-slate-600"
      >
        <ArrowRight size={18} />
        <span>Explore</span>
      </Link>
    </div>
  );
};

export default CTACard;
