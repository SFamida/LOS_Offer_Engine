"use client";

import { useState, useEffect } from "react";
import { Merchant } from "@/types/merchant";
import { CustomConfig } from "@/types/customConfig";
import { CreditUnion } from "@/types/creditUnion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Merchant, "id" | "createdAt">) => void;
  existing?: Merchant | null;
  customConfigs: CustomConfig[];
  creditUnions: CreditUnion[];
}

const emptyForm = {
  name: "",
  customConfigId: "",
  creditUnionIds: [] as string[],
  status: "Active" as "Active" | "Inactive",
};

export default function MerchantModal({ isOpen, onClose, onSave, existing, customConfigs, creditUnions }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cuSearch, setCuSearch] = useState("");

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        customConfigId: existing.customConfigId,
        creditUnionIds: existing.creditUnionIds,
        status: existing.status,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setCuSearch("");
  }, [existing, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Merchant Name is required";
    if (!form.customConfigId) e.customConfigId = "Please select a custom config";
    return e;
  };

  const toggleCreditUnion = (id: string) => {
    setForm((prev) => ({
      ...prev,
      creditUnionIds: prev.creditUnionIds.includes(id)
        ? prev.creditUnionIds.filter((c) => c !== id)
        : [...prev.creditUnionIds, id],
    }));
  };

  const selectAllCUs = () => {
    const visibleIds = filteredCUs.map((cu) => cu.id);
    setForm((prev) => ({
      ...prev,
      creditUnionIds: [...new Set([...prev.creditUnionIds, ...visibleIds])],
    }));
  };

  const deselectAllCUs = () => {
    const visibleIds = new Set(filteredCUs.map((cu) => cu.id));
    setForm((prev) => ({
      ...prev,
      creditUnionIds: prev.creditUnionIds.filter((id) => !visibleIds.has(id)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      name: form.name.trim(),
      customConfigId: form.customConfigId,
      creditUnionIds: form.creditUnionIds,
      status: form.status,
    });
  };

  const filteredCUs = creditUnions.filter((cu) =>
    cu.name.toLowerCase().includes(cuSearch.toLowerCase())
  );

  const allVisibleSelected = filteredCUs.length > 0 && filteredCUs.every((cu) => form.creditUnionIds.includes(cu.id));

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 560, width: "95vw" }}>
        <div className="modal-header">
          <span className="modal-title">{existing ? "Edit Merchant" : "Add Merchant"}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

              {/* Merchant Name */}
              <div className="form-field">
                <label className="form-label">Merchant Name *</label>
                <input
                  type="text"
                  value={form.name}
                  placeholder="e.g. ABC Electronics"
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={`form-input${errors.name ? " error" : ""}`}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Custom Config Dropdown */}
              <div className="form-field">
                <label className="form-label">Custom Config *</label>
                <select
                  className={`form-input${errors.customConfigId ? " error" : ""}`}
                  value={form.customConfigId}
                  onChange={(e) => setForm((prev) => ({ ...prev, customConfigId: e.target.value }))}
                >
                  <option value="">— Select a config —</option>
                  {customConfigs.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.name || cc.id}{cc.status === "Inactive" ? " (Inactive)" : ""}
                    </option>
                  ))}
                </select>
                {errors.customConfigId && <span className="form-error">{errors.customConfigId}</span>}
              </div>

              {/* Credit Unions Checkboxes */}
              <div className="form-field">
                <label className="form-label">
                  Credit Unions
                  {form.creditUnionIds.length > 0 && (
                    <span style={{ fontWeight: 600, color: "#2563eb", marginLeft: 6, fontSize: "0.75rem" }}>
                      {form.creditUnionIds.length} selected
                    </span>
                  )}
                </label>

                {/* Search + Select all/none */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
                  <input
                    type="text"
                    className="form-input"
                    value={cuSearch}
                    onChange={(e) => setCuSearch(e.target.value)}
                    placeholder="Search credit unions..."
                    style={{ flex: 1, fontSize: "0.78rem", padding: "0.35rem 0.6rem" }}
                  />
                  <button
                    type="button"
                    onClick={allVisibleSelected ? deselectAllCUs : selectAllCUs}
                    style={{
                      fontSize: "0.7rem", fontWeight: 600, padding: "0.35rem 0.65rem",
                      border: "1px solid var(--border-color)", background: "#fff",
                      color: "var(--text-secondary)", cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {allVisibleSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div style={{
                  border: "1px solid var(--border-color)",
                  background: "var(--surface-bg)",
                  maxHeight: 200, overflowY: "auto",
                  padding: "0.35rem",
                }}>
                  {filteredCUs.length === 0 ? (
                    <div style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      {creditUnions.length === 0 ? "No credit unions available" : "No matches found"}
                    </div>
                  ) : (
                    filteredCUs.map((cu) => {
                      const checked = form.creditUnionIds.includes(cu.id);
                      return (
                        <label
                          key={cu.id}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.35rem 0.5rem", cursor: "pointer",
                            background: checked ? "#eff6ff" : "transparent",
                            borderBottom: "1px solid #f1f5f9",
                            transition: "background 0.1s",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCreditUnion(cu.id)}
                            style={{ width: 14, height: 14, accentColor: "#2563eb", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "0.8rem", fontWeight: checked ? 600 : 400, color: checked ? "#1e40af" : "var(--text-primary)" }}>
                            {cu.name}
                          </span>
                          <span style={{
                            marginLeft: "auto", fontSize: "0.65rem", fontWeight: 600,
                            padding: "1px 6px",
                            background: cu.status === "Active" ? "#f0fdf4" : "#f3f4f6",
                            color: cu.status === "Active" ? "#15803d" : "#6b7280",
                          }}>
                            {cu.status}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="form-field">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "Active" | "Inactive" }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{existing ? "Save Changes" : "Add Merchant"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
