/*******************************************************************************
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

define(['dojo', 'dijit', 'dijit/Dialog', 'dijit/form/CheckBox', 'dijit/form/ComboBox', 'dojo/data/ItemFileReadStore',  'orion/widgets/_OrionDialogMixin', 'text!orion/widgets/templates/SFTPConnectionDialog.html'], function(dojo, dijit) {

if (!localStorage.getItem("orion.sftpConnections")) {
	var defaultItems = { 
		identifier: 'name',
		label: 'name',
		items: []
	};
	localStorage.setItem("orion.sftpConnections", JSON.stringify(defaultItems));
}

// have to make this a global for now
 window.sftpConnectionStoreData= JSON.parse(localStorage.getItem("orion.sftpConnections"));

/**
 * @param options {{ 
 *     title: string,
 *     label: string,
 *     func: function,
 *     [advanced]: boolean  // Whether to show advanced controls. Default is false
 * }}
 */
dojo.declare("orion.widgets.SFTPConnectionDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], {
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'widgets/templates/SFTPConnectionDialog.html'),
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = "SFTP Transfer";
		this.sftpHostLabelText= "Remote host:";
		this.sftpPathLabelText= "Remote path:";
		this.sftpUserLabelText= "User name:";
		this.sftpPasswordLabelText= "Password:";
		this.buttonOk = "Start Transfer";
		this.locationLabelText = "Location:";
		sftpConnectionStoreData= JSON.parse(localStorage.getItem("orion.sftpConnections"));
	},
	postCreate: function() {
		this.inherited(arguments);
		dojo.connect(this.addSFTPConnection, "onClick", null, dojo.hitch(this, this.onAddConnection));
	},
	execute: function() {
		var selected = this.sftpConnectionList.value;
		var splits = selected.split("@");
		if (splits.length !== 2) {
			return;
		}
		var user = splits[0];
		var separator = splits[1].indexOf("/");
		if (separator <= 0) {
			return;
		}
		var host = splits[1].substring(0, separator);
		var path = splits[1].substring(separator);
		this.options.func(host, path, user, this.sftpPassword.value, this._computeOverwriteValue());
	},
	_computeOverwriteValue: function() {
		if (this.overwriteCancel.checked) {
			return "no-overwrite";
		} else if (this.overwriteOlder.checked) {
			return "overwrite-older";
		}
		//by default pass no options
		return "";
	},
	onAddConnection: function() {
		var newConnection = {name: this.sftpUser.value+"@"+this.sftpHost.value+this.sftpPath.value};
		var connections = JSON.parse(localStorage.getItem("orion.sftpConnections"));
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
			localStorage.setItem("orion.sftpConnections", JSON.stringify(connections));
			this.sftpConnectionList.set("value", newConnection.name);
		}
	}
});
});