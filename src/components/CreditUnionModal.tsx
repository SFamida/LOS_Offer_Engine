"use client";

import { useState, useEffect } from "react";
import { CreditUnion } from "@/types/creditUnion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CreditUnion, "id" | "createdAt">) => void;
  existing?: CreditUnion | null;
}

const emptyForm = {
  name: "",
  minLoanAmount: "",
  maxLoanAmount: "",
  vantageMin: "",
  vantageMax: "",
  minTerm: "",
  maxTerm: "",
  status: "Active" as "Active" | "Inactive",
};

export default function CreditUnionModal({ isOpen, onClose, onSave, existing }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        minLoanAmount: String(existing.minLoanAmount),
        maxLoanAmount: String(existing.maxLoanAmount),
        vantageMin: String(existing.vantageMin),
        vantageMax: String(existing.vantageMax),
        minTerm: String(existing.minTerm),
        maxTerm: String(existing.maxTerm),
        status: existing.status,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [existing, isOpen]);

  if (!isOpen) return null;

  const toNum = (v: string) => Number(v);
  const ok = (v: string) => v.trim() !== "" && !isNaN(toNum(v)) && toNum(v) >= 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Credit Union Name is required";
    if (!ok(form.minLoanAmount)) e.minLoanAmount = "Enter a valid amount";
    if (!ok(form.maxLoanAmount)) e.maxLoanAmount = "Enter a valid amount";
    if (ok(form.minLoanAmount) && ok(form.maxLoanAmount) && toNum(form.minLoanAmount) >= toNum(form.maxLoanAmount))
      e.maxLoanAmount = "Must be greater than minimum";
    if (!ok(form.vantageMin) || toNum(form.vantageMin) < 300 || toNum(form.vantageMin) > 850)
      e.vantageMin = "Enter a score between 300 and 850";
    if (!ok(form.vantageMax) || toNum(form.vantageMax) < 300 || toNum(form.vantageMax) > 850)
      e.vantageMax = "Enter a score between 300 and 850";
    if (ok(form.vantageMin) && ok(form.vantageMax) && toNum(form.vantageMin) >= toNum(form.vantageMax))
      e.vantageMax = "Must be greater than minimum";
    if (!ok(form.minTerm) || toNum(form.minTerm) < 1) e.minTerm = "Enter a valid term in months";
    if (!ok(form.maxTerm) || toNum(form.maxTerm) < 1) e.maxTerm = "Enter a valid term in months";
    if (ok(form.minTerm) && ok(form.maxTerm) && toNum(form.minTerm) >= toNum(form.maxTerm))
      e.maxTerm = "Must be greater than minimum";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      name: form.name.trim(),
      minLoanAmount: toNum(form.minLoanAmount),
      maxLoanAmount: toNum(form.maxLoanAmount),
      vantageMin: toNum(form.vantageMin),
      vantageMax: toNum(form.vantageMax),
      minTerm: toNum(form.minTerm),
      maxTerm: toNum(form.maxTerm),
      status: form.status,
    });
  };

  const field = (label: string, key: keyof typeof emptyForm, placeholder = "") => (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        type="number"
        min="0"
        value={form[key] as string}
        placeholder={placeholder}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        className={`form-input${errors[key] ? " error" : ""}`}
      />
      {errors[key] && <span className="form-error">{errors[key]}</span>}
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <span className="modal-title">{existing ? "Edit Credit Union" : "Add Credit Union"}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">

              {/* Credit Union Name - full width */}
              <div className="form-field span-full">
                <label className="form-label">Credit Union Name *</label>
                <input
                  type="text"
                  value={form.name}
                  placeholder="e.g. Horizon Credit Union"
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={`form-input${errors.name ? " error" : ""}`}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Loan Amount */}
              {field("Minimum Loan Amount ($) *", "minLoanAmount", "e.g. 1000")}
              {field("Maximum Loan Amount ($) *", "maxLoanAmount", "e.g. 50000")}

              {/* Vantage Score Range */}
              {field("Vantage Score Min *", "vantageMin", "e.g. 580")}
              {field("Vantage Score Max *", "vantageMax", "e.g. 850")}

              {/* Term */}
              {field("Minimum Term (months) *", "minTerm", "e.g. 12")}
              {field("Maximum Term (months) *", "maxTerm", "e.g. 84")}

              {/* Status */}
              <div className="form-field span-full">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value as "Active" | "Inactive" }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              {existing ? "Save Changes" : "Add Credit Union"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
