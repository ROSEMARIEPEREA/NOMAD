import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function ForgotPassword() {
  const [company_email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword({ company_email });
      navigate("/verify-otp", { state: { company_email, purpose: "reset" } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow-sm p-4" style={{ width: 400 }}>
        <h3 className="mb-1">Forgot Password</h3>
        <p className="text-muted small mb-4">We'll send a reset OTP (check the backend terminal).</p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Company Email</label>
            <input className="form-control" value={company_email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Sending..." : "Send Reset OTP"}
          </button>
        </form>
        <div className="mt-3 small">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
