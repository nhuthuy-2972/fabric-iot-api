import { response } from "express";
import { db, firebase } from "../fbadim/fb-hook";

const getErrorMessage = () => {
  let respone = {
    success: false,
    message: "Some field is missing or Invalid in the request",
  };
  return respone;
};

module.exports.checkadmin = async (req, res, next) => {
  const token = req.token;
  if (!token) {
    res.status(403).json(getErrorMessage());
    return;
  }

  try {
    const claims = await firebase.auth().verifyIdToken(token);
    if (claims.admin === true) {
      next();
    } else {
      res.status(403).json({
        status: false,
        message: err,
      });
    }
  } catch (err) {
    res.status(403).json({
      status: false,
      message: err,
    });
  }
};
