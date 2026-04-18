import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MyCheckouts() {
  const { isCustodian } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/checkouts");
      setRows(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markReturned(id) {
    setBusyId(id);
    try {
      await api(`/api/checkouts/${id}`, {
        method: "PUT",
        body: { status: "returned" },
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function removeCheckout(id) {
    if (!window.confirm("Remove this checkout record?")) return;
    setBusyId(id);
    try {
      await api(`/api/checkouts/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="muted">Loading checkouts…</p>;

  return (
    <div className="page">
      <h1>{isCustodian ? "All checkouts" : "My checkouts"}</h1>
      {isCustodian && (
        <p className="muted">As custodian you see every member&apos;s active and returned loans.</p>
      )}
      {error && <p className="error-banner">{error}</p>}
      {rows.length === 0 ? (
        <div className="card">
          <p>No checkouts yet.</p>
          <Link to="/equipment" className="btn primary">
            Browse equipment
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {isCustodian && <th>Member</th>}
                <th>Item</th>
                <th>Qty</th>
                <th>Due</th>
                <th>Status</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  {isCustodian && <td>{c.user_email || `#${c.user_id}`}</td>}
                  <td>
                    {c.equipment ? (
                      <Link to={`/equipment/${c.equipment_id}`}>{c.equipment.name}</Link>
                    ) : (
                      `#${c.equipment_id}`
                    )}
                  </td>
                  <td>{c.quantity}</td>
                  <td>{c.due_date}</td>
                  <td>
                    <span className={c.status === "active" ? "pill warn" : "pill muted"}>
                      {c.status}
                    </span>
                  </td>
                  <td className="small muted">{c.notes}</td>
                  <td className="actions">
                    {c.status === "active" && (
                      <button
                        type="button"
                        className="btn small secondary"
                        disabled={busyId === c.id}
                        onClick={() => markReturned(c.id)}
                      >
                        Mark returned
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn small ghost"
                      disabled={busyId === c.id}
                      onClick={() => removeCheckout(c.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
