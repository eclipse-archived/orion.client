/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/

define(['i18n!orion/settings/nls/messages', 
		'orion/commands', 
		'orion/commandRegistry', 
		'orion/webui/littlelib', 
		'orion/widgets/themes/editor/editorSetup',
		'orion/widgets/themes/colors',
		'orion/util',
		'text!examples/js-demo.js',
		'text!examples/html-demo.html',
		'text!examples/css-demo.css',
		'text!examples/java-demo.java'],
function(messages, mCommands, mCommandRegistry, lib, mSetup, colors, util, jsExample, htmlExample, cssExample, javaExample) {

	var editorLanguage, editorTheme, originalTheme, currentTheme, revertBtn, deleteBtn ,saveBtn, themeNameInput;
	var protectedThemes = [];
	var defaultColor = "#ff80c0";
	var scopeList = [
		{
			display:"font size", //$NON-NLS-0$
			objPath:["styles.fontSize"], //$NON-NLS-0$
			id:"editorThemeFontSize", //$NON-NLS-0$
			value:"" //$NON-NLS-0$
		},{
			display:"background", //$NON-NLS-0$
			objPath:["styles.backgroundColor"], //$NON-NLS-0$
			id:"editorThemeBackground", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"font-color", //$NON-NLS-0$
			objPath:["styles.color"], //$NON-NLS-0$
			id:"editorThemeColor", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"ruler background", //$NON-NLS-0$
			objPath:["styles.ruler.backgroundColor", "styles.ruler.overview.backgroundColor","styles.ruler.annotations.backgroundColor"],  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			id:"editorThemeRulerBackground", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"ruler color",//$NON-NLS-0$
			objPath:["styles.rulerLines.color","styles.rulerLines.odd.color","styles.rulerLines.even.color"],  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			id:"editorThemeRulerColor", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"current line background",//$NON-NLS-0$
			objPath:["styles.annotationLine.currentLine.backgroundColor"],  //$NON-NLS-0$
			id:"editorThemeColorCurrentLineBackground",  //$NON-NLS-0$
			value:defaultColor
		},{
			display:"comment",//$NON-NLS-0$
			objPath:["styles.comment.color","styles.comment.block.color","styles.comment.line.color"],  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			id:"editorThemeCommentColor",  //$NON-NLS-0$
			value:defaultColor
		},{
			display:"constant",//$NON-NLS-0$
			objPath:["styles.constant.color","styles.constant.numeric.color","styles.constant.numeric.numeric.hex.color"], //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			id:"editorThemeConstantColor",  //$NON-NLS-0$
			value:defaultColor
		},{
			display:"entity",//$NON-NLS-0$
			objPath:["styles.entity.name.color","styles.entity.name.function.color"], //$NON-NLS-1$ //$NON-NLS-0$
			id:"editorThemeColorEntityColor",  //$NON-NLS-0$
			value:defaultColor
		},{
			display:"keyword-control",//$NON-NLS-0$
			objPath:["styles.keyword.control.color"], //$NON-NLS-0$
			id:"editorThemeControlColor", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"keyword-operator",//$NON-NLS-0$
			objPath:["styles.keyword.operator.color"], //$NON-NLS-0$
			id:"editorThemeOperatorColor", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"function parameter",//$NON-NLS-0$
			objPath:["styles.variable.parameter.color"], //$NON-NLS-0$
			id:"editorThemeFunctionParameterColor", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"write occurrence background", //$NON-NLS-0$
			objPath:["styles.annotationRange.writeOccurrence.backgroundColor"], //$NON-NLS-0$
			id:"editorThemeWriteOccurrence", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"matching bracket background",//$NON-NLS-0$
			objPath:["styles.annotationRange.matchingBracket.backgroundColor", "styles.annotationRange.currentBracket.backgroundColor"],  //$NON-NLS-0$
			id:"editorThemeMatchingBracket", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"matching search background",//$NON-NLS-0$
			objPath:["styles.annotationRange.matchingSearch.backgroundColor"], //$NON-NLS-0$
			id:"editorThemeMatchingSearch", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"current search background",//$NON-NLS-0$
			objPath:["styles.annotationRange.matchingSearch.currentSearch.backgroundColor"], //$NON-NLS-0$
			id:"editorThemeCurrentSearch", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"documentation task color",//$NON-NLS-0$
			objPath:["styles.keyword.other.documentation.task.color"], //$NON-NLS-0$
			id:"editorThemeDocumentationTask", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"CSS - Property name color",//$NON-NLS-0$
			objPath:["styles.support.type.propertyName.color"], //$NON-NLS-0$
			id:"editorThemePropertyName", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"HTML - Tag",//$NON-NLS-0$
			objPath:["styles.meta.tag.color"], //$NON-NLS-0$
			id:"editorThemeMetaTag", //$NON-NLS-0$
			value:defaultColor
		},{
			display:"Selection Background",//$NON-NLS-0$
			objPath:["styles.textviewContent ::selection.backgroundColor", "styles.textviewContent ::-moz-selection.backgroundColor", "styles.textviewSelection.backgroundColor", "styles.textviewSelectionUnfocused.backgroundColor"], //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			id:"editorSelection", //$NON-NLS-0$
			value:defaultColor
		}
	];
	
	//initializes the default html structure
	function init() {
		ThemeBuilder.prototype.template = "<div class='editorSection'>" + //$NON-NLS-0$
												"<div class='editorSectionHeader'>" +
													"<span>${Display Language : }</span>" + 
													"<select id='editorLanguage'>" + 
														"<option value='javascript' selected='selected'>javascript</option>" +
														"<option value='java'>java</option>" +
														"<option value='html'>HTML</option>" +
														"<option value='css'>CSS</option>" +
													"</select>" + 
												"</div>" +
												"<div id='editor' class='themeDisplayEditor' class='editor_group'></div>" +
											"</div>";//$NON-NLS-0$
		//populate list of changable scopes for the theme
		populateScopes();
	}
	
	//populates theme selections 
	function populateThemes(){
		this.preferences.getTheme(function(themeStyles) {
			var selectElement = document.getElementById('editorTheme');//$NON-NLS-0$
			while (selectElement.hasChildNodes() ){
				selectElement.removeChild(selectElement.lastChild);
			}
			for (var i =0; i < themeStyles.styles.length; i++) {
				var option = document.createElement('option');
				option.setAttribute('value', themeStyles.styles[i].name);
				//checks if a theme is the current theme 
				if (themeStyles.styles[i].name === themeStyles.style.name){
					option.setAttribute('selected', 'true');
				}
				option.appendChild(document.createTextNode(themeStyles.styles[i].name));
				selectElement.appendChild(option);
			}
			this.selectTheme(themeStyles.style.name);
		}.bind(this));
	}
	ThemeBuilder.prototype.populateThemes = populateThemes;
	
	//initialize html structure for listing changable scopes for the theme (left side)
	function populateScopes(){
		ThemeBuilder.prototype.template = 
			'<div class="themeController">' +//$NON-NLS-0$
				'<div class="scopeListHeader" id="scopeOriginal">'+
					'<span>${Theme : }</span>' + 
					'<select id="editorTheme">' +
					'</select>'+
					'<button id="editorThemeDelete" class="editorThemeCleanButton"><span class="core-sprite-trashcan editorThemeButton"></span></button>'+
				'</div>' +
				'<div class="scopeListHeader hide" id="scopeChanged">'+
					'<span> Theme : </span>' + 
					'<input id="editorThemeName" type="text">' +
					'<button id="editorThemeSave" class="editorThemeCleanButton"><span class="core-sprite-save editorThemeButton"></span></button>'+
					'<button id="editorThemeRevert" class="editorThemeCleanButton"><span class="git-sprite-revert editorThemeButton"></span></button>'+
				'</div>' +
				'<ul class="scopeList" id="scopeList">' +
					generateScopeList() +
				'</ul>' +
			'</div>' +//$NON-NLS-0$
			ThemeBuilder.prototype.template;
	}
	
	//adds status class to scopes 
	function checkForChanges(){
		var changed = false;
		for (var i = 0; i < scopeList.length; i++){
			// if a scope is modified
			if (getValueFromPath(currentTheme, scopeList[i].objPath[0]) !== getValueFromPath(originalTheme, scopeList[i].objPath[0])){
				document.getElementById("scopeList").childNodes[i].classList.add('modified');//$NON-NLS-1$ //$NON-NLS-0$
				changed = true;
			}
			else {
				document.getElementById("scopeList").childNodes[i].classList.remove('modified');//$NON-NLS-1$ //$NON-NLS-0$
			}
		}
		//when there is a changed value, theme is now deletable/revertable/renamable
		if (changed){
			document.getElementById("scopeChanged").classList.remove('hide');//$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById("scopeOriginal").classList.add('hide');//$NON-NLS-1$ //$NON-NLS-0$
		}
		else {
			document.getElementById("scopeChanged").classList.add('hide');//$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById("scopeOriginal").classList.remove('hide');//$NON-NLS-1$ //$NON-NLS-0$
		}
	}

	function namedToHex(val) {
		var lowerCaseVal = val.toLowerCase();

		if (colors.hasOwnProperty(lowerCaseVal)) {
			return colors[lowerCaseVal];
		}

		return val;
	}

	function updateScopeValue(id, val){
		val = namedToHex(val);
		var isHexColor = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(val);

		if (isHexColor || id === "editorThemeFontSize") {
			for (var i = 0; i < scopeList.length; i++){
				if (scopeList[i].id === id){
					scopeList[i].value = val;
					document.getElementById(scopeList[i].id).value = val; /* in case a color name was entered change it to hex */
					for (var l = 0; l < scopeList[i].objPath.length; l++){
						setValueToPath(currentTheme, scopeList[i].objPath[l], scopeList[i].value);
					}
					mSetup.processTheme("editorTheme", currentTheme); //$NON-NLS-0$
				}
			}
			checkForChanges();
		} else {
			for (i = 0; i < scopeList.length; i++){
				if (scopeList[i].id === id) { //Resets the value back to its original value if the typed value was invalid
					document.getElementById(scopeList[i].id).value = scopeList[i].value;
				}
			}
		}
	}
	ThemeBuilder.prototype.updateScopeValue = updateScopeValue;
	
	function getValueFromPath(obj, keys) {
		var nodes = keys.split('.');
		for (var i = 0; i < nodes.length; i++) {
			if (!obj[nodes[i]]) {
				return "";
			}
			obj = obj[nodes[i]];
		}
		return obj;
	}
	
	function setValueToPath (obj, path, val){
		var nodes = path.split('.');
		try {
			for (var i = 0; i < nodes.length - 1; i++) {
				obj = obj[nodes[i]] || (obj[nodes[i]] = {});
			}
			obj[nodes[i]] = val;
		} catch (e) {
			return false;
		}
	}
		
	//updates the theme object with right values
	function apply() {
		document.getElementById("editorThemeName").value = currentTheme.name; //$NON-NLS-0$
		for (var i = 0; i < scopeList.length; i++){
			scopeList[i].value = defaultColor; // scopes with no value will have defaultColor showing
			for (var l = 0; l < scopeList[i].objPath.length; l++){
				var temp = getValueFromPath(currentTheme,scopeList[i].objPath[l]);
				if (temp){
					scopeList[i].value = temp;
				}
			}
		}
		for (i = 0; i < scopeList.length; i++){
			document.getElementById(scopeList[i].id).value = scopeList[i].value; // updates the input[type=color] with correct color
		}
		checkForChanges(); // checks if any value is changed
	}
	ThemeBuilder.prototype.apply = apply;
	
	//generates the html structure for list of scopes
	function generateScopeList(){
		var htmlString = "";
		var ieClass = util.isIE ? "-ie" : ""; //$NON-NLS-0$

		for (var i = 0; i < scopeList.length; i++){
			if (scopeList[i].id === "editorThemeFontSize"){
				htmlString = htmlString + "<li><span>" + scopeList[i].display + "</span><select id='editorThemeFontSize'>";
				for (var l = 8; l < 19; l++){
					htmlString = htmlString + "<option value='" + l+"px'>"+l+"px</option>";
				}
				for(l = 8; l < 19; l++){
					htmlString = htmlString + "<option value='" + l+"pt'>"+l+"pt</option>";
				}
				htmlString += "</select></li>";//$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
			else
				htmlString = htmlString + "<li><span>" + scopeList[i].display + "</span><input id='"+scopeList[i].id+"' class='colorpicker-input" + ieClass + "' type='color' value='" + scopeList[i].value + "'></li>";//$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		}
		return htmlString;
	}
	
	function ThemeBuilder(args) {
		this.settings = {};
		this.themeData = args.themeData;
		this.toolbarId = args.toolbarId;
		this.serviceRegistry = args.serviceRegistry;
		protectedThemes = this.themeData ? (this.themeData.getProtectedThemes ? this.themeData.getProtectedThemes() : []) : [];
		this.messageService = this.serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$

		init();

		var commandTemplate = '<div id="commandButtons">' + //$NON-NLS-0$
			'<div id="userCommands" class="layoutRight sectionActions"></div>' +
			'</div>'; //$NON-NLS-0$

		var commandArea = document.getElementById('pageActions'); //$NON-NLS-0$
		commandArea.innerHTML = commandTemplate;

		this.commandService = args.commandService;
		this.preferences = args.preferences;

		var exportCommand = new mCommands.Command({
			name: messages.Export,
			tooltip: messages['Export a theme'], //$NON-NLS-0$
			id: "orion.exportTheme", //$NON-NLS-0$
			callback: exportTheme
		});

		this.commandService.addCommand(exportCommand);
		this.commandService.registerCommandContribution('themeCommands', "orion.exportTheme", 5); //$NON-NLS-1$ //$NON-NLS-0$
	}
	
	function addAdditionalCommand(commandData) {
		var commitMessageParameters = new mCommandRegistry.ParametersDescription(
			[new mCommandRegistry.CommandParameter('name', 'text', messages['Commit message:'], "", 4)], //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
			{
				hasOptionalParameters: false
			});

		var command = new mCommands.Command({
			name: commandData.name,
			tooltip: commandData.tip,
			parameters: commitMessageParameters,
			id: commandData.id, //$NON-NLS-0$
			callback: function(data) {
				commandData.callback(data);
			}.bind(this)
		});

		this.commandService.addCommand(command);
		this.commandService.registerCommandContribution('themeCommands', commandData.id, 4); //$NON-NLS-1$ //$NON-NLS-0$
	}
	ThemeBuilder.prototype.addAdditionalCommand = addAdditionalCommand;
	
	function select(name, styles) {
		for (var theme = 0; theme < styles.length; theme++) {
			var style = styles[theme];
			if (style.name === name) {
				//originalTheme is used for reverting
				originalTheme = JSON.parse(JSON.stringify(style));
				currentTheme = JSON.parse(JSON.stringify(style));
				mSetup.processTheme("editorTheme", currentTheme);
				break;
			}
		}
		this.apply();
	}
	ThemeBuilder.prototype.select = select;
	
	function renderData(anchor, state) {
		anchor.innerHTML = this.template; // ok--this is a fixed value
		lib.processTextNodes(anchor, messages);
		mSetup.setupView(jsExample, "js"); //$NON-NLS-0$
		
		this.commandService.renderCommands('themeCommands', document.getElementById(this.toolbarId || "userCommands"), this, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$
		
		for (var i = 0; i < scopeList.length; i++){ // 0th one is a select
			document.getElementById(scopeList[i].id).onchange = function(e){
				updateScopeValue(e.target.id, e.target.value);
			};
		}
		
		this.populateThemes();
		
		editorLanguage = document.getElementById("editorLanguage"); //$NON-NLS-0$
		editorLanguage.onchange = this.changeLanguage.bind(this);
		
		editorTheme = document.getElementById("editorTheme");
		editorTheme.onchange = this.changeTheme.bind(this);
		
		revertBtn = document.getElementById("editorThemeRevert");
		revertBtn.onclick = this.revertTheme.bind(this);
		
		deleteBtn = document.getElementById("editorThemeDelete");
		deleteBtn.onclick = this.deleteTheme.bind(this);
		
		saveBtn = document.getElementById("editorThemeSave");
		saveBtn.onclick = this.saveTheme.bind(this);
		
		themeNameInput = document.getElementById("editorThemeName");
		themeNameInput.onchange = this.updateThemeName.bind(this);
	}
	ThemeBuilder.prototype.renderData = renderData;
		
	function updateThemeName(){
		currentTheme.name = themeNameInput.value;
	}	
	ThemeBuilder.prototype.updateThemeName = updateThemeName;
	
	function changeTheme(){
		var theme = editorTheme.options[editorTheme.selectedIndex].value;
		this.selectTheme(theme);
		this.settings['name'] = theme;
	}
	ThemeBuilder.prototype.changeTheme = changeTheme;
		
	function changeLanguage(){
		var language = editorLanguage.options[editorLanguage.selectedIndex].value;
		
		switch (language) {
			case "javascript":
				mSetup.setupView(jsExample, "js"); //$NON-NLS-0$
				break;
			case "html":
				mSetup.setupView(htmlExample, "html"); //$NON-NLS-0$
				break;
			case "css":
				mSetup.setupView(cssExample, "css"); //$NON-NLS-0$
				break;
			case "java":
				mSetup.setupView(javaExample, "java"); //$NON-NLS-0$
				break;
		}
		
		return true;
	}
	ThemeBuilder.prototype.changeLanguage = changeLanguage;

	function selectTheme(name) {
		this.preferences.getTheme(function(themeStyles) {
			this.select(name, themeStyles.styles);
			this.preferences.setTheme(name, themeStyles.styles);
		}.bind(this));
	}
	ThemeBuilder.prototype.selectTheme = selectTheme;

	function addTheme(style) {
		this.preferences.getTheme(function(themeStyles) {
			var themeName = style.name;
			
			//allow theme to be overwritten
			for (var i = 0; i < themeStyles.styles.length; i++) {
				if (themeStyles.styles[i].name === themeName) {
					var found = true;
					themeStyles.styles[i].styles = style.styles;
					break;
				}
			}
			if (!found) {
				themeStyles.styles.push(style);
			}

			this.preferences.setTheme(themeName, themeStyles.styles);
			this.select(themeName, themeStyles.styles);
			this.populateThemes();
		}.bind(this));
	}
	ThemeBuilder.prototype.addTheme = addTheme;

	ThemeBuilder.prototype.destroy = function() {
		
	};
	
	function deleteTheme(){
		//if default theme
		if (protectedThemes.indexOf(currentTheme.name) !== -1){
			window.alert(currentTheme.name + messages["cannotDeleteMsg"]);
		}
		else if (confirm(messages["confirmDeleteMsg"]) === true){
			this.preferences.getTheme(function(themeStyles) {
				var themeName = currentTheme.name;
				
				for (var i = 0; i < themeStyles.styles.length; i++) {
					if (themeStyles.styles[i].name === themeName) {
						themeStyles.styles.splice(i, 1);
					}
				}
				// show the first theme
				this.preferences.setTheme(themeStyles.styles[0].name, themeStyles.styles);
				this.populateThemes();
			}.bind(this));
		}
	}
	ThemeBuilder.prototype.deleteTheme = deleteTheme;
	
	function saveTheme(){
		if (protectedThemes.indexOf(currentTheme.name) !== -1){
			window.alert(currentTheme.name + messages["cannotModifyMsg"]);
		}
		else {
			this.addTheme(currentTheme);
		}
	}
	ThemeBuilder.prototype.saveTheme = saveTheme;
	
	function exportTheme() {
		var themeString = JSON.stringify(currentTheme);

		if (window.navigator.msSaveOrOpenBlob) { // Save blob from IE
			var blobObject = new Blob([themeString]);
			window.navigator.msSaveOrOpenBlob(blobObject, currentTheme.name+".json");
		} else { // Create a data-uri and save contents of it for other browsers
			var encodedUri = encodeURIComponent(themeString),
				link = document.createElement("a");

			// Set the attributes for the link and append it (Firefox requires the element to actually be in the DOM)
			link.setAttribute("href", "data:application/other;charset=utf-8," + encodedUri);
			link.setAttribute("download", currentTheme.name + ".json");
			document.body.appendChild(link);

			// Simulate the click event
			link.click();

			// Remove the element from the DOM
			link.remove();
		}
	}
	ThemeBuilder.prototype.exportTheme = exportTheme;

	function revertTheme() {
		this.selectTheme(originalTheme.name);
	}
	ThemeBuilder.prototype.revertTheme = revertTheme;

	return ThemeBuilder;
});
