/**
 * Created by danne on 2016/3/30.
 * 微信回复信息配置
 */
/**
 * Created by ZhangXiao on 2015/6/11.
 * 微信二维码
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var QrCodeSchema = new Schema({
   sceneName: {type: String, required: true, default: ""}   // 场景名称
  , keyWord: {type: String, required: true, default: ""}   // 关键字
  , type: {type: String, required: true, default: ""}   // 关键字类型 1:临时二维码 2:永久二维码
  , expireSeconds: {type: Number}   // 过期时间(单位:秒)
  , ticket: [] //二维码ticket,临时二维码可能会延时，产生新的二维码
  , url: {type: String} //二维码 url
  , expiresTime: {type: Date} //到期时间
  , sceneStr: {type: String} //场景值
  , appid: {type: String}
}, {timestamps: {}});
//db.branches.ensureIndex({"coordinate":"2d"},{"background":"true"})

QrCodeSchema.methods = {};

var QrCodeSchema = mongoose.model('QrCode', QrCodeSchema, 'qrcodes');
