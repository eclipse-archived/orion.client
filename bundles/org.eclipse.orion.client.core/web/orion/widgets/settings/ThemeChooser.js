/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets orion  window console define localStorage*/
/*jslint browser:true*/

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/globalCommands', 'orion/PageUtil', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList', 'orion/widgets/settings/SplitSelectionLayout', 'orion/widgets/settings/UserSettings', 'orion/widgets/settings/InputBuilder'], 
	function(messages, require, dojo, dijit, mUtil, mCommands, mGlobalCommands, PageUtil) {


		function ThemeChooser(){
			console.log( 'Theme Chooser' );
		}
		
		ThemeChooser.prototype.template =	'<div class="themeContainer">' +
											'<header>' +
											'<div id="staticBanner" class="layoutBlock topRowBanner">' + 
											'<a id="home" class="layoutLeft logo" href="../navigate/table.html" aria-label="Orion Home"></a>' +
												'<nav id="primaryNav" class="layoutLeft primaryNav" role="navigation">' +
													'<a href="http://orion.eclipse.org/navigate/table.html#" target="_self" class="targetSelector">Navigator</a>' + 
//													'<a href="http://orion.eclipse.org/sites/sites.html" target="_self" class="targetSelector">Sites</a>' +
//													'<a href="http://orion.eclipse.org/git/git-repository.html#" target="_self" class="targetSelector">Repositories</a>' +
//													'<a href="http://orion.eclipse.org/console/consolePage.html" target="_self" class="targetSelector">Console</a>' +
//													'<a href="http://mamacdon.github.com/#?target=http://orion.eclipse.org/settings/settings.html&amp;version=0.5&amp;OrionHome=http://orion.eclipse.org" target="_self" class="targetSelector">Get Plugins</a>' +
												'</nav>' +
												'<div class="layoutRight">' +
													'<div id="globalActions" class="spacingLeft layoutLeft"></div>' +
													'<div id="relatedLinks" class="spacingLeft layoutLeft" style="padding-top:1px;"></div>' +
													'<input type="text" id="search" placeholder="Search Orion Content" title="Type a keyword or wild card to search in Orion Content" class="layoutLeft spacingLeft searchbox" role="search">' +
														'<div id="userMenu" class="spacingLeft layoutLeft">' +
														'<span class="dijit dijitReset dijitInline dijitDropDownButton" style="padding-top: 3px;" widgetid="logins">' + 
															'<span class="primaryNav" dojoattachevent="ondijitclick:_onButtonClick" dojoattachpoint="_buttonNode">' + 
																'<span class="dijitReset dijitStretch dijitButtonContents dijitDownArrowButton" dojoattachpoint="focusNode,titleNode,_arrowWrapperNode" role="button" aria-haspopup="true" aria-labelledby="logins_label" style="-webkit-user-select: none; " id="logins" tabindex="0">' +
																	'<span class="dijitReset dijitInline dijitIcon" dojoattachpoint="iconNode"></span>' +
																	'<span class="dijitReset dijitInline dijitButtonText" dojoattachpoint="containerNode,_popupStateNode" id="logins_label" style="padding-right:3px">Anton McConville</span>' +
																	'<span class="dijitReset dijitInline dijitArrowButtonInner"></span>' + 
																'</span>' + 
															'</span>' + 
														'</span>'  +
														'</div>' +
												'</div>' + 
												'<div id="titleArea" class="layoutBlock titleArea">' + 
													'<div class="layoutLeft pageTitle"></div>' + 
														'<div class="clear" style="padding-bottom:5px;display:inline;">' + 
															'<span id="location" class="">' + 
																'<span id="eclipse.breadcrumbs">' + 
																	'<a class="breadcrumb currentLocation">Settings</a>' + 
																'</span>' + 
															'</span>' + 
															'<span id="dirty" class="currentLocation"></span>' + 
														'</div>' + 
														'<div class="layoutRight pageNav">' +
															'<span id="pageFavorite" tabindex="0" role="button" aria-label="Add this page to the favorites list" class="spacingLeft layoutLeft imageSprite core-sprite-favorite_sml" style="visibility: hidden; "></span>' +
														'</div>' + 
													'</div>' +
												'</div>'
											'</div>';
		
		function render( anchor ){
		
			anchor.innerHTML = this.template;
		
			console.log( 'Theme Chooser Render' );
		};
		
		
		ThemeChooser.prototype.render = render;
		

		return{
			ThemeChooser:ThemeChooser
		};

	}
);