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

define(['i18n!orion/globalSearch/nls/messages', 'require', 'orion/searchUtils', 'orion/contentTypes'], function(messages, require, mSearchUtils, mContentTypes){

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
		var that = this;
		this._optRenderer = new advSearchOptRenderer(searcher, serviceRegistry, function(){that.dismiss();that._inputField.focus();});
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
			this._optRenderer.render(this._optUIContainer/*, 'orion/globalSearch/advSearchOpt.html'*/);			
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
	
	function advSearchOptRenderer(searcher, serviceRegistry, cancelCallBack) {
		this._searcher = searcher;
		this._serviceRegistry = serviceRegistry;
		this._cancelCallBack = cancelCallBack;
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

	advSearchOptRenderer.prototype.render = function(parentDiv, htmlTemplate){
		this._parentDiv = parentDiv;
		if (typeof(this._parentDiv) === "string") { //$NON-NLS-0$
			this._parentDiv = document.getElementById(this._parentDiv);
		}
		var contentTypeService = this._serviceRegistry.getService("orion.core.contenttypes"); //$NON-NLS-0$
		if(!contentTypeService){
			contentTypeService = new mContentTypes.ContentTypeService(this._serviceRegistry);
			this.contentTypesCache = contentTypeService.getContentTypes();
			this._render(htmlTemplate);
		} else {
			var that = this;
			contentTypeService.getContentTypes().then(function(ct) {
				that.contentTypesCache = ct;
				that._render(htmlTemplate);
			});
		}
	};

	advSearchOptRenderer.prototype._render = function(htmlTemplate){
		if(htmlTemplate){
			this._renderHTML(htmlTemplate);
		} else {
			this._renderRaw();
		}
	};
	
	advSearchOptRenderer.prototype._submitSearch = function(){
		if(this._searchBox.value.length > 0){
			var options = this.getOptions();
			mSearchUtils.doSearch(this._searcher, this._serviceRegistry, options.searchStr, options);
		} 
	};
	
	advSearchOptRenderer.prototype._loadFileTypes = function(){
		var fTypes = [ {label: messages["All types"], value: mSearchUtils.ALL_FILE_TYPE} ];
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
	};
	
	advSearchOptRenderer.prototype._addListeners = function(){
		var that = this;
		this._searchBox.addEventListener("keydown", function(e) { //$NON-NLS-0$
			var keyCode= e.charCode || e.keyCode;
			if (keyCode === 13 ) {// ENTER
				that._submitSearch();
			} 
			if (keyCode === 27 ) {// ESC
				if(that._cancelCallBack){
					that._cancelCallBack();
				}
			} 
		});
		this._submitButton.onclick = function(e){
			that._submitSearch();
		}
	};

	advSearchOptRenderer.prototype._initHTMLControls = function(){
		this._searchBox = document.getElementById("advSearchInput"); //$NON-NLS-0$
		this._fileTypes = document.getElementById("advSearchTypes"); //$NON-NLS-0$
		this._regExCB = document.getElementById("advSearchRegEx"); //$NON-NLS-0$
		this._submitButton = document.getElementById("advSearchSubmit"); //$NON-NLS-0$
		this._submitButton.value = messages["Search"]; //$NON-NLS-0$
	};
	
	advSearchOptRenderer.prototype._initHTMLLabels = function(){
		document.getElementById("advSearchLabel").appendChild(document.createTextNode(messages["Files that contain:"])); //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchTypeLabel").appendChild(document.createTextNode(messages["File type:"])); //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchRegExLabel").appendChild(document.createTextNode(messages["Regular expression:"])); //$NON-NLS-0$ //$NON-NLS-0$
	};
	
	advSearchOptRenderer.prototype._renderHTML = function(htmlTemplate){
		var that =this;
		var xhr= new XMLHttpRequest();
		xhr.open('GET', require.toUrl(htmlTemplate), true);
		xhr.onreadystatechange= function() {
	   		if (this.readyState!==4) return;
	    	if (this.status!==200) return; 
	    	that._parentDiv.innerHTML= this.responseText;
	    	that._initHTMLLabels();
	    	that._initHTMLControls()
	    	that._loadFileTypes();
	    	that._addListeners();
		};
		xhr.send();
	};
	
	advSearchOptRenderer.prototype._renderRaw = function(){
		//Create html collection for all the controls as rows of LI
		var ul = document.createElement('ul');//$NON-NLS-0$
		ul.className = "advSearchOptUL";//$NON-NLS-0$
		this._parentDiv.appendChild(ul);		
		
		//Create search Label
		var label = document.createElement('label'); //$NON-NLS-0$
		label.appendChild(document.createTextNode(messages["Files that contain:"])); //$NON-NLS-0$
		this._createListEle(ul, "advSearchOptLILabel", label); //$NON-NLS-0$
		
		//Create search input box
		this._searchBox = document.createElement('input'); //$NON-NLS-0$
		this._searchBox.type = "text"; //$NON-NLS-0$
		this._createListEle(ul, "advSearchOptLIControl", this._searchBox); //$NON-NLS-0$

		//Create file type combo box
		this._fileTypes = document.createElement('select'); //$NON-NLS-0$
		label = document.createElement('label'); //$NON-NLS-0$
		label.appendChild(document.createTextNode(messages["File type:"]));
		this._createListEle(ul, "advSearchOptLIControl", [label, this._fileTypes]); //$NON-NLS-0$
		
	    //Create regular expression check box
	    this._regExCB = document.createElement('input'); //$NON-NLS-0$
	    this._regExCB.type = 'checkbox'; //$NON-NLS-0$
	    this._regExCB.checked = false;
		label = document.createElement('label'); //$NON-NLS-0$
		label.appendChild(document.createTextNode(messages["Regular expression:"]));
		this._createListEle(ul, "advSearchOptLIControl", [label, this._regExCB]); //$NON-NLS-0$
		
		//Create search button
		this._submitButton = document.createElement('input'); //$NON-NLS-0$
		this._submitButton.type = "button"; //$NON-NLS-0$
		this._submitButton.value = messages["Search"]; //$NON-NLS-0$
		this._submitButton.className = "advSearchOptButton"; //$NON-NLS-0$
		this._createListEle(ul, "advSearchOptLIControl", this._submitButton); //$NON-NLS-0$
		
    	this._loadFileTypes();
    	this._addListeners();
	};
	
	advSearchOptRenderer.prototype.constructor = advSearchOptRenderer;
	
	//return module exports
	return {
		advSearchOptContainer: advSearchOptContainer,
		advSearchOptRenderer: advSearchOptRenderer
	};
});
