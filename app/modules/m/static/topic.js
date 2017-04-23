var count = 0;
var serverIds = [];
$(document).ready(function () {
  $("#pagermore").on("click", function (e) {
    e.preventDefault();
    var that = $(this);
    if(offset > total) {
      $(that).html('没有更多了 ...');
      return false;
    }
    $(that).addClass("loading loading-light");
    $.get(contextFront + '/topic/comments/' + topicId, { offset: offset, limit: limit }, function (html) {
      offset = offset + limit;
      $("#comments").append(html);
      $(that).removeClass("loading loading-light");
    }, 'html');
  });

  $(".addComment").on("click", function(e){
    $("#newComment").show();
    $("#newComment").find("textarea").focus();
  });
  $(".cancelComment").on("click", function(e){
    $("#newComment").hide();
    $("#newComment").find("textarea").val('');
  });

  $("#selectImg").on("click", function (e) {
    W.chooseImage(9, function (localIds) {
      syncUpload(localIds);
    });
  });

  $("#commentForm").ajaxform({
    onSubmit: function (formData) {
      if(!formData.content || formData.content.length <= 0) return false;
      formData["serverIds"] = serverIds;
    },
    onSuccess: function (html) {
      // $("#comments").append(html);
      $("#newComment").hide();
      $("#newComment").find("textarea").val('');
    },
    onError: function (status) {
      console.log(status);
      //- window.location.href="/home/#{topicid}"
    }
  });

  function syncUpload(localIds) {
    var localId = localIds.pop();
    W.uploadImage(localId, function (serverId) {
      //- alert(" upload image "+ localId);
      if(serverId) {
        serverIds.push(serverId);
        wx.getLocalImgData({
          localId: localId, // 图片的localID
          success: function (res) {
            var localData = res.localData; // localData是图片的base64数据,可以用img标签显示
            var img = "<img src='" + localData + "'>"
            var html = "<div class='cell-4'><div class='avatar.avatar-xl'>" + img + "</div></div>";
            $("#images").append(html);
            if(localIds.length > 0) {
              syncUpload(localIds);
            }
          }
        });
      }
    });
  };
});