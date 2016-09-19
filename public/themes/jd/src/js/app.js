(function () {
    window.lasting = false;
    $(window).on('ajaxStart', function (e, xhr, options) {
        showLoading();
    });
    $(window).on('ajaxStop', function (e, xhr, options) {
        // if(!window.lasting){
        // window.lasting = false;
        hideLoading();
        // }
    });
    $(document).on('ajaxError', function (e, xhr, options) {

        //alert('System Error.\n' + e.message + "\n" + xhr.statusText + "\n" + options);
        //console.log('1111111111')
    });

    $.ajaxSettings = $.ajaxSettings || {
        timeout: 6000,
        cache: false
    };

    $("#historyBack").on('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.history.go(-1);
    });

    //if (is_weixn()) {
    //    W.oauthUser(function () {
    //        W.configWx(function () {
    //        });
    //    });
    //}
})(document, window);

function showLoading(lasting) {
    window.lasting = lasting;
    $(".loading-container").addClass('visible active');
}
function hideLoading() {
    $(".loading-container").removeClass('visible active');
}

