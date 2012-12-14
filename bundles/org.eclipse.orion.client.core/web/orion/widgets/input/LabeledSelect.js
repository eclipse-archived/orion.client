/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets orion  window console define localStorage*/
/*jslint browser:true*/

/* This SettingsContainer widget is a dojo border container with a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */
   
   /* this.inherited(arguments);
			this.mylabel.textContent = this.fieldlabel + ':'; //$NON-NLS-0$ */

define(['i18n!orion/settings/nls/messages', 'require' ], 
	function(messages, require) {
	
		function LabeledSelect( label, options, node ){
			this.anchor = node;		
			this.anchor.innerHTML = this.templateString;
			this.options = options;
			this.options.forEach( this.addOptions.bind(this) );
			this.anchor.firstChild.onchange = this.change.bind(this);
		}
		
		var anchor;
		
		LabeledSelect.prototype.anchor = anchor;
		
		var templateString =	'<div class="setting-property">' +  //$NON-NLS-0$
									'<label>' + //$NON-NLS-0$
										'<span class="setting-label"></span>' + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
										'<select class="setting-control"></select>' + //$NON-NLS-0$
									'</label>' +  //$NON-NLS-0$
								'</div>'; //$NON-NLS-0$

		LabeledSelect.prototype.templateString = templateString;
		
		function addOptions(item, index, ar){			
			var option = document.createElement("option");
			option.value = item.value;
			option.appendChild(document.createTextNode(item.label));
			this.anchor.firstChild.appendChild(option);
			if( item.selected === true ){
				this.anchor.firstChild.value = item.value;
			}
		}
		
		LabeledSelect.prototype.addOptions = addOptions;
		
		function setStorageItem(){
			// to be overridden with a choice of function to store the picked color
		}
		
		LabeledSelect.prototype.setStorageItem = setStorageItem;
		
		function getSelected(){
			return this.selection.value;
		}
		
		LabeledSelect.prototype.getSelected = getSelected;
	
		function getSelectedIndex() {
			return this.selection.selectedIndex;
		}
		
		LabeledSelect.prototype.getSelectedIndex = getSelectedIndex;
	
		function setSelectedIndex(index) {
			this.selection.selectedIndex = index;
		}
		
		LabeledSelect.prototype.setSelectedIndex = setSelectedIndex;
	
		function change(){
		
			var value = this.anchor.firstChild.value;
			
			if( this.category ){
				this.setStorageItem( this.category, this.item, this.element, value, this.ui );
			}else{
				this.setStorageItem( value );
			}
		}
		
		LabeledSelect.prototype.change = change;
	
		return{
			LabeledSelect:LabeledSelect
		};
	}
);
