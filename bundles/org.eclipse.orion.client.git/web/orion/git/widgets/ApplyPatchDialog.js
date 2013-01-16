/*******************************************************************************
 * @license Copyright (c) 2011, 2013 IBM Corporation and others. All rights
 *          reserved. This program and the accompanying materials are made
 *          available under the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define([ 'i18n!git/nls/gitmessages', 'orion/webui/dialog' ], function(messages, dialog) {

	function ApplyPatchDialog(options) {
		this._init(options);
	}

	ApplyPatchDialog.prototype = new dialog.Dialog();

	ApplyPatchDialog.prototype.TEMPLATE =

	'<div style="padding:4px"><input type="radio" name="radio" value="urlRadio" id="urlRadio" checked/>URL:' 
		+ '<input type="text" name="url" id="url"/></div>'
			+'<div style="padding:4px"><input type="radio" name="radio" value="fileRadio" id="fileRadio"/>File:'
			+ '<input type="file" name="selectedFile" id="selectedFile" class="uploadChooser" /></div>';

	ApplyPatchDialog.prototype._init = function(options) {
		var that = this;

		this.title = messages["Apply Patch"];
		this.modal = true;
		this.messages = messages;
		this.options = options;

		this.buttons = [];

		this.buttons.push({ callback : function() {
			that._applyPatch();
		},
		text : 'OK'
		});

		// Start the dialog initialization.
		this._initialize();
	};

	ApplyPatchDialog.prototype._bindToDom = function(parent) {
		// nothing to do
	};

	ApplyPatchDialog.prototype._applyPatch = function(parent) {
		var formData = new FormData();
		formData.append("uploadedfile", this.$selectedFile.files[0]);
		formData.append("url", this.$url.value);
		formData.append("radio", this.$fileRadio.checked ? "fileRadio" : "urlRadio");

		this.req = new XMLHttpRequest();
		this.req.open('post', this.options.diffLocation);
		this.req.onreadystatechange = this.handleReadyState.bind(this);
		this.req.send(formData);
	};

	ApplyPatchDialog.prototype.handleReadyState = function(state) {
		if (this.req.readyState === 4) {
			this.hide();
		}
	};

	ApplyPatchDialog.prototype.constructor = ApplyPatchDialog;

	// return the module exports
	return { ApplyPatchDialog : ApplyPatchDialog
	};

});