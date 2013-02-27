/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 
/*globals define document*/

define("orion/editor/textTheme", ['orion/editor/eventTarget', 'orion/editor/util'], function(mEventTarget, util) { 
	var THEME_PREFIX = "orion-theme-";
	
	var DefaultTheme;
	
	/**
	 * Constructs a new text theme.
	 * 
	 * @class A TextTheme is a class used to specify an editor theme.
	 * @name orion.editor.TextTheme
	 * @borrows orion.editor.EventTarget#addEventListener as #addEventListener
	 * @borrows orion.editor.EventTarget#removeEventListener as #removeEventListener
	 * @borrows orion.editor.EventTarget#dispatchEvent as #dispatchEvent
	 */
	function TextTheme() {
		
	}
	
	TextTheme.getTheme = function() {
		if (!DefaultTheme) {
			//TODO: Load a default sheet somehow
			DefaultTheme = new TextTheme();
		}
		return DefaultTheme;
	};

	TextTheme.prototype = /** @lends orion.editor.TextTheme.prototype */ {
		load: function (className, styleSheet) {
			//check to see if ID exists already
			var node = document.getElementById(THEME_PREFIX + className);
			if (node) {
				//TODO: Check if contents are the same, if so return
				node.removeChild(node.firstChild);
				node.appendChild(document.createTextNode(styleSheet));
			} else {
				node = util.createElement(document, "style");
				node.appendChild(document.createTextNode(styleSheet));
				var head = document.getElementsByTagName("head")[0] || document.documentElement;	
				head.appendChild(node);
			}	
		},
		setThemeClass: function(className, styleSheet) {
			//TODO: Also need to check the styleSheet contents before determining if it is the same
			//if (className === this._themeClass) { return; }
			this._themeClass = className;
			this.load(className, styleSheet);
			this.onThemeChanged({type: "ThemeChanged"});
		},
		getThemeClass: function() {
			return this._themeClass;
		},
		/**
		 * @class This is the event sent when the current theme has changed.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextTheme}<br/>
		 * {@link orion.editor.TextTheme#event:onThemeChanged}
		 * </p>
		 * @name orion.editor.ThemeChangedEvent
		 */
		/**
		 * This event is sent when the current theme has changed.
		 *
		 * @event
		 * @param {orion.editor.ThemeChangedEvent} themeChangedEvent the event
		 */
		onThemeChanged: function(themeChangedEvent) {
			return this.dispatchEvent(themeChangedEvent);
		},
		buildStyleSheet: function(settings, theme ){
			
			var result = [];
			result.push("");
			
			//view container
			var family = settings.fontFamily;
			if(family === "sans serif"){
				family = '"Menlo", "Consolas", "Vera Mono", "monospace"';
			}else{
				family = 'monospace';
			}	
			
			result.push("." + theme + " {");
			result.push("\tfont-family: " + family + ";");
			result.push("\tfont-size: " + settings.fontSize + ";");
			
			result.push("\tcolor: " + settings.text + ";");
			result.push("}");
			
			//From textview.css
			result.push("." + theme + ".textview {");
			result.push("\tbackground-color: " + settings.background + ";");
			result.push("}");
			
			//From rulers.css
			result.push("." + theme + " .ruler.annotations {");
			result.push("\tbackground-color: " + settings.annotationRuler + ";");
			result.push("}");
			
			result.push("." + theme + " .ruler.lines {");
			result.push("\tbackground-color: " + settings.annotationRuler + ";");
			result.push("}");
			
			result.push("." + theme + " .ruler.folding {");
			result.push("\tbackground-color: " + settings.annotationRuler + ";");
			result.push("}");
			
			result.push("." + theme + " .ruler.overview {");
			result.push("\tbackground-color: " + settings.overviewRuler + ";");
			result.push("}");
			
			result.push("." + theme + " .rulerLines {");
			result.push("\tcolor: " + settings.lineNumber  + ";");
			result.push("}");
			
			result.push("." + theme + " .rulerLines.even {");
			result.push("\tcolor: " + settings.lineNumberEven + ";");
			result.push("}");

			result.push("." + theme + " .rulerLines.odd {");
			result.push("\tcolor: " + settings.lineNumberOdd + ";");
			result.push("}");
			
			//From annotations.css
			result.push("." + theme + " .annotationLine.currentLine {");
			result.push("\tbackground-color: " + settings.currentLine  + ";");
			result.push("}");
			
			//From default-theme.css
			result.push("." + theme + " .entity-name-tag {");
			result.push("\tcolor: " + settings.keyword + ";");
			result.push("}");	
			
			result.push("." + theme + " .entity-other-attribute-name {");
			result.push("\tcolor: " + settings.attribute + ";");
			result.push("}");	
			
			result.push("." + theme + " .string-quoted {");
			result.push("\tcolor: " + settings.string + ";");
			result.push("}");
			
			//From textstyler.css
			result.push("." + theme + " .token_keyword {");
			result.push("\tcolor: " + settings.keyword + ";");
			result.push("}");	
			
			result.push("." + theme + " .token_string {");
			result.push("\tcolor: " + settings.string + ";");
			result.push("}");
			
			result.push("." + theme + " .token_singleline_comment {");
			result.push("\tcolor: " + settings.comment + ";");
			result.push("}");
						
			result.push("." + theme + " .token_multiline_comment {");
			result.push("\tcolor: " + settings.comment + ";");
			result.push("}");
			
			result.push("." + theme + " .token_doc_comment {");
			result.push("\tcolor: " + settings.comment + ";");
			result.push("}");
			
			result.push("." + theme + " .token_doc_html_markup {");
			result.push("\tcolor: " + settings.comment + ";");
			result.push("}");
			
			return result.join("\n");
		}
	};
	mEventTarget.EventTarget.addMixin(TextTheme.prototype);
	
	return {
		TextTheme: TextTheme
	};
	
});
