const express = require("express");
const router = express.Router();
const formController = require("../controllers/form.controller");
const authMiddleware = require("../middleware/auth.middleware")

router.post("/user/career-guidence",authMiddleware, formController.submitCareersForm);
router.post("/user/study-abroad",authMiddleware, formController.submitStudyAbroadForm);
router.post("/user/placement-gurantee",authMiddleware, formController.submitPlacementGuranteeForm);

router.post("/guest/career-guidence", formController.guestSubmitCareersForm);
router.post("/guest/study-abroad", formController.guestSubmitStudyAbroadForm);
router.post("/guest/placement-gurantee", formController.guestSubmitPlacementGuranteeForm);


router.post("/newsletter-subscribe", formController.subscribeNewsletter);

router.post("/newsletter-unsubscribe", formController.unSubscribeNewsletter);

module.exports = router;