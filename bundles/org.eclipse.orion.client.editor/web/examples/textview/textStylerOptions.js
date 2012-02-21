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

/*global window define localStorage*/

define("examples/textview/textStylerOptions", [], function() {

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
			onLoad: function(e) {
				self._onLoad(e);
			},
			onStorage: function(e) {
				self._onStorage(e);
			}
		};
		if (this._view) {
			if (this._view.isLoaded()) {
				this._updateStylesheet();
			} else {
				this._view.addEventListener("Load", this._listener.onLoad);
			}
			window.addEventListener("storage", this._listener.onStorage, false);
		}
	}
	
	TextStylerOptions.prototype = /** @lends examples.textview.TextStylerOptions.prototype */ {
		_getSetting: function(subCategory, element){
			var subcategories = JSON.parse(localStorage.getItem("JavaScript Editor"));
			var value;
			
			for(var sub = 0; sub < subcategories.length; sub++){
				if(subcategories[sub].label === subCategory){
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
		_getStyleSheet: function (theme) {
			var result = [];
			result.push("");
			
			//view container
			var family = this._getSetting("Font", "Family").toLowerCase();
			if(family === "sans serif"){
				family = '"Menlo", "Consolas", "Vera Mono", "monospace"';
			}else{
				family = 'monospace';
			}	
			var size = this._getSetting("Font", "Size");
			var color = this._getSetting("Font", "Color");
			var background = this._getSetting("Font", "Background");
			result.push("." + theme + " {");
			result.push("\tfont-family: " + family + ";");
			result.push("\tfont-size: " + size + ";");
			result.push("\tcolor: " + color + ";");
			result.push("\tbackground-color: " + background + ";");
			result.push("}");
			
			//view
			result.push("." + theme + " .view {");
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
					var color = _this._getSetting(settingName, "Color");
					var weight = _this._getSetting(settingName, "Weight").toLowerCase();
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
		_updateStylesheet: function () {
			if (localStorage.getItem("JavaScript Editor")) {
				var view = this._view;
				var options = {stylesheet:null, themeClass:null};
				view.getOptions(options);
				var userCSS = "/* Orion Editor User Preference CSS (key) */";
				var stylesheet = options.stylesheet;
				if (!stylesheet) {
					stylesheet = [];
				}
				if (!(stylesheet instanceof Array)) {
					stylesheet = [stylesheet];
				}
				for (var i = 0; i < stylesheet.length; i++) {
					var sheet = stylesheet[i];
					if (sheet.indexOf(userCSS) === 0) {
						stylesheet.splice(i, 1);
						break;
					}
				}
				var userTheme = "userTheme";
				var theme = options.themeClass;
				if (theme) {
					theme = theme.replace(userTheme, "");
					if (theme) { theme += " "; }
					theme += userTheme;
				} else {
					theme = userTheme;
				}
				
				stylesheet.push(userCSS + this._getStyleSheet(userTheme));
				options.stylesheet = stylesheet;
				options.themeClass = theme;
				view.setOptions(options);
			}
		},
		_onLoad: function (e) {
			this._updateStylesheet();
			this._view.removeEventListener("Load", this._listener.onLoad);
		},
		_onStorage: function (e) {
			if (e.key === "JavaScript Editor") {
				this._updateStylesheet();
			}
		}
	};
	return {TextStylerOptions: TextStylerOptions};
});
