"use client";

import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";
import ChatBox from "./chat-box.jsx";
import React, { useMemo } from "react";

export default function Chat() {
  const ablyKey = process.env.NEXT_PUBLIC_ABLY_KEY;
  const client = useMemo(() => {
    if (!ablyKey) return null;
    return new Ably.Realtime({ key: ablyKey });
  }, [ablyKey]);
  
  if (!client) {
    return (
      <main className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300">
          Messages are unavailable because `NEXT_PUBLIC_ABLY_KEY` is not set.
        </div>
      </main>
    );
  }

  return (
    <AblyProvider client={client}>
      <ChannelProvider channelName="gimzo-chat">
        <ChatBox />
      </ChannelProvider>
    </AblyProvider>
  );
}
