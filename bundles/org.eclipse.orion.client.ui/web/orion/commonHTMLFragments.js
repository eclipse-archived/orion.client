/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window document define login logout localStorage orion */
/*browser:true*/

define(['require', 'orion/webui/littlelib'], 
        function(require, lib){
	
	/**
	 * This module contains HTML fragments for the common banner, footer, toolbars.
	 * @name orion.commonHTMLFragments
	 */

	// BEGIN TOP BANNER FRAGMENT
	var topHTMLFragment =
	
	'<header id="banner" role="banner" class="headerLayout">' + //$NON-NLS-0$
		//Top row:  Logo + discovery links + search + user
		'<div id="staticBanner" class="primaryNav layoutBlock topRowBanner">' + //$NON-NLS-0$
			'<a id="home" class="layoutLeft logo" href="' + require.toUrl("navigate/table.html")+ '"></a>' +  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			'<nav id="primaryNav" class="layoutLeft" role="navigation"></nav>' + //$NON-NLS-0$
			'<div class="layoutRight">' + //$NON-NLS-0$
				'<div id="globalActions" class="spacingLeft layoutLeft"></div>' + //$NON-NLS-0$
				'<div id="relatedLinks" class="spacingLeft layoutLeft" style="padding-top:1px;">' + //$NON-NLS-0$
					'<span tabindex="0" role="button" id="relatedTrigger" class="dropdownTrigger hidden">${Related}<span class="dropdownArrowDown"></span></span>' +  //$NON-NLS-0$
					'<ul id="relatedDropdown" class="dropdownMenu" role="menu"></ul>' + //$NON-NLS-0$
				'</div>' + //$NON-NLS-0$
				'<input type="text" id="search" autocomplete="off" class="layoutLeft spacingLeft searchbox" role="search">' + //$NON-NLS-0$
				'<div id="searchOptions" class="layoutLeft" style="padding-top:1px;"></div>' + //$NON-NLS-0$
				'<div id="userMenu" class="spacingLeft layoutLeft">' + //$NON-NLS-0$
					'<span id="userTrigger" tabindex="0" role="button" class="dropdownTrigger">${Options}<span class="dropdownArrowDown"></span></span>' +  //$NON-NLS-0$
					'<ul id="userDropdown" class="dropdownMenu" role="menu"></ul>' + //$NON-NLS-0$
				'</div>' + //$NON-NLS-0$
			'</div>' + //$NON-NLS-0$
		'</div>' + //$NON-NLS-0$
		//Title area
		'<div id="titleArea" class="layoutBlock titleArea">' + //$NON-NLS-0$
			'<div class="clear" style="padding-bottom:5px;display:inline;"><span id="location" class="currentLocation"></span><span id="dirty" class="currentLocation"></span></div>' + //$NON-NLS-0$
			'<div class="layoutRight pageNav">' + //$NON-NLS-0$
				'<img class="progressPane" src="'+ require.toUrl("images/none.png") +'" id="progressPane" tabindex="0" role="progressbar"></img>' + //$NON-NLS-2$  //$NON-NLS-1$ //$NON-NLS-0$
			'</div>' + //$NON-NLS-0$
		'</div>' + //$NON-NLS-0$
	'</header>'; //$NON-NLS-0$
	// END TOP BANNER FRAGMENT
	
	// BEGIN BOTTOM BANNER FRAGMENT
	// styling of the surrounding div (text-align, etc) is in ide.css "footer"
	var bottomHTMLFragment = 
		'<footer id="footerContent" class="layoutBlock footerLayout" role="contentinfo">' + //$NON-NLS-0$
			'<div class="footerBlock">${Orion is in Beta. Please try it out but BEWARE your data may be lost.}</div>' + //$NON-NLS-0$
			'<div class="footerRightBlock">' + //$NON-NLS-0$
				'<a href="http://wiki.eclipse.org/Orion/FAQ" target="_blank">${FAQ}</a> | ' +  //$NON-NLS-0$
				'<a href="https://bugs.eclipse.org/bugs/enter_bug.cgi?product=Orion&version=1.0" target="_blank">${Report a Bug}</a> | ' + //$NON-NLS-0$
				'<a href="http://www.eclipse.org/legal/privacy.php" target="_blank">${Privacy Policy}</a> | ' +  //$NON-NLS-0$
				'<a href="http://www.eclipse.org/legal/termsofuse.php" target="_blank">${Terms of Use}</a> | '+  //$NON-NLS-0$
				'<a href="http://www.eclipse.org/legal/copyright.php" target="_blank">${Copyright Agent}</a>'+ //$NON-NLS-0$
			'</div>' + //$NON-NLS-0$
		'</footer>'; //$NON-NLS-0$
	// END BOTTOM BANNER FRAGMENT

	function slideoutHTMLFragment(id) { 
		return '<div id="'+id+'slideContainer" class="layoutBlock slideParameters slideContainer">' + //$NON-NLS-1$ //$NON-NLS-0$
			'<span id="'+id+'pageCommandParameters" class="layoutLeft parameters"></span>' + //$NON-NLS-1$ //$NON-NLS-0$
			'<span id="'+id+'pageCommandDismiss" class="layoutRight parametersDismiss"></span>' + //$NON-NLS-1$ //$NON-NLS-0$
		'</div>'; //$NON-NLS-0$
	}
	
	var toolbarHTMLFragment = 
		'<ul class="layoutLeft commandList pageActions" id="pageActions"></ul>' + //$NON-NLS-0$
		'<ul class="layoutLeft commandList pageActions" id="selectionTools"></ul>' + //$NON-NLS-0$
		'<div class="layoutRight" style="padding-left:7px;padding-right:7px;margin-top:3px;" id="settingsTab" style="visibility:hidden;">' +  //$NON-NLS-0$
			'<div class="layoutRight core-sprite-settings" id="settingsAction" role="settings" aria-live="off" style="visibility:hidden;"></div>' + //$NON-NLS-0$
		'</div>' +  //$NON-NLS-0$
		'<div class="layoutRight status" id="statusPane" role="status" aria-live="off"></div>' + //$NON-NLS-0$
		'<ul class="layoutRight commandList pageActions" id="pageNavigationActions"></ul>' + //$NON-NLS-0$
		'<div id="notificationArea" class="layoutLeft layoutBlock slideContainer">' + //$NON-NLS-0$
				'<div class="layoutLeft" id="notifications" aria-live="assertive" aria-atomic="true"></div>' + //$NON-NLS-0$
				'<div class="layoutRight"><span tabindex="0" role="button" class="layoutRight core-sprite-close imageSprite" id="closeNotifications"></span></div>' + //$NON-NLS-0$
		'</div>' + slideoutHTMLFragment("mainToolbar"); //$NON-NLS-1$ //$NON-NLS-0$
		
	
	//return the module exports
	return {
		topHTMLFragment: topHTMLFragment,
		bottomHTMLFragment: bottomHTMLFragment,
		toolbarHTMLFragment: toolbarHTMLFragment,
		slideoutHTMLFragment: slideoutHTMLFragment
	};
});
