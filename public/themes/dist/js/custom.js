function initSelect2(selectId, url) {
  $(selectId).select2({
    ajax: {
      url: url,
      dataType: 'json',
      delay: 250,
      data: function (params) {
        return {
          q: params.term
        };
      },
      processResults: function (data) {
        return {
          results: data
        };
      },
      cache: true
    },
    escapeMarkup: function (markup) {
      return markup;
    },
    minimumInputLength: 1,
    templateResult: function (repo) {
      return repo.text
    },
    templateSelection: function (repo) {
      return repo.text
    }
  });
}

$(document).ready(function () {
  // icheck
  if($.fn.iCheck) {
    $('input:not(.noicheck)').iCheck({
      checkboxClass: 'icheckbox_square-grey',
      radioClass: 'iradio_square-grey',
      increaseArea: '20%' // optional
    });
  }
  //datatable 
  $('body').on('draw.dt', 'table', function () {
    if($.fn.iCheck) {
      $(this).parents('div#tableWrapper').find('input:not(.noicheck)').iCheck({
        checkboxClass: 'icheckbox_square-grey',
        radioClass: 'iradio_square-grey',
        increaseArea: '20%' // optional
      });
    }
    $(this).parents('div#tableWrapper:hidden').fadeIn();
  });
  //统一处理datatables里的th中全选checkbox
  if($.fn.iCheck) {
    $('body').on('ifToggled', 'table thead [type="checkbox"]', function (e) {
      e && e.preventDefault();
      var $table = $(e.target).closest('table');
      $('tbody [type="checkbox"]', $table).iCheck($(this).is(':checked') ? 'check' : 'uncheck');
    });
  } else {
    // 全选
    $('body').on('change', 'table thead [type="checkbox"]', function (e) {
      e && e.preventDefault();
      var $table = $(e.target).closest('table'),
        $checked = $(e.target).is(':checked');
      $('tbody [type="checkbox"]', $table).prop('checked', $checked);
    });
  }
});