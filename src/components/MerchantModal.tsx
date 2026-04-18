"use client";

import { useState, useEffect, useRef } from "react";
import { Merchant } from "@/types/merchant";

type OfferType = "Same As Cash" | "Zero Interest";
const ALL_OFFERS: OfferType[] = ["Same As Cash", "Zero Interest"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Merchant, "id" | "createdAt">) => void;
  existing?: Merchant | null;
}

const emptyForm = {
  name: "",
  minLoanAmount: "",
  maxLoanAmount: "",
  vantageMin: "",
  vantageMax: "",
  minTerm: "",
  maxTerm: "",
  offers: [] as OfferType[],
  excelFileName: "",
  status: "Active" as "Active" | "Inactive",
};

export default function MerchantModal({ isOpen, onClose, onSave, existing }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        offers: existing.offers,
        excelFileName: existing.excelFileName || "",
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
    if (!form.name.trim()) e.name = "Merchant Name is required";
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

  const toggleOffer = (offer: OfferType) => {
    setForm((prev) => ({
      ...prev,
      offers: prev.offers.includes(offer)
        ? prev.offers.filter((o) => o !== offer)
        : [...prev.offers, offer],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowed = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];
      if (!allowed.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
        setErrors((prev) => ({ ...prev, excelFile: "Only .xls, .xlsx, or .csv files are allowed" }));
        if (fileInputRef.current) fileInputRef.current.value = "";
        setForm((prev) => ({ ...prev, excelFileName: "" }));
        return;
      }
      setErrors((prev) => { const n = { ...prev }; delete n.excelFile; return n; });
      setForm((prev) => ({ ...prev, excelFileName: file.name }));
    }
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
      offers: form.offers,
      excelFileName: form.excelFileName || undefined,
      status: form.status,
    });
  };

  const numField = (label: string, key: "minLoanAmount" | "maxLoanAmount" | "vantageMin" | "vantageMax" | "minTerm" | "maxTerm", placeholder = "") => (
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
      <div className="modal-box" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title">{existing ? "Edit Merchant" : "Add Merchant"}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">

              {/* Merchant Name */}
              <div className="form-field span-full">
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

              {/* Loan Amount */}
              {numField("Minimum Loan Amount ($) *", "minLoanAmount", "e.g. 1000")}
              {numField("Maximum Loan Amount ($) *", "maxLoanAmount", "e.g. 50000")}

              {/* Vantage Score Range */}
              {numField("Vantage Score Min *", "vantageMin", "e.g. 580")}
              {numField("Vantage Score Max *", "vantageMax", "e.g. 850")}

              {/* Term */}
              {numField("Minimum Term (months) *", "minTerm", "e.g. 12")}
              {numField("Maximum Term (months) *", "maxTerm", "e.g. 84")}

              {/* Offers List */}
              <div className="form-field span-full">
                <label className="form-label">Offers List</label>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.25rem" }}>
                  {ALL_OFFERS.map((offer) => (
                    <label key={offer} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                      <input
                        type="checkbox"
                        checked={form.offers.includes(offer)}
                        onChange={() => toggleOffer(offer)}
                        style={{ width: 16, height: 16, accentColor: "var(--brand-blue)", cursor: "pointer" }}
                      />
                      {offer}
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="form-field span-full">
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
