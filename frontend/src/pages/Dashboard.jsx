import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import SchedulePanel from "../components/SchedulePanel";
import KanbanBoard from "../components/KanbanBoard";
import ChatPanel from "../components/ChatPanel";
import NotificationBell from "../components/NotificationBell";
import TeamTimeOverview from "../components/TeamTimeOverview";
import ProgressSummary from "../components/ProgressSummary";

const TABS = [
  { key: "schedule", label: "Scheduling" },
  { key: "board", label: "Work Board" },
  { key: "progress", label: "Team Progress" },
  { key: "chat", label: "Messaging" },
  { key: "team", label: "Team Time Zones" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("schedule");
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    api.listContacts().then(setContacts);
  }, [user]);

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div>
      <nav className="navbar navbar-light bg-white border-bottom px-3 mb-4">
        <span className="navbar-brand fw-bold">NOMAD</span>
        <div className="d-flex align-items-center gap-3">
          <span className="small text-muted">
            {user.full_name} · <span className="badge bg-secondary">{user.role}</span> · {user.time_zone}
          </span>
          <NotificationBell />
          <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </nav>

      <div className="container-fluid px-4">
        <ul className="nav nav-pills mb-4">
          {TABS.map((t) => (
            <li className="nav-item" key={t.key}>
              <button
                className={`nav-link ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>

        {tab === "schedule" && <SchedulePanel user={user} contacts={contacts} />}
        {tab === "board" && <KanbanBoard user={user} contacts={contacts} />}
        {tab === "progress" && <ProgressSummary />}
        {tab === "chat" && <ChatPanel user={user} contacts={contacts} />}
        {tab === "team" && <TeamTimeOverview user={user} contacts={contacts} />}
      </div>
    </div>
  );
}
