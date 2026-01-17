"use client";
import jsVectorMap from "jsvectormap";
import "jsvectormap/dist/jsvectormap.css";
import React, { useEffect } from "react";
import "../../../js/us-aea-en";
import "../../../js/world";

const MapOne: React.FC = () => {
  useEffect(() => {
    const researchHubs = {
      US: 98,
      CA: 62,
      GB: 75,
      DE: 68,
      FR: 63,
      IN: 82,
      CN: 91,
      JP: 70,
      AU: 59,
      BR: 54,
      EG: 48,
      ZA: 43,
    };

    const mapOne = new jsVectorMap({
      selector: "#mapOne",
      map: "world",
      zoomButtons: true,
      zoomOnScroll: false,
      backgroundColor: "transparent",
      regionStyle: {
        initial: {
          fill: "#CBD5E1",
          fillOpacity: 0.9,
          stroke: "#ffffff",
          strokeWidth: 0.5,
        },
        hover: {
          fillOpacity: 1,
          fill: "#3B82F6",
        },
        selected: {
          fill: "#6366F1",
        },
      },
      regionLabelStyle: {
        initial: {
          fontFamily: "Satoshi",
          fontWeight: 600,
          fill: "#0F172A",
        },
        hover: {
          cursor: "pointer",
        },
      },
      markers: [
        { name: "Boston Lab", coords: [42.3601, -71.0589] },
        { name: "Berlin Lab", coords: [52.52, 13.405] },
        { name: "Tokyo Lab", coords: [35.6762, 139.6503] },
        { name: "Cairo Lab", coords: [30.0444, 31.2357] },
        { name: "Sydney Lab", coords: [-33.8688, 151.2093] },
      ],
      markerStyle: {
        initial: {
          fill: "#10B981",
          stroke: "#ffffff",
          r: 6,
        },
        hover: {
          fill: "#34D399",
          stroke: "#ffffff",
        },
      },
      series: {
        regions: [
          {
            values: researchHubs,
            scale: ["#E2E8F0", "#38BDF8"],
            normalizeFunction: "polynomial",
          },
        ],
      },
      onRegionTooltipShow: (_event: any, tooltip: any, code: string) => {
        const value = researchHubs[code as keyof typeof researchHubs] || 24;
        tooltip.setText(`${tooltip.text()} — Research score: ${value}`);
      },
    });

    return () => {
      const map = document.getElementById("mapOne");
      if (map) {
        map.innerHTML = "";
      }
      mapOne.destroy();
    };
  }, []);

  return (
    <div className="group relative col-span-12 overflow-hidden rounded-2xl border border-stroke/70 bg-white/80 px-7.5 py-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-40px_rgba(59,130,246,0.6)] dark:border-white/10 dark:bg-[#111827]/80 xl:col-span-7">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-primary/30 via-cyan-400/30 to-transparent blur-2xl" />
        <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-transparent blur-2xl" />
      </div>

      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-xl font-semibold text-slate-900 dark:text-white">
            All over the world
          </h4>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
            Global research reach
          </p>
        </div>
        <div className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200">
          Live coverage
        </div>
      </div>

      <div className="relative z-10 h-90 rounded-2xl border border-white/40 bg-gradient-to-br from-slate-50/80 via-white/60 to-slate-100/80 p-2 shadow-inner dark:border-white/5 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-800/80">
        <div id="mapOne" className="mapOne map-btn h-full w-full"></div>
      </div>
    </div>
  );
};

export default MapOne;
