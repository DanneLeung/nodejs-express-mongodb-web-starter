var offset = 0;
var limit = 5;
var end = false; // end of all topics
$(document).ready(function () {
  $("#pagermore").on("click", function (e) {
    e.preventDefault();
    var url = $(this).attr("href");
    var that = this;
    //- if(offset > total) return false;
    if(!end) {
      $(that).addClass("loading loading-light");
      $.get(url, { offset: offset, limit: limit }, function (data) {
        $(that).removeClass("loading loading-light");
        if(!data) {
          $(that).html('没有更多了 ...');
          end = true;
        }
        offset += limit;
        $('#topics').append(data);
      }, 'html');
    } else {}
  });
  $("#pagermore").trigger('click');

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
          $.messager.show(data.msg ? data.msg : '处理错误!', { type: 'error', placement: 'bottom-center' });
        }
      });
    }
  });

});