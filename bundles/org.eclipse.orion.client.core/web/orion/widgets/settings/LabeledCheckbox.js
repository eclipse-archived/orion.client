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

/* This SettingsContainer widget is a dojo border container with a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'orion/commands'], function(messages, require, dojo, dijit, mUtil, mCommands) {

	dojo.declare("orion.widgets.settings.LabeledCheckbox",[dijit._Widget, dijit._Templated],{ //$NON-NLS-0$
		
		templateString: '<div>' +  //$NON-NLS-0$
							'<label>' + //$NON-NLS-0$
								'<span data-dojo-attach-point="mylabel">'+messages['Label:']+'</span>' +  //$NON-NLS-2$ //$NON-NLS-0$
								'<input class="settingsCheckbox" type="checkbox" name="myname" data-dojo-attach-point="myfield" data-dojo-attach-event="onchange:change"/>' + //$NON-NLS-0$
							'</label>' +  //$NON-NLS-0$
						'</div>', //$NON-NLS-0$
						
		setStorageItem: function(){
						
		},
        
        change: function(){
            var value = this.myfield.value;
        },
        
        postCreate: function(){
            this.inherited( arguments );
            
            this.mylabel.innerHTML = this.fieldlabel + ':'; //$NON-NLS-0$
            
            dojo.style( this.myfield, 'width', '20px' ); //$NON-NLS-1$ //$NON-NLS-0$
        }, 
        
        startup: function(){
        
        }
    });
});