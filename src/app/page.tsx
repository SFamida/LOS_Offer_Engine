"use client";

import { useState, useEffect } from "react";
import CreditUnionsPage from "@/components/CreditUnionsPage";
import MerchantsPage from "@/components/MerchantsPage";
import CustomConfigPage from "@/components/CustomConfigPage";
import OffersPage from "@/components/OffersPage";
import { Offer } from "@/types/offer";

type Tab = "creditUnions" | "merchants" | "customConfig" | "offers";

const Icons = {
  CreditUnion: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4"/><path d="M5 21V10.85"/><path d="M19 21V10.85"/><path d="M9 21v-4a2 2 0 0 1 4 0v4"/></svg>
  ),
  Merchant: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
  ),
  Config: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Offers: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
  ),
};

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "offers",       label: "Offers",        icon: <Icons.Offers /> },
  { key: "customConfig", label: "Custom Config", icon: <Icons.Config /> },
  { key: "merchants",    label: "Merchants",     icon: <Icons.Merchant /> },
  { key: "creditUnions", label: "Credit Unions", icon: <Icons.CreditUnion /> },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("offers");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then((data) => setOffers(data))
      .catch(() => {/* DB not yet configured – silently ignore */});
  }, []);

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden text-slate-900">

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-56" : "w-14"
        } bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col shrink-0 relative z-40`}
      >
        <div className="h-14 flex items-center px-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 min-w-[32px] items-center justify-center bg-[#2c3b41] font-bold text-white`}>
              L
            </div>
            {isSidebarOpen && (
              <div className="animate-fade-in whitespace-nowrap overflow-hidden">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">LOS Config</h1>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">ADMINISTRATION</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 px-3 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={activeTab === tab.key ? { backgroundColor: '#2c3b41' } : {}}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-standard ${
                activeTab === tab.key
                  ? "text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="flex-shrink-0">{tab.icon}</span>
              {isSidebarOpen && (
                <span className="text-sm font-medium animate-fade-in">{tab.label}</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 border-t border-slate-100 text-slate-400 hover:text-slate-600 flex justify-center transition-standard"
        >
          {isSidebarOpen ? "«" : "»"}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-30">
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>DASHBOARD</span>
            <span className="text-slate-200">/</span>
            <span className="text-[#2c3b41]">{TABS.find(t => t.key === activeTab)?.label}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
               <span className="block text-xs font-bold text-slate-800 leading-none">System Admin</span>
            </div>
            <div className="h-7 w-7 bg-slate-100 border border-slate-200" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="w-full max-w-[1400px] mx-auto space-y-5 animate-fade-in">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 capitalize">
                  {TABS.find(t => t.key === activeTab)?.label}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">Manage configuration details.</p>
              </div>
            </div>

            <section className="animate-slide-up">
              {activeTab === "creditUnions" && <CreditUnionsPage embedded />}
              {activeTab === "merchants"    && <MerchantsPage embedded />}
              {activeTab === "customConfig" && <CustomConfigPage embedded availableOffers={offers} />}
              {activeTab === "offers"       && <OffersPage embedded offers={offers} onOffersChange={setOffers} />}
            </section>
          </div>
        </main>
      </div>

    </div>
  );
}
