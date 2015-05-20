/*eslint-env node, amd*/
/*globals infer tern walk*/
define([
	"../lib/infer", 
	"../lib/tern", 
	"acorn/util/walk"
],/* @callback */ function(infer, tern, walk) {
	
	tern.registerPlugin('ternAccess', function(server, options) { //$NON-NLS-1$
		return {}; //TODO I don't think we need to hook any phases
	});
	
	tern.defineQueryType('installed_plugins', { //$NON-NLS-1$
		run: function run(server, query) {
			
		}
	});
	
	tern.defineQueryType('install_plugin', { //$NON-NLS-1$
		run: function run(server, query) {
			
		}
	});
	
	tern.defineQueryType('remove_plugin', { //$NON-NLS-1$
		run: function run(server, query) {
			
		}
	});
});