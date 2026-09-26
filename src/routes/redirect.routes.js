const express = require("express");
const { redirectLink } = require("../controllers/public.controller");
const { publicLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.get("/:linkId", publicLimiter, redirectLink);

module.exports = router;
