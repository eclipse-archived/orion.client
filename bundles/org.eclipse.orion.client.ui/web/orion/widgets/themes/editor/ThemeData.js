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
		'orion/webui/dialog',
		'orion/widgets/themes/ThemeVersion',
		'text!orion/widgets/themes/templates/ImportThemeDialogTemplate.html',
		'orion/widgets/themes/dialogs/urlImportDialog',
		'orion/objects'

], function(messages, mTextTheme, dialog, THEMES_VERSION, ImportThemeDialogTemplate, urlImportDialog, objects) {

	// *******************************************************************************
	//
	// If you change any styles in this file, you must increment the version number
	// in ThemeVersion.js.
	//
	// *******************************************************************************

		/* Synchronizing colors and styles for HTML, CSS and JS files like this ...
	
			Using Prospecto as an example:
			
			-----------------------------------------------
							CSS         HTML        JS
			-----------------------------------------------
			ORANGE          Class       Tag         Keyword
			darkSlateGray   Text        Text        Text
			darkSeaGreen    Comments    Comments    Comments
			cornFlowerblue  String      String      String
			----------------------------------------------- */
		
		var defaultFont = '"Consolas", "Monaco", "Vera Mono", monospace'; //$NON-NLS-0$
		var defaultFontSize = '12px'; //$NON-NLS-0$

		function ThemeData() {

			this.styles = [];
			
			var prospecto = { "className":"prospecto", "name":"Prospecto", "styles":{ "annotationLine":{ "currentLine":{ "backgroundColor":"#EAF2FE" } }, "annotationRange":{ "currentBracket":{ "backgroundColor":"#00FE00" }, "matchingBracket":{ "backgroundColor":"#00FE00" }, "matchingSearch":{ "backgroundColor":"#c3e1ff", "currentSearch":{ "backgroundColor":"#53d1ff" } }, "writeOccurrence":{ "backgroundColor":"#ffff00" } }, "backgroundColor":"#ffffff", "color":"#151515", "comment":{ "color":"#3C802C" }, "constant":{ "color":"#9932CC", "numeric":{ "color":"#9932CC", "hex":{ "color":"#9932CC" } } }, "entity":{ "name":{ "color":"#98937B", "function":{ "color":"#67BBB8", "fontWeight":"bold" } }, "other":{ "attribute-name":{ "color":"#5F9EA0" } } }, "fontFamily":defaultFont, "fontSize":defaultFontSize, "keyword":{ "control":{ "color":"#CC4C07", "fontWeight":"bold" }, "operator":{ "color":"#9F4177", "fontWeight":"bold" }, "other":{ "documentation":{ "color":"#7F9FBF", "task":{ "color":"#5595ff" } } } }, "markup":{ "bold":{ "fontWeight":"bold" }, "heading":{ "color":"#0000FF" }, "italic":{ "fontStyle":"italic" }, "list":{ "color":"#CC4C07" }, "other":{ "separator":{ "color":"#00008F" }, "strikethrough":{ "textDecoration":"line-through" }, "table":{ "color":"#3C802C" } }, "quote":{ "color":"#446FBD" }, "raw":{ "fontFamily":"monospace", "html":{ "backgroundColor":"#E4F7EF" } }, "underline":{ "link":{ "textDecoration":"underline" } } }, "meta":{ "documentation":{ "annotation":{ "color":"#7F9FBF" }, "tag":{ "color":"#7F7F9F" } }, "preprocessor":{ "color":"#A4A4A4" }, "tag":{ "color":"#CC4C07", "attribute":{ "color":"#93a2aa" } } }, "ruler":{ "annotations":{ "backgroundColor":"#ffffff" }, "backgroundColor":"#ffffff", "overview":{ "backgroundColor":"#ffffff" } }, "rulerLines":{ "color":"#CCCCCC" }, "string":{ "color":"#446FBD", "interpolated":{ "color":"#151515" } }, "support":{ "type":{ "propertyName":{ "color":"#9F4177" } } }, "textviewContent ::-moz-selection":{ "backgroundColor":"#b4d5ff" }, "textviewContent ::selection":{ "backgroundColor":"#b4d5ff" }, "textviewLeftRuler":{ "borderRight":"1px solid transparent" }, "textviewRightRuler":{ "borderLeft":"1px solid transparent" }, "textviewSelection":{ "backgroundColor":"#b4d5ff" }, "textviewSelectionUnfocused":{ "backgroundColor":"#b4d5ff" }, "variable":{ "language":{ "color":"#7F0055", "fontWeight":"bold" }, "other":{ "color":"#E038AD" }, "parameter":{ "color":"#D1416F" } } } };
			this.styles.push(prospecto);
	
			var darker = { "className":"darker", "name":"Darker", "styles":{ "annotationLine":{ "currentLine":{ "backgroundColor":"#171c20" } }, "annotationRange":{ "currentBracket":{ "backgroundColor":"#006E00" }, "currentSearch":{ "backgroundColor":"#5d5d5d" }, "matchingBracket":{ "backgroundColor":"#006E00" }, "matchingSearch":{ "backgroundColor":"#363636", "currentSearch":{ "backgroundColor":"#465e47" } }, "writeOccurrence":{ "backgroundColor":"#093f59" } }, "backgroundColor":"#1a1d1e", "color":"#dadada", "comment":{ "block":{ "color":"#5e7175" }, "color":"#5e7175", "line":{ "color":"#5e7175" } }, "constant":{ "color":"#c8333a", "numeric":{ "color":"#c8333a", "hex":{ "color":"#cd3f45" } } }, "entity":{ "name":{ "color":"#30a7d3", "function":{ "color":"#30a7d3", "fontWeight":"normal" } }, "other":{ "attribute-name":{ "color":"#5F9EA0" } } }, "fontFamily":defaultFont, "fontSize":defaultFontSize, "keyword":{ "control":{ "color":"#e8d075", "fontWeight":"normal" }, "operator":{ "color":"#91c23d", "fontWeight":"normal" }, "other":{ "documentation":{ "color":"#7F9FBF", "task":{ "color":"#8db6f1" } } } }, "markup":{ "bold":{ "fontWeight":"bold" }, "heading":{ "color":"#91c23d" }, "italic":{ "fontStyle":"italic" }, "list":{ "color":"#CC4C07" }, "other":{ "separator":{ "color":"#e8d075" }, "strikethrough":{ "textDecoration":"line-through" }, "table":{ "color":"#3C802C" } }, "quote":{ "color":"#55b5db" }, "raw":{ "fontFamily":"monospace", "html":{ "backgroundColor":"#3B4B53" } }, "underline":{ "link":{ "textDecoration":"underline" } } }, "meta":{ "documentation":{ "annotation":{ "color":"#7F9FBF" }, "tag":{ "color":"#7F7F9F" } }, "preprocessor":{ "color":"#A4A4A4" }, "tag":{ "color":"#999999", "attribute":{ "color":"#07e2d9" } } }, "ruler":{ "annotations":{ "backgroundColor":"#0f1113" }, "backgroundColor":"#0f1113", "overview":{ "backgroundColor":"#0f1113" } }, "rulerLines":{ "color":"#3d4750", "even":{ "color":"#3d4750" }, "odd":{ "color":"#3d4750" } }, "string":{ "color":"#55b5db", "interpolated":{ "color":"#dadada" }, "quoted":{ "double":{ "color":"#55b5db" }, "single":{ "color":"#55b5db" } } }, "support":{ "type":{ "propertyName":{ "color":"#9fca56" } } }, "textviewContent ::-moz-selection":{ "backgroundColor":"#317370" }, "textviewContent ::selection":{ "backgroundColor":"#317370" }, "textviewLeftRuler":{ "borderRight":"1px solid #0e1112" }, "textviewRightRuler":{ "borderLeft":"1px solid #0e1112" }, "textviewSelection":{ "backgroundColor":"#317370" }, "textviewSelectionUnfocused":{ "backgroundColor":"#317370" }, "variable":{ "language":{ "color":"#9fca56", "fontWeight":"normal" }, "other":{ "color":"#E038AD" }, "parameter":{ "color":"#FF8C00" } } } };
			this.styles.push(darker);
		}
		
		function getStyles(){
			return this.styles;
		}
		
		ThemeData.prototype.styles = [];
		ThemeData.prototype.getStyles = getStyles;
		
		function getProtectedThemes() {
			return ["Prospecto", "Darker"]; //$NON-NLS-1$ //$NON-NLS-0$
		}

		ThemeData.prototype.getProtectedThemes = getProtectedThemes;

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
		
		function rulesForCssText (styleContent) {
			var doc = document.implementation.createHTMLDocument(""),
				styleElement = document.createElement("style");
			
			styleElement.textContent = styleContent;
			// the style will only be parsed once it is added to a document
			doc.body.appendChild(styleElement);
		
			return styleElement.sheet.cssRules;
		}

		var ImportThemeDialog = function(options) {
			options = options || {};
			this.options = options;
			objects.mixin(this, options);
			this._init(options);
		};
		ImportThemeDialog.prototype = new dialog.Dialog();
		objects.mixin(ImportThemeDialog.prototype, {
			TEMPLATE: ImportThemeDialogTemplate,
			_init: function(options) {
				this.title = messages["Import a theme"]; //$NON-NLS-1$
				this.buttons = [
					/*{ text: "Import from a URL", callback: this.urlButtonClicked.bind(this), id: "urlThemeImportBtn" }, Hidden for now*/
					{ text: messages["Import"], callback: this.importFromTextarea.bind(this), id: "textAreaImportBtn" }, //$NON-NLS-1$
					{ text: messages["Close"], callback: this.closeButtonClicked.bind(this) }
				];
				this.modal = true;

				this._initialize();
			},
			_bindToDom: function() {
				this.$importButton = this.$buttonContainer.firstChild;
				this.$importButton.classList.add('disabled'); //$NON-NLS-0$

				this.appendThemeList();
			},
			appendThemeList: function() {
				var self = this;

				var docFragment = document.createDocumentFragment(),
					dropZone = document.createElement("div"), //$NON-NLS-0$
					textBox = document.createElement("textarea"); //$NON-NLS-0$

				dropZone.className = "drop-zone"; //$NON-NLS-0$
				dropZone.id = "dropZone"; //$NON-NLS-0$
				dropZone.textContent = messages["dndTheme"];
				docFragment.appendChild(dropZone);

				dropZone.addEventListener("dragenter", self.dragEnter.bind(self)); //$NON-NLS-0$
				dropZone.addEventListener("dragleave", self.dragLeave.bind(self)); //$NON-NLS-0$
				dropZone.addEventListener("dragover", self.dragOver.bind(self)); //$NON-NLS-0$
				dropZone.addEventListener("drop", self.dragAndDropped.bind(self)); //$NON-NLS-0$

				textBox.rows = "4"; //$NON-NLS-0$
				textBox.cols = "35"; //$NON-NLS-0$
				textBox.placeholder = messages["textTheme"];
				textBox.id = "themeText"; //$NON-NLS-0$
				textBox.tabIndex = "-1"; //$NON-NLS-0$
				textBox.addEventListener("input", self.watchTextarea.bind(this)); //$NON-NLS-0$

				docFragment.appendChild(textBox);
				self.$importThemeMessage.innerHTML = messages["ImportThemeDialogMessage"];
				self.$importThemeContainer.appendChild(docFragment, null);
			},
			watchTextarea: function() {
				var textArea = document.getElementById("themeText"); //$NON-NLS-0$
				if (textArea.value.length > 0) {
					this.$importButton.classList.remove("disabled"); //$NON-NLS-0$
				} else {
					this.$importButton.classList.add("disabled"); //$NON-NLS-0$
				}
			},
			dragEnter: function(e) {
				var dropZone = document.getElementById("dropZone"); //$NON-NLS-0$
				dropZone.className = "drop-zone over"; //$NON-NLS-0$
			},
			dragLeave: function(e) {
				var dropZone = document.getElementById("dropZone"); //$NON-NLS-0$
				dropZone.className = "drop-zone"; //$NON-NLS-0$
			},
			dragOver: function(e) {
				e.stopPropagation();
				e.preventDefault();
				e.dataTransfer.dropEffect = "copy"; //$NON-NLS-0$
			},
			dragAndDropped: function(e) {
				e.stopPropagation();
				e.preventDefault();

				var file = e.dataTransfer.files[0],
					reader = new FileReader(),
					self = this;

				reader.onloadend = function(e) {
					if (e.target.readyState == FileReader.DONE) {
						var dropZone = document.getElementById("dropZone"); //$NON-NLS-0$
						dropZone.className = "drop-zone"; //$NON-NLS-0$
						self.importTheme(self, e.target.result);
					}
				};
				reader.readAsText(file);
			},
			importFromTextarea: function() {
				var styles = document.getElementById("themeText").value; //$NON-NLS-0$
				if (styles.length) {
					this.importTheme(this, styles);
				}
			},
			importTheme: function(commandInvocation, styles) {
				importTheme(commandInvocation, styles);
			},
			closeButtonClicked: function() {
				this.hide();
			},
			urlButtonClicked: function() {
				var importURLdialog = new urlImportDialog.showUrlImportDialog({
					title: "Import theme from a URL",
					message: "A friendly explanation for the urls that can be used goes here",
					func: this.onURL.bind(this, "Message to send")
				});
				this._addChildDialog(importURLdialog);
				importURLdialog.show();

			},
			onURL: function(huy, url) {
				alert(huy + " this.onURL.bind");
				alert(url);
			}
		});

		function showImportThemeDialog(data) {
			var dialog = new ImportThemeDialog(data);
			dialog.show();
		}
		ThemeData.prototype.showImportThemeDialog = showImportThemeDialog;
		
		function importTheme(data, styles) {
			var body = styles;
			var xml = parseToXML(body);
			var rules = rulesForCssText(body);
			
			if(rules.length !== 0){
				var newStyle = {"className":"default","name":"default","styles":{"annotationLine":{"currentLine":{"backgroundColor":"#EAF2FE"}},"annotationRange":{"currentBracket":{"backgroundColor":"#00FE00"},"matchingBracket":{"backgroundColor":"#00FE00"},"matchingSearch":{"backgroundColor":"#c3e1ff","currentSearch":{"backgroundColor":"#53d1ff"}},"writeOccurrence":{"backgroundColor":"#ffff00"}},"backgroundColor":"#ffffff","color":"#151515","comment":{"color":"#3C802C"},"constant":{"color":"#9932CC","numeric":{"color":"#9932CC","hex":{"color":"#9932CC"}}},"entity":{"name":{"color":"#98937B","function":{"color":"#67BBB8","fontWeight":"bold"}},"other":{"attribute-name":{"color":"#5F9EA0"}}},"fontFamily":"\"Consolas\", \"Monaco\", \"Vera Mono\", monospace","fontSize":"12px","keyword":{"control":{"color":"#CC4C07","fontWeight":"bold"},"operator":{"color":"#9F4177","fontWeight":"bold"},"other":{"documentation":{"color":"#7F9FBF","task":{"color":"#5595ff"}}}},"markup":{"bold":{"fontWeight":"bold"},"heading":{"color":"blue"},"italic":{"fontStyle":"italic"},"list":{"color":"#CC4C07"},"other":{"separator":{"color":"#00008F"},"strikethrough":{"textDecoration":"line-through"},"table":{"color":"#3C802C"}},"quote":{"color":"#446FBD"},"raw":{"fontFamily":"monospace"},"underline":{"link":{"textDecoration":"underline"}}},"meta":{"documentation":{"annotation":{"color":"#7F9FBF"},"tag":{"color":"#7F7F9F"}},"tag":{"color":"#CC4C07"}},"ruler":{"annotations":{"backgroundColor":"#ffffff"},"backgroundColor":"#ffffff","overview":{"backgroundColor":"#ffffff"}},"rulerLines":{"color":"#CCCCCC"},"string":{"color":"#446FBD"},"support":{"type":{"propertyName":{"color":"#9F4177"}}},"textviewContent ::-moz-selection":{"backgroundColor":"#b4d5ff"},"textviewContent ::selection":{"backgroundColor":"#b4d5ff"},"textviewLeftRuler":{"borderRight":"1px solid transparent"},"textviewRightRuler":{"borderLeft":"1px solid transparent"},"textviewSelection":{"backgroundColor":"#b4d5ff"},"textviewSelectionUnfocused":{"backgroundColor":"#b4d5ff"},"variable":{"language":{"color":"#7F0055","fontWeight":"bold"},"other":{"color":"#E038AD"},"parameter":{"color":"#D1416F"}}}};
					
				for (var i = 0; i< rules.length; i++){
					var classes = rules[i].selectorText.split(",");
					for (var l = 0; l< classes.length; l++){
						try{
							classes[l] = classes[l].trim();
							if (classes[l].substr(classes[l].length - 10) === "CodeMirror"){ //$NON-NLS-0$
								if(rules[i].style.background){
									newStyle.styles.background = colorToHex(rules[i].style.background);
								}
								if(rules[i].style.color){
									newStyle.styles.color = colorToHex(rules[i].style.color); 
								}
							}
							else if (classes[l].substr(classes[l].length - 8) === "-comment"){ //$NON-NLS-0$
								if(rules[i].style.color){
									newStyle.styles.comment.color = colorToHex(rules[i].style.color);
									newStyle.styles.comment.block.color = colorToHex(rules[i].style.color);
									newStyle.styles.comment.line.color = colorToHex(rules[i].style.color);
								}
							}
							else if(classes[l].substr(classes[l].length - 7) === "-string"){ //$NON-NLS-0$
								if(rules[i].style.color){
									newStyle.styles.string.color = colorToHex(rules[i].style.color);
									newStyle.styles.string.quoted.single.color = colorToHex(rules[i].style.color);
									newStyle.styles.string.quoted.double.color = colorToHex(rules[i].style.color);
								}
							}
							else if(classes[l].substr(classes[l].length - 7) === "-number" || classes[l].substr(classes[l].length - 5) === "-atom"){ //$NON-NLS-1$ //$NON-NLS-0$
								if(rules[i].style.color){
									newStyle.styles.constant.color = colorToHex(rules[i].style.color);
									newStyle.styles.constant.numeric.color = colorToHex(rules[i].style.color);
									newStyle.styles.constant.numeric.hex.color = colorToHex(rules[i].style.color);
								}
							}
							else if(classes[l].substr(classes[l].length - 4) === "-def"){ //$NON-NLS-0$
								if(rules[i].style.color){
									newStyle.styles.entity.name.color = colorToHex(rules[i].style.color);
									newStyle.styles.entity.name["function"].color = colorToHex(rules[i].style.color);
									newStyle.styles.variable.parameter.color = colorToHex(rules[i].style.color);
									newStyle.styles.variable.other.color = colorToHex(rules[i].style.color);
									newStyle.styles.variable.language.color = colorToHex(rules[i].style.color);
								}
							}
							else if(classes[l].substr(classes[l].length - 8) === "-keyword"){ //$NON-NLS-0$
								if(rules[i].style.color){
									newStyle.styles.keyword.control.color = colorToHex(rules[i].style.color);
									newStyle.styles.keyword.operator.color = colorToHex(rules[i].style.color);
								}
							}
							else if(classes[l].indexOf("activeline") > -1){ //$NON-NLS-0$
								if(rules[i].style.backgroundColor){
									newStyle.styles.annotationLine.currentLine.backgroundColor = colorToHex(rules[i].style.backgroundColor);
								}
							}
							else if(classes[l].substr(classes[l].length - 8) === "-gutters"){ //$NON-NLS-0$
								if(rules[i].style.backgroundColor){
									newStyle.styles.ruler.backgroundColor = colorToHex(rules[i].style.backgroundColor);
									newStyle.styles.ruler.overview.backgroundColor = colorToHex(rules[i].style.backgroundColor);
									newStyle.styles.ruler.annotations.backgroundColor = colorToHex(rules[i].style.backgroundColor);
								}
								if(rules[i].style.color){
									newStyle.styles.rulerLines.odd.color = colorToHex(rules[i].style.color);
									newStyle.styles.rulerLines.even.color = colorToHex(rules[i].style.color);
									newStyle.styles.rulerLines.color = colorToHex(rules[i].style.color);
								}
							}
							else if(classes[l].substr(classes[l].length - 5) === "-meta"){ //$NON-NLS-0$
								if(rules[i].style.color){
									newStyle.styles.meta.documentation.annotation.color = colorToHex(rules[i].style.color);
								}
							}
							else if(classes[l].substr(classes[l].length - 8) === "-bracket"){ //$NON-NLS-0$
								if(rules[i].style.color){
									newStyle.styles.punctuation.block.color = colorToHex(rules[i].style.color);
								}
							}
						}catch(e){}
					}
				}
			}
			else if(xml && xml.children[0].tagName === "plist"){ //$NON-NLS-0$ //assume it uses tmTheme structure [sublime, textmate, etc]
				var themeJson = xmlToJson(xml); //convert to Json
				var newStyle = {"className":"default","name":"default","styles":{"annotationLine":{"currentLine":{"backgroundColor":"#EAF2FE"}},"annotationRange":{"currentBracket":{"backgroundColor":"#00FE00"},"matchingBracket":{"backgroundColor":"#00FE00"},"matchingSearch":{"backgroundColor":"#c3e1ff","currentSearch":{"backgroundColor":"#53d1ff"}},"writeOccurrence":{"backgroundColor":"#ffff00"}},"backgroundColor":"#ffffff","color":"#151515","comment":{"color":"#3C802C"},"constant":{"color":"#9932CC","numeric":{"color":"#9932CC","hex":{"color":"#9932CC"}}},"entity":{"name":{"color":"#98937B","function":{"color":"#67BBB8","fontWeight":"bold"}},"other":{"attribute-name":{"color":"#5F9EA0"}}},"fontFamily":"\"Consolas\", \"Monaco\", \"Vera Mono\", monospace","fontSize":"12px","keyword":{"control":{"color":"#CC4C07","fontWeight":"bold"},"operator":{"color":"#9F4177","fontWeight":"bold"},"other":{"documentation":{"color":"#7F9FBF","task":{"color":"#5595ff"}}}},"markup":{"bold":{"fontWeight":"bold"},"heading":{"color":"blue"},"italic":{"fontStyle":"italic"},"list":{"color":"#CC4C07"},"other":{"separator":{"color":"#00008F"},"strikethrough":{"textDecoration":"line-through"},"table":{"color":"#3C802C"}},"quote":{"color":"#446FBD"},"raw":{"fontFamily":"monospace"},"underline":{"link":{"textDecoration":"underline"}}},"meta":{"documentation":{"annotation":{"color":"#7F9FBF"},"tag":{"color":"#7F7F9F"}},"tag":{"color":"#CC4C07"}},"ruler":{"annotations":{"backgroundColor":"#ffffff"},"backgroundColor":"#ffffff","overview":{"backgroundColor":"#ffffff"}},"rulerLines":{"color":"#CCCCCC"},"string":{"color":"#446FBD"},"support":{"type":{"propertyName":{"color":"#9F4177"}}},"textviewContent ::-moz-selection":{"backgroundColor":"#b4d5ff"},"textviewContent ::selection":{"backgroundColor":"#b4d5ff"},"textviewLeftRuler":{"borderRight":"1px solid transparent"},"textviewRightRuler":{"borderLeft":"1px solid transparent"},"textviewSelection":{"backgroundColor":"#b4d5ff"},"textviewSelectionUnfocused":{"backgroundColor":"#b4d5ff"},"variable":{"language":{"color":"#7F0055","fontWeight":"bold"},"other":{"color":"#E038AD"},"parameter":{"color":"#D1416F"}}}}; //$NON-NLS-0$
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
							
							if(found === false){
								//console.log("Theme scope ignored : " + target[k].trim()); //$NON-NLS-0$
							}
						}
					}
					catch (e){
						//console.log("Exception : " + e); //$NON-NLS-0$
					}
				}
			}
			else if (xml && xml.children[0].tagName === "colorTheme") { //this is an Eclipse theme
				ThemeData();
				var defaultStyles = getStyles();
				var newStyle = defaultStyles[0];

				newStyle.name = xml.getElementsByTagName("colorTheme")[0].attributes[1].value;
				newStyle.className = xml.getElementsByTagName("colorTheme")[0].attributes[1].value;

				var styles = newStyle.styles;

				// Set the background and text colors
				styles.backgroundColor = getValuesFromXML(xml, "background");
				styles.color = getValuesFromXML(xml, "foreground");

				styles.comment.color = getValuesFromXML(xml, "singleLineComment");
				styles.annotationLine.currentLine.backgroundColor = getValuesFromXML(xml, "currentLine");

				// Eclipse themes do not set the background color for matching brackets. Instead, they set a border for the matching bracket.
				styles.annotationRange.matchingBracket.backgroundColor = "transparent";
				styles.annotationRange.currentBracket.backgroundColor = styles.annotationRange.matchingBracket.backgroundColor;
				styles.annotationRange.matchingBracket.borderColor = getValuesFromXML(xml, "bracket");
				styles.annotationRange.matchingBracket.borderWidth = "1px";
				styles.annotationRange.matchingBracket.borderStyle = "solid";

				// Set the bracket color to be the same as border color
				styles.punctuation = {};
				styles.punctuation.section = {};
				styles.punctuation.section.color = styles.annotationRange.matchingBracket.borderColor;


				styles.annotationRange.writeOccurrence.backgroundColor = getValuesFromXML(xml, "writeOccurrenceIndication");
				styles.constant.color = getValuesFromXML(xml, "constant");
				styles.entity.name.color = getValuesFromXML(xml, "class");
				styles.entity.name.function.color = getValuesFromXML(xml, "class");
				styles.entity.name.function.fontWeight = getValuesFromXML(xml, "class", 1);
				styles.entity.other["attribute-name"].color = styles.entity.name.function.color;
				styles.keyword.control.color = getValuesFromXML(xml, "keyword");
				styles.keyword.control.fontWeight = getValuesFromXML(xml, "keyword", 1);
				styles.keyword.operator.color = styles.keyword.control.color;

				// Set language variable to the same color as keywords since Eclipse doesn't make a distrinction between the two
				styles.variable.language.color = styles.keyword.operator.color;

				// Setting JAVA-specific keyword styling for certain words
				styles.constantDeclaration = {};
				styles.constantDeclaration.keyword = {};
				styles.constantDeclaration.keyword.color = getValuesFromXML(xml, "sourceHoverBackground");

				// "TO DO" task styling
				styles.keyword.other.documentation.task.color = getValuesFromXML(xml, "commentTaskTag");

				// HTML styling
				styles.meta.tag.color = getValuesFromXML(xml, "localVariable");
				styles.meta.tag.doctype = {};
				styles.meta.tag.doctype.color = getValuesFromXML(xml, "method");


				styles.string.color = getValuesFromXML(xml, "string");

				// Jade-specific. Eclipse themes don't know about Jade
				styles.string.interpolated.color = styles.string.color;

				// Setting the CSS property name color to string color since Eclipse themese don't style CSS
				styles.support.type.propertyName.color = styles.string.color;

				// Eclipse themes set a different color specifically for numeric values.
				styles.constant.numeric = {};
				styles.constant.numeric.color = getValuesFromXML(xml, "number");

				styles.textviewSelection.backgroundColor = getValuesFromXML(xml, "selectionBackground");
				styles["textviewContent ::selection"].backgroundColor = styles.textviewSelection.backgroundColor;
				styles["textviewContent ::-moz-selection"].backgroundColor = styles.textviewSelection.backgroundColor;

				styles.textviewSelection.color = getValuesFromXML(xml, "selectionForeground");
				styles["textviewContent ::selection"].color = styles.textviewSelection.selectionForeground;
				styles["textviewContent ::-moz-selection"].color = styles.textviewSelection.selectionForeground;

				// No quicksearch in Eclipse, so setting the search background same as selection background
				styles.annotationRange.matchingSearch.backgroundColor = styles.textviewSelection.backgroundColor;
				styles.annotationRange.matchingSearch.currentSearch.backgroundColor = styles.textviewSelection.backgroundColor;

				// No ruler background styling in Eclipse so settings the styles same as regular background
				styles.ruler.annotations.backgroundColor = styles.backgroundColor;
				styles.ruler.backgroundColor = styles.backgroundColor;
				styles.ruler.overview.backgroundColor = styles.backgroundColor;

				styles.rulerLines.color = getValuesFromXML(xml, "lineNumber");
			} else {
				/* parsing the data as xml failed, now try the new-style theme definition (JSON) */
				try {
					newStyle = JSON.parse(body);
				} catch (e) {}
			}

			if (newStyle) {
				data.options.items.addTheme(newStyle);
				data.hide();
			} else {
				if (!document.getElementById("themeImportError")) {
					var docFragment = document.createDocumentFragment(),
						errorContainer = document.createElement("div"); //$NON-NLS-0$

					errorContainer.className = "error"; //$NON-NLS-0$
					errorContainer.id = "themeImportError"; //$NON-NLS-0$
					errorContainer.textContent = messages["ImportThemeError"];
					docFragment.appendChild(errorContainer);

					document.getElementById("importThemeContainer").appendChild(docFragment, null); //$NON-NLS-0$
				}
			}
		}
		ThemeData.prototype.importTheme = importTheme;

		function getValuesFromXML(xml, tagName, attrId) {
			var attr = attrId || 0;
			var element = xml.getElementsByTagName(tagName)[0],
				returnValue;

			if (element) {
				var elementAttribute = element.attributes[attr] !== undefined ? element.attributes[attr] : false;
				if (elementAttribute && elementAttribute.name === "bold" && elementAttribute.value === "true") {
					return "bold";
				} else if (elementAttribute && elementAttribute.name === "bold" && elementAttribute.value === "false") {
					return "normal";
				}


				returnValue = elementAttribute !== undefined ? elementAttribute.value : "normal";
				return returnValue;
			}
		}
		ThemeData.prototype.getValuesFromXML = getValuesFromXML;

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
