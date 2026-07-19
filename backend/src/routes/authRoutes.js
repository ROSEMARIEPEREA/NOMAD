import { Router } from "express";
import { signup, verifyOtp, login, requestPasswordReset, resetPassword } from "../controllers/authController.js";

const router = Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
