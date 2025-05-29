const router = require("express").Router();
const {
  authenticate,
  optionalAuth,
} = require("../middlewares/auth.middleware");

const {
  getUserInformation,
  updateUserProfile,
  requestPasswordChange,
  confirmPasswordChange,
} = require("../services/user.service");

router.get("/profile", authenticate, getUserInformation); //
router.patch("/update-profile", authenticate, updateUserProfile); //
router.post("/change-password", authenticate, requestPasswordChange); //
router.post("/verify-token", authenticate, confirmPasswordChange); //


module.exports = router;
