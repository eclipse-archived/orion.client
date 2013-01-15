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
/*global define window document XMLHttpRequest*/

define(['i18n!orion/globalSearch/nls/messages', 'require', 'orion/searchUtils', 'orion/contentTypes', "orion/i18nUtil"], function(messages, require, mSearchUtils, mContentTypes, i18nUtil){

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
		this.containerId = this._idPrefix + "UIContainer"; //$NON-NLS-0$
		this._dismissed = true;
		var that = this;
		this._optRenderer = new advSearchOptRenderer(searcher, serviceRegistry, function(){that.dismiss();that._inputField.focus();});
		this._initUI();
	}
	
	advSearchOptContainer.prototype._initUI = function(){
		this._optUIContainer = document.getElementById(this.containerId);
		if(!this._optUIContainer){
			this._optUIContainer = document.createElement('div'); //$NON-NLS-0$
			this._optUIContainer.id = this.containerId;
			this._optUIContainer.style.display = "none"; //$NON-NLS-0$
			this._optUIContainer.className = "advSearchOptContainer"; //$NON-NLS-0$
			document.body.appendChild(this._optUIContainer);
			this._optRenderer.render(this._optUIContainer/*, 'orion/globalSearch/advSearchOpt.html'*/);			
		}
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
	
	advSearchOptRenderer.prototype.getOptions = function(){
		return {searchStr: this._searchBox.value,
				caseSensitive: this._caseSensitiveCB.checked,
		        regEx: this._regExCB.checked,
		        type: this._fileTypes.options[this._fileTypes.selectedIndex].value
		};
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
		var options = this.getOptions();
		mSearchUtils.doSearch(this._searcher, this._serviceRegistry, options.searchStr, options);
	};
	
	advSearchOptRenderer.prototype._initControls = function(){
		this._searchBox = document.getElementById("advSearchInput"); //$NON-NLS-0$
		this._fileTypes = document.getElementById("advSearchTypes"); //$NON-NLS-0$
		this._caseSensitiveCB = document.getElementById("advSearchCaseSensitive"); //$NON-NLS-0$
		this._regExCB = document.getElementById("advSearchRegEx"); //$NON-NLS-0$
		this._submitButton = document.getElementById("advSearchSubmit"); //$NON-NLS-0$
		//Load file types content type provider
		var fTypes = [ {label: messages["All types"], value: mSearchUtils.ALL_FILE_TYPE} ];
		for(var i = 0; i < this.contentTypesCache.length; i++){
			if(this.contentTypesCache[i]['extends'] === "text/plain" || this.contentTypesCache[i].id === "text/plain"){ //$NON-NLS-0$  //$NON-NLS-0$
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
		//Add listeners
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
		
		this._fileTypes.addEventListener("change", function(e) { //$NON-NLS-0$
			var type = that._fileTypes.options[that._fileTypes.selectedIndex].value;
			if(type === mSearchUtils.ALL_FILE_TYPE){
				that._searchBox.placeholder = messages["Type a search term"];
			} else {
				that._searchBox.placeholder =i18nUtil.formatMessage(messages["All ${0} files"], type);
			}
		});
		
		this._submitButton.onclick = function(e){
			that._submitSearch();
		};
	};
	
	advSearchOptRenderer.prototype._initHTMLLabels = function(){
		document.getElementById("advSearchLabel").appendChild(document.createTextNode(messages["Files that contain:"])); //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchInput").placeholder = messages["Type a search term"]; //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchTypeLabel").appendChild(document.createTextNode(messages["File type:"])); //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchCaseSensitiveLabel").appendChild(document.createTextNode(messages["Case sensitive"])); //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchRegExLabel").appendChild(document.createTextNode(messages["Regular expression"])); //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchSubmit").value = messages["Search"]; //$NON-NLS-0$ //$NON-NLS-0$
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
	    	that._initControls();
		};
		xhr.send();
	};
	
	advSearchOptRenderer.prototype._htmlTemplate =
							'<ul class="advSearchOptUL">' + 
								'<li class="advSearchOptLILabel">' +
									'<label>' + messages["Files that contain:"] + '</label>' +
								'</li>' +
								'<li class="advSearchOptLIControl">' +
									'<input type="text" id="advSearchInput" placeholder="' + messages["Type a search term"] + '"></input>' +
								'</li>' +
								'<li class="advSearchOptLIControl">' +
									'<label>' + messages["File type:"] + '</label>' +
									'<select id="advSearchTypes"></select>' +
								'</li>' +
								'<li class="advSearchOptLIControl">' +
									'<label>' + messages["Case sensitive"] + '</label>' +
									'<input type="checkbox" id="advSearchCaseSensitive"></input>' +
								'</li>' +
								'<li class="advSearchOptLIControl">' +
									'<label>' + messages["Regular expression"] + '</label>' +
									'<input type="checkbox" id="advSearchRegEx"></input>' +
								'</li>' +
								'<li class="advSearchOptLIControl">' +
									'<input type="button" class="advSearchOptButton" id="advSearchSubmit" value="' + messages["Search"] + '"></input>' +
								'</li>' +
							'</ul>';
	
	advSearchOptRenderer.prototype._renderRaw = function(){
		this._parentDiv.innerHTML = this._htmlTemplate;
	    this._initControls();
	};
	
	advSearchOptRenderer.prototype.constructor = advSearchOptRenderer;
	
	//return module exports
	return {
		advSearchOptContainer: advSearchOptContainer,
		advSearchOptRenderer: advSearchOptRenderer
	};
});
