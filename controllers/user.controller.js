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
module.exports.updatePhoneNumber = async (req,res)=>{
    const {uid ,phoneNumber} =req.body
    if (!uid || !phoneNumber)  {
        res.status(403).json(getErrorMessage());
        return;
    }

    try{
        const user = await firebase.auth().updateUser(uid,{phoneNumber : phoneNumber})
        console.log(user)
        res.json({
            status: true,
            message: "Update phone Number success"
        })
    }catch(err){
        console.log(err)
        res.status(403).json({
            status: false,
            message: err.message
        })
    }
}

module.exports.adddevice = async (req, res) => {
    const { uid, name, infoDevice,email } = req.body;
    if (!uid || !name || !infoDevice || !email)  {
        res.status(403).json(getErrorMessage());
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
        // sendmail(name, 'iot.blockchain.2020@gmail.com', text)
        res.json({
            status: true,
            message: "add device completed"
        })
    } catch (err) {
        console.log("Loi roi : ", err)
        res.status(403).json({
            status: false,
            message: err.message
        })
    }
}

module.exports.registerEnrollNewUser = async (req, res) => {
    const { deviceID, sensors,auth} = req.body

    if (!deviceID  || !sensors || !auth) {
        res.status(401).json(getErrorMessage());
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
                bcIdentity: username,
            }
            const docref ={
                auth : auth,
                deviceID : deviceID,
                data_fields : sensors
            }
            await db.collection('fieldRef').add(docref)
            await db.collection('bcAccounts').add(doc);
            await db.collection('device').doc(deviceID).update({
                refUser : firebase.firestore.FieldValue.arrayUnion(auth)
            })
            res.json({ status: true, message: response });
        } else {
            res.status(401).json({ success: false, message: response });
        }
    } catch (err) {
        console.error(err);
        res.status(401).json({ success: false, message: err.message });
    }

};

module.exports.updateSharefield = async (req,res)=>
{
    const {auth,deviceID,sensors} = req.body
    if (!auth || !deviceID || !sensors) {
        res.status(401).json(getErrorMessage());
        return;
    }
    try{

        db.collection('fieldRef').where("auth",'==',auth).where("deviceID","==",deviceID).get().then(doc=>{
            doc.forEach(elem=>{
                console.log(elem.id)
                db.collection('fieldRef').doc(elem.id).update({
                    data_fields : sensors
                })
            })
            res.json({success : true,message : "Update success"})
        }).catch(err=>{res.status(401).json({success : false ,message : err.message})})
    }catch(err)
    {
        res.status(401).json({success : false , message : err.message});
        return;
        console.log(err.message)
    }
}

module.exports.getToken = async (req, res) => {
    const { body } = req;
    const { bcIdentity, uid, deviceID } = body;
    logger.debug(
        "Username: " + bcIdentity
    );
    if (!bcIdentity || !uid || !deviceID) {
        res.status(401).json(getErrorMessage());
        return;
    }
   
    let isUserRegistered = await helper.isUserRegistered(bcIdentity, process.env.ORGREADER);

    if (isUserRegistered) {
        const token = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expresstime),
                bcIdentity: bcIdentity,
                uid: uid,
                deviceID: deviceID
            },
            process.env.SECRECTJWT
        );

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
        res.status(401).json({
            message: "user does not exist"
        })
    }
};

module.exports.getRefUser = async (req,res)=>{
    const {refUsers} = req.body
    logger.debug(
        "Username: " + refUsers
    );
    if (!refUsers) {
        res.status(401).json(getErrorMessage());
        return;
    }

    try{
        const usersid = await refUsers.map(uid=>{
            return {uid : uid}
        })
        const {users} = await firebase.auth().getUsers(usersid)
        // console.log(users)
        
        const usersInfo = await users.map((info) =>{
        //    console.log(info.displayName)
            return {uid :info.uid ,displayName :info.displayName,email :info.email,phoneNumber :info.phoneNumber}
        })
        console.log(usersInfo);
        res.json({
            success : true,
            users : usersInfo
        })
    }catch(err)
    {
        res.status(401).json({
            success : false, message : err.message
        })
    }
}