/**
 * Created by Renee on 2016/8/7.
 */

$(function() {
  //tab
  $('.tab .tab_t_item').click(function() {
    var t_i = $(this).index();
    $(this).addClass('select').siblings('.tab_t_item').removeClass('select')
    $('.tab .tab_c_item').eq(t_i).addClass('select').siblings('.tab_c_item').removeClass('select')
  })
})
