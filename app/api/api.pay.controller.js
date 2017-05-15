/**
 * Created by xiao3612736 on 2016/9/20.
 */
var mongoose = require('mongoose'),
  ObjectId = mongoose.Schema.ObjectId,
  PaymentMethod = mongoose.model('PaymentMethod'),
  Payment = mongoose.model('Payment'),
  Order = mongoose.model('Order'),
  Setting = mongoose.model('Setting'),
  OrderPayLogs = mongoose.model('OrderPayLogs')

var payUtil = require('../../util/ccb/payUtil');
var payUtil12 = require('../../util/ccb/payUtil1.2');
var payUtil20 = require('../../util/ccb/payUtil2.0');
var crypto = require('crypto')
var Payment = require('wechat-pay').Payment;
var fs = require('fs')
var config = require('../../config/config')
var httpUtil = require('../../util/httpUtil');

var _ = require('lodash');
var net = require('net')

/**
 * 获取支付链接
 * @param orderId 订单号
 * @param ccbwebview 浏览器类型，用于建行支付1.2版本时区分android和ios浏览器
 * @param paymentId 渠道支付参数
 * @param cb
 * @returns {*}
 */
exports.sendPay = function (orderId, paymentId, ccbwebview, ip, cb) {
  if(!orderId) {
    return cb({ 'success': '0', 'msg': '订单不存在' });
  }
  if(!paymentId) {
    return cb({ 'success': '0', 'msg': '支付失败，缺少渠道信息' });
  }
  //如果有支付方式，使用支付方式
  if(paymentId) {
    Payment.findById(paymentId).populate("certificate").exec((e, payment) => {
      if(e || !payment) {
        return cb({ 'success': '0', 'msg': '支付失败,支付参数不存在' });
      }
      processPayment(orderId, payment, ccbwebview, ip, function (data) {
        cb(data);
      })
    })
  } else {
    //找渠道下的默认支付方式
    Payment.findOne({ default: true, enable: true }).populate("certificate").exec((e, payment) => {
      if(e || !payment) {
        return cb({ 'success': '0', 'msg': '支付失败,渠道下未配置默认支付参数' });
      }
      processPayment(orderId, payment, ccbwebview, ip, function (data) {
        cb(data);
      })
    })
  }
}

/**
 * 按支付方式处理不同支付请求
 * @param orderId
 * @param payment
 * @param ccbwebview
 * @param cb
 * @returns {*}
 */
function processPayment(orderId, payment, ccbwebview, ip, cb) {
  var name = payment.name;
  //记录订单关联的支付方式,并记录订单状态正在支付
  Order.findOneAndUpdate({ "_id": orderId }, { "payment": payment._id, "paying": true }, (e, o) => {});
  if(name.indexOf("微信") >= 0) {
    wxPay(orderId, payment, ip, (data) => {
      cb(data)
    })
  } else if(name.indexOf("建行") >= 0) {
    var wapver = getWapver(payment);
    if(wapver == '1.2') {
      ccbPay_1_2(orderId, payment, ccbwebview, function (data) {
        cb(data)
      })
    } else if(wapver == '2.0') {
      ccbPay_2_0(orderId, payment, function (data) {
        cb(data)
      })
    } else {
      return cb({ 'success': '0', 'msg': '不支持建行' + wapver + '版本支付方式' });
    }
  } else {
    return cb({ 'success': '0', 'msg': '暂不支持该种支付方式' });
  }
}

function wxPay(orderId, payment, ip, cb) {
  Order.findOne({ "_id": orderId, "status": "01", paid: false }).populate("member").exec(function (err, order) {
    if(err || order == null) {
      return cb({ 'success': '0', 'msg': '未找到订单' });
    }
    var initConfig = {};
    payment.params.forEach(function (p) {
      if(p.paramName == 'appId') {
        initConfig.appId = p.paramValue;
      } else if(p.paramName == 'partnerKey') {
        initConfig.partnerKey = p.paramValue;
      } else if(p.paramName == 'mchId') {
        initConfig.mchId = p.paramValue;
      } else if(p.paramName == 'notifyUrl') {
        initConfig.notifyUrl = p.paramValue;
      }
    })
    if(!payment.certificate) {
      return cb({ 'success': '0', 'msg': '未找到支付证书' });
    }
    initConfig.pfx = fs.readFileSync(config.root + "/public" + payment.certificate.url);
    var payment = new Payment(initConfig);
    //封装order信息
    if(!order.member || !order.member.openid) {
      return cb({ 'success': '0', 'msg': '未找到粉丝信息' });
    }
    var now = Date.now();
    var openid = order.member.openid;
    //openid = 'o9VAcswKVW9MguAGyOZQcVGuiJ1c';
    var wxOrder = {
      //订单内容
      body: order.products[0].name, //商品描述
      attach: "{\"id\":\"" + order._id + "\"}", //辅助信息
      out_trade_no: now,
      total_fee: order.total * 100, //单位是分，不能有小数点
      spbill_create_ip: ip,
      openid: openid,
      trade_type: 'JSAPI'
    };
    //获取微信支付参数
    payment.getBrandWCPayRequestParams(wxOrder, function (err, payargs) {
      if(err) {
        console.log(err)
        return cb({ 'success': '0', 'msg': '发起微信支付失败' });
      }
      Order.findOneAndUpdate({ "_id": order._id }, { "wxOrderNo": now }, (e, o) => { console.log('update order wxOrderNo') })
      return cb({ 'success': '1', 'payargs': payargs });
    });
  });
}

/**
 * 获取建行支付版本号
 * @param payment
 */
function getWapver(payment) {
  var wapver = '';
  payment.params.forEach(function (p) {
    if(p.paramName == 'WAPVER') {
      wapver = p.paramValue;
      return;
    }
  })
  return wapver;
}

/**
 * 建行支付1.2版本
 * @param orderId
 * @param payment
 * @param ccbwebview
 * @param cb
 */
function ccbPay_1_2(orderId, payment, ccbwebview, cb) {
  Order.findOne({ "_id": orderId, "status": "01", paid: false }, function (err, order) {
    if(err || order == null) {
      return cb({ 'success': '0', 'msg': '未找到订单' });
    }
    var proName = '';
    if(order.products && order.products.length > 0) {
      proName = order.products[0].name;
    }
    var orderInfo = {
      ORDERID: order.no, //订单编号
      PAYMENT: order.total, //金额
      REGINFO: "", //客户注册信息
      PROINFO: proName, //商品信息
      REMARK1: order.mobile, //备注1 手机号
      REMARK2: '' //备注2 商品名称
    };
    console.log('order:', orderInfo)
    //从支付配置参数中获取参数信息
    var config = {};
    payment.params.forEach(function (p) {
      if(p.paramName == 'host') {
        config.host = p.paramValue;
      } else if(p.paramName == 'MERCHANTID') {
        config.MERCHANTID = p.paramValue;
      } else if(p.paramName == 'POSID') {
        config.POSID = p.paramValue;
      } else if(p.paramName == 'BRANCHID') {
        config.BRANCHID = p.paramValue;
      } else if(p.paramName == 'sign') {
        config.sign = p.paramValue;
      } else if(p.paramName == 'CURCODE') {
        config.CURCODE = p.paramValue;
      } else if(p.paramName == 'TXCODE') {
        config.TXCODE = p.paramValue;
        if(ccbwebview) {
          config.TXCODE = "SP7010";
        }
      } else if(p.paramName == 'TYPE') {
        config.TYPE = p.paramValue;
      } else if(p.paramName == 'PUB') {
        config.PUB = p.paramValue;
      }
    })
    console.log("config:", config);

    //如果是建行浏览器打开，使用建行APP支付，TXCODE = 'SP7010';
    if(ccbwebview) {
      var str = config.TXCODE + config.MERCHANTID + orderInfo.ORDERID + orderInfo.PAYMENT;
      var magic = crypto.createHash('md5').update(str).digest('hex');

      var js = '<script language="JavaScript">';
      if(ccbwebview.indexOf('iPhone OS') > -1) {
        js += 'function MBC_PAY(){  window.location="/mbcpay.b2c ";}function MBC_PAYINFO(){  var orderinfo ="TXCODE="+document.getElementById("TXCODE").value+","+"WAPVER="+document.getElementById("WAPVER").value+","+	  "MERCHANTID="+document.getElementById("MERCHANTID").value+","+	  "ORDERID="+document.getElementById("ORDERID").value+","+	  "PAYMENT="+document.getElementById("PAYMENT").value+","+	  "MAGIC="+document.getElementById("MAGIC").value+","+	  "BRANCHID="+document.getElementById("BRANCHID").value+","+	  "POSID="+document.getElementById("POSID").value+","+	  "CURCODE="+document.getElementById("CURCODE").value+","+	  "REMARK1="+document.getElementById("REMARK1").value+","+"REMARK2="+document.getElementById("REMARK2").value+","+	  "SUPPORTACCOUNTTYPE="+document.getElementById("SUPPORTACCOUNTTYPE").value;  return "{" + orderinfo + "}";}';
      } else if(ccbwebview.indexOf('Android') > -1) {
        js += 'function MBC_PAY(){var orderinfo ="TXCODE="+document.getElementById("TXCODE").value+","+"WAPVER="+document.getElementById("WAPVER").value+","+"MERCHANTID="+document.getElementById("MERCHANTID").value+","+"ORDERID="+document.getElementById("ORDERID").value+","+"PAYMENT="+document.getElementById("PAYMENT").value+","+"MAGIC="+document.getElementById("MAGIC").value+","+"BRANCHID="+document.getElementById("BRANCHID").value+","+"POSID="+document.getElementById("POSID").value+","+"CURCODE="+document.getElementById("CURCODE").value+","+"REMARK1="+document.getElementById("REMARK1").value+","+"REMARK2="+document.getElementById("REMARK2").value+","+"SUPPORTACCOUNTTYPE="+document.getElementById("SUPPORTACCOUNTTYPE").value;window.mbcpay.b2c(orderinfo);}';
      }
      js += '</script>'

      var html = '<!doctype html>' +
        '<html>' +
        '<head>' +
        '<meta charset="UTF-8">' + js +
        '</head><body>' +
        '<form name="mbcpay_b2c">' +
        '<input type="hidden" name="TXCODE" id="TXCODE" value="SP7010" />' +
        '<input type="hidden" name="WAPVER" id="WAPVER"  value="1.2" />' +
        '<input type="hidden" name="MERCHANTID" id="MERCHANTID" value="' + config.MERCHANTID + '" />' +
        '<input type="hidden" name="ORDERID" id="ORDERID" value="' + orderInfo.ORDERID + '" />' +
        '<input type="hidden" name="PAYMENT" id="PAYMENT" value="' + order.total + '" />' +
        '<input type="hidden" name="MAGIC" id="MAGIC" value="' + magic + '" />' +
        '<input type="hidden" name="BRANCHID" id="BRANCHID" value="' + config.BRANCHID + '" />' +
        '<input type="hidden" name="POSID" id="POSID" value="' + config.POSID + '" />' +
        '<input type="hidden" name="CURCODE" id="CURCODE" value="' + config.CURCODE + '" />' +
        '<input type="hidden" name="REMARK1" id="REMARK1" value="' + orderInfo.REMARK1 + '" />' +
        '<input type="hidden" name="REMARK2" id="REMARK2" value="' + orderInfo.REMARK2 + '" />' +
        '<input type="hidden" name="SUPPORTACCOUNTTYPE" id="SUPPORTACCOUNTTYPE" value="3" />' +
        '</form>' +
        '<input type="button" value="建行手机支付" onclick="MBC_PAY()" />' +
        '</body>' +
        '<script>MBC_PAY()</script>' +
        '</html>';
      return cb({ "success": "2", "html": html });
    }
    //根据config和order生成支付链接
    var url = payUtil12.getPayUrl(orderInfo, config);
    return cb({ "success": "1", "url": url });
  })
}

/**
 * 建行支付2.0版本
 * @param orderId
 * @param payment
 * @param cb
 */
function ccbPay_2_0(orderId, payment, cb) {
  Order.findOne({ "_id": orderId, "status": "01", paid: false }, function (err, order) {
    if(err || order == null) {
      return cb({ 'success': '0', 'msg': '订单不存在' });
    } else {
      //从支付配置参数中获取参数信息
      var config = {};
      payment.params.forEach(function (p) {
        if(p.paramName == 'host') {
          config.host = p.paramValue;
        } else if(p.paramName == 'MERCHANTID') {
          config.MERCHANTID = p.paramValue;
        } else if(p.paramName == 'POSID') {
          config.POSID = p.paramValue;
        } else if(p.paramName == 'BRANCHID') {
          config.BRANCHID = p.paramValue;
        } else if(p.paramName == 'sign') {
          config.sign = p.paramValue;
        } else if(p.paramName == 'CURCODE') {
          config.CURCODE = p.paramValue;
        } else if(p.paramName == 'TXCODE') {
          config.TXCODE = p.paramValue;
        } else if(p.paramName == 'TYPE') {
          config.TYPE = p.paramValue;
        } else if(p.paramName == 'PUB') {
          config.PUB = p.paramValue;
        }
      })
      config.GATEWAY = ''; //默认网关
      //订单参数
      var proInfo = '';
      //if(order.products && order.products.length > 0){
      //  proInfo = order.products[0].name;
      //}
      var orderInfo = {
        ORDERID: order.no,
        PAYMENT: order.total,
        REGINFO: "",
        PROINFO: proInfo,
        REMARK1: order.mobile, //手机号
        REMARK2: ""
      };
      console.log('params======>', config, orderInfo);
      //使用2.0接口
      var url = payUtil20.getPayUrl(orderInfo, config);
      return cb({ "success": "1", "url": url });
    }
  });
}

/**
 * 发起支付，获取支付链接
 * @param orderId 订单ID
 * @param amount 支付金额
 * @param cb
 * 订单号特殊规则
 * 订单支付增加 remark1 remark2
 * ccbwebview 判断是否是在建行APP内支付
 */
exports.genPayUrl = function (orderId, ccbwebview, cb) {
  if(!orderId) {
    return cb({ 'success': '0', 'msg': 'orderId is null' });
  }
  Order.findOne({ "_id": orderId, "status": "01" }, function (err, order) {
    if(err || order == null) {
      return cb({ 'success': '0', 'msg': 'can not find order' });
    }

    var proName = '';
    if(order.products && order.products.length > 0) {
      proName = order.products[0].name;
    }
    var orderInfo = {
      ORDERID: order.no, //订单编号
      PAYMENT: order.total, //金额
      REGINFO: "", //客户注册信息
      PROINFO: proName, //商品信息
      REMARK1: order.mobile, //备注1 手机号
      REMARK2: '' //备注2 商品名称
    };
    console.log('order:', orderInfo)
    //从支付配置参数中获取参数信息
    PaymentMethod.findOne({ "name": "建行支付", "enable": "01" }, function (e, payment) {
      if(e || !payment) {
        return cb({ 'success': '0', 'msg': 'can not find pay arguments' });
      }
      var config = {};
      payment.params.forEach(function (p) {
        if(p.paramName == 'host') {
          config.host = p.paramValue;
        } else if(p.paramName == 'MERCHANTID') {
          config.MERCHANTID = p.paramValue;
        } else if(p.paramName == 'POSID') {
          config.POSID = p.paramValue;
        } else if(p.paramName == 'BRANCHID') {
          config.BRANCHID = p.paramValue;
        } else if(p.paramName == 'sign') {
          config.sign = p.paramValue;
        } else if(p.paramName == 'CURCODE') {
          config.CURCODE = p.paramValue;
        } else if(p.paramName == 'TXCODE') {
          config.TXCODE = p.paramValue;
          if(ccbwebview) {
            config.TXCODE = "SP7010";
          }
        } else if(p.paramName == 'TYPE') {
          config.TYPE = p.paramValue;
        } else if(p.paramName == 'PUB') {
          config.PUB = p.paramValue;
        }
      })
      console.log("config:", config);

      //如果是建行浏览器打开，使用建行APP支付，TXCODE = 'SP7010';
      if(ccbwebview) {
        var str = config.TXCODE + config.MERCHANTID + orderInfo.ORDERID + orderInfo.PAYMENT;
        var magic = crypto.createHash('md5').update(str).digest('hex');

        var js = '<script language="JavaScript">';
        if(ccbwebview.indexOf('iPhone OS') > -1) {
          //js += 'function MBC_PAY(){window.location="/mbcpay.b2c";}';
          //js += 'function MBC_PAYINFO(){var orderinfo ="TXCODE="+mbcpay_b2c.TXCODE.value+","+"WAPVER="+mbcpay_b2c.WAPVER.value+","+"MERCHANTID="+mbcpay_b2c.MERCHANTID.value+","+"ORDERID="+mbcpay_b2c.ORDERID.value+","+"PAYMENT="+mbcpay_b2c.PAYMENT.value+","+"MAGIC="+mbcpay_b2c.MAGIC.value+","+"BRANCHID="+mbcpay_b2c.BRANCHID.value+","+"POSID="+mbcpay_b2c.POSID.value+","+"CURCODE="+mbcpay_b2c.CURCODE.value+","+"REMARK1="+mbcpay_b2c.REMARK1.value+","+"REMARK2="+mbcpay_b2c.REMARK2.value+","+"SUPPORTACCOUNTTYPE="+mbcpay_b2c.SUPPORTACCOUNTTYPE.value;return "{"+orderinfo+"}";}';
          //js += 'function MBC_PAY(){  window.location="/mbcpay.b2c ";}function MBC_PAYINFO(){  var orderinfo ="TXCODE="+mbcpay_b2c.TXCODE.value+","+"WAPVER="+mbcpay_b2c.WAPVER.value+","+	  "MERCHANTID="+mbcpay_b2c.MERCHANTID.value+","+	  "ORDERID="+mbcpay_b2c.ORDERID.value+","+	  "PAYMENT="+mbcpay_b2c.PAYMENT.value+","+	  "MAGIC="+mbcpay_b2c.MAGIC.value+","+	  "BRANCHID="+mbcpay_b2c.BRANCHID.value+","+	  "POSID="+mbcpay_b2c.POSID.value+","+	  "CURCODE="+mbcpay_b2c.CURCODE.value+","+	  "REMARK1="+mbcpay_b2c.REMARK1.value+","+"REMARK2="+mbcpay_b2c.REMARK2.value+","+	  "SUPPORTACCOUNTTYPE="+mbcpay_b2c.SUPPORTACCOUNTTYPE.value;  return "{" + orderinfo + "}";}';
          js += 'function MBC_PAY(){  window.location="/mbcpay.b2c ";}function MBC_PAYINFO(){  var orderinfo ="TXCODE="+document.getElementById("TXCODE").value+","+"WAPVER="+document.getElementById("WAPVER").value+","+	  "MERCHANTID="+document.getElementById("MERCHANTID").value+","+	  "ORDERID="+document.getElementById("ORDERID").value+","+	  "PAYMENT="+document.getElementById("PAYMENT").value+","+	  "MAGIC="+document.getElementById("MAGIC").value+","+	  "BRANCHID="+document.getElementById("BRANCHID").value+","+	  "POSID="+document.getElementById("POSID").value+","+	  "CURCODE="+document.getElementById("CURCODE").value+","+	  "REMARK1="+document.getElementById("REMARK1").value+","+"REMARK2="+document.getElementById("REMARK2").value+","+	  "SUPPORTACCOUNTTYPE="+document.getElementById("SUPPORTACCOUNTTYPE").value;  return "{" + orderinfo + "}";}';
        } else if(ccbwebview.indexOf('Android') > -1) {
          //js += 'function MBC_PAY(){var orderinfo ="TXCODE="+mbcpay_b2c.TXCODE.value+","+"WAPVER="+mbcpay_b2c.WAPVER.value+","+"MERCHANTID="+mbcpay_b2c.MERCHANTID.value+","+"ORDERID="+mbcpay_b2c.ORDERID.value+","+"PAYMENT="+mbcpay_b2c.PAYMENT.value+","+"MAGIC="+mbcpay_b2c.MAGIC.value+","+"BRANCHID="+mbcpay_b2c.BRANCHID.value+","+"CURCODE="+mbcpay_b2c.CURCODE.value+","+"REMARK1="+mbcpay_b2c.REMARK1.value+","+"REMARK2="+mbcpay_b2c.REMARK2.value+","+"SUPPORTACCOUNTTYPE="+mbcpay_b2c.SUPPORTACCOUNTTYPE.value;window.mbcpay.b2c(orderinfo);}';
          js += 'function MBC_PAY(){var orderinfo ="TXCODE="+document.getElementById("TXCODE").value+","+"WAPVER="+document.getElementById("WAPVER").value+","+"MERCHANTID="+document.getElementById("MERCHANTID").value+","+"ORDERID="+document.getElementById("ORDERID").value+","+"PAYMENT="+document.getElementById("PAYMENT").value+","+"MAGIC="+document.getElementById("MAGIC").value+","+"BRANCHID="+document.getElementById("BRANCHID").value+","+"POSID="+document.getElementById("POSID").value+","+"CURCODE="+document.getElementById("CURCODE").value+","+"REMARK1="+document.getElementById("REMARK1").value+","+"REMARK2="+document.getElementById("REMARK2").value+","+"SUPPORTACCOUNTTYPE="+document.getElementById("SUPPORTACCOUNTTYPE").value;window.mbcpay.b2c(orderinfo);}';
        }
        js += '</script>'

        var html = '<!doctype html>' +
          '<html>' +
          '<head>' +
          '<meta charset="UTF-8">' + js +
          '</head><body>' +
          '<form name="mbcpay_b2c">' +
          '<input type="hidden" name="TXCODE" id="TXCODE" value="SP7010" />' +
          '<input type="hidden" name="WAPVER" id="WAPVER"  value="1.2" />' +
          '<input type="hidden" name="MERCHANTID" id="MERCHANTID" value="' + config.MERCHANTID + '" />' +
          '<input type="hidden" name="ORDERID" id="ORDERID" value="' + orderInfo.ORDERID + '" />' +
          '<input type="hidden" name="PAYMENT" id="PAYMENT" value="' + order.total + '" />' +
          '<input type="hidden" name="MAGIC" id="MAGIC" value="' + magic + '" />' +
          '<input type="hidden" name="BRANCHID" id="BRANCHID" value="' + config.BRANCHID + '" />' +
          '<input type="hidden" name="POSID" id="POSID" value="' + config.POSID + '" />' +
          '<input type="hidden" name="CURCODE" id="CURCODE" value="' + config.CURCODE + '" />' +
          '<input type="hidden" name="REMARK1" id="REMARK1" value="' + orderInfo.REMARK1 + '" />' +
          '<input type="hidden" name="REMARK2" id="REMARK2" value="' + orderInfo.REMARK2 + '" />' +
          '<input type="hidden" name="SUPPORTACCOUNTTYPE" id="SUPPORTACCOUNTTYPE" value="3" />' +
          '</form>' +
          '<input type="button" value="建行手机支付" onclick="MBC_PAY()" />' +
          '</body>' +
          '<script>MBC_PAY()</script>' +
          '</html>';
        return cb({ "success": "2", "html": html });
      }

      //根据config和order生成支付链接
      var url = payUtil12.getPayUrl(orderInfo, config);
      return cb({ "success": "1", "url": url });
    })
  })
}

/**
 * 发起支付，获取支付链接，2.0版本
 * @param orderId
 * @param cb
 */
exports.genPayUrl2 = function (orderId, cb) {
  if(!orderId) {
    return cb({ 'success': '0', 'msg': '订单号不能为空' });
  }
  Order.findOne({ "_id": orderId, "status": "01" }, function (err, order) {
    if(err || order == null) {
      return cb({ 'success': '0', 'msg': '订单不存在' });
    } else {
      //从支付配置参数中获取参数信息
      Payment.findOne({ "name": "建行支付", "enable": true }, function (e, payment) {
        if(e || !payment) {
          return cb({ 'success': '0', 'msg': '未找到相关支付参数' });
        }
        var config = {};
        payment.params.forEach(function (p) {
          if(p.paramName == 'host') {
            config.host = p.paramValue;
          } else if(p.paramName == 'MERCHANTID') {
            config.MERCHANTID = p.paramValue;
          } else if(p.paramName == 'POSID') {
            config.POSID = p.paramValue;
          } else if(p.paramName == 'BRANCHID') {
            config.BRANCHID = p.paramValue;
          } else if(p.paramName == 'sign') {
            config.sign = p.paramValue;
          } else if(p.paramName == 'CURCODE') {
            config.CURCODE = p.paramValue;
          } else if(p.paramName == 'TXCODE') {
            config.TXCODE = p.paramValue;
          } else if(p.paramName == 'TYPE') {
            config.TYPE = p.paramValue;
          } else if(p.paramName == 'PUB') {
            config.PUB = p.paramValue;
          }
        })
        config.GATEWAY = ''; //默认网关
        //订单参数
        var proInfo = '';
        //if(order.products && order.products.length > 0){
        //  proInfo = order.products[0].name;
        //}
        var orderInfo = {
          ORDERID: order.no,
          PAYMENT: order.total,
          REGINFO: "",
          PROINFO: proInfo,
          REMARK1: order.mobile, //手机号
          REMARK2: ""
        };
        console.log('params======>', config, orderInfo);
        //使用2.0接口
        var url = payUtil20.getPayUrl(orderInfo, config);
        return cb({ "success": "1", "url": url });
      });
    }
  });
}

/**
 * 发起支付，获取支付链接二维码
 * @param orderId
 * @param cb
 */
exports.genPayUrlQrCode = function (orderId, cb) {
  if(!orderId) {
    return cb({ 'success': '0', 'msg': 'orderId is null' });
  }
  Order.findOne({ "_id": orderId, "status": "01" }, function (err, order) {
    if(err || order == null) {
      return cb({ 'success': '0', 'msg': 'can not find order' });
    } else {
      //从支付配置参数中获取参数信息
      Payment.findOne({ "name": "建行支付", "enable": true }, function (e, payment) {
        if(e || !payment) {
          return cb({ 'success': '0', 'msg': 'can not find pay arguments' });
        }
        var config = {};
        payment.params.forEach(function (p) {
          if(p.paramName == 'host') {
            config.host = p.paramValue;
          } else if(p.paramName == 'MERCHANTID') {
            config.MERCHANTID = p.paramValue;
          } else if(p.paramName == 'POSID') {
            config.POSID = p.paramValue;
          } else if(p.paramName == 'BRANCHID') {
            config.BRANCHID = p.paramValue;
          } else if(p.paramName == 'sign') {
            config.sign = p.paramValue;
          } else if(p.paramName == 'CURCODE') {
            config.CURCODE = p.paramValue;
          } else if(p.paramName == 'TXCODE') {
            config.TXCODE = p.paramValue;
          } else if(p.paramName == 'TYPE') {
            config.TYPE = p.paramValue;
          } else if(p.paramName == 'PUB') {
            config.PUB = p.paramValue;
          }
        })
        //订单参数
        var proInfo = '';
        if(order.products && order.products.length > 0) proInfo = order.products[0].name;
        var orderInfo = {
          ORDERID: order.no,
          PAYMENT: order.total,
          REGINFO: "",
          PROINFO: proInfo,
          REMARK1: order.mobile, //手机号
          REMARK2: ""
        };
        console.log('params======>', config, orderInfo);
        //使用2.0接口
        var url = payUtil20.getQrcodePayUrl(orderInfo, config);
        return cb({ "success": "1", "url": url });
      });
    }
  });
}

/**
 * 拦截建行支付回调，分发数据到其他系统
 * @param orderNo 订单号
 * @param data 回调数据
 * @param isFront 是否是页面回调
 * @param res response对象
 */
function redirectOtherSystem(orderNo, data, isFront, orderPayLogs, res) {
  var params = "";
  _(data).each((v, k) => {
    params += "&" + k + "=" + v;
  })
  params = params.substr(1);
  //yn的订单默认地址(WangLei)
  var pageCallback = 'http://ynccb.9cubic.com/api/response/ccbwap.php'; //页面回调
  var payCallback = 'http://ynccb.9cubic.com/api/notify/ccbwap.php'; //后台回调
  if(orderNo && orderNo.substr(0, 4) == 'YNPT') {
    pageCallback = 'http://ynpt.9cubic.com/wap/payment-return.html'; //页面回调
    payCallback = 'http://ynpt.9cubic.com/wap/payment-notify.html'; //后台回调
  } else if(orderNo && orderNo.substr(0, 3) == 'YHG') {
    pageCallback = 'http://www.iyhg.cn/mobile/wap_ccb.php?' + params; //页面回调
    payCallback = 'http://www.iyhg.cn/mobile/wap_ccb.php?' + params; //后台回调
  } else if(orderNo && orderNo.substr(0, 5) == 'CCBTJ') {
    pageCallback = 'http://ccbtj.9cubic.com/mobile/wap_ccb.php?' + params; //页面回调
    payCallback = 'http://ccbtj.9cubic.com/mobile/wap_ccb.php?' + params; //后台回调
  } else if(orderNo && orderNo.substr(0, 4) == 'JSPT') {
    pageCallback = 'http://jshd.9cubic.com/wap/payment-return.html'; //页面回调
    payCallback = 'http://jshd.9cubic.com/wap/payment-notify.html'; //后台回调
  } else if(orderNo && orderNo.substr(0, 4) == 'MTPT') {
    pageCallback = 'http://mtpt.9cubic.com/wap/payment-return.html'; //页面回调
    payCallback = 'http://mtpt.9cubic.com/wap/payment-notify.html'; //后台回调
  } else if(orderNo && orderNo.substr(0, 5) == 'DZPTJ') {
    pageCallback = 'http://dzp.9cubic.com/mobile/wap_ccb.php?' + params; //页面回调
    payCallback = 'http://dzp.9cubic.com/mobile/wap_ccb.php?' + params; //后台回调
  } else if(orderNo && orderNo.substr(0, 7) == 'S2CCBTJ') {
    pageCallback = 'http://ccbtjs2.9cubic.com/mobile/wap_ccb.php?' + params; //页面回调
    payCallback = 'http://ccbtjs2.9cubic.com/mobile/wap_ccb.php?' + params; //后台回调
  } else if(orderNo && orderNo.substr(0, 4) == 'NTPT') {
    pageCallback = 'http://ntpt.9cubic.com/wap/payment-return.html'; //页面回调
    payCallback = 'http://ntpt.9cubic.com/wap/payment-notify.html'; //后台回调
  } else if(orderNo && orderNo.substr(0, 6) == 'NTTEST') {
    pageCallback = 'http://jspt.9cubic.com/wap/payment-return.html'; //页面回调
    payCallback = 'http://jspt.9cubic.com/wap/payment-notify.html'; //后台回调
  }
  if(orderNo && (orderNo.substr(0, 2) == 'yn' || orderNo.substr(0, 4) == 'YNPT')) {
    console.log('#########################################################')
    console.log(orderNo)
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
    OrderPayLogs.findAndSaveByOrderId(orderNo, orderPayLogs, (e, o) => {});
    if(isFront) {
      httpUtil.post(pageCallback, data, (data) => {
        console.log('#####################send page callback to url')
      })
    } else {
      httpUtil.post(payCallback, data, (data) => {
        console.log('*********************send pay callback to url')
      })
    }
    return true;
  } else if(orderNo && orderNo.substr(0, 3) == 'YHG' || orderNo.substr(0, 5) == 'CCBTJ' ||
    orderNo.substr(0, 4) == 'JSPT' || orderNo.substr(0, 4) == 'MTPT' ||
    orderNo.substr(0, 5) == 'DZPTJ' || orderNo.substr(0, 7) == 'S2CCBTJ' ||
    orderNo.substr(0, 4) == 'NTPT' || orderNo.substr(0, 6) == 'NTTEST') {
    OrderPayLogs.findAndSaveByOrderId(orderNo, orderPayLogs, (e, o) => {});
    if(isFront) {
      // res.writeHead(302, {'Location': pageCallback});
      // res.redirect(pageCallback)

      res.render('re_send', { data: data, url: pageCallback });
    } else {
      // res.writeHead(302, {'Location': payCallback});
      // res.redirect(payCallback)

      httpUtil.post(payCallback, data, (data) => {
        console.log('*********************send pay callback to url')
      });
      // res.render('re_send', {data: data, url: payCallback});
    }
    // res.end();
    return true;
  } else {
    return false;
  }
}

/**
 * 支付完成回调
 * @param req
 * @param res
 */
exports.pageCallback = function (req, res) {
  // if(req.query.ORDERID && req.query.ORDERID.substr(0, 4) == 'MTPT'){
  //
  // }
  var orderData = req.query;
  if(!orderData.ORDERID) {
    orderData = req.body;
  }
  console.log("网页回调传入参数:=====================>", orderData);

  var ORDERID = orderData.ORDERID; //订单号
  console.log('cookies===========================>', ORDERID, !ORDERID)
  if(!ORDERID) {
    //从cookie中取值，看是否设置了回调url
    var cookies = req.headers.cookie.split(';');
    if(cookies && cookies.length > 0 && cookies[0].substr(0, 8) == 'callback') {
      var url = cookies[0].substr(9);
      console.log('************redirect url for cookie**************', url)
      res.redirect(url);
      return;
    }

    console.log('render url===========================>', __dirname + '/../views/error')
    res.render(__dirname + '/../views/error', { error: { title: '参数不完整,支付失败' } });
    return;
  }

  var orderPayLogs = orderData;
  //支付反馈转发到其他系统
  var flag = redirectOtherSystem(ORDERID, orderData, true, orderPayLogs, res);
  if(flag) {
    if(ORDERID.substr(0, 2) == 'yn') {
      res.redirect('http://ynccb.9cubic.com/index.php?m=default&c=Respond&a=index');
    } else if(ORDERID.substr(0, 4) == 'YNPT') {
      res.redirect('http://ynpt.9cubic.com/wap/payment-result.html?orderId=' + ORDERID);
    }
    return;
  }
  //if(typeof ORDERID == 'object' && ORDERID.length > 0){
  //  ORDERID = ORDERID[0];//接收到的订单号是个数组
  //}
  var mobile = orderData.REMARK1; //备注1 存用户手机号
  var result = orderData.SUCCESS; //交易结果标志位
  if(result && result == 'Y') {

    //增加支付完成回调验签验证
    // var params = '';
    // _.each(req.query, (val, key)=>{
    //   params += "&"+key+"="+val;
    // })
    // params = params.substr(1);
    // var client = net.connect({host: 'node3.9cubic.cn', port: 55533},
    //   function() { //'connect' listener
    //     console.log('connected to server!!!');
    //     client.write(params+'\n');
    //   });
    // client.on('data', function(data) {
    //   console.log('receive server data===============>', data.toString());
    //   var datas = data.toString().split('|');
    //   if(datas && data.length == 2){
    //     if(datas[0] == 'Y' && datas[1] == req.query.sign){
    //       //成功
    //     }
    //   }else{
    //     //错误
    //   }
    // });
    // client.on('end', function() {
    //   console.log('disconnected from server');
    // });

    //2.0支付
    Order.findOne({ "no": ORDERID }).exec((err, orderInfo) => {
      if(err || !orderInfo) {
        res.render(__dirname + '../views/error', { error: { title: '无此订单:' + ORDERID } });
      } else {
        orderPayLogs.order = orderInfo._id;
        OrderPayLogs.findAndSaveByOrderId(ORDERID, orderPayLogs, (e, o) => {});

        if(orderInfo.status == '01' && !orderInfo.paid) {
          //如果没有修改状态，修改下支付状态
          Order.findOneAndUpdate({ "_id": orderInfo._id, "status": "01", "paid": false }, { "status": "02", "paid": true, "payTime": new Date() }, (e, o) => {
            confirmOrder(orderInfo); //订单自动确认
            getCoupons(orderInfo); //领券
            console.log('page callback update order status.')
          })
        }
        //返回商户页面
        var phoneBill = 0;
        if(typeof orderInfo.phoneBill !== 'undefined' && orderInfo.phoneBill) {
          phoneBill = 1;
        }
        Setting.findOne({ "key": "context.front" }, (e, setting) => {
          var absBaseUrl = 'http://9cubic.cn/m';
          if(setting) {
            absBaseUrl = setting.value;
          }
          if(orderInfo.no.indexOf('GX') == 0 || orderInfo.no.indexOf('TJ') == 0) {
            return res.redirect(absBaseUrl + '/scan/paySuccess?mobile=' + orderInfo.mobile + '&orderNo=' + orderInfo.no + '&phoneBill=' + phoneBill + '&branch=' + orderInfo.branch);
          } else if(orderInfo.no.indexOf('YYGYN') == 0) {
            return res.redirect(absBaseUrl + '/buyone/paySuccess?mobile=' + orderInfo.mobile + '&orderNo=' + orderInfo.no);
          } else if(orderInfo.no.indexOf('CCB') == 0) {
            return res.redirect(absBaseUrl + '../p/scan/paySuccess');
          }
        })
      }
    })

    //1.2支付
    //Order.findOneAndUpdate({"no": ORDERID, "status": "01", "paid": false}, {"status": "02", "paid": true, "payTime": new Date()}, (e,o)=>{
    //  if(e || !o){
    //    //如果订单号查不到订单，不处理
    //    console.error('无此订单:', ORDERID);
    //    res.send('无此订单:'+ORDERID)
    //  }else{
    //    //TODO 会再次发请求数据过来，此时，订单已被修改，非01状态;需重新查询
    //    Order.findOne({"no": ORDERID}).exec(function(err, order){
    //      var phoneBill = 0;
    //      if(typeof order.phoneBill !== 'undefined' && order.phoneBill) {
    //        phoneBill = 1;
    //      }
    //      //返回商户页面
    //    })
    //  }
    //})
  } else {
    //返回商户页面
    Order.findOne({ "no": ORDERID }).exec(function (err, orderInfo) {
      orderPayLogs.order = orderInfo._id;
      OrderPayLogs.findAndSaveByOrderId(ORDERID, orderPayLogs, (e, o) => {});
      var phoneBill = 0;
      if(typeof orderInfo.phoneBill !== 'undefined' && orderInfo.phoneBill) {
        phoneBill = 1;
      }
      Setting.findOne({ "key": "context.front" }, (e, setting) => {
        var absBaseUrl = 'http://9cubic.cn/m';
        if(setting) {
          absBaseUrl = setting.value;
        }
        if(orderInfo.no.indexOf('GX') == 0) {
          return res.redirect(absBaseUrl + '/scan/payFail?mobile=' + orderInfo.mobile + '&orderNo=' + orderInfo.no + '&phoneBill=' + phoneBill + '&branch=' + orderInfo.branch);
        } else if(orderInfo.no.indexOf('YYGYN') == 0) {
          return res.redirect(absBaseUrl + '/buyone/payFail?mobile=' + orderInfo.mobile + '&orderNo=' + orderInfo.no);
        }
      });
    })
  }
}

/**
 * 支付完成回调
 * @param req
 * @param res
 */
exports.payCallback = function (req, res) {
  // if(req.query.ORDERID && req.query.ORDERID.substr(0, 4) == 'MTPT'){
  //
  // }
  var orderData = req.query;
  if(!orderData.ORDERID) {
    orderData = req.body;
  }
  console.log("后台回调传入参数:===========back============>", orderData);

  var orderPayLogs = orderData;
  //根据订单ID修改订单状态
  var MERCHANTID = orderData.MERCHANTID; //商户编号
  var ORDERID = orderData.ORDERID; //订单号
  if(!ORDERID) {
    res.send('error!')
    return;
  }
  //if(typeof ORDERID == 'object' && ORDERID.length > 0){
  //  ORDERID = ORDERID[0];
  //}
  var PAYMENT = orderData.PAYMENT; //付款金额
  var result = orderData.SUCCESS; //备注1 存用户手机号
  //支付反馈转发到其他系统
  var flag = redirectOtherSystem(ORDERID, orderData, false, orderPayLogs, res);
  if(flag) {
    // res.redirect('http://ynccb.9cubic.com/index.php?m=default&c=Respond&a=index');
    return;
  }
  if(result && result == 'Y') {
    Order.findOneAndUpdate({ "no": ORDERID, "status": "01", "paid": false }, { "status": "02", "paid": true, "payTime": new Date() }, (e, o) => {
      if(o != null) {
        confirmOrder(o); //订单自动确认
        getCoupons(o); //领券
        orderPayLogs.order = o._id;
        OrderPayLogs.findAndSaveByOrderId(ORDERID, orderPayLogs, (e, o) => {});
      }
      console.log('pay back callback update order status.')
    })
    res.end('pay success');
  } else {
    OrderPayLogs.findAndSaveByOrderId(ORDERID, orderPayLogs, (e, o) => {});
    res.end('pay fail');
  }
}

/**
 * 订单自动确认
 * @param order
 */
function confirmOrder(order) {
  if(order && order.autoConfirmed) {
    Order.confirm([order._id], null, (e, o) => {})
  }
}

/**
 * 支付成功后领券
 * @param order
 */
function getCoupons(order) {
  if(order && order.products && order.products[0].isCoupon) {
    Order.getCoupons(order._id, (e, o) => {})
  }
}

/**
 * 支付完成回调(广西行使用，1.2版本支付)
 * @param req
 * @param res
 */
exports.pageCallback1_2 = function (req, res) {
  console.log("网页回调传入参数:=====================>", req.query);
  var ORDERID = req.query.ORDERID; //订单号
  if(!ORDERID) {
    res.render(__dirname + '../views/error', { error: { title: '参数不完整,支付失败' } });
    return;
  }
  if(typeof ORDERID == 'object' && ORDERID.length > 0) {
    ORDERID = ORDERID[0]; //接收到的订单号是个数组
    req.query.ORDERID = ORDERID;
  }
  var orderPayLogs = req.query;
  var mobile = req.query.REMARK1; //备注1 存用户手机号
  var result = req.query.SUCCESS; //交易结果标志位
  if(result && result == 'Y') {
    //2.0支付
    //Order.findOne({"no": ORDERID}).exec((err, orderInfo)=>{
    //  if(err || !orderInfo){
    //    res.render(__dirname + '../views/error', {error: {title: '无此订单:' + ORDERID}});
    //  }else{
    //    orderPayLogs.order = orderInfo._id;
    //    OrderPayLogs.findAndSaveByOrderId(ORDERID, orderPayLogs, (e, o)=>{});
    //
    //    if(orderInfo.status == '01' && !orderInfo.paid){
    //      //如果没有修改状态，修改下支付状态
    //      Order.findOneAndUpdate({"_id": orderInfo._id, "status": "01", "paid": false}, {"status": "02", "paid": true, "payTime": new Date()}, (e,o)=>{
    //        console.log('page callback update order status.')
    //      })
    //    }
    //    //返回商户页面
    //    var phoneBill = 0;
    //    if(typeof orderInfo.phoneBill !== 'undefined' && orderInfo.phoneBill) {
    //      phoneBill = 1;
    //    }
    //  }
    //})

    //1.2支付
    Order.findOneAndUpdate({ "no": ORDERID, "status": "01", "paid": false }, { "status": "02", "paid": true, "payTime": new Date() }, (e, o) => {
      if(e || !o) {
        //返回商户页面
        Order.findOne({ "no": ORDERID }).exec(function (err, orderInfo) {
          if(err || !orderInfo) {
            //如果订单号查不到订单，不处理
            console.error('无此订单:', ORDERID);
            res.send('无此订单:' + ORDERID)
          } else {
            confirmOrder(orderInfo); //订单自动确认
            getCoupons(orderInfo); //领券
            orderPayLogs.order = orderInfo._id;
            OrderPayLogs.findAndSaveByOrderId(ORDERID, orderPayLogs, (e, o) => {});
            var phoneBill = 0;
            if(typeof orderInfo.phoneBill !== 'undefined' && orderInfo.phoneBill) {
              phoneBill = 1;
            }
            res.redirect(req.absBaseUrl + '../../../../../scan/paySuccess?mobile=' + orderInfo.mobile + '&orderNo=' + orderInfo.no + '&phoneBill=' + phoneBill + '&branch=' + orderInfo.branch);
          }
        })
      } else {
        orderPayLogs.order = o._id;
        OrderPayLogs.findAndSaveByOrderId(ORDERID, orderPayLogs, (e, o) => {});
        //TODO 会再次发请求数据过来，此时，订单已被修改，非01状态;需重新查询
        Order.findOne({ "no": ORDERID }).exec(function (err, order) {
          var phoneBill = 0;
          if(typeof order.phoneBill !== 'undefined' && order.phoneBill) {
            phoneBill = 1;
          }
          //返回商户页面
          res.redirect(req.absBaseUrl + '../../../../../scan/paySuccess?mobile=' + order.mobile + '&orderNo=' + order.no + '&phoneBill=' + phoneBill + '&branch=' + order.branch);
        })
      }
    })
  } else {
    //返回商户页面
    Order.findOne({ "no": ORDERID }).exec(function (err, orderInfo) {
      orderPayLogs.order = orderInfo._id;

      OrderPayLogs.findAndSaveByOrderId(ORDERID, orderPayLogs, (e, o) => {});
      var phoneBill = 0;
      if(typeof orderInfo.phoneBill !== 'undefined' && orderInfo.phoneBill) {
        phoneBill = 1;
      }
      res.redirect(req.absBaseUrl + '../../../../../scan/payFail?mobile=' + orderInfo.mobile + '&orderNo=' + orderInfo.no + '&phoneBill=' + phoneBill + '&branch=' + orderInfo.branch);
    })
  }
}

exports.setCallbackUrl = function (req, res) {
  var url = req.params.url || req.query.url;
  res.writeHead(200, {
    'Set-Cookie': 'callback=' + url,
    'Content-Type': 'text/plain'
  });
  console.log('callback url==========================================>', url)
  res.end()
}