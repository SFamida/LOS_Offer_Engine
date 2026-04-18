"use client";

import { useState, useMemo, useEffect } from "react";
import { Merchant } from "@/types/merchant";
import MerchantModal from "@/components/MerchantModal";
import { CustomConfig } from "@/types/customConfig";
import { CreditUnion } from "@/types/creditUnion";

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export default function MerchantsPage({ embedded = false }: { embedded?: boolean }) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [customConfigs, setCustomConfigs] = useState<CustomConfig[]>([]);
  const [creditUnions, setCreditUnions] = useState<CreditUnion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/merchants").then((r) => r.json()),
      fetch("/api/custom-configs").then((r) => r.json()),
      fetch("/api/credit-unions").then((r) => r.json()),
    ]).then(([m, cc, cu]) => {
      setMerchants(m);
      setCustomConfigs(cc);
      setCreditUnions(cu);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return merchants.filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [merchants, search, statusFilter]);

  const handleAdd = () => { setEditing(null); setIsModalOpen(true); };
  const handleEdit = (m: Merchant) => { setEditing(m); setIsModalOpen(true); };

  const handleSave = async (data: Omit<Merchant, "id" | "createdAt">) => {
    if (editing) {
      const res = await fetch(`/api/merchants/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      setMerchants((prev) => prev.map((m) => (m.id === editing.id ? updated : m)));
    } else {
      const res = await fetch("/api/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const created = await res.json();
      setMerchants((prev) => [created, ...prev]);
    }
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/merchants/${id}`, { method: "DELETE" });
    setMerchants((prev) => prev.filter((m) => m.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-bg)" }}>
      <main className="page-content">
        <div className="section-header">
          {!embedded ? (
            <div>
              <h2 className="section-title">Merchant Management</h2>
              <p className="section-sub">
                {merchants.length} total &bull;{" "}
                {merchants.filter((m) => m.status === "Active").length} active
              </p>
            </div>
          ) : (
            <div />
          )}
          <button className="btn-primary" onClick={handleAdd}>
            <span style={{ fontSize: "1.1rem", lineHeight: "1" }}>+</span>
            Add Merchant
          </button>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : (<>
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
                    <th>Custom Config</th>
                    <th>Credit Unions</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const ccName = customConfigs.find((cc) => cc.id === m.customConfigId)?.name || m.customConfigId;
                    const cuNames = m.creditUnionIds
                      .map((cuId) => creditUnions.find((cu) => cu.id === cuId)?.name)
                      .filter(Boolean) as string[];
                    return (
                      <tr key={m.id} className="group">
                        <td className="td-name">{m.name}</td>
                        <td>
                          <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--brand-blue)" }}>
                            {ccName}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                            {cuNames.length === 0 ? (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>—</span>
                            ) : cuNames.map((name) => (
                              <span key={name} style={{
                                fontSize: "0.7rem", fontWeight: 500,
                                padding: "2px 8px",
                                background: "#f1f5f9", color: "#475569",
                                whiteSpace: "nowrap",
                              }}>
                                {name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${m.status === "Active" ? "badge-active" : "badge-inactive"}`}>
                            <span className="badge-dot" />
                            {m.status}
                          </span>
                        </td>
                        <td>{fmtDate(m.createdAt)}</td>
                        <td style={{ textAlign: "right" }}>
                          <div className="reveal-actions flex justify-end gap-2">
                            <button className="btn-row-edit" onClick={() => handleEdit(m)}>Edit</button>
                            <button className="btn-row-delete" onClick={() => setDeleteConfirm(m.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
        </>)}
      </main>

      <MerchantModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        existing={editing}
        customConfigs={customConfigs}
        creditUnions={creditUnions}
      />

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
