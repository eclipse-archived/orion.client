/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define window eclipse localStorage*/

define(['require', 'dojo', 'dijit', 'orion/commands', 'orion/util', 'dijit/form/DropDownButton'], function(require, dojo, dijit, mCommands, mUtil) {
	dojo.declare("orion.widgets.UserMenuDropDown", [dijit.form.DropDownButton], {
	
		templateString: '<span class="dijit dijitReset dijitInline" style="padding-top: 4px;">' + 
							'<span class="primaryNav" dojoAttachEvent="ondijitclick:_onButtonClick" dojoAttachPoint="_buttonNode">' +
							'<span class="dijitReset dijitStretch dijitButtonContents" dojoAttachPoint="focusNode,titleNode,_arrowWrapperNode"  role="button" aria-haspopup="true" aria-labelledby="${id}_label">' + 
							'<span class="dijitReset dijitInline dijitIcon" dojoAttachPoint="iconNode"></span>' +
							'<span class="dijitReset dijitInline dijitButtonText" dojoAttachPoint="containerNode,_popupStateNode" id="${id}_label" style="padding-right:3px"></span>' + 
							'<span class="dijitReset dijitInline dijitArrowButtonInner"></span>' +
							'<span class="dijitReset dijitInline dijitArrowButtonChar">&#9660;</span></span></span>' + 
							'<input ${!nameAttrSetting} type="${type}" value="${value}" class="dijitOffScreen" dojoAttachPoint="valueNode"/></span>'
	
	
	
	});
});