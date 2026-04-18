import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

function addDays(isoDate, days) {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [dueDate, setDueDate] = useState(() => addDays(new Date().toISOString().slice(0, 10), 7));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api(`/api/equipment/${id}`);
        if (!cancelled) setItem(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function checkout(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/api/checkouts", {
        method: "POST",
        body: {
          equipment_id: Number(id),
          quantity: Number(qty),
          due_date: dueDate,
          notes,
        },
      });
      navigate("/my-checkouts");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!item) return <p className="error-banner">{error || "Not found."}</p>;

  return (
    <div className="page">
      <p>
        <Link to="/equipment" className="back-link">
          ← Back to equipment
        </Link>
      </p>
      <div className="card detail-header">
        <h1>{item.name}</h1>
        <p className="muted">{item.description || "No description."}</p>
        <p className="stock-line">
          <span className="pill ok">{item.available_quantity} available</span>
          <span className="muted small">of {item.quantity_total} total</span>
        </p>
      </div>

      {item.available_quantity < 1 ? (
        <div className="card">
          <p>Nothing available to check out right now.</p>
        </div>
      ) : (
        <form className="card stack" onSubmit={checkout}>
          <h2>Check out</h2>
          <label>
            Quantity
            <input
              type="number"
              min={1}
              max={item.available_quantity}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
            />
          </label>
          <label>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </label>
          <label>
            Notes (optional)
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </label>
          {error && <p className="error-banner">{error}</p>}
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? "Saving…" : "Confirm checkout"}
          </button>
        </form>
      )}
    </div>
  );
}
