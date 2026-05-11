"use client";
import { Key, Shield, Bell, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage API keys, risk limits, and account preferences.</p>
      </div>

      {/* API Keys */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-bg-border text-text-primary">
          <Key className="text-brand" />
          <h2 className="text-lg font-semibold">Broker API Keys</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-bg-elevated p-4 rounded-lg border border-bg-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold">B</div>
              <div>
                <h4 className="font-medium text-text-primary">Binance (Production)</h4>
                <p className="text-xs text-text-muted mt-0.5">Added: May 01, 2026</p>
              </div>
            </div>
            <button className="text-xs font-medium text-red-trade hover:text-red-trade/80 transition-colors">Delete</button>
          </div>
          
          <button className="w-full py-3 border border-dashed border-bg-border rounded-lg text-text-secondary hover:text-text-primary hover:border-brand/50 hover:bg-brand/5 transition-all flex items-center justify-center gap-2 font-medium">
            + Add New API Key
          </button>
        </div>
      </div>

      {/* Global Risk */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-bg-border text-text-primary">
          <Shield className="text-brand" />
          <h2 className="text-lg font-semibold">Global Risk Limits</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Max Position Size (%)</label>
            <input type="number" defaultValue="2.0" className="input-field" step="0.1" />
            <p className="text-xs text-text-muted mt-1.5">Maximum % of portfolio allowed per trade.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Daily Loss Limit (%)</label>
            <input type="number" defaultValue="5.0" className="input-field" step="0.1" />
            <p className="text-xs text-text-muted mt-1.5">Halt all trading if daily loss exceeds this.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Default Stop Loss (%)</label>
            <input type="number" defaultValue="1.5" className="input-field" step="0.1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Max Open Trades</label>
            <input type="number" defaultValue="5" className="input-field" />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button className="btn-primary">Save Risk Settings</button>
        </div>
      </div>
      
      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-bg-border text-text-primary">
          <Bell className="text-brand" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-text-primary">Telegram Alerts</p>
              <p className="text-xs text-text-muted mt-0.5">Receive execution and error alerts via Telegram.</p>
            </div>
            <div className="w-10 h-6 bg-brand rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </label>
          <div className="pt-2">
            <input type="text" placeholder="Telegram Chat ID" className="input-field max-w-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
