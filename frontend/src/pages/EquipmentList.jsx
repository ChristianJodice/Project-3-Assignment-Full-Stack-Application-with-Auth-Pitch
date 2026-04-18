import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function EquipmentList() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api("/api/equipment");
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="muted">Loading equipment…</p>;
  if (error) return <p className="error-banner">{error}</p>;

  return (
    <div className="page">
      <h1>Equipment</h1>
      <p className="muted">Available counts reflect active checkouts.</p>
      {items.length === 0 ? (
        <div className="card">
          <p>No equipment yet. A custodian can add items from Manage inventory.</p>
        </div>
      ) : (
        <ul className="equipment-grid">
          {items.map((item) => (
            <li key={item.id} className="card equipment-card">
              <Link to={`/equipment/${item.id}`}>
                <h2>{item.name}</h2>
              </Link>
              <p className="muted small">{item.description || "No description."}</p>
              <p className="stock-line">
                <span className="pill ok">{item.available_quantity} available</span>
                <span className="muted small">of {item.quantity_total} total</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
