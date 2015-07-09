(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else {
		root.orion = root.orion || {};
		root.orion.codeEdit = factory();
	}
}(this, function () {
