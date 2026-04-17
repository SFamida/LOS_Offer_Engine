"use client";

import { useState, useMemo } from "react";
import { Merchant } from "@/types/merchant";
import MerchantModal from "@/components/MerchantModal";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const INITIAL_DATA: Merchant[] = [
  {
    id: "1",
    name: "ABC Electronics",
    minLoanAmount: 500,
    maxLoanAmount: 20000,
    vantageMin: 620,
    vantageMax: 850,
    minTerm: 6,
    maxTerm: 48,
    offers: ["Same As Cash", "Zero Interest"],
    status: "Active",
    createdAt: "2024-02-10",
  },
  {
    id: "2",
    name: "Greenfield Home Goods",
    minLoanAmount: 1000,
    maxLoanAmount: 35000,
    vantageMin: 640,
    vantageMax: 820,
    minTerm: 12,
    maxTerm: 60,
    offers: ["Same As Cash"],
    status: "Active",
    createdAt: "2024-05-18",
  },
  {
    id: "3",
    name: "Sunset Auto Parts",
    minLoanAmount: 250,
    maxLoanAmount: 10000,
    vantageMin: 580,
    vantageMax: 760,
    minTerm: 3,
    maxTerm: 36,
    offers: [],
    status: "Inactive",
    createdAt: "2023-09-30",
  },
];

const OFFER_COLORS: Record<string, { bg: string; color: string }> = {
  "Same As Cash": { bg: "#e8f5e9", color: "#2e7d32" },
  "Zero Interest": { bg: "#e3f2fd", color: "#1565c0" },
};

interface RatePlan {
  band: string;
  amount: string;
  term: string;
  apr: string;
  fee: string;
}

const RATE_PLANS: RatePlan[] = [
  { band: "760 - 850", amount: "$2,500 - $10,000",  term: "36 months",  apr: "10.99%", fee: "0%" },
  { band: "760 - 850", amount: "$2,500 - $10,000",  term: "48 months",  apr: "10.99%", fee: "0%" },
  { band: "760 - 850", amount: "$2,500 - $85,000",  term: "60 months",  apr: "10.99%", fee: "0%" },
  { band: "760 - 850", amount: "$2,500 - $5,000",   term: "72 months",  apr: "10.99%", fee: "0%" },
  { band: "760 - 850", amount: "$10,000 - $85,000", term: "96 months",  apr: "10.99%", fee: "0%" },
  { band: "760 - 850", amount: "$5,000 - $85,000",  term: "120 months", apr: "10.99%", fee: "0%" },
  { band: "760 - 850", amount: "$10,000 - $85,000", term: "180 months", apr: "10.99%", fee: "0%" },
  { band: "730 - 759", amount: "$2,500 - $10,000",  term: "36 months",  apr: "11.99%", fee: "0%" },
  { band: "730 - 759", amount: "$2,500 - $10,000",  term: "48 months",  apr: "11.99%", fee: "0%" },
  { band: "730 - 759", amount: "$2,500 - $85,000",  term: "60 months",  apr: "11.99%", fee: "0%" },
  { band: "730 - 759", amount: "$2,500 - $5,000",   term: "72 months",  apr: "11.99%", fee: "0%" },
  { band: "730 - 759", amount: "$10,000 - $85,000", term: "96 months",  apr: "11.99%", fee: "0%" },
  { band: "730 - 759", amount: "$5,000 - $85,000",  term: "120 months", apr: "11.99%", fee: "0%" },
  { band: "730 - 759", amount: "$10,000 - $85,000", term: "180 months", apr: "11.99%", fee: "0%" },
  { band: "700 - 729", amount: "$2,500 - $10,000",  term: "36 months",  apr: "13.99%", fee: "0%" },
  { band: "700 - 729", amount: "$2,500 - $10,000",  term: "48 months",  apr: "13.99%", fee: "0%" },
  { band: "700 - 729", amount: "$2,500 - $85,000",  term: "60 months",  apr: "13.99%", fee: "0%" },
  { band: "700 - 729", amount: "$2,500 - $5,000",   term: "72 months",  apr: "13.99%", fee: "0%" },
  { band: "700 - 729", amount: "$10,000 - $85,000", term: "96 months",  apr: "13.99%", fee: "0%" },
  { band: "700 - 729", amount: "$5,000 - $85,000",  term: "120 months", apr: "13.99%", fee: "0%" },
  { band: "700 - 729", amount: "$10,000 - $85,000", term: "180 months", apr: "13.99%", fee: "0%" },
  { band: "680 - 699", amount: "$2,500 - $10,000",  term: "36 months",  apr: "15.99%", fee: "0%" },
  { band: "680 - 699", amount: "$2,500 - $10,000",  term: "48 months",  apr: "15.99%", fee: "0%" },
  { band: "680 - 699", amount: "$2,500 - $80,000",  term: "60 months",  apr: "15.99%", fee: "0%" },
  { band: "680 - 699", amount: "$2,500 - $5,000",   term: "72 months",  apr: "15.99%", fee: "0%" },
  { band: "680 - 699", amount: "$10,000 - $80,000", term: "96 months",  apr: "15.99%", fee: "0%" },
  { band: "680 - 699", amount: "$5,000 - $80,000",  term: "120 months", apr: "15.99%", fee: "0%" },
  { band: "680 - 699", amount: "$10,000 - $80,000", term: "180 months", apr: "15.99%", fee: "0%" },
  { band: "640 - 679", amount: "$2,500 - $10,000",  term: "36 months",  apr: "17.99%", fee: "4%" },
  { band: "640 - 679", amount: "$2,500 - $10,000",  term: "48 months",  apr: "17.99%", fee: "4%" },
  { band: "640 - 679", amount: "$2,500 - $50,000",  term: "60 months",  apr: "17.99%", fee: "4%" },
  { band: "640 - 679", amount: "$2,500 - $5,000",   term: "72 months",  apr: "17.99%", fee: "4%" },
  { band: "640 - 679", amount: "$10,000 - $50,000", term: "96 months",  apr: "17.99%", fee: "4%" },
  { band: "640 - 679", amount: "$5,000 - $50,000",  term: "120 months", apr: "17.99%", fee: "4%" },
];

const BAND_COLORS: Record<string, string> = {
  "760 - 850": "#f0fdf4",
  "730 - 759": "#eff6ff",
  "700 - 729": "#fefce8",
  "680 - 699": "#fff7ed",
  "640 - 679": "#fdf4ff",
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>(INITIAL_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [ratePlansFor, setRatePlansFor] = useState<Merchant | null>(null);

  const filtered = useMemo(() => {
    return merchants.filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [merchants, search, statusFilter]);

  const handleAdd = () => { setEditing(null); setIsModalOpen(true); };
  const handleEdit = (m: Merchant) => { setEditing(m); setIsModalOpen(true); };

  const handleSave = (data: Omit<Merchant, "id" | "createdAt">) => {
    if (editing) {
      setMerchants((prev) => prev.map((m) => (m.id === editing.id ? { ...m, ...data } : m)));
    } else {
      setMerchants((prev) => [
        { ...data, id: Date.now().toString(), createdAt: new Date().toISOString().split("T")[0] },
        ...prev,
      ]);
    }
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setMerchants((prev) => prev.filter((m) => m.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-bg)" }}>
      <main className="page-content">
        <div className="section-header">
          <div>
            <h2 className="section-title">Merchant Management</h2>
            <p className="section-sub">
              {merchants.length} total &bull;{" "}
              {merchants.filter((m) => m.status === "Active").length} active
            </p>
          </div>
          <button className="btn-primary" onClick={handleAdd}>
            <span style={{ fontSize: "1.1rem", lineHeight: "1" }}>+</span>
            Add Merchant
          </button>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            className="filter-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by merchant name..."
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["All", "Active", "Inactive"] as const).map((s) => (
              <button
                key={s}
                className={`filter-pill${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <svg style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.35 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ fontWeight: 600 }}>No merchants found</p>
              <p style={{ fontSize: "0.78rem", marginTop: 4 }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Merchant Name</th>
                    <th>Loan Amount Range</th>
                    <th>Vantage Score Range</th>
                    <th>Term Range</th>
                    <th>Offers</th>
                    <th>Excel File</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id} className="group">
                      <td className="td-name">{m.name}</td>
                      <td>
                        <div>{fmt(m.minLoanAmount)}</div>
                        <div className="td-sub">up to {fmt(m.maxLoanAmount)}</div>
                      </td>
                      <td>
                        <div>{m.vantageMin} - {m.vantageMax}</div>
                      </td>
                      <td>
                        <div>{m.minTerm} - {m.maxTerm} months</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                          {m.offers.length === 0 ? (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>—</span>
                          ) : m.offers.map((offer) => (
                            <span key={offer} style={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: OFFER_COLORS[offer]?.bg ?? "#f3f4f6",
                              color: OFFER_COLORS[offer]?.color ?? "#374151",
                              whiteSpace: "nowrap",
                            }}>
                              {offer}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {m.excelFileName ? (
                          <span style={{ fontSize: "0.78rem", color: "var(--brand-blue)" }} title={m.excelFileName}>
                            {m.excelFileName.length > 18 ? m.excelFileName.slice(0, 15) + "..." : m.excelFileName}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${m.status === "Active" ? "badge-active" : "badge-inactive"}`}>
                          <span className="badge-dot" />
                          {m.status}
                        </span>
                      </td>
                      <td>{m.createdAt}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="reveal-actions flex justify-end gap-2">
                          <button
                            className="btn-row-edit"
                            style={{ background: "var(--surface-bg)", color: "var(--brand-blue)", border: "1px solid var(--brand-blue)" }}
                            onClick={() => setRatePlansFor(m)}
                          >
                            Rate Plans
                          </button>
                          <button className="btn-row-edit" onClick={() => handleEdit(m)}>Edit</button>
                          <button className="btn-row-delete" onClick={() => setDeleteConfirm(m.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="stat-grid">
          {[
            { label: "Total Merchants", value: merchants.length },
            { label: "Active",   value: merchants.filter((m) => m.status === "Active").length },
            { label: "Inactive", value: merchants.filter((m) => m.status === "Inactive").length },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
            </div>
          ))}
        </div>
      </main>

      <MerchantModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        existing={editing}
      />

      {/* Rate Plans Modal */}
      {ratePlansFor && (
        <div className="modal-overlay" onClick={() => setRatePlansFor(null)}>
          <div
            className="modal-box"
            style={{ maxWidth: 780, width: "95vw" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="modal-title">Standard Rate Plans</span>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
                  {ratePlansFor.name}
                </div>
              </div>
              <button className="modal-close" onClick={() => setRatePlansFor(null)} aria-label="Close">&times;</button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div style={{ overflowX: "auto", maxHeight: "60vh", overflowY: "auto" }}>
                <table className="data-table" style={{ fontSize: "0.8rem" }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--surface-card)" }}>
                    <tr>
                      <th>Vantage Band</th>
                      <th>Amount</th>
                      <th>Term</th>
                      <th>APR</th>
                      <th>Program Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RATE_PLANS.map((rp, i) => {
                      const prevBand = i > 0 ? RATE_PLANS[i - 1].band : null;
                      const isNewBand = rp.band !== prevBand;
                      return (
                        <tr
                          key={i}
                          style={{ background: BAND_COLORS[rp.band] ?? "transparent" }}
                        >
                          <td style={{ fontWeight: isNewBand ? 700 : 400, color: isNewBand ? "var(--text-primary)" : "var(--text-secondary)" }}>
                            {isNewBand ? rp.band : ""}
                          </td>
                          <td className="td-mono">{rp.amount}</td>
                          <td>{rp.term}</td>
                          <td style={{ fontWeight: 600, color: "var(--brand-blue)" }}>{rp.apr}</td>
                          <td>
                            <span style={{
                              display: "inline-block",
                              padding: "1px 8px",
                              borderRadius: 999,
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              background: rp.fee === "0%" ? "#f0fdf4" : "#fff7ed",
                              color: rp.fee === "0%" ? "#15803d" : "#c2410c",
                            }}>
                              {rp.fee}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setRatePlansFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Delete Merchant?</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                This action cannot be undone. The merchant will be permanently removed.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
