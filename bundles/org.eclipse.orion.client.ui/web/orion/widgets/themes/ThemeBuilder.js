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
		'orion/i18nUtil',
		'orion/commands', 
		'orion/commandRegistry', 
		'orion/webui/littlelib', 
		'orion/webui/tooltip',
		'orion/widgets/themes/colors',
		'orion/util',
],
function(messages, i18nUtil, mCommands, mCommandRegistry, lib, mTooltip, colors, util) {
	var editorTheme, originalTheme, currentTheme, revertBtn, deleteBtn, saveBtn, themeNameInput, setup;
	var protectedThemes = [];
	var defaultColor = "#ff80c0";
	var scopeList;
	
	var extractHexRegEx = /(#[0-9A-F]{6})|(#[0-9A-F]{3})/i;
	var rgbaExtractRegEx = /(.*?rgba?[\s+]?\()[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,?[\s+]?(0?\.?\d+)?[\s+]?(.*)/i;

	function hexToRGB(hex) {
		if (!extractHexRegEx.test(hex)) {
			//invalid hex string
			throw new Error("Invalid HEX string provided.");
		}
		hex = hex.substring(1);
		var rgb, r, g, b;
		if (hex.length === 6) {
			rgb = parseInt(hex,16);
			r = (rgb >> 16) & 0xff;
			g = (rgb >>  8) & 0xff;
			b = (rgb >>  0) & 0xff;
			return {r: r, g: g, b: b };
		} 
		if (hex.length === 3) {
			rgb = parseInt(hex, 16);
			r = (rgb >> 8) & 0xf;
			g = (rgb >> 4) & 0xf;
			b = (rgb >> 0) & 0xf;
			
			r = (r << 4) | r;
			g = (g << 4) | g;
			b = (b << 4) | b;
			return { r: r, g:g, b:b};
		}
		
	}
	ThemeBuilder.prototype.hexToRGB = hexToRGB;
	
	function updateValue(target, value) {
		if (!target) {
			return value;
		}
		//if the value is a hex color
		if (extractHexRegEx.test(value)) {
			//if the target is hex
			if (extractHexRegEx.test(target)) {
				return target.replace(extractHexRegEx, value);
			}
			
			//if the target is rgb or rgba
			var rgba = target.match(rgbaExtractRegEx);
			if (rgba) {
				//convert hex to rgb
				var rgb = hexToRGB(value);
				//if the 'a' value exists, return rgba, else return rgb
				return rgba[1] + rgb.r + ", " + rgb.g + ", " + rgb.b + (rgba[5] ? ", " + rgba[5] : "") + rgba[6];
			}
		}
		return value;
	}
	ThemeBuilder.prototype.updateValue = updateValue;
	
	/*
	 * Checks the target value for an embeded hex, rgb, or rgba string
	 * if found, returns the given value in hex otherwise it
	 * returns the provided value.
	 */
	function getValue(value) {
		//hex
		if (extractHexRegEx.test(value))
		{
			return value.match(extractHexRegEx)[0];
		} 
		//rgb \ rgba
		var rgba = value.match(rgbaExtractRegEx);
		if (rgba) {
            var red = parseInt(rgba[2], 10);
            var green = parseInt(rgba[3], 10);
            var blue = parseInt(rgba[4], 10);
            var rgb = blue | (green << 8) | (red << 16) | (1 << 24);
			return "#" + rgb.toString(16).substring(1,8).toUpperCase();
		}
		return value;
	}
	ThemeBuilder.prototype.getValue = getValue;	


	//initializes the default html structure
	function init(exclusions) {
		ThemeBuilder.prototype.template = '<div class="themeController">' +//$NON-NLS-0$
			'<div class="scopeListHeader" id="scopeOriginal">'+
				'<label for="editorTheme">${Theme: }</label>' + 
				'<select id="editorTheme">' +
				'</select>'+
				'<button id="editorThemeDelete" class="editorThemeCleanButton"><span class="core-sprite-trashcan editorThemeButton"></span></button>'+
			'</div>' +
			'<div class="scopeListHeader hide" id="scopeChanged">'+
				'<label for="editorThemeName">${Theme: }</label>' + 
				'<input id="editorThemeName" type="text">' +
				'<button id="editorThemeSave" class="editorThemeCleanButton"><span class="core-sprite-save editorThemeButton"></span></button>'+
				'<button id="editorThemeRevert" class="editorThemeCleanButton"><span class="git-sprite-revert editorThemeButton"></span></button>'+
			'</div>' +
			'<ul class="scopeList" id="scopeList">' +
				generateScopeList(exclusions) +
			'</ul>' +
		'</div>' +
		'<div id="previewWidget"></div>';
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
					setup.processTheme("editorTheme", currentTheme);
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
		var nodes = keys.split(' ');
		for (var i = 0; i < nodes.length; i++) {
			if (!obj[nodes[i]]) {
				return "";
			}
			obj = obj[nodes[i]];
		}
		return getValue(obj);
	}
	
	function setValueToPath (obj, path, val){
		var nodes = path.split(' ');		
		try {
			for (var i = 0; i < nodes.length - 1; i++) {
				obj = obj[nodes[i]] || (obj[nodes[i]] = {});
			}
			obj[nodes[i]] = updateValue(obj[nodes[i]], val);
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
	function generateScopeList(hiddenValues){
		hiddenValues = hiddenValues || [];
		var htmlString = "";
		var ieClass = util.isIE ? "-ie" : ""; //$NON-NLS-0$

		for (var i = 0; i < scopeList.length; i++){
			if (scopeList[i].id === "editorThemeFontSize"){
				htmlString = htmlString + "<li><label for='editorThemeFontSize'>" + scopeList[i].display + "</label><select id='editorThemeFontSize'>";
				for (var l = 8; l < 19; l++){
					htmlString = htmlString + "<option value='" + l+"px'>"+l+"px</option>";
				}
				for(l = 8; l < 19; l++){
					htmlString = htmlString + "<option value='" + l+"pt'>"+l+"pt</option>";
				}
				htmlString += "</select></li>";//$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
			else {
				var hideValueCSS = hiddenValues.indexOf(scopeList[i].id) >= 0 ? "style='display: none'" : ""; //$NON-NLS-0$
				htmlString = htmlString + "<li " + hideValueCSS + "><label for='"+scopeList[i].id+"'>" + scopeList[i].display + "</label><input id='"+scopeList[i].id+"' class='colorpicker-input" + ieClass + "' type='color' value='" + scopeList[i].value + "'></li>";//$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
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
		this.previewWidget = args.previewWidget;
		setup = args.setup;
		scopeList = args.scopeList || [];
		var exclusions = (this.previewWidget && this.previewWidget.getSelectedExclusions) ? this.previewWidget.getSelectedExclusions() : [];

		init(exclusions);

		this.commandService = args.commandService;
		this.preferences = args.preferences;
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
				setup.processTheme("editorTheme", currentTheme);
				break;
			}
		}
		this.apply();
	}
	ThemeBuilder.prototype.select = select;
	
	function renderData(anchor, state) {
		anchor.innerHTML = this.template; // ok--this is a fixed value
		var previewNode = document.getElementById("previewWidget");
		
		if (this.previewWidget && this.previewWidget.renderData) {
			this.previewWidget.renderData(previewNode);
		}

		lib.processTextNodes(anchor, messages);
		
		this.commandService.renderCommands('themeCommands', document.getElementById(this.toolbarId || "userCommands"), this, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$
		
		for (var i = 0; i < scopeList.length; i++){ // 0th one is a select
			document.getElementById(scopeList[i].id).onchange = function(e){
				updateScopeValue(e.target.id, e.target.value);
			};
		}
		
		this.populateThemes();
		
		editorTheme = document.getElementById("editorTheme");
		editorTheme.onchange = this.changeTheme.bind(this);
		
		revertBtn = document.getElementById("editorThemeRevert");
		revertBtn.onclick = this.revertTheme.bind(this);
		var revertThemeLabel = messages['Revert Theme']; //$NON-NLS-1$
		revertBtn.setAttribute("aria-label", revertThemeLabel); //$NON-NLS-1$
		new mTooltip.Tooltip({
			node: revertBtn,
			text: revertThemeLabel,
			position: ["above", "below", "left", "right"] //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$
		});
		
		deleteBtn = document.getElementById("editorThemeDelete");
		deleteBtn.onclick = this.deleteTheme.bind(this);
		var deleteThemeLabel = messages['Delete Theme']; //$NON-NLS-1$
		deleteBtn.setAttribute("aria-label", deleteThemeLabel); //$NON-NLS-1$
		new mTooltip.Tooltip({
			node: deleteBtn,
			text: deleteThemeLabel,
			position: ["above", "below", "left", "right"] //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$
		});
		
		saveBtn = document.getElementById("editorThemeSave");
		saveBtn.onclick = this.saveTheme.bind(this);
		var saveThemeLabel = messages['Save Theme']; //$NON-NLS-1$
		saveBtn.setAttribute("aria-label", saveThemeLabel); //$NON-NLS-1$
		new mTooltip.Tooltip({
			node: saveBtn,
			text: saveThemeLabel,
			position: ["above", "below", "left", "right"] //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$
		});
		
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

			this.preferences.setTheme(themeName, themeStyles.styles).then(function() {
				this.select(themeName, themeStyles.styles);
				this.populateThemes();
			}.bind(this));
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
				this.preferences.setTheme(themeStyles.styles[0].name, themeStyles.styles).then(function() {
					this.populateThemes();
				}.bind(this));
			}.bind(this));
		}
	}
	ThemeBuilder.prototype.deleteTheme = deleteTheme;
	
	function saveTheme(theme) {
		if (theme && theme.styles) {
			currentTheme = theme;
		}

		if (protectedThemes.indexOf(currentTheme.name) !== -1) {
			var newName = prompt(i18nUtil.formatMessage(messages["cannotModifyMsg"], currentTheme.name), messages["defaultImportedThemeName"]);
			if (newName && newName.length > 0 && protectedThemes.indexOf(newName) === -1) {
				currentTheme.name = newName;
				this.addTheme(currentTheme);
			}
		}
		else {
			this.addTheme(currentTheme);
		}
	}
	ThemeBuilder.prototype.saveTheme = saveTheme;
	
	function exportTheme(data) {
    	//Remove focus so the element no longer appears to be hovered.
		if (data && data.domNode) {
			data.domNode.blur();
		}
		
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