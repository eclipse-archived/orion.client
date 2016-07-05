/*eslint-env amd, node*/
define([
	"./lib/beautify-css",
	"./lib/beautify-html"
], function(css_beautify, html_beautify) {

	function get_beautify(css_beautify, html_beautify) {
		var beautify = Object.create(null);
		// short aliases
		beautify.css = css_beautify.css_beautify;
		beautify.html = html_beautify.html_beautify;
	
		// legacy aliases
		beautify.css_beautify = css_beautify.css_beautify;
		beautify.html_beautify = html_beautify.html_beautify;
	
		return beautify;
	}
	return get_beautify(css_beautify, html_beautify);
});