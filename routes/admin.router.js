const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware")

router.get("/logs",authMiddleware,authMiddleware, adminController.getAllLogs);
router.get("/users",authMiddleware, adminController.getAllUsers);
// router.get("/bookings",authMiddleware, adminController.getAllBookings);
router.get("/ambassadors",authMiddleware,adminController.getAllAmbassadors)
router.get("/ambassadorRequests",authMiddleware,adminController.getAllAmbassadorRequests)


module.exports = router;