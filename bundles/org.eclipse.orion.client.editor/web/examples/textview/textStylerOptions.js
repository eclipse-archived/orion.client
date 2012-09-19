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

define("examples/textview/textStylerOptions", ['orion/bootstrap'], function(mBootstrap) {

	var CATEGORY = "JavaScript Editor";
	var USER_THEME = "userTheme";
	
	var preferences;

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
		
		var stylerOptions = this;
		
		if (this._view) {
			mBootstrap.startup().then(function(core ) {
				preferences = core.preferences;
				stylerOptions.preferences = preferences;
				stylerOptions._updateStylesheet(preferences);
				stylerOptions.storageKey = preferences.listenForChangedSettings( stylerOptions._listener.onStorage );
			});
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
		
		_styleSheet: function( settings, theme ){
		
			var elements = [];
		
			for( var count = 0; count < settings.length; count++ ){
				elements[settings[count].element] = settings[count].value;
			}
			
			var result = [];
			result.push("");
			
			//view container
			var family = elements['fontFamily'];
			if(family === "sans serif"){
				family = '"Menlo", "Consolas", "Vera Mono", "monospace"';
			}else{
				family = 'monospace';
			}	
			
			result.push("." + theme + " {");
			result.push("\tfont-family: " + family + ";");
			result.push("\tfont-size: " + elements['fontSize'] + ";");
			result.push("\tcolor: " + elements['text'] + ";");
			result.push("}");
			
			result.push("." + theme + " .textview {");
			result.push("\tbackground-color: " + elements['background'] + ";");
			result.push("}");
			
			result.push("." + theme + ".ruler.annotations{");
			result.push("\tbackground-color: " + 'red' + ";");
			result.push("}");
			
			result.push("." + theme + " .ruler {");
			result.push("\tbackground-color: " + elements['annotationRuler'] + ";");
			result.push("}");
			
			result.push("." + theme + " .rulerLines {");
			result.push("\tcolor: " + elements['lineNumber'] + ";");
			result.push("\tbackground-color: " + elements['annotationRuler'] + ";");
			result.push("}");
			
			result.push("." + theme + " .rulerLines.even {");
			result.push("\tcolor: " + elements['lineNumber'] + ";");
			result.push("\tbackground-color: " + elements['annotationRuler'] + ";");
			result.push("}");

			result.push("." + theme + " .rulerLines.odd {");
			result.push("\tcolor: " + elements['lineNumber'] + ";");
			result.push("\tbackground-color: " + elements['annotationRuler'] + ";");
			result.push("}");
			
			result.push("." + theme + " .annotationLine.currentLine {");
			result.push("\tbackground-color: " + elements['currentLine'] + ";");
			result.push("}");
			
			var _this = this;
			var styler = this._styler;
			function defineRule(token, settingName) {
				var className = styler.getClassNameForToken(token);
				
				if (className) {
					var color = elements[settingName];
					var weight = elements['fontWeight'];
					result.push("." + theme + " ." + className +  " {");
					result.push("\tcolor: " + color + ";");
					result.push("\tfont-weight: " + weight + ";");
					result.push("}");
				}
			}
			if (styler.getClassNameForToken) {
				defineRule("keyword", "keyword");
				defineRule("string", "string");
				defineRule("singleLineComment", "comment");
				defineRule("multiLineComment", "comment");
				defineRule("docComment", "comment");
				defineRule("docHtmlComment", "comment");
			}							
			
			return result.join("\n");
		},
		_onStorage: function (e) {
			if( e.key === this.storageKey ){
				this._updateStylesheet( this.preferences );
			}
		},
		_updateStylesheet: function (preferences, sUtil) {

			var storage;
			var stylerOptions = this;
			
			preferences.getPreferences('/settings', 2).then( function(prefs){	
			
				var data = prefs.get(CATEGORY);
				
				if( data !== undefined ){
			
					storage = JSON.parse( prefs.get(CATEGORY) );	
					if (!storage) { return; }
					if (stylerOptions._stylesheet) {
						stylerOptions._stylesheet.parentNode.removeChild(stylerOptions._stylesheet);
						stylerOptions._stylesheet = null;
					}

					var stylesheet = stylerOptions._stylesheet = document.createElement("STYLE");
					stylesheet.appendChild(document.createTextNode(stylerOptions._styleSheet( storage, USER_THEME, sUtil)));
					var head = document.getElementsByTagName("HEAD")[0] || document.documentElement;
					head.appendChild(stylesheet);
					var view = stylerOptions._view;
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
			} );
		}
	};
	return {TextStylerOptions: TextStylerOptions};
});
