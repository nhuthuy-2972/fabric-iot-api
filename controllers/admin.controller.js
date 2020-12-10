const jwt = require("jsonwebtoken");
const log4js = require("log4js");
const logger = log4js.getLogger("APP.JS");
const helper = require("../helper/helper");
const constants = require("../config/constans.json");
const { randomBytes } = require("crypto");
const dotenv = require("dotenv");
import { db, firebase } from "../fbadim/fb-hook";
import { sendmail } from "../mailer/mailer";
import {formatmail} from '../config/utils'
import { token } from "morgan";
dotenv.config();
const getErrorMessage = () => {
  let respone = {
    success: false,
    message: "Some field is missing or Invalid in the request",
  };
  return respone;
};

module.exports.setcustomClaims = async (req, res) => {
  console.log("do api");
  const token = req.token;
  console.log(token);
  if (!token) {
    res.status(403).json(getErrorMessage());
    return;
  }

  try {
    const claims = await firebase.auth().verifyIdToken(token);
    console.log(claims);
    // res.end(JSON.stringify({ status: "success" }));
    if (
      typeof claims.email !== "undefined" &&
      typeof claims.email_verified !== "undefined" &&
      claims.email_verified == false &&
      claims.email.endsWith("@admin.iotfabric.com")
    ) {
      console.log("do day");
      db.collection("adminuser")
        .doc(claims.sub)
        .get()
        .then((doc) => {
          if (doc.exists) {
            firebase
              .auth()
              .setCustomUserClaims(claims.sub, { admin: true })
              .then(() => {
                res.end(JSON.stringify({ status: "success" }));
              });
          } else {
            res.end(JSON.stringify({ status: "ineligible" }));
          }
        });
    } else {
      res.end(JSON.stringify({ status: "ineligible" }));
    }
  } catch (err) {
    console.log("Error: " + err);
    res.status(403).json({
      status: false,
      message: err,
    });
  }
};

module.exports.activedevice = async (req, res) => {
  // res.json({ status: "oke bede" });
    const { deviceID, auth,email,deviceName } = req.body;

    if (!auth || !deviceID || !email || !deviceName) {
      res.json(getErrorMessage());
      return;
    }
    const usernamereader = randomBytes(20).toString("hex");
    const usernamewriter = randomBytes(20).toString("hex");

    try {
      let responsereader = await helper.getRegisterUser(
        usernamereader,
        process.env.ORGREADER,
        deviceID
      );
      let responsewriter = await helper.getRegisterUser(
        usernamewriter,
        process.env.ORGWRITER,
        deviceID
      );
      if (
        responsewriter &&
        typeof responsewriter !== "string" &&
        responsereader &&
        typeof responsereader !== "string"
      ) {
        logger.debug(
          "Successfully registered the username %s for organization %s",
          usernamewriter,
          process.env.ORGWRITER
        );
        logger.debug(
          "Successfully registered the username %s for organization %s",
          usernamereader,
          process.env.ORGREADER
        );
        const docreader = {
          auth: auth,
          deviceID: deviceID,
          bcIdentity: usernamereader,
          reader : true,
          revoke :false
        };
        const docwriter = {
          auth: auth,
          deviceID: deviceID,
          bcIdentity: usernamewriter,
          reader : false,
          revoke :false
        };
        let batch = db.batch();

        const readerRef = db.collection("bcAccounts").doc();
        const writerRef = db.collection("bcAccounts").doc();
        const updateRef = db.collection("device").doc(deviceID);
        batch.set(readerRef, docreader);
        batch.set(writerRef, docwriter);
        batch.update(updateRef, { actived: "yes" });
        await batch.commit();

       const deviceToken = jwt.sign({
          bcIdentity : usernamewriter
        },process.env.SECRECTJWT)

        const text = formatmail(email,deviceName,deviceID,deviceToken)
        sendmail("IOT-FABRIC-SERVICE", email, text)
        res.json({ status: true, message: "success" });
      } else {
        res.json({ success: false, message: "Failed register user" });
      }
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: err.message });
    }
};
