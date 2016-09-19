/**
 * 长链接转短链接1
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var shortId = require("shortid");
var ObjectId = Schema.ObjectId;

var ShortUrlSchema = new Schema({
  channel: {type: ObjectId, ref: "Channel"},
  wechat: {type: ObjectId, ref: "Wechat"},
  longUrl: {type: String, require: true, default: ""},
  host: {type: String, require: true, default: ""},
  shortUrl: {type: String, require: true, default: shortId.generate},
  expireTime: {type: Date}//失效时间
}, {timestamps: {}});

/**
 * 长链接转短链接
 * @param callback
 */
ShortUrlSchema.statics.long2ShortUrl = function (data, callback) {
  var url = new ShortUrl(data);
  url.save(function(err, result){
    callback(err, result);
  });
};

/**
 * 根据长链接查询
 * @param longUrl
 * @param callback
 */
ShortUrlSchema.statics.findByLongUrl = function (query, callback) {
  ShortUrl.findOne(query, function(err, result){
    if(err){
      console.log(err);
      callback(null);
    }else{
      callback(result);
    }
  });
}

var ShortUrl = mongoose.model('ShortUrl', ShortUrlSchema, 'shortUrls')
module.exports = ShortUrl;
