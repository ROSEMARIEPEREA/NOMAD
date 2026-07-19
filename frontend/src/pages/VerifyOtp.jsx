import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const passedEmail = location.state?.company_email || "";
  const purpose = location.state?.purpose || "signup"; // "signup" or "reset"

  const [company_email, setEmail] = useState(passedEmail);
  const [code, setCode] = useState("");
  const [new_password, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (purpose === "reset") {
        await api.resetPassword({ company_email, code, new_password });
        setSuccess("Password reset. Redirecting to login...");
      } else {
        await api.verifyOtp({ company_email, code });
        setSuccess("Account verified! Redirecting to login...");
      }
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow-sm p-4" style={{ width: 400 }}>
        <h3 className="mb-1">{purpose === "reset" ? "Reset Password" : "Verify Your Account"}</h3>
        <p className="text-muted small mb-4">
          Enter the 6-digit OTP printed in the <strong>backend terminal</strong> (simulated email).
        </p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}
        <form onSubmit={handleVerify}>
          <div className="mb-3">
            <label className="form-label">Company Email</label>
            <input className="form-control" value={company_email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">OTP Code</label>
            <input
              className="form-control"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          {purpose === "reset" && (
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                value={new_password}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          )}
          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
        <div className="mt-3 small">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
