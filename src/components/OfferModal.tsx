"use client";

import { useState, useEffect } from "react";
import { Offer } from "@/types/offer";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Offer, "id" | "createdAt">) => void;
  existing?: Offer | null;
}

const emptyForm = {
  name: "",
  description: "",
  isPromo: false,
  status: "Active" as "Active" | "Inactive",
};

export default function OfferModal({ isOpen, onClose, onSave, existing }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        description: existing.description,
        isPromo: existing.isPromo,
        status: existing.status,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [existing, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Offer name is required";
    if (!form.description.trim()) e.description = "Description is required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      isPromo: form.isPromo,
      status: form.status,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <span className="modal-title">{existing ? "Edit Offer" : "Add Offer"}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Offer Name */}
              <div className="form-field">
                <label className="form-label">Offer Name *</label>
                <input
                  type="text"
                  value={form.name}
                  placeholder="e.g. Same As Cash 12 Months"
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={`form-input${errors.name ? " error" : ""}`}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Description */}
              <div className="form-field">
                <label className="form-label">Description *</label>
                <textarea
                  value={form.description}
                  placeholder="Describe this offer..."
                  rows={4}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className={`form-input${errors.description ? " error" : ""}`}
                  style={{ resize: "vertical", minHeight: "90px" }}
                />
                {errors.description && <span className="form-error">{errors.description}</span>}
              </div>

              {/* Promo Offer */}
              <div className="form-field">
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.isPromo}
                    onChange={(e) => setForm((prev) => ({ ...prev, isPromo: e.target.checked }))}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--brand-600)" }}
                  />
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>
                    Promo Offer
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Mark this as a promotional offer
                  </span>
                </label>
              </div>

              {/* Status */}
              <div className="form-field">
                <label className="form-label">Status</label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {(["Active", "Inactive"] as const).map((s) => (
                    <label
                      key={s}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={form.status === s}
                        onChange={() => setForm((prev) => ({ ...prev, status: s }))}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {existing ? "Save Changes" : "Add Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
