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

define(['i18n!orion/settings/nls/messages', 'orion/objects', 'orion/webui/littlelib'], 
	function(messages, objects, lib) {

		/**
		 * @param {Object[]} param.options Array of {value:Object, label:String, selected:Boolean(optional)}
		 */
		function LabeledSelect( params, node ){
			objects.mixin( this, params );
			this.node = node || document.createElement("div"); //$NON-NLS-0$
			this.node.innerHTML = this.templateString;
			this.mylabel = lib.$(".setting-label", this.node); //$NON-NLS-0$
			this.select = lib.$(".setting-control", this.node); //$NON-NLS-0$
			this.options = params.options;
		}
		objects.mixin(LabeledSelect.prototype, {
			templateString :	'<div class="setting-property">' +  //$NON-NLS-0$
									'<label>' + //$NON-NLS-0$
										'<span class="setting-label"></span>' + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
										'<select class="setting-control"></select>' + //$NON-NLS-0$
									'</label>' +  //$NON-NLS-0$
								'</div>', //$NON-NLS-0$

			addOptions : function(item, index, ar){			
				var option = document.createElement("option"); //$NON-NLS-0$
				option.value = item.value;
				option.appendChild(document.createTextNode(typeof item.label === "string" ? item.label : item.value));
				if( item.selected  ){
					option.selected = 'selected'; //$NON-NLS-0$
				}
				this.select.appendChild(option);
			},

			show: function() {
				this.postCreate();
			},

			postCreate: function() {
				this.options.forEach( this.addOptions.bind(this) );
				this.select.addEventListener("change",  this.change.bind(this)); //$NON-NLS-0$
				this.mylabel.textContent = this.fieldlabel + ':';
			},

			destroy: function() {
				if (this.node) {
					lib.empty(this.node);
					this.node = this.mylabel = this.select = null;
				}
			},

			setStorageItem : function(){
				// to be overridden with a choice of function to store the picked color
			},
			
			getSelected : function(){
				return this.select.value;
			},
		
			getSelectedIndex: function() {
				return this.select.selectedIndex;
			},
			
			setSelectedIndex : function setSelectedIndex(index) {
				this.select.selectedIndex = index;
			},
		
			change : function change(){
			
				var value = this.select.value;
				
				if( this.category ){
					this.setStorageItem( this.category, this.item, this.element, value, this.ui );
				}else{
					this.setStorageItem( value );
				}
			}
		});

		return LabeledSelect;
	}
);
