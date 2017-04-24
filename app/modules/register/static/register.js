/**
 * Created by danne on 2016-05-06.
 */
if (is_weixin()) {
  W.oauthUser(authAppid, function (user) {
    // W.configWx(appId);
    if (user) {
      $("#headimgurl").attr('src', user.headimgurl);
      $("#nickname").html(user.nickname);
    }
  });
}

function isCardNo(card) {
  // 身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X
  var reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (reg.test(card) === false) {
    return false;
  }
  return true;
}

function validate() {
  var flag = true;
  if ($("#fullname").val() == '') {
    $("#fullname").parent().addClass("weui_cell_warn");
    $("#fullname").attr("title", "fullname is not null")
    flag = false;
  } else {
    $("#fullname").parent().removeClass("weui_cell_warn");
    flag = true;
  }
  if ($("#username").val() == '') {
    $("#username").parent().addClass("weui_cell_warn");
    flag = false;
  } else {
    $("#username").parent().removeClass("weui_cell_warn");
    flag = true;
  }
  if ($("#numberID").val() == '') {
    $("#numberID").parent().addClass("weui_cell_warn");
    flag = false;
  } else if (!isCardNo($("#numberID").val())) {
    $("#numberID").parent().addClass("weui_cell_warn");
    flag = false;
  } else {
    $("#numberID").parent().removeClass("weui_cell_warn");
    flag = true;
  }
  if ($("#mobile").val() == '') {
    $("#mobile").parent().addClass("weui_cell_warn");
    flag = false;
  } else if (/^1\d{10}$/.test($("#mobile").val()) == false) {
    $("#mobile").parent().addClass("weui_cell_warn");
    flag = false;
  } else {
    $("#mobile").parent().removeClass("weui_cell_warn");
    flag = true;
  }
  if ($("#checkCode").val() == '') {
    $("#checkCode").parent().addClass("weui_cell_warn");
    flag = false;
  } else {
    $("#checkCode").parent().removeClass("weui_cell_warn");
    flag = true;
  }
  if ($("#password").val() == '') {
    $("#password").parent().addClass("weui_cell_warn");
    flag = false;
  } else {
    $("#password").parent().removeClass("weui_cell_warn");
    flag = true;
  }
  if ($("#confirmPassword").val() == '') {
    $("#confirmPassword").parent().addClass("weui_cell_warn");
    flag = false;
  } else {
    $("#confirmPassword").parent().removeClass("weui_cell_warn");
    flag = true;
  }

  if ($("#password").val() != $("#confirmPassword").val()) {
    $("#password").parent().addClass("weui_cell_warn");
    $("#confirmPassword").parent().addClass("weui_cell_warn");
    flag = false;
  } else {
    $("#password").parent().removeClass("weui_cell_warn");
    $("#confirmPassword").parent().removeClass("weui_cell_warn");
    flag = true;
  }
  return flag;
}

$("#registerFind").on("click", function () {
  window.location = '#{req.baseUrl}/registerViewFind?openid=' + localStorage.getItem("user.openid");
});

$(".register").on('click', function () {
  //if (!localStorage.getItem("user.openid")) {
  //  alert("非微信端或微信未认证!");
  //  return;
  //}
  $.ajax({
    type: 'post', //数据发送方式
    url: prefix + '#{req.baseUrl}/unionCheck',
    data: {
      "username": $("#username").val(),
      "openid": localStorage.getItem("user.openid"),
      "mobile": $("#mobile").val(),
      "numberID": $("#numberID").val()
    },
    success: function (data) { //成功
      if (data.success == '1') {
        var mobile = $("#mobile").val();
        if (mobile) {
          var checkCode = $("#checkCode").val();
          if (!checkCode || checkCode == "") {
            alert("请输入验证码!");
            return;
          }
          $.ajax({
            type: 'post', //数据发送方式
            url: prefix + '#{req.baseUrl}/sentValid',
            data: {
              "mobile": mobile,
              "checkCode": checkCode
            }, //要传递的数据
            success: function (data) { //成功
              if (data.success == '1') {
                $("#openid").val(localStorage.getItem("user.openid"));
                $("#registerForm").attr("action", prefix + $("#registerForm").attr("action"));
                $("#registerForm").submit();
              } else {
                alert(data.msg);
              }
            }
          });
        } else {
          alert("请输入手机号码");
        }
      } else {
        alert(data.msg);
      }
    }
  });
});

$("#retryBtn").on('click', function () {
  if (!$(this).attr("disabled")) {
    var mobile = $("#mobile").val();
    if (mobile == null || mobile == '') {
      alert("手机号不能为空");
      return;
    }

    var time = 60;
    var timer = null;
    var t = function () {
      $("#retryBtn").val("重新发送(" + time + ")");
      time--;
      if (time == 0) {
        $("#retryBtn").removeAttr("disabled");
        $("#retryBtn").addClass("weui_btn_primary");
        $("#retryBtn").removeClass("background-color");
        $("#retryBtn").val("获取验证码");
        clearInterval(timer);
      }
    }

    $.ajax({
      type: 'post', //数据发送方式
      url: prefix + '#{req.baseUrl}/sendCheckCode',
      data: {
        "mobile": mobile
      }, //要传递的数据
      success: function (data) { //成功
        if (data.success == '1') {
          $("#retryBtn").attr("disabled", "true");
          $("#retryBtn").removeClass("weui_btn_primary");
          $("#retryBtn").addClass("weui_btn_disabled");
          timer = setInterval(t, 1000);
        } else {
          alert(data.msg);
        }
      }
    });
  }
});