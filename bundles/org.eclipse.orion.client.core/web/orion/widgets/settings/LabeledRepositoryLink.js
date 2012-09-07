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
/*global dojo dijit widgets orion  window console define localStorage*/
/*jslint browser:true*/

/* This SettingsContainer widget is a dojo border container with a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/git/GitCredentialsStorage'], function(messages, require, dojo, dijit, mUtil, mCommands, mGitCredentialsStorage) {

	dojo.declare("orion.widgets.settings.LabeledRepositoryLink",[dijit._Widget, dijit._Templated],{ //$NON-NLS-0$
		
		templateString: '<div>' +  //$NON-NLS-0$
							'<label>' + //$NON-NLS-0$
								'<span class="setting-repository-label" data-dojo-attach-point="mylabel">'+messages['Label:']+'</span>' +  //$NON-NLS-2$ //$NON-NLS-0$
								'<a href="#" data-dojo-attach-event="onclick:change">'+messages["Erase Key"]+'</a>' + //$NON-NLS-0$
							'</label>' +  //$NON-NLS-0$
						'</div>', //$NON-NLS-0$
						
		setStorageItem: function(){
						
		},
        
        change: function(){
        	var gitCredentialsStorage = new mGitCredentialsStorage.GitCredentialsStorage();
        	if(gitCredentialsStorage.isBrowserEnabled()){
        		gitCredentialsStorage.erasePrompt(this.mylabel.innerHTML);
        	}
        },
        
        postCreate: function(){
            this.inherited( arguments );
            this.mylabel.innerHTML = this.fieldlabel; //$NON-NLS-0$
        }, 
        
        startup: function(){
        
        }
    });
});