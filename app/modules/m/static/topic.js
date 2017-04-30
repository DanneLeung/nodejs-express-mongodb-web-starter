var offset = 0;
var limit = 10;
var end = false; // end of all topics
var count = 0;
var serverIds = [];
$(document).ready(function () {
  // dropload
  $('#wrapper').dropload({
    scrollArea: window,
    domUp: {
      domClass: 'dropload-up',
      domRefresh: '<div class="dropload-refresh">↓下拉刷新</div>',
      domUpdate: '<div class="dropload-update">↑释放更新</div>',
      domLoad: '<div class="dropload-load"><span class="loading"></span>加载中...</div>'
    },
    domDown: {
      domClass: 'dropload-down',
      domRefresh: '<div class="dropload-refresh">↑上拉加载更多</div>',
      domLoad: '<div class="dropload-load"><span class="loading"></span>加载中...</div>',
      domNoData: '<div class="dropload-noData">没有更多了</div>'
    },
    loadUpFn: function (me) {
      offset = 0;
      $.ajax({
        type: 'GET',
        url: url,
        data: { offset: offset, limit: limit },
        dataType: 'html',
        success: function (data) {
          // 每次数据加载完，必须重置
          me.resetload();
          // 重置页数，重新获取loadDownFn的数据
          offset = 0 + limit;
          // 解锁loadDownFn里锁定的情况
          me.unlock();
          me.noData(false);
          $('#comments').html(data);
        },
        error: function (xhr, type) {
          me.resetload();
        }
      });
    },
    loadDownFn: function (me) {
      $.ajax({
        type: 'GET',
        url: url,
        data: { offset: offset, limit: limit },
        dataType: 'html',
        success: function (data) {
          if(!data) {
            // 无数据
            me.noData(true);
            end = true;
            me.resetload();
            // 锁定
            me.lock("down");
          } else {
            offset += limit;
            me.resetload();
            $("#comments").append(data);
          }
        },
        error: function (xhr, type) {
          me.resetload();
        }
      });
    },
    threshold: 0
  });

  if(localStorage) {
    var c = localStorage.getItem("topic.comment");
    if(c && c != undefined) { $("#content").val(c); }
    $("#content").on("change", function (e) {
      localStorage.setItem("topic.comment", $(this).val());
    });
  }

  $(".addComment").on("click", function (e) {
    $("#newComment").show();
    $("#newComment").find("textarea").focus();
  });
  $(".cancelComment").on("click", function (e) {
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
      localStorage.setItem("topic.comment", '');
      $("#newComment").find("textarea").val('');
    },
    onError: function (status) {
      console.log(status);
    }
  });

  function syncUpload(localIds) {
    var localId = localIds.pop();
    W.uploadImage(localId, function (serverId) {
      //- alert(" upload image "+ localId);
      if(serverId) {
        serverIds.push(serverId);
        if(browser.versions.ios) {
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
        } else {
          // 非iOS情况，直接显示localid
          var img = "<img src='" + localId + "'>";
          var html = "<div class='cell-4'><div class='avatar.avatar-xl'>" + img + "</div></div>";
          $("#images").append(html);
          if(localIds.length > 0) {
            syncUpload(localIds);
          }
        }
      }
    });
  }
});