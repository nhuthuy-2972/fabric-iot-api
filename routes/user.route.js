"use strict";

const express = require("express");
const controller = require("../controllers/user.controller");
const router = express.Router();
const middleware = require("../midleware/user.middleware")
// ROUTER GET
router.post("/adddevice", [middleware.verifytoken], controller.adddevice);
router.post("/updatephonenumber", [middleware.verifytoken], controller.updatePhoneNumber);
router.post("/sharedevice", [middleware.verifyOnwer], controller.registerEnrollNewUser);
router.post("/gettoken", [middleware.ownerBCUser], controller.getToken);

module.exports = router;