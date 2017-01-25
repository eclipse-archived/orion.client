/*eslint-env browser, amd*/
/* eslint-disable missing-nls */
var globalErrback = errback;
define(function() {
	require.config({
		baseUrl: "..",
		waitSeconds: 60,
		paths: {
	        text: 'requirejs/text',
	        json: 'requirejs/json',
	        i18n: 'requirejs/i18n',
	        domReady: 'requirejs/domReady',
	        gcli: 'gcli/gcli',
	        util: 'gcli/util'
		}
	});
	return {
		errback: globalErrback
	};
});

