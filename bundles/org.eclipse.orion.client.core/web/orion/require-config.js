/*eslint-env browser, amd*/
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
	        util: 'gcli/util',
	        esprima: 'esprima/esprima',
	        estraverse: 'estraverse/estraverse',
	        escope: 'escope/escope',
	        logger: 'javascript/logger',
	        csslint: 'csslint/csslint',
	        doctrine: 'doctrine/doctrine'
		}
	});
	function errback(error) {
		alert("The following error happens. Please try again later.\n" + error);
	}
	return {
		errback: errback
	};
});

