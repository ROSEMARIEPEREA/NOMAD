import { useEffect, useState } from "react";

// Formats "now" in a given IANA time zone using the browser's built-in
// Intl API -- no extra library needed, and it updates every second so the
// clock is genuinely live, not a one-time snapshot.
function formatLocalTime(timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
}

function formatLocalDate(timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

function localHour(timeZone) {
  return parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", hour12: false }).format(new Date()),
    10
  );
}

function statusFor(timeZone) {
  const hour = localHour(timeZone);
  if (hour >= 8 && hour < 18) return { label: "Working hours", icon: "☀️", cls: "text-success" };
  if (hour >= 6 && hour < 8) return { label: "Early morning", icon: "🌅", cls: "text-warning" };
  if (hour >= 18 && hour < 22) return { label: "Evening", icon: "🌇", cls: "text-warning" };
  return { label: "Likely asleep", icon: "🌙", cls: "text-muted" };
}

export default function TeamTimeOverview({ user, contacts }) {
  const [, forceTick] = useState(0);

  // Re-render every second so all the clocks visibly tick -- this is what
  // makes it a "live" overview rather than a static snapshot.
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const people = [{ ...user, isMe: true }, ...contacts.map((c) => ({ ...c, isMe: false }))];

  return (
    <div>
      <h5 className="mb-1">Team Time Zone Overview</h5>
      <p className="text-muted small mb-3">
        Live local time for every team member, based on the time zone each person set for their account.
      </p>
      <div className="row g-3">
        {people.map((p) => {
          const status = statusFor(p.time_zone);
          return (
            <div className="col-md-4 col-lg-3" key={p.id}>
              <div className="card p-3 h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">
                      {p.full_name} {p.isMe && <span className="badge bg-secondary ms-1">You</span>}
                    </div>
                    <div className="text-muted small">{p.time_zone}</div>
                  </div>
                  <div style={{ fontSize: 22 }}>{status.icon}</div>
                </div>
                <div className="mt-2">
                  <div className="fs-4 fw-bold font-monospace">{formatLocalTime(p.time_zone)}</div>
                  <div className="text-muted small">{formatLocalDate(p.time_zone)}</div>
                </div>
                <div className={`small mt-1 ${status.cls}`}>{status.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
