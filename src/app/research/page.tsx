"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import MoleculeStructure from "@/components/MoleculeStructure";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowLeft, Download, Sparkles, X, Copy, Check } from "lucide-react";
import bank from "@/data/moleculeBank.json";
import jsPDF from "jspdf";

interface MoleculeSuggestion {
  moleculeName: string;
  smilesStructure: string;
  molecularWeight: number;
  categoryUsage: string;
}

interface CompoundData {
  MolecularFormula: string;
  MolecularWeight: number;
  InChIKey: string;
  CanonicalSMILES: string;
  IsomericSMILES: string;
  IUPACName: string;
  XLogP: number;
  ExactMass: number;
  MonoisotopicMass: number;
  TPSA: number;
  Complexity: number;
  Charge: number;
  HBondDonorCount: number;
  HBondAcceptorCount: number;
  RotatableBondCount: number;
  HeavyAtomCount: number;
}

export default function PubChem() {
  const [compoundName, setCompoundName] = useState("");
  const [compoundData, setCompoundData] = useState<CompoundData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [incomingStructure, setIncomingStructure] = useState<string | null>(null);
  const [canGoBackToBank, setCanGoBackToBank] = useState(false);
  const [isGeneratedMolecule, setIsGeneratedMolecule] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingSmiles, setLoadingSmiles] = useState(false);
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MoleculeSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const filterSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const moleculeList = Array.isArray(bank) ? (bank as MoleculeSuggestion[]) : [];
    
    const filtered = moleculeList
      .filter((mol) => 
        mol.moleculeName.toLowerCase().includes(lowerQuery) ||
        mol.categoryUsage.toLowerCase().includes(lowerQuery) ||
        mol.smilesStructure.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8);
    
    setSuggestions(filtered);
    setSelectedIndex(-1);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompoundName(value);
    filterSuggestions(value);
    setShowSuggestions(true);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: MoleculeSuggestion) => {
    setCompoundName(suggestion.moleculeName);
    setIncomingStructure(suggestion.smilesStructure);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsGeneratedMolecule(false);
    fetchCompoundData(suggestion.moleculeName);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        setIsGeneratedMolecule(false);
        fetchCompoundData(compoundName);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          setIsGeneratedMolecule(false);
          fetchCompoundData(compoundName);
          setShowSuggestions(false);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch compound data by SMILES from PubChem
  const fetchCompoundBySmiles = async (smilesStr: string) => {
    setLoadingSmiles(true);
    try {
      const response = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(
          smilesStr,
        )}/property/MolecularFormula,MolecularWeight,InChIKey,CanonicalSMILES,IsomericSMILES,IUPACName,XLogP,ExactMass,MonoisotopicMass,TPSA,Complexity,Charge,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,HeavyAtomCount/JSON`,
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (
        data &&
        data.PropertyTable &&
        data.PropertyTable.Properties &&
        data.PropertyTable.Properties.length > 0
      ) {
        const compoundInfo = data.PropertyTable.Properties[0];
        return {
          MolecularFormula: compoundInfo.MolecularFormula,
          MolecularWeight: compoundInfo.MolecularWeight,
          InChIKey: compoundInfo.InChIKey,
          CanonicalSMILES: compoundInfo.CanonicalSMILES,
          IsomericSMILES: compoundInfo.IsomericSMILES,
          IUPACName: compoundInfo.IUPACName,
          XLogP: compoundInfo.XLogP,
          ExactMass: compoundInfo.ExactMass,
          MonoisotopicMass: compoundInfo.MonoisotopicMass,
          TPSA: compoundInfo.TPSA,
          Complexity: compoundInfo.Complexity,
          Charge: compoundInfo.Charge,
          HBondDonorCount: compoundInfo.HBondDonorCount,
          HBondAcceptorCount: compoundInfo.HBondAcceptorCount,
          RotatableBondCount: compoundInfo.RotatableBondCount,
          HeavyAtomCount: compoundInfo.HeavyAtomCount,
        };
      }
      return null;
    } catch {
      return null;
    } finally {
      setLoadingSmiles(false);
    }
  };

  const fetchCompoundData = async (name?: string) => {
    const effectiveName = (name ?? compoundName).trim();
    if (!effectiveName) return;
    setLoading(true);
    setError("");
    setCompoundData(null);
    setShowSuggestions(false);

    try {
      const response = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
          effectiveName,
        )}/property/MolecularFormula,MolecularWeight,InChIKey,CanonicalSMILES,IsomericSMILES,IUPACName,XLogP,ExactMass,MonoisotopicMass,TPSA,Complexity,Charge,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,HeavyAtomCount/JSON`,
      );

      if (!response.ok) {
        throw new Error("Compound not found");
      }

      const data = await response.json();

      if (
        data &&
        data.PropertyTable &&
        data.PropertyTable.Properties &&
        data.PropertyTable.Properties.length > 0
      ) {
        const compoundInfo = data.PropertyTable.Properties[0];
        setCompoundData({
          MolecularFormula: compoundInfo.MolecularFormula,
          MolecularWeight: compoundInfo.MolecularWeight,
          InChIKey: compoundInfo.InChIKey,
          CanonicalSMILES: compoundInfo.CanonicalSMILES,
          IsomericSMILES: compoundInfo.IsomericSMILES,
          IUPACName: compoundInfo.IUPACName,
          XLogP: compoundInfo.XLogP,
          ExactMass: compoundInfo.ExactMass,
          MonoisotopicMass: compoundInfo.MonoisotopicMass,
          TPSA: compoundInfo.TPSA,
          Complexity: compoundInfo.Complexity,
          Charge: compoundInfo.Charge,
          HBondDonorCount: compoundInfo.HBondDonorCount,
          HBondAcceptorCount: compoundInfo.HBondAcceptorCount,
          RotatableBondCount: compoundInfo.RotatableBondCount,
          HeavyAtomCount: compoundInfo.HeavyAtomCount,
        });
      } else {
        throw new Error("Compound data is not available");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Prefill from query and auto-search
  useEffect(() => {
    const q = searchParams?.get("query");
    const s = searchParams?.get("structure");
    const generated = searchParams?.get("generated");
    
    if (generated === "true" && s) {
      // This is a generated molecule - try to get info from PubChem using SMILES
      setIsGeneratedMolecule(true);
      setIncomingStructure(s.trim());
      setCompoundName("Generated Molecule");
      
      // Try to fetch compound data by SMILES
      fetchCompoundBySmiles(s.trim()).then((data) => {
        if (data) {
          setCompoundData(data);
          if (data.IUPACName) {
            setCompoundName(data.IUPACName.substring(0, 50) + (data.IUPACName.length > 50 ? "..." : ""));
          }
        }
      });
    } else {
      if (q) {
        setCompoundName(q);
        fetchCompoundData(q);
      }
      if (s) {
        setIncomingStructure(s.trim());
      }
    }
    
    try {
      const hasState = !!sessionStorage.getItem("moleculeBankState");
      setCanGoBackToBank(hasState || generated === "true");
    } catch {}
  }, [searchParams]);

  const handleResearchRandom = () => {
    const list = Array.isArray(bank) ? (bank as MoleculeSuggestion[]) : [];
    if (!list.length) return;
    const idx = Math.floor(Math.random() * list.length);
    const picked = list[idx];
    const name = picked?.moleculeName || "";
    const structure = (picked?.smilesStructure || "").trim();
    if (!name) return;
    setCompoundName(name);
    if (structure) setIncomingStructure(structure);
    setIsGeneratedMolecule(false);
    fetchCompoundData(name);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Download report for generated molecules
  const downloadGeneratedReport = async () => {
    if (!incomingStructure) return;

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Molecule Research Report", margin, yPosition);
      yPosition += 15;

      // Capture the molecule structure canvas
      const canvas = document.getElementById("research-canonical-canvas") as HTMLCanvasElement;
      if (canvas) {
        try {
          const imgData = canvas.toDataURL("image/png");
          const imgWidth = 120;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (yPosition + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 15;
        } catch (err) {
          console.error("Error capturing canvas:", err);
        }
      }

      // If we have compound data from PubChem, include it
      if (compoundData) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Compound Properties", margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const properties = [
          `Molecular Formula: ${compoundData.MolecularFormula || "N/A"}`,
          `Molecular Weight: ${compoundData.MolecularWeight || "N/A"} g/mol`,
          `InChIKey: ${compoundData.InChIKey || "N/A"}`,
          `XLogP: ${compoundData.XLogP ?? "N/A"}`,
          `TPSA: ${compoundData.TPSA ?? "N/A"} Å²`,
          `Complexity: ${compoundData.Complexity ?? "N/A"}`,
          `H-Bond Donors: ${compoundData.HBondDonorCount ?? "N/A"}`,
          `H-Bond Acceptors: ${compoundData.HBondAcceptorCount ?? "N/A"}`,
          `Rotatable Bonds: ${compoundData.RotatableBondCount ?? "N/A"}`,
          `Heavy Atoms: ${compoundData.HeavyAtomCount ?? "N/A"}`,
        ];

        properties.forEach((prop) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(prop, margin, yPosition);
          yPosition += 6;
        });

        yPosition += 10;
      }

      // SMILES
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("SMILES Structure", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      
      const smilesLines = pdf.splitTextToSize(incomingStructure, pageWidth - 2 * margin);
      smilesLines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });

      // Footer with date
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `Generated on ${new Date().toLocaleString()}`,
          pageWidth - margin - 60,
          pageHeight - 10,
        );
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin - 30,
          pageHeight - 10,
        );
      }

      const fileName = `Molecule_Report_${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating report. Please try again.");
    }
  };

  const downloadReport = async () => {
    if (!compoundData) return;

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Compound Research Report", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Compound: ${compoundName}`, margin, yPosition);
      yPosition += 15;

      const canvas = document.getElementById("research-canonical-canvas") as HTMLCanvasElement;
      if (canvas) {
        try {
          const imgData = canvas.toDataURL("image/png");
          const imgWidth = 80;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (yPosition + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (err) {
          console.error("Error capturing canvas:", err);
        }
      }

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Basic Information", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const basicInfo = [
        `Molecular Formula: ${compoundData.MolecularFormula || "N/A"}`,
        `Molecular Weight: ${compoundData.MolecularWeight || "N/A"} g/mol`,
        `InChIKey: ${compoundData.InChIKey || "N/A"}`,
        `Canonical SMILES: ${compoundData.CanonicalSMILES || "N/A"}`,
        `Isomeric SMILES: ${compoundData.IsomericSMILES || "N/A"}`,
        `IUPAC Name: ${compoundData.IUPACName || "N/A"}`,
      ];

      basicInfo.forEach((info) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(info, margin, yPosition);
        yPosition += 7;
      });

      yPosition += 5;

      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Physical Properties", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const physicalProps = [
        `XLogP: ${compoundData.XLogP ?? "N/A"}`,
        `Exact Mass: ${compoundData.ExactMass ?? "N/A"} g/mol`,
        `Monoisotopic Mass: ${compoundData.MonoisotopicMass ?? "N/A"} g/mol`,
        `Topological Polar Surface Area (TPSA): ${compoundData.TPSA ?? "N/A"} Å²`,
        `Complexity: ${compoundData.Complexity ?? "N/A"}`,
        `Charge: ${compoundData.Charge ?? "N/A"}`,
      ];

      physicalProps.forEach((prop) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(prop, margin, yPosition);
        yPosition += 7;
      });

      yPosition += 5;

      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Additional Information", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const additionalInfo = [
        `Hydrogen Bond Donors: ${compoundData.HBondDonorCount ?? "N/A"}`,
        `Hydrogen Bond Acceptors: ${compoundData.HBondAcceptorCount ?? "N/A"}`,
        `Rotatable Bonds: ${compoundData.RotatableBondCount ?? "N/A"}`,
        `Heavy Atom Count: ${compoundData.HeavyAtomCount ?? "N/A"}`,
      ];

      additionalInfo.forEach((info) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(info, margin, yPosition);
        yPosition += 7;
      });

      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `Generated on ${new Date().toLocaleString()}`,
          pageWidth - margin - 60,
          pageHeight - 10,
        );
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin - 30,
          pageHeight - 10,
        );
      }

      const fileName = `Compound_Report_${compoundName.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating report. Please try again.");
    }
  };

  const clearSearch = () => {
    setCompoundName("");
    setCompoundData(null);
    setIncomingStructure(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsGeneratedMolecule(false);
    inputRef.current?.focus();
  };

  // Render view for generated molecules
  if (isGeneratedMolecule && incomingStructure) {
    return (
      <DefaultLayout>
        <div className="container mx-auto min-h-screen p-0">
          <div className="mb-6 flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <div className="flex w-full items-center gap-3 md:w-auto">
              <button
                onClick={() => router.back()}
                aria-label="Go back"
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold text-black dark:text-white">
                Molecule Research
              </h2>
            </div>
            <button
              onClick={downloadGeneratedReport}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              aria-label="Download Report"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
          </div>

          {loadingSmiles && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">Searching PubChem database for compound data...</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Structure Card */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1a1a1a]">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Molecular Structure
              </h3>
              <div className="flex items-center justify-center rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <MoleculeStructure
                  key={incomingStructure}
                  id="research-canonical-canvas"
                  structure={incomingStructure}
                  width={320}
                  height={260}
                />
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1a1a1a]">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                SMILES String
              </h3>
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Canonical SMILES</span>
                  <button
                    onClick={() => copyToClipboard(incomingStructure)}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <code className="block break-all font-mono text-sm text-gray-800 dark:text-gray-200">
                  {incomingStructure}
                </code>
              </div>

              {/* Show properties section - with notice if not available */}
              <div className="mt-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Properties
                </h3>
                {loadingSmiles ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="animate-pulse rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
                        <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-600"></div>
                        <div className="mt-2 h-4 w-20 rounded bg-gray-200 dark:bg-gray-600"></div>
                      </div>
                    ))}
                  </div>
                ) : compoundData ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div className="text-xs text-gray-500">Formula</div>
                      <div className="font-medium text-gray-900 dark:text-white">{compoundData.MolecularFormula || "—"}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div className="text-xs text-gray-500">Weight</div>
                      <div className="font-medium text-gray-900 dark:text-white">{compoundData.MolecularWeight ? `${compoundData.MolecularWeight} g/mol` : "—"}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div className="text-xs text-gray-500">XLogP</div>
                      <div className="font-medium text-gray-900 dark:text-white">{compoundData.XLogP ?? "—"}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div className="text-xs text-gray-500">TPSA</div>
                      <div className="font-medium text-gray-900 dark:text-white">{compoundData.TPSA ? `${compoundData.TPSA} Ų` : "—"}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div className="text-xs text-gray-500">H-Donors</div>
                      <div className="font-medium text-gray-900 dark:text-white">{compoundData.HBondDonorCount ?? "—"}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div className="text-xs text-gray-500">H-Acceptors</div>
                      <div className="font-medium text-gray-900 dark:text-white">{compoundData.HBondAcceptorCount ?? "—"}</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/30">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800">
                        <svg className="h-4 w-4 text-amber-700 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">No Property Data Available</p>
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                          This molecule was not found in the PubChem database. It may be a novel or AI-generated structure.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Properties section - with notice if not available */}
          <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1a1a1a]">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Additional Properties
            </h3>
            {loadingSmiles ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="mt-2 h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                ))}
              </div>
            ) : compoundData ? (
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <div className="text-xs text-gray-500">Complexity</div>
                  <div className="font-medium text-gray-900 dark:text-white">{compoundData.Complexity ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Charge</div>
                  <div className="font-medium text-gray-900 dark:text-white">{compoundData.Charge ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Rotatable Bonds</div>
                  <div className="font-medium text-gray-900 dark:text-white">{compoundData.RotatableBondCount ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Heavy Atoms</div>
                  <div className="font-medium text-gray-900 dark:text-white">{compoundData.HeavyAtomCount ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Exact Mass</div>
                  <div className="font-medium text-gray-900 dark:text-white">{compoundData.ExactMass ? `${compoundData.ExactMass} g/mol` : "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Monoisotopic Mass</div>
                  <div className="font-medium text-gray-900 dark:text-white">{compoundData.MonoisotopicMass ? `${compoundData.MonoisotopicMass} g/mol` : "—"}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-500">InChIKey</div>
                  <div className="font-mono text-xs text-gray-900 dark:text-white">{compoundData.InChIKey || "—"}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/30">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800">
                    <svg className="h-4 w-4 text-amber-700 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">No Additional Data Available</p>
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                      Extended molecular properties could not be retrieved from PubChem.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="container mx-auto min-h-screen p-0">
        <div className="mb-6 flex flex-col items-center gap-3 md:flex-row md:justify-between">
          <div className="flex w-full items-center gap-3 md:w-auto">
            {canGoBackToBank && (
              <button
                onClick={() => router.back()}
                aria-label="Go back to Molecule Bank"
                className="rounded p-2 hover:bg-gray-100 dark:hover:bg-[#1e1e1e]"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-title-md2 font-semibold text-black dark:text-white">
              Compound Search
            </h2>
          </div>
          <div className="flex w-full items-center gap-3 md:w-auto md:justify-end">
            {compoundData && (
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                aria-label="Download Report"
              >
                <Download className="h-5 w-5" />
                <span>Download Report</span>
              </button>
            )}
            
            {/* Autocomplete Search Input */}
            <div className="relative mt-2 w-full md:mt-0 md:w-auto">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={compoundName}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (compoundName.trim() && suggestions.length === 0) {
                      filterSuggestions(compoundName);
                    }
                    setShowSuggestions(true);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 pl-10 pr-10 text-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-[#1e1e1e] dark:text-white md:w-96"
                  placeholder="Search molecules..."
                />
                <span className="absolute inset-y-0 left-3 flex items-center">
                  <Search className="h-5 w-5 text-gray-400" />
                </span>
                {compoundName && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#1e1e1e]"
                >
                  <div className="p-2">
                    <div className="mb-2 flex items-center gap-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <Sparkles className="h-3 w-3" />
                      Suggestions from Molecule Bank
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.moleculeName + index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors ${
                          index === selectedIndex
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {suggestion.moleculeName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.categoryUsage} • MW: {suggestion.molecularWeight} g/mol
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results message */}
              {showSuggestions && compoundName.trim() && suggestions.length === 0 && !loading && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white p-4 text-center shadow-xl dark:border-gray-700 dark:bg-[#1e1e1e]"
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No matches in local bank. Press Enter to search PubChem.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-[40vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-500 dark:text-gray-400">Searching PubChem...</p>
            </div>
          </div>
        )}

        {compoundName.trim() === "" && !loading && (
          <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-6">
            <div className="text-center">
              <h3 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
                Search for any compound
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Start typing to see suggestions from our molecule bank, or enter any compound name to search PubChem
              </p>
            </div>
            <button
              onClick={handleResearchRandom}
              className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 hover:shadow-xl active:scale-[0.99]"
            >
              <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-40 blur-lg transition-opacity group-hover:opacity-60"></span>
              <Sparkles className="relative h-5 w-5" />
              <span className="relative">Research Random Molecule</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {compoundData && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-lg bg-white p-6 shadow-md dark:bg-[#181818]">
              <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
                Basic Information
              </h2>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  Molecular Formula:
                </strong>{" "}
                {compoundData.MolecularFormula}
              </p>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  Molecular Weight:
                </strong>{" "}
                {compoundData.MolecularWeight} g/mol
              </p>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  InChIKey:
                </strong>{" "}
                {compoundData.InChIKey}
              </p>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  Canonical SMILES:
                </strong>
              </p>
              <div className="mt-2">
                {(() => {
                  const smiles = (incomingStructure || compoundData.CanonicalSMILES || compoundData.IsomericSMILES || "").trim();
                  if (!smiles) {
                    return <span className="text-sm text-gray-500">No SMILES available.</span>;
                  }
                  const key = (compoundData?.InChIKey || smiles) + (incomingStructure ? "-bank" : "");
                  return (
                    <MoleculeStructure
                      key={key}
                      id={`research-canonical-canvas`}
                      structure={smiles}
                      width={300}
                      height={220}
                    />
                  );
                })()}
              </div>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  Isomeric SMILES:
                </strong>{" "}
                {compoundData.IsomericSMILES}
              </p>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  IUPAC Name:
                </strong>{" "}
                {compoundData.IUPACName}
              </p>
            </div>

            <div className="space-y-3 rounded-lg bg-white p-6 shadow-md dark:bg-[#181818]">
              <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
                Physical Properties
              </h2>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  XLogP:
                </strong>{" "}
                {compoundData.XLogP}
              </p>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  Exact Mass:
                </strong>{" "}
                {compoundData.ExactMass} g/mol
              </p>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  Monoisotopic Mass:
                </strong>{" "}
                {compoundData.MonoisotopicMass} g/mol
              </p>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  Topological Polar Surface Area (TPSA):
                </strong>{" "}
                {compoundData.TPSA} Å²
              </p>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  Complexity:
                </strong>{" "}
                {compoundData.Complexity}
              </p>
              <p>
                <strong className="text-gray-600 dark:text-gray-300">
                  Charge:
                </strong>{" "}
                {compoundData.Charge}
              </p>
            </div>

            <div className="space-y-3 rounded-lg bg-white p-6 shadow-md md:col-span-2 dark:bg-[#181818]">
              <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
                Additional Information
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <p>
                  <strong className="text-gray-600 dark:text-gray-300">
                    Hydrogen Bond Donors:
                  </strong>{" "}
                  {compoundData.HBondDonorCount}
                </p>
                <p>
                  <strong className="text-gray-600 dark:text-gray-300">
                    Hydrogen Bond Acceptors:
                  </strong>{" "}
                  {compoundData.HBondAcceptorCount}
                </p>
                <p>
                  <strong className="text-gray-600 dark:text-gray-300">
                    Rotatable Bonds:
                  </strong>{" "}
                  {compoundData.RotatableBondCount}
                </p>
                <p>
                  <strong className="text-gray-600 dark:text-gray-300">
                    Heavy Atom Count:
                  </strong>{" "}
                  {compoundData.HeavyAtomCount}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
