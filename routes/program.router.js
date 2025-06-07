const express = require("express");
const router = express.Router();
const programController = require("../controllers/program.controller");

router.post("/book-slot", programController.bookProgramSlot);
router.get("/slots", programController.getAvailableSlots);
// router.get("/list", programController.getPrograms);


module.exports = router;