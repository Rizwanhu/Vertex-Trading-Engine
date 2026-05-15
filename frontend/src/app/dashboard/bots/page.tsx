"use client";
import { BotPanel } from "@/components/dashboard/BotPanel";

export default function BotsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full h-full">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Algo Bots</h1>
        <p className="text-text-secondary text-sm mt-1">
          Create, start, and monitor your automated trading bots.
          Each bot runs a strategy tick on its timeframe schedule via Celery.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <BotPanel />
      </div>
    </div>
  );
}
