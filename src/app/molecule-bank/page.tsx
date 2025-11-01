"use client";
import ComponetHeader from "@/components/ComponentHeader/ComponentHeader";
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
      <ComponetHeader pageName="Molecule Bank" containActionButton={true} />
      <div className="flex flex-col gap-10 overflow-hidden">
        <MoleculeBankTable />
      </div>
    </DefaultLayout>
  );
};

export default Page;
