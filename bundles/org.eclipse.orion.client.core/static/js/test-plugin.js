/* If you want your tests to run in the UI, write a HTML page like this:
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

<!-- add your test cases like so: -->
	<script type="text/javascript">
		orion.Test.add(testcase);
	</script>
</head>
<body>
</body>
</html>
*/
window.onload = function() {
	if (window.frameElement) {
		var provider = new eclipse.PluginProvider();
		var serviceProvider = provider.registerServiceProvider("testRunner", orion.Test);
		orion.Test.dispatchEvent = serviceProvider.dispatchEvent;
		provider.connect();
	} else {
		orion.Test.useConsole();
		orion.Test.run();
	}
};