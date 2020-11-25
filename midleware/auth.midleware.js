import { db, firebase } from '../fbadim/fb-hook'


module.exports.verifyUser = async (req, res, next) => {
    const token = req.token
    const { deviceID, userAccount } = req.body
    // console.log(token)
    try {
        const { uid, name } = await firebase.auth().verifyIdToken(token);
        const docs = db.collection("ownDevice").where("auth", "==", uid).where('deviceID', "==", deviceID);
        docs.get().then(async (doc) => {
            console.log(doc.size)
            if (doc.size > 0) {
                console.log(userAccount)
                try {
                    const userRecord = await firebase.auth().getUserByEmail(userAccount)
                    console.log(userRecord.uid)
                    req.body.owner = name;
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