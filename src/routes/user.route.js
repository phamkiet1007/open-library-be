const router = require("express").Router();
const {
  authenticate,
  optionalAuth,
} = require("../middlewares/auth.middleware");

const { isAdmin, isMember } = require("../middlewares/role.middleware");

const {
  getUserInformation,
  updateUserProfile,
  requestPasswordChange,
  confirmPasswordChange,
  getAllUsers,
  toggleUserBlock,
  deleteUser,
} = require("../services/user.service");

/*User routes */
router.get("/profile", authenticate, getUserInformation); //
router.patch("/update-profile", authenticate, updateUserProfile); //
router.post("/change-password", authenticate, requestPasswordChange); //
router.post("/verify-token", authenticate, confirmPasswordChange); //
/*User routes */


/*Admin routes */
router.get("/all-users", authenticate, isAdmin, getAllUsers); //
router.patch("/toggle-block/:userId", authenticate, isAdmin, toggleUserBlock); //
router.delete("/delete-user/:userId", authenticate, isAdmin, deleteUser); //
/*Admin routes */



module.exports = router;
