/*eslint-env amd, node*/
define([
	"./lib/beautify-js",
	"./lib/beautify-css",
	"./lib/beautify-html"
], function(js_beautify, css_beautify, html_beautify) {

	function get_beautify(js_beautify, css_beautify, html_beautify) {
		// the default is js
		var beautify = function(src, config) {
			return js_beautify.js_beautify(src, config);
		};
	
		// short aliases
		beautify.js = js_beautify.js_beautify;
		beautify.css = css_beautify.css_beautify;
		beautify.html = html_beautify.html_beautify;
	
		// legacy aliases
		beautify.js_beautify = js_beautify.js_beautify;
		beautify.css_beautify = css_beautify.css_beautify;
		beautify.html_beautify = html_beautify.html_beautify;
	
		return beautify;
	}

	return get_beautify(js_beautify, css_beautify, html_beautify);
});