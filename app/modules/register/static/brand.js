/**
 * Created by danne on 2016-05-06.
 */
$(function () {
  if (is_weixin()) {
    W.oauthUser(authAppid, function (user) {
      W.configWx(authAppid);
      var openid = user.openid;
      var unionid = user.unionid;

      if (user) {
        $("#headimgurl").attr('src', user.headimgurl);
        $("#nickname").html(user.nickname);
      }
      /**
       * 1.检查openid是不是粉丝,如果不是，引导进入粉丝认证界面
       * 2.如果是粉丝，查看推广规则设置，是否需要认证,如果不需要认证，则可根据设置后的参数生成推广界面
       * 3.如果需要认证，根据认证必须的条件进入认证界面，填写信息进行认证
       */
      console.log('unionid:', unionid);
      if(unionid){
        checkOpenid(appId, openid, unionid);
      }else{
        //引导关注订阅号/公众号
        window.location = $("#path").val() +"about?wid="+getQueryString("wid");
      }
    });
  }
});

/**
 * 检查用户是否是粉丝
 */
function checkOpenid(appid, openid, unionid){
  $.ajax({
    url : $("#path").val() + "checkOpenid?openid="+openid+"&unionid="+unionid+"&wid="+getQueryString("wid"),
    type: "get",
    success : function(data){
      if(data){
        if(data.success == '0' || data.success == '2'){
          alert(data.msg);
          //引导用户进入关注公众号/订阅号 界面
          window.location = $("#path").val() + "about?wid="+getQueryString("wid");
        }else if(data.success == '1'){
          findBrandSetting(appid, openid, unionid);
        }
      }
    }
  });
}

function findBrandSetting(appid, openid, unionid){
  $.ajax({
    url : $("#path").val() + "findBrandSetting?openid="+openid+"&unionid="+unionid+"&wid="+getQueryString("wid"),
    type: "get",
    success : function(data){
      console.log(data);
      if(data && data.auth == true){
        authTemplate(data.data);
      }else{
        if(data.success && data.success == '0'){
          $("#wechatBranding").html("<h4>"+ data.msg +"</h4>");
        }else{
          //brandingTemplate(data.brand, data.setting);
          window.location = $("#path").val()+"share?cid="+ getQueryString("cid")
              +"&brandId="+data.brand._id+"&settingId="+data.setting._id
              +"&wid="+getQueryString("wid");
          //分享接口
          //share(data.setting);
        }
      }
    }
  });
}

function brandingTemplate(brand, setting){
  var html = '';
  if(brand.wechat.type = '4'){
    html+= "<div class='text-center>";
    html+=  "<h4>"+ setting.title +"</h4>";
    html+=  setting.html;
    html+=  "<div class='text-center' style='text-align:center'><img src='"+ brand.qrcode +"' style='width:60px;height:60px;'></div>";
    html+= "<div>";
  }else{
    html+= "<div class='text-center>";
    html+=  "<h4>"+ setting.title +"</h4>";
    html+=  setting.html;
    html+=  "<div class='text-center' style='text-align:center'><img src='"+ brand.qrcode +"' style='width:60px;height:60px;'></div>";
    html+= "<div>";
  }

  $("#wechatBranding").html('生成推广界面中...');
}

/**
 * 授权认证信息界面
 * @param data
 */
function authTemplate(data){
  var inputHtml = "";
  if(data.mobile == true){
    inputHtml += "   <div class='weui_cell'>";
    inputHtml += "     <div class='weui_cell_hd'>";
    inputHtml += "       <label class='weui_label' for='mobile'>手机号:<span class='required'>*</span></label>";
    inputHtml += "     </div>";
    inputHtml += "     <div class='weui_cell_bd weui_cell_primary'>";
    inputHtml += "       <input id='mobile' class='weui_input' type='tel' name='mobile' placeholder='请输入您的手机号码' />";
    inputHtml += "     </div>";
    inputHtml += "   </div>";
  }

  if(data.fullname == true){
    inputHtml += "   <div class='weui_cell'>";
    inputHtml += "     <div class='weui_cell_hd'>";
    inputHtml += "       <label class='weui_label' for='fullname'>姓名:<span class='required'>*</span></label>";
    inputHtml += "     </div>";
    inputHtml += "     <div class='weui_cell_bd weui_cell_primary'>";
    inputHtml += "       <input id='fullname' class='weui_input' type='text' name='fullname' placeholder='请输入您的真实姓名' />";
    inputHtml += "     </div>";
    inputHtml += "   </div>";
  }

  if(data.idcard == true){
    inputHtml += "   <div class='weui_cell'>";
    inputHtml += "     <div class='weui_cell_hd'>";
    inputHtml += "       <label class='weui_label' for='idcard'>身份证:<span class='required'>*</span></label>";
    inputHtml += "     </div>";
    inputHtml += "     <div class='weui_cell_bd weui_cell_primary'>";
    inputHtml += "       <input id='idcard' class='weui_input' type='tel' name='idcard' placeholder='请输入您的身份证号码' />";
    inputHtml += "     </div>";
    inputHtml += "   </div>";
  }

  if(data.email == true){
    inputHtml += "   <div class='weui_cell'>";
    inputHtml += "     <div class='weui_cell_hd'>";
    inputHtml += "       <label class='weui_label' for='email'>邮件:<span class='required'>*</span></label>";
    inputHtml += "     </div>";
    inputHtml += "     <div class='weui_cell_bd weui_cell_primary'>";
    inputHtml += "       <input id='email' class='weui_input' type='text' name='email' placeholder='请输入您的邮件地址' />";
    inputHtml += "     </div>";
    inputHtml += "   </div>";
  }

  if(data.employeeNo == true){
    inputHtml += "   <div class='weui_cell'>";
    inputHtml += "     <div class='weui_cell_hd'>";
    inputHtml += "       <label class='weui_label' for='email'>员工号:<span class='required'>*</span></label>";
    inputHtml += "     </div>";
    inputHtml += "     <div class='weui_cell_bd weui_cell_primary'>";
    inputHtml += "       <input id='employeeNo' class='weui_input' type='text' name='employeeNo' placeholder='请输入您的员工号' />";
    inputHtml += "     </div>";
    inputHtml += "   </div>";
  }

  var html = "<form id='registerForm' action='#{baseUrl}/saveAuth', method='post'>";
      html += " <div class='weui_cells weui_cells_form'>";
      html += "   <input id='openid' type='hidden' name='openid'/>";
      html += "   <input id='unionid' type='hidden' name='unionid'/>";
      html += "   <div class='weui_cells_title'>认证信息</div>";
      html += inputHtml;
      html += " </div>";
      html += "<div class='weui_btn_area'><a class='register weui_btn weui_btn_primary' onclick='saveAuth()'>提交认证信息</a></div>";
      html += "</from>";
  $("#wechatBranding").html(html);
}

function saveAuth(){
  var user = JSON.parse(localStorage.getItem(getQueryString("wid")+'.user'));
  var openid = user.openid;
  var unionid = user.unionid;
  $.ajax({
    url : $("#path").val()+'saveAuth',
    type : 'post',
    data : {"openid": openid,
            "unionid": unionid,
            "mobile": $("#mobile").val(),
            "fullname": $("#fullname").val(),
            "idcard": $("#idcard").val(),
            "email": $("#email").val(),
            "employeeNo": $("#employeeNo").val(),
            "wid": getQueryString("wid")
    },
    success: function(data){
      //白名单
      if(data && data.success == '2'){
        window.location = $("#path").val()+"share?cid="+ getQueryString("cid")
            +"&brandId="+data.brandId+"&settingId="+data.settingId
            +"&wid="+getQueryString("wid");
      }else{
        $("#wechatBranding").html("<h4>"+ data.msg +"</h4>");
      }
    }
  });
}