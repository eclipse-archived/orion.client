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
define(['orion/objects', 'orion/webui/littlelib','orion/widgets/input/Checkbox','orion/widgets/input/TextField'], function(objects, lib, Checkbox, TextField) {

	function InputListItem(options, node) {
		objects.mixin(this, options);
		this.node = node || document.createElement('div'); //$NON-NLS-0$
		this.create();
	}
	objects.mixin(InputListItem.prototype, {
						
		show: function(){
			this.checkbox.addEventListener('change', this.checkboxchange.bind(this)); //$NON-NLS-0$
			this.inputbox.addEventListener('change', this.textboxchange.bind(this)); //$NON-NLS-0$
			this.postCreate();
        },
        create: function() {
        	// TODO allow multiple text field
        	this.checkbox = new Checkbox(); //$NON-NLS-0$
			this.inputbox = new TextField(); //$NON-NLS-0$
        	this.node.appendChild(this.inputbox.textfield);
        	this.node.appendChild(this.checkbox.checkbox);
        	this.node.classList.add("setting-row");
        },
		destroy: function() {
			if (this.node) {
				lib.empty(this.node);
				this.node = null;
				this.checkbox = null;
				this.inputbox = null;
			}
		},
		
		isChecked : function(){
			return this.checkbox.checked;
		},
		
		setChecked : function(value){
			this.checkbox.checked = value;
		},
		
		getSelection: function(){
			return this.isChecked();
		},
		
		setSelection: function(value){
			this.setChecked(value);
		},
		
        getValue: function(){
			if( this.inputType === "integer"){ //$NON-NLS-0$
				return parseInt(this.textfield.value, 10);
			}
			return this.textfield.value;
        },
		
		setValue: function( value ){
			this.textfield.value = value;
		},
		
        checkboxchange: function(){
            if (this.postChange) {
				this.postChange(this.checkbox.value);
			}
        },
        
        textboxchange: function(){
        	if (this.postChange) {
				this.postChange(this.textfield.value, event);
			}
        },
        
        postCreate: function(){
            this.checkbox.style.width = '20px';
            
            if( this.editmode && this.editmode === 'readonly' ){ //$NON-NLS-0$
				this.checkbox.setAttribute("disabled", "disabled"); //$NON-NLS-1$ //$NON-NLS-0$
            }
        }
    });
    return InputListItem;
});