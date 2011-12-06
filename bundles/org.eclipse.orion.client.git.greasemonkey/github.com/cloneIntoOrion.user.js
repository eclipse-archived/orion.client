// ==UserScript==
// @name           Clone into Orion
// @namespace      http://eclipse.org/orion
// @description    Allows to clone repositories from Github into Orion
// @include        https://github.com/*/*
// ==/UserScript==

/*
 * An excerpt from a repo summary page from github.com:
 * 
 * <div class="url-box">
 *  <ul class="native-clones">
 *   <li><a href="/eclipse/orion.client/zipball/master" class="minibutton btn-download " rel="nofollow" title="Download this repository as a zip file"><span><span class="icon"></span>ZIP</span></a>
 *  </ul>
 *  <ul class="clone-urls">
 *   <li class="http_clone_url"><a href="https://github.com/eclipse/orion.client.git" data-permissions="Read-Only">HTTP</a></li>
 *   <li class="public_clone_url"><a href="git://github.com/eclipse/orion.client.git" data-permissions="Read-Only">Git Read-Only</a></li>
 *  </ul>
 *  <input type="text" spellcheck="false" class="url-field" />
 *  <span style="display:none" id="clippy_4858" class="clippy-text"></span>
 *  <span id="clippy_tooltip_clippy_4858" class="clippy-tooltip tooltipped" title="copy to clipboard">...</span>
 *  <p class="url-description"><strong>Read+Write</strong> access</p>
 * </div>
 */

try {
	var nativeClonesUl = document.getElementsByClassName("native-clones")[0];
	var gitRepoUrl = document.getElementsByClassName("url-field")[0].value;
	var newLi = document.createElement("li");
	var newLink = document.createElement("a");
	newLink.setAttribute("href", "http://localhost:8080/git/git-clone.html?cloneGitRepository=" + gitRepoUrl);
	newLink.setAttribute("target", "_blank");
	newLink.appendChild(document.createTextNode("Clone into Orion"));
	newLi.appendChild(newLink);
	nativeClonesUl.appendChild(newLi);
} catch (e) {
	// silently ignore, not on the right page
}