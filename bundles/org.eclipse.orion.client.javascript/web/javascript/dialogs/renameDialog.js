/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define([
'i18n!javascript/nls/messages',
'require', 
'orion/webui/littlelib', 
'orion/util', 
'orion/webui/dialog', 
'orion/Deferred'], function(messages, require, lib, util, dialog, Deferred) {
	/**
	 * @description Usage: <code>new RenameDialog(options).show();</code>
	 * 
	 * @class A dialog that allows you to rename a JavaScript element
	 * @param {Object} options The options to use when opening the dialog
	 */
	function RenameDialog(options) {
		this.title = options.title || messages['renameDialog'];
		this.modal = true;
		this.messages = messages;
		this.ternworker = options.ternWorker;
		this._progress = options.progress;
		this._onHide = options.onHide;
		this._time = 0;
		this._initialText = options.initialText;
		this._message = options.message;
		this._initialize();
	}
	
	RenameDialog.prototype = Object.create(new dialog.Dialog().prototype, {
		TEMPLATE:  
			'<div role="rename">' + //$NON-NLS-0$
			'<div><label id="renameNameMessage" for="memberName">${Type the new member name:}</label></div>' + //$NON-NLS-0$
			'<div><input id="renameNameField" type="text" class="renameDialogInput" style="min-width: 25em; width:90%;"/></div>' + //$NON-NLS-0$
			'<div id="progress" style="padding: 2px 0 0; width: 100%;"><img src="'+ require.toUrl("../../../images/progress_running.gif") + '" class="progressPane_running_dialog" id="renameProgress"></img></div>' +  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			'<div id="results" style="max-height:250px; height:auto; overflow-y:auto;" aria-live="off"></div>' + //$NON-NLS-0$
			'<div id="statusbar"></div>' + //$NON-NLS-0$
			'</div>', //$NON-NLS-0$
		_bindToDom: function(_p) {
			var self = this;
			self.$crawlingProgress.style.display = "none"; //$NON-NLS-0$
			if(this._nameSearch) {
				this.$fileName.setAttribute("placeholder", messages["FileName FolderName"]);  //$NON-NLS-0$
			} else {
				this.$fileName.setAttribute("placeholder", messages["Search"]);  //$NON-NLS-0$
			}
			this.$fileName.addEventListener("input", /* @callback */ function(evt) { //$NON-NLS-0$
				self._time = + Date.now();
				if (self._timeoutId) {
					clearTimeout(self._timeoutId);
				}
				self._timeoutId = setTimeout(self.checkSearch.bind(self), 0);
			}, false);
			this.$fileName.addEventListener("keydown",function(evt) { //$NON-NLS-0$
				if (evt.keyCode === lib.KEY.ENTER) {
					var link = lib.$("a", self.$results); //$NON-NLS-0$
					if (link) {
						lib.stop(evt);
						if(util.isMac ? evt.metaKey : evt.ctrlKey){
							window.open(link.href);
						} else {
							window.location.href = link.href;
							self.hide();
						}
					}
				}
			}, false);
			_p.addEventListener("keydown", function(evt) { //$NON-NLS-0$
				var links, searchFieldNode, currentFocus, currentSelectionIndex, ele;
				var incrementFocus = function(currList, index, nextEntry) {
					if (index < currList.length - 1) {
						return currList[index+1];
					} else {
						return nextEntry;
					}
				};
				var decrementFocus = function(currList, index, prevEntry) {
					if (index > 0) {
						return currList[index-1];
					} else {
						return prevEntry;
					}
				};
				
				if (evt.keyCode === lib.KEY.DOWN || evt.keyCode === lib.KEY.UP) {
					links = lib.$$array("a", self.$results); //$NON-NLS-0$
					currentFocus = document.activeElement;
					currentSelectionIndex = links.indexOf(currentFocus);
					if (evt.keyCode === lib.KEY.DOWN) {
						if (currentSelectionIndex >= 0) {
							currentFocus.classList.remove("treeIterationCursor");
							ele = incrementFocus(links, currentSelectionIndex, links[0]);
							ele.focus();
							ele.classList.add("treeIterationCursor");
						} else if (links.length > 0) {
							// coming from the searchFieldNode
							ele = incrementFocus(links, -1, links[0]);
							ele.focus();
							ele.classList.add("treeIterationCursor");
						}   
					} else {
						if (currentSelectionIndex >= 0) {
							// jump to searchFieldNode if index === 0
							currentFocus.classList.remove("treeIterationCursor");
							searchFieldNode = self.$fileName;
							ele = decrementFocus(links, currentSelectionIndex, searchFieldNode);
							ele.focus();
							if(currentSelectionIndex > 0) {
								ele.classList.add("treeIterationCursor");
							}
						} else if (links.length > 0) {
							// coming from the searchFieldNode go to end of list
							links[links.length-1].focus();
							links[links.length-1].classList.add("treeIterationCursor");
						}
					}
					lib.stop(evt);
				}
			});
			_p.addEventListener("mouseup", function(e) { //$NON-NLS-0$
				// WebKit focuses <body> after link is clicked; override that
				e.target.focus();
			}, false);
			if (this._message) {
				this.$fileNameMessage.removeChild(this.$fileNameMessage.firstChild);
				this.$fileNameMessage.appendChild(document.createTextNode(this._message));
			}
			if (this._initialText) {
				this.$fileName.value = this._initialText;
				this.doRename();
			}
		},
		
		checkSearch: function() {
			clearTimeout(this._timeoutId);
			var now = Date.now();
			if ((now - this._time) > this._searchDelay) {
				this._time = now;
				this.doRename();
			} else {
				this._timeoutId = setTimeout(this.checkSearch.bind(this), 50); //$NON-NLS-0$
			}
		},
		
		doRename: function() {
			var newName = this.$fileName.value;
	
			// don't do a server-side query for an empty text box
			if (newName) {
				// Gives Webkit a chance to show the "Searching" message
				var renderFunction = this._searchRenderer.makeRenderFunction(this._contentTypeService, this.$results, false, this.decorateResult.bind(this));
				this.currentSearch = renderFunction;
				var div = document.createElement("div"); //$NON-NLS-0$
				div.appendChild(document.createTextNode(util.formatMessage(messages["findingRename"], newName)));
				lib.empty(this.$results);
				this.$results.appendChild(div);
				var deferredRename = new Deferred().then(/* @callback */ function(result) {
				}.bind(this));
			}
		},
		
		decorateResult: function(resultsDiv) {
			var self = this;
			var links = lib.$$array("a", resultsDiv); //$NON-NLS-0$
			function clicked(evt) { //$NON-NLS-0$
				if (evt.button === 0 && !evt.ctrlKey && !evt.metaKey) {
					self.hide();
				}
			}
			for (var i=0; i<links.length; i++) {
				var link = links[i];
				link.addEventListener("click", clicked, false);
			}
		},
		
		_beforeHiding: function() {
			clearTimeout(this._timeoutId);
		},
		_afterHiding: function() {
			if (this._onHide) {
				this._onHide();
			}
		}
	});
	
	RenameDialog.prototype.constructor = RenameDialog;
	//return the module exports
	return {RenameDialog: RenameDialog};
});