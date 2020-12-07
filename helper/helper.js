"use strict";

const { Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();
const util = require("util");
const FabricCAServices = require("fabric-ca-client");

// GET CCP:
const getCCP = async (org) => {
  let ccpPath;
  if (org == process.env.ORGWRITER) {
    ccpPath = path.resolve(__dirname, "..", "config", process.env.CONNECTFILEWRITER);
  } else if (org == process.env.ORGREADER) {
    ccpPath = path.resolve(__dirname, "..", "config", process.env.CONNECTFILEREADER);
  } else return null;
  const ccpJSON = fs.readFileSync(ccpPath, "utf8");
  const ccp = JSON.parse(ccpJSON);
  return ccp;
};

// GET CA URL:
const getCaUrl = async (org, ccp) => {
  let caURL;
  if (org == process.env.ORGWRITER) {
    caURL = ccp.certificateAuthorities[process.env.CAWRITER].url;
  } else if (org == process.env.ORGREADER) {
    caURL = ccp.certificateAuthorities[process.env.CAREADER].url;
  } else return null;
  return caURL;
};

// GET WALLET:
const getWalletPath = async (org) => {
  let walletPath;
  if (org == process.env.ORGWRITER) {
    walletPath = path.join(process.cwd(), "./.wallet/writer");
  } else if (org == process.env.ORGREADER) {
    walletPath = path.join(process.cwd(), "./.wallet/reader");
  } else return null;
  return walletPath;
};

// GET AFFILIANTION
const getAffiliantion = async (org) => {
  return org === process.env.ORGWRITER ? process.env.DEPARTMENTWRITER : process.env.DEPARTMENTREADER;
};

// GET REGISTER USER
const getRegisterUser = async (username, userOrg, deviceID) => {
  let ccp = await getCCP(userOrg);
  const caURL = await getCaUrl(userOrg, ccp);
  const ca = new FabricCAServices(caURL);

  const walletPath = await getWalletPath(userOrg);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  console.log(`Wallet path: ${walletPath}`);

  const userIdentity = await wallet.get(username);
  if (userIdentity) {
    console.log(
      `An identity for the user ${username} already exists in the wallet`
    );
    var respone = {
      success: true,
      message: username + " endrolled Successfully",
    };
    return respone;
  }
  const adminId = process.env.ADMINUSERID;

  let adminIdentity = await wallet.get(adminId);
  if (!adminIdentity) {
    console.log(
      `An identity for the admin user '${adminId}' does not exist in the wallet`
    );
    await enrollAdmin(userOrg, ccp);
    adminIdentity = await wallet.get(adminId);
    console.log("Admin Enrolled Successfully");
  }

  // build a user object for authenticating with the CA
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, adminId);
  let secret;
  try {
    secret = await ca.register(
      {
        affiliation: await getAffiliantion(userOrg),
        enrollmentID: username,
        role: "client",
        attrs: [{ name: "deviceID", value: deviceID, ecert: true }],
      },
      adminUser
    );
  } catch (error) {
    return error.message;
  }

  const enrollment = await ca.enroll({
    enrollmentID: username,
    enrollmentSecret: secret,
    attr_reqs: [{ name: "deviceID", optional: false }],
  });
  console.log(enrollment.certificate);
  let x509Identity = {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: userOrg === process.env.ORGWRITER ? process.env.ORGWRITERMSP : process.env.ORGREADERMSP,
    type: "X.509",
  };


  await wallet.put(username, x509Identity);
  console.log(
    `Successfully registered and enrolled admin user ${username} and imported it into the wallet`
  );
  var respone = {
    success: true,
    message: username + " enrolled Successfully",
  };
  return respone;
};

const isUserRegistered = async (username, userOrg) => {
  const walletPath = await getWalletPath(userOrg);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  // console.log(`Wallet path: ${walletPath}`);

  const userIdentity = await wallet.get(username);
  if (userIdentity) {
    console.log(`An identity for the user ${username} exists in the wallet`);
    return true;
  }
  return false;
};

const getCaInfo = async (org, ccp) => {
  let caInfo;
  if (org == process.env.ORGWRITER) {
    caInfo = ccp.certificateAuthorities[process.env.CAWRITER];
  } else if (org == process.env.ORGREADER) {
    caInfo = ccp.certificateAuthorities[process.env.CAREADER];
  } else return null;
  return caInfo;
};

const enrollAdmin = async (org, ccp) => {
  console.log("calling enroll Admin method");

  try {
    const caInfo = await getCaInfo(org, ccp);
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );
    const walletPath = await getWalletPath(org);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // ???
    const adminId = process.env.ADMINUSERID;
    const identity = await wallet.get(adminId);
    if (identity) {
      console.log(
        `An identity for the admin user '${adminId}' doesb exist in the wallet`
      );
      return;
    }

    const enrollment = await ca.enroll({
      enrollmentID: adminId,
      enrollmentSecret: process.env.ADMINPASS,
    });
    // console.log(enrollment);
    let x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: org === process.env.ORGWRITER ? process.env.ORGWRITERMSP : process.env.ORGREADERMSP,
      type: "X.509",
    };

    await wallet.put(adminId, x509Identity);
    console.log(
      `Successfully enrolled admin user ${adminId} and imported it into the wallet`
    );
  } catch (error) {
    console.error(`Failed to enroll admin user "${process.env.ADMINUSERID}": ${error}`);
  }
};

exports.getRegisterUser = getRegisterUser;

module.exports = {
  getCCP: getCCP,
  getWalletPath: getWalletPath,
  getRegisterUser: getRegisterUser,
  isUserRegistered: isUserRegistered,
};
