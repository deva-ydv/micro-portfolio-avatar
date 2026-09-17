const express = require("express");
const {
  getMyLinks,
  createLink,
  updateLink,
  deleteLink,
  reorderLinks,
} = require("../controllers/link.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect); // every route below requires auth

router.route("/").get(getMyLinks).post(createLink);
router.put("/reorder", reorderLinks); // placed before /:id so it isn't swallowed by it
router.route("/:id").put(updateLink).delete(deleteLink);

module.exports = router;
