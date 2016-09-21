/**
 * 商城等会员购物订单
 */

"use strict";
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let OrderSchema = mongoose.Schema({
  channel: {type: ObjectId, ref: 'Channel'},//所属渠道
  store: {type: ObjectId, ref: 'Store'}, //店铺名称,暂时一个渠道只有一个店铺
  no: {type: String, index: true, required: true, default: ''}, //订单号
  member: {type: ObjectId, index: true, ref: 'Member'},//会员用户，非匿名购买
  fullName: {type: String, default: ''}, //购买人姓名
  mobile: {type: String, default: ''}, //手机号码
  total: {type: Number, default: 0}, //总金额
  points: {type: Number, default: 0}, //所得积分
  time: {type: Date, default: new Date},//订单时间
  paymentMethod: {type: String, ref: 'PaymentMethod'}, //支付方式
  payTime: {type: Date},//支付时间
  totalPaid: {type: Number, default: 0}, //支付金额 已付金额，现金支付时金额
  needInvoice: {type: Boolean, default: false},//已开票？
  invoice: {
    type: {type: String, default: ''},//发票类型，公司，个人
    title: {type: String, default: ''}//发票抬头，公司时为公司全称
  },//发票
  products: [{//购买商品明细，每个选项组合有一行记录
    product: {type: String, ref: 'Product'},//商品，不同选项的时候，属于不同商品记录
    model: {type: String, default: ''},//型号，冗余
    name: {type: String, default: ''},//名称，冗余
    quantity: {type: Number, default: 1},//购买数量
    total: {type: Number, default: 0},//合计金额
    options: [{//可选项
      option: {type: String, ref: 'ProductOption'},
      name: {type: String},//选项值名称，冗余
      value: {type: String}//选项值
    }]
  }],
  shipping: {
    address: {type: ObjectId, ref: 'Address'}
  },
  history: {
    status: {type: String, default: ''},//变更后状态
    notify: {type: Boolean, default: false},//是否要通知会员用户
    comment: {type: String, default: ''},//备注
    user: {type: String, ref: 'channelUser'},//处理用户
    dateAdded: {type: Date, default: new Date()}//处理时间
  },//处理记录
  status: {type: String, default: ''}, //订单状态 '01'待支付、'02'已支付、'03'支付失败、'04'使用中、'05'完成、'06'退款
  payStatus: {type: String, default: '21'}, //订单支付状态 '21'未支付、'22'部分支付、'25'全部支付
  deliveryStatus: {type: String, default: '30'} //订单配送状态 '30'未发货、'31'部分发货、'32'全部发货、‘33’无需配送
  //,extraStatus: {type: String, default: '40'} //订单额外支付状态 '40'正常、'41'超额支付、'42'库存不足
  //,afterSale: {type: Boolean, default: false} //是否有退款 false 无，true 已退款
  , isRefuse: {type: Boolean, default: false} //维权申请 false 无 true 有
  , refundStatus: {type: String, default: '50'} //订单退款申请 '50' 无申请、'51' 要求退款、'52' 已退款
}, {timestamps: {}});
let status = [{"code": '01', "name": '待支付'}
  , {"code": '02', "name": '已支付'}
  , {"code": '03', "name": '支付失败'}
  , {"code": '04', "name": '使用中'}
  , {"code": '05', "name": '完成'}
  , {"code": '06', "name": '退款'}];

OrderSchema.methods = {
//获取所有的状态
  getAllStatus: function () {
    return status;
  }
}

var Order = mongoose.model('Order', OrderSchema, 'orders');
module.exports = Order;
