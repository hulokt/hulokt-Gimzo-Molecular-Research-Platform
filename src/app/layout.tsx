"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Script from "next/script";
import Loader from "@/components/common/Loader";

import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";
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

  const client = new Ably.Realtime({
    key: "lOiy_Q.0SoWBQ:uWmPL32cUtMGcuGTNnJuGruugF-cnYHKJhsheGHDlts",
  });
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Script
          src="https://unpkg.com/@rdkit/rdkit/dist/RDKit_minimal.js"
          strategy="afterInteractive"
        />
        <SessionProvider>
          <UserProvider>
            <AblyProvider client={client}>
              <ChannelProvider channelName="chat-demo1">
                <div className="font-poppins">
                  {loading ? <Loader /> : children}
                </div>
              </ChannelProvider>
            </AblyProvider>
          </UserProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
