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
/*eslint-env browser, amd*/

/* Shows labeled sections */
// TODO convert to orion/section

define([
	'orion/webui/littlelib', //$NON-NLS-0$
], function(lib) {

	/**
	 * @param options
	 * @param {String} options.sectionName
	 * @param {DomNode} options.parentNode
	 * @param {Labeled*} options.children Child Labeled* widgets
	 */
	function Subsection(options) {
		var sectionName = options.sectionName;
		this.parentNode = options.parentNode;
		this.children = options.children;
		
		var node = document.createElement('section'); //$NON-NLS-0$
		node.classList.add('setting-row'); //$NON-NLS-0$
		node.setAttribute('role', 'region'); //$NON-NLS-1$ //$NON-NLS-0$
		var headerId = this.headerId = 'setting-header-' + sectionName.replace(/\s/g, ''); //$NON-NLS-0$
		node.setAttribute('aria-labelledby', headerId); //$NON-NLS-0$
		var titleNode = this.titleNode = document.createElement('div'); //$NON-NLS-0$
		titleNode.classList.add('setting-header'); //$NON-NLS-0$
		if(options.additionalCssClass) {
			titleNode.classList.add(options.additionalCssClass); //$NON-NLS-0$
		}
		titleNode.id = headerId;
		titleNode.textContent = sectionName;
		var content = document.createElement('div'); //$NON-NLS-0$
		content.classList.add('setting-content'); //$NON-NLS-0$
		node.appendChild(titleNode);
		node.appendChild(content);

		this.node = node;
		this.subsectionContent = content;
		
		this.canHide = options.canHide;
		if(options.canHide){
			var that = this;
			this.titleNode.style.cursor = "pointer"; //$NON-NLS-0$
			this.titleNode.tabIndex = 0; //$NON-NLS-0$
			this.titleNode.addEventListener("click", function(evt) { //$NON-NLS-0$
				that.setHidden(!that.hidden);
			}, false);
			this.titleNode.addEventListener("keydown", function(evt) { //$NON-NLS-0$
				if (evt.target === that.titleNode) {
					if(evt.keyCode === lib.KEY.ENTER) {
						that.setHidden(!that.hidden);
					} else if(evt.keyCode === lib.KEY.ESCAPE) {
						that.setHidden(true);
					}
					evt.stopPropagation();
				}
			}, false);
			this.setHidden("true" === localStorage.getItem(headerId +"/hidden"));
		}
	}
	Subsection.prototype.setHidden = function(hidden){
		this.hidden = hidden;
		localStorage.setItem(this.headerId +"/hidden", hidden);
		if (this.hidden) {
			this.subsectionContent.style.display = "none";
		} else {
			this.subsectionContent.style.display = "";
		}
	};
	Subsection.prototype.show = function(){
		if( this.parentNode ){
			this.parentNode.appendChild( this.node );
		}
		
		if( this.children ){
			var that = this;
			this.children.forEach(function(child) {
				that.subsectionContent.appendChild( child.node );
				child.show();
			});
		}
	};
	return Subsection;
});