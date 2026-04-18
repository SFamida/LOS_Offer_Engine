"use client";

import { useState, useMemo, useEffect } from "react";
import { CustomConfig, VANTAGE_TIERS, VantageTierKey } from "@/types/customConfig";
import CustomConfigModal from "@/components/CustomConfigModal";
import { Offer } from "@/types/offer";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Subtract buydown value (integer %) from an APR string like "10.99%" → "9.99%" */
const calcBuydownRate = (apr: string, buydown: number): string => {
  const base = parseFloat(apr);
  return (base - buydown).toFixed(2) + "%";
};

const DEALER_DISCOUNT_BASE = 3.5;
/** Dealer discount = buydown × MDR% (falls back to 3.5 if not configured) */
const calcDealerDiscount = (buydown: number, mdr?: number): string =>
  (buydown * (mdr ?? DEALER_DISCOUNT_BASE)).toFixed(1) + "%";

const TIER_COLORS: Record<VantageTierKey, string> = {
  reserve:    "#0ea5e9",
  superPrime: "#16a34a",
  primePlus:  "#2563eb",
  prime:      "#7c3aed",
  nearPrime:  "#d97706",
  subPrime:   "#dc2626",
};

export default function CustomConfigPage({ availableOffers, embedded = false }: { availableOffers: Offer[]; embedded?: boolean }) {
  const [configs, setConfigs] = useState<CustomConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomConfig | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewPlansFor, setViewPlansFor] = useState<CustomConfig | null>(null);
  const [selectedViewOfferIds, setSelectedViewOfferIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/custom-configs")
      .then((r) => r.json())
      .then((data) => setConfigs(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => configs.filter((c) => {
    const matchSearch = search === "" ||
      Object.values(c.vantageConfig).some((v) => v?.apr.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  }), [configs, search, statusFilter]);

  const handleAdd = () => { setEditing(null); setIsModalOpen(true); };
  const handleEdit = (c: CustomConfig) => { setEditing(c); setIsModalOpen(true); };

  const handleSave = async (data: Omit<CustomConfig, "id" | "createdAt">) => {
    if (editing) {
      const res = await fetch(`/api/custom-configs/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        console.error("Failed to update config:", err);
        alert(`Save failed: ${err.error ?? res.status}`);
        return;
      }
      const updated = await res.json();
      setConfigs((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
    } else {
      const res = await fetch("/api/custom-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        console.error("Failed to create config:", err);
        alert(`Save failed: ${err.error ?? res.status}`);
        return;
      }
      const created = await res.json();
      setConfigs((prev) => [created, ...prev]);
    }
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/custom-configs/${id}`, { method: "DELETE" });
    setConfigs((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-bg)" }}>
      <main className="page-content">
        <div className="section-header">
          {!embedded ? (
            <div>
              <h2 className="section-title">Custom Configuration</h2>
              <p className="section-sub">
                {configs.length} total &bull;{" "}
                {configs.filter((c) => c.status === "Active").length} active
              </p>
            </div>
          ) : (
            <div />
          )}
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

        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : (
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
                    {filtered.map((c, index) => (
                      <tr key={c.id} className="group">
                        <td>{index + 1}</td>
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
                              onClick={() => {
                                setSelectedViewOfferIds(
                                  c.selectedOfferIds.filter((id) => {
                                    const o = availableOffers.find((off) => off.id === id);
                                    return o && !o.isPromo;
                                  })
                                );
                                setViewPlansFor(c);
                              }}
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
        )} {/* end loading ternary */}

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
        availableOffers={availableOffers}
      />

      {/* View Plans Modal */}
      {viewPlansFor && (() => {
        const activeTiers = VANTAGE_TIERS.filter((t) => viewPlansFor.vantageConfig[t.key]);
        const totalRows = activeTiers.length * viewPlansFor.brackets.reduce((s, b) => s + b.terms.length, 0);
        const activeNonPromo = availableOffers.filter(
          (o) => !o.isPromo && viewPlansFor.selectedOfferIds.includes(o.id) && selectedViewOfferIds.includes(o.id)
        );
        const showStdCol = activeNonPromo.some((o) => /\bstandard\b/i.test(o.name));
        const checkedBuydownNums = activeNonPromo
          .filter((o) => !/\bstandard\b/i.test(o.name))
          .map((o) => { const m = o.name.match(/(\d+)/); return m ? parseInt(m[1]) : null; })
          .filter((n): n is number => n !== null);
        const showBdCol = checkedBuydownNums.length > 0;
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
                        {showStdCol && <th>Standard</th>}
                        {showBdCol && <th>Buydown</th>}
                        {showBdCol && <th>Buydown Rate</th>}
                        <th>Amount Range</th>
                        <th>Term</th>
                        <th>Dealer Discount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let rowNum = 0;
                        return activeTiers.flatMap((tier, ti) =>
                          viewPlansFor.brackets.flatMap((bracket, bri) =>
                            bracket.terms.flatMap((term) => {
                              const entry = viewPlansFor.vantageConfig[tier.key]!;
                              const accent = TIER_COLORS[tier.key];
                              const rowBg = ti % 2 === 0 ? "transparent" : "var(--surface-bg)";

                              // Determine which buydown numbers are active for this tier
                              const activeBds = showBdCol
                                ? checkedBuydownNums.filter((bd) => (entry.buydowns ?? []).some((b) => b === bd))
                                : [];

                              // If buydown column is shown and there are active buydowns,
                              // produce one row per buydown; otherwise one row (no buydown)
                              const bdRows = showBdCol && activeBds.length > 0 ? activeBds : [null];

                              return bdRows.map((bd) => {
                                rowNum++;
                                return (
                                  <tr key={`${ti}-${bri}-${term}-${bd ?? "std"}`} style={{ background: rowBg }}>
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
                                    {showStdCol && (
                                      <td>
                                        <span style={{ fontWeight: 700, color: accent, fontSize: "0.85rem" }}>{entry.apr}</span>
                                      </td>
                                    )}
                                    {showBdCol && (
                                      <td>
                                        {bd !== null
                                          ? <span style={{ fontWeight: 700, color: accent, fontSize: "0.85rem" }}>{bd}%</span>
                                          : <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>—</span>}
                                      </td>
                                    )}
                                    {showBdCol && (
                                      <td>
                                        {bd !== null
                                          ? <span style={{ fontWeight: 700, color: accent, fontSize: "0.85rem" }}>{calcBuydownRate(entry.apr, bd)}</span>
                                          : <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>—</span>}
                                      </td>
                                    )}
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
                                      {/* Dealer Discount column */}
                                      {bd !== null ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
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
                                            {calcDealerDiscount(bd, entry.mdr)}
                                          </span>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
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
