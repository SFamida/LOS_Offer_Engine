"use client";

import { useState, useMemo } from "react";
import { CustomConfig, VANTAGE_TIERS, VantageTierKey } from "@/types/customConfig";
import CustomConfigModal from "@/components/CustomConfigModal";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Subtract buydown value (integer %) from an APR string like "10.99%" → "9.99%" */
const calcBuydownRate = (apr: string, buydown: number): string => {
  const base = parseFloat(apr);
  return (base - buydown).toFixed(2) + "%";
};

const DEALER_DISCOUNT_BASE = 3.5;
/** Dealer discount = buydown × 3.5% */
const calcDealerDiscount = (buydown: number): string =>
  (buydown * DEALER_DISCOUNT_BASE).toFixed(1) + "%";

const TIER_COLORS: Record<VantageTierKey, string> = {
  reserve:    "#0ea5e9",
  superPrime: "#16a34a",
  primePlus:  "#2563eb",
  prime:      "#7c3aed",
  nearPrime:  "#d97706",
  subPrime:   "#dc2626",
};

const INITIAL_DATA: CustomConfig[] = [
  {
    id: "1",
    vantageConfig: {
      reserve:    { minScore: 800, maxScore: 850, apr: "8.99%",  buydowns: [1, 2, 3, 4] },
      superPrime: { minScore: 760, maxScore: 799, apr: "9.99%",  buydowns: [1, 2, 3, 4] },
      primePlus:  { minScore: 730, maxScore: 759, apr: "10.99%", buydowns: [1, 2, 3, 4] },
      prime:      { minScore: 700, maxScore: 729, apr: "11.99%", buydowns: [1, 2, 3, 4] },
      nearPrime:  { minScore: 680, maxScore: 699, apr: "13.99%", buydowns: [1, 2, 3, 4] },
      subPrime:   { minScore: 640, maxScore: 679, apr: "15.99%", buydowns: [1, 2, 3, 4] },
    },
    brackets: [
      { minAmount: 2500,  maxAmount: 5000,   terms: [36, 48, 60, 72] },
      { minAmount: 5000,  maxAmount: 10000,  terms: [36, 48, 60, 84, 120] },
      { minAmount: 10000, maxAmount: 100000, terms: [60, 84, 96, 120, 180] },
    ],
    status: "Active",
    createdAt: "2024-03-01",
  },
  {
    id: "2",
    vantageConfig: {
      reserve:    { minScore: 800, maxScore: 850, apr: "9.99%",  buydowns: [1, 2] },
      superPrime: { minScore: 760, maxScore: 799, apr: "10.99%", buydowns: [1, 2] },
      primePlus:  { minScore: 730, maxScore: 759, apr: "12.99%", buydowns: [1, 2] },
      prime:      { minScore: 700, maxScore: 729, apr: "14.99%", buydowns: [1, 2] },
      nearPrime:  { minScore: 680, maxScore: 699, apr: "16.99%", buydowns: [1, 2] },
    },
    brackets: [
      { minAmount: 5000,  maxAmount: 50000,  terms: [36, 60, 84] },
      { minAmount: 50000, maxAmount: 100000, terms: [60, 96, 120, 180] },
    ],
    status: "Active",
    createdAt: "2024-06-15",
  },
  {
    id: "3",
    vantageConfig: {
      prime:     { minScore: 700, maxScore: 729, apr: "14.99%", buydowns: [1, 2, 3] },
      nearPrime: { minScore: 680, maxScore: 699, apr: "16.99%", buydowns: [1, 2, 3] },
      subPrime:  { minScore: 640, maxScore: 679, apr: "17.99%", buydowns: [1, 2, 3] },
    },
    brackets: [
      { minAmount: 500,  maxAmount: 5000,  terms: [36, 48] },
      { minAmount: 5000, maxAmount: 25000, terms: [36, 48, 60] },
    ],
    status: "Inactive",
    createdAt: "2023-12-20",
  },
];

export default function CustomConfigPage() {
  const [configs, setConfigs] = useState<CustomConfig[]>(INITIAL_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomConfig | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewPlansFor, setViewPlansFor] = useState<CustomConfig | null>(null);

  const filtered = useMemo(() => configs.filter((c) => {
    const matchSearch = search === "" ||
      Object.values(c.vantageConfig).some((v) => v?.apr.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  }), [configs, search, statusFilter]);

  const handleAdd = () => { setEditing(null); setIsModalOpen(true); };
  const handleEdit = (c: CustomConfig) => { setEditing(c); setIsModalOpen(true); };

  const handleSave = (data: Omit<CustomConfig, "id" | "createdAt">) => {
    if (editing) {
      setConfigs((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...data } : c)));
    } else {
      setConfigs((prev) => [
        { ...data, id: Date.now().toString(), createdAt: new Date().toISOString().split("T")[0] },
        ...prev,
      ]);
    }
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-bg)" }}>
      <main className="page-content">
        <div className="section-header">
          <div>
            <h2 className="section-title">Custom Configuration</h2>
            <p className="section-sub">
              {configs.length} total &bull;{" "}
              {configs.filter((c) => c.status === "Active").length} active
            </p>
          </div>
          <button className="btn-primary" onClick={handleAdd}>
            <span style={{ fontSize: "1.1rem", lineHeight: "1" }}>+</span>
            Add Config
          </button>
        </div>

        <div className="filter-bar">
          <input type="text" className="filter-search" value={search}
            onChange={(e) => setSearch(e.target.value)} placeholder="Search by APR..." />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["All", "Active", "Inactive"] as const).map((s) => (
              <button key={s} className={`filter-pill${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontWeight: 600 }}>No configurations found</p>
              <p style={{ fontSize: "0.78rem", marginTop: 4 }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Vantage Tier APRs</th>
                    <th>Loan Amount Brackets</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => (
                    <tr key={c.id} className="group">
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          {VANTAGE_TIERS.map((tier) => {
                            const entry = c.vantageConfig[tier.key];
                            if (!entry) return null;
                            return (
                              <div key={tier.key} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.77rem" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: TIER_COLORS[tier.key], display: "inline-block", flexShrink: 0 }} />
                                <span style={{ color: "var(--text-secondary)" }}>{tier.label}</span>
                                <span style={{ color: "var(--text-secondary)" }}>({entry.minScore}–{entry.maxScore})</span>
                                <span style={{ fontWeight: 700, color: TIER_COLORS[tier.key] }}>{entry.apr}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          {c.brackets.map((b, bi) => (
                            <div key={bi} style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                {fmt(b.minAmount)} &ndash; {fmt(b.maxAmount)}
                              </span>
                              {" "}&rarr; {b.terms.join(", ")} mo
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${c.status === "Active" ? "badge-active" : "badge-inactive"}`}>
                          <span className="badge-dot" />
                          {c.status}
                        </span>
                      </td>
                      <td>{c.createdAt}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="reveal-actions flex justify-end gap-2">
                          <button
                            className="btn-row-edit"
                            style={{ background: "var(--surface-bg)", color: "var(--brand-blue)", border: "1px solid var(--brand-blue)" }}
                            onClick={() => setViewPlansFor(c)}
                          >
                            View Plans
                          </button>
                          <button className="btn-row-edit" onClick={() => handleEdit(c)}>Edit</button>
                          <button className="btn-row-delete" onClick={() => setDeleteConfirm(c.id)}>Delete</button>
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
            { label: "Total Configs", value: configs.length },
            { label: "Active",   value: configs.filter((c) => c.status === "Active").length },
            { label: "Inactive", value: configs.filter((c) => c.status === "Inactive").length },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
            </div>
          ))}
        </div>
      </main>

      <CustomConfigModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        existing={editing}
      />

      {/* View Plans Modal */}
      {viewPlansFor && (() => {
        const activeTiers = VANTAGE_TIERS.filter((t) => viewPlansFor.vantageConfig[t.key]);
        const totalRows = activeTiers.length * viewPlansFor.brackets.reduce((s, b) => s + b.terms.length, 0);
        return (
          <div className="modal-overlay" onClick={() => setViewPlansFor(null)}>
            <div className="modal-box" style={{ maxWidth: 820, width: "96vw" }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="modal-title">Plan List</span>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
                    {activeTiers.length} vantage tier{activeTiers.length !== 1 ? "s" : ""}
                    &nbsp;&bull;&nbsp;{viewPlansFor.brackets.length} loan bracket{viewPlansFor.brackets.length !== 1 ? "s" : ""}
                    &nbsp;&bull;&nbsp;{totalRows} plan{totalRows !== 1 ? "s" : ""}
                  </div>
                </div>
                <button className="modal-close" onClick={() => setViewPlansFor(null)} aria-label="Close">&times;</button>
              </div>
              <div className="modal-body" style={{ padding: 0 }}>
                <div style={{ overflowX: "auto", maxHeight: "62vh", overflowY: "auto" }}>
                  <table className="data-table" style={{ fontSize: "0.8rem" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--surface-card)" }}>
                      <tr>
                        <th>#</th>
                        <th>Vantage Tier</th>
                        <th>Score Range</th>
                        <th>APR</th>
                        <th>Loan Amount</th>
                        <th>Term</th>
                        <th>Buydown Rate</th>
                        <th>Dealer Discount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let rowNum = 0;
                        return activeTiers.flatMap((tier, ti) =>
                          viewPlansFor.brackets.flatMap((bracket, bri) =>
                            bracket.terms.map((term) => {
                              rowNum++;
                              const entry = viewPlansFor.vantageConfig[tier.key]!;
                              const accent = TIER_COLORS[tier.key];
                              const rowBg = ti % 2 === 0 ? "transparent" : "var(--surface-bg)";
                              return (
                                <tr key={`${ti}-${bri}-${term}`} style={{ background: rowBg }}>
                                  <td style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{rowNum}</td>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, display: "inline-block", flexShrink: 0 }} />
                                      <span style={{ fontWeight: 700, fontSize: "0.78rem" }}>{tier.label}</span>
                                    </div>
                                  </td>
                                  <td style={{ fontWeight: 600, fontSize: "0.78rem" }}>
                                    {entry.minScore} &ndash; {entry.maxScore}
                                  </td>
                                  <td>
                                    <span style={{ fontWeight: 700, color: accent, fontSize: "0.85rem" }}>{entry.apr}</span>
                                  </td>
                                  <td style={{ fontWeight: 600 }}>
                                    {fmt(bracket.minAmount)} &ndash; {fmt(bracket.maxAmount)}
                                  </td>
                                  <td>
                                    <span style={{
                                      fontSize: "0.75rem", fontWeight: 600, padding: "2px 10px",
                                      borderRadius: 999, background: "#eff6ff", color: "#1d4ed8",
                                      whiteSpace: "nowrap", display: "inline-block",
                                    }}>
                                      {term} mo
                                    </span>
                                  </td>
                                  <td>
                                    {/* Buydown Rate column */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                      {(entry.buydowns ?? []).length === 0 ? (
                                        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>—</span>
                                      ) : (
                                        (entry.buydowns ?? []).map((bd) => (
                                          <div key={bd} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                            <span style={{
                                              fontSize: "0.7rem", fontWeight: 700,
                                              padding: "1px 7px", borderRadius: 999,
                                              background: "#1d4ed8", color: "#fff",
                                              minWidth: 20, textAlign: "center", display: "inline-block",
                                            }}>
                                              {bd}
                                            </span>
                                            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1 }}>→</span>
                                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: accent }}>
                                              {calcBuydownRate(entry.apr, bd)}
                                            </span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    {/* Dealer Discount column */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                      {(entry.buydowns ?? []).length === 0 ? (
                                        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>—</span>
                                      ) : (
                                        (entry.buydowns ?? []).map((bd) => (
                                          <div key={bd} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                            <span style={{
                                              fontSize: "0.7rem", fontWeight: 700,
                                              padding: "1px 7px", borderRadius: 999,
                                              background: "#0f766e", color: "#fff",
                                              minWidth: 20, textAlign: "center", display: "inline-block",
                                            }}>
                                              {bd}
                                            </span>
                                            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1 }}>→</span>
                                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f766e" }}>
                                              {calcDealerDiscount(bd)}
                                            </span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setViewPlansFor(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Delete Config?</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                This action cannot be undone. The configuration will be permanently removed.
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
