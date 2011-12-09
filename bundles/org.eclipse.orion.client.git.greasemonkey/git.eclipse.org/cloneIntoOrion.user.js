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

function changeLinks(hostUrl, contentTableRows /*optional*/) {
	if (!contentTableRows)
		contentTableRows = document.getElementById("cgit").children[2].children[0].children[0].children;
	for (var i = contentTableRows.length - 3; i < contentTableRows.length; i++) {
		var gitRepoUrl = contentTableRows[i].children[0].textContent;
		contentTableRows[i].children[0].innerHTML = "<a href='http://" + hostUrl + "/git/git-clone.html?cloneGitRepository=" + gitRepoUrl + "' target='_blank'>" + gitRepoUrl + "</a>";
	}
}

try {
	var contentTableRows = document.getElementById("cgit").children[2].children[0].children[0].children;
	var cloneTh = contentTableRows[contentTableRows.length - 4].children[0];
	if (cloneTh.innerHTML === "Clone") {
		cloneTh.innerHTML = "Clone into Orion@<span id='host_span_id'><a href='http://orionhub.org'>orionhub.org</a> </span><span id='change_span_id'>(<a href='javascript:changeHost()'>change</a>)</span>";
		changeLinks("orionhub.org", contentTableRows);
	}
} catch (e) {
	// silently ignore, not on the right page
}

function changeHost() {
	var select = document.createElement("select");
	select.setAttribute("onChange", "changeLinks(this.options[selectedIndex].text);");
	var option1 = document.createElement("option");
	option1.appendChild(document.createTextNode("orionhub.org"));
	select.appendChild(option1);
	var option2 = document.createElement("option");
	option2.appendChild(document.createTextNode("localhost:8080"));
	select.appendChild(option2);
	
	var hostHref = document.getElementById("host_span_id");
	hostHref.parentNode.replaceChild(select, hostHref);

	var changeHref = document.getElementById("change_span_id");
	changeHref.parentNode.removeChild(changeHref);
}