const router = require("express").Router();
const {
  authenticate,
  optionalAuth,
} = require("../middlewares/auth.middleware");

const {
  getUserInformation,
  updateUserProfile,
} = require("../services/user.service");

router.get("/account", authenticate, getUserInformation);
router.patch("/profile", authenticate, updateUserProfile);

module.exports = router;
