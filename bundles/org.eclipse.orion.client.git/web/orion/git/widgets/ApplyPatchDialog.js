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
 
/*eslint-env browser, amd*/

define([ 'i18n!git/nls/gitmessages', 'orion/webui/dialog', 'orion/xsrfUtils' ], function(messages, dialog, xsrfUtils) {

	function ApplyPatchDialog(options) {
		this._init(options);
	}

	ApplyPatchDialog.prototype = new dialog.Dialog();

	ApplyPatchDialog.prototype.TEMPLATE =

	'<div style="padding:4px"><input type="radio" name="radio" value="urlRadio" id="urlRadio" checked/>' +
		messages["URL:"] + '<input type="text" name="url" id="patchurl"/></div>' +
	'<div style="padding:4px"><input type="radio" name="radio" value="fileRadio" id="fileRadio"/>' +
		messages["File:"] + '<input type="file" name="selectedFile" id="selectedFile" class="uploadChooser" />' +
	'</div>';

	ApplyPatchDialog.prototype._init = function(options) {
		this.title = messages["ApplyPatchDialog"];
		this.modal = true;
		this.messages = messages;
		this.options = options;
		this.customFocus = true;

		this.buttons = [];

		this.buttons.push({
			callback: function() {
				if (this.$okButton.classList.contains(this.DISABLED)) {
					return;
				}
				this._applyPatch();
			}.bind(this),
			id: "okButton",
			text: messages["OK"]
		});

		// Start the dialog initialization.
		this._initialize();
	};

	/** @callback */
	ApplyPatchDialog.prototype._bindToDom = function(parent) {
		var updateOkEnablement = function() {
			if ((this.$fileRadio.checked && this.$selectedFile.value) || (this.$urlRadio.checked && this.$patchurl.value)) {
				this.$okButton.classList.remove(this.DISABLED);
			} else {
				this.$okButton.classList.add(this.DISABLED);
			}
		}.bind(this);

		this.$selectedFile.onchange = function() {
			this.$urlRadio.checked = false;
			this.$fileRadio.checked = "fileRadio";
			updateOkEnablement();
		}.bind(this);
		this.$patchurl.onfocus = function() {
			this.$urlRadio.checked = "urlRadio";
			this.$fileRadio.checked = false;
			updateOkEnablement();
		}.bind(this);
		this.$patchurl.onkeyup = function() {
			this.$urlRadio.checked = "urlRadio";
			this.$fileRadio.checked = false;
			updateOkEnablement();
		}.bind(this);
		this.$urlRadio.onchange = function() {
			updateOkEnablement();
		}.bind(this);
		this.$fileRadio.onchange = function() {
			updateOkEnablement();
		}.bind(this);

		this.$okButton.classList.add(this.DISABLED);

		window.setTimeout(
			function() {
				this.$patchurl.focus();
			}.bind(this),
			0
		);
	};

	/** @callback */
	ApplyPatchDialog.prototype._applyPatch = function(parent) {
		var formData = new FormData();
		formData.append("uploadedfile", this.$selectedFile.files[0]);
		formData.append("url", this.$patchurl.value);
		formData.append("radio", this.$fileRadio.checked ? "fileRadio" : "urlRadio");

		this.req = new XMLHttpRequest();
		this.req.open('post', this.options.diffLocation);
		this.req.setRequestHeader("Orion-Version", "1");
		this.req.onreadystatechange = this.handleReadyState.bind(this);
		xsrfUtils.addCSRFNonce(this.req);
		this.req.send(formData);
	};

	/** @callback */
	ApplyPatchDialog.prototype.handleReadyState = function(state) {
		if (this.req.readyState === 4) {
			if (this.req.status === 200){
				if (this.options.deferred){
					this.options.deferred.resolve(this.req.responseText);
				}
			} else {
				if (this.options.deferred){
					this.options.deferred.reject(this.req.responseText);
				}
			}
			this.hide();
		}
	};

	ApplyPatchDialog.prototype.constructor = ApplyPatchDialog;

	// return the module exports
	return {ApplyPatchDialog : ApplyPatchDialog};

});
