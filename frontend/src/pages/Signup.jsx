import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

const TIMEZONES = ["Asia/Manila", "America/New_York", "America/Los_Angeles", "Asia/Kolkata", "Europe/London", "UTC"];

export default function Signup() {
  const [form, setForm] = useState({
    full_name: "",
    company_email: "",
    password: "",
    role: "member",
    time_zone: "Asia/Manila",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.signup(form);
      setNotice("Account created. Check the BACKEND TERMINAL for your OTP code (simulated email).");
      setTimeout(() => navigate("/verify-otp", { state: { company_email: form.company_email, purpose: "signup" } }), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow-sm p-4" style={{ width: 440 }}>
        <h3 className="mb-1">Create Account</h3>
        <p className="text-muted small mb-4">Verified by email + OTP at sign-up</p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {notice && <div className="alert alert-success py-2">{notice}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input className="form-control" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Company Email</label>
            <input
              className="form-control"
              placeholder="you@yourorganization.com"
              value={form.company_email}
              onChange={(e) => update("company_email", e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </div>
          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={(e) => update("role", e.target.value)}>
                <option value="member">Team Member</option>
                <option value="leader">Team Leader / Manager</option>
              </select>
            </div>
            <div className="col">
              <label className="form-label">Time Zone</label>
              <select className="form-select" value={form.time_zone} onChange={(e) => update("time_zone", e.target.value)}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
        <div className="mt-3 small">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
