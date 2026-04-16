"use client";

import { useState, useMemo } from "react";
import { CreditUnion } from "@/types/creditUnion";
import CreditUnionModal from "@/components/CreditUnionModal";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const INITIAL_DATA: CreditUnion[] = [
  {
    id: "1",
    name: "Horizon Credit Union",
    minLoanAmount: 1000,
    maxLoanAmount: 50000,
    vantageMin: 620,
    vantageMax: 850,
    minTerm: 12,
    maxTerm: 84,
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Lakeside Federal CU",
    minLoanAmount: 2500,
    maxLoanAmount: 75000,
    vantageMin: 660,
    vantageMax: 850,
    minTerm: 24,
    maxTerm: 60,
    status: "Active",
    createdAt: "2024-03-22",
  },
  {
    id: "3",
    name: "Pioneer Community CU",
    minLoanAmount: 500,
    maxLoanAmount: 25000,
    vantageMin: 580,
    vantageMax: 780,
    minTerm: 6,
    maxTerm: 48,
    status: "Inactive",
    createdAt: "2023-11-08",
  },
];

export default function CreditUnionsPage({ embedded = false }: { embedded?: boolean }) {
  const [creditUnions, setCreditUnions] = useState<CreditUnion[]>(INITIAL_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CreditUnion | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return creditUnions.filter((cu) => {
      const matchSearch = cu.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || cu.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [creditUnions, search, statusFilter]);

  const handleAdd = () => { setEditing(null); setIsModalOpen(true); };
  const handleEdit = (cu: CreditUnion) => { setEditing(cu); setIsModalOpen(true); };

  const handleSave = (data: Omit<CreditUnion, "id" | "createdAt">) => {
    if (editing) {
      setCreditUnions((prev) => prev.map((cu) => (cu.id === editing.id ? { ...cu, ...data } : cu)));
    } else {
      setCreditUnions((prev) => [
        { ...data, id: Date.now().toString(), createdAt: new Date().toISOString().split("T")[0] },
        ...prev,
      ]);
    }
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setCreditUnions((prev) => prev.filter((cu) => cu.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-bg)" }}>
      {!embedded && (
        <header className="app-header">
          <div className="app-header-inner">
            <div>
              <div className="app-logo-title">LOS Offers Config</div>
              <div className="app-logo-sub">Loan Origination System - Configuration Portal</div>
            </div>
            <span className="app-badge">Credit Unions</span>
          </div>
        </header>
      )}

      <main className="page-content">
        <div className="section-header">
          <div>
            <h2 className="section-title">Credit Union Management</h2>
            <p className="section-sub">
              {creditUnions.length} total &bull;{" "}
              {creditUnions.filter((c) => c.status === "Active").length} active
            </p>
          </div>
          <button className="btn-primary" onClick={handleAdd}>
            <span style={{ fontSize: "1.1rem", lineHeight: "1" }}>+</span>
            Add Credit Union
          </button>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            className="filter-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by credit union name..."
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
              <p style={{ fontWeight: 600 }}>No credit unions found</p>
              <p style={{ fontSize: "0.78rem", marginTop: 4 }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Credit Union Name</th>
                    <th>Loan Amount Range</th>
                    <th>Vantage Score Range</th>
                    <th>Term Range</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cu) => (
                    <tr key={cu.id}>
                      <td className="td-name">{cu.name}</td>
                      <td>
                        <div>{fmt(cu.minLoanAmount)}</div>
                        <div className="td-sub">up to {fmt(cu.maxLoanAmount)}</div>
                      </td>
                      <td>
                        <div>{cu.vantageMin} - {cu.vantageMax}</div>
                      </td>
                      <td>
                        <div>{cu.minTerm} - {cu.maxTerm} months</div>
                      </td>
                      <td>
                        <span className={`badge ${cu.status === "Active" ? "badge-active" : "badge-inactive"}`}>
                          <span className="badge-dot" />
                          {cu.status}
                        </span>
                      </td>
                      <td>{cu.createdAt}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                          <button className="btn-row-edit" onClick={() => handleEdit(cu)}>Edit</button>
                          <button className="btn-row-delete" onClick={() => setDeleteConfirm(cu.id)}>Delete</button>
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
            { label: "Total Credit Unions", value: creditUnions.length },
            { label: "Active",   value: creditUnions.filter((c) => c.status === "Active").length },
            { label: "Inactive", value: creditUnions.filter((c) => c.status === "Inactive").length },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
            </div>
          ))}
        </div>
      </main>

      <CreditUnionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        existing={editing}
      />

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Delete Credit Union?</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                This action cannot be undone. The credit union will be permanently removed.
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
