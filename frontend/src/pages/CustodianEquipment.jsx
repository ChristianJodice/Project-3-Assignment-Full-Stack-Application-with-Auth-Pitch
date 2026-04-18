import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";

const emptyForm = { name: "", description: "", quantity_total: 1 };

export default function CustodianEquipment() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/equipment");
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      quantity_total: item.quantity_total,
    });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/equipment", {
        method: "POST",
        body: {
          name: form.name.trim(),
          description: form.description.trim(),
          quantity_total: Number(form.quantity_total),
        },
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/equipment/${editingId}`, {
        method: "PUT",
        body: {
          name: form.name.trim(),
          description: form.description.trim(),
          quantity_total: Number(form.quantity_total),
        },
      });
      cancelEdit();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this equipment item?")) return;
    setError("");
    try {
      await api(`/api/equipment/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="muted">Loading inventory…</p>;

  return (
    <div className="page">
      <h1>Manage inventory</h1>
      <p className="muted">Create, update, and delete catalog items. Members only see this data.</p>
      {error && <p className="error-banner">{error}</p>}

      <form
        className="card stack"
        onSubmit={editingId ? handleUpdate : handleCreate}
      >
        <h2>{editingId ? "Edit item" : "Add item"}</h2>
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </label>
        <label>
          Description
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>
        <label>
          Total quantity
          <input
            type="number"
            min={1}
            value={form.quantity_total}
            onChange={(e) =>
              setForm((f) => ({ ...f, quantity_total: e.target.value }))
            }
            required
          />
        </label>
        <div className="row gap">
          <button type="submit" className="btn primary" disabled={saving}>
            {editingId ? (saving ? "Saving…" : "Save changes") : saving ? "Adding…" : "Add item"}
          </button>
          {editingId && (
            <button type="button" className="btn ghost" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="mt-2">Current catalog</h2>
      {items.length === 0 ? (
        <p className="muted">No items yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Total</th>
                <th>Available</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="small muted">{item.description}</div>
                  </td>
                  <td>{item.quantity_total}</td>
                  <td>{item.available_quantity}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="btn small secondary"
                      onClick={() => startEdit(item)}
                      disabled={editingId === item.id}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn small ghost"
                      onClick={() => handleDelete(item.id)}
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
