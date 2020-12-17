const jwt = require("jsonwebtoken");
const log4js = require("log4js");
const logger = log4js.getLogger("APP.JS");
const helper = require("../helper/helper");
const device = require("../helper/device.app");
const constants = require("../config/constans.json");
const dotenv = require("dotenv");
dotenv.config();
const getErrorMessage = () => {
  let respone = {
    success: false,
    message: "Some field is missing or Invalid in the request",
  };
  return respone;
};

// const { DeepstreamClient } = require("@deepstream/client");
// const record = require("../app").record;
import { record, client } from "../app";
module.exports.getDataDevice = async (req, res) => {
  const { bcIdentity, deviceID } = req.decoded;
  if (!bcIdentity || !deviceID) {
    res.status(401).json(getErrorMessage());
    return;
  }
  let response_payload = await device.getDataDevice(bcIdentity, deviceID);
  res.send(response_payload);
};

module.exports.pushDataDevice = async (req, res) => {
  const body = req.body;
  const { ID } = body;
  const identity = req.identity;
  if (!ID || !identity) {
    res.status(401).json(getErrorMessage());
    return;
  }
  // body.timestamp = new Date(body.timestamp * 1000).toLocaleString();
  body.timestamp = Math.ceil(new Date().getTime() / 1000);
  delete body.ID;
  const data = {
    ...body,
  };
  console.log(data);
  try {
    let response_payload = await device.pushDataDevice(identity, ID, data);
    // record.set(`news/${deviceId}`, data);
    res.send(response_payload);
  } catch (e) {
    console.log("day ne", e);
    res.send(e);
  }
};

module.exports.getDeviceField = async (req, res) => {
  const { bcIdentity } = req.decoded;
  if (!bcIdentity) {
    res.status(401).json(getErrorMessage());
    return;
  }
  try {
    const attrs = await helper.getAttrsUSer(bcIdentity);
    const deviceInfo = attrs.find((item) => item.name === "deviceInfo");
    let attrFields = attrs.find((item) => item.name === "refField");
    attrFields = JSON.parse(attrFields.value);
    let fields = [];
    for (let field of attrFields) {
      if (field.share === true) fields.push(field);
    }
    console.log(fields);
    const result = {
      deviceInfo: JSON.parse(deviceInfo.value),
      data_fields: fields,
    };
    res.json({ success: true, data: result });
  } catch (error) {
    console.log(error);
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};
