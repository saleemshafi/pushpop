/* http://tqcblog.com/2012/04/19/transparent-jquery-mobile-dialogs/ */

$(function() {
    $('div[data-role="dialog"]').live('pagebeforeshow', function(e, ui) {
	ui.prevPage.addClass("ui-dialog-background ");
	});

    $('div[data-role="dialog"]').live('pagehide', function(e, ui) {
	$(".ui-dialog-background ").removeClass("ui-dialog-background ");
	});
	
	
	$('div[data-role="page"]').live('pagebeforehide', function(e, ui) {
		$("#gameMenu").hide(100);
		if (ui.nextPage.data("role") == "dialog") {
			$(this).addClass("ui-dialog-background ");
		}
	});
});