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

define([], function(){

	/**
	 * InputCompletion is an alternative to datalist support in html5.
	 * When binded with an html input element, it provides the input completion while user is typing in the input field.
	 * @param {DOMElement} inputFieldOrId The "text" type input html element. This is required.
	 * @param {function} binderFunc The callback function to provide a full set of proposal items that the proposal is based on.
	 * If a binder function is provided, every time when the input field is focused, we would ask for the full set of data and propose based on that.	 
	 * The parameter of the binderFunc is another call back function. The implementation of the binderFunc has to pass an array of 
	 * items to the call back.
	 * Each item must have 3 properties:
	 * <ul>
	 *   <li>type: can be either "proposal" or "category"</li>
	 *   <li>label: the display name of the item</li>
	 *   <li>value: the value that will be filtered on and send back to the input field</li>
	 * </ul>
	 *
	 * @param {Object} options The options that may affect how the proposal works.
	 * @param {Function} options.extendedProvider The extended provider function(keyword, callback(returnedProposals)) that provides additional proposals.
	 *        It basically provides a list of proposals by a given keyword and a call back. It should call the call back to return the proposals. 
	 * Each item in the return list must have properties as below:
	 * <ul>
	 *   <li>filterForMe: true or false. True means it asks inputCompletion to filter o nteh result. false means it is already filterd.
	 *   <li>proposals: A list/array of proposals. Each item has the properties {type, label, value} decribed above.</li>
	 * </ul>
	 * @param {String} options.group The group name of input completion. If there will be multiple input completion in one page, the group name is nice to provide.
	 * @param {Boolean} options.proposeFromStart The flag to propose strings that only match from start(index 0). If not provided, the flag is set to false.
	 * For example if this flag is true, "foo" will only match "fo" but not "oo". If false, "foo" will match both "fo" and "oo".
	 */
	function InputCompletion(inputFieldOrId, binderFunc, options) {
		this._inputField = inputFieldOrId;
		if (typeof(this._inputField) === "string") { //$NON-NLS-0$
			this._inputField = document.getElementById(this._inputField);
		}
		this._binderFunc = binderFunc;
		var idFrefix = options ? options.group: null;
		if(!idFrefix){
			if(this._inputField.id){
				idFrefix = this._inputField.id;
			} else {
				idFrefix = "default__input__group"; //$NON-NLS-0$
			}
		}
		this._completionIdPrefix = idFrefix + "__completion__"; //$NON-NLS-0$
		this._proposeFromStart = options ? options.proposeFromStart : false;
		this._extendedProvider = options ? options.extendedProvider : null;
		this._proposalIndex = -1;
		this._dismissed = true;
		this._mouseDown = false;
		this._dataList = [];
		this._initUI();
		
		var that = this;
		this._completionUIContainer.addEventListener("mousedown", function(e) {
			that._mouseDown = true;
		});
		this._completionUIContainer.addEventListener("mouseup", function(e) {
			that._mouseDown = false;
		});
		this._inputField.addEventListener("blur", function(e) {
			if(that._mouseDown){
				window.setTimeout(function(){ //wait a few milliseconds for the input field to focus 
					that._inputField.focus();
				}, 200);
			} else {
				that._dismiss();
			}
		});
		this._inputField.addEventListener("keydown", function(e) {
			that.onKeyDown(e);
		});
		this._inputField.addEventListener("input", function(e) {
			that._proposeOn(that._inputField.value);
		});
		this._inputField.addEventListener("focus", function(e) {
			if(!that._dismissed || !that._binderFunc){
				return;
			}
			if(that._dismissing){
				that._dismissing = false;
				return;
			}
			if(that._binderFunc){// If a binder function is provided, every time when the input field is focused, we would ask for the full set of data and propose based on that
				that._binderFunc(function(dataList){
					that._bind(dataList);
					that._proposeOn(that._inputField.value);
				});
			}
		});
	}
	
	/**
	 * The key listener on enter , down&up arrow and ESC keys.
	 * The user of the input completion has to listen on the key board events and call this function.
	 * If this function returns true, the caller's listener has to stop handling it.
	 */
	InputCompletion.prototype.onKeyDown = function(e){
		if(this._dismissed){
			return true;
		}
		var keyCode= e.charCode || e.keyCode;
		if (keyCode === 13/* Enter */) {//If there is already a selected/hightlighted item in the proposal list, then put hte proposal back to the input field and dismiss the proposal UI
			if(this._proposalList && this._proposalList.length > 0 && this._proposalIndex >= 0 && this._proposalIndex < this._proposalList.length){
				e.preventDefault();
				this._dismiss(this._proposalList[this._proposalIndex].item.value, e.ctrlKey);
				e.stopPropagation();
				return false;
			}
			return true;
		} else if((keyCode === 40 /* Down arrow */ || keyCode === 38 /* Up arrow */) && this._proposalList && this._proposalList.length > 0){
			e.preventDefault();
			this._walk(keyCode === 40);//In case of down or up arrows, jsut walk forward or backward in the list and highlight it.
			e.stopPropagation();
			return false;
		} else if(keyCode === 27/* ESC */) {
			e.preventDefault();
			this._dismiss();//Dismiss the proposal UI and do nothing.
			return false;
		}
		return true;
	};

	InputCompletion.prototype._bind = function(dataList){
		this._dataList = dataList;
	};
	
	InputCompletion.prototype._getUIContainerID = function(){
		return this._completionIdPrefix + "UIContainer";
	};

	InputCompletion.prototype._getUIProposalListId = function(){
		return this._completionIdPrefix + "UIProposalList";
	};
	
	InputCompletion.prototype._initUI = function(){
		this._completionUIContainer = document.getElementById(this._getUIContainerID());
		if(!this._completionUIContainer){
			this._completionUIContainer = document.createElement('div');
			this._completionUIContainer.id = this._getUIContainerID();
			this._completionUIContainer.style.display = "none"; //$NON-NLS-0$
			this._completionUIContainer.className = "inputCompletionContainer"; //$NON-NLS-0$
			this._completionUIContainer.setAttribute("role", "list");
			this._completionUIContainer.setAttribute("aria-atomic", "true");
			this._completionUIContainer.setAttribute("aria-live", "assertive");
			document.body.appendChild(this._completionUIContainer);
		}
		this._completionUIContainer.textContent = "";
		this._completionUL = document.getElementById(this._getUIProposalListId())
		if(!this._completionUL){
			this._completionUL = document.createElement('ul');//$NON-NLS-0$
			this._completionUL.id = this._getUIProposalListId();
			this._completionUL.className = "inputCompletionUL";//$NON-NLS-0$
		}
		this._completionUL.textContent = "";
		this._completionUIContainer.appendChild(this._completionUL);
	};
	
	InputCompletion.prototype._createProposalLink = function(name, href, boldIndex, boldLength) {
		var link = document.createElement("a"); //$NON-NLS-0$
		link.href = require.toUrl(href);
		link.appendChild(this._createBoldText(name, boldIndex, boldLength));
		return link;
	};
	
	InputCompletion.prototype._createBoldText = function(text, boldIndex, boldLength){
		if(boldIndex < 0){
			return document.createTextNode(text);
		}
		var parentSpan = document.createElement('span'); //$NON-NLS-0$
		var startIndex = 0;
		var textNode;
		if(startIndex !== boldIndex){
			textNode = document.createTextNode(text.substring(startIndex, boldIndex));
			parentSpan.appendChild(textNode);
		} 
		var matchSegBold = document.createElement('b'); //$NON-NLS-0$
		parentSpan.appendChild(matchSegBold);
		textNode = document.createTextNode(text.substring(boldIndex, boldIndex+boldLength));
		matchSegBold.appendChild(textNode);
		
		if((boldIndex + boldLength) < (text.length - 1)){
			textNode = document.createTextNode(text.substring(boldIndex + boldLength));
			parentSpan.appendChild(textNode);
		}
		return parentSpan;
	};
	
	InputCompletion.prototype._proposeOnCategory = function(categoryName, categoryList){
		if(categoryList.length === 0){
			return;
		}
		var that = this;
		if(categoryName){
			var listEle = document.createElement('li');
			listEle.className = "inputCompletionLICategory"; //$NON-NLS-0$
 			var liText = document.createTextNode(categoryName);
			listEle.appendChild(liText);
 			this._completionUL.appendChild(listEle);
		}
		for(var i=0; i < categoryList.length; i++){
			var listEle = document.createElement('li');
			listEle.onmouseover = function(e){
				that._selectProposal(e.currentTarget);
			};
			listEle.onclick = function(e){
				that._dismiss(e.currentTarget.completionItem.value);
			};
			listEle.className = "inputCompletionLINormal"; //$NON-NLS-0$
			listEle.completionItem = categoryList[i].item;
			if(typeof categoryList[i].item.value === "string"){
				var liTextEle = this._createBoldText(categoryList[i].item.value, categoryList[i].boldIndex, categoryList[i].boldLength);
				listEle.appendChild(liTextEle);
			} else if(categoryList[i].item.value.name && categoryList[i].item.value.type === "link"){
				listEle.appendChild(this._createProposalLink(categoryList[i].item.value.name, categoryList[i].item.value.value, categoryList[i].boldIndex, categoryList[i].boldLength));
			}
 			this._completionUL.appendChild(listEle);
 			this._proposalList.push({item: categoryList[i].item, domNode: listEle});
		}
	};

	InputCompletion.prototype._domNode2Index = function(domNode){
		for(var i=0; i < this._proposalList.length; i++){
			if(this._proposalList[i].domNode === domNode){
				return i;
			}
		}
		return -1;
	};
	
	InputCompletion.prototype._highlight = function(indexOrDomNode, selected){
		var domNode = indexOrDomNode;
		var fromIndex = false;
		if(!isNaN(domNode)){
			fromIndex = true;
			if(this._proposalList && indexOrDomNode >= 0 && indexOrDomNode < this._proposalList.length){
				domNode = this._proposalList[indexOrDomNode].domNode;
			} else {
				domNode = null;
			}
		}
		if(domNode){
			domNode.className = (selected ? "inputCompletionLISelected": "inputCompletionLINormal"); //$NON-NLS-0$ //$NON-NLS-0$
			if(selected && fromIndex){
				if (domNode.offsetTop < this._completionUIContainer.scrollTop) {
					domNode.scrollIntoView(true);
				} else if ((domNode.offsetTop + domNode.offsetHeight) > (this._completionUIContainer.scrollTop + this._completionUIContainer.clientHeight)) {
					domNode.scrollIntoView(false);
				}
			}
		}
	};

	InputCompletion.prototype._selectProposal = function(indexOrDomNode){
		var index = indexOrDomNode;
		if(isNaN(index)){
			index = this._domNode2Index(indexOrDomNode);
		}
		if(index !== this._proposalIndex){
			this._highlight(this._proposalIndex, false);
			this._proposalIndex = index;
			this._highlight(this._proposalIndex, true);
		}
	};
	
	InputCompletion.prototype._dismiss = function(valueToInputField, ctrlKey){
		if(this._mouseDown){
			return;
		}
		this._dismissed = true;
		this._proposalList = null;
		this._proposalIndex = -1;
		
		if(typeof valueToInputField === "string"){
			this._inputField.value = valueToInputField;
			this._dismissing = true;
			this._inputField.focus();
		} else if(valueToInputField && valueToInputField.name && valueToInputField.type === "link"){
			if(ctrlKey){
				window.open(valueToInputField.value);
			} else {
				window.location.href = valueToInputField.value;
			}
		}
		var that = this;
		window.setTimeout(function(){ //wait a few milliseconds for the proposal pane to hide 
			that._completionUIContainer.style.display = "none"; //$NON-NLS-0$
		}, 200);
	};
	
	InputCompletion.prototype._show = function(){
		if(this._proposalList && this._proposalList.length > 0){
			var curLeft=0, curTop=0;
			var offsetParent = this._inputField;
			while (offsetParent) {
				curLeft += offsetParent.offsetLeft;
				curTop += offsetParent.offsetTop;
		        offsetParent = offsetParent.offsetParent;
			}
			this._completionUIContainer.style.display = "block"; //$NON-NLS-0$
			this._completionUIContainer.style.top = curTop + this._inputField.offsetHeight + 2 + "px"; //$NON-NLS-0$
			this._completionUIContainer.style.left = curLeft + "px"; //$NON-NLS-0$
			this._completionUIContainer.style.width = this._inputField.offsetWidth + "px"; //$NON-NLS-0$
			this._mouseDown = false;
			this._dismissed = false;
		} else {
			this._dismissed = true;
			this._proposalList = null;
			this._proposalIndex = -1;
			this._completionUIContainer.style.display = "none"; //$NON-NLS-0$
		}
	};
	
	InputCompletion.prototype._walk = function(forwad){
		var index = this._proposalIndex + (forwad ? 1: -1);
		if(index < -1){
			index = this._proposalList.length -1;
		} else if( index >= this._proposalList.length){
			index = -1;
		}
		this._selectProposal(index);
	};
	
	InputCompletion.prototype._proposeOnList = function(datalist, searchTerm, filterForMe){
		var categoryName = "";
		var categoryList = [];
		var searchTermLen = searchTerm ? searchTerm.length : 0;
		for(var i=0; i < datalist.length; i++){
			if(datalist[i].type === "category"){ //$NON-NLS-0$
				this._proposeOnCategory(categoryName, categoryList);
				categoryName = datalist[i].label;
				categoryList = [];
			} else {
				var proposed = true;
				var pIndex = -1;
				if(searchTerm && filterForMe){
					var searchOn;
					if(typeof datalist[i].value === "string"){
						searchOn = datalist[i].value.toLowerCase();
					} else if(datalist[i].value.name){
						searchOn = datalist[i].value.name.toLowerCase();
					}
					pIndex = searchOn.indexOf(searchTerm);
					if(pIndex < 0){
						proposed = false;
					} else if(this._proposeFromStart){
						proposed = (pIndex === 0);
					} 
				}
				if(proposed){
					categoryList.push({item: datalist[i], boldIndex: pIndex, boldLength: searchTermLen});
				}
			}
		}
		this._proposeOnCategory(categoryName, categoryList);
	};
	
	InputCompletion.prototype._proposeOn = function(inputValue){
		this._completionUL.textContent = "";
		var searchTerm = inputValue ? inputValue.toLowerCase() : null;
		this._proposalList = [];
		//var topList = [{type: "proposal", value: {name: "Advanced Search", value: "/settings/settings.html", type: "link"}}]
		//this._proposeOnList(topList, searchTerm, false);
		this._proposeOnList(this._dataList, searchTerm, true);
		if(this._extendedProvider && searchTerm){
			var that = this;
			this._extendedProvider(inputValue, function(extendedProposals){
				if(extendedProposals){
					for(var i = 0; i < extendedProposals.length; i++){
						that._proposeOnList(extendedProposals[i].proposals, extendedProposals[i].filterForMe ? searchTerm : inputValue, extendedProposals[i].filterForMe);
					}
				}
				that._show();	
			}, []);
		} else {
			this._show();
		}
	};
	InputCompletion.prototype.constructor = InputCompletion;

	//return module exports
	return {
		InputCompletion: InputCompletion
	};
});
