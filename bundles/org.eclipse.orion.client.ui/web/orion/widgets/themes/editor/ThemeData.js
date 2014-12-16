/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/

define([
		'i18n!orion/settings/nls/messages',
		'orion/editor/textTheme',
		'orion/widgets/themes/ThemeVersion'
], function(messages, mTextTheme, THEMES_VERSION) {

	// *******************************************************************************
	//
	// If you change any styles in this file, you must increment the version number
	// in ThemeVersion.js.
	//
	// *******************************************************************************

		/* Synchronizing colors and styles for HTML, CSS and JS files like this ...
	
			Using Prospecto as an example:
			
			-----------------------------------------------
							CSS			HTML		JS
			-----------------------------------------------
			ORANGE			Class		Tag			Keyword
			darkSlateGray	Text		Text		Text
			darkSeaGreen	Comments	Comments	Comments
			cornFlowerblue	String		String		String
			----------------------------------------------- */

		function StyleSet(){
		
		}
		
		var defaultFont = '"Consolas", "Monaco", "Vera Mono", monospace'; //$NON-NLS-0$
		var defaultFontSize = '12px'; //$NON-NLS-0$

		function ThemeData() {

			this.styles = [];
			
			var prospecto = {"className":"prospecto","name":"Prospecto","styles":{"annotationLine":{"currentLine":{"backgroundColor":"#EAF2FE"}},"annotationRange":{"currentBracket":{"backgroundColor":"#5f95c0"},"matchingBracket":{"backgroundColor":"#5f95c0"},"matchingSearch":{"backgroundColor":"#c3e1ff","currentSearch":{"backgroundColor":"#53d1ff"}},"writeOccurrence":{"backgroundColor":"#ffff00"}},"backgroundColor":"#ffffff","color":"#151515","comment":{"color":"#3C802C"},"constant":{"color":"darkOrchid"},"entity":{"name":{"color":"#98937B","function":{"color":"#67BBB8","fontWeight":"bold"}},"other":{"attribute-name":{"color":"cadetBlue"}}},"fontFamily":"\"Consolas\", \"Monaco\", \"Vera Mono\", monospace","fontSize":"14px","keyword":{"control":{"color":"#CC4C07","fontWeight":"bold"},"operator":{"color":"#9F4177","fontWeight":"bold"},"other":{"documentation":{"color":"#7F9FBF","task":{"color":"#5595ff"}}}},"markup":{"bold":{"fontWeight":"bold"},"heading":{"color":"blue"},"italic":{"fontStyle":"italic"},"list":{"color":"#CC4C07"},"other":{"separator":{"color":"#00008F"},"strikethrough":{"textDecoration":"line-through"},"table":{"color":"#3C802C"}},"quote":{"color":"#446FBD"},"raw":{"fontFamily":"monospace"},"underline":{"link":{"textDecoration":"underline"}}},"meta":{"documentation":{"annotation":{"color":"#7F9FBF"},"tag":{"color":"#7F7F9F"}},"tag":{"color":"#CC4C07"}},"ruler":{"annotations":{"backgroundColor":"#ffffff"},"backgroundColor":"#ffffff","overview":{"backgroundColor":"#ffffff"}},"rulerLines":{"color":"#CCCCCC"},"string":{"color":"#446FBD"},"support":{"type":{"propertyName":{"color":"#9F4177"}}},"textviewContent ::-moz-selection":{"backgroundColor":"#b4d5ff"},"textviewContent ::selection":{"backgroundColor":"#b4d5ff"},"textviewLeftRuler":{"borderRight":"1px solid transparent"},"textviewRightRuler":{"borderLeft":"1px solid transparent"},"textviewSelection":{"backgroundColor":"#b4d5ff"},"textviewSelectionUnfocused":{"backgroundColor":"#b4d5ff"},"variable":{"language":{"color":"#7F0055","fontWeight":"bold"},"other":{"color":"#E038AD"},"parameter":{"color":"#D1416F"}}}};
			this.styles.push(prospecto);
	
			var darker = {"className":"darker","name":"Darker","styles":{"annotationLine":{"currentLine":{"backgroundColor":"#171c20"}},"annotationRange":{"currentBracket":{"backgroundColor":"#383234"},"currentSearch":{"backgroundColor":"#5d5d5d"},"matchingBracket":{"backgroundColor":"#383234"},"matchingSearch":{"backgroundColor":"#363636","currentSearch":{"backgroundColor":"#465e47"}},"writeOccurrence":{"backgroundColor":"#093f59"}},"backgroundColor":"#1a1d1e","color":"#dadada","comment":{"block":{"color":"#5e7175"},"color":"#5e7175","line":{"color":"#5e7175"}},"constant":{"color":"#c8333a","numeric":{"color":"#c8333a","hex":{"color":"#cd3f45"},"numeric":{"hex":{"color":"#c8333a"}}}},"entity":{"name":{"color":"#30a7d3","function":{"color":"#30a7d3","fontWeight":"normal"}},"other":{"attribute-name":{"color":"cadetBlue"}}},"fontFamily":"\"Consolas\", \"Monaco\", \"Vera Mono\", monospace","fontSize":"14px","keyword":{"control":{"color":"#e8d075","fontWeight":"normal"},"operator":{"color":"#91c23d","fontWeight":"normal"},"other":{"documentation":{"color":"#7F9FBF","task":{"color":"#8db6f1"}}}},"markup":{"bold":{"fontWeight":"bold"},"heading":{"color":"blue"},"italic":{"fontStyle":"italic"},"list":{"color":"#CC4C07"},"other":{"separator":{"color":"#00008F"},"strikethrough":{"textDecoration":"line-through"},"table":{"color":"#3C802C"}},"quote":{"color":"#55b5db"},"raw":{"fontFamily":"monospace"},"underline":{"link":{"textDecoration":"underline"}}},"meta":{"documentation":{"annotation":{"color":"#7F9FBF"},"tag":{"color":"#7F7F9F"}},"tag":{"color":"#999999"}},"ruler":{"annotations":{"backgroundColor":"#0f1113"},"backgroundColor":"#0f1113","overview":{"backgroundColor":"#0f1113"}},"rulerLines":{"color":"#3d4750","even":{"color":"#3d4750"},"odd":{"color":"#3d4750"}},"string":{"color":"#55b5db","quoted":{"double":{"color":"#55b5db"},"single":{"color":"#55b5db"}}},"support":{"type":{"propertyName":{"color":"#9fca56"}}},"textviewContent ::-moz-selection":{"backgroundColor":"#317370"},"textviewContent ::selection":{"backgroundColor":"#317370"},"textviewLeftRuler":{"borderRight":"1px solid #0e1112"},"textviewRightRuler":{"borderLeft":"1px solid #0e1112"},"textviewSelection":{"backgroundColor":"#317370"},"textviewSelectionUnfocused":{"backgroundColor":"#317370"},"variable":{"language":{"color":"#9fca56","fontWeight":"normal"},"other":{"color":"#E038AD"},"parameter":{"color":"#30a7d3"}}}};		
			this.styles.push(darker);
		}
		
		function getStyles(){
			return this.styles;
		}
		
		ThemeData.prototype.styles = [];
		ThemeData.prototype.getStyles = getStyles;
		
		var fontSettable = true;
		
		ThemeData.prototype.fontSettable = fontSettable;
		
		function getThemeStorageInfo(){
			return {
				storage:'/themes',
				styleset:'editorstyles',
				defaultTheme:'Prospecto',
				selectedKey: 'editorSelected',
				version: THEMES_VERSION
			}; 
		}

		ThemeData.prototype.getThemeStorageInfo = getThemeStorageInfo;
		
		function colorToHex(color) {
		    if (color.substr(0, 1) === '#') {
		        return color;
		    }
		    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
		
		    var red = parseInt(digits[2]);
		    var green = parseInt(digits[3]);
		    var blue = parseInt(digits[4]);
		
		    var rgb = blue | (green << 8) | (red << 16) | (1 << 24);
		    return digits[1] + '#' + rgb.toString(16).substring(1,8);
		}
		
		ThemeData.prototype.colorToHex = colorToHex;
		
		function parseToXML(text) {
			try {
				var parser = new DOMParser();
				var xml = parser.parseFromString(text, "text/xml"); //$NON-NLS-0$
				var found = xml.getElementsByTagName("parsererror"); //$NON-NLS-0$
				if (!found || !found.length || !found[0].childNodes.length) {
					return xml;
				}
			} catch (e) { /* suppress */ }
			return null;
		}

		ThemeData.prototype.parseToXML = parseToXML;
		
		function selectFontSize(size) {
			window.console.log("fontsize: " + size ); //$NON-NLS-0$
		}
		
		ThemeData.prototype.selectFontSize = selectFontSize;
		
		// Changes XML to JSON
		function xmlToJson(xml) {
			// Create the return object
			var obj = {};
			if (xml.nodeType == 1) { // element
				// do attributes
				if (xml.attributes.length > 0) {
					for (var j = 0; j < xml.attributes.length; j++) {
						var attribute = xml.attributes.item(j);
						obj[attribute.nodeName] = attribute.nodeValue;
					}
				}
			} else if (xml.nodeType == 3) { // text
				obj = xml.nodeValue.trim(); // add trim here
			}
			// do children
			if (xml.hasChildNodes()) {
				for(var i = 0; i < xml.childNodes.length; i++) {
					var item = xml.childNodes.item(i);
					var nodeName = item.nodeName;
					if (typeof(obj[nodeName]) == "undefined") { //$NON-NLS-0$
						var tmp = xmlToJson(item);
						if(tmp != "") // if not empty string
							obj[nodeName] = tmp;
					} else {
						if (typeof(obj[nodeName].push) == "undefined") { //$NON-NLS-0$
							var old = obj[nodeName];
							obj[nodeName] = [];
							obj[nodeName].push(old);
						}
						var tmp = xmlToJson(item);
						if(tmp != "") // if not empty string
							obj[nodeName].push(tmp);
					}
				}
			}
			return obj;
		}		
		
		function importTheme(data) {
			var body = data.parameters.valueFor("name"); //$NON-NLS-0$
			var xml = this.parseToXML(body);
			
			if(xml.children[0].tagName === "plist"){ //$NON-NLS-0$ //assume it uses tmTheme structure
				var themeJson = xmlToJson(xml); //convert to Json
				var newStyle = new StyleSet(); //sets the default styling
				newStyle = {"name":"default","className":"default","styles":{"annotationRange":{"matchingSearch":{"backgroundColor":""}, "currentSearch":{"backgroundColor":"","text-decoration":"underline"}},"backgroundColor":"","color":"","fontFamily":"\"Consolas\", \"Monaco\", \"Vera Mono\", monospace","fontSize":"16px","textviewRightRuler":{"borderLeft":"1px solid rgba(131, 131, 131, 0.05)"},"textviewLeftRuler":{"borderRight":"1px solid rgba(131, 131, 131, 0.05)"},"ruler":{"backgroundColor":"","overview":{"backgroundColor":""},"annotations":{"backgroundColor":""}},"rulerLines":{"color":"","odd":{"color":""},"even":{"color":""}},"annotationLine":{"currentLine":{"backgroundColor":"rgba(255, 255, 255, 0.05)"}},"comment":{"color":"","block":{"color":""},"line":{"color":""}},"constant":{"color":"","numeric":{"color":"","hex":{"color":""}}},"entity":{"name":{"color":"","function":{"fontWeight":"normal","color":""}},"other":{"attribute-name":{"color":""}}},"keyword":{"control":{"color":"","fontWeight":"normal"},"operator":{"color":"","fontWeight":"normal"},"other":{"documentation":{"color":""}}},"markup":{"bold":{"fontWeight":"bold"},"heading":{"color":"blue"},"italic":{"fontStyle":"italic"},"list":{"color":"#CC4C07"},"other":{"separator":{"color":"#00008F"},"strikethrough":{"textDecoration":"line-through"},"table":{"color":"#3C802C"}},"quote":{"color":"#55b5db"},"raw":{"fontFamily":"monospace"},"underline":{"link":{"textDecoration":"underline"}}},"meta":{"documentation":{"annotation":{"color":""},"tag":{"color":""}},"tag":{"color":""}},"string":{"color":"","quoted":{"single":{"color":""},"double":{"color":""}}},"support":{"type":{"propertyName":{"color":"#9F4177"}}},"variable":{"language":{"color":"","fontWeight":"normal"},"other":{"color":""},"parameter":{"color":""}}}				} //$NON-NLS-0$
				//finds the name tag
				for(var i = 0; i < themeJson.plist[1].dict.key.length; i++){
					if(themeJson.plist[1].dict.key[i]["#text"] === "name"){ //$NON-NLS-0$
						newStyle.name = themeJson.plist[1].dict.string[i]["#text"];
						newStyle.className = newStyle.name.replace(/\s+/g, '');
					}
				}
				var dictKey = themeJson.plist[1].dict.array.dict[0].dict.key;
				var dictString = themeJson.plist[1].dict.array.dict[0].dict.string;
				
				//finds the general attributes
				for(var i = 0; i<dictKey.length; i++){
					if(dictKey[i]["#text"] === "background" && dictString[i]["#text"].length < 8){ //$NON-NLS-0$
						newStyle.styles.backgroundColor = dictString[i]["#text"];
					}
					else if(dictKey[i]["#text"] === "foreground" && dictString[i]["#text"].length < 8){ //$NON-NLS-0$
						newStyle.styles.color = dictString[i]["#text"];
					}
					else if(dictKey[i]["#text"] === "lineHighlight" && dictString[i]["#text"].length < 8){ //$NON-NLS-0$
						newStyle.styles.annotationLine.currentLine.backgroundColor = dictString[i]["#text"];
					}////annotationRange matchingSearch
					else if(dictKey[i]["#text"] === "selection" && dictString[i]["#text"].length < 8){ //$NON-NLS-0$
						newStyle.styles.annotationRange.matchingSearch.backgroundColor = dictString[i]["#text"];
						newStyle.styles.annotationRange.matchingSearch.currentSearch.backgroundColor = dictString[i]["#text"];
					}
				}
				//finds the scope attributes
				var restKey = themeJson.plist[1].dict.array.dict;
				for(var i = 1; i< restKey.length; i++){
					try{
						var target = restKey[i].string[0]["#text"].split(",");
						for (var k = 0; k < target.length; k++){
							var found = false;
							if(target[k].trim() === "Comment"){ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.comment.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.comment.block.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.comment.line.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.comment.color = restKey[i].dict.string["#text"];
										newStyle.styles.comment.block.color = restKey[i].dict.string["#text"];
										newStyle.styles.comment.line.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "Keyword"){ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.keyword.control.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.keyword.control.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "Variable" || target[k].trim() === "Function argument"){ //$NON-NLS-1$ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.variable.language.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.variable.other.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.variable.parameter.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.variable.language.color = restKey[i].dict.string["#text"];
										newStyle.styles.variable.other.color = restKey[i].dict.string["#text"];
										newStyle.styles.variable.parameter.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "Constant" || target[k].trim() === "Number"){ //$NON-NLS-1$ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.constant.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.constant.numeric.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.constant.numeric.hex.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.constant.color = restKey[i].dict.string["#text"];
										newStyle.styles.constant.numeric.color = restKey[i].dict.string["#text"];
										newStyle.styles.constant.numeric.hex.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "String"){ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.string.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.string.quoted.single.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.string.quoted.double.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.string.color = restKey[i].dict.string["#text"];
										newStyle.styles.string.quoted.single.color = restKey[i].dict.string["#text"];
										newStyle.styles.string.quoted.double.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "Storage" || target[k].trim() === "Storage type"){ //$NON-NLS-1$ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.keyword.operator.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.keyword.operator.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "Function" || target[k].trim() === "Entity" || target[k].trim() === "Function name"){ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.entity.name.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.entity.name["function"].color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.entity.name.color = restKey[i].dict.string["#text"];
											newStyle.styles.entity.name["function"].color = restKey[i].dict.string["#text"];
									}
								}
							}
							
							if(found === false)
								console.log("Theme scope ignored : " + target[k].trim()); //$NON-NLS-0$
						}
					}
					catch (e){
						console.log("Exception : " + e); //$NON-NLS-0$
					}
				}
			}
			else if (xml) {
				/* old-style theme definition */
				var newStyle = new StyleSet();
				
				newStyle.name = xml.getElementsByTagName("colorTheme")[0].attributes[1].value;
				newStyle.annotationRuler = xml.getElementsByTagName("background")[0].attributes[0].value; 
				newStyle.background = xml.getElementsByTagName("background")[0].attributes[0].value;
				newStyle.comment = xml.getElementsByTagName("singleLineComment")[0].attributes[0].value;
				newStyle.keyword = xml.getElementsByTagName("keyword")[0].attributes[0].value;
				newStyle.text = xml.getElementsByTagName("foreground")[0].attributes[0].value;
				newStyle.string = xml.getElementsByTagName("string")[0].attributes[0].value;
				newStyle.overviewRuler = xml.getElementsByTagName("background")[0].attributes[0].value;
				newStyle.lineNumberOdd = xml.getElementsByTagName("lineNumber")[0].attributes[0].value;
				newStyle.lineNumberEven = xml.getElementsByTagName("lineNumber")[0].attributes[0].value;
				newStyle.lineNumber = xml.getElementsByTagName("lineNumber")[0].attributes[0].value;
				newStyle.currentLine = xml.getElementsByTagName("selectionBackground")[0].attributes[0].value;
			} else {
				/* parsing the data as xml failed, now try the new-style theme definition (JSON) */
				try {
					newStyle = JSON.parse(body);
				} catch (e) {}
			}

			if (newStyle) {
				data.items.addTheme(newStyle);
			} else {
				// TODO no
			}
		}
		
		ThemeData.prototype.importTheme = importTheme;
		
		function processSettings(settings, preferences) {
			var themeClass = "editorTheme"; //$NON-NLS-0$
			var theme = mTextTheme.TextTheme.getTheme();
			theme.setThemeClass(themeClass, theme.buildStyleSheet(themeClass, settings));
		}

		ThemeData.prototype.processSettings = processSettings;

		return {
			ThemeData:ThemeData,
			getStyles:getStyles
		};
	}
);
