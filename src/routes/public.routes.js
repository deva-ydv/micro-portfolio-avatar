const express = require("express");
const { getPublicProfile, redirectLink } = require("../controllers/public.controller");
const { publicLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.get("/:slug", publicLimiter, getPublicProfile);

module.exports = router;
