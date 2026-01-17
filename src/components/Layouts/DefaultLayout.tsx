"use client";
import React, { useState, useLayoutEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = [
    "/auth-page/signin",
    "/auth-page/signup",
    "/verify-email",
    "/reset-password",
  ];

  useLayoutEffect(() => {
    if (status === "unauthenticated" && !publicRoutes.includes(pathname)) {
      router.push("/auth-page/signin");
    }
  }, [status, router, pathname]);

  return (
    <>
      <div className={`flex ${pathname === "/message" || pathname === "/" ? "h-screen overflow-hidden" : "min-h-screen"}`}>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-1 flex-col lg:ml-72.5">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main
            className={`flex-1 bg-slate-50 dark:bg-slate-950 ${
              pathname === "/message" || pathname === "/" ? "overflow-hidden" : ""
            }`}
          >
            <div
              className={`${
                publicRoutes.includes(pathname)
                  ? "w-full min-h-full overflow-hidden"
                  : pathname === "/message"
                  ? "mx-auto h-full min-h-full max-w-screen-2xl overflow-hidden p-4"
                  : pathname === "/model"
                  ? "mx-auto min-h-full max-w-screen-2xl"
                  : pathname === "/molecule-bank"
                  ? "mx-auto max-w-screen-2xl min-h-full overflow-hidden"
                  : "mx-auto max-w-screen-2xl min-h-full"
              }`}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
