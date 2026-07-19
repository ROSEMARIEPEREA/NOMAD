import { useEffect, useState } from "react";
import { api } from "../api/client";

const COLUMN_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  for_review: "For Review",
  completed: "Completed",
};

export default function ProgressSummary() {
  const [summary, setSummary] = useState(null);

  async function load() {
    const data = await api.progressSummary();
    setSummary(data);
  }

  useEffect(() => {
    load();
    // Auto-refresh every 15s so the numbers stay current without manual reload
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!summary) return <div className="text-muted">Loading...</div>;

  return (
    <div>
      <h5 className="mb-3">Team Progress Overview</h5>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card p-3 text-center">
            <div className="text-muted small">Total Cards</div>
            <div className="fs-3 fw-bold">{summary.total_cards}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 text-center">
            <div className="text-muted small">Completion Rate</div>
            <div className="fs-3 fw-bold text-success">{summary.completion_rate}%</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 text-center">
            <div className="text-muted small">Overdue Tasks</div>
            <div className={`fs-3 fw-bold ${summary.overdue_total > 0 ? "text-danger" : "text-muted"}`}>
              {summary.overdue_total}
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 text-center">
            <div className="text-muted small">In Progress</div>
            <div className="fs-3 fw-bold text-primary">{summary.by_column.in_progress || 0}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-5">
          <h6 className="text-muted text-uppercase small">By Column</h6>
          {Object.entries(COLUMN_LABELS).map(([key, label]) => {
            const count = summary.by_column[key] || 0;
            const pct = summary.total_cards > 0 ? (count / summary.total_cards) * 100 : 0;
            return (
              <div key={key} className="mb-2">
                <div className="d-flex justify-content-between small mb-1">
                  <span>{label}</span>
                  <span className="text-muted">{count}</span>
                </div>
                <div className="progress" style={{ height: 8 }}>
                  <div className="progress-bar" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="col-md-7">
          <h6 className="text-muted text-uppercase small">By Team Member</h6>
          <table className="table table-sm table-bordered bg-white">
            <thead>
              <tr>
                <th>Member</th>
                <th>Open Tasks</th>
                <th>Completed</th>
                <th>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {summary.by_member.map((m) => (
                <tr key={m.user_id} className={m.overdue > 0 ? "table-warning" : ""}>
                  <td>{m.full_name}</td>
                  <td>{m.open}</td>
                  <td>{m.completed}</td>
                  <td>{m.overdue > 0 ? <span className="badge bg-danger">{m.overdue}</span> : "—"}</td>
                </tr>
              ))}
              {summary.by_member.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-muted small">
                    No assigned cards yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
