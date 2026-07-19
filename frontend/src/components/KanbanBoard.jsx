import { useEffect, useState } from "react";
import { api } from "../api/client";

const COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "for_review", label: "For Review" },
  { key: "completed", label: "Completed" },
];

export default function KanbanBoard({ user, contacts }) {
  const [cards, setCards] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newCard, setNewCard] = useState({ title: "", description: "", assigned_to: "", due_date: "" });
  const [draggingId, setDraggingId] = useState(null);
  const [editingCard, setEditingCard] = useState(null); // holds a copy of the card being edited, or null

  async function load() {
    const data = await api.listCards();
    setCards(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    await api.createCard({
      title: newCard.title,
      description: newCard.description,
      assigned_to: newCard.assigned_to ? parseInt(newCard.assigned_to, 10) : null,
      due_date: newCard.due_date ? new Date(newCard.due_date).toISOString() : null,
    });
    setNewCard({ title: "", description: "", assigned_to: "", due_date: "" });
    setShowForm(false);
    load();
  }

  async function handleDrop(columnKey) {
    if (draggingId == null) return;
    await api.moveCard(draggingId, columnKey);
    setDraggingId(null);
    load();
  }

  function openEditor(card) {
    setEditingCard({
      id: card.id,
      title: card.title,
      description: card.description || "",
      assigned_to: card.assignee ? card.assignee.id : "",
      due_date: card.due_date ? new Date(card.due_date).toISOString().slice(0, 16) : "",
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    await api.editCard(editingCard.id, {
      title: editingCard.title,
      description: editingCard.description,
      assigned_to: editingCard.assigned_to ? parseInt(editingCard.assigned_to, 10) : null,
      due_date: editingCard.due_date ? new Date(editingCard.due_date).toISOString() : null,
    });
    setEditingCard(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    await api.deleteCard(id);
    setEditingCard(null);
    load();
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Work Board</h5>
        <button className="btn btn-sm btn-primary" onClick={() => setShowForm((s) => !s)}>
          + New Card
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-3 mb-3">
          <div className="row g-2">
            <div className="col-md-3">
              <input
                className="form-control form-control-sm"
                placeholder="Title"
                value={newCard.title}
                onChange={(e) => setNewCard((c) => ({ ...c, title: e.target.value }))}
                required
              />
            </div>
            <div className="col-md-3">
              <input
                className="form-control form-control-sm"
                placeholder="Description (optional)"
                value={newCard.description}
                onChange={(e) => setNewCard((c) => ({ ...c, description: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={newCard.assigned_to}
                onChange={(e) => setNewCard((c) => ({ ...c, assigned_to: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
                <option value={user.id}>{user.full_name} (me)</option>
              </select>
            </div>
            <div className="col-md-3">
              <input
                type="datetime-local"
                className="form-control form-control-sm"
                title="Due date (optional)"
                value={newCard.due_date}
                onChange={(e) => setNewCard((c) => ({ ...c, due_date: e.target.value }))}
              />
            </div>
            <div className="col-md-1">
              <button className="btn btn-sm btn-success w-100">Add</button>
            </div>
          </div>
        </form>
      )}

      <div className="row g-3">
        {COLUMNS.map((col) => (
          <div
            className="col-md-3"
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
          >
            <div className="kanban-column">
              <h6 className="text-uppercase text-muted small mb-2">{col.label}</h6>
              {cards
                .filter((c) => c.status_column === col.key)
                .map((c) => (
                  <div
                    key={c.id}
                    className={`kanban-card ${draggingId === c.id ? "dragging" : ""}`}
                    draggable
                    onDragStart={() => setDraggingId(c.id)}
                    onClick={() => openEditor(c)}
                  >
                    <div className="fw-semibold small">{c.title}</div>
                    {c.description && <div className="text-muted" style={{ fontSize: 12 }}>{c.description}</div>}
                    <div className="mt-1 d-flex justify-content-between align-items-center" style={{ fontSize: 11 }}>
                      <span className="badge bg-light text-dark border">
                        {c.assignee ? c.assignee.full_name : "Unassigned"}
                      </span>
                      {c.due_date && (
                        <span className="text-muted">Due {new Date(c.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {editingCard && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 2000 }}
          onClick={() => setEditingCard(null)}
        >
          <div className="card p-4" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3">Edit Card</h5>
            <form onSubmit={saveEdit}>
              <div className="mb-2">
                <label className="form-label small mb-0">Title</label>
                <input
                  className="form-control form-control-sm"
                  value={editingCard.title}
                  onChange={(e) => setEditingCard((c) => ({ ...c, title: e.target.value }))}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label small mb-0">Description</label>
                <input
                  className="form-control form-control-sm"
                  value={editingCard.description}
                  onChange={(e) => setEditingCard((c) => ({ ...c, description: e.target.value }))}
                />
              </div>
              <div className="mb-2">
                <label className="form-label small mb-0">Assigned to</label>
                <select
                  className="form-select form-select-sm"
                  value={editingCard.assigned_to}
                  onChange={(e) => setEditingCard((c) => ({ ...c, assigned_to: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                  <option value={user.id}>{user.full_name} (me)</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small mb-0">Due date</label>
                <input
                  type="datetime-local"
                  className="form-control form-control-sm"
                  value={editingCard.due_date}
                  onChange={(e) => setEditingCard((c) => ({ ...c, due_date: e.target.value }))}
                />
              </div>
              <div className="d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(editingCard.id)}
                >
                  Delete Card
                </button>
                <div>
                  <button type="button" className="btn btn-sm btn-secondary me-2" onClick={() => setEditingCard(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-sm btn-primary">Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
