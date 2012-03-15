/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others. All rights reserved.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define document navigator*/

define(['require', 'orion/textview/annotations', 'dojo', 'dijit', 'orion/commands', 'orion/editor/regex', 'orion/searchUtils', 'dijit/Menu', 'dijit/MenuItem', 'dijit/form/DropDownButton' ], 
	function(require, mAnnotations, dojo, dijit, mCommands, mRegex, mSearchUtils){
	
var orion = orion || {};

orion.TextSearcher = (function() {
	function TextSearcher(editor, cmdservice, undoStack, options) {
		this._editor = editor;
		this._commandService = cmdservice;
		this._undoStack = undoStack;
		
		this._showAllOccurrence = true;
		this._ignoreCase = true;
		this._wrapSearch = true;
		this._wholeWord = false;
		this._incremental = true;
		this._useRegExp = false;
		this._findAfterReplace = true;
		
		this._reverse = false;
		this.isMac = navigator.platform.indexOf("Mac") !== -1;
		
		this._searchRange = null;
		this._timer = null;
		this.timerRunning = false;
		this._searchOnRange = false;
		this._lastSearchString = "";
		var that = this;
		this._listeners = {
			onEditorFocus: function(e) {
				that.removeCurrentAnnotation(e);
			}
		};
		this.setOptions(options);
	}
	TextSearcher.prototype = {
		_createActionTable : function() {
			var that = this;
			this._commandService.openParameterCollector("pageNavigationActions", function(parentDiv) {
				var searchStringDiv = document.createElement('input');
				searchStringDiv.type = "text";
				searchStringDiv.name = "Find:";
				searchStringDiv.id = "localSearchFindWith";
				searchStringDiv.placeholder="Find With";
				searchStringDiv.onkeyup = function(evt){
					return that._handleKeyUp(evt);
				};
				searchStringDiv.onkeydown = function(evt){
					return that._handleKeyDown(evt,true);
				};
				parentDiv.appendChild(searchStringDiv);
	
				// create the command span for Find
				var span = document.createElement('span');
				dojo.addClass(span, "parameters");
				span.id = "localSearchFindCommands";
				parentDiv.appendChild(span);
				// td.noWrap = true;
	
				// create replace text
				var replaceStringDiv = document.createElement('input');
				replaceStringDiv.type = "text";
				replaceStringDiv.name = "ReplaceWith:";
				replaceStringDiv.id = "localSearchReplaceWith";
				replaceStringDiv.placeholder="Replace With";
				dojo.addClass(replaceStringDiv, 'searchCmdGroupMargin');
				replaceStringDiv.onkeydown = function(evt){
					return that._handleKeyDown(evt, false);
				};
				parentDiv.appendChild(replaceStringDiv);
	
				// create the command span for Replace
				span = document.createElement('span');
				dojo.addClass(span, "parameters");
				span.id = "localSearchReplaceCommands";
				parentDiv.appendChild(span);
	
				// create all other span for commands : replace/find ,
				// replace all
				span = document.createElement('span');
				span.id = "localSearchOtherCommands";
				dojo.addClass(span, "parameters");
				parentDiv.appendChild(span);
	
				// create Options button , which will bring a dialog
				var optionTd = document.createElement('span');
				dojo.addClass(optionTd, "parameters");

				// td.noWrap = true;
				parentDiv.appendChild(optionTd);
	
				var optionMenu = dijit.byId("searchOptMenu");
				if (optionMenu) {
					optionMenu.destroy();
				}
				var newMenu = new dijit.Menu({
					style : "display: none;",
					id : "searchOptMenu"
				});
				
				newMenu.addChild(new dijit.CheckedMenuItem({
					label: "Show all",
					checked: that._showAllOccurrence,
					onChange : function(checked) {
						that.setOptions({showAllOccurrence: checked});
						if(checked){
							that.adaptAllOccurrence(true, that._useRegExp, !that._ignoreCase);
						} else {
							var annotationModel = that._editor.getAnnotationModel();
							if(annotationModel){
								annotationModel.removeAnnotations(mAnnotations.AnnotationType.ANNOTATION_MATCHING_SEARCH);
							}
						}
					}
				}));
				
				newMenu.addChild(new dijit.CheckedMenuItem({
					label: "Case sensitive",
					checked: !that._ignoreCase,
					onChange : function(checked) {
						that.setOptions({ignoreCase: !checked});
					}
				}));
				
				newMenu.addChild(new dijit.CheckedMenuItem({
					label: "Wrap search",
					checked: that._wrapSearch,
					onChange : function(checked) {
						that.setOptions({wrapSearch: checked});
					}
				}));
				newMenu.addChild(new dijit.CheckedMenuItem({
					label: "Incremental search",
					checked: that._incremental,
					onChange : function(checked) {
						that.setOptions({incremental: checked});
					}
				}));
				
				newMenu.addChild(new dijit.CheckedMenuItem({
					label: "Regular expression",
					checked: that._useRegExp,
					onChange : function(checked) {
						that.setOptions({useRegExp: checked});
					}
				}));
				
				newMenu.addChild(new dijit.CheckedMenuItem({
					label: "Find after replace",
					checked: that._findAfterReplace,
					onChange : function(checked) {
						that.setOptions({findAfterReplace: checked});
					}
				}));
				
				var menuButton = new dijit.form.DropDownButton({
					label : "Options",
					dropDown : newMenu
				});
				dojo.addClass(menuButton.domNode, "parametersMenu");
				dojo.place(menuButton.domNode, optionTd, "last");
			},
			function(){that.closeUI();});
		},
		
		visible: function(){
			return document.getElementById("localSearchFindWith") ? true : false;
		},
		
		_handleKeyUp: function(evt){
			if(this._incremental && !this._keyUpHandled){
				var targetElement = evt.target;
				this.findNext(true, true, null, true, targetElement);
			}
			this._keyUpHandled = false;
			return true;
		},
		
		_handleKeyDown: function(evt, fromSearch){
			var ctrlKey = this.isMac ? evt.metaKey : evt.ctrlKey;
			if(ctrlKey &&  evt.keyCode === 70/*"f"*/ ) {
				this._keyUpHandled = fromSearch;
				if( evt.stopPropagation ) { 
					evt.stopPropagation(); 
				}
				evt.cancelBubble = true;
				return false;
			}
			if((ctrlKey &&  evt.keyCode === 75/*"k"*/ ) || evt.keyCode === 13/*enter*/ ){
				if( evt.stopPropagation ) { 
					evt.stopPropagation(); 
				}
				evt.cancelBubble = true;
				this.findNext(false, !evt.shiftKey, null, false, (ctrlKey &&  evt.keyCode === 75/*"k"*/ ) ? null : evt.target);
				this._keyUpHandled = fromSearch;
				return false;
			}
			if( ctrlKey &&  evt.keyCode === 82 /*"r"*/){
				if( evt.stopPropagation ) { 
					evt.stopPropagation(); 
				}
				evt.cancelBubble = true;
				if(!fromSearch)
					this.replace();
				this._keyUpHandled = fromSearch;
				return false;
			}
			if( evt.keyCode === 27/*ESC*/ ){
				this.closeUI();
				this._keyUpHandled = fromSearch;
				return false;
			}
			return true;
		},
		
		closeUI : function() {
			if(this.visible()){
				this._commandService.closeParameterCollector();
			}
			this._editor.getTextView().removeEventListener("Focus", this._listeners.onEditorFocus);
			this._editor.getTextView().focus();
			var annotationModel = this._editor.getAnnotationModel();
			if (annotationModel) {
				annotationModel.removeAnnotations(mAnnotations.AnnotationType.ANNOTATION_CURRENT_SEARCH);
				annotationModel.removeAnnotations(mAnnotations.AnnotationType.ANNOTATION_MATCHING_SEARCH);
			}
		},

		removeCurrentAnnotation: function(evt){
			var annotationModel = this._editor.getAnnotationModel();
			if (annotationModel) {
				annotationModel.removeAnnotations(mAnnotations.AnnotationType.ANNOTATION_CURRENT_SEARCH);
			}
		},
		
		buildToolBar : function(defaultSearchStr) {
			this._keyUpHandled = true;
			var that = this;
			this._editor.getTextView().addEventListener("Focus", this._listeners.onEditorFocus);
			var findDiv = document.getElementById("localSearchFindWith");
			if (this.visible()) {
				if(defaultSearchStr.length > 0){
					findDiv.value = defaultSearchStr;
				}
				window.setTimeout(function() {
						findDiv.select();
						findDiv.focus();
				}, 10);				
				return;
			}
			this._createActionTable();

			// set the default value of search string
			var findDiv = document.getElementById("localSearchFindWith");
			findDiv.value = defaultSearchStr;
			window.setTimeout(function() {
				findDiv.select();
				findDiv.focus();
			}, 10);				

			var that = this;
			var findNextCommand = new mCommands.Command({
				tooltip : "Go to next",
				imageClass : "core-sprite-move_down",
				id : "orion.search.findNext",
				groupId : "orion.searchGroup",
				callback : function() {
					that.findNext(false,true);
				}
			});

			var findPrevCommand = new mCommands.Command({
				tooltip : "Go to previous",
				imageClass : "core-sprite-move_up",
				id : "orion.search.findPrev",
				groupId : "orion.searchGroup",
				callback : function() {
					that.findNext(false, false);
				}
			});

			var replaceCommand = new mCommands.Command({
				name : "Replace",
				image : require.toUrl("images/replace.gif"),
				id : "orion.search.replace",
				groupId : "orion.searchGroup",
				callback : function() {
					that.replace();
				}
			});

			var replaceAllCommand = new mCommands.Command({
				name : "Replace All",
				image : require.toUrl("images/replaceAll.gif"),
				id : "orion.search.replaceAll",
				groupId : "orion.searchGroup",
				callback : function() {
					that.replaceAll();
				}
			});

			this._commandService.addCommand(findNextCommand);
			this._commandService.addCommand(findPrevCommand);
			this._commandService.addCommand(replaceCommand);
			this._commandService.addCommand(replaceAllCommand);

			// Register command contributions
			this._commandService.registerCommandContribution("localSearchFindCommands", "orion.search.findNext", 1);
			this._commandService.registerCommandContribution("localSearchFindCommands", "orion.search.findPrev", 2);
			this._commandService.registerCommandContribution("localSearchReplaceCommands", "orion.search.replace", 1);
			this._commandService.registerCommandContribution("localSearchReplaceCommands", "orion.search.replaceAll", 2);
			this._commandService.renderCommands("localSearchFindCommands", "localSearchFindCommands", that, that, "button");
			this._commandService.renderCommands("localSearchReplaceCommands", "localSearchFindCommands", that, that, "button");
		},

		/**
		 * Helper for finding occurrences of str in the editor
		 * contents.
		 * 
		 * @param {String}
		 *            str
		 * @param {Number}
		 *            startIndex
		 * @param {Boolean}
		 *            [ignoreCase] Default is false.
		 * @param {Boolean}
		 *            [reverse] Default is false.
		 * @return {Object} An object giving the match details, or
		 *         <code>null</code> if no match found. The
		 *         returned object will have the properties:<br />
		 *         {Number} index<br />
		 *         {Number} length
		 */
		_findString : function(firstTime, text, searchStr, startIndex, reverse, wrapSearch) {
			var i;
			if (reverse) {
				if(firstTime){
					text = text.split("").reverse().join("");
					searchStr = searchStr.split("").reverse().join("");
				}
				startIndex = text.length - startIndex - 1;
				i = text.indexOf(searchStr, startIndex);
				if (i === -1) {
					if (wrapSearch && firstTime)
						return this._findString(false, text, searchStr, text.length - 1, reverse, wrapSearch);
				} else {
					return {
						index : text.length - searchStr.length - i,
						length : searchStr.length
					};
				}

			} else {
				i = text.indexOf(searchStr, startIndex);
				if (i === -1) {
					if (wrapSearch && firstTime)
						return this._findString(false, text, searchStr, 0);
				} else {
					return {
						index : i,
						length : searchStr.length
					};
				}
			}
			return null;
		},

		setOptions : function(options) {
			if (options) {
				if (options.showAllOccurrence === true
						|| options.showAllOccurrence === false) {
					this._showAllOccurrence = options.showAllOccurrence;
				}
				if (options.ignoreCase === true
						|| options.ignoreCase === false) {
					this._ignoreCase = options.ignoreCase;
				}
				if (options.wrapSearch === true
						|| options.wrapSearch === false) {
					this._wrapSearch = options.wrapSearch;
				}
				if (options.wholeWord === true
						|| options.wholeWord === false) {
					this._wholeWord = options.wholeWord;
				}
				if (options.incremental === true
						|| options.incremental === false) {
					this._incremental = options.incremental;
				}
				if (options.useRegExp === true
						|| options.useRegExp === false) {
					this._useRegExp = options.useRegExp;
				}
				if (options.findAfterReplace === true
						|| options.findAfterReplace === false) {
					this._findAfterReplace = options.findAfterReplace;
				}
				
				if (options.reverse === true
						|| options.reverse === false) {
					this._reverse = options.reverse;
				}
				
				if (options.toolBarId) {
					this._toolBarId = options.toolBarId;
				}
				if (options.searchRange) {
					this._searchRange = options.searchRange;
				}
				if (options.searchOnRange === true
						|| options.searchOnRange === false) {
					this._searchOnRange = options.searchOnRange;
				}
			}
		},

		getSearchStartIndex: function(reverse, flag) {
			var currentCaretPos = this._editor.getCaretOffset();
			if(reverse) {
				var selection = this._editor.getSelection();
				var selectionSize = (selection.end > selection.start) ? selection.end - selection.start : 0;
				if(!flag){
					return (currentCaretPos- selectionSize - 1) > 0 ? (currentCaretPos- selectionSize - 1) : 0 ;
				}
				return selection.end > 0 ? selection.end : 0;
			}
			return currentCaretPos > 0 ? currentCaretPos : 0 ;
		},
		
		findNext : function(searchAll, next, searchStr, incremental, focusBackDiv) {
			this.setOptions({
				reverse : !next
			});
			var findTextDiv = document.getElementById("localSearchFindWith");
			var startPos = this.getSearchStartIndex(incremental ? true : !next);
			
			if(this.visible()){
				return this.findOnce(searchAll, searchStr ? searchStr : findTextDiv.value, startPos);
			} else if(this._lastSearchString && this._lastSearchString.length > 0){
				var retVal = this._prepareFind(searchStr ? searchStr : this._lastSearchString, startPos);
				return this._doFind(false, retVal.text, retVal.searchStr, retVal.startIndex, !next, this._wrapSearch);
			}
		},

		startUndo: function() {
			if (this._undoStack) {
				this._undoStack.startCompoundChange();
			}
		}, 
		
		endUndo: function() {
			if (this._undoStack) {
				this._undoStack.endCompoundChange();
			}
		}, 
	
		replace: function(callBack) {
			this.startUndo();
			this.adaptReplace(document.getElementById("localSearchReplaceWith").value, callBack);
			this.endUndo();
			var findTextDiv = document.getElementById("localSearchFindWith");
			if (this._findAfterReplace && findTextDiv.value.length > 0){
				var retVal = this._prepareFind(findTextDiv.value, this.getSearchStartIndex(false));
				this._doFind(false, retVal.text, retVal.searchStr, retVal.startIndex, false, this._wrapSearch, callBack);
			}
		},

		_prepareFind: function(searchStr, startIndex){
			var text;
			if (this._searchOnRange && this._searchRange) {
				text = this._editor.getText().substring(this._searchRange.start, this._searchRange.end);
				startIndex = startIndex - this._searchRange.start;
			} else {
				text = this._editor.getText();
			}
			if (this._ignoreCase) {
				searchStr = searchStr.toLowerCase();
				text = text.toLowerCase();
			}
			if(startIndex < 0)
				startIndex = 0;
			return {text:text, searchStr:searchStr, startIndex:startIndex};
		},
		
		_doFind: function(searchAll, text, searchStr, startIndex, reverse, wrapSearch, callBack) {
			if(!searchStr || searchStr.length === 0){
				var annotationModel = this._editor.getAnnotationModel();
				if(annotationModel){
					annotationModel.removeAnnotations(mAnnotations.AnnotationType.ANNOTATION_CURRENT_SEARCH);
					annotationModel.removeAnnotations(mAnnotations.AnnotationType.ANNOTATION_MATCHING_SEARCH);
				}
				return null;
			}
			this._lastSearchString = searchStr;
			if (this._useRegExp) {
				var regexp = mRegex.parse("/" + searchStr + "/");
				if (regexp) {
					var pattern = regexp.pattern;
					var flags = regexp.flags;
					flags = flags + (this._ignoreCase && flags.indexOf("i") === -1 ? "i" : "");
					result = this._findRegExp(true, text, pattern, flags, startIndex, reverse, wrapSearch);
				}
			} else {
				result = this._findString(true, text, searchStr, startIndex, reverse, wrapSearch);
			}
			if (result) {
				this.adaptFind(result.index, result.index + result.length, reverse, callBack, this._replacingAll);
			} else {
				this.adaptFind(-1, -1, reverse, null, this._replacingAll);
			}
			var that = this;
			if(searchAll && this._showAllOccurrence){
				if(!this._timer){
					this._timer = window.setTimeout(function(){that.adaptAllOccurrence(result, that._useRegExp, !that._ignoreCase);that.timerRunning = false;that._timer = null;}, 500);
				} else if (this.timerRunning){
					window.clearTimeOut(this._timer);
					this._timer = window.setTimeout(function(){that.adaptAllOccurrence(result, that._useRegExp, !that._ignoreCase);that.timerRunning = false;that._timer = null;}, 500);
				}
			}
			return result;
		},
		
		findOnce: function( searchAll, searchStr, startIndex, callBack){
			var retVal = this._prepareFind(searchStr, startIndex);
			return this._doFind(searchAll, retVal.text, retVal.searchStr, retVal.startIndex, this._reverse, this._wrapSearch, callBack);
		},

		replaceAll : function() {
			var searchStr = document.getElementById("localSearchFindWith").value;
			if(searchStr && searchStr.length > 0){
				this._replacingAll = true;
				this.adaptReplaceAllStart(true);
				window.setTimeout(dojo.hitch(this, function() {
					var startPos = 0;
					var number = 0;
					while(true){
						var retVal = this._prepareFind(searchStr, startPos);
						var result = this._doFind(false, retVal.text, retVal.searchStr,retVal.startIndex, false, false);
						if(!result)
							break;
						number++;
						if(number === 1)
							this.startUndo();
						this.adaptReplace(document.getElementById("localSearchReplaceWith").value);
						startPos = this.getSearchStartIndex(true, true);
					}
					if(number > 0)
						this.endUndo();
					this.adaptReplaceAllEnd(startPos > 0, number);
					this._replacingAll = false;
				}), 100);				
				
			}
		},

		adaptReplaceAllStart: function(){
			this._editor.reportStatus("");
			this._editor.reportStatus("Replacing all...", "progress");
		},
		
		adaptReplaceAllEnd: function(succeed, number){
			this._editor.reportStatus("", "progress");
			if(succeed) {
				this._editor.reportStatus("Replaced "+number+" matches");
			} else {
				this._editor.reportStatus("Nothing replaced", "error");
			}
		},
		
		adaptFind: function(startIndex, endIndex, reverse, callBack, noStatus) {
			var type = mAnnotations.AnnotationType.ANNOTATION_CURRENT_SEARCH;
			var annotationModel = this._editor.getAnnotationModel();
			if(annotationModel){
				annotationModel.removeAnnotations(type);
			}
			if(startIndex === -1){
				if(!noStatus) {
					this._editor.reportStatus("Not found", "error");
				}
			}
			else {
				if(!noStatus) {
					this._editor.reportStatus("");
				}
				if (annotationModel) {
					annotationModel.addAnnotation(mAnnotations.AnnotationType.createAnnotation(type, startIndex, endIndex));
				}
				this._editor.moveSelection(startIndex, endIndex, callBack, false);
			}
		},
		
		adaptAllOccurrence: function(singleResult, isRegEx, caseSensitive) {
			var type = mAnnotations.AnnotationType.ANNOTATION_MATCHING_SEARCH;
			var annotationModel = this._editor.getAnnotationModel();
			if(!annotationModel){
				return;
			}
			annotationModel.removeAnnotations(type);
			if(!singleResult){
				return;
			}
			var searchStr = document.getElementById("localSearchFindWith").value;
			if(searchStr.length === 0){
				return;
			}
			var searchResult = mSearchUtils.searchAllOccurrence(isRegEx, searchStr, caseSensitive, this._editor.getModel().getText(), this._editor.getModel().getLineDelimiter());
			if(searchResult.m.children.length === 0){
				return;
			}
			var gap = searchResult.q.searchStrLength;
			for(var j = 0; j < searchResult.m.children.length; j++){
				var detailModel = searchResult.m.children[j];
				var lineStart = this._editor.getModel().getLineStart(detailModel.lineNumber - 1);
				for(var i = 0; i < detailModel.matches.length; i++){
					if( searchResult.q.wildCard){
						gap = detailModel.matches[i].length;
					}
					var startIndex = lineStart + detailModel.matches[i].startIndex;
					var endIndex = startIndex + gap;
					if (annotationModel) {
						annotationModel.addAnnotation(mAnnotations.AnnotationType.createAnnotation(type, startIndex, endIndex));
					}
				}
			}
		},
		
		adaptReplace: function(newStr, startIndex, endIndex) {
			var selection = this._editor.getSelection();
			this._editor.setText(newStr, selection.start, selection.end);
			this._editor.setSelection(selection.start , selection.start + newStr.length, true);
		},
		
		/**
		 * Helper for finding regex matches in the editor contents.
		 * Use {@link #doFind} for simple string searches.
		 * 
		 * @param {String}
		 *            pattern A valid regexp pattern.
		 * @param {String}
		 *            flags Valid regexp flags: [is]
		 * @param {Number}
		 *            [startIndex] Default is false.
		 * @param {Boolean}
		 *            [reverse] Default is false.
		 * @return {Object} An object giving the match details, or
		 *         <code>null</code> if no match found. The
		 *         returned object will have the properties:<br />
		 *         {Number} index<br />
		 *         {Number} length
		 */
		_findRegExp : function(firsTime, text, pattern, flags, startIndex, reverse, wrapSearch) {
			if (!pattern) {
				return null;
			}

			flags = flags || "";
			// 'g' makes exec() iterate all matches, 'm' makes ^$
			// work linewise
			flags += (flags.indexOf("g") === -1 ? "g" : "")
					+ (flags.indexOf("m") === -1 ? "m" : "");
			var regexp = new RegExp(pattern, flags);
			var result = null, match = null;
			if (reverse) {
				while (true) {
					result = regexp.exec(text);
					if(result){
						if(result.index <= startIndex){
							match = {index : result.index, length : result[0].length};
						} else {
							if(!wrapSearch)
								return match;
							if(match)
								return match;
							startIndex = text.length -1;
							match = {index : result.index, length : result[0].length};
						}
						
					} else {
						return match;
					}
					
				}
			} else {
				result = regexp.exec(text.substring(startIndex));
				if(!result && wrapSearch){
					startIndex = 0;
					result = regexp.exec(text.substring(startIndex));
				}
				return result && {
					index : result.index + startIndex,
					length : result[0].length
				};
			}
		}
	};
	return TextSearcher;
}());

return orion;
});
