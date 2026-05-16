const express = require("express");
const { getStories, generateDynamicNews } = require("../controllers/dynamicHeygenApi.js");

const router = express.Router();

router.get("/", getStories);
router.post("/generate", generateDynamicNews);

module.exports = router;
