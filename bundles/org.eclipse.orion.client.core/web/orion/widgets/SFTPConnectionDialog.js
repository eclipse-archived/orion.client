/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit localStorage widgets */
/*jslint browser:true*/

define(['i18n!orion/widgets/nls/messages', 'dojo', 'dijit', 'dijit/Dialog', 'dijit/form/CheckBox', 'dijit/form/ComboBox', 'dojo/data/ItemFileReadStore',  'orion/widgets/_OrionDialogMixin', 'text!orion/widgets/templates/SFTPConnectionDialog.html'], function(messages, dojo, dijit) {

if (!localStorage.getItem("orion.sftpConnections")) { //$NON-NLS-0$
	var defaultItems = { 
		identifier: 'name', //$NON-NLS-0$
		label: messages['name'],
		items: []
	};
	localStorage.setItem("orion.sftpConnections", JSON.stringify(defaultItems)); //$NON-NLS-0$
}

// have to make this a global for now
 window.sftpConnectionStoreData= JSON.parse(localStorage.getItem("orion.sftpConnections")); //$NON-NLS-0$

/**
 * @param options {{ 
 *     title: string,
 *     label: string,
 *     func: function,
 *     [advanced]: boolean  // Whether to show advanced controls. Default is false
 * }}
 */
dojo.declare("orion.widgets.SFTPConnectionDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], { //$NON-NLS-0$
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'widgets/templates/SFTPConnectionDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = "SFTP Transfer"; //$NON-NLS-0$
		this.sftpHostLabelText= messages['Remote host:'];
		this.sftpPathLabelText= messages['Remote path:'];
		this.sftpUserLabelText= messages['User name:'];
		this.sftpPasswordLabelText= messages['Password:'];
		this.buttonOk = messages['Start Transfer'];
		this.locationLabelText = messages['Location:'];
		sftpConnectionStoreData= JSON.parse(localStorage.getItem("orion.sftpConnections")); //$NON-NLS-0$
		
		this.preRadioDescriptionText = messages["If the same file exists in both the source and destination:"];
		this.firstRadioLabelText = messages["Cancel the transfer"];
		this.secondRadioLabelText = messages["Always overwrite destination"];
		this.thirdRadioLabelText = messages["Overwrite if source is newer"];	
		this.newLabelText = messages["New"];
		this.addLabelText = messages["Add"];
	},
	postCreate: function() {
		this.inherited(arguments);
		dojo.connect(this.addSFTPConnection, "onClick", null, dojo.hitch(this, this.onAddConnection)); //$NON-NLS-0$
	},
	execute: function() {
		var selected = this.sftpConnectionList.value;
		var splits = selected.split("@"); //$NON-NLS-0$
		if (splits.length !== 2) {
			return;
		}
		var user = splits[0];
		var separator = splits[1].indexOf("/"); //$NON-NLS-0$
		if (separator <= 0) {
			return;
		}
		var host = splits[1].substring(0, separator);
		var path = splits[1].substring(separator);
		this.options.func(host, path, user, this.sftpPassword.value, this._computeOverwriteValue());
	},
	_computeOverwriteValue: function() {
		if (this.overwriteCancel.checked) {
			return "no-overwrite"; //$NON-NLS-0$
		} else if (this.overwriteOlder.checked) {
			return "overwrite-older"; //$NON-NLS-0$
		}
		//by default pass no options
		return "";
	},
	onAddConnection: function() {
		var newConnection = {name: this.sftpUser.value+"@"+this.sftpHost.value+this.sftpPath.value}; //$NON-NLS-0$
		var connections = JSON.parse(localStorage.getItem("orion.sftpConnections")); //$NON-NLS-0$
		//make sure we don't already have an entry with this name
		var found = false;
		for (var i = 0; i < connections.items.length; i++) {
			if (connections.items[i].name === newConnection.name) {
				found = true;
				break;
			}
		}
		//if we have a new value, add it to the list and to the storage
		if (!found) {
			connections.items.unshift(newConnection);
			localStorage.setItem("orion.sftpConnections", JSON.stringify(connections)); //$NON-NLS-0$
			this.sftpConnectionList.set("value", newConnection.name); //$NON-NLS-0$
		}
	}
});
});