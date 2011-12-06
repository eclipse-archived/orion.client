// ==UserScript==
// @name           Clone into Orion
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

try {
	var contentTableRows = document.getElementById("cgit").children[2].children[0].children[0].children;
	if (contentTableRows[contentTableRows.length - 4].children[0].innerHTML === "Clone") {
		contentTableRows[contentTableRows.length - 4].children[0].innerHTML = "Clone into Orion";
		for (var i = contentTableRows.length - 3; i < contentTableRows.length; i++) {
			var gitRepoUrl = contentTableRows[i].children[0].innerHTML;
			contentTableRows[i].children[0].innerHTML = "<a href='http://localhost:8080/git/git-clone.html?cloneGitRepository=" + gitRepoUrl + "' target='_blank'>" + gitRepoUrl + "</a>";
		}
	}
} catch (e) {
	// silently ignore, not on the right page
}