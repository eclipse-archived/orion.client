/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define(['i18n!orion/globalSearch/nls/messages', 'orion/searchUtils', 'orion/contentTypes'], function(messages, mSearchUtils, mContentTypes){

	/**
	 * advSearchOptContainer is the drop down container for all advanced search options.
	 * When binded with an html input element, it provides the search advanced options for the input field.
	 * @param {DOMElement} inputFieldOrId The "text" type input html element. This is required.
	 */
	function advSearchOptContainer(inputFieldOrId, searcher, serviceRegistry, options) {
		this._inputField = inputFieldOrId;
		if (typeof(this._inputField) === "string") { //$NON-NLS-0$
			this._inputField = document.getElementById(this._inputField);
		}
		var idFrefix = options ? options.group: null;
		if(!idFrefix){
			if(this._inputField.id){
				idFrefix = this._inputField.id;
			} else {
				idFrefix = "default__dropDown__group"; //$NON-NLS-0$
			}
		}
		this._idPrefix = idFrefix + "__dropDown__"; //$NON-NLS-0$
		this._dismissed = true;
		this._optRenderer = new advSearchOptRenderer(searcher, serviceRegistry, this._idPrefix);
		this._initUI();
	}
	
	advSearchOptContainer.prototype._getUIContainerID = function(){
		return this._idPrefix + "UIContainer"; //$NON-NLS-0$
	};

	advSearchOptContainer.prototype._initUI = function(){
		this._optUIContainer = document.getElementById(this._getUIContainerID());
		if(!this._optUIContainer){
			this._optUIContainer = document.createElement('div'); //$NON-NLS-0$
			this._optUIContainer.id = this._getUIContainerID();
			this._optUIContainer.style.display = "none"; //$NON-NLS-0$
			this._optUIContainer.className = "advSearchOptContainer"; //$NON-NLS-0$
			document.body.appendChild(this._optUIContainer);
			this._optRenderer.render(this._optUIContainer);			
		}
	};
	
	advSearchOptContainer.prototype.clicked = function(target){
		if(this._dismissed){
			return true;
		}
		var parent = target;
		while (parent) {
			if(parent === this._optUIContainer){
				return true;
			}
	        parent = parent.parentNode;
		}
		return false;
	};
	
	advSearchOptContainer.prototype.dismiss = function(valueToInputField){
		this._dismissed = true;
		this._optUIContainer.style.display = "none"; //$NON-NLS-0$
	};
	
	advSearchOptContainer.prototype.show = function(defaultSearchStr){
		var curLeft=0, curTop=0;
		var offsetParent = this._inputField;
		while (offsetParent) {
			curLeft += offsetParent.offsetLeft;
			curTop += offsetParent.offsetTop;
	        offsetParent = offsetParent.offsetParent;
		}
		this._optUIContainer.style.display = "block"; //$NON-NLS-0$
		this._optUIContainer.style.top = curTop + this._inputField.offsetHeight + 2 + "px"; //$NON-NLS-0$
		this._optUIContainer.style.left = curLeft + "px"; //$NON-NLS-0$
		this._optUIContainer.style.width = this._inputField.offsetWidth + "px"; //$NON-NLS-0$
		this._optRenderer._searchBox.value = defaultSearchStr;
		this._optRenderer._searchBox.focus();
		this._mouseDown = false;
		this._dismissed = false;
	};
	
	advSearchOptContainer.prototype.toggle = function(){
		if(this._dismissed){
			this.show(this._inputField.value);
		} else {
			this.dismiss();
		}
	};
		
	advSearchOptContainer.prototype.constructor = advSearchOptContainer;
	
	function advSearchOptRenderer(searcher, serviceRegistry, controlIdPrefix) {
		this._searcher = searcher;
		this._serviceRegistry = serviceRegistry;
		this._controlIdPrefix = controlIdPrefix;
	}
	
	advSearchOptRenderer.prototype._createListEle = function(ul, className, control){
		var listEle = document.createElement('li'); //$NON-NLS-0$
		listEle.className = className;
		if(control instanceof Array){
			for(var i = 0; i < control.length; i++){
				listEle.appendChild(control[i]);
			}
		} else if(control){
			listEle.appendChild(control);
		}
		ul.appendChild(listEle);
		return listEle;
	};
	
	advSearchOptRenderer.prototype.getOptions = function(){
		return {searchStr: this._searchBox.value,
		        regEx: this._regExCB.checked,
		        type: this._fileTypes.options[this._fileTypes.selectedIndex].value
		}
	};

	advSearchOptRenderer.prototype.render = function(parentDiv){
		this._parentDiv = parentDiv;
		if (typeof(this._parentDiv) === "string") { //$NON-NLS-0$
			this._parentDiv = document.getElementById(this._parentDiv);
		}
		var contentTypeService = this._serviceRegistry.getService("orion.core.contenttypes"); //$NON-NLS-0$
		if(!contentTypeService){
			contentTypeService = new mContentTypes.ContentTypeService(this._serviceRegistry);
			this.contentTypesCache = contentTypeService.getContentTypes();
			this._render();
		} else {
			var self = this;
			contentTypeService.getContentTypes().then(function(ct) {
				self.contentTypesCache = ct;
				self._render();
			});
		}
	};
	
	advSearchOptRenderer.prototype._render = function(){
		//Create html collection for all the controls as rows of LI
		var ul = document.createElement('ul');//$NON-NLS-0$
		ul.className = "advSearchOptUL";//$NON-NLS-0$
		this._parentDiv.appendChild(ul);		
		
		//Create search Label
		var label = document.createElement('label'); //$NON-NLS-0$
		label.appendChild(document.createTextNode(messages["Files that contain:"])); //$NON-NLS-0$
		this._createListEle(ul, "advSearchOptLILabel", label); //$NON-NLS-0$
		var that = this;
		//Create search input box
		this._searchBox = document.createElement('input'); //$NON-NLS-0$
		this._searchBox.type = "text"; //$NON-NLS-0$
		this._createListEle(ul, "advSearchOptLIControl", this._searchBox); //$NON-NLS-0$
		this._searchBox.addEventListener("keydown", function(e) { //$NON-NLS-0$
			var keyCode= e.charCode || e.keyCode;
			if (keyCode === 13 ) {// ENTER
				if(that._searchBox.value.length > 0){
					var options = that.getOptions();
					mSearchUtils.doSearch(that._searcher, that._serviceRegistry, options.searchStr, options);
				} 
			} 
		});

		//Create file type combo box
		var fTypes = [ {label: messages["All types"], value: mSearchUtils.ALL_FILE_TYPE} ];
		this._fileTypes = document.createElement('select'); //$NON-NLS-0$
		
		for(var i = 0; i < this.contentTypesCache.length; i++){
			if(this.contentTypesCache[i]['extends'] === "text/plain"){ //$NON-NLS-0$  //$NON-NLS-0$
				for(var j = 0; j < this.contentTypesCache[i].extension.length; j++){
					fTypes.push({label: this.contentTypesCache[i].extension[j], value: this.contentTypesCache[i].extension[j]});
				}
			}
		}
		
		for(var x = 0; x < fTypes.length; x++ ) {
			var option = document.createElement('option'); //$NON-NLS-0$
		 	var text = document.createTextNode(fTypes[x].label);
			option.appendChild(text);
		 	this._fileTypes.appendChild(option); 
			option.value = fTypes[x].value; 
		} 
		label = document.createElement('label'); //$NON-NLS-0$
		label.appendChild(document.createTextNode(messages["On file type:"]));
		this._createListEle(ul, "advSearchOptLIControl", [label, this._fileTypes]); //$NON-NLS-0$
		
	    //Create regular expresion check box
	    this._regExCB = document.createElement('input'); //$NON-NLS-0$
	    this._regExCB.type = 'checkbox'; //$NON-NLS-0$
	    this._regExCB.checked = false;
		label = document.createElement('label'); //$NON-NLS-0$
		label.appendChild(document.createTextNode(messages["Regular expresion:"]));
		this._createListEle(ul, "advSearchOptLIControl", [label, this._regExCB]); //$NON-NLS-0$
		
		//Create search button
		var submit = document.createElement('input'); //$NON-NLS-0$
		submit.type = "button"; //$NON-NLS-0$
		submit.value = "Search"; //$NON-NLS-0$
		submit.className = "advSearchOptButton"; //$NON-NLS-0$
		this._createListEle(ul, "advSearchOptLIControl", submit); //$NON-NLS-0$
		submit.onclick = function(e){
			if(that._searchBox.value.length > 0){
				var options = that.getOptions();
				mSearchUtils.doSearch(that._searcher, that._serviceRegistry, options.searchStr, options);
			} 
		}
	};
	
	advSearchOptRenderer.prototype.constructor = advSearchOptRenderer;
	
	//return module exports
	return {
		advSearchOptContainer: advSearchOptContainer,
		advSearchOptRenderer: advSearchOptRenderer
	};
});
