import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [company_email, setEmail] = useState("leader@company.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login({ company_email, password });
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow-sm p-4" style={{ width: 400 }}>
        <h3 className="mb-1">NOMAD</h3>
        <p className="text-muted small mb-4">Sign in with your company email</p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Company Email</label>
            <input className="form-control" value={company_email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="d-flex justify-content-between mt-3 small">
          <Link to="/signup">Create account</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <div className="mt-3 small text-muted">
          Demo accounts (seeded): leader@company.com / member1@company.com / member2@company.com — password: Password123!
        </div>
      </div>
    </div>
  );
}
