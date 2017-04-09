/**
 * 微信access token
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var WechatAuthTokenSchema = new Schema({
  openid: {type: String, unique: true, index: true, default: ""},
  access_token: {type: String, default: ""},
  refresh_token: {type: String, default: ""},
  scope: {type: String, default: ""},
  create_at: {type: Date},
  expires_in: {type: Number}
});

WechatAuthTokenSchema.statics.readAuthToken = function (openid, callback) {
  console.log("************ readAuthToken with openid ", openid);
  WechatAuthToken.findOne({
    openid: openid
  }, function (err, token) {
    if (err) return callback(err);
    callback(null, token);
  });
}

WechatAuthTokenSchema.statics.saveAuthToken = function (openid, token, callback) {
  //var sample = {
  //  "access_token": "OezXcEiiBSKSxW0eoylIePi8KMmGVZEUgV_Hw9UYQx0up_IuSS2u6MOL_MCJMbZExd8sPIVq-RPatxNPmDhyUXOV4lwovUpQpZqJnnFhOA7h8pHwR_mNtIuTtmZayYRVtKPM8n0p0WtHPVavszv0dA",
  //  "expires_in": 7200,
  //  "refresh_token": "OezXcEiiBSKSxW0eoylIePi8KMmGVZEUgV_Hw9UYQx0up_IuSS2u6MOL_MCJMbZE34pwjtEKJ4bjQklU3Ntg9iUPjxxgzg561RE1vhJJ6fUMfFzs8JQIUwgKy_FRdmt-hPk8N53RoZvQcMJckxOEwA",
  //  "openid": "o7Brxs4YNv92Sn0Au9R3mrbN5l28",
  //  "scope": "snsapi_userinfo",
  //  "create_at": 1462872454891
  //};
  console.log('********** saveAuthToken token: + ' + JSON.stringify(token));
  WechatAuthToken.findOne({
    openid: openid
  }, function (err, tk) {
    if (err || !tk) {
      var wt = new WechatAuthToken({
        openid: openid,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        scope: token.scope,
        create_at: token.create_at,
        expires_in: token.expires_in
      });
      wt.save(function (err, t) {
        callback(null);
      });
    } else {
      WechatAuthToken.findOneAndUpdate({
        openid: openid
      }, {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        scope: token.scope,
        create_at: token.create_at,
        expires_in: token.expires_in
      }, {
        new: true
      }, function (err, t) {
        callback(null);
      });
    }
  });
}

var WechatAuthToken = mongoose.model('WechatAuthToken', WechatAuthTokenSchema, 'wechatauthtokens')
module.exports = WechatAuthToken;
