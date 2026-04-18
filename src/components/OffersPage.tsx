"use client";

import { useEffect, useMemo, useState } from "react";
import OfferModal from "@/components/OfferModal";
import { Offer } from "@/types/offer";

export default function OffersPage({
  embedded = false,
  offers: externalOffers,
  onOffersChange,
}: {
  embedded?: boolean;
  offers?: Offer[];
  onOffersChange?: (offers: Offer[]) => void;
}) {
  const [internalOffers, setInternalOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(externalOffers === undefined);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const offers = externalOffers ?? internalOffers;
  const setOffers = (next: Offer[]) => {
    if (onOffersChange) {
      onOffersChange(next);
      return;
    }

    setInternalOffers(next);
  };

  useEffect(() => {
    if (externalOffers !== undefined) {
      setLoading(false);
      return;
    }

    fetch("/api/offers")
      .then((response) => response.json())
      .then((data) => setInternalOffers(data))
      .finally(() => setLoading(false));
  }, [externalOffers]);

  const filtered = useMemo(() => {
    return offers.filter((offer) => {
      const matchSearch =
        offer.name.toLowerCase().includes(search.toLowerCase()) ||
        offer.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || offer.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [offers, search, statusFilter]);

  const handleAdd = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const handleEdit = (offer: Offer) => {
    setEditing(offer);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Offer, "id" | "createdAt">) => {
    if (editing) {
      const response = await fetch(`/api/offers/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await response.json();
      setOffers(offers.map((offer) => (offer.id === editing.id ? updated : offer)));
    } else {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const created = await response.json();
      setOffers([created, ...offers]);
    }

    setIsModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/offers/${id}`, { method: "DELETE" });
    setOffers(offers.filter((offer) => offer.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-bg)" }}>
      <main className="page-content">
        <div className="section-header">
          {!embedded ? (
            <div>
              <h2 className="section-title">Offer Management</h2>
              <p className="section-sub">
                {offers.length} total &bull;{" "}
                {offers.filter((offer) => offer.status === "Active").length} active
              </p>
            </div>
          ) : (
            <div />
          )}
          <button className="btn-primary" onClick={handleAdd}>
            <span style={{ fontSize: "1.1rem", lineHeight: "1" }}>+</span>
            Add Offer
          </button>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            className="filter-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by offer name or description..."
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["All", "Active", "Inactive"] as const).map((status) => (
              <button
                key={status}
                className={`filter-pill${statusFilter === status ? " active" : ""}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.35 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                onMouseEnter={(event) => {
                  event.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
              >
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
                    <span className={`badge ${offer.status === "Active" ? "badge-active" : "badge-inactive"}`}>
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
                        Promo
                      </span>
                    )}
                  </div>
                </div>

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

        <div className="stat-grid" style={{ marginTop: "1.5rem" }}>
          {[
            { label: "Total Offers", value: offers.length },
            { label: "Active", value: offers.filter((offer) => offer.status === "Active").length },
            { label: "Inactive", value: offers.filter((offer) => offer.status === "Inactive").length },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          ))}
        </div>
      </main>

      <OfferModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditing(null);
        }}
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
