const jwt = require("jsonwebtoken");
const log4js = require("log4js");
const logger = log4js.getLogger("APP.JS");
const util = require('util');

module.exports.devicemidleware = async (req, res, next) => {
    logger.debug('New req for %s', req.originalUrl);
    if (req.originalUrl.indexOf('/api/auth') >= 0
        || req.originalUrl.indexOf('/api/device') >= 0
        || req.originalUrl.indexOf('"/api/auth/register"') >= 0
        || req.originalUrl.indexOf('"/api/auth/gettoken"') >= 0
        || req.originalUrl.indexOf('"/api/device/pushdata"') >= 0) {
        return next();
    }
    var token = req.token;
    jwt.verify(token, app.get('secret'), (err, decoded) => {
        if (err) {
            console.log(`Error ================:${err}`)
            res.send({
                success: false,
                message: 'Failed to authenticate token. Make sure to include the ' +
                    'token returned from /api/auth call in the authorization header ' +
                    ' as a Bearer token'
            });
            return;
        } else {
            req.decode = decoded;
            // req.orgname = decoded.orgName;
            logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
            return next();
        }
    });
}