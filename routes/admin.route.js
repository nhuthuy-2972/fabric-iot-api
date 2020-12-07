"use strict";

const express = require("express");
const controller = require("../controllers/admin.controller");
const router = express.Router();
const middleware = require("../midleware/admin.middleware")
// ROUTER GET
router.post("/setcustomclaims", controller.setcustomClaims);
router.post("/activedevice",[middleware.checkadmin],controller.activedevice)
module.exports = router;