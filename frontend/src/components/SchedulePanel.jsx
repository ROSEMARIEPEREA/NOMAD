import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function SchedulePanel({ user, contacts }) {
  const [mine, setMine] = useState([]);
  const [team, setTeam] = useState([]);
  const [form, setForm] = useState({ title: "", start_time: "", end_time: "" });
  const [conflictWarning, setConflictWarning] = useState("");

  // Meeting recommendation state
  const [recTitle, setRecTitle] = useState("");
  const [recParticipants, setRecParticipants] = useState([]);
  const [recDuration, setRecDuration] = useState(30);
  const [recCandidates, setRecCandidates] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [bookedMsg, setBookedMsg] = useState("");

  async function load() {
    const [mineData, teamData] = await Promise.all([api.myschedule(), api.teamSchedule()]);
    setMine(mineData);
    setTeam(teamData);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setConflictWarning("");
    const startIso = new Date(form.start_time).toISOString();
    const endIso = new Date(form.end_time).toISOString();
    const res = await api.createSchedule({ title: form.title, start_time: startIso, end_time: endIso });
    if (res.conflict_detected) {
      setConflictWarning(
        `Schedule conflict detected with: ${res.conflicting_with.map((c) => c.title).join(", ")}`
      );
    }
    setForm({ title: "", start_time: "", end_time: "" });
    load();
  }

  async function handleDelete(id) {
    await api.deleteSchedule(id);
    load();
  }

  async function handleFindSlots(e) {
    e.preventDefault();
    setRecLoading(true);
    setBookedMsg("");
    try {
      const res = await api.recommendMeeting({
        user_ids: recParticipants.map(Number),
        duration_minutes: parseInt(recDuration, 10),
      });
      setRecCandidates(res.candidates);
    } finally {
      setRecLoading(false);
    }
  }

  async function handleBook(slot) {
    await api.bookMeeting({
      title: recTitle || "Team Meeting",
      start_time: slot.start_time,
      end_time: slot.end_time,
      user_ids: recParticipants.map(Number),
    });
    setBookedMsg(`Booked for all participants: ${new Date(slot.start_time).toLocaleString()}`);
    setRecCandidates(null);
    load();
  }

  return (
    <div className="row g-4">
      <div className="col-md-5">
        <h5>My Schedule ({user.time_zone})</h5>
        <form onSubmit={handleCreate} className="card p-3 mb-3">
          <input
            className="form-control form-control-sm mb-2"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <div className="row g-2 mb-2">
            <div className="col">
              <label className="form-label small mb-0">Start</label>
              <input
                type="datetime-local"
                className="form-control form-control-sm"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                required
              />
            </div>
            <div className="col">
              <label className="form-label small mb-0">End</label>
              <input
                type="datetime-local"
                className="form-control form-control-sm"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                required
              />
            </div>
          </div>
          <button className="btn btn-sm btn-primary">Add to Schedule</button>
          {conflictWarning && <div className="alert alert-warning py-1 mt-2 mb-0 small">{conflictWarning}</div>}
        </form>

        <ul className="list-group">
          {mine.map((entry) => (
            <li key={entry.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold small">{entry.title}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {new Date(entry.start_time_local).toLocaleString()} –{" "}
                  {new Date(entry.end_time_local).toLocaleTimeString()}
                </div>
              </div>
              <div>
                {entry.status === "conflict" && <span className="badge bg-danger me-2">Conflict</span>}
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(entry.id)}>
                  ×
                </button>
              </div>
            </li>
          ))}
          {mine.length === 0 && <li className="list-group-item text-muted small">No schedule entries yet.</li>}
        </ul>
      </div>

      <div className="col-md-7">
        <h5>Recommend a Meeting Time</h5>
        <div className="card p-3 mb-3">
          <div className="row g-2 mb-2">
            <div className="col-md-4">
              <input
                className="form-control form-control-sm"
                placeholder="Meeting title"
                value={recTitle}
                onChange={(e) => setRecTitle(e.target.value)}
              />
            </div>
            <div className="col-md-5">
              <select
                multiple
                className="form-select form-select-sm"
                value={recParticipants}
                onChange={(e) => setRecParticipants(Array.from(e.target.selectedOptions, (o) => o.value))}
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={recDuration} onChange={(e) => setRecDuration(e.target.value)}>
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
              </select>
            </div>
            <div className="col-md-1">
              <button className="btn btn-sm btn-primary w-100" onClick={handleFindSlots} disabled={recLoading || recParticipants.length === 0}>
                Find
              </button>
            </div>
          </div>
          <div className="text-muted small mb-2">
            Checks each invited member's own local business hours (8am–6pm, Mon–Fri) and existing schedule conflicts.
          </div>

          {bookedMsg && <div className="alert alert-success py-1 small">{bookedMsg}</div>}

          {recCandidates && (
            <div>
              {recCandidates.length === 0 && (
                <div className="text-muted small">No common free slot found in the next 7 days.</div>
              )}
              {recCandidates.map((slot, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center border rounded p-2 mb-1">
                  <div className="small">
                    {Object.entries(slot.per_user_local).map(([uid, local]) => (
                      <div key={uid}>
                        {contacts.find((c) => String(c.id) === uid)?.full_name || (uid === String(user.id) ? user.full_name : uid)}:{" "}
                        <strong>{local}</strong>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-sm btn-outline-success" onClick={() => handleBook(slot)}>
                    Book
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <h5>Team Calendar</h5>
        <table className="table table-sm table-bordered bg-white">
          <thead>
            <tr>
              <th>Event</th>
              <th>Team Member</th>
              <th>Their Local Time</th>
              <th>Your Local Time</th>
            </tr>
          </thead>
          <tbody>
            {team.map((e) => (
              <tr key={e.id} className={e.status === "conflict" ? "table-warning" : ""}>
                <td>{e.title}</td>
                <td>{e.user}</td>
                <td>{e.owner_local}</td>
                <td>{e.viewer_local}</td>
              </tr>
            ))}
            {team.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted small">
                  No team schedule entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
