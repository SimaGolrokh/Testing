const express = require("express");
const { login, signup, jsonrefresh} = require("../controllers/auth");
const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/refresh", jsonrefresh);


module.exports = router;
