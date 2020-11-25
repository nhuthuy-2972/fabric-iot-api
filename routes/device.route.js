"use strict";

const express = require("express");
const controller = require("../controllers/device.controller");
// const { route } = require("./auth.route");

const router = express.Router();

router.post("/datadevice", controller.getDataDevice);
router.post("/pushdata", controller.pushDataDevice);


module.exports = router;