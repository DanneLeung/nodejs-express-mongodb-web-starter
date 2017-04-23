var offset = 0;
var limit = 5;
var end = false; // end of all topics
$(document).ready(function () {
  $("#pagermore").on("click", function (e) {
    var that = this;
    //- if(offset > total) return false;
    if(!end) {
      $(that).addClass("loading loading-light");
      $.get('topics/#{node}', { offset: offset, limit: limit }, function (data) {
        if(!data) end = true;
        offset += limit;
        $('#topics').append(data);
        $(that).removeClass("loading loading-light");
      }, 'html');
    } else {
      $(that).html('没有更多了 ...');
    }
  });
  $("#pagermore").trigger('click');

  $("body").on("click", ".topic, .item", function () {
    var id = $(this).data("id");
    console.log(">>>>>>>> ", id);
    if(id) {
      window.location.href = contextFront + "/topic/view/" + id;
    }
  });
  $("body").on("click", ".btnLike", function () {
    var id = $(this).data("id");
    var that = $(this);
    if(id) {
      $.get('#{contextFront}/topic/like/' + id, function (data) {
        console.log(">>>>>>>> ", data);
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