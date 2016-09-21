/**
 * Created by danne on 2016/3/30.
 * 网点，门店，分支机构
 */
/**
 * Created by ZhangXiao on 2015/6/11.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/**
 * 网点，门店，分支机构
 * @type {Schema}
 */
var BranchSchema = new Schema({
  id: ObjectId
  , channel: {type: ObjectId, ref: "Channel"}//渠道
  , services: [{type: ObjectId, ref: "ServiceItem"}]//该网点包含的服务项
  , no: {type: String, trim: true, required: true, default: ''}//编号
  , name: {type: String, trim: true, required: true, default: ''}//名称
  , province: {type: ObjectId, ref: 'Province', require: true}
  , city: {type: ObjectId, ref: 'City', require: true}
  , district: {type: ObjectId, ref: 'District', require: true}
  , openTime1: {type: String, default: ''}// 开始营业时间  工作日
  , closeTime1: {type: String, default: ''}// 结束营业时间  工作日
  , openTime2: {type: String, default: ''}// 开始营业时间   周六
  , closeTime2: {type: String, default: ''}// 结束营业时间  周六
  , openTime3: {type: String, default: ''}// 开始营业时间   周日
  , closeTime3: {type: String, default: ''}// 结束营业时间  周日
  , address: {type: String, default: ''}//详细地址
  , logo: {type: String, default: ''} // LOGO
  , images: [{type: String, default: ''}]// 轮播展示图片
  , contact: {type: String, default: ''}//联系人
  , phone: {type: String, default: ''} //电话号码
  , coordinate: [] //经度,纬度  lat, lng
  , mapTcLat: {type: String, default: ''}//腾讯地图经纬度
  , status: {type: String, default: ''} //状态
  , tags: {type: String, default: ''} //标签
  , description: {type: String, default: ''} //详细描述
  , service: [{type: String, default: ''}] //详细描述
  , enabled: {type: Boolean, default: true} //可编辑
  
},{timestamps:{}});
//db.branches.ensureIndex({"coordinate":"2d"},{"background":"true"})

BranchSchema.methods = {};

var Branch = mongoose.model('Branch', BranchSchema, 'branches');
