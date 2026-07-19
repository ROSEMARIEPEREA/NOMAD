// Generates a 6-digit OTP and its expiry (5 minutes from now).
// NOTE: For the demo, the OTP is logged to the backend console instead of
// actually emailed -- wire in Nodemailer + real SMTP creds for the live
// defense if you want it delivered to a real inbox. The verification LOGIC
// (hashing/expiry/one-time use) is real either way.
export function generateOtp() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  return { code, expiresAt };
}

export function isOtpExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

// Simulated "send" -- swap this for real Nodemailer transport before defense
// if you want a live inbox demo instead of reading it off the server console.
export function sendOtpEmail(toEmail, code, purpose) {
  console.log(`\n[OTP EMAIL SIMULATION] To: ${toEmail}`);
  console.log(`Purpose: ${purpose === "signup" ? "Account Verification" : "Password Reset"}`);
  console.log(`Your NOMAD OTP code is: ${code} (expires in 5 minutes)\n`);
}
