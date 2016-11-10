/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define(['orion/objects', 'orion/webui/littlelib'], function(objects, lib) {

	function Chip(options, node) {
		objects.mixin(this, options);
		this.node = node || document.createElement('div'); //$NON-NLS-0$
		this.node.innerHTML = this.templateString;
		this.closeBtn = lib.$('.chip-close-btn', this.node); //$NON-NLS-0$
		this.chip = lib.$('.orion-chip', this.node); //$NON-NLS-0$
		this.chipContentSpan = lib.$('.orion-chip-content', this.node); //$NON-NLS-0$
	}
	objects.mixin(Chip.prototype, {
		templateString: '' +  //$NON-NLS-0$
				'<div class="orion-chip">' + //$NON-NLS-0$
					'<span class="orion-chip-content"></span>' + //$NON-NLS-0$
					'<span class="chip-close-btn"/>&times;</span>' + //$NON-NLS-0$
				'</div>',  //$NON-NLS-0$
						
		show: function(){
			this.chipContentSpan.textContent = this.chipContent;
			this.closeBtn.addEventListener('click', this.remove.bind(this)); //$NON-NLS-0$
        },

		destroy: function() {
			if (this.node) {
				lib.empty(this.node);
				this.node = null;
			}
		},
		
		getValue: function(){
			return this.chipContentSpan.textContent;
		},
		
		remove: function(){
			if (this.postChange) {
				this.postChange(this.chip.value);
			}
			this.destroy();
		},
    });
    return Chip;
});