"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";

import { SessionProvider } from "next-auth/react";
import { UserProvider } from "@/app/context/UserContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  useEffect(() => {
    const noop = () => {};
    if (typeof window !== "undefined") {
      console.log = noop;
      console.info = noop;
      console.warn = noop;
      console.error = noop;
      console.debug = noop;
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/images/favicon.ico" sizes="32x32" />
        <title>Gimzo - Molecular Research Platform</title>
        <meta name="description" content="AI-powered molecular research platform for drug discovery and compound analysis" />
      </head>
      <body suppressHydrationWarning={true}>
        <SessionProvider>
          <UserProvider>
            <div className="font-poppins">{loading ? <Loader /> : children}</div>
          </UserProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
