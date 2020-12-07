import { db, firebase } from '../fbadim/fb-hook'

const getErrorMessage = () => {
    let respone = {
        success: false,
        message: "Some field is missing or Invalid in the request",
    };
    return respone;
};

module.exports.verifytoken = async (req, res, next) => {
    const token = req.token;
    if (!token) {
        res.json(getErrorMessage());
        return;
    }
    try {
        const { uid, name,email } = await firebase.auth().verifyIdToken(token);
        req.body.uid = uid;
        req.body.email = email;
        req.body.name = name;
        next();
    } catch (err) {
        console.log("Error: " + err);
        res.status(403).json({
            status: false,
            message: err
        })
    }
}


module.exports.verifyOnwer = async (req, res, next) => {
    const token = req.token
    const { deviceID, userAccount } = req.body
    if (!token || !deviceID || !userAccount) {
        res.json(getErrorMessage());
        return;
    }

    console.log("do verify owner")
    try {
        const { uid } = await firebase.auth().verifyIdToken(token);
        const docs = db.collection("device").doc(deviceID)
        
        docs.get().then(async (doc) => {
            if (doc.exists && doc.data().auth === uid && doc.data().actived === 'yes')  {
                console.log(userAccount)
                try {
                    const userRecord = await firebase.auth().getUserByEmail(userAccount)
                    console.log(userRecord.uid)
                    req.body.auth = userRecord.uid;
                    next();
                } catch (err) {
                    console.log("loi ne he", err)
                    res.send({
                        success: false,
                        message: err
                    });
                    return;
                }
            } else {
                console.log("No device");
                res.send({
                    success: false,
                    message: 'device does not exits'
                });
                return;
            }
        })

    } catch (err) {
        console.log("loi ne", err)
        res.send({
            success: false,
            message: err
        });
        return;
    }

}

module.exports.ownerBCUser = async (req, res, next) => {
    const token = req.token
    const { bcIdentity, deviceID } = req.body
    if (!token || !deviceID || !bcIdentity) {
        res.json(getErrorMessage());
        return;
    }

    try {
        const { uid } = await firebase.auth().verifyIdToken(token);
        const docs = db.collection('bcAccounts').where("auth", "==", uid).where('bcIdentity', "==", bcIdentity).where('deviceID', "==", deviceID);
        docs.get().then(async (doc) => {
            console.log(doc.size)
            if (doc.size > 0) {
                req.body.uid = uid;
                next();
            } else {
                res.send({
                    success: false,
                    message: `${bcIdentity} does not exist`
                });
                return;
            }
        })
    } catch (err) {
        console.log("loi ne", err)
        res.send({
            success: false,
            message: err
        });
        return;
    }
}


// module.exports.ownerBCUser = async (req, res, next) => {
//     const token = req.token
//     const { userAccount, deviceType, deviceID } = req.body
//     const colectionName = deviceType === 'own' ? 'ownDevice' : 'refDevices';
//     if (!token || !deviceID || !userAccount || !deviceType) {
//         res.json(getErrorMessage());
//         return;
//     }

//     try {
//         const { uid } = await firebase.auth().verifyIdToken(token);
//         const docs = db.collection(colectionName).where("auth", "==", uid).where('bcUser', "==", userAccount).where('deviceID', "==", deviceID);
//         docs.get().then(async (doc) => {
//             console.log(doc.size)
//             if (doc.size > 0) {
//                 req.body.uid = uid;
//                 next();
//             } else {
//                 res.send({
//                     success: false,
//                     message: `${userAccount} does not exist`
//                 });
//                 return;
//             }
//         })
//     } catch (err) {
//         console.log("loi ne", err)
//         res.send({
//             success: false,
//             message: err
//         });
//         return;
//     }
// }