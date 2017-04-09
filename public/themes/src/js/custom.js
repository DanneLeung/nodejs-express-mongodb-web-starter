 $(document).ready(function () {
   // icheck
   $('input').iCheck({
     checkboxClass: 'icheckbox_square-blue',
     radioClass: 'iradio_square-blue',
     increaseArea: '20%' // optional
   });
   //datatable 
   $('body').on('draw.dt', 'table', function () {
     $(this).parents('div#tableWrapper:hidden').fadeIn();
     $(this).find('input:checkbox').iCheck({
       checkboxClass: 'icheckbox_square-blue',
       radioClass: 'iradio_square-blue',
       increaseArea: '20%' // optional
     });
   });
 });