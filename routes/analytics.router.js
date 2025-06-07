const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");

router.post("/page-view", analyticsController.recordPageVisit);

module.exports = router;