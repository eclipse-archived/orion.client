/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define document console prompt window*/
/*jslint forin:true regexp:false sub:true*/

define(['i18n!orion/compare/nls/messages',
		'require',
		'orion/Deferred',
		'orion/webui/littlelib',
		'orion/compare/diff-parser',
		'orion/compare/compare-rulers',
        'orion/editor/editor',
        'orion/editor/editorFeatures',
        'orion/commandRegistry',
        'orion/commands',
        'orion/editor/textView',
        'orion/compare/compare-features',
        'orion/compare/compareUtils',
        'orion/compare/jsdiffAdapter',
        'orion/compare/diffTreeNavigator'],
function(messages, require, Deferred, lib, mDiffParser, mCompareRulers, mEditor, mEditorFeatures, mCommandRegistry, mCommands, mTextView,
		 mCompareFeatures, mCompareUtils, mJSDiffAdapter, mDiffTreeNavigator,  mTextMateStyler, mHtmlGrammar, mTextStyler) {
var exports = {};
//var messages = {};
/*
 * Abstract diff view class
*/
exports.CompareView = (function() {
	function CompareView () {
		this._diffParser = new mDiffParser.DiffParser();
		//TODO: this has to be done outside of the widget
		this._highlighterLoaded = 0;
	}
	CompareView.prototype = {
		_clearOptions: function(){
			this.options = {};
			this.options.baseFile = {URL:"", Name:"", Type:""}; //$NON-NLS-1$ //$NON-NLS-0$
			this.options.newFile = {URL:"", Name:"", Type:""}; //$NON-NLS-1$ //$NON-NLS-0$
			this.options.blockNumber = 1;
			this.options.changeNumber = 0;
		},
			
		setOptions: function(options, clearExisting){
			if(clearExisting){
				this._clearOptions();
			}
			if(options){
				//mapper is purely internal option
				this.options.mapper = options.mapper ? options.mapper : this.options.mapper;
				
				this.options.commandSpanId = typeof(options.commandSpanId) === "string" ? options.commandSpanId : this.options.commandSpanId; //$NON-NLS-0$
				this.options.generateLink = (options.generateLink !== undefined &&  options.generateLink !== null) ? options.generateLink : this.options.generateLink;
				this.options.editableInComparePage = (options.editableInComparePage !== undefined &&  options.editableInComparePage !== null) ? options.editableInComparePage : this.options.editableInComparePage;
				this.options.gridRenderer = options.gridRenderer || this.options.gridRenderer;
				this.options.readonly = (options.readonly !== undefined &&  options.readonly !== null) ? options.readonly : this.options.readonly;
				this.options.onPage = (options.onPage !== undefined &&  options.onPage !== null) ? options.onPage : this.options.onPage;
				this.options.wordLevelNav = (options.wordLevelNav !== undefined &&  options.wordLevelNav !== null) ? options.wordLevelNav : this.options.wordLevelNav;
				this.options.charDiff = (options.charDiff !== undefined &&  options.charDiff !== null) ? options.charDiff : this.options.charDiff;
				this.options.hasConflicts = (options.hasConflicts !== undefined &&  options.hasConflicts !== null) ? options.hasConflicts : this.options.hasConflicts;
				this.options.diffProvider = options.diffProvider ? options.diffProvider : this.options.diffProvider;
				this.options.resource = options.resource ?  options.resource : this.options.resource;
				this.options.compareTo = options.compareTo ?  options.compareTo : this.options.compareTo;
				
				this.options.baseFile.URL = (options.baseFile && options.baseFile.URL) ? options.baseFile.URL : this.options.baseFile.URL;
				this.options.baseFile.Name = (options.baseFile && typeof(options.baseFile.Name) === "string") ? options.baseFile.Name : this.options.baseFile.Name; //$NON-NLS-0$
				this.options.baseFile.Type = (options.baseFile && options.baseFile.Type) ? options.baseFile.Type : this.options.baseFile.Type;
				this.options.baseFile.Content = (options.baseFile && typeof(options.baseFile.Content) === "string") ? options.baseFile.Content : this.options.baseFile.Content; //$NON-NLS-0$
				this.options.newFile.URL = (options.newFile && options.newFile.URL) ? options.newFile.URL : this.options.newFile.URL;
				this.options.newFile.Name = (options.newFile && typeof(options.newFile.Name) === "string") ? options.newFile.Name : this.options.newFile.Name; //$NON-NLS-0$
				this.options.newFile.Type = (options.newFile && options.newFile.Type) ? options.newFile.Type : this.options.newFile.Type;
				this.options.newFile.Content = (options.newFile && typeof(options.newFile.Content) === "string") ? options.newFile.Content : this.options.newFile.Content; //$NON-NLS-0$
				
				this.options.diffURL = options.diffURL ? options.diffURL : this.options.diffURL;
				this.options.diffContent = options.diffContent ? options.diffContent : this.options.diffContent;
				this.options.diffArray = options.diffArray ? options.diffArray : this.options.diffArray;
				
				this.options.blockNumber = options.blockNumber ? options.blockNumber : this.options.blockNumber;
				this.options.changeNumber = options.changeNumber ? options.changeNumber : this.options.changeNumber;

				this.options.onSave = options.onSave ? options.onSave : this.options.onSave;
				this.options.callback = options.callback ? options.callback : this.options.callback;
				this._errorCallback = options.errorCallback ? options.errorCallback : this._errorCallback;
				this.options.onSetTitle = options.onSetTitle ? options.onSetTitle : this.options.onSetTitle;
				this.options.toggler = options.toggler ? options.toggler : this.options.toggler;
				this.options.highlighters = options.highlighters ? options.highlighters : this.options.highlighters;
			}
		},
		
		initCommands: function(/*mCommands*/){	
			if(!this._commandService){
				return;
			}
			var commandSpanId = this.getCommandSpanId();
			if(!commandSpanId){
				return;
			}
			var copyToLeftCommand = new mCommands.Command({
				name : messages["Copy current change from right to left"],
				tooltip : messages["Copy current change from right to left"],
				imageClass : "core-sprite-leftarrow", //$NON-NLS-0$
				id: "orion.compare.copyToLeft", //$NON-NLS-0$
				groupId: "orion.compareGroup", //$NON-NLS-0$
				callback : function(data) {
					data.items.copyToLeft();
			}});
			var toggle2InlineCommand = new mCommands.Command({
				tooltip : messages["Switch to unified diff"],
				name: messages["Unified"],
				//imageClass : "core-sprite-link", //$NON-NLS-0$
				id: "orion.compare.toggle2Inline", //$NON-NLS-0$
				groupId: "orion.compareGroup", //$NON-NLS-0$
				visibleWhen: function(item) {
					return item.options.toggler && item.options.toggler.widgetType === "twoWay"; //$NON-NLS-0$
				},
				callback : function(data) {
					data.items.options.toggler.toggle();
			}});
			var toggle2TwoWayCommand = new mCommands.Command({
				tooltip : messages["Switch to side by side diff"],
				name: messages["Side by side"],
				//imageClass : "core-sprite-link", //$NON-NLS-0$
				id: "orion.compare.toggle2TwoWay", //$NON-NLS-0$
				groupId: "orion.compareGroup", //$NON-NLS-0$
				visibleWhen: function(item) {
					return item.options.toggler && item.options.toggler.widgetType === "inline"; //$NON-NLS-0$
				},
				callback : function(data) {
					data.items.options.toggler.toggle();
			}});
			var nextDiffCommand = new mCommands.Command({
				name: messages["Next diff block"],
				tooltip : messages["Next diff block"],
				imageClass : "core-sprite-move_down", //$NON-NLS-0$
				id: "orion.compare.nextDiff", //$NON-NLS-0$
				groupId: "orion.compareGroup", //$NON-NLS-0$
				callback : function(data) {
					data.items.nextDiff();
			}});
			var prevDiffCommand = new mCommands.Command({
				name : messages["Previous diff block"],
				tooltip : messages["Previous diff block"],
				imageClass : "core-sprite-move_up", //$NON-NLS-0$
				id: "orion.compare.prevDiff", //$NON-NLS-0$
				groupId: "orion.compareGroup", //$NON-NLS-0$
				callback : function(data) {
					data.items.prevDiff();
			}});
			var nextChangeCommand = new mCommands.Command({
				name : messages["Next diff change"],
				tooltip : messages["Next diff change"],
				imageClass : "core-sprite-move_down", //$NON-NLS-0$
				id: "orion.compare.nextChange", //$NON-NLS-0$
				groupId: "orion.compareGroup", //$NON-NLS-0$
				callback : function(data) {
					data.items.nextChange();
			}});
			var prevChangeCommand = new mCommands.Command({
				name : messages["Previous diff change"],
				tooltip : messages["Previous diff change"],
				imageClass : "core-sprite-move_up", //$NON-NLS-0$
				id: "orion.compare.prevChange", //$NON-NLS-0$
				groupId: "orion.compareGroup", //$NON-NLS-0$
				callback : function(data) {
					data.items.prevChange(data);
			}});
			this._commandService.addCommand(copyToLeftCommand);
			this._commandService.addCommand(toggle2TwoWayCommand);
			this._commandService.addCommand(toggle2InlineCommand);
			this._commandService.addCommand(nextDiffCommand);
			this._commandService.addCommand(prevDiffCommand);
			this._commandService.addCommand(nextChangeCommand);
			this._commandService.addCommand(prevChangeCommand);
				
			// Register command contributions
			if (!this.options.readonly) {
				this._commandService.registerCommandContribution(commandSpanId, "orion.compare.copyToLeft", 109, null, false, new mCommands.CommandKeyBinding(37/*left arrow key*/, true, false, true)); //$NON-NLS-0$
			}
			this._commandService.registerCommandContribution(commandSpanId, "orion.compare.toggle2Inline", 110); //$NON-NLS-0$
			this._commandService.registerCommandContribution(commandSpanId, "orion.compare.toggle2TwoWay", 111); //$NON-NLS-0$
			this._commandService.registerCommandContribution(commandSpanId, "orion.compare.nextDiff", 112, null, false, new mCommands.CommandKeyBinding(40/*down arrow key*/, true)); //$NON-NLS-0$
			this._commandService.registerCommandContribution(commandSpanId, "orion.compare.prevDiff", 113, null, false, new mCommands.CommandKeyBinding(38/*up arrow key*/, true)); //$NON-NLS-0$
			if(this.options.wordLevelNav){
				this._commandService.registerCommandContribution(commandSpanId, "orion.compare.nextChange", 114, null, false, new mCommands.CommandKeyBinding(40/*down arrow key*/, true, true)); //$NON-NLS-0$
				this._commandService.registerCommandContribution(commandSpanId, "orion.compare.prevChange", 115, null, false, new mCommands.CommandKeyBinding(38/*up arrow key*/, true, true)); //$NON-NLS-0$
			} else {
				this._commandService.registerCommandContribution(commandSpanId, "orion.compare.nextChange", 114, null, true, new mCommands.CommandKeyBinding(40/*down arrow key*/, true, true)); //$NON-NLS-0$
				this._commandService.registerCommandContribution(commandSpanId, "orion.compare.prevChange", 115, null, true, new mCommands.CommandKeyBinding(38/*up arrow key*/, true, true)); //$NON-NLS-0$
			}
		},
		
		getCommandSpanId: function(){
			var commandSpanId = this.options.commandSpanId;
			if(!commandSpanId && this.getDefaultCommandSpanId){
				commandSpanId = this.getDefaultCommandSpanId();
			}
			return commandSpanId;
		},
		
		renderCommands: function(){
			if(!this._commandService){
				return;
			}
			var commandSpanId = this.getCommandSpanId();
			if(!commandSpanId){
				return;
			}
			lib.empty(lib.node(commandSpanId));
			if(this.options.gridRenderer && this.options.gridRenderer.navGridHolder){
				this.options.gridRenderer.navGridHolder.splice(0, this.options.gridRenderer.navGridHolder.length);
				if(this.options.gridRenderer.additionalCmdRender){
					if(this.options.gridRenderer.before){
						this.options.gridRenderer.additionalCmdRender(this.options.gridRenderer.navGridHolder);
						this._commandService.renderCommands(commandSpanId, commandSpanId, this, this, "tool", null, this.options.gridRenderer.navGridHolder); //$NON-NLS-0$
					} else {
						this._commandService.renderCommands(commandSpanId, commandSpanId, this, this, "tool", null, this.options.gridRenderer.navGridHolder); //$NON-NLS-0$
						this.options.gridRenderer.additionalCmdRender(this.options.gridRenderer.navGridHolder);
					}
				} else {
					this._commandService.renderCommands(commandSpanId, commandSpanId, this, this, "tool", null, this.options.gridRenderer.navGridHolder); //$NON-NLS-0$
				}
			} else {
				this._commandService.renderCommands(commandSpanId, commandSpanId, this, this, "tool", null); //$NON-NLS-0$
			}
		},
		
		getCurrentDiffPos: function(){	
			return this._diffNavigator.getCurrentPosition();
		},
		
		nextDiff: function(){	
			this._diffNavigator.nextDiff();
		},
		
		prevDiff: function(){	
			this._diffNavigator.prevDiff();
		},
		
		nextChange: function(){	
			this._diffNavigator.nextChange();
		},
		
		prevChange: function(){	
			this._diffNavigator.prevChange();
		},
		
		_getLineDelim: function(input , diff){	
			var delim = "\n"; //$NON-NLS-0$
			return delim;
		},

		resolveDiffByContents: function(onsave) {
			if (typeof(this.options.baseFile.Content) === "string" && typeof(this.options.newFile.Content) === "string"){ //$NON-NLS-1$ //$NON-NLS-0$
				if(!this.options.diffContent && !this._mapper){
					this.options.diffContent = ""; //$NON-NLS-0$
				}
				if(this._onLoadContents){
					this._onLoadContents();
				}
				this.setEditor(onsave);
				return true;
			} else {
				return false;
			}
		},
		
		parseMapper: function(input, output, diff , detectConflicts ,doNotBuildNewFile){
			var delim = this._getLineDelim(input , diff);
			this._diffParser.setLineDelim(delim);
			if(this.options.mapper && this.options.toggler){
				return {delim:delim , mapper:this.options.mapper, output: this.options.newFile.Content, diffArray:this.options.diffArray};
			}
			if(output){
				var adapter = new mJSDiffAdapter.JSDiffAdapter();
				var maps = adapter.adapt(input, output, delim);
				if(this.options.toggler){
					this.options.mapper = maps.mapper;
					this.options.newFile.Content = output;
					this.options.diffArray = maps.changContents;
				}
				return {delim:delim , mapper:maps.mapper, output: output, diffArray:maps.changContents};
			} else {
				var result = this._diffParser.parse(input, diff, detectConflicts ,doNotBuildNewFile);
				var diffArray = this._diffParser.getDiffArray();
				if(this.options.toggler){
					this.options.mapper = result.mapper;
					this.options.newFile.Content = result.outPutFile;
					this.options.diffArray = diffArray;
				}
				return {delim:delim , mapper:result.mapper, output: result.outPutFile, diffArray:diffArray};
			}
		},
		
		_initSyntaxHighlighter: function(targetArray){
			this._syntaxHighlighters = null;
			if(this.options.highlighters && this.options.highlighters.length > 0){
				if(targetArray.length < 1 || targetArray.length > 2){
					return;
				}
				this._syntaxHighlighters = [{highlighter: this.options.highlighters[0], target: targetArray[0]}];
				if(targetArray.length === 2 && this.options.highlighters.length === 2){
					this._syntaxHighlighters.push({highlighter: this.options.highlighters[1], target: targetArray[1]});
				}
			}
		},

		_highlightSyntax: function(){
			if(this._syntaxHighlighters){//If syntax highlighter is used, we need to render all the diff annotations after syntax highlighting is done
		        var promises = [];
				this._syntaxHighlighters.forEach(function(wrapper) {
					promises.push(wrapper.highlighter.highlight(wrapper.target.fileName, wrapper.target.contentType, wrapper.target.editor));
				}.bind(this));
				Deferred.all(promises, function(error) { return {_error: error}; }).then(function(promises){
					this._diffNavigator.renderAnnotations();
					this._diffNavigator.gotoBlock(this.options.blockNumber-1, this.options.changeNumber-1);
				}.bind(this));
			} else {//render all the diff annotations directly
				this._diffNavigator.renderAnnotations();
				this._diffNavigator.gotoBlock(this.options.blockNumber-1, this.options.changeNumber-1);
			}
		},

		startup: function(onsave, onLoadContents){
			this._onLoadContents = onLoadContents;
			this.resolveDiffByContents(onsave);
		}
	};
	return CompareView;
}());

/*
 * Side by side diff view
*/
exports.TwoWayCompareView = (function() {
	function TwoWayCompareView(commandService, parentDivId, uiFactory, options) {
		//Init the diff navigator that controls the navigation on both block and word level.
		this._diffNavigator = new mDiffTreeNavigator.DiffTreeNavigator("word"); //$NON-NLS-0$
		this._commandService = commandService;
		
		//Build the compare view UI by the UI factory
		this._uiFactory = uiFactory;
		if(!this._uiFactory){
			this._uiFactory = new mCompareFeatures.TwoWayCompareUIFactory({
				parentDivID: parentDivId,
				showTitle: false,
				showLineStatus: false
			});
			this._uiFactory.buildUI();
		}
		
		this._viewLoadedCounter = 0;
		this.setOptions(options, true);
		
		this._leftEditorDiv = this._uiFactory.getEditorParentDiv(true);
		this._rightEditorDiv = this._uiFactory.getEditorParentDiv(false);
		this.initCommands();
		this._curveRuler = new mCompareRulers.CompareCurveRuler(this._uiFactory.getDiffCanvasDiv());
		this._highlighter = [];
		if(this.options.highlighter && typeof this.options.highlighter === "function") { //$NON-NLS-0$
			this._highlighter.push(new this.options.highlighter());
			this._highlighter.push(new this.options.highlighter());
		}
		this.initEditorContainers("\n" , messages['fetching...'] , messages["fetching..."] , []); //$NON-NLS-0$
		
	}
	TwoWayCompareView.prototype = new exports.CompareView();
	
	TwoWayCompareView.prototype.initEditorContainers = function(delim , leftContent , rightContent , mapper, createLineStyler){	
		//Create editor on the left side
		this._leftEditor = this.createEditorContainer(leftContent, mapper, 0, this._uiFactory.getEditorParentDiv(true), this._uiFactory.getStatusDiv(true), this.options.readonly, this.options.newFile);
		this._leftTextView = this._leftEditor.getTextView();
		//TODO: move this.options.onPage to the comapre glue code
		
		//Create editor on the right side
		this._rightEditor = this.createEditorContainer(rightContent, mapper, 1, this._uiFactory.getEditorParentDiv(false), this._uiFactory.getStatusDiv(false), true, this.options.baseFile);
		this._rightTextView = this._rightEditor.getTextView();
		
		//Create the overview ruler
		this._overviewRuler  = new mCompareRulers.CompareOverviewRuler("right", {styleClass: "ruler overview"} , null, //$NON-NLS-1$ //$NON-NLS-0$
                function(lineIndex, ruler){this._diffNavigator.matchPositionFromOverview(lineIndex);}.bind(this));
		
		window.onbeforeunload = function() {
			if (this._leftEditor.isDirty() || this._rightEditor.isDirty()) {
				return messages["There are unsaved changes."];
			}
		}.bind(this);
		
	};
	
	TwoWayCompareView.prototype.getDefaultCommandSpanId = function(){
		return this._uiFactory.getCommandSpanId();
	};
	
	TwoWayCompareView.prototype.gotoDiff = function(lineNumber, offsetInTheLine, leftEditor){
		var textView = leftEditor ? this._leftTextView : this._rightTextView;
		var offset = textView.getModel().getLineStart(lineNumber) + offsetInTheLine;
		this._diffNavigator.gotoDiff(offset, textView);
	};

	TwoWayCompareView.prototype.copyToLeft = function(){	
		this._curveRuler.copyToLeft();
	};
	
	TwoWayCompareView.prototype.resizeEditors = function(){	
		if(this._leftTextView){
			this._leftTextView.resize();
		}
		if(this._rightTextView){
			this._rightTextView.resize();
		}
	};
	
	TwoWayCompareView.prototype.getSplitter = function(){	
		return this._uiFactory.getSplitter();
	};
	
	TwoWayCompareView.prototype.createEditorContainer = function(content, mapper, columnIndex, parentDiv, statusDiv, readOnly, fileObj){
		//Create text view factory
		var textViewFactory = function() {
			var view = new mTextView.TextView({
				parent: parentDiv,
				readonly: readOnly,
				tabSize: 4
			});
			this._viewLoadedCounter++;
			if(this._viewLoadedCounter === 2){				
				this._diffNavigator.matchPositionFromOverview(-1);
			}
			if(this.onLoad){
				this.onLoad();
			}
			//We need to add the resize listener here to hadle the vertical splitter moves
			var splitter = this.getSplitter();
			if(splitter){
				var creatingLeft = (columnIndex === 0);
				splitter.addResizeListener(function(node){
					if(node){
						var doResize = false;
						if (this._uiFactory.isLeftPane(node) ) {
							doResize = creatingLeft;
						} else {
							doResize = !creatingLeft;
						}
						if(doResize){
							view.resize();
						}
					}
				}.bind(this));
			}
			return view;
		}.bind(this);
		
		//Create keybindings factory
		var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
			// Create keybindings for generic editing
			var genericBindings = new mEditorFeatures.TextActions(editor, undoStack);
			keyModeStack.push(genericBindings);
			// create keybindings for source editing
			var codeBindings = new mEditorFeatures.SourceCodeActions(editor, undoStack, contentAssist);
			keyModeStack.push(codeBindings);
		};

		//Create the status reporter if needed
		var statusReporter = null;
		if(statusDiv) {
			var dirtyIndicator = "";
			var status = "";
			statusReporter = function(message, isError) {
				if(!statusDiv) {
					return;
				}
				if (isError) {
					status =  messages["ERROR: "] + message;
				} else {
					status = message;
				}
				statusDiv.textContent = dirtyIndicator +  status;
			};
		}
		
		//Create the editor
		var editor = new mEditor.Editor({
			textViewFactory: textViewFactory,
			undoStackFactory: new mEditorFeatures.UndoFactory(),
			annotationFactory: new mEditorFeatures.AnnotationFactory(),
			keyBindingFactory: keyBindingFactory, 
			statusReporter: statusReporter,
			domNode: parentDiv
		});
				
		editor.installTextView();
		editor.setInput(null, null, content);
		editor.setOverviewRulerVisible(false);
			
		var textView = editor.getTextView();
		
		//Navigate to the proper diff block or diff word if editor's selection or caret hits a diff
		textView.addEventListener("Selection", function(evt){ //$NON-NLS-0$
			if(evt.newValue){
				if(evt.newValue.start !== evt.newValue.end){
					return;
				}
			}
			if(this._diffNavigator.autoSelecting || !this._diffNavigator.editorWrapper[0].diffFeeder){
				return;
			}
			var caretPos = textView.getCaretOffset();
			this._diffNavigator.gotoDiff(caretPos, textView);
		}.bind(this)); 
		
		if(columnIndex === 0){
			//If left editor's contents changes, we refesh the curver renderer to match new diff
			textView.getModel().addEventListener("Changed", function(e){ //$NON-NLS-0$
				this._curveRuler.onChanged(e);
			}.bind(this));
			//If left editor scrolls, we scroll right editor to the appropriate position to match the diffs
			textView.addEventListener("Scroll", function(scrollEvent){ //$NON-NLS-0$
				if(this._curveRuler){
					this._curveRuler.matchPositionFrom(true);
					this._curveRuler.render();
				}
				if(this.onScroll){
					this.onScroll();
				}
			}.bind(this)); 
		} else {
			//If right editor scrolls, we only refresh the curver renderer
			textView.addEventListener("Scroll", function(scrollEvent){ //$NON-NLS-0$
				if(this._curveRuler){
					this._curveRuler.render();
				}
			}.bind(this)); 
		}
		return editor;
	};

	TwoWayCompareView.prototype.destroy = function(){
		if(this._leftEditor && this._rightEditor){
			this._diffNavigator.destroy();
			this._leftEditor.destroy();
			this._rightEditor.destroy();
			this._uiFactory.destroy();
		}
	};

	TwoWayCompareView.prototype.addRulers = function(){
		if(this._rightTextView && this._leftTextView && !this._hasRuler){
			this._leftTextViewRuler= new mCompareRulers.LineNumberCompareRuler(this._diffNavigator, 0, "left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this._rightTextViewRuler = new mCompareRulers.LineNumberCompareRuler(this._diffNavigator, 0, "left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this._leftTextView.addRuler(this._leftTextViewRuler);
			this._rightTextView.addRuler(this._rightTextViewRuler);
			this._rightTextView.addRuler(this._overviewRuler);
			this._hasRuler = true;
		}
	};
	
	TwoWayCompareView.prototype.setEditor = function(onsave){	
		var input = this.options.baseFile.Content;
		var output = this.options.newFile.Content;
		var diff = this.options.diffContent;
		
		var result;
		if(output) {
			result = this.parseMapper(input , output, diff , this.options.hasConflicts, true);
		} else {
			result = this.parseMapper(input , output, diff , this.options.hasConflicts, onsave);
			output = result.output;
		}
		
		var rFeeder = new mDiffTreeNavigator.TwoWayDiffBlockFeeder(this._rightTextView.getModel(), result.mapper, 1);
		var lFeeder = new mDiffTreeNavigator.TwoWayDiffBlockFeeder(this._leftTextView.getModel(), result.mapper, 0);
		this._diffNavigator.initAll(this.options.charDiff ? "char" : "word", this._rightEditor, this._leftEditor, rFeeder, lFeeder, this._overviewRuler, this._curveRuler); //$NON-NLS-1$ //$NON-NLS-0$
		this._curveRuler.init(result.mapper ,this._leftEditor , this._rightEditor, this._diffNavigator);
		if(!onsave){
			this._leftEditor.setInput(this.options.newFile.Name, null, output);
		}
		this._rightEditor.setInput(this.options.baseFile.Name, null, input);
		this._initSyntaxHighlighter([{fileName: this.options.newFile.Name, contentType: this.options.newFile.Type, editor: this._leftEditor},
									 {fileName: this.options.baseFile.Name, contentType: this.options.baseFile.Type, editor: this._rightEditor}]);
		this._highlightSyntax();
		this.renderCommands();
		this.addRulers();
		
		if(this._viewLoadedCounter === 2){
			this._diffNavigator.gotoBlock(this.options.blockNumber-1, this.options.changeNumber-1);
		}
		var leftViewHeight = this._leftTextView.getModel().getLineCount() * this._leftTextView.getLineHeight() + 5;
		var rightViewHeight = this._rightTextView.getModel().getLineCount() * this._rightTextView.getLineHeight() +5;
		return leftViewHeight > rightViewHeight ? leftViewHeight : rightViewHeight;
	};
	return TwoWayCompareView;
}());

/*
 * Unified diff view
*/
exports.InlineCompareView = (function() {
	function InlineCompareView(commandService, editorDivId, options ) {
		this._diffNavigator = new mDiffTreeNavigator.DiffTreeNavigator("word"); //$NON-NLS-0$
		this._commandService = commandService;
		this.setOptions(options, true);
		this.setOptions({readonly: true});
		
		this.initCommands();
		this._highlighter = [];
		if(this.options.highlighter && typeof this.options.highlighter === "function") { //$NON-NLS-0$
			this._highlighter.push(new this.options.highlighter());
		}
		this._editorDivId = editorDivId;
		this.createEditorContainer();
		this.hasContent = false;
	}
	InlineCompareView.prototype = new exports.CompareView();
	
	InlineCompareView.prototype.addRulers = function(){
		if(this._textView && !this._hasRuler){
			this._textView.addRuler(this._rulerOrigin);
			this._textView.addRuler(this._rulerNew);
			this._textView.addRuler(this._overviewRuler);
			this._hasRuler = true;
		}
	};
	
	InlineCompareView.prototype.removeRulers = function(){
		if(this._textView && this._hasRuler){
			this._textView.removeRuler(this._rulerOrigin);
			this._textView.removeRuler(this._rulerNew);
			this._textView.removeRuler(this._overviewRuler);
			this._hasRuler = false;
		}
	};

	InlineCompareView.prototype.destroyEditor = function(){
		if(this._textView){
			this._diffNavigator.destroy();
			this._textView.setText("");
			this.removeRulers();
		}
		this.hasContent = false;
	};

	InlineCompareView.prototype.destroy = function(){
		if(this._textView){
			this._diffNavigator.destroy();
			this._textView.destroy();
		}
	};

	InlineCompareView.prototype.createEditorContainer = function(){
		var parentDiv = lib.node(this._editorDivId);
		var textViewFactory = function(){
			var textView = new mTextView.TextView({
				parent: parentDiv,
				readonly: true,
				tabSize: 4
			});
			return textView;
		}.bind(this);
		this._editor = new mEditor.Editor({
			textViewFactory: textViewFactory,
			undoStackFactory: new mEditorFeatures.UndoFactory(),
			annotationFactory: new mEditorFeatures.AnnotationFactory(),
			domNode: parentDiv
		});
				
		this._editor.installTextView();
		this._editor.setInput(null, null, "");
		this._editor.setOverviewRulerVisible(false);
		this._editor.setAnnotationRulerVisible(false);
			
		this._textView = this._editor.getTextView();
			
		this._rulerOrigin = new mCompareRulers.LineNumberCompareRuler(this._diffNavigator, 1,"left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._rulerNew = new mCompareRulers.LineNumberCompareRuler(this._diffNavigator, 0,"left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._overviewRuler  = new mCompareRulers.CompareOverviewRuler("right", {styleClass: "ruler overview"} , null, //$NON-NLS-1$ //$NON-NLS-0$
                function(lineIndex, ruler){this._diffNavigator.matchPositionFromOverview(lineIndex);}.bind(this));
		
		this._textView.addEventListener("Selection", function(evt){ //$NON-NLS-0$
			if(evt.newValue){
				if(evt.newValue.start !== evt.newValue.end){
					return;
				}
			}
			if(this._diffNavigator.autoSelecting || !this._diffNavigator.editorWrapper[0].diffFeeder){
				return;
			}
			var caretPos = this._textView.getCaretOffset();
			this._diffNavigator.gotoDiff(caretPos, this._textView);
		}.bind(this)); 
	};

	InlineCompareView.prototype._initDiffPosition = function(textView){
		var model = textView.getModel();
		if(model && model.getAnnotations){
			var annotations = model.getAnnotations();
			if(annotations.length > 0) {
				var lineIndex = annotations[0][0];
				var lineHeight = textView.getLineHeight();
				var clientArea = textView.getClientArea();
				var lines = Math.floor(clientArea.height / lineHeight/3);
				textView.setTopIndex((lineIndex - lines) > 0 ? lineIndex - lines : 0);
			}
		}
	};
	
	InlineCompareView.prototype.setDiffTitle =  function(title){
		this._diffTitle = title;
	};
	
	InlineCompareView.prototype.setEditor = function(){
		var input = this.options.baseFile.Content;
		var output = this.options.newFile.Content;
		var diff = this.options.diffContent;

		this.hasContent = true;
		var result = this.parseMapper(input, output, diff, this.options.hasConflicts, !this.options.toggler);
		if(!output){
			output = result.output;
		}
		this._textView.getModel().setText(input);
		//Merge the text with diff 
		var rFeeder = new mDiffTreeNavigator.inlineDiffBlockFeeder(result.mapper, 1);
		var lFeeder = new mDiffTreeNavigator.inlineDiffBlockFeeder(result.mapper, 0);
		mCompareUtils.mergeDiffBlocks(this._textView.getModel(), lFeeder.getDiffBlocks(), result.mapper, result.diffArray.array, result.diffArray.index, this._diffParser._lineDelimiter);
		rFeeder.setModel(this._textView.getModel());
		lFeeder.setModel(this._textView.getModel());
		this._diffNavigator.initAll(this.options.charDiff ? "char" : "word", this._editor, this._editor, rFeeder, lFeeder, this._overviewRuler); //$NON-NLS-1$ //$NON-NLS-0$
		
		this._initSyntaxHighlighter([{fileName: this.options.baseFile.Name, contentType: this.options.baseFile.Type, editor: this._editor}]);
		this._highlightSyntax();
		this.renderCommands();
		this.addRulers();
		var drawLine = this._textView.getTopIndex() ;
		this._textView.redrawLines(drawLine , drawLine+  1 , this._overviewRuler);
		this._textView.redrawLines(drawLine , drawLine+  1 , this._rulerOrigin);
		this._textView.redrawLines(drawLine , drawLine+  1 , this._rulerNew);
		this._diffNavigator.gotoBlock(this.options.blockNumber-1, this.options.changeNumber-1);
		return this._textView.getLineHeight() * this._textView.getModel().getLineCount() + 5;
	};
	
	InlineCompareView.prototype.setConflicting =  function(conflicting){	
		this._conflcit = conflicting;
	};
	
	return InlineCompareView;
}());

/*
 * Toggleable diff view
*/
exports.toggleableCompareView = (function() {
	function toggleableCompareView(commandService, parentDivId, startWith, options ) {
		if(options){
			options.toggler = this;
		}
		if(startWith === "inline"){ //$NON-NLS-0$
			this.widgetType = "inline"; //$NON-NLS-0$
			this._widget = new exports.InlineCompareView(commandService, parentDivId, options);
		} else {
			this.widgetType = "twoWay"; //$NON-NLS-0$
			this._widget = new exports.TwoWayCompareView(commandService, parentDivId, null, options);
		}
		this._parentDivId = parentDivId;
		this._commandService = commandService;
	}
	toggleableCompareView.prototype = {
		startup: function(onLoadContents){
			this._widget.startup(false, onLoadContents);
		},
		
		toggle: function(){
			var options = this._widget.options;
			var diffPos = this._widget.getCurrentDiffPos();
			options.blockNumber = diffPos.block;
			options.changeNumber = diffPos.change;
			this._widget.destroy();
			lib.empty(lib.node(this._parentDivId));
			if(this.widgetType === "inline"){ //$NON-NLS-0$
				this.widgetType = "twoWay"; //$NON-NLS-0$
				this._widget = new exports.TwoWayCompareView(this._commandService, this._parentDivId, null, options);
			} else {
				this.widgetType = "inline"; //$NON-NLS-0$
				this._widget = new exports.InlineCompareView(this._commandService, this._parentDivId, options);
			}
			this._widget.setEditor();
		}
	};
	return toggleableCompareView;
}());

return exports;
});