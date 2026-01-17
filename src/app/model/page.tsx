"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import MoleculeStructure from "../../components/MoleculeStructure/index";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Trash2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createMoleculeGenerationHistory,
  getMoleculeGenerationHistoryByUser,
  deleteMoleculeGenerationHistory,
} from "@/lib/actions/molecule-generation.action";
import { getUserByEmail } from "@/lib/actions/user.actions";
import bank from "@/data/moleculeBank.json";

interface MoleculeSuggestion {
  moleculeName: string;
  smilesStructure: string;
  molecularWeight: number;
  categoryUsage: string;
}

// Modern tooltip component - renders with fixed positioning to avoid overflow issues
const Tooltip = ({ content }: { content: string }) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    }
  };
  
  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={() => { updatePosition(); setShow(true); }}
        onMouseLeave={() => setShow(false)}
        onClick={() => { updatePosition(); setShow(!show); }}
        className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900"
      >
        <Info className="h-3 w-3" />
      </button>
      {show && (
        <div 
          className="fixed z-[9999] w-72 -translate-x-1/2 -translate-y-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-xl dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          style={{ top: position.top, left: position.left }}
        >
          {content}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-gray-800"></div>
        </div>
      )}
    </>
  );
};

// Skeleton loader for molecule cards
const MoleculeSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#1f1f1f]">
    <div className="mb-3 h-40 rounded-lg bg-gray-100 dark:bg-gray-700"></div>
    <div className="h-4 w-1/2 rounded bg-gray-100 dark:bg-gray-700"></div>
    <div className="mt-4 flex justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
      <div className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-700"></div>
      <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-700"></div>
    </div>
  </div>
);

// Preset configurations
const PRESETS = {
  standard: {
    name: "Quick",
    description: "Fast results",
    numMolecules: "5",
    minSimilarity: "0.5",
    particles: "10",
    iterations: "5",
  },
  balanced: {
    name: "Standard",
    description: "Recommended",
    numMolecules: "10",
    minSimilarity: "0.3",
    particles: "30",
    iterations: "10",
  },
  comprehensive: {
    name: "Deep",
    description: "More variety",
    numMolecules: "20",
    minSimilarity: "0.2",
    particles: "50",
    iterations: "20",
  },
};

const ModalLayout = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [smiles, setSmiles] = useState("");
  const [numMolecules, setNumMolecules] = useState("10");
  const [minSimilarity, setMinSimilarity] = useState("0.3");
  const [particles, setParticles] = useState("30");
  const [iterations, setIterations] = useState("10");
  const [molecules, setMolecules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("balanced");
  const [copied, setCopied] = useState<string | null>(null);
  
  // Molecule Merger State
  const [showMerger, setShowMerger] = useState(true);
  const [showGenerator, setShowGenerator] = useState(true);
  const [molecule1, setMolecule1] = useState<MoleculeSuggestion | null>(null);
  const [molecule2, setMolecule2] = useState<MoleculeSuggestion | null>(null);
  const [mergedSmiles, setMergedSmiles] = useState("");
  const [mergeType, setMergeType] = useState<"link" | "fuse" | "combine">("link");
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [showSearch1, setShowSearch1] = useState(false);
  const [showSearch2, setShowSearch2] = useState(false);

  const moleculeList = Array.isArray(bank) ? (bank as MoleculeSuggestion[]) : [];

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          const user = await getUserByEmail(session.user.email);
          setUserId(user._id);
          const historyFromServer = await getMoleculeGenerationHistoryByUser(
            user._id,
          );
          setHistory(historyFromServer);
        } catch (error) {
          console.error("Error fetching user or history:", error);
        }
      }
    };

    fetchUserData();
  }, [session?.user?.email]);

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey as keyof typeof PRESETS];
    if (preset) {
      setNumMolecules(preset.numMolecules);
      setMinSimilarity(preset.minSimilarity);
      setParticles(preset.particles);
      setIterations(preset.iterations);
      setActivePreset(presetKey);
    }
  };

  // Molecule Merge Logic
  const mergeMolecules = useCallback(() => {
    if (!molecule1 || !molecule2) return;

    const smiles1 = molecule1.smilesStructure;
    const smiles2 = molecule2.smilesStructure;

    let result = "";

    switch (mergeType) {
      case "link":
        result = `${smiles1}.CC.${smiles2}`;
        break;
      case "fuse":
        result = `${smiles1}-${smiles2}`;
        break;
      case "combine":
        result = `${smiles1}.${smiles2}`;
        break;
    }

    setMergedSmiles(result);
  }, [molecule1, molecule2, mergeType]);

  useEffect(() => {
    if (molecule1 && molecule2) {
      mergeMolecules();
    }
  }, [molecule1, molecule2, mergeType, mergeMolecules]);

  const useMergedSmiles = () => {
    if (mergedSmiles) {
      setSmiles(mergedSmiles);
      setShowMerger(false);
    }
  };

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id || "main");
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const pickRandomMolecule = (setter: React.Dispatch<React.SetStateAction<MoleculeSuggestion | null>>) => {
    const idx = Math.floor(Math.random() * moleculeList.length);
    setter(moleculeList[idx]);
  };

  const filterMolecules = (query: string) => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return moleculeList
      .filter(m => 
        m.moleculeName.toLowerCase().includes(lower) ||
        m.categoryUsage.toLowerCase().includes(lower)
      )
      .slice(0, 6);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!smiles.trim()) {
      alert("Please enter a SMILES string or use the Molecule Merger to create one.");
      return;
    }
    
    setLoading(true);
    setMolecules([]);
    setShowMerger(false);
    setShowGenerator(false);

    const payload = {
      num_molecules: parseInt(numMolecules),
      min_similarity: parseFloat(minSimilarity),
      particles: parseInt(particles),
      iterations: parseInt(iterations),
      smi: smiles,
    };

    try {
      const response = await fetch("/api/generate-molecules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate molecules");
      }

      const data = await response.json();
      const generatedMolecules = JSON.parse(data.molecules).map((mol: any) => ({
        structure: mol.sample,
        score: mol.score,
      }));

      setMolecules(generatedMolecules);

      if (userId) {
        await createMoleculeGenerationHistory(
          {
            smiles,
            numMolecules: parseInt(numMolecules),
            minSimilarity: parseFloat(minSimilarity),
            particles: parseInt(particles),
            iterations: parseInt(iterations),
            generatedMolecules,
          },
          userId,
        );

        const updatedHistory = await getMoleculeGenerationHistoryByUser(userId);
        setHistory(updatedHistory);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error generating molecules. Please check your SMILES string and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (entryId: string) => {
    try {
      await deleteMoleculeGenerationHistory(entryId);
      
      if (userId) {
        const updatedHistory = await getMoleculeGenerationHistoryByUser(userId);
        setHistory(updatedHistory);
      }
    } catch (error) {
      console.error("Error deleting history entry:", error);
      alert("Failed to delete history entry. Please try again.");
    }
  };

  const researchMolecule = (smilesStructure: string) => {
    const encodedSmiles = encodeURIComponent(smilesStructure);
    router.push(`/research?structure=${encodedSmiles}&generated=true`);
  };

  const skeletonCount = parseInt(numMolecules) || 10;

  // Input class for consistent styling - light background in both modes
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-400";

  return (
    <DefaultLayout>
      <div className="container mx-auto min-h-full w-full p-0">

        <div className="relative mb-6 mt-4 overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-[0_40px_120px_-60px_rgba(30,64,175,0.9)]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/40 via-indigo-500/40 to-transparent blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-400/40 via-sky-500/40 to-transparent blur-3xl" />
          <div className="relative z-10 flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
              AI Molecule Studio
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Generate, merge, and explore molecular structures
            </h2>
            <p className="max-w-2xl text-sm text-white/80">
              Combine molecules, tune AI presets, and launch research workflows
              in a modern workspace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            
            {/* Molecule Combination Tool - removed overflow-hidden */}
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] backdrop-blur-sm dark:border-white/10 dark:bg-[#111827]/80">
              <button
                onClick={() => setShowMerger(!showMerger)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
              >
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                    Molecule Combination
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Combine two molecules to create a new structure
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  {showMerger ? "Hide" : "Show"}
                </span>
              </button>

              {showMerger && (
                <div className="border-t border-slate-200/70 p-5 dark:border-white/10">
                  <div className="grid gap-5 md:grid-cols-2">
                    {/* Molecule 1 */}
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        First Molecule
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={search1}
                          onChange={(e) => {
                            setSearch1(e.target.value);
                            setShowSearch1(true);
                          }}
                          onFocus={() => setShowSearch1(true)}
                          placeholder="Search..."
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => pickRandomMolecule(setMolecule1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                        >
                          Random
                        </button>
                        
                        {showSearch1 && search1 && (
                          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900/90">
                            {filterMolecules(search1).map((mol, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setMolecule1(mol);
                                  setSearch1(mol.moleculeName);
                                  setShowSearch1(false);
                                }}
                                className="w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {mol.moleculeName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {mol.categoryUsage}
                                </div>
                              </button>
                            ))}
                            {filterMolecules(search1).length === 0 && (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                No results
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {molecule1 && (
                        <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {molecule1.moleculeName}
                            </span>
                            <span className="text-slate-500">
                              {molecule1.molecularWeight} g/mol
                            </span>
                          </div>
                          <MoleculeStructure
                            id="merger-mol-1"
                            structure={molecule1.smilesStructure}
                            width={200}
                            height={130}
                          />
                        </div>
                      )}
                    </div>

                    {/* Molecule 2 */}
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Second Molecule
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={search2}
                          onChange={(e) => {
                            setSearch2(e.target.value);
                            setShowSearch2(true);
                          }}
                          onFocus={() => setShowSearch2(true)}
                          placeholder="Search..."
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => pickRandomMolecule(setMolecule2)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                        >
                          Random
                        </button>
                        
                        {showSearch2 && search2 && (
                          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900/90">
                            {filterMolecules(search2).map((mol, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setMolecule2(mol);
                                  setSearch2(mol.moleculeName);
                                  setShowSearch2(false);
                                }}
                                className="w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {mol.moleculeName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {mol.categoryUsage}
                                </div>
                              </button>
                            ))}
                            {filterMolecules(search2).length === 0 && (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                No results
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {molecule2 && (
                        <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {molecule2.moleculeName}
                            </span>
                            <span className="text-slate-500">
                              {molecule2.molecularWeight} g/mol
                            </span>
                          </div>
                          <MoleculeStructure
                            id="merger-mol-2"
                            structure={molecule2.smilesStructure}
                            width={200}
                            height={130}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Combination Method */}
                  <div className="mt-5">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "link", name: "Linker", desc: "C-C bridge" },
                        { key: "fuse", name: "Direct", desc: "Single bond" },
                        { key: "combine", name: "Mixture", desc: "Separate" },
                      ].map((type) => (
                        <button
                          key={type.key}
                          type="button"
                          onClick={() => setMergeType(type.key as any)}
                          className={`rounded-xl border px-3 py-2.5 text-center text-sm transition-all ${
                            mergeType === type.key
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="font-medium">{type.name}</div>
                          <div className="mt-0.5 text-[10px] opacity-70">{type.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Result */}
                  {mergedSmiles && (
                    <div className="mt-5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-indigo-500/10 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-primary">
                          Combined SMILES
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(mergedSmiles)}
                          className="text-xs font-medium text-primary hover:text-primary/80"
                        >
                          {copied === "main" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <code className="block break-all rounded-xl bg-white/80 p-2 font-mono text-xs text-slate-800 dark:bg-slate-900/80 dark:text-slate-200">
                        {mergedSmiles}
                      </code>
                      <button
                        type="button"
                        onClick={useMergedSmiles}
                        className="mt-3 w-full rounded-xl bg-gradient-to-r from-primary to-indigo-500 py-2.5 text-sm font-semibold text-white transition-colors hover:from-primary/90 hover:to-indigo-500/90"
                      >
                        Use in Generator
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generator - removed overflow-hidden */}
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] backdrop-blur-sm dark:border-white/10 dark:bg-[#111827]/80">
              <button
                onClick={() => setShowGenerator(!showGenerator)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
              >
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                    SMILES Generator
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Generate novel molecular structures
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  {showGenerator ? "Hide" : "Show"}
                </span>
              </button>

              {showGenerator && (
              <form onSubmit={handleSubmit} className="border-t border-slate-200/70 p-5 dark:border-white/10">
                {/* Presets */}
                <div className="mb-5">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Preset
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyPreset(key)}
                        className={`rounded-xl border px-3 py-2.5 text-center transition-all ${
                          activePreset === key
                            ? "border-primary bg-primary/10"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div
                          className={`text-sm font-semibold ${
                            activePreset === key
                              ? "text-primary"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {preset.name}
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-500">
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SMILES Input */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      SMILES String
                    </label>
                    <Tooltip content="SMILES (Simplified Molecular Input Line Entry System) is a text notation for representing molecular structures. You can get SMILES from the Research page or combine molecules above." />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={smiles}
                      onChange={(e) => setSmiles(e.target.value)}
                      placeholder="Enter or paste a SMILES string"
                      className={inputClass + " flex-1"}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const idx = Math.floor(Math.random() * moleculeList.length);
                        setSmiles(moleculeList[idx].smilesStructure);
                      }}
                      className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Random
                    </button>
                  </div>
                  {smiles && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        Preview
                      </div>
                      <MoleculeStructure
                        id="input-molecule-preview"
                        structure={smiles}
                        width={250}
                        height={150}
                      />
                    </div>
                  )}
                </div>

                {/* Number of Molecules */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Number of Molecules
                    </label>
                    <Tooltip content="How many new molecules to generate. More molecules means more options but takes longer to compute." />
                  </div>
                  <input
                    type="number"
                    value={numMolecules}
                    onChange={(e) => {
                      setNumMolecules(e.target.value);
                      setActivePreset("");
                    }}
                    min="1"
                    max="50"
                    className={inputClass}
                  />
                </div>

                {/* Advanced Settings */}
                <div className="mb-5">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs font-medium text-primary hover:text-primary/80"
                  >
                    {showAdvanced ? "− Hide" : "+ Show"} advanced settings
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 grid gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60 md:grid-cols-3">
                      <div>
                        <div className="mb-2 flex items-center">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            Min Similarity
                          </label>
                          <Tooltip content="Minimum structural similarity to input (0-1). Lower values produce more diverse results." />
                        </div>
                        <input
                          type="number"
                          value={minSimilarity}
                          onChange={(e) => {
                            setMinSimilarity(e.target.value);
                            setActivePreset("");
                          }}
                          step="0.1"
                          min="0"
                          max="1"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <div className="mb-2 flex items-center">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            Particles
                          </label>
                          <Tooltip content="Number of particles in the optimization. More particles = better exploration but slower." />
                        </div>
                        <input
                          type="number"
                          value={particles}
                          onChange={(e) => {
                            setParticles(e.target.value);
                            setActivePreset("");
                          }}
                          min="5"
                          max="100"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <div className="mb-2 flex items-center">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            Iterations
                          </label>
                          <Tooltip content="Number of optimization iterations. More iterations = better results but takes longer." />
                        </div>
                        <input
                          type="number"
                          value={iterations}
                          onChange={(e) => {
                            setIterations(e.target.value);
                            setActivePreset("");
                          }}
                          min="1"
                          max="50"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-indigo-500 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-primary/90 hover:to-indigo-500/90 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading || !smiles.trim()}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    "Generate Molecules"
                  )}
                </button>
              </form>
              )}
            </div>

            {/* Results - Loading State */}
            {loading && (
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] backdrop-blur-sm dark:border-white/10 dark:bg-[#111827]/80">
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Generated Molecules
                  </h3>
                  <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating {numMolecules} molecules...
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: Math.min(skeletonCount, 6) }).map((_, idx) => (
                    <MoleculeSkeleton key={idx} />
                  ))}
                </div>
              </div>
            )}

            {/* Results - Actual Data */}
            {!loading && molecules.length > 0 && (
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] backdrop-blur-sm dark:border-white/10 dark:bg-[#111827]/80">
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Generated Molecules
                  </h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {molecules.length} results
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {molecules.map((mol: any, index) => (
                    <div
                      key={index}
                      className="group rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#111827]/80"
                    >
                      <MoleculeStructure
                        id={`mol-${index + 1}`}
                        structure={mol.structure}
                        scores={mol.score}
                      />
                      <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-3 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => researchMolecule(mol.structure)}
                          className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                        >
                          Research
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(mol.structure, `mol-${index}`)}
                          className="text-xs text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-300"
                        >
                          {copied === `mol-${index}` ? "Copied!" : "Copy SMILES"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* History Sidebar - Better separated items */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-2xl border border-slate-200/70 bg-white/80 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] backdrop-blur-sm dark:border-white/10 dark:bg-[#111827]/80">
              <div className="border-b border-slate-200/70 px-4 py-3 dark:border-white/10">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  History
                </h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto p-3">
                {history.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-900/60">
                    <p className="text-xs text-slate-500">
                      No generation history yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((entry: any, index) => (
                      <div 
                        key={entry._id || index} 
                        className="rounded-xl border border-slate-200/70 bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <code className="block max-w-[180px] truncate rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                            {entry.smiles}
                          </code>
                          <span className="ml-2 whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            {entry.numMolecules} mol
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="text-[10px] font-semibold text-primary hover:text-primary/80"
                              onClick={() => setMolecules(entry.generatedMolecules)}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="text-gray-400 transition-colors hover:text-red-500"
                              onClick={() => handleDeleteHistory(entry._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ModalLayout;
