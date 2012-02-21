// ==UserScript==
// @name           Clone from git.eclipse.org into Orion
// @version        0.4
// @namespace      http://eclipse.org/orion
// @description    Allows to clone repositories into Orion
// @include        http://git.eclipse.org/c/*
// ==/UserScript==

/*
 * An excerpt from a repo summary page from git.eclipse.org:
 * 
 * <div id='cgit'>
 * 	<table id='header'>...</table>
 * 	<table class='tabs'>...</table>
 * 	<div class='content'>
 * 	 <table ... class='list nowrap'>
 * 	  <tr ...>...</tr>
 *    ...
 *    <tr><th class='left' colspan='4'>Clone</th></tr>
 *    <tr><td colspan='4'>git://...</td></tr>
 *    <tr><td colspan='4'>ssh://...</td></tr>
 *    <tr><td colspan='4'>http://...</td></tr>
 *   </table>          
 * 	</div><!-- class=content -->
 * </div>
 */
(function () {
	function changeLinks(contentTableRows /*optional*/) {
		if (!contentTableRows)
			contentTableRows = document.getElementById("cgit").children[2].children[0].children[0].children;
		for (var i = contentTableRows.length - 3; i < contentTableRows.length; i++) {
			var gitRepoUrl = contentTableRows[i].children[0].textContent;
			contentTableRows[i].children[0].innerHTML = "<a href='http://orionhub.org/git/git-repository.html#,cloneGitRepository=" + gitRepoUrl + "' target='_blank'>" + gitRepoUrl + "</a>";
		}
	}

	try {
		var contentTableRows = document.getElementById("cgit").children[2].children[0].children[0].children;
		var cloneTh = contentTableRows[contentTableRows.length - 4].children[0];
		if (cloneTh.innerHTML === "Clone") {
			cloneTh.innerHTML = "Clone into Orion";
			changeLinks(contentTableRows);
		}
	} catch (e) {
		// silently ignore, not on the right page
	}
})();