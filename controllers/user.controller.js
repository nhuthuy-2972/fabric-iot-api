const jwt = require("jsonwebtoken");
const log4js = require("log4js");
const logger = log4js.getLogger("APP.JS");
const helper = require("../helper/helper");
const constants = require("../config/constans.json");
const { randomBytes } = require('crypto');
const dotenv = require("dotenv");
import { db ,firebase} from '../fbadim/fb-hook'
import { sendmail } from '../mailer/mailer'
dotenv.config();
const getErrorMessage = () => {
    let respone = {
        success: false,
        message: "Some field is missing or Invalid in the request",
    };
    return respone;
};


module.exports.adddevice = async (req, res) => {
    const { uid, name, infoDevice,email } = req.body;
    if (!uid || !name || !infoDevice || !email)  {
        res.json(getErrorMessage());
        return;
    }
    try {
        const { id } = await db
            .collection('device')
            .add({
                ...infoDevice,
                actived : 'no',
                auth : uid,
                email : email,
                refUser : [],
                date: new Date().toLocaleString(),
            })

        const text = `Chào anh tài bđ cho em thêm máy mới nghe hihi!!!\nUID: ${uid}\nDeviceID: ${id}`
        sendmail(name, 'nhuthuy2972@gmail.com', text)
        res.json({
            status: true,
            message: "add device completed"
        })
    } catch (err) {
        console.log("Loi roi : ", err)
        res.status(404).json({
            status: false,
            message: err
        })
    }
}

module.exports.registerEnrollNewUser = async (req, res) => {
    const { deviceID, auth, sensors } = req.body

    if (!auth || !deviceID  || !sensors) {
        res.json(getErrorMessage());
        return;
    }
    const username = randomBytes(20).toString('hex');
    try {
        let response = await helper.getRegisterUser(username, process.env.ORGREADER, deviceID);
        if (response && typeof response !== "string") {
            logger.debug('Successfully registered the username %s for organization %s', username, process.env.ORGREADER);
            const doc = {
                auth: auth,
                deviceID: deviceID,
                bcIdentity: username
            }
            await db.collection('bcAccounts').add(doc);
            await db.collection('device').doc(deviceID).update({
                refUser : firebase.firestore.FieldValue.arrayUnion(auth)
            })
            res.json({ status: true, message: response });
        } else {
            res.json({ success: false, message: response });
        }
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: response });
    }

};


module.exports.getToken = async (req, res) => {
    const { body } = req;
    const { bcIdentity, uid, deviceID } = body;
    logger.debug(
        "Username: " + bcIdentity
    );
    if (!bcIdentity || !uid || !deviceID) {
        res.json(getErrorMessage());
        return;
    }

    let token = jwt.sign(
        {
            exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expresstime),
            userAccount: bcIdentity,
            uid: uid,
            deviceID: deviceID
        },
        process.env.SECRECTJWT
    );
    let isUserRegistered = await helper.isUserRegistered(bcIdentity, process.env.ORGREADER);

    if (isUserRegistered) {
        res.json({
            success: true,
            token : token
        });
    } else {
        // res.json({
        //   success: false,
        //   message: `${username} is not registered with ${orgName} on channel ${channel}`,
        // });
        console.log("loi ne")
        res.error(401).json({
            message: "user does not exist"
        })
    }
};