/*******************************************************************************
 * @license
 * Copyright (c) 2016 Google Inc and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 * Contributors: Casey Flynn - Google Inc - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/

define(['i18n!orion/settings/nls/messages',
		'orion/i18nUtil',
		'orion/commands', 
		'orion/commandRegistry', 
		'orion/webui/littlelib', 
		'orion/webui/tooltip',
		'orion/widgets/themes/container/ThemeSheetWriter',
		'orion/widgets/themes/colors',
		'orion/util',
],
function(messages, i18nUtil, mCommands, mCommandRegistry, lib, mTooltip, ThemeSheetWriter, colors, util) {

	var protectedThemes = [];
	var currentTheme, originalTheme;
	var defaultColor = "#ff80c0";
	
	/*
	 * Consider passing the scope list in from somewhere else, perhaps storing in theme data?
	 * Also need to add i18n messages before calling this 'done'.
	 */
	var scopeList = [{
		objPath: [
				"styles #configSection background-color",
				"styles .checkedRow .commandButton border-color",
				"styles .checkedRow .commandButton:not(.primaryButton):focus background",
				"styles .checkedRow .commandButton:not(.primaryButton):hover background",
				"styles .fixedToolbarHolder background",
				"styles .mainToolbar background-color",
				"styles .mainToolbar .commandButton.orionButton.dropdownTrigger border-color",
				"styles .sideMenu background-color",
				"styles .textviewTooltip .commandButton border-color",
			],
			display: "Primary Background Color",
			id: "primaryBackgroundColor",
			value: ""
		}, {
		objPath: [
			"styles .dropdownButtonWithIcon color", 
			"styles .dropdownTrigger:not(.dropdownDefaultButton) color",
			"styles .filesystemName color",
			"styles .mainToolbar color",
			"styles .commandImage.dropdownTrigger color",
			"styles .sideMenuItem color",
		],
		display: "Primary Text Color",
		id: "primaryTextColor",
		value: ""
		},{
			objPath: [
				"styles .editorViewerHeader background",
				"styles .editorViewerHeader border-bottom-color",
				"styles .launchConfigurationMenuItem.dropdownMenuItemActive background",
				"styles .sidebarWrapper background",
				"styles .splash background",
				"styles .splashLoader background",
				"styles .statusContainer background",
				"styles .titleActionContainer background",
				"styles .dropdownMenuItem color",
			], 
			display: "Secondary Background Color",
			id: "secondaryBackgroundColor", 
			value: "" 
		}, {
			objPath: [
				"styles .checkedRow color",
				"styles .checkedRow .commandButton color",
				"styles .checkedRow gitStatusIcon color",
				"styles .checkedRow gitStatusTitle color",
				"styles .dialogTitle color",
				"styles .label.parameterInput color",
				"styles .launchConfigurationsButton .commandButton.orionButton.dropdownTrigger color",
				"styles .launchConfigurationsWrapper>.launchConfigurationsButton.dropdownTrigger color",
				"styles .launchConfsDropdown .dropdownDefaultButton color",
				"styles .launchConfsLabel color",
				"styles .mainToolbar .commandButton.orionButton.dropdownTrigger .dropdownTriggerButtonLabel color",
				"styles .mainToolbar .commandButton.orionButton.dropdownTrigger.launchConfigurationsButton .dropdownArrowDown color",
				"styles .mainToolbar .gitSectionLabel color",
				"styles .mainToolbar .sectionWrapper color",
				"styles .navbar-item-selected color",
				"styles .orionSwitchLabel color",
				"styles .outlineExplorer .treeIterationCursorRow_Dotted color",
				"styles .primaryButton color",
				"styles .sideMenuItemActive color",
				"styles .sideMenuItemActive:hover color",
				"styles .slideParameters color",
				"styles .textviewTooltip color",
				"styles .tooltip color",
				"styles .tooltip h2 color",
				"styles .tooltip .navlinkonpage color",
				"styles .tooltip .operationError color"
				
			], 
			display: "Secondary Text Color",
			id: "secondaryTextColor",
			value: ""
		}, {
			objPath: [
				"styles .auxpane background",
				"styles .content-fixedHeight background",
				"styles .mainpane background",
				"styles .split background",
				"styles .splitThumb background",
				"styles .pageToolbar .dropdownTrigger:not(.dropdownDefaultButton) color",
				"styles .mainToolbar .commandButton.orionButton.dropdownTrigger.dropdownTriggerOpen color",
			],
			display: "Tertiary Background Color",
			id: "tertiaryBackgroundColor",
			value: ""
		}, {
			objPath: [
				"styles #configSection color",
				"styles .checkedRow .commandButton:not(.primaryButton):focus color",
				"styles .checkedRow .commandButton:not(.primaryButton):hover color",
				"styles .commandButton:not(.primaryButton):focus color",
				"styles .commandButton:not(.primaryButton):hover color",
				"styles .editorViewerHeader color",
				"styles .mainToolbar .commandButton.orionButton.dropdownTrigger color",
				"styles .projectNavColumn color",
				"styles .sidebarWrapper color",
				"styles .splashDetailedMessage color",
				"styles .splashMessage color",
				"styles .status color",
				"styles .statusContainer color",
				"styles .titleActionContainer color",
			],
			display: "Tertiary Text Color",
			id: "tertiaryTextColor",
			value: ""
		}, {
			objPath: [
				"styles .checkedRow background-color",
				"styles .checkedRow .commandButton:not(.primaryButton):focus background",
				"styles .checkedRow .commandButton:not(.primaryButton):hover background",
				"styles .commandButton border-color",
				"styles .commandButton color",
				"styles .commandButton:not(.primaryButton):focus background-color", //.25 opcacity
				//"styles .checkedRow .commandButton:not(.primaryButton):focus box-shadow",
				//"styles .checkedRow .commandButton:not(.primaryButton):hover box-shadow",
				//"styles .commandButton:not(.primaryButton):focus box-shadow",
				//"styles .commandButton:not(.primaryButton):hover box-shadow",
				"styles .commandButton:not(.primaryButton):hover background-color", //.25 opcacity
				"styles .dialogTitle background-color",
				"styles .dropdownMenu .dropdownMenuItemSelected background", //.25 opcacity
				"styles .dropdownMenu .dropdownMenuItemSelected border-left-color",
				"styles .gitCommitMessage .gitCommitMessageTopRow border-color",
				"styles .gitCommitMessageSection background-color", //.25 opcacity
				"styles .gitCommitMore color",
				"styles .gitStatusIcon color",
				"styles .gitStatusSection background-color", //.25 opcacity
				"styles .gitStatusTitle color",
				"styles .launchConfigurationsWrapper>.launchConfigurationsButton.dropdownTrigger background-color",
				"styles .launchConfsDropdown .dropdownDefaultButton background-color",
				"styles .launchConfsLabel background-color",
				"styles .liveUpdateLabel color",
				"styles .mainToolbar .gitSectionLabel background-color",
				"styles .mainToolbar .sectionWrapper background-color",
				"styles .navbar-item-selected background-color",
				"styles .orionSwitchLabel background-color",
				"styles .outlineExplorer .treeIterationCursorRow_Dotted background-color",
				"styles .primaryButton background-color",
				"styles .primaryButton border-color",
				"styles .primaryButton:hover .primaryButton:focus background",
				"styles .primaryButton:hover .primaryButton:focus border-color",
				"styles .searchResultsWrapperDiv .selectableNavRow:hover background", //.25 opcacity
				"styles .searchResultsWrapperDiv .selectableNavRow:hover border-left-color",
				"styles .sideMenuItem>.submenu-trigger:hover color",
				"styles .sideMenuItemActive background-color",
				"styles .sideMenuItemActive:hover background",
				"styles .slideParameters background-color",
				"styles .splashAbout color",
				"styles .splashVerbal color",
				"styles .tooltip background-color",
				"styles .tooltip border-color",
				"styles .tooltip .navlinkonpage background-color",
				"styles .tooltipTailFromabove:after border-top-color",
				"styles .tooltipTailFromabove:before border-top-color",
				"styles .tooltipTailFrombelow:after border-bottom-color",
				"styles .tooltipTailFrombelow:before border-bottom-color",
				"styles .tooltipTailFromleft:after border-left-color",
				"styles .tooltipTailFromleft:before border-left-color",
				"styles .tooltipTailFromright:after border-right-color",
				"styles .tooltipTailFromright:before border-right-color",
				"styles .treeIterationCursorRow background-color",
				"styles .treeIterationCursorRow_Dotted background-color"
			],
			display: "Flavor Color",			
			id: "flavorColor",
			value: ""
		}
	];
	
	
	function hexToRGB(hex) {
		hex = hex.replace("#","");
		//TODO: fix to allow #XXX
		return {
			r: parseInt(hex.substring(0, 2), 16),
			g: parseInt(hex.substring(2, 4), 16),
			b: parseInt(hex.substring(4, 6), 16)
		};
	}
	
	/*
	 * Added funcationality.
	 */
	function rgbaToHex(rgba) {
		rgba = rgba.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,?[\s+]?(\d+)?[\s+]?/i);
	 	return (rgba && rgba.length === 4) ? "#" +
		  ("0" + parseInt(rgba[1],10).toString(16)).slice(-2) +
		  ("0" + parseInt(rgba[2],10).toString(16)).slice(-2) +
		  ("0" + parseInt(rgba[3],10).toString(16)).slice(-2) : '';
	}

	
	function updateValue(target, value) {
		//if the value is a hex color
		if (/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(value)) {
			//hex
			if (/(#[0-9A-F]{6})/i.test(target)) {
				return target.replace(/(#[0-9A-F]{6})/i, value);
			}
			
			//rgb and rgba
			var rgba = target.match(/(.*?rgba?[\s+]?\()[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,?[\s+]?(0?\.?\d+)?[\s+]?(.*)/i)
			if (rgba) {
				//convert hex to rgb
				var rgb = hexToRGB(value);
				//if the 'a' value exists, return rgba, else return rgb
				return rgba[1] + rgb.r + ", " + rgb.g + ", " + rgb.b + (rgba[5] ? ", " + rgba[5] : "") + rgba[6];
			}
		}
		return value;
	}
	ContainerThemeBuilder.prototype.updateValue = updateValue;
	
	/*
	 * checks the target value for an embeded hex, rgb, or rgba string
	 * if found, returns the given value in hex otherwise it
	 * returns the provided value.
	 */
	function getValue(value) {
		//hex
		if (/(#[0-9A-F]{6})|(#[0-9A-F]{3})/i.test(value))
		{
			return value.match(/(#[0-9A-F]{6})|(#[0-9A-F]{3})/i)[0];
		} 
		//rgb \ rgba
		var rgba = value.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,?[\s+]?(\d+)?[\s+]?/i);
		if (rgba) {
			return ("#" +
				("0" + parseInt(rgba[1],10).toString(16)).slice(-2) +
		  		("0" + parseInt(rgba[2],10).toString(16)).slice(-2) +
		  		("0" + parseInt(rgba[3],10).toString(16)).slice(-2)).toUpperCase();
		}
		return value;
	}
	ContainerThemeBuilder.prototype.getValue = getValue;
	
	
	/*
	 * Refactored to not call populate scopes, as the editor is never used in this setup.
	 * The HTML template outlined below isn't used anywhere. To unify the theme builders
	 * we will need to determine how we want to construct the base html template.
	 */
	//initializes the default html structure
	function init() {
		ContainerThemeBuilder.prototype.template = "<div class='editorSection'>" + //$NON-NLS-0$
												"<div class='editorSectionHeader'>" +
													"<label for='editorLanguage'>${Display Language: }</label>" + 
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
		//populateScopes();
	}
	
	/*SAME*/
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
	ContainerThemeBuilder.prototype.populateThemes = populateThemes;

	/*
	 * populateScopes -- Not used.
	 * Moved functionality to RenderData
	*/

	
	
	

	/*SAME*/
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
	
	/*SAME*/
	function namedToHex(val) {
		var lowerCaseVal = val.toLowerCase();

		if (colors.hasOwnProperty(lowerCaseVal)) {
			return colors[lowerCaseVal];
		}

		return val;
	}
	
	/*
	 * Modified to use this.themeData.processTheme instead of mSetup.processTheme
	 * if we are able to mirror mSetup for the container, then we will not need to refactor.
	 */
	//function updateScopeValue(id, val){
	function updateScopeValue(id, val, themeData){
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
					//TODO: Apply Theme Change
					themeData.processSettings(currentTheme);
					//mSetup.processTheme("editorTheme", currentTheme); //$NON-NLS-0$
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
	ContainerThemeBuilder.prototype.updateScopeValue = updateScopeValue;
	
	
	
	/*
	 * Modified to split path by ' ' instead of '.'
	 * We may want to return something smarter here instead of just the value
	 * returned; e.g. extract color regardless of whether it is specified
	 * in rgb, rgba, hex, html color, or default to returning the actual
	 * value.
	 */
	/*REFACTOR ME*/
	function getValueFromPath(obj, keys) {
		var nodes = keys.split(' ');
		//var nodes = keys.split('.');
		for (var i = 0; i < nodes.length; i++) {
			if (!obj[nodes[i]]) {
				return "";
			}
			obj = obj[nodes[i]];
		}
		return getValue(obj);
	}

	/*
	 * Modified to split path by ' ' instead of '.',
	 * this also checks existing information for existing opacity, and !important flag,
	 * and sets it to updated value in RGBA(). Consider making this smarter to only replace
	 * the color value in a given value string.
	 */
	/*This Is The Substantial Change!*/
	function setValueToPath (obj, path, val){
		var nodes = path.split(' ');
		//var nodes = path.split('.');
		try {
			for (var i = 0; i < nodes.length - 1; i++) {
				obj = obj[nodes[i]] || (obj[nodes[i]] = {});
			}
			obj[nodes[i]] = updateValue(obj[nodes[i]], val);
		} catch (e) {
			return false;
		}
	}

	

	/*
	 * Modified to extract RGB \ RGBA information.
	 * Consider generalizing the function to extract any rgb(), rgba(), hex, or html color string by modifying
	 * getValueFromPath?
	 */
	//updates the theme object with right values
	function apply() {
		document.getElementById("editorThemeName").value = currentTheme.name; //$NON-NLS-0$ // REQUIRES REFACTOR!!!!
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
	ContainerThemeBuilder.prototype.apply = apply;
	

	/*
	 * Modified so if hiddenValues is not provided, then it won't crash.
	 */
	//generates the html structure for list of scopes
	function generateScopeList(hiddenValues){
		hiddenValues = hiddenValues ? hiddenValues : []; //Only modified line
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
	
	
	/*
	 * Different, because we are not doing export, this functionality will be included later.
	 */
	function ContainerThemeBuilder(args) {
		this.settings = {};
		this.themeData = args.themeData;
		this.toolbarId = args.toolbarId;
		this.serviceRegistry = args.serviceRegistry;
		protectedThemes = this.themeData ? (this.themeData.getProtectedThemes ? this.themeData.getProtectedThemes() : []) : [];
		//this is never used in either implemenation.
		this.messageService = this.serviceRegistry.getService("orion.page.message");
		
		init();
		
		
		this.preferences = args.preferences;
		this.commandService = args.commandService;
		
		//Logic for export command, if we put this in, then we can use an individual constructor.
		
	}
	
	
	
	/*addAdditionalCommand is not required in this implemenation.*/
	
	/*
	 * Modified to use this.themeData.processTheme instead of mSetup.processTheme
	 * if we are able to mirror mSetup for the container, then we will not need to refactor.
	 */
	function select(name, styles) {
		for (var theme = 0; theme < styles.length; theme++) {
			var style = styles[theme];
			if (style.name === name) {
				//originalTheme is used for reverting
				originalTheme = JSON.parse(JSON.stringify(style));
				currentTheme = JSON.parse(JSON.stringify(style));
				//mSetup.processTheme("editorTheme", currentTheme); REQUIRES REFACTOR!!!!!
				this.themeData.processSettings(currentTheme);

				break;
			}
		}
		this.apply();
	}
	ContainerThemeBuilder.prototype.select = select;
	
	
	
	
	/*
	 * Different, this is the main refactor point.
	 */
	var containerTheme, revertBtn, deleteBtn, saveBtn, themeNameInput;
	function renderData(node) {
		node.innerHTML = '<div class="themeController">' +//$NON-NLS-0$
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
					generateScopeList() +
				'</ul>' +
			'</div>';
			
		lib.processTextNodes(node, messages);
		//mSetup.setupView(jsExample, "js"); //$NON-NLS-0$
		for (var i = 0; i < scopeList.length; i++){ // 0th one is a select
			document.getElementById(scopeList[i].id).onchange = function(e){
				updateScopeValue(e.target.id, e.target.value, this.themeData)
				//alert(e.target.id + " " + e.target.value);
			}.bind(this);
		}
		
		this.populateThemes();
		
		containerTheme = document.getElementById("editorTheme");
		containerTheme.onchange = this.changeTheme.bind(this);
		
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
	
	ContainerThemeBuilder.prototype.renderData = renderData;

	


	
	/*SAME*/
	function updateThemeName(){
		currentTheme.name = themeNameInput.value;
	}	
	ContainerThemeBuilder.prototype.updateThemeName = updateThemeName;

	/*SAME*/
	function changeTheme(){
		var theme = containerTheme.options[containerTheme.selectedIndex].value;
		this.selectTheme(theme);
		this.settings['name'] = theme;
	}
	
	ContainerThemeBuilder.prototype.changeTheme = changeTheme;

	/*changeLanguage does not exist.*/
	/*updateLHS does not exist.*/
	
	/*SAME*/
	function selectTheme(name) {
		this.preferences.getTheme(function(themeStyles) {
			this.select(name, themeStyles.styles);
			this.preferences.setTheme(name, themeStyles.styles);
		}.bind(this));
	}
	ContainerThemeBuilder.prototype.selectTheme = selectTheme;
	
	/*SAME*/
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
	ContainerThemeBuilder.prototype.addTheme = addTheme;
	
	
	/*SAME*/
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
	ContainerThemeBuilder.prototype.deleteTheme = deleteTheme;
	
	/*SAME*/
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
	ContainerThemeBuilder.prototype.saveTheme = saveTheme;
	
	/*EXPORT THEME DOES NOT EXIST*/
	
	/*SAME*/
	function revertTheme() {
		this.selectTheme(originalTheme.name);
	}
	ContainerThemeBuilder.prototype.revertTheme = revertTheme;
	
	return ContainerThemeBuilder;
});
