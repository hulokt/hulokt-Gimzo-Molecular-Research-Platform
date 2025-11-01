"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MoleculeStructure from "../MoleculeStructure/index";
import bank from "@/data/moleculeBank.json";


const TableOne = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const data = (Array.isArray(bank) ? (bank as any[]) : []).concat([]);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const filteredMolecules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data;
    const filtered = data.filter((m: any) => {
      const name = (m?.moleculeName ?? "").toString().toLowerCase();
      const weight = (m?.molecularWeight ?? "").toString().toLowerCase();
      const category = (m?.categoryUsage ?? "").toString().toLowerCase();
      return (
        name.includes(q) || weight.includes(q) || category.includes(q)
      );
    });
    return filtered;
  }, [data, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredMolecules.length / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filteredMolecules.slice(start, start + pageSize);
  }, [filteredMolecules, pageSafe]);

  // Restore scroll and page from session when navigating back from research
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("moleculeBankState");
      if (saved) {
        const { page: savedPage, scrollTop } = JSON.parse(saved);
        if (savedPage) setPage(savedPage);
        // Delay to ensure list renders before scrolling
        setTimeout(() => {
          if (scrollRef.current && typeof scrollTop === "number") {
            scrollRef.current.scrollTop = scrollTop;
          }
        }, 0);
        sessionStorage.removeItem("moleculeBankState");
      }
    } catch {}
  }, []);

  return (
    <div className="rounded-lg border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-[#181818] dark:bg-[#181818] sm:px-7.5 xl:pb-1 max-h-[80vh] flex flex-col overflow-hidden">
      <div className="mb-4">
        <h4 className="text-xl font-semibold text-black dark:text-white">
        Molecules
      </h4>
      </div>

      <div className="sticky top-0 z-20 -mx-5 sm:-mx-7.5 px-5 sm:px-7.5 pb-4 bg-white dark:bg-[#181818]">
      <input
        type="search"
          placeholder="Search molecule name, weight, or category"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
          className="border-gray-300 text-gray-700 placeholder-gray-400 dark:border-gray-600 dark:placeholder-gray-500 text-md w-full rounded-lg border bg-white px-4 py-3 shadow-sm outline-none focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
      />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="flex flex-col">
        <div className="grid grid-cols-4 rounded-lg bg-gray-2 dark:bg-[#121212] sm:grid-cols-5">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Molecule name
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Smile Structure Image
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Molecular Weights (g/mol)
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Category Usage
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Research
            </h5>
          </div>
        </div>

        {pageItems.map((molecule, idx) => (
          <div
            className={`grid grid-cols-4 sm:grid-cols-5 ${
              idx === pageItems.length - 1
                ? ""
                : "border-b border-stroke dark:border-strokedark"
            }`}
            key={`${pageSafe}-${idx}-${molecule.moleculeName}`}
          >
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">
                {molecule.moleculeName}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 p-2.5 xl:p-3">
              <div className="flex-shrink-0 w-[120px]">
                <MoleculeStructure
                  id={`mol-${pageSafe}-${idx}`}
                  structure={molecule.smilesStructure}
                  width={120}
                  height={90}
                />
              </div>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">
                {molecule.molecularWeight}
              </p>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">
                {molecule.categoryUsage}
              </p>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <Link
                href={`/research?query=${encodeURIComponent(
                  molecule.moleculeName,
                )}&structure=${encodeURIComponent(molecule.smilesStructure || "")}`}
                onClick={() => {
                  try {
                    const scrollTop = scrollRef.current?.scrollTop ?? 0;
                    sessionStorage.setItem(
                      "moleculeBankState",
                      JSON.stringify({ page: pageSafe, scrollTop }),
                    );
                  } catch {}
                }}
                className="rounded border px-3 py-1 text-sm text-black dark:text-white dark:border-strokedark hover:bg-gray-100 dark:hover:bg-[#222]"
              >
                Research
              </Link>
            </div>
          </div>
        ))}
        </div>
      </div>
      {/* Pagination Controls */}
      <div className="flex items-center justify-between py-3 border-t border-stroke dark:border-strokedark">
        <div className="text-sm text-black dark:text-white">
          {filteredMolecules.length} items
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border px-3 py-1 text-sm text-black dark:text-white dark:border-strokedark hover:bg-gray-100 dark:hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={pageSafe === 1}
          >
            Prev
          </button>
          
          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {(() => {
              const pages: (number | string)[] = [];
              
              if (totalPages <= 7) {
                // Show all pages if total is small
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Always show first page
                pages.push(1);
                
                let start: number;
                let end: number;
                
                // Determine what pages to show around current page
                if (pageSafe <= 3) {
                  // Near the beginning: show pages 2-4
                  start = 2;
                  end = Math.min(4, totalPages - 1);
                } else if (pageSafe >= totalPages - 2) {
                  // Near the end: show last 3 pages before last
                  start = Math.max(2, totalPages - 3);
                  end = totalPages - 1;
                } else {
                  // In the middle: show current page and neighbors
                  start = pageSafe - 1;
                  end = pageSafe + 1;
                }
                
                // Add ellipsis if there's a gap after page 1
                if (start > 2) {
                  pages.push("...");
                }
                
                // Add pages around current page (avoid duplicates with first/last)
                for (let i = start; i <= end && i < totalPages; i++) {
                  if (i > 1 && i < totalPages) {
                    pages.push(i);
                  }
                }
                
                // Add ellipsis if there's a gap before last page
                if (end < totalPages - 1) {
                  pages.push("...");
                }
                
                // Always show last page
                if (totalPages > 1) {
                  pages.push(totalPages);
                }
              }
              
              return pages.map((pageNum, idx) => {
                if (pageNum === "...") {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 text-black dark:text-white">
                      ...
                    </span>
                  );
                }
                
                const isActive = pageNum === pageSafe;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum as number)}
                    className={`min-w-[32px] rounded border px-2 py-1 text-sm transition-colors ${
                      isActive
                        ? "bg-primary text-white border-primary"
                        : "text-black dark:text-white dark:border-strokedark hover:bg-gray-100 dark:hover:bg-[#222]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}
          </div>
          
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded border px-3 py-1 text-sm text-black dark:text-white dark:border-strokedark hover:bg-gray-100 dark:hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={pageSafe === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableOne;
