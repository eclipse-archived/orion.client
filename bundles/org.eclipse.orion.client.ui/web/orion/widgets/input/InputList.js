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

	function InputList(options, node) {
		objects.mixin(this, options);
		this.node = node || document.createElement('div'); //$NON-NLS-0$
		this.node.innerHTML = this.templateString;
		this.items = lib.$('.list-items', this.node);
	}
	objects.mixin(InputList.prototype, {
		templateString: '' +  //$NON-NLS-0$
				'<div>' + //$NON-NLS-0$
					'<span class="setting-label">Exclude File or Folder</span>' +  //$NON-NLS-0$
					'<span class="setting-label">Check</span>' +  //$NON-NLS-0$
				'</div>' + //$NON-NLS-0$
				'<div class="list-items"/>',//$NON-NLS-0$
					
		delete: function(index){
			this.items.removeChild(this.items[index]);
        },
        add: function(inputListItem) {
        	this.items.appendChild(inputListItem);
        },
		destroy: function() {
			if (this.node) {
				lib.empty(this.node);
				this.node = null;
			}
		}
    });
    return InputList;
});