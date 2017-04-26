var offset = 0;
var limit = 10;
var end = false; // end of all topics
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
      domNoData: '<div class="dropload-noData">暂无数据</div>'
    },
    loadUpFn: function (me) {
      console.log(" >>>>>>>>>>>>>.. loadUpFn", offset);
      offset = 0;
      $.ajax({
        type: 'GET',
        url: url,
        data: { offset: offset, limit: limit },
        dataType: 'html',
        success: function (data) {
          $('#topics').html(data);
          // 每次数据加载完，必须重置
          me.resetload();
          // 重置页数，重新获取loadDownFn的数据
          offset = 0;
          // 解锁loadDownFn里锁定的情况
          me.unlock();
          me.noData(false);
        },
        error: function (xhr, type) {
          me.resetload();
        }
      });
    },
    loadDownFn: function (me) {
      console.log(" >>>>>>>>>>>>>.. loadDownFn", offset);
      $.ajax({
        type: 'GET',
        url: url,
        data: { offset: offset, limit: limit },
        dataType: 'html',
        success: function (data) {
          offset += limit;
          if(!data) {
            me.resetload();
            // 锁定
            me.lock();
            // 无数据
            me.noData();
            end = true;
          } else {
            me.resetload();
            $('#topics').append(data);
          }
        },
        error: function (xhr, type) {
          me.resetload();
        }
      });
    },
    threshold: 0
  });

  $("body").on("click", ".topic, .item", function () {
    var id = $(this).data("id");
    if(id) {
      window.location.href = contextFront + "/topic/view/" + id;
    }
  });
  $("body").on("click", ".btnLike", function (e) {
    e.preventDefault();
    var id = $(this).data("id");
    var that = $(this);
    if(id) {
      $.get(contextFront + '/topic/like/' + id, function (data) {
        if(data && !data.error && data.msg) {
          var count = 1;
          var c = $(that).find("#likeCount").text();
          if(c) { count = parseInt(c) + 1 }
          $(that).find("#likeCount").text(count);
          $.messager.show(data.msg, { type: 'success', placement: 'bottom-center' });
        } else {
          $.messager.show(data.msg ? data.msg : '处理错误!', { type: 'warning', placement: 'bottom-center' });
        }
      });
    }
  });

});