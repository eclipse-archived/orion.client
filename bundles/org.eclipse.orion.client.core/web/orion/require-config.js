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
	        escope: 'escope/escope',
	        csslint: 'csslint/csslint',
		}
	});
	function errback(err) {
	    if (err.requireType === 'timeout') {
			try {
				alert("RequireJS error: Timeout occured loading module " + err.requireModules + ".\n\nPlease try refreshing the page.");
			} catch (er) {
			}
	    } 
	    throw err;
	}
	return {
		errback: errback
	};
});

