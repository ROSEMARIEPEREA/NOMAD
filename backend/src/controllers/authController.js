import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { generateOtp, isOtpExpired, sendOtpEmail } from "../utils/otp.js";
import { JWT_SECRET } from "../middleware/auth.js";

// Only emails from this domain are accepted -- change to your org's domain.
// Set ALLOWED_EMAIL_DOMAIN="" in .env to disable the restriction for testing.
const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "company.com";

function isCompanyEmail(email) {
  if (!ALLOWED_DOMAIN) return true;
  return email.toLowerCase().endsWith("@" + ALLOWED_DOMAIN.toLowerCase());
}

export async function signup(req, res) {
  try {
    const { full_name, company_email, password, role, time_zone } = req.body;
    if (!full_name || !company_email || !password) {
      return res.status(400).json({ error: "full_name, company_email, and password are required" });
    }
    if (!isCompanyEmail(company_email)) {
      return res.status(400).json({ error: `Email must be a company address (@${ALLOWED_DOMAIN})` });
    }
    const existing = await User.findOne({ where: { company_email } });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    const password_hash = await bcrypt.hash(password, 10);
    const { code, expiresAt } = generateOtp();

    const user = await User.create({
      full_name,
      company_email,
      password_hash,
      role: role === "leader" ? "leader" : "member",
      time_zone: time_zone || "Asia/Manila",
      is_verified: false,
      otp_code: code,
      otp_purpose: "signup",
      otp_expires_at: expiresAt,
    });

    sendOtpEmail(company_email, code, "signup");
    res.status(201).json({ message: "Signup successful. Check console for OTP.", user_id: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { company_email, code } = req.body;
    const user = await User.findOne({ where: { company_email } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.otp_code !== code) return res.status(400).json({ error: "Incorrect OTP" });
    if (isOtpExpired(user.otp_expires_at)) return res.status(400).json({ error: "OTP expired, request a new one" });

    if (user.otp_purpose === "signup") {
      user.is_verified = true;
    }
    user.otp_code = null;
    user.otp_expires_at = null;
    await user.save();

    res.json({ message: "Verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { company_email, password } = req.body;
    const user = await User.findOne({ where: { company_email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.is_verified) return res.status(403).json({ error: "Account not verified. Check your email for the OTP." });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role, company_email: user.company_email, full_name: user.full_name, time_zone: user.time_zone },
      JWT_SECRET,
      { expiresIn: "12h" }
    );
    res.json({ token, user: { id: user.id, full_name: user.full_name, role: user.role, time_zone: user.time_zone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function requestPasswordReset(req, res) {
  try {
    const { company_email } = req.body;
    const user = await User.findOne({ where: { company_email } });
    if (!user) return res.status(404).json({ error: "No account with that email" });

    const { code, expiresAt } = generateOtp();
    user.otp_code = code;
    user.otp_purpose = "reset";
    user.otp_expires_at = expiresAt;
    await user.save();

    sendOtpEmail(company_email, code, "reset");
    res.json({ message: "Reset OTP sent. Check console." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { company_email, code, new_password } = req.body;
    const user = await User.findOne({ where: { company_email } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.otp_code !== code || user.otp_purpose !== "reset") {
      return res.status(400).json({ error: "Incorrect OTP" });
    }
    if (isOtpExpired(user.otp_expires_at)) return res.status(400).json({ error: "OTP expired" });

    user.password_hash = await bcrypt.hash(new_password, 10);
    user.otp_code = null;
    user.otp_purpose = null;
    user.otp_expires_at = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
