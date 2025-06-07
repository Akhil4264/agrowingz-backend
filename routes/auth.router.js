const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require('../middleware/auth.middleware')


router.post("/send-otp", authController.sendOTP);
router.post("/verify", authController.verifyEmail);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authMiddleware,authController.logout);
router.post("/request-reset", authController.requestPasswordReset);
router.get("/reset-password", authController.verifyResetPassReq)
router.post("/reset-password", authController.resetPassword);

module.exports = router;