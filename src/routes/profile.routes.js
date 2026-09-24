const express = require("express");
const {
  getMyProfile,
  updateMyProfile,
  regenerateSlug,
} = require("../controllers/profile.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect); // every route below requires auth

router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.post("/me/regenerate-slug", regenerateSlug);

module.exports = router;
