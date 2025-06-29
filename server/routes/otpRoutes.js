
import express from "express";
import { sendOTP, verifyOTPAndResetPassword, resendOTP } from "../controllers/otpController.js";

const otpRouter = express.Router();

otpRouter.post("/send-otp", sendOTP);
otpRouter.post("/verify-otp-reset", verifyOTPAndResetPassword);
otpRouter.post("/resend-otp", resendOTP);

export default otpRouter;
