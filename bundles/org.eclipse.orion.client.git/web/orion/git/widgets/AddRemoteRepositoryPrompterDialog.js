/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit eclipse widgets */
/*jslint browser:true */

define(['i18n!git/nls/gitmessages', 'dojo', 'dijit', 'orion/util', 'orion/explorer', 'dijit/Dialog', 'dijit/form/Button', 'orion/widgets/ExplorerTree',  'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/AddRemoteRepositoryPrompterDialog.html'], function(messages, dojo, dijit, mUtil, mExplorer) {

/**
* @param options {{
		func : function(item)  Function to be called with the selected item
	}}
 */
 
dojo.declare("orion.git.widgets.AddRemoteRepositoryPrompterDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], { //$NON-NLS-0$
	treeWidget : null,
	treeRoot : {},
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'git/widgets/templates/AddRemoteRepositoryPrompterDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = this.options.title;
		//this.buttonOk = messages["OK"];	
	},
	
	postCreate : function() {
		this.inherited(arguments);
	},
	
	execute : function() {
		this.options.func(this.options.repository.RemoteLocation, this.remoteName.value, this.options.repository);
	}
});
});