$(function() {
	$(".accordion").addClass("ui-accordion ui-widget ui-helper-reset ui-accordion-icons")
	.find("> h3")
		.addClass("ui-accordion-header ui-accordion-icons ui-helper-reset ui-state-default ui-corner-top ui-corner-bottom")
		.prepend('<span class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-e"/>')
		.click(function() {
			$(this).toggleClass("ui-accordion-header-active").toggleClass("ui-state-active")
				.toggleClass("ui-state-default").toggleClass("ui-corner-bottom")
			.find("> .ui-icon").toggleClass("ui-icon-triangle-1-e").toggleClass("ui-icon-triangle-1-s")
			.end().next().toggleClass("ui-accordion-content-active").toggle("fast");
			return false;
		})
		.next().addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom").hide();

	$(".autoclick").click();
	$("table").each(function() {
		const $this = $(this);
		$this.addClass('ui-styled-table ui-widget');

		$this.on('mouseover mouseout', 'tbody tr', function (event) {
			$(this).children().toggleClass("ui-state-hover",
											event.type == 'mouseover');
		});

		$this.find("th").addClass("ui-widget ui-state-default");
		$this.find("td").addClass("ui-widget ui-widget-content");
		$this.find("tr:last-child").addClass("last-child");
	});

	const prettyPrint = (window as any).prettyPrint;
	if(prettyPrint) {
		prettyPrint();
	}
});
