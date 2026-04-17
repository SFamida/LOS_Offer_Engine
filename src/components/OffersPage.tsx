"use client";

import { useState, useMemo } from "react";
import { Offer } from "@/types/offer";
import OfferModal from "@/components/OfferModal";

const INITIAL_DATA: Offer[] = [
  {
    id: "1",
    name: "Same As Cash 12 Months",
    description: "No interest charged if the full balance is paid within 12 months of the purchase date.",
    isPromo: true,
    status: "Active",
    createdAt: "2024-01-10",
  },
  {
    id: "2",
    name: "Zero Interest 24 Months",
    description: "0% APR promotional financing for 24 months on approved purchases over $500.",
    isPromo: true,
    status: "Active",
    createdAt: "2024-02-14",
  },
  {
    id: "3",
    name: "Deferred Payment 6 Months",
    description: "No payments required for the first 6 months. Interest accrues from purchase date.",
    isPromo: false,
    status: "Inactive",
    createdAt: "2023-12-01",
  },
];

export default function OffersPage({ embedded = false }: { embedded?: boolean }) {
  const [offers, setOffers] = useState<Offer[]>(INITIAL_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return offers.filter((o) => {
      const matchSearch =
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [offers, search, statusFilter]);

  const handleAdd = () => { setEditing(null); setIsModalOpen(true); };
  const handleEdit = (o: Offer) => { setEditing(o); setIsModalOpen(true); };

  const handleSave = (data: Omit<Offer, "id" | "createdAt">) => {
    if (editing) {
      setOffers((prev) => prev.map((o) => (o.id === editing.id ? { ...o, ...data } : o)));
    } else {
      setOffers((prev) => [
        { ...data, id: Date.now().toString(), createdAt: new Date().toISOString().split("T")[0] },
        ...prev,
      ]);
    }
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
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
            <span className="app-badge">Offers</span>
          </div>
        </header>
      )}

      <main className="page-content">
        {/* Section header */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Offer Management</h2>
            <p className="section-sub">
              {offers.length} total &bull;{" "}
              {offers.filter((o) => o.status === "Active").length} active
            </p>
          </div>
          <button className="btn-primary" onClick={handleAdd}>
            <span style={{ fontSize: "1.1rem", lineHeight: "1" }}>+</span>
            Add Offer
          </button>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <input
            type="text"
            className="filter-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by offer name or description..."
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

        {/* Tile grid */}
        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.35 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ fontWeight: 600 }}>No offers found</p>
              <p style={{ fontSize: "0.78rem", marginTop: 4 }}>Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {filtered.map((offer) => (
              <div
                key={offer.id}
                style={{
                  background: "var(--surface-card)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-sm)",
                  border: "1px solid var(--border-default)",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
              >
                {/* Tile header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      margin: 0,
                      lineHeight: "1.35",
                    }}
                  >
                    {offer.name}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", flexShrink: 0 }}>
                    <span
                      className={`badge ${offer.status === "Active" ? "badge-active" : "badge-inactive"}`}
                    >
                      <span className="badge-dot" />
                      {offer.status}
                    </span>
                    {offer.isPromo && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "var(--radius-full)",
                          background: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fcd34d",
                          letterSpacing: "0.02em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ★ Promo
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    margin: 0,
                    lineHeight: "1.55",
                    flexGrow: 1,
                  }}
                >
                  {offer.description}
                </p>

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid var(--border-default)",
                    marginTop: "auto",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Created {offer.createdAt}
                  </span>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button className="btn-row-edit" onClick={() => handleEdit(offer)}>Edit</button>
                    <button className="btn-row-delete" onClick={() => setDeleteConfirm(offer.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="stat-grid" style={{ marginTop: "1.5rem" }}>
          {[
            { label: "Total Offers",  value: offers.length },
            { label: "Active",        value: offers.filter((o) => o.status === "Active").length },
            { label: "Inactive",      value: offers.filter((o) => o.status === "Inactive").length },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
            </div>
          ))}
        </div>
      </main>

      <OfferModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        existing={editing}
      />

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Delete Offer?</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                This action cannot be undone. The offer will be permanently removed.
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
