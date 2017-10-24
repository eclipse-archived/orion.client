/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define(['orion/objects', 'orion/webui/littlelib', 'orion/widgets/input/TextField'], function(objects, lib, TextField) {

	function SettingsTextfield(params, node) {
		makeLocalTextfield(params);
		TextField.apply(this, arguments);
		this.mylabel = lib.$(".setting-label", this.node); //$NON-NLS-0$
	}

	objects.mixin(SettingsTextfield.prototype, TextField.prototype, makeTextfield());

	function makeLocalTextfield(params) {
		var newTextfield = makeTextfield();

		if (params.local) {
			newTextfield.templateString =
			'<label>' + //$NON-NLS-0$
				'<span class="setting-label"></span>' + //$NON-NLS-0$
				'<input class="setting-control" type="text" />' + //$NON-NLS-0$
			'</label>';  //$NON-NLS-0$

			objects.mixin(SettingsTextfield.prototype, TextField.prototype, newTextfield);
		}
	}


	function makeTextfield() {
		return {
			templateString:
			'<div>' +  //$NON-NLS-0$
				'<label>' + //$NON-NLS-0$
					'<span class="setting-label"></span>' + //$NON-NLS-0$
					'<input class="setting-control" type="text" />' + //$NON-NLS-0$
				'</label>' + //$NON-NLS-0$
			'</div>', //$NON-NLS-0$

			destroy: function() {
				TextField.prototype.destroy.call(this);
				if (this.mylabel) {
					this.mylabel = null;
				}
			},

			postCreate: function(){
				TextField.prototype.postCreate.call(this);
				this.mylabel.textContent = this.fieldlabel;
				if(this.fieldTitle) {
					this.mylabel.parentNode.title = this.fieldTitle;
				}
				if(this.fieldType) {
					this.textfield.type = this.fieldType;
				}
				if(this.fieldMin !== undefined) {
					this.textfield.min = this.fieldMin;
				}
			}
		}
	}

	return SettingsTextfield;
});