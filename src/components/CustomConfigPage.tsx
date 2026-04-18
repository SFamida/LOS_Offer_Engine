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
    <div style={{ background: "var(--surface-bg)", minHeight: "100%" }}>
      <main className="page-content" style={{ paddingTop: "1.5rem", paddingBottom: "2rem" }}>

        {/* ─── Summary strip ──────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}>
          {[
            { label: "Total", value: configs.length, bg: "#f1f5f9", color: "#334155", border: "#cbd5e1" },
            { label: "Active", value: configs.filter((c) => c.status === "Active").length, bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
            { label: "Inactive", value: configs.filter((c) => c.status === "Inactive").length, bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" },
          ].map((s) => (
            <div key={s.label} style={{
              display: "inline-flex", alignItems: "center", gap: "0.45rem",
              padding: "0.4rem 0.85rem",
              background: s.bg, border: `1px solid ${s.border}`,
              fontSize: "0.76rem", fontWeight: 600, color: s.color,
            }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, lineHeight: 1 }}>{s.value}</span>
              {s.label}
            </div>
          ))}

          <div style={{ marginLeft: "auto" }}>
            <button className="btn-primary" onClick={handleAdd}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
              New Config
            </button>
          </div>
        </div>

        {/* ─── Search + filter ────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" className="filter-search" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by APR…"
              style={{ paddingLeft: 36 }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {(["All", "Active", "Inactive"] as const).map((s) => (
              <button key={s} className={`filter-pill${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(s)}>{s}</button>
            ))}
          </div>
        </div>

        {/* ─── Config cards ───────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "3.5rem 2rem",
            background: "#fff", border: "1px dashed var(--border-color)",
          }}>
            <p style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.88rem" }}>No configurations found</p>
            <p style={{ fontSize: "0.76rem", marginTop: 6, color: "var(--text-muted)" }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {filtered.map((c, index) => {
              const activeTierCount = VANTAGE_TIERS.filter((t) => c.vantageConfig[t.key]).length;
              return (
                <div key={c.id} style={{
                  background: "#fff", border: "1px solid var(--border-color)",
                  display: "flex", overflow: "hidden",
                  transition: "border-color 0.2s, transform 0.15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
                >
                  {/* Left accent */}
                  <div style={{
                    width: 4, flexShrink: 0,
                    background: c.status === "Active"
                      ? "linear-gradient(180deg, #10b981, #059669)"
                      : "linear-gradient(180deg, #cbd5e1, #94a3b8)",
                  }} />

                  <div style={{ flex: 1, padding: "0.9rem 1.15rem" }}>
                    {/* Row 1: Name + meta */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.55rem", flexWrap: "wrap" }}>
                      <span style={{
                        width: 26, height: 26,
                        background: "#f1f5f9", color: "var(--text-secondary)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.68rem", fontWeight: 700, flexShrink: 0,
                        border: "1px solid var(--border-color)",
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                        {c.name || `Config ${index + 1}`}
                      </span>
                      <span className={`badge ${c.status === "Active" ? "badge-active" : "badge-inactive"}`} style={{ fontSize: "0.6rem", padding: "0.15rem 0.45rem" }}>
                        <span className="badge-dot" />
                        {c.status}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>
                        {activeTierCount} tier{activeTierCount !== 1 ? "s" : ""} &middot; {c.brackets.length} bracket{c.brackets.length !== 1 ? "s" : ""}
                      </span>

                      {/* Actions pinned right */}
                      <div style={{ marginLeft: "auto", display: "flex", gap: "0.3rem" }}>
                        <button
                          onClick={() => {
                            setSelectedViewOfferIds(
                              c.selectedOfferIds.filter((id) => {
                                const o = availableOffers.find((off) => off.id === id);
                                return o && !o.isPromo;
                              })
                            );
                            setViewPlansFor(c);
                          }}
                          style={{
                            padding: "0.3rem 0.6rem", fontSize: "0.68rem", fontWeight: 600,
                            background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                        >
                          Plans
                        </button>
                        <button
                          onClick={() => handleEdit(c)}
                          style={{
                            padding: "0.3rem 0.6rem", fontSize: "0.68rem", fontWeight: 600,
                            background: "#f8fafc", color: "var(--text-secondary)", border: "1px solid var(--border-color)",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(c.id)}
                          style={{
                            padding: "0.3rem 0.6rem", fontSize: "0.68rem", fontWeight: 600,
                            background: "#fff", color: "#dc2626", border: "1px solid #fecaca",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Tiers inline */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.4rem" }}>
                      {VANTAGE_TIERS.map((tier) => {
                        const entry = c.vantageConfig[tier.key];
                        if (!entry) return null;
                        const accent = TIER_COLORS[tier.key];
                        return (
                          <span key={tier.key} style={{
                            display: "inline-flex", alignItems: "center", gap: "0.3rem",
                            padding: "0.18rem 0.55rem",
                            fontSize: "0.7rem", lineHeight: 1.4,
                            background: `${accent}08`, border: `1px solid ${accent}18`,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{tier.label}</span>
                            <span style={{ fontWeight: 700, color: accent }}>{entry.apr}</span>
                            <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{entry.minScore}–{entry.maxScore}</span>
                          </span>
                        );
                      })}
                    </div>

                    {/* Row 3: Brackets */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                      {c.brackets.map((b, bi) => (
                        <span key={bi} style={{
                          display: "inline-flex", alignItems: "center", gap: "0.25rem",
                          padding: "0.12rem 0.45rem",
                          fontSize: "0.68rem",
                          background: "#f8fafc", border: "1px solid var(--border-color)",
                          color: "var(--text-secondary)",
                        }}>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{fmt(b.minAmount)}–{fmt(b.maxAmount)}</span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>→</span>
                          <span>{b.terms.join(", ")} mo</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
            <div className="modal-box" style={{ maxWidth: 920, width: "96vw" }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: "#f8fafc" }}>
                <div>
                  <span className="modal-title" style={{ fontSize: "0.95rem" }}>Rate Plans</span>
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: 5, flexWrap: "wrap" }}>
                    {[
                      { v: activeTiers.length, l: "Tier", c: "#2563eb", bg: "#eff6ff", b: "#bfdbfe" },
                      { v: viewPlansFor.brackets.length, l: "Bracket", c: "#059669", bg: "#ecfdf5", b: "#a7f3d0" },
                      { v: totalRows, l: "Plan", c: "#7c3aed", bg: "#f5f3ff", b: "#ddd6fe" },
                    ].map((chip) => (
                      <span key={chip.l} style={{
                        fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.45rem",
                        background: chip.bg, color: chip.c, border: `1px solid ${chip.b}`,
                      }}>
                        {chip.v} {chip.l}{chip.v !== 1 ? "s" : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="modal-close" onClick={() => setViewPlansFor(null)} aria-label="Close">&times;</button>
              </div>
              <div className="modal-body" style={{ padding: 0, maxHeight: "calc(96vh - 140px)" }}>
                <div style={{ overflowX: "auto", maxHeight: "inherit", overflowY: "auto" }}>
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
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header" style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
              <span className="modal-title" style={{ color: "#dc2626", fontSize: "0.9rem" }}>Delete Configuration</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: "1.25rem 1.5rem" }}>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                This action is <strong>permanent</strong> and cannot be undone. The configuration and all associated data will be removed.
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
