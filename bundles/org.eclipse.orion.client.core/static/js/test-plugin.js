/** If you want your tests to run in the UI, write a HTML page like this:
<!DOCTYPE html>
<html>
<head>
<!-- standard scripts -->
	<script type="text/javascript" src="/openajax/release/all/OpenAjaxManagedHub-all.js"></script>
	<script type="text/javascript" src="../../js/assert.js"></script>
	<script type="text/javascript" src="../../js/test.js"></script>
	<script type="text/javascript" src="../../js/plugin.js"></script>
	<script type="text/javascript" src="../../js/test-plugin.js"></script>

<!-- include any dependencies you need, e.g.:
	<script type="text/javascript" src="/org.dojotoolkit/dojo/dojo.js.uncompressed.js"></script>
	<script type="text/javascript" src="../../js/compare/diff-parser.js"></script>
	<script type="text/javascript" src="mapper-test-data.js"></script>
	<script type="text/javascript" src ="testcase.js"></script>
-->

<!-- register your tests like so: -->
	<script type="text/javascript">
		orion.TestPlugin.add("name", testcase1);
		orion.TestPlugin.add("another name", testcase2);
	</script>
</head>
<body>
</body>
</html>
**/

 /*global orion:true console window eclipse */

orion = orion || {};
orion.TestPlugin = (function(orionTest){
	var tests = {};
	var exports = { loaded: false };

	var _namedlisteners = {};
	exports.dispatchEvent = function(eventName) {
		var listeners = _namedlisteners[eventName];
		if (listeners) {
			for ( var i = 0; i < listeners.length; i++) {
				try {
					var args = Array.prototype.slice.call(arguments, 1);
					listeners[i].apply(null, args);
				} catch (e) {
					console.log(e); // for now, probably should dispatch an
									// ("error", e)
				}
			}
		}
	};

	exports.addEventListener = function(eventName, listener) {
		_namedlisteners[eventName] = _namedlisteners[eventName] || [];
		_namedlisteners[eventName].push(listener);
	};

	exports.removeEventListener = function(eventName, listener) {
		var listeners = _namedlisteners[eventName];
		if (listeners) {
			for ( var i = 0; i < listeners.length; i++) {
				if (listeners[i] === listener) {
					if (listeners.length === 1) {
						delete _namedlisteners[eventName];
					} else {
						_namedlisteners[eventName].splice(i, 1);
					}
					break;
				}
			}
		}
	};
	exports.add = function(testname, test) {
		if (!testname.match(/^test/)) {
			testname = "test " + testname;
		}
		if (tests[testname]) {
			throw "test with the same name added twice: " + testname;
		}
		tests[testname] = test;
	};
	exports.run = function() {
		if (!exports.loaded) {
			throw "run() should only be called by the test-plugin code or the plugin host.";
		}
		orion.Test.addEventListener("runStart", function(name) { exports.dispatchEvent("runStart", name); });
		orion.Test.addEventListener("runDone", function(name, obj) { exports.dispatchEvent("runDone", name, obj); });
		orion.Test.addEventListener("testStart", function(name) { exports.dispatchEvent("testStart", name); });
		orion.Test.addEventListener("testDone", function(name, obj) { exports.dispatchEvent("testDone", name, obj); });
		orion.Test.run(tests);
	};
	exports.runLocal = function() {
		if (!exports.loaded) {
			throw "runLocal() should only be called by the test-plugin code or the plugin host.";
		}
		orion.Test.useConsole();
		orion.Test.run(tests);
	};
	
	return exports;
}(orion.Test));
window.onload = function() {
	orion.TestPlugin.loaded = true;
	if (window.frameElement) {
		var provider = new eclipse.PluginProvider();
		var serviceProvider = provider.registerServiceProvider("testRunner", orion.TestPlugin);
		orion.TestPlugin.dispatchEvent = serviceProvider.dispatchEvent;
		provider.connect();
	} else {
		orion.TestPlugin.runLocal();
	}
};