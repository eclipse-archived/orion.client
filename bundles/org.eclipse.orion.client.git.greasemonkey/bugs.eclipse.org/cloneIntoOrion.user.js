// ==UserScript==
// @name           Clone into Orion
// @namespace      http://eclipse.org/orion
// @description    Allows to clone repositories into Orion
// @include        http://git.eclipse.org/c/*
// ==/UserScript==

/*
 * An excerpt from a bug page from bugs.eclipse.org:
 * 
 * for a logged user:
 *
 * <td id="bz_show_bug_column_1" class="bz_show_bug_column">
 * 	<table>
 *   ...
 *   <tr>
 *    <th class="field_label" id="field_label_product"><a href="describecomponents.cgi">Product:</a></th>
 *    <td class="field_value" id="field_container_product">
 *     <select id="product" name="product">
 *      <option value="ACTF" id="v98_product">ACTF</option>
 *      <option ...>...</option>
 *     </select> 
 *     <script>...</script>
 *    </td>
 *   </tr>
 *   <tr>
 *    <td class="field_label"><label for="component" accesskey="m"><b><a href="describecomponents.cgi?product=Orion">Co<u>m</u>ponent</a>:</b></label></td>
 *    <td>
 *     <select id="component" name="component">
 *      <option value="Client" selected>Client</option>
 *      <option ...>...</option>
 *     </select> 
 *    </td>
 *   </tr>
 *   ...  
 *
 * for guest:
 *
 * <td id="bz_show_bug_column_1" class="bz_show_bug_column">
 * 	<table>
 *   ...
 *   <tr>
 *    <th class="field_label" id="field_label_product"><a href="describecomponents.cgi">Product:</a></th>
 *    <td class="field_value" id="field_container_product">Orion</td>
 *   </tr>
 *   <tr>
 *    <td class="field_label"><label for="component" accesskey="m"><b><a href="describecomponents.cgi?product=Orion">Co<u>m</u>ponent</a>:</b></label></td>
 *    <td>Client</td>
 *   </tr>
 *   ...
 */

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, "");
};

var map = {};
map["Orion_Client"] = "git://git.eclipse.org/gitroot/orion/org.eclipse.orion.client.git";
map["Orion_Editor"] = "git://git.eclipse.org/gitroot/orion/org.eclipse.orion.client.git";
map["Orion_Git"] = "git://git.eclipse.org/gitroot/orion/org.eclipse.orion.server.git";
map["Orion_Server"] = "git://git.eclipse.org/gitroot/orion/org.eclipse.orion.server.git";

var product = document.getElementById("product");
var component = document.getElementById("component");

if (product && component) {
	product = product.options[product.selectedIndex].value;
	component = component.options[component.selectedIndex].value;
} else {
	product = document.getElementById("field_container_product").textContent.trim();
	component = document.getElementById("field_container_product").parentNode.nextElementSibling.children[1].textContent.trim();
}

var gitRepoUrl = map[product + "_" + component];
if (gitRepoUrl) {
	var newLink = document.createElement("a");
	newLink.setAttribute("href", "http://localhost:8080/git/git-clone.html?cloneGitRepository=" + gitRepoUrl);
	newLink.setAttribute("target", "_blank");
	newLink.appendChild(document.createTextNode("Clone into Orion"));
	document.getElementById("field_container_product").parentNode.nextElementSibling.children[1].appendChild(newLink);
}