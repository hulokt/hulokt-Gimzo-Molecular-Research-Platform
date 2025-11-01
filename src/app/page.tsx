import Index from "@/components/dashboard";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title: "Gimzo — Molecular Research Platform",
  description: "Gimzo — Molecular Research Platform for drug discovery and protein-binding prediction",
};

export default function Home() {
  return (
    <>
      <DefaultLayout>
        <Index />
      </DefaultLayout>
    </>
  );
}
