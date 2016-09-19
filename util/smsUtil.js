/**
 * Created by ZhangXiao on 2016/2/17.
 */
var smsConfig = require('./sms-config')
  , crypto = require('crypto')
  , qs = require('querystring')
  , http = require('http');

//阿里大鱼短信配置
var TopClient = require('./topClient').TopClient;
var client = new TopClient({
  'appkey': smsConfig.appkey,
  'appsecret' : smsConfig.appsecret});

module.exports = {
  sendCheckCode2Phone: function (phone, checkCode, callback) {
    var content = "您的验证码是：" + checkCode + "。请不要把验证码泄露给其他人。";
    var data = {
      "account": smsConfig.account,
      "password": crypto.createHash('md5').update(smsConfig.password).digest('hex'),
      "mobile": phone,
      "content": content,
    };
    data = qs.stringify(data);
    //方法一 通过http实现post请求返回结果
    var options = {
      hostname: smsConfig.hostname,
      port: smsConfig.port,
      path: smsConfig.path,
      method: 'POST',
      headers: {
        "Content-Type": 'application/x-www-form-urlencoded'
        , "Content-Length": data.length
      }
    };

    var req = http.request(options, function (res) {
      if (res.statusCode == 200) {
        res.on('data', function (chunk) {
          console.log('send check to mobile', "" + chunk);
          return callback({"success": 1});
        });
      } else {
        console.log('send unSuccess....', res.statusCode);
        return callback({"success": 0, "msg": "发送验证码失败"});
      }
    });
    //参数传递要在req.end()之前
    req.write(data);

    req.on('error', function (e) {
      console.log('problem with request: ' + e.message);
      return callback({"success": 0});
    });

    req.end();
  },

  /**
   * 发短信
   * @param phone 必须
   * @param extend 可选,传递参数，当查询已发送的短信时可查到次参数
   * @param smsParam 可选，当模板中有参数时必须传入对应参数
   * @param callback 可选
   */
  sendSmsMsg: function (phone, smsParam, extend, callback) {
    //var len = arguments.length;
    //console.log(arguments, arguments[2]);
    //if (len == 1) {
    //  console.log("len", "=================>", 1);
    //  extend = null;
    //  smsParam = null;
    //  callback = null;
    //}else if (len == 2) {
    //  console.log("len", "=================>", 2);
    //  extend = null;
    //  smsParam = null;
    //  callback = arguments[1];
    //} else if (len == 3) {
    //  console.log("len", "=================>", 3);
    //  extend = null;
    //  callback = arguments[2];
    //  console.log(typeof (callback));
    //}
    if (smsParam == null) {
      smsParam = {
        "sms_free_sign_name": "兴业银行",
        "sms_template_send_msg":smsConfig.sms_template_mobile_check,
        "customer":"张晓",
      };
    }
    console.log(smsParam.sms_free_sign_name);
    console.log(smsParam.sms_template_send_msg);
    console.log(phone);
    client.execute('alibaba.aliqin.fc.sms.num.send',
        {
          'extend': extend,//公共回传参数，在“消息返回”中会透传回该参数；举例：用户可以传入自己下级的会员ID，在消息返回时，该会员ID会包含在内，用户可以根据该会员ID识别是哪位会员使用了你的应用
          'sms_type': 'normal',//短信签名，传入的短信签名必须是在阿里大鱼“管理中心-短信签名管理”中的可用签名。如“阿里大鱼”已在短信签名管理中通过审核，则可传入”阿里大鱼“（传参时去掉引号）作为短信签名。短信效果示例：【阿里大鱼】欢迎使用阿里大鱼服务。
          'sms_free_sign_name': smsParam.sms_free_sign_name,//签名
          'sms_param': smsParam,//短信模板变量，传参规则{"key":"value"}，key的名字须和申请模板中的变量名一致，多个变量之间以逗号隔开。示例：针对模板“验证码${code}，您正在进行${product}身份验证，打死不要告诉别人哦！”，传参时需传入{"code":"1234","product":"alidayu"}
          'rec_num': phone,//短信接收号码。支持单个或多个手机号码，传入号码为11位手机号码，不能加0或+86。群发短信需传入多个号码，以英文逗号分隔，一次调用最多传入200个号码。示例：18600000000,13911111111,13322222222
          'sms_template_code': smsParam.sms_template_send_msg//短信模板ID，传入的模板必须是在阿里大鱼“管理中心-短信模板管理”中的可用模板。示例：SMS_585014
        },
        function (error, response) {
          console.log("sms error", "=========================>", error);
          callback(error, response);
        })
  },

  sendCheckCode: function(phone, signName, params, callback){
    if(!signName){
      signName = "趣问迪士尼";
    }
    client.execute('alibaba.aliqin.fc.sms.num.send',
      {
        'extend': "extend",//公共回传参数，在“消息返回”中会透传回该参数；举例：用户可以传入自己下级的会员ID，在消息返回时，该会员ID会包含在内，用户可以根据该会员ID识别是哪位会员使用了你的应用
        'sms_type': 'normal',//短信签名，传入的短信签名必须是在阿里大鱼“管理中心-短信签名管理”中的可用签名。如“阿里大鱼”已在短信签名管理中通过审核，则可传入”阿里大鱼“（传参时去掉引号）作为短信签名。短信效果示例：【阿里大鱼】欢迎使用阿里大鱼服务。
        'sms_free_sign_name': signName,//签名
        'sms_param': params,//短信模板变量，传参规则{"key":"value"}，key的名字须和申请模板中的变量名一致，多个变量之间以逗号隔开。示例：针对模板“验证码${code}，您正在进行${product}身份验证，打死不要告诉别人哦！”，传参时需传入{"code":"1234","product":"alidayu"}
        'rec_num': phone,//短信接收号码。支持单个或多个手机号码，传入号码为11位手机号码，不能加0或+86。群发短信需传入多个号码，以英文逗号分隔，一次调用最多传入200个号码。示例：18600000000,13911111111,13322222222
        'sms_template_code': smsConfig.sms_template_xy_mobile//短信模板ID，传入的模板必须是在阿里大鱼“管理中心-短信模板管理”中的可用模板。示例：SMS_585014
      },
      function (error, response) {
        console.log("sms error", "=========================>", error);
        callback(error, response);
      })
  }

};