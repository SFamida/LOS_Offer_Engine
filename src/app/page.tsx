"use client";

import { useState, useEffect } from "react";
import CreditUnionsPage from "@/components/CreditUnionsPage";
import MerchantsPage from "@/components/MerchantsPage";
import CustomConfigPage from "@/components/CustomConfigPage";
import OffersPage from "@/components/OffersPage";
import { Offer } from "@/types/offer";

type Tab = "creditUnions" | "merchants" | "customConfig" | "offers";

const TABS: { key: Tab; label: string }[] = [
  { key: "creditUnions", label: "Credit Unions" },
  { key: "merchants",    label: "Merchants" },
  { key: "customConfig", label: "Custom Config" },
  { key: "offers",       label: "Offers" },
];

const BADGE_LABELS: Record<Tab, string> = {
  creditUnions: "Credit Unions",
  merchants:    "Merchants",
  customConfig: "Custom Config",
  offers:       "Offers",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("creditUnions");
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then((data) => setOffers(data))
      .catch(() => {/* DB not yet configured – silently ignore */});
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-bg)" }}>
      {/* App Header */}
      <header className="app-header">
        <div className="app-header-inner">
          <div>
            <div className="app-logo-title">LOS Offers Config</div>
            <div className="app-logo-sub">Loan Origination System - Configuration Portal</div>
          </div>
          <span className="app-badge">{BADGE_LABELS[activeTab]}</span>
        </div>
      </header>

      {/* Tab Bar */}
      <div style={{
        background: "var(--surface-card)",
        borderBottom: "1px solid var(--border-color)",
        padding: "0 2rem",
        display: "flex",
        gap: "0",
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "0.85rem 1.5rem",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid var(--brand-blue)" : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? "var(--brand-blue)" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Page Content */}
      {activeTab === "creditUnions" && <CreditUnionsPage embedded />}
      {activeTab === "merchants"    && <MerchantsPage />}
      {activeTab === "customConfig" && <CustomConfigPage availableOffers={offers} />}
      {activeTab === "offers"       && <OffersPage embedded offers={offers} onOffersChange={setOffers} />}
    </div>
  );
}
