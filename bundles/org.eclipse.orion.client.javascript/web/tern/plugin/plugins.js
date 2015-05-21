/*eslint-env node, amd*/
/*globals infer tern walk*/
define([
	"../lib/infer", 
	"../lib/tern", 
	"acorn/util/walk"
],/* @callback */ function(infer, tern, walk) {
	
	tern.registerPlugin('plugins', function(server, options) { //$NON-NLS-1$
		return {}; //TODO I don't think we need to hook any phases
	});
	
	tern.defineQueryType('installed_plugins', { //$NON-NLS-1$
		run: function run(server, query) {
			if(server.options && typeof(server.options.plugins) === 'object') {
				return server.options.plugins;
			}
			return null;
		}
	});
	
	tern.defineQueryType('install_plugins', { //$NON-NLS-1$
		run: function run(server, query) {
			//TODO
		}
	});
	
	tern.defineQueryType('remove_plugins', { //$NON-NLS-1$
		run: function run(server, query) {
			//TODO			
		}
	});
	
	tern.defineQueryType('plugin_enablement', { //$NON-NLS-1$
		run: function run(server, query) {
			//TODO
		}
	});
});