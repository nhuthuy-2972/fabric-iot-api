const jwt = require("jsonwebtoken");
const log4js = require("log4js");
const logger = log4js.getLogger("APP.JS");
const helper = require("../helper/helper");
const device = require("../helper/device.app")
const constants = require("../config/constans.json");
const dotenv = require("dotenv");
dotenv.config();
const getErrorMessage = (field) => {
    let respone = {
        success: false,
        message: field + " field is missing or Invalid in the request",
    };
    return respone;
};

// const { DeepstreamClient } = require("@deepstream/client");
// const record = require("../app").record;
import { record, client } from '../app'
module.exports.getDataDevice = async (req, res) => {
    const { body } = req;
    const { username, orgName, channel, deviceId } = body;
    let response_payload = await device.getDataDevice(channel, username, orgName, deviceId);
    res.send(response_payload);
}

module.exports.pushDataDevice = async (req, res) => {
    const { body } = req;
    const { deviceId, username, orgName, channel } = body;

    delete body.deviceId;
    delete body.username;
    delete body.orgName;
    delete body.channel;
    // body.timestamp = new Date(body.timestamp * 1000).toLocaleString();
    body.timestamp = Math.ceil(new Date().getTime() / 1000);

    const data = {
        ...body,
    }
    // const { username, orgname, channel } = req.decode;
    try {
        let response_payload = await device.pushDataDevice(channel, username, orgName, deviceId, data);
        record.set(`news/${deviceId}`, data);
        res.send(response_payload);
    } catch (e) {
        console.log("day ne", e);
        res.send(e);
    }
}
