/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: 
 *		Anton McConville (IBM Corporation) - initial API and implementation
 *		Felipe Heidrich (IBM Corporation) - initial API and implementation 
 ******************************************************************************/

/*global window document define localStorage*/

define("examples/textview/textStylerOptions", [], function() {

	var CATEGORY = "JavaScript Editor";
	var USER_THEME = "userTheme";

	/**
	 * Constructs ...
	 * 
	 * Working with local storage for initial settings proof of concept
	 */
	function TextStylerOptions (styler) {
		this._styler = styler;
		this._view = this._styler.view;
		var self = this;
		this._listener = {
			onStorage: function(e) {
				self._onStorage(e);
			}
		};
		if (this._view) {
			this._updateStylesheet();
			window.addEventListener("storage", this._listener.onStorage, false);
		}
	}
	
	TextStylerOptions.prototype = /** @lends examples.textview.TextStylerOptions.prototype */ {
		_getSetting: function(subcategories, subcategory, element){
			var value;
			for(var sub = 0; sub < subcategories.length; sub++){
				if(subcategories[sub].label === subcategory){
					for(var item = 0; item < subcategories[sub].data.length; item++){
						if(subcategories[sub].data[item].label === element){
							value = subcategories[sub].data[item].value;
							break;
						}
					}
				}
			}
			return value;
		}, 
		_getStyleSheet: function (subcategories, theme) {
			var result = [];
			result.push("");
			
			//view container
			var family = this._getSetting(subcategories, "Font", "Family").toLowerCase();
			if(family === "sans serif"){
				family = '"Menlo", "Consolas", "Vera Mono", "monospace"';
			}else{
				family = 'monospace';
			}	
			var size = this._getSetting(subcategories, "Font", "Size");
			var color = this._getSetting(subcategories, "Font", "Color");
			var background = this._getSetting(subcategories, "Font", "Background");
			result.push("." + theme + " {");
			result.push("\tfont-family: " + family + ";");
			result.push("\tfont-size: " + size + ";");
			result.push("\tcolor: " + color + ";");
			result.push("}");
			
			//view
			result.push("." + theme + " .textview {");
			result.push("\tbackground-color: " + background + ";");
			result.push("}");

			//ruler
			result.push("." + theme + " .ruler {");
			result.push("\tbackground-color: " + background + ";");
			result.push("}");

			var _this = this;
			var styler = this._styler;
			function defineRule(token, settingName) {
				var className = styler.getClassNameForToken(token);
				if (className) {
					var color = _this._getSetting(subcategories, settingName, "Color");
					var weight = _this._getSetting(subcategories, settingName, "Weight").toLowerCase();
					result.push("." + theme + " ." + className +  " {");
					result.push("\tcolor: " + color + ";");
					result.push("\tfont-weight: " + weight + ";");
					result.push("}");
				}
			}
			if (styler.getClassNameForToken) {
				defineRule("keyword", "Keyword Types");
				defineRule("string", "String Types");
				defineRule("singleLineComment", "Comment Types");
				defineRule("multiLineComment", "Comment Types");
				defineRule("docComment", "Comment Types");
				defineRule("docHtmlComment", "Comment Types");
			}							
			return result.join("\n");//easier for debuggin 
		},
		_onStorage: function (e) {
			if (e.key === CATEGORY) {
				this._updateStylesheet();
			}
		},
		_updateStylesheet: function () {
			var storage = localStorage.getItem(CATEGORY);
			if (!storage) { return; }			if (this._stylesheet) {
				this._stylesheet.parentNode.removeChild(this._stylesheet);
				this._stylesheet = null;
			}
			var stylesheet = this._stylesheet = document.createElement("STYLE");
			stylesheet.appendChild(document.createTextNode(this._getStyleSheet(JSON.parse(storage), USER_THEME)));
			var head = document.getElementsByTagName("HEAD")[0] || document.documentElement;
			head.appendChild(stylesheet);
			var view = this._view;
			var options = {themeClass:null};
			view.getOptions(options);
			var theme = options.themeClass;
			if (theme) {
				theme = theme.replace(USER_THEME, "");
				if (theme) { theme += " "; }
				theme += USER_THEME;
			} else {
				theme = USER_THEME;
			}
			options.themeClass = theme;
			view.setOptions(options);
			view.update(true);
		}
	};
	return {TextStylerOptions: TextStylerOptions};
});
