"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import MoleculeStructure from "@/components/MoleculeStructure";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowLeft, Download } from "lucide-react";
import bank from "@/data/moleculeBank.json";
import jsPDF from "jspdf";

export default function PubChem() {
  const [compoundName, setCompoundName] = useState("");
  const [compoundData, setCompoundData] = useState<CompoundData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [incomingStructure, setIncomingStructure] = useState<string | null>(null);
  const [canGoBackToBank, setCanGoBackToBank] = useState(false);

  const fetchCompoundData = async (name?: string) => {
    const effectiveName = (name ?? compoundName).trim();
    if (!effectiveName) return;
    setLoading(true);
    setError("");
    setCompoundData(null);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchCompoundData(compoundName);
    }
  };

  // Prefill from query and auto-search
  useEffect(() => {
    const q = searchParams?.get("query");
    const s = searchParams?.get("structure");
    if (q) {
      setCompoundName(q);
      fetchCompoundData(q);
    }
    if (s) {
      // Trust the structure from the bank for rendering immediately
      setIncomingStructure(s.trim());
    }
    try {
      const hasState = !!sessionStorage.getItem("moleculeBankState");
      setCanGoBackToBank(hasState);
    } catch {}
  }, [searchParams]);

  const handleResearchRandom = () => {
    const list = Array.isArray(bank) ? (bank as any[]) : [];
    if (!list.length) return;
    const idx = Math.floor(Math.random() * list.length);
    const picked = list[idx];
    const name = picked?.moleculeName || "";
    const structure = (picked?.smilesStructure || "").trim();
    if (!name) return;
    setCompoundName(name);
    if (structure) setIncomingStructure(structure);
    fetchCompoundData(name);
  };

  const downloadReport = async () => {
    if (!compoundData) return;

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Compound Research Report", margin, yPosition);
      yPosition += 10;

      // Compound Name
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Compound: ${compoundName}`, margin, yPosition);
      yPosition += 15;

      // Capture the molecule structure canvas
      const canvas = document.getElementById("research-canonical-canvas") as HTMLCanvasElement;
      if (canvas) {
        try {
          // Convert canvas to image
          const imgData = canvas.toDataURL("image/png");
          const imgWidth = 80;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Check if image fits on current page
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

      // Basic Information
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

      // Physical Properties
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

      // Additional Information
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

      // Save the PDF
      const fileName = `Compound_Report_${compoundName.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating report. Please try again.");
    }
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto h-[140dvh] p-0">
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
            <div className="relative mt-2 flex w-full md:mt-0 md:w-auto md:justify-end">
              <input
                type="text"
                value={compoundName}
                onChange={(e) => setCompoundName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border-gray-300 w-full rounded-lg border bg-white p-3 pl-10 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-96"
                placeholder="Enter a compound name"
              />
              <span className="absolute inset-y-0 right-3 flex items-center">
                <Search className="text-gray-500" />
              </span>
            </div>
          </div>
        </div>

        {compoundName.trim() === "" && !loading && (
          <div className="flex min-h-[40vh] w-full items-center justify-center">
            <button
              onClick={handleResearchRandom}
              className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 hover:shadow-xl active:scale-[0.99]"
            >
              <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-40 blur-lg transition-opacity group-hover:opacity-60"></span>
              <span className="relative">Research Random Molecule</span>
            </button>
          </div>
        )}

        {error && <p className="text-red-600 mt-6">{error}</p>}

        {compoundData && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="dark:bg-gray-800  space-y-3 rounded-lg bg-white p-6  shadow-md">
              <h2 className="text-gray-700 mb-4 text-xl text-black  dark:text-white">
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

            <div className="dark:bg-gray-800 space-y-3 rounded-lg bg-white p-6 shadow-md">
              <h2 className="text-gray-700 mb-4 text-xl text-black  dark:text-white">
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

            <div className="dark:bg-gray-800 space-y-3 rounded-lg bg-white p-6 shadow-md md:col-span-2">
              <h2 className="text-gray-700 mb-4 text-xl text-black  dark:text-white">
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
