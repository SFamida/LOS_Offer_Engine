"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CustomConfig,
  VANTAGE_TIERS, APR_OPTIONS,
  VantageTierKey, AprValue, VantageConfigMap,
  BUYDOWN_OPTIONS, BuydownValue,
} from "@/types/customConfig";
import { Offer } from "@/types/offer";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CustomConfig, "id" | "createdAt">) => void;
  existing?: CustomConfig | null;
  availableOffers: Offer[];
}

const TERM_OPTIONS = [36, 48, 60, 72, 84, 96, 120, 180];

type TierFormEntry = { enabled: boolean; minScore: string; maxScore: string; apr: AprValue | ""; buydowns: BuydownValue[]; mdr: string };
type TierFormMap = Record<VantageTierKey, TierFormEntry>;

const emptyBracket = () => ({ minAmount: "", maxAmount: "", terms: [] as number[] });

const defaultTierForm = (): TierFormMap =>
  Object.fromEntries(
    VANTAGE_TIERS.map((t) => [
      t.key,
      { enabled: true, minScore: String(t.defaultMin), maxScore: String(t.defaultMax), apr: "" as AprValue | "", buydowns: [1, 2, 3, 4] as BuydownValue[], mdr: "" },
    ])
  ) as TierFormMap;

const emptyForm = () => ({
  name: "",
  tiers: defaultTierForm(),
  brackets: [emptyBracket()],
  selectedOfferIds: [] as string[],
  promoOfferMonths: {} as Record<string, string>,
  status: "Active" as "Active" | "Inactive",
});

const TIER_COLORS: Record<VantageTierKey, string> = {
  reserve:    "#0ea5e9",
  superPrime: "#16a34a",
  primePlus:  "#2563eb",
  prime:      "#7c3aed",
  nearPrime:  "#d97706",
  subPrime:   "#dc2626",
};

export default function CustomConfigModal({ isOpen, onClose, onSave, existing, availableOffers }: Props) {
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const standardOfferIds = useMemo(
    () => availableOffers.filter((offer) => /\bstandard\b/i.test(offer.name)).map((offer) => offer.id),
    [availableOffers]
  );

  const isStandardSelected = useMemo(
    () => form.selectedOfferIds.some((id) => standardOfferIds.includes(id)),
    [form.selectedOfferIds, standardOfferIds]
  );

  const selectedBuydownNums = useMemo(
    () =>
      availableOffers
        .filter((o) => !o.isPromo && !/\bstandard\b/i.test(o.name) && form.selectedOfferIds.includes(o.id))
        .map((o) => { const m = o.name.match(/(\d+)/); return m ? parseInt(m[1]) : null; })
        .filter((n): n is number => n !== null)
        .sort((a, b) => a - b),
    [availableOffers, form.selectedOfferIds]
  );
  const showBdCol = selectedBuydownNums.length > 0;

  useEffect(() => {
    if (existing) {
      const tiers = defaultTierForm();
      VANTAGE_TIERS.forEach((t) => {
        const entry = existing.vantageConfig[t.key];
        if (entry) {
          tiers[t.key] = {
            enabled:  true,
            minScore: String(entry.minScore),
            maxScore: String(entry.maxScore),
            apr:      entry.apr,
            buydowns: entry.buydowns ?? ([1, 2, 3, 4] as BuydownValue[]),
            mdr:      entry.mdr !== undefined ? String(entry.mdr) : "",
          };
        } else {
          tiers[t.key].enabled = false;
        }
      });
      setForm({
        name: existing.name ?? "",
        tiers,
        brackets: existing.brackets.map((b) => ({
          minAmount: String(b.minAmount),
          maxAmount: String(b.maxAmount),
          terms: b.terms,
        })),
        selectedOfferIds: existing.selectedOfferIds ?? [],
        promoOfferMonths: Object.fromEntries(
          Object.entries(existing.promoOfferMonths ?? {}).map(([k, v]) => [
            k,
            Array.isArray(v) ? (v as number[]).join(", ") : String(v),
          ])
        ),
        status: existing.status,
      });
    } else {
      setForm({
        ...emptyForm(),
        selectedOfferIds: standardOfferIds,
      });
    }
    setErrors({});
  }, [existing, isOpen, standardOfferIds]);

  if (!isOpen) return null;

  const toNum = (v: string) => Number(v);
  const okNum = (v: string) => v.trim() !== "" && !isNaN(toNum(v)) && toNum(v) >= 0;

  const updateTier = (key: VantageTierKey, field: keyof TierFormEntry, val: string | boolean) => {
    setForm((p) => ({ ...p, tiers: { ...p.tiers, [key]: { ...p.tiers[key], [field]: val } } }));
    setErrors((p) => {
      const n = { ...p };
      delete n[`tier_${key}_min`]; delete n[`tier_${key}_max`]; delete n[`tier_${key}_apr`];
      return n;
    });
  };

  const toggleTierBuydown = (key: VantageTierKey, val: BuydownValue) => {
    setForm((p) => {
      const cur = p.tiers[key].buydowns;
      const next = cur.includes(val)
        ? cur.filter((x) => x !== val)
        : ([...cur, val].sort((a, b) => a - b) as BuydownValue[]);
      return { ...p, tiers: { ...p.tiers, [key]: { ...p.tiers[key], buydowns: next } } };
    });
  };

  const toggleTerm = (bi: number, t: number) => {
    setForm((prev) => ({
      ...prev,
      brackets: prev.brackets.map((b, i) =>
        i === bi
          ? { ...b, terms: b.terms.includes(t) ? b.terms.filter((x) => x !== t) : [...b.terms, t].sort((a, b) => a - b) }
          : b
      ),
    }));
    setErrors((p) => { const n = { ...p }; delete n[`bracket_${bi}_terms`]; return n; });
  };

  const updateBracket = (bi: number, key: "minAmount" | "maxAmount", val: string) =>
    setForm((prev) => ({
      ...prev,
      brackets: prev.brackets.map((b, i) => (i === bi ? { ...b, [key]: val } : b)),
    }));

  const addBracket = () => setForm((p) => ({ ...p, brackets: [...p.brackets, emptyBracket()] }));
  const removeBracket = (bi: number) => setForm((p) => ({ ...p, brackets: p.brackets.filter((_, i) => i !== bi) }));

  const validate = () => {
    const e: Record<string, string> = {};
    const enabledTiers = VANTAGE_TIERS.filter((t) => form.tiers[t.key].enabled);
    if (enabledTiers.length === 0) e["tiers_global"] = "Enable at least one vantage tier";
    enabledTiers.forEach((t) => {
      const entry = form.tiers[t.key];
      const minOk = okNum(entry.minScore) && toNum(entry.minScore) >= 300 && toNum(entry.minScore) <= 850;
      const maxOk = okNum(entry.maxScore) && toNum(entry.maxScore) >= 300 && toNum(entry.maxScore) <= 850;
      if (!minOk) e[`tier_${t.key}_min`] = "300 – 850";
      if (!maxOk) e[`tier_${t.key}_max`] = "300 – 850";
      if (minOk && maxOk && toNum(entry.minScore) >= toNum(entry.maxScore))
        e[`tier_${t.key}_max`] = "Max > min";
      if (isStandardSelected && !entry.apr) e[`tier_${t.key}_apr`] = "Select APR";
    });
    form.brackets.forEach((b, i) => {
      if (!okNum(b.minAmount)) e[`bracket_${i}_min`] = "Enter a valid amount";
      if (!okNum(b.maxAmount)) e[`bracket_${i}_max`] = "Enter a valid amount";
      if (okNum(b.minAmount) && okNum(b.maxAmount) && toNum(b.minAmount) >= toNum(b.maxAmount))
        e[`bracket_${i}_max`] = "Must be greater than minimum";
      if (b.terms.length === 0) e[`bracket_${i}_terms`] = "Select at least one term";
    });
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const vantageConfig: VantageConfigMap = {};
    VANTAGE_TIERS.forEach((t) => {
      const entry = form.tiers[t.key];
      if (entry.enabled && entry.apr) {
        vantageConfig[t.key] = {
          minScore: toNum(entry.minScore),
          maxScore: toNum(entry.maxScore),
          apr: entry.apr as AprValue,
          buydowns: entry.buydowns,
          ...(entry.mdr.trim() ? { mdr: parseFloat(entry.mdr) } : {}),
        };
      }
    });
    const promoOfferMonths: Record<string, number[]> = {};
    Object.entries(form.promoOfferMonths).forEach(([id, val]) => {
      const parsed = val.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0);
      if (parsed.length > 0) promoOfferMonths[id] = parsed;
    });
    onSave({
      name: form.name.trim() || undefined,
      vantageConfig,
      brackets: form.brackets.map((b) => ({
        minAmount: toNum(b.minAmount),
        maxAmount: toNum(b.maxAmount),
        terms: b.terms,
      })),
      selectedOfferIds: form.selectedOfferIds,
      promoOfferMonths,
      status: form.status,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 900, width: "96vw" }}>
        <div className="modal-header" style={{ background: "#f8fafc" }}>
          <div>
            <span className="modal-title" style={{ fontSize: "0.95rem" }}>{existing ? "Edit Configuration" : "New Configuration"}</span>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
              {existing ? "Modify the fields below and save" : "Fill in all required sections to create a config"}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">

              {/* ── Custom Config Name ─────────────────────────────── */}
              <div className="form-field span-full">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <span style={{ width: 20, height: 20, background: "var(--brand-slate)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 800, flexShrink: 0 }}>1</span>
                  Config Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  placeholder="e.g. Standard Auto Config"
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* ── Offers ─────────────────────────────────────────── */}
              {availableOffers.length > 0 && (
                <div className="form-field span-full">
                  <label className="form-label" style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span style={{ width: 20, height: 20, background: "#2563eb", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 800, flexShrink: 0 }}>2</span>
                    Offers
                    <span style={{ fontSize: "0.68rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.25rem" }}>
                      Select offers to associate
                    </span>
                  </label>
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: "0.5rem",
                    padding: "0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: 8,
                    background: "var(--surface-bg)",
                  }}>
                    {availableOffers.map((offer) => {
                      const checked = form.selectedOfferIds.includes(offer.id);
                      const isStd = /\bstandard\b/i.test(offer.name);
                      return (
                        <label
                          key={offer.id}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            cursor: isStd ? "not-allowed" : "pointer", userSelect: "none",
                            padding: "0.35rem 0.75rem",
                            borderRadius: 999,
                            fontSize: "0.8rem",
                            fontWeight: checked ? 600 : 400,
                            background: checked ? "#eff6ff" : "var(--surface-card)",
                            border: `1px solid ${checked ? "var(--brand-600)" : "var(--border-default)"}`,
                            color: checked ? "var(--brand-600)" : "var(--text-secondary)",
                            transition: "all 0.15s",
                            opacity: isStd ? 0.75 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isStd}
                            onChange={() =>
                              setForm((p) => ({
                                ...p,
                                selectedOfferIds: checked
                                  ? p.selectedOfferIds.filter((id) => id !== offer.id)
                                  : [...p.selectedOfferIds, offer.id],
                              }))
                            }
                            style={{ width: 14, height: 14, accentColor: "var(--brand-600)", cursor: isStd ? "not-allowed" : "pointer" }}
                          />
                          {offer.name}
                          {offer.isPromo && (
                            <span style={{ fontSize: "0.65rem", background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 999, padding: "0.1rem 0.35rem", fontWeight: 700 }}>
                              Promo
                            </span>
                          )}
                        </label>
                      );
                    })}
                    {/* Promo offer month inputs — shown at bottom of the offers box */}
                    {availableOffers.some((o) => o.isPromo && form.selectedOfferIds.includes(o.id)) && (
                      <div style={{ width: "100%", borderTop: "1px solid var(--border-color)", marginTop: "0.5rem", paddingTop: "0.65rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                        {availableOffers
                          .filter((o) => o.isPromo && form.selectedOfferIds.includes(o.id))
                          .map((offer) => (
                            <div key={offer.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                                {offer.name}
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 6, 12, 24"
                                value={form.promoOfferMonths[offer.id] ?? ""}
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    promoOfferMonths: { ...p.promoOfferMonths, [offer.id]: e.target.value },
                                  }))
                                }
                                style={{
                                  width: 160, padding: "0.3rem 0.5rem",
                                  border: "1px solid var(--border-color)", borderRadius: 6,
                                  fontSize: "0.8rem",
                                  background: "var(--surface-card)", color: "var(--text-primary)",
                                }}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Vantage Tiers ─────────────────────────────────── */}
              <div className="form-field span-full">
                <label className="form-label" style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <span style={{ width: 20, height: 20, background: "#7c3aed", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 800, flexShrink: 0 }}>3</span>
                  Vantage Tiers &amp; APRs
                  <span style={{ fontSize: "0.68rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.25rem" }}>
                    Toggle tiers, set score ranges and APR
                  </span>
                </label>
                {errors["tiers_global"] && <div className="form-error" style={{ marginBottom: "0.4rem" }}>{errors["tiers_global"]}</div>}

                {/* Header row */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: ["2rem", "1fr", "6.5rem", "6.5rem", ...(isStandardSelected ? ["7rem", "6rem"] : []), ...(showBdCol ? ["9.5rem"] : [])].join(" "),
                  gap: "0.5rem", padding: "0.4rem 0.75rem",
                  fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)",
                  letterSpacing: "0.04em", textTransform: "uppercase" as const,
                  background: "#f1f5f9",
                  borderBottom: "1px solid var(--border-color)",
                  border: "1px solid var(--border-color)",
                }}>
                  <span></span>
                  <span>Tier</span>
                  <span style={{ textAlign: "center" }}>Min Score</span>
                  <span style={{ textAlign: "center" }}>Max Score</span>
                  {isStandardSelected && <span style={{ textAlign: "center" }}>Standard</span>}
                  {isStandardSelected && <span style={{ textAlign: "center" }}>MDR%</span>}
                  {showBdCol && <span style={{ textAlign: "center" }}>Buydown</span>}
                </div>

                <div style={{ border: "1px solid var(--border-color)", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
                  {VANTAGE_TIERS.map((tier, idx) => {
                    const entry = form.tiers[tier.key];
                    const accent = TIER_COLORS[tier.key];
                    const disabled = !entry.enabled;
                    const hasMinErr = !!errors[`tier_${tier.key}_min`];
                    const hasMaxErr = !!errors[`tier_${tier.key}_max`];
                    const hasAprErr = !!errors[`tier_${tier.key}_apr`];
                    return (
                      <div key={tier.key} style={{
                        display: "grid",
                        gridTemplateColumns: ["2rem", "1fr", "6.5rem", "6.5rem", ...(isStandardSelected ? ["7rem", "6rem"] : []), ...(showBdCol ? ["9.5rem"] : [])].join(" "),
                        gap: "0.5rem", alignItems: "center",
                        padding: "0.55rem 0.75rem",
                        borderBottom: idx < VANTAGE_TIERS.length - 1 ? "1px solid var(--border-color)" : "none",
                        background: disabled ? "var(--surface-bg)" : "var(--surface-card)",
                        opacity: disabled ? 0.5 : 1,
                        transition: "opacity 0.15s",
                      }}>
                        {/* Toggle */}
                        <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={entry.enabled}
                            onChange={(e) => updateTier(tier.key, "enabled", e.target.checked)}
                            style={{ width: 15, height: 15, cursor: "pointer", accentColor: accent }}
                          />
                        </label>

                        {/* Label */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ width: 9, height: 9, borderRadius: "50%", background: accent, display: "inline-block", flexShrink: 0 }} />
                            <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{tier.label}</span>
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", paddingLeft: 17 }}>
                            Default: {tier.defaultMin} – {tier.defaultMax}
                          </div>
                        </div>

                        {/* Min Score */}
                        <div>
                          <input
                            type="number" min="300" max="850"
                            value={entry.minScore}
                            disabled={disabled}
                            onChange={(e) => updateTier(tier.key, "minScore", e.target.value)}
                            className={`form-input${hasMinErr ? " error" : ""}`}
                            style={{ textAlign: "center", padding: "0.3rem 0.4rem", fontSize: "0.82rem" }}
                          />
                          {hasMinErr && <div style={{ fontSize: "0.65rem", color: "var(--danger)", textAlign: "center", marginTop: 2 }}>{errors[`tier_${tier.key}_min`]}</div>}
                        </div>

                        {/* Max Score */}
                        <div>
                          <input
                            type="number" min="300" max="850"
                            value={entry.maxScore}
                            disabled={disabled}
                            onChange={(e) => updateTier(tier.key, "maxScore", e.target.value)}
                            className={`form-input${hasMaxErr ? " error" : ""}`}
                            style={{ textAlign: "center", padding: "0.3rem 0.4rem", fontSize: "0.82rem" }}
                          />
                          {hasMaxErr && <div style={{ fontSize: "0.65rem", color: "var(--danger)", textAlign: "center", marginTop: 2 }}>{errors[`tier_${tier.key}_max`]}</div>}
                        </div>

                        {/* APR */}
                        {isStandardSelected && (
                          <div>
                            <select
                              value={entry.apr}
                              disabled={disabled}
                              onChange={(e) => updateTier(tier.key, "apr", e.target.value)}
                              className={`form-input${hasAprErr ? " error" : ""}`}
                              style={{ textAlign: "center", padding: "0.3rem 0.4rem", fontSize: "0.82rem" }}
                            >
                              <option value="">— APR —</option>
                              {APR_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                            {hasAprErr && <div style={{ fontSize: "0.65rem", color: "var(--danger)", textAlign: "center", marginTop: 2 }}>{errors[`tier_${tier.key}_apr`]}</div>}
                          </div>
                        )}

                        {/* MDR% */}
                        {isStandardSelected && (
                          <div>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="3.5"
                              value={entry.mdr}
                              disabled={disabled}
                              onChange={(e) => updateTier(tier.key, "mdr", e.target.value)}
                              className="form-input"
                              style={{ textAlign: "center", padding: "0.3rem 0.4rem", fontSize: "0.82rem" }}
                            />
                          </div>
                        )}

                        {/* Buydown */}
                        {showBdCol && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", alignItems: "center", justifyContent: "center" }}>
                          {selectedBuydownNums.map((bd) => {
                            const checked = entry.buydowns.includes(bd as BuydownValue);
                            return (
                              <label key={bd} style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: disabled ? "default" : "pointer",
                                padding: "0.15rem 0.5rem", borderRadius: 999,
                                fontSize: "0.72rem", fontWeight: checked ? 700 : 400,
                                background: checked && !disabled ? "#1d4ed8" : "var(--surface-bg)",
                                color: checked && !disabled ? "#fff" : "var(--text-secondary)",
                                border: `1px solid ${checked && !disabled ? "#1d4ed8" : "var(--border-color)"}`,
                                transition: "all 0.15s", userSelect: "none", minWidth: 22,
                              }}>
                                <input type="checkbox" checked={checked} disabled={disabled}
                                  onChange={() => toggleTierBuydown(tier.key, bd as BuydownValue)}
                                  style={{ display: "none" }} />
                                {bd}
                              </label>
                            );
                          })}
                        </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Loan Amount Brackets ──────────────────────────── */}
              <div className="form-field span-full">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.45rem", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span style={{ width: 20, height: 20, background: "#d97706", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 800, flexShrink: 0 }}>4</span>
                    Loan Brackets
                  </span>
                  <button type="button" onClick={addBracket}
                    style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.7rem", borderRadius: 6, border: "1px dashed var(--brand-blue)", background: "none", color: "var(--brand-blue)", cursor: "pointer" }}>
                    + Add Bracket
                  </button>
                </label>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.35rem" }}>
                  {form.brackets.map((b, bi) => (
                    <div key={bi} style={{ border: "1px solid var(--border-color)", padding: "0.8rem 1rem", background: "#fff", transition: "border-color 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <span style={{ width: 18, height: 18, background: "#f1f5f9", border: "1px solid var(--border-color)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color: "var(--text-muted)" }}>{bi + 1}</span>
                          Bracket {bi + 1}
                        </span>
                        {form.brackets.length > 1 && (
                          <button type="button" onClick={() => removeBracket(bi)}
                            style={{ fontSize: "0.75rem", padding: "0.15rem 0.55rem", borderRadius: 5, border: "1px solid #fca5a5", background: "#fff1f2", color: "#dc2626", cursor: "pointer", fontWeight: 600 }}>
                            Remove
                          </button>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.6rem" }}>
                        <div>
                          <label className="form-label">Min Amount ($)</label>
                          <input type="number" min="0" value={b.minAmount} placeholder="e.g. 2500"
                            onChange={(e) => updateBracket(bi, "minAmount", e.target.value)}
                            className={`form-input${errors[`bracket_${bi}_min`] ? " error" : ""}`} />
                          {errors[`bracket_${bi}_min`] && <span className="form-error">{errors[`bracket_${bi}_min`]}</span>}
                        </div>
                        <div>
                          <label className="form-label">Max Amount ($)</label>
                          <input type="number" min="0" value={b.maxAmount} placeholder="e.g. 10000"
                            onChange={(e) => updateBracket(bi, "maxAmount", e.target.value)}
                            className={`form-input${errors[`bracket_${bi}_max`] ? " error" : ""}`} />
                          {errors[`bracket_${bi}_max`] && <span className="form-error">{errors[`bracket_${bi}_max`]}</span>}
                        </div>
                      </div>
                      <div>
                        <label className="form-label" style={{ marginBottom: "0.3rem", display: "block" }}>Terms (months)</label>
                        <div style={{
                          display: "flex", flexWrap: "wrap", gap: "0.45rem",
                          padding: "0.55rem 0.75rem",
                          border: `1px solid ${errors[`bracket_${bi}_terms`] ? "var(--danger)" : "var(--border-color)"}`,
                          borderRadius: 8, background: "var(--surface-card)",
                        }}>
                          {TERM_OPTIONS.map((t) => {
                            const checked = b.terms.includes(t);
                            return (
                              <label key={t} style={{
                                display: "flex", alignItems: "center", gap: "0.35rem",
                                cursor: "pointer", padding: "0.25rem 0.65rem", borderRadius: 999,
                                fontSize: "0.78rem", fontWeight: checked ? 600 : 400,
                                background: checked ? "var(--brand-blue)" : "var(--surface-bg)",
                                color: checked ? "#fff" : "var(--text-primary)",
                                border: `1px solid ${checked ? "var(--brand-blue)" : "var(--border-color)"}`,
                                transition: "all 0.15s", userSelect: "none",
                              }}>
                                <input type="checkbox" checked={checked} onChange={() => toggleTerm(bi, t)} style={{ display: "none" }} />
                                {t} mo
                              </label>
                            );
                          })}
                        </div>
                        {errors[`bracket_${bi}_terms`] && <span className="form-error">{errors[`bracket_${bi}_terms`]}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Status ─────────────────────────────────────────── */}
              <div className="form-field span-full" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <span style={{ width: 20, height: 20, background: "#059669", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 800, flexShrink: 0 }}>5</span>
                  Status
                </label>
                <select className="form-input" value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "Active" | "Inactive" }))}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {existing ? "Save Changes" : "Create Config"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
