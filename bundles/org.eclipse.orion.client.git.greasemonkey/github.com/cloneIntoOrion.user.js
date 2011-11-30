// ==UserScript==
// @name           Clone into Orion
// @namespace      http://eclipse.org/orion
// @description    Allows to clone repositories from Github into Orion
// @include        https://github.com/*
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

/*
	Developed by Robert Nyman, http://www.robertnyman.com
	Code/licensing: http://code.google.com/p/getelementsbyclassname/
*/
var getElementsByClassName = function (className, tag, elm){
	if (document.getElementsByClassName) {
		getElementsByClassName = function (className, tag, elm) {
			elm = elm || document;
			var elements = elm.getElementsByClassName(className),
				nodeName = (tag)? new RegExp("\\b" + tag + "\\b", "i") : null,
				returnElements = [],
				current;
			for(var i=0, il=elements.length; i<il; i+=1){
				current = elements[i];
				if(!nodeName || nodeName.test(current.nodeName)) {
					returnElements.push(current);
				}
			}
			return returnElements;
		};
	}
	else if (document.evaluate) {
		getElementsByClassName = function (className, tag, elm) {
			tag = tag || "*";
			elm = elm || document;
			var classes = className.split(" "),
				classesToCheck = "",
				xhtmlNamespace = "http://www.w3.org/1999/xhtml",
				namespaceResolver = (document.documentElement.namespaceURI === xhtmlNamespace)? xhtmlNamespace : null,
				returnElements = [],
				elements,
				node;
			for(var j=0, jl=classes.length; j<jl; j+=1){
				classesToCheck += "[contains(concat(' ', @class, ' '), ' " + classes[j] + " ')]";
			}
			try	{
				elements = document.evaluate(".//" + tag + classesToCheck, elm, namespaceResolver, 0, null);
			}
			catch (e) {
				elements = document.evaluate(".//" + tag + classesToCheck, elm, null, 0, null);
			}
			while ((node = elements.iterateNext())) {
				returnElements.push(node);
			}
			return returnElements;
		};
	}
	else {
		getElementsByClassName = function (className, tag, elm) {
			tag = tag || "*";
			elm = elm || document;
			var classes = className.split(" "),
				classesToCheck = [],
				elements = (tag === "*" && elm.all)? elm.all : elm.getElementsByTagName(tag),
				current,
				returnElements = [],
				match;
			for(var k=0, kl=classes.length; k<kl; k+=1){
				classesToCheck.push(new RegExp("(^|\\s)" + classes[k] + "(\\s|$)"));
			}
			for(var l=0, ll=elements.length; l<ll; l+=1){
				current = elements[l];
				match = false;
				for(var m=0, ml=classesToCheck.length; m<ml; m+=1){
					match = classesToCheck[m].test(current.className);
					if (!match) {
						break;
					}
				}
				if (match) {
					returnElements.push(current);
				}
			}
			return returnElements;
		};
	}
	return getElementsByClassName(className, tag, elm);
};

var nativeClonesUl = getElementsByClassName("native-clones")[0];
var gitRepoUrl = getElementsByClassName("url-field")[0].value;
var newLi = document.createElement("li");
newLi.innerHTML = "<a href='http://localhost:8080/git/git-clone.html?cloneGitRepository=" + gitRepoUrl + "' target='_blank'>Clone into Orion</a>";
nativeClonesUl.appendChild(newLi);