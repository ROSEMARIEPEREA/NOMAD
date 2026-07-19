import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function NotificationBell() {
  const { socket } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);

  async function load() {
    const data = await api.listNotifications();
    setNotifs(data);
  }

  useEffect(() => {
    load();
    const s = socket.current;
    if (!s) return;
    const handler = () => load();
    s.on("notification", handler);
    return () => s.off("notification", handler);
  }, [socket]);

  async function handleMarkRead(id) {
    await api.markNotificationRead(id);
    load();
  }

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="position-relative">
      <button className="btn btn-outline-secondary btn-sm position-relative" onClick={() => setOpen((o) => !o)}>
        🔔
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          className="card shadow position-absolute end-0 mt-2"
          style={{ width: 320, zIndex: 1000, maxHeight: 360, overflowY: "auto" }}
        >
          <div className="card-body p-2">
            {notifs.length === 0 && <div className="text-muted small p-2">No notifications yet.</div>}
            {notifs.map((n) => (
              <div
                key={n.id}
                className={`p-2 border-bottom small ${n.is_read ? "text-muted" : "fw-semibold"}`}
                style={{ cursor: "pointer" }}
                onClick={() => handleMarkRead(n.id)}
              >
                <span className="badge bg-light text-dark border me-1">{n.type}</span>
                {n.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
