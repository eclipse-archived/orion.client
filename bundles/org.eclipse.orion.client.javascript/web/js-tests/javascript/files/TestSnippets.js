/*eslint-env amd */
define(['./require_dep6', './require_dep7'], function(a6, a7) {
	// One file jump tests
	var local = new a6.directFoo();
	local = a6.directFunc();
	local = a6.directVar;
	local = a6.memberFoo();
	local = a6.memberFunc();
	local = a6.memberVar;
	local = a6.pFunc;
	local = a6.pVar;
	
	// Two file jumps (tests re-export)
	local = a7.reExportFunc;
	local = a7.reExportVar;
});