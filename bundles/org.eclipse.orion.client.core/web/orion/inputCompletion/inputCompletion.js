/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define(['dojo'], function(dojo){

	/**
	 * InputCompletion is an alternative to datalist support in html5.
	 * When binded with an html input element, it provides the input completion while user is typing in the input field.
	 */
	function InputCompletion(binderFunc, completionId, inputField, completionUIContainer, options) {
		this._binderFunc = binderFunc;
		this._completionIdPrefix = completionId + "__completion__";
		this._inputField = inputField;
		if (typeof(this._inputField) === "string") { //$NON-NLS-0$
			this._inputField = document.getElementById(this._inputField);
		}
		this._completionUIContainer = completionUIContainer;
		if (typeof(this._completionUIContainer) === "string") { //$NON-NLS-0$
			this._completionUIContainer = document.getElementById(this._completionUIContainer);
		}
		this._proposeFromStart = options ? options.proposeFromStart : false;
		this._dismissed = true;
		var that = this;
		that._mouseDown = false;
		
		dojo.connect(this._completionUIContainer, "onmousedown", function(e){
			that._mouseDown = true;
		});
		dojo.connect(this._completionUIContainer, "onmouseup", function(e){
			that._mouseDown = false;
		});
		dojo.connect(this._inputField, "onblur", function(e){
			if(that._mouseDown){
				window.setTimeout(function(){ //wait a few milliseconds for the input field to focus 
					that._inputField.focus();
				}, 200);
			} else {
				that._dismiss();
			}
		});
		
		dojo.connect(this._inputField, "oninput", null, function(e){ //$NON-NLS-0$
			that.proposeOn(that._inputField.value);
		});
		dojo.connect(this._inputField, "onfocus", function(e){ //$NON-NLS-0$
			if(!that._dismissed || !that._binderFunc){
				return;
			}
			if(that._dismissing){
				that._dismissing = false;
				return;
			}
			that._binderFunc(function(dataList){
				that.bind(dataList);
				that.proposeOn(that._inputField.value);
			});
		});
	}
	
	/**
	 * Bind the full data list to propose on.
	 * 
	 * @param dataList 
	 * 
	 * <p>The data list is the full set of data that the input completion will filter on.</p>
	 * 
	 * The item of the data list must have two properties:
	 * <ul>
	 *   <li>type: can be either "proposal" or "category"</li>
	 *   <li>label: the display name of the item</li>
	 *   <li>value: the value that will be filtered on and send back to the input field</li>
	 * </ul>
	 */
	InputCompletion.prototype.bind = function(dataList){
		this._dataList = dataList;
	};
	
	InputCompletion.prototype._proposeOnCategory = function(categoryName, categoryList){
		if(categoryList.length === 0){
			return;
		}
		var that = this;
		if(categoryName){
			var listEle = document.createElement('li');
			listEle.className = "inputCompletionLICategory";
 			var liText = document.createTextNode(categoryName);
			listEle.appendChild(liText);
 			this._completionUL.appendChild(listEle);
		}
		for(var i=0; i < categoryList.length; i++){
			var listEle = document.createElement('li');
			dojo.connect(listEle, "onmouseover", function(e){
				that._selectProposal(e.currentTarget);
			});
			dojo.connect(listEle, "onclick", function(e){
				that._dismiss(e.currentTarget.completionItem.value);
			});
			listEle.className = "inputCompletionLINormal";
			listEle.completionItem = categoryList[i];
 			var liText = document.createTextNode(categoryList[i].value);
			listEle.appendChild(liText);
 			this._completionUL.appendChild(listEle);
 			this._proposalList.push({item: categoryList[i], domNode: listEle});
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
			domNode.className = (selected ? "inputCompletionLISelected": "inputCompletionLINormal");
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
	
	InputCompletion.prototype._dismiss = function(valueToInputField){
		if(this._mouseDown){
			return;
		}
		this._dismissed = true;
		this._proposalList = null;
		this._proposalIndex = -1;
		if(valueToInputField){
			this._inputField.value = valueToInputField;
			this._dismissing = true;
			this._inputField.focus();
		}
		var that = this;
		window.setTimeout(function(){ //wait a few milliseconds for the proposal pane to hide 
			that._completionUIContainer.style.display = "none";
		}, 200);
	};
	
	InputCompletion.prototype._show = function(){
		if(this._proposalList && this._proposalList.length > 0){
			this._completionUIContainer.style.display = "block"; //$NON-NLS-0$
			this._completionUIContainer.style.top = this._inputField.offsetTop + this._inputField.offsetHeight + 2 + "px";
			this._completionUIContainer.style.left = this._inputField.offsetLeft + "px";
			this._completionUIContainer.style.width = this._inputField.offsetWidth + "px";
			this._mouseDown = false;
			this.dismissed = false;
		} else {
			this._dismissed = true;
			this._proposalList = null;
			this._proposalIndex = -1;
			this._completionUIContainer.style.display = "none";
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
	}
	
	InputCompletion.prototype.onKeyPressed = function(e){
		if (e.charOrCode === dojo.keys.ENTER) {
			if(this._proposalList && this._proposalList.length > 0 && this._proposalIndex >= 0 && this._proposalIndex < this._proposalList.length){
				this._dismiss(this._proposalList[this._proposalIndex].item.value);
				return true;
			}
			return false;
		} else if((e.charOrCode === dojo.keys.DOWN_ARROW || e.charOrCode === dojo.keys.UP_ARROW) && this._proposalList && this._proposalList.length > 0){
			this._walk(e.charOrCode === dojo.keys.DOWN_ARROW);
			return true;
		}
		return false;
	};

	InputCompletion.prototype.proposeOn = function(inputValue){
		if(!this._dataList){
			return;
		}
		dojo.empty(this._completionUIContainer);
		this._completionUL = document.getElementById(this._completionIdPrefix + "UL__");//$NON-NLS-0$
		if(!this._completionUL){
			this._completionUL = document.createElement('ul');//$NON-NLS-0$
			this._completionUL.id = this._completionIdPrefix + "UL__";//$NON-NLS-0$
			this._completionUL.className = "inputCompletionUL";//$NON-NLS-0$
		}
		dojo.empty(this._completionUL);
		this._completionUIContainer.appendChild(this._completionUL);
		var searchTerm = inputValue ? inputValue.toLowerCase() : null;
		this._proposalList = [];
		var categoryName = "";
		var categoryList = [];
		for(var i=0; i < this._dataList.length; i++){
			if(this._dataList[i].type === "category"){
				this._proposeOnCategory(categoryName, categoryList);
				categoryName = this._dataList[i].label;
				categoryList = [];
			} else {
				var proposed = true;
				if(searchTerm){
					var searchOn = this._dataList[i].value.toLowerCase();
					var pIndex = searchOn.indexOf(searchTerm);
					if(pIndex < 0){
						proposed = false;
					} else if(this._proposeFromStart){
						proposed = (pIndex === 0);
					} 
				}
				if(proposed){
					categoryList.push(this._dataList[i]);
				}
			}
		}
		this._proposeOnCategory(categoryName, categoryList);
		this._show();
	};
	
	InputCompletion.prototype.constructor = InputCompletion;

	//return module exports
	return {
		InputCompletion: InputCompletion
	};
});
