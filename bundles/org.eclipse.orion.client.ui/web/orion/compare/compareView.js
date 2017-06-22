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
/*eslint-env browser, amd*/
define(['i18n!orion/compare/nls/messages',
		'orion/Deferred',
		'orion/EventTarget',
		'orion/webui/littlelib',
		'orion/compare/diffParser',
		'orion/compare/compareRulers',
        'orion/editor/editor',
        'orion/editor/editorFeatures',
        'orion/keyBinding',
        'orion/editor/textTheme',
        'orion/editor/textView',
        'orion/compare/compareUIFactory',
        'orion/compare/compareUtils',
        'orion/compare/jsdiffAdapter',
        'orion/compare/diffTreeNavigator'],
function(messages, Deferred, mEventTarget, lib, mDiffParser, mCompareRulers, mEditor, mEditorFeatures, mKeyBinding, mTextTheme, mTextView,
		 mCompareUIFactory, mCompareUtils, mJSDiffAdapter, mDiffTreeNavigator,  mTextMateStyler, mHtmlGrammar, mTextStyler) {
var exports = {};
/**
 * @class An abstract comapre view class that holds all the common functions for both "side by side" and "unified" view.
 * <p>
 * <b>See:</b><br/>
 * {@link orion.compare.TwoWayCompareView}<br/>
 * {@link orion.compare.InlineCompareView}
 * </p>		 
 * @name orion.compare.CompareView
 */
exports.CompareView = (function() {
	function CompareView () {
		mEventTarget.attach(this);
		this._diffParser = new mDiffParser.DiffParser();
	}
	CompareView.prototype = {
		/** @private */
		_clearOptions: function(){
			this.options = {};
			this.options.blockNumber = 1;
			this.options.changeNumber = 0;
		},
		/** @private */
		_disableAnnoBookMark: function(editors){
			editors.forEach(function(editor) {
				var ruler = editor.getAnnotationRuler();
				if(ruler) {
					ruler.onDblClick = function(/*lineIndex, e*/) {};
				}
			});
		},
		/** @private */
		_getLineDelim: function(input , diff){	
			var delim = "\n"; //$NON-NLS-0$
			return delim;
		},
		/** @private */
		_generateMapper: function(forceGenerate, input, output, diff , detectConflicts ,doNotBuildNewFile){
			var delim = this._getLineDelim(input , diff);
			this._diffParser.setLineDelim(delim);
			if(this.options.mapper && this.options.toggler && !forceGenerate){
				return {delim:delim , mapper:this.options.mapper, output: this.options.newFile.Content, diffArray:this.options.diffArray};
			}
			if(!diff && typeof output === "string" && typeof input === "string"){ //$NON-NLS-1$ //$NON-NLS-0$
				var adapter = new mJSDiffAdapter.JSDiffAdapter(this.isWhitespaceIgnored());
				var maps = adapter.adapt(input, output, delim);
				if(this.options.toggler){
					this.options.mapper = maps.mapper;
					this.options.newFile.Content = output;
					this.options.diffArray = maps.changContents;
				}
				return {delim:delim , mapper:maps.mapper, output: output, diffArray:maps.changContents};
			} else {
				var result = this._diffParser.parse(input, diff, detectConflicts ,true/*doNotBuildNewFile*/);
				var diffArray = this._diffParser.getDiffArray();
				if(this.options.toggler){
					this.options.mapper = result.mapper;
					this.options.newFile.Content = output/*result.outPutFile*/;
					this.options.diffArray = diffArray;
				}
				var returnObj = {delim:delim , mapper:result.mapper, output: output/*result.outPutFile*/, diffArray:diffArray};
				if(result.deletedFileMode &&result.deletedFileMode==="160000"){
					returnObj.submoduleChanged="removed";			
				}else if(result.newFileMode  &&result.newFileMode==="160000"){
					returnObj.submoduleChanged="added";	
				}
				return returnObj;
			}
		},
		/** @private */
		_loadImageFile: function(imageURL, parentDiv, createSeparator){
			var image = document.createElement("img"); //$NON-NLS-0$
			image.src = imageURL;
			var deferred = new Deferred();
			image.onload = function(){
				parentDiv.appendChild(image);
				if(createSeparator) {
					var hr = document.createElement("hr"); //$NON-NLS-0$
					parentDiv.appendChild(hr);
				}
				deferred.resolve(image.height);
			};
			image.onerror = function(){
				deferred.resolve(0);
			};
			return deferred;
		},
		/** @private */
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
		/** @private */
		_highlightSyntax: function(){
			if(this._syntaxHighlighters){//If syntax highlighter is used, we need to render all the diff annotations after syntax highlighting is done
		        var promises = [];
				this._syntaxHighlighters.forEach(function(wrapper) {
					promises.push(wrapper.highlighter.highlight(wrapper.target.fileName, wrapper.target.contentType, wrapper.target.editor));
				}.bind(this));
				Deferred.all(promises, function(error) { return {_error: error}; }).then(function(promises){
					this._diffNavigator.renderAnnotations(this.isWhitespaceIgnored());
					this._diffNavigator.gotoBlock(this.options.blockNumber-1, this.options.changeNumber-1);
					this.dispatchEvent({type: "contentLoaded"});
					if(this.options.toggler) {
						this.options.toggler.dispatchEvent({type: "contentLoaded"});
					}
				}.bind(this));
			} else {//render all the diff annotations directly
				window.setTimeout(function () {
					this._diffNavigator.renderAnnotations(this.isWhitespaceIgnored());
					this._diffNavigator.gotoBlock(this.options.blockNumber-1, this.options.changeNumber-1);
					this.dispatchEvent({type: "contentLoaded"});
					if(this.options.toggler) {
						this.options.toggler.dispatchEvent({type: "contentLoaded"});
					}
				}.bind(this), 50);
			}
		},
		
		isWhitespaceIgnored: function() {
			return this.getWidget().options.ignoreWhitespace;
		},
		
		ignoreWhitespace: function(ignore) {
			var options = this.getWidget().options;
			options.ignoreWhitespace = ignore;
			if(options.diffProvider && options.diffContent) {
				var ignoreWS = ignore ? "true" : "false";
				options.diffProvider._diffProvider.getDiffContent(options.resource, {ignoreWS: ignoreWS}).then(function(jsonData) {
					if (options.hasConflicts) {
						options.diffContent = jsonData.split("diff --git")[1]; //$NON-NLS-0$
					} else {
						options.diffContent = jsonData;
					}
					this.getWidget().refresh(true, true);
				}.bind(this), function(){});
			} else {
				this.getWidget().refresh(true, true);
			}
		},
		
		/**
		 * @class This object describes options of a file. Two instances of this object construct the core parameters of a compare view. 
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.compare.CompareView}<br/>
		 * {@link orion.compare.CompareViewOptions}
		 * </p>		 
		 * @name orion.compare.FileOptions
		 *
		 * @property {String} Content the text contents of the file unit. Requied.
		 * @property {Boolean} [readonly=true] whether or not the file is in readonly mode. Optional.
		 * @property {String} Name the file name. Optional but required if the compare view has to show file title.
		 * @property {orion.core.ContentType} Type the type of the file. Optional but required if the compare view has to highlight the syntax.
		 */
		/**
		 * @class This object describes the options for a compare view.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.compare.FileOptions}<br/>
		 * {@link orion.compare.CompareView}<br/>
		 * {@link orion.compare.CompareView#setOptions}
		 * {@link orion.compare.CompareView#getOptions}	 
		 * </p>		 
		 * @name orion.compare.CompareViewOptions
		 *
		 * @property {String} parentDivID Required. the parent element id for the compare view. Required. The parentDivID is required to prefix the ids of sub components in case of side by side view.
		 * @property {orion.compare.FileOptions} [oldFile] Required. the options of the file that is original. Required. In the two way compare case, this file is dispalyed on the left hand side.
		 * @property {orion.compare.FileOptions} [newFile] Required. the options of the file that is compared against the original. Required. In the two way compare case, this file is dispalyed on the right hand side.
		 * @property {String} [diffContent] Optional. the unified diff against the original/old file. If this option is defined, the newFile option is ignored or becomes optional.
		 * @property {Boolean} [showTitle=false] Optional. whether or not to show the two file names on each side of the compare view.
		 * @property {Boolean} [showLineStatus=false] Optional. whether or not to show the current line and column number fo the caret on each side of the view. Not avaible for inline/unified compare view.
		 * @property {orion.compare.CompareCommandFactory} [commandProvider] Optional. If defined it will render all the commands that the compare view requires.
		 * @property {Array} [highlighters] Optional. An array of two instances of {@link orion.compare.CompareSyntaxHighlighter}. If defined the highlighters are used to highlight the syntax of both side of the comapre view, respectively.
		 */
		setOptions: function(options, clearExisting){
			if(clearExisting){
				this._clearOptions();
			}
			if(!this.options) {
				this.options = {};
			}
			if(options) {
				Object.keys(options).forEach(function(option) {
					this.options[option] = options[option];
				}.bind(this));
			}
			//TODO : improve this the twoway comapre API
			if(options.newFileOnRight){
				var optNewFile = this.options.newFile;
				this.options.newFile = this.options.oldFile;
				this.options.oldFile = optNewFile;
			}
		},
		getOptions: function() {
			return this.options;
		},
		/**
		 * Returns the 1-based {blockNumber, changeNumber} current diff location. 
		 * <p>
		 * If 0 is returned on the chnageNumber, it means the whole diff block is highlighted.
		 * </p>
		 * @returns {Object} the 1-based {blockNumber, changeNumber} current diff location.
		 */
		getCurrentDiffPos: function(){	
			return this._diffNavigator.getCurrentPosition();
		},
		/**
		 * Initialize the diff navigation to the starting position. 
		 * <p>
		 * Calling this function resets the "current diff block" to the first diff block in the compare view. 
		 * If there are multiple changes in the diff block, the first change will be highlighted in a darker color. Otherwise the whole diff block will be highlighted in a darker color.
		 * </p>
		 */
		initDiffNav: function(){
			this._diffNavigator.gotoBlock(0, 0);
		},
		/**
		 * Navigate from the current "diff block" to the next one. Also sets the next one as the current diff block after the function call.
		 * <p>
		 * This function will circulate the "diff block" level of navigation, which means if the current block is the last one then it will go to the first one after the function call.
		 * It also highlights the whole diff block in a darker color.
		 * </p>
		 */
		nextDiff: function(){	
			this._diffNavigator.nextDiff();
		},
		/**
		 * Navigate from the current "diff block" to the previous one. Also sets the previous one as the current diff block after the function call.
		 * <p>
		 * This function will circulate the "diff block" level of navigation, which means if the current block is the first one then it will go to the last one after the function call.
		 * It also highlights the whole diff block in a darker color.
		 * </p>
		 */
		prevDiff: function(){	
			this._diffNavigator.prevDiff();
		},
		/**
		 * Navigate from the current "diff change" to the next "diff change". Also sets the next one as the current diff change after the function call.
		 * <p>
		 * Continously calling this function will walk forward all the word level changes in all the diff blocks. 
		 * If it hits the last change in a diff block, it will go to the next diff block at the first change.
		 * If it hits the last change in the last diff block, it will do nothing.
		 * It also highlights the current diff change in a darker color.
		 * </p>
		 */
		nextChange: function(){	
			return this._diffNavigator.nextChange();
		},
		/**
		 * Navigate from the current "diff change" to the previous "diff change". Also sets the previous one as the current diff change after the function call.
		 * <p>
		 * Continously calling this function will walk backward all the word level changes in all the diff blocks. 
		 * If it hits the first change in a diff block, it will go to the previous diff block at the last change.
		 * If it hits the first change in the first diff block, it will do nothing.
		 * It also highlights the current diff change in a darker color.
		 * </p>
		 */
		prevChange: function(){	
			this._diffNavigator.prevChange();
		},
		/**
		 * A helper function to allow the consumer of compareView to get the widget instance easily.
		 */
		getWidget: function() {
			return this;
		},
		/**
		 * A helper function to start the UI after a subclass instance is constructed.
		 */
		startup: function(){
			this.initEditors();
			this.refresh(true);
		},
		/**
		 * An abstract function that should be overridden by a subclass.
		 * <p>
		 * The subclass implementation, inline or twoWay, should create the text editor instances with an initial string or just leave it empty.
		 * </p>
		 * @param {String} initString the initial string that will dispaly when the editors are created. Optional.
		 */
		initEditors: function(initString){
		},
		/**
		 * An abstract function that should be overridden by a subclass.
		 * <p>
		 * The subclass implementation, inline or twoWay, should destroy the text editor instances.
		 * </p>
		 * @param {String} initString the initial string that will dispaly when the editors are created. Optional.
		 */
		initImageMode: function(){
		}
	};
	return CompareView;
}());

/**
 * Constructs a side by side compare view.
 * 
 * @param {orion.compare.CompareViewOptions} options the compare view options.
 * 
 * @class A TwoWayCompareView is a side by side view of two files with diff annotations and navigations.
 * @name orion.compare.TwoWayCompareView
 */
exports.TwoWayCompareView = (function() {
	function TwoWayCompareView(options) {
		exports.CompareView.call(this, options);

		this.setOptions(options, true);
		//Init the diff navigator that controls the navigation on both block and word level.
		this._diffNavigator = new mDiffTreeNavigator.DiffTreeNavigator("word"); //$NON-NLS-0$
		this.type = "twoWay"; //$NON-NLS-0$
		
		//Build the compare view UI by the UI factory
		this._uiFactory = this.options.uiFactory;
		if(!this._uiFactory){
			this._uiFactory = new mCompareUIFactory.TwoWayCompareUIFactory({
				parentDivID: this.options.parentDivId,
				showTitle: (this.options.showTitle ? this.options.showTitle : false),
				showLineStatus: (this.options.showLineStatus ? this.options.showLineStatus : false)
			});
			this._uiFactory.buildUI();
		}
		
		this._viewLoadedCounter = 0;
		if(this.options.commandProvider){
			this.options.commandProvider.initCommands(this);
		}
		this._curveRuler = new mCompareRulers.CompareCurveRuler(this._uiFactory.getDiffCanvasDiv());
	}
	TwoWayCompareView.prototype = Object.create(exports.CompareView.prototype);
	
	TwoWayCompareView.prototype.initEditors = function(initString){
		if(this.options.preCreate) {
			this.options.preCreate();
		}
		this._editors = [];//this._editors[0] represents the right side editor. this._editors[1] represents the left side editor
		//Create editor on the right side
		this._editors.push(this._createEditor(initString, this._uiFactory.getEditorParentDiv(false), this._uiFactory.getStatusDiv(false), this.options.oldFile));
		//Create editor on the left side
		this._editors.push(this._createEditor(initString, this._uiFactory.getEditorParentDiv(true), this._uiFactory.getStatusDiv(true), this.options.newFile, true));
		//Create the overview ruler
		this._overviewRuler  = new mCompareRulers.CompareOverviewRuler(this._editors[1].getAnnotationModel(), "right", {styleClass: "ruler overview"} , null, //$NON-NLS-1$ //$NON-NLS-0$
                function(lineIndex, ruler){this._diffNavigator.matchPositionFromOverview(lineIndex);}.bind(this));
		//If either editor is dirty, popup the warning message.
		if(this.options.postCreate) {
			this.options.postCreate();
		}
		window.onbeforeunload = function() {
			if(this.isDirty()) {
				return messages["There are unsaved changes."];
			}
		}.bind(this);
	};
	
	TwoWayCompareView.prototype.disableAnnoBookMark = function(){
		this._disableAnnoBookMark(this._editors);
	};
	
	TwoWayCompareView.prototype.initImageMode = function(){
		if(this._editors){
			this._editors.forEach(function(editor) {
				editor.destroy();
			});
			this._editors = null;
		}
		this._uiFactory.getEditorParentDiv(true).classList.add("compareEditorParentImageMode"); //$NON-NLS-0$
		this._uiFactory.getEditorParentDiv().classList.add("compareEditorParentImageMode"); //$NON-NLS-0$
		this._uiFactory.disableTitle();
		this._uiFactory.disableLineStatus();
		this._imageMode = true;
	};
	
	TwoWayCompareView.prototype.getImageMode = function(){
		return this._imageMode;
	};
	
	TwoWayCompareView.prototype.getEditors = function(){
		return this._editors;
	};
	
	TwoWayCompareView.prototype.gotoDiff = function(lineNumber, offsetInTheLine, updateLeft){
		var textView = updateLeft ? this._editors[1].getTextView() : this._editors[0].getTextView();
		var offset = textView.getModel().getLineStart(lineNumber) + offsetInTheLine;
		this._diffNavigator.gotoDiff(offset, textView);
	};

	TwoWayCompareView.prototype.copyToLeft = function(){	
		this._curveRuler.copyTo(true);
	};
	
	TwoWayCompareView.prototype.copyToRight = function(){	
		this._curveRuler.copyTo(false);
	};
	
	TwoWayCompareView.prototype.resizeEditors = function(){	
		this._editors.forEach(function(editor) {
			editor.getTextView().resize();
		});
	};
	
	TwoWayCompareView.prototype.getSplitter = function(){	
		return this._uiFactory.getSplitter();
	};
	
	TwoWayCompareView.prototype._createEditor = function(initString, parentDiv, statusDiv, fileOptions, isLeft){
		//Create text view factory
		var readonly = (typeof fileOptions.readonly === "undefined") ? true : fileOptions.readonly; //$NON-NLS-0$
		var textViewFactory = function() {
			var view = new mTextView.TextView({
				parent: parentDiv,
				readonly: readonly,
				theme: mTextTheme.TextTheme.getTheme("nothing"),
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
				splitter.addResizeListener(function(node){
					if(node){
						var doResize = false;
						if (this._uiFactory.isLeftPane(node) ) {
							doResize = isLeft;
						} else {
							doResize = !isLeft;
						}
						if(doResize){
							view.resize();
						}
					}
				}.bind(this));
			}
			return view;
		}.bind(this);
		
		var keyBindingFactory = fileOptions.keyBindingFactory;
		//Create keybindings factory
		if(!keyBindingFactory) {
			keyBindingFactory = new mEditorFeatures.KeyBindingsFactory();
		}

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
		editor.setInput(null, null, fileOptions.Content ? fileOptions.Content : initString);
		editor.setOverviewRulerVisible(false);
			
		var textView = editor.getTextView();
		
		//Navigate to the proper diff block or diff word if editor's selection or caret hits a diff
		textView.addEventListener("Selection", function(evt){ //$NON-NLS-0$
			var selections = Array.isArray(evt.newValue) ? evt.newValue : [evt.newValue];
			if(selections.length > 1 || !selections[0].isEmpty()){
				return;
			}
			if(this._diffNavigator.autoSelecting || !this._diffNavigator.editorWrapper[0].diffFeeder){
				return;
			}
			this._diffNavigator.gotoDiff(selections[0].getCaret(), textView);
		}.bind(this)); 
		
		//If left editor's contents changes, we refesh the curver renderer to match new diff
		textView.getModel().addEventListener("Changed", function(e){ //$NON-NLS-0$
			if(!this._curveRuler.onChanged(e, !isLeft)) {
				this.options.mapper = null;
			}
		}.bind(this));
		if(isLeft){
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
			//If right editor scrolls, we only re-render the curve
			textView.addEventListener("Scroll", function(scrollEvent){ //$NON-NLS-0$
				if(this._curveRuler){
					this._curveRuler.render();
				}
			}.bind(this)); 
		}
		return editor;
	};

	TwoWayCompareView.prototype.isDirty = function(){
		if(this._editors){
			return this._editors.some(function(editor) {
				return editor.isDirty();
			});
		}
		return false;
	};
	
	TwoWayCompareView.prototype._destroy = function(){
		if(this._editors){
			this._diffNavigator.destroy();
			this._editors.forEach(function(editor) {
				editor.destroy();
			});
			this._uiFactory.destroy();
		}
	};
	
	TwoWayCompareView.prototype.destroy = function(){
		this._destroyed = true;
		this._destroy();		
	};

	TwoWayCompareView.prototype.addRulers = function(){
		if(this._editors && !this._hasRuler){
			var lRuler = new mCompareRulers.LineNumberCompareRuler(this._diffNavigator, 0, this._editors[0].getAnnotationModel(), "left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var rRuler = new mCompareRulers.LineNumberCompareRuler(this._diffNavigator, 0, this._editors[1].getAnnotationModel(), "left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this._editors[1].getTextView().addRuler(lRuler);
			this._editors[0].getTextView().addRuler(rRuler);
			this._editors[0].getTextView().addRuler(this._overviewRuler);
			this._hasRuler = true;
		}
	};
	
	TwoWayCompareView.prototype.refresh = function(refreshEditors, generateMapper, refreshingEditorIndex){	
		if(this._destroyed) {
			return;
		}
		if(this._imageMode){
			if(this.options.commandProvider){
				this.options.commandProvider.renderCommands(this);
			}
			var that = this;
			return this._loadImageFile(this.options.newFile.URL, this._uiFactory.getEditorParentDiv(true)).then(function(height){
				return that._loadImageFile(that.options.oldFile.URL, that._uiFactory.getEditorParentDiv()).then(function(height1){
					return new Deferred().resolve(height > height1 ? height : height1);
				});
			});
		}
		var result = this._generateMapper(generateMapper, this.options.oldFile.Content, this.options.newFile.Content, this.options.diffContent, this.options.hasConflicts, !this.options.toggler);
		var input = this.options.oldFile.Content;
		var output = this.options.newFile.Content;
		if(typeof output !== "string"){ //$NON-NLS-0$
			output = result.output;
		}
		
		var rFeeder = new mDiffTreeNavigator.TwoWayDiffBlockFeeder(this._editors[0].getTextView().getModel(), result.mapper, 1, this.options.newFileOnRight);
		var lFeeder = new mDiffTreeNavigator.TwoWayDiffBlockFeeder(this._editors[1].getTextView().getModel(), result.mapper, 0, this.options.newFileOnRight);
		this._diffNavigator.initAll(this.options.charDiff ? "char" : "word", this._editors[0], this._editors[1], rFeeder, lFeeder, this._overviewRuler, this._curveRuler); //$NON-NLS-1$ //$NON-NLS-0$
		this._curveRuler.init(result.mapper ,this._editors[1], this._editors[0], this._diffNavigator);
		if(refreshEditors) {
			if(typeof refreshingEditorIndex === "number") {
				if(refreshingEditorIndex === 1) {
					this._editors[1].setInput(this.options.newFile.Name, null, output);
				} else {
					this._editors[0].setInput(this.options.oldFile.Name, null, input);
				}
			} else {
				this._editors[1].setInput(this.options.newFile.Name, null, output);
				this._editors[0].setInput(this.options.oldFile.Name, null, input);
			}
		}
		this._initSyntaxHighlighter([{fileName: this.options.newFile.Name, contentType: this.options.newFile.Type, editor: this._editors[1]},
									 {fileName: this.options.oldFile.Name, contentType: this.options.oldFile.Type, editor: this._editors[0]}]);
		this._highlightSyntax();
		if(this.options.commandProvider){
			this.options.commandProvider.renderCommands(this);
		}
		this.addRulers();
		
		if(this._viewLoadedCounter === 2){
			this._diffNavigator.gotoBlock(this.options.blockNumber-1, this.options.changeNumber-1);
		}
		this.refreshTitle(0);
		this.refreshTitle(1);
		var leftViewHeight = this._editors[1].getTextView().getModel().getLineCount() * this._editors[1].getTextView().getLineHeight() + 5;
		var rightViewHeight = this._editors[0].getTextView().getModel().getLineCount() * this._editors[0].getTextView().getLineHeight() +5;
		return leftViewHeight > rightViewHeight ? leftViewHeight : rightViewHeight;
	};
	
	TwoWayCompareView.prototype.refreshTitle = function(editorIndex, dirty){
		var title1 = this.options.newFile.Name, title2 = this.options.oldFile.Name;
		var separator = "/"; //$NON-NLS-0$
		var ellipses = " ... "; //$NON-NLS-0$
		var segments1 = title1.split(separator);
		var segments2 = title2.split(separator);
		var simplified1 = [];
		var simplified2 = [];
		var skipped = false, i;
		for (i=0; i<Math.min(segments1.length - 1, segments2.length - 1); i++) {
			if (segments1[i] !== segments2[i]) {
				if (skipped) {
					simplified1.push(ellipses);
					simplified2.push(ellipses);
				}
				simplified1.push(segments1[i]);
				simplified2.push(segments2[i]);
				skipped = false;
			} else {
				skipped = true;
			}
		}
		if (skipped) {
			simplified1.push(ellipses);
			simplified2.push(ellipses);
		}
		for (; i<Math.max(segments1.length, segments2.length); i++) {
			if (i < segments1.length) {
				simplified1.push(segments1[i]);
			}
			if (i < segments2.length) {
				simplified2.push(segments2[i]);
			}
		}
		title1 = simplified1.join(separator);
		title2 = simplified2.join(separator);
		if(editorIndex === 1){
			var newFileTitleNode = this._uiFactory.getTitleDiv(true);
			if(newFileTitleNode){
				lib.empty(newFileTitleNode);
				newFileTitleNode.appendChild(document.createTextNode(dirty || this._editors[editorIndex].isDirty() ? title1 + "*" : title1)); //$NON-NLS-0$
			}
		} else {
			var oldFileTitleNode = this._uiFactory.getTitleDiv(false);
			if(oldFileTitleNode){
				lib.empty(oldFileTitleNode);
				oldFileTitleNode.appendChild(document.createTextNode(dirty || this._editors[editorIndex].isDirty() ? title2 + "*" : title2)); //$NON-NLS-0$
			}
		}
	};
	/**
	 * Scrolls to the specified line and selects
	 * the characters between start and end.
	 * @param[in] lineNumber The 0 based line number to reveal.
	 * @param[in] optional start The index at which the selection should start.
	 * @param[in] optional end The index at which the selection should end.
	 * @param[in] optional callback The callback function after the line is moved.
	 */
	TwoWayCompareView.prototype.gotoLine = function(lineNumber/*zero based*/, start, end, callback){
		if(typeof start !== "number") {
			start = 0;
		}
		var gotoLineCallback = function() {
			if(callback) {
				callback(lineNumber);
			}
		}.bind(this);
		this._editors[1].onGotoLine(lineNumber, start, end, gotoLineCallback);
	};
	TwoWayCompareView.prototype.getMainEditor = function(){
		if(this._editors) {
			return this._editors[1];
		}
		return null;
	};
	/**
	 * Convert the 0-based line number from logical to physical or vice versa. 
	 * @param[int] lineNumber The 0 based line number to convert.
	 * @param[boolean] reverse If false or not defined, convert from logical number to physical number. Otherwise convert from physical to logical.
	 * 				   Physical number is the line number in the text editor, merged if any. Logical number is what shows in the ruler.
	 * @returns {int} the converted number, 0-based. -1 means that the physical number cannot be converted to a logical number, which means an empty number in the ruler.
	 */
	TwoWayCompareView.prototype.getLineNumber = function(lineNumber){
		return lineNumber;
	};
	return TwoWayCompareView;
}());

/**
 * Constructs a unifiled compare view.
 * 
 * @param {orion.compare.CompareViewOptions} options the compare view options.
 * 
 * @class A InlineCompareView is a unified view of two files with diff annotations and navigations. It displayed the old file + diff in one editor.
 * @name orion.compare.TwoWayCompareView
 */
exports.InlineCompareView = (function() {
	function InlineCompareView(options) {
		exports.CompareView.call(this, options);
		this.setOptions(options, true);
		this._diffNavigator = new mDiffTreeNavigator.DiffTreeNavigator("word"); //$NON-NLS-0$
		this.type = "inline"; //$NON-NLS-0$
		if(this.options.commandProvider){
			this.options.commandProvider.initCommands(this);
		}
		this._editorDiv = this.options.parentDivId;
	}
	InlineCompareView.prototype = Object.create(exports.CompareView.prototype);
	
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
	};

	InlineCompareView.prototype.isDirty = function(){
		return false;
	};

	InlineCompareView.prototype.destroy = function(){
		this._destroyed = true;
		if(this._textView){
			this._diffNavigator.destroy();
			this._textView.destroy();
		}
	};

	InlineCompareView.prototype.initEditors = function(initString){
		if(this.options.preCreate) {
			this.options.preCreate();
		}
		var parentDiv = lib.node(this._editorDiv);
		var textViewFactory = function(){
			var textView = new mTextView.TextView({
				parent: parentDiv,
				readonly: true,
				theme: mTextTheme.TextTheme.getTheme("nothing"),
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
		this._editor.setInput(null, null, initString);
		this._editor.setOverviewRulerVisible(false);
		this._editor.setAnnotationRulerVisible(true);
			
		this._textView = this._editor.getTextView();
			
		this._rulerOrigin = new mCompareRulers.LineNumberCompareRuler(this._diffNavigator, 1, this._editor.getAnnotationModel(), "left", {styleClass: "ruler lines inlineRulerLeft"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._rulerNew = new mCompareRulers.LineNumberCompareRuler(this._diffNavigator, 0, this._editor.getAnnotationModel(), "left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._overviewRuler  = new mCompareRulers.CompareOverviewRuler(this._editor.getAnnotationModel(), "right", {styleClass: "ruler overview"} , null, //$NON-NLS-1$ //$NON-NLS-0$
                function(lineIndex, ruler){this._diffNavigator.matchPositionFromOverview(lineIndex);}.bind(this));
		
		this._textView.addEventListener("Selection", function(evt){ //$NON-NLS-0$
			var selections = Array.isArray(evt.newValue) ? evt.newValue : [evt.newValue];
			if(selections.length > 1 || !selections[0].isEmpty()){
				return;
			}
			if(this._diffNavigator.autoSelecting || !this._diffNavigator.editorWrapper[0].diffFeeder){
				return;
			}
			this._diffNavigator.gotoDiff(selections[0].getCaret(), this._textView);
		}.bind(this)); 
	};

	InlineCompareView.prototype.disableAnnoBookMark = function(){
		this._disableAnnoBookMark([this._editor]);
	};
	
	InlineCompareView.prototype.initImageMode = function(){
		if(this._editor) {
			this._editor.destroy();
			this._editor = null;
		}
		lib.node(this._editorDiv).classList.add("compareEditorParentImageMode"); //$NON-NLS-0$
		this._imageMode = true;
	};
	
	InlineCompareView.prototype.getImageMode = function(){
		return this._imageMode;
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
	
	InlineCompareView.prototype.refresh = function(refreshEditors, generateMapper){
		if(this._destroyed) {
			return;
		}
		if(this._imageMode){
			if(this.options.commandProvider){
				this.options.commandProvider.renderCommands(this);
			}
			var that = this;
			return this._loadImageFile(this.options.newFile.URL, lib.node(this._editorDiv), true).then(function(height){
				return that._loadImageFile(that.options.oldFile.URL, lib.node(that._editorDiv)).then(function(height1){
					return new Deferred().resolve(height +  height1 + 20);
				});
			});
		}
		var result = this._generateMapper(generateMapper, this.options.oldFile.Content, this.options.newFile.Content, this.options.diffContent, this.options.hasConflicts, !this.options.toggler);
		if(result.submoduleChanged){
			switch(result.submoduleChanged){
				case "removed":
					this._textView.getModel().setText(messages["Removed Submodule Message"]);
					break;
				case "added":
					this._textView.getModel().setText(messages["Added Submodule Message"]);
					break;
			}
		}else{
			this._mapper = result.mapper;
			this._textView.getModel().setText(this.options.oldFile.Content);
			//Merge the text with diff 
			var rFeeder = new mDiffTreeNavigator.inlineDiffBlockFeeder(result.mapper, 1);
			var lFeeder = new mDiffTreeNavigator.inlineDiffBlockFeeder(result.mapper, 0);
			mCompareUtils.mergeDiffBlocks(this._textView.getModel(), lFeeder.getDiffBlocks(), result.mapper, result.diffArray.array, result.diffArray.index, this._diffParser._lineDelimiter);
			rFeeder.setModel(this._textView.getModel());
			lFeeder.setModel(this._textView.getModel());
			this._diffNavigator.initAll(this.options.charDiff ? "char" : "word", this._editor, this._editor, rFeeder, lFeeder, this._overviewRuler); //$NON-NLS-1$ //$NON-NLS-0$
			
			this._initSyntaxHighlighter([{fileName: this.options.oldFile.Name, contentType: this.options.oldFile.Type, editor: this._editor}]);
			this._highlightSyntax();
			if(this.options.commandProvider){
				this.options.commandProvider.renderCommands(this);
			}
			this.removeRulers();
			this.addRulers();
			var drawLine = this._textView.getTopIndex() ;
			this._textView.redrawLines(drawLine , drawLine+  1 , this._overviewRuler);
			this._textView.redrawLines(drawLine , drawLine+  1 , this._rulerOrigin);
			this._textView.redrawLines(drawLine , drawLine+  1 , this._rulerNew);
			this._diffNavigator.gotoBlock(this.options.blockNumber-1, this.options.changeNumber-1);
		}
		return this._textView.getLineHeight() * this._textView.getModel().getLineCount() + 5;
	};
	
	InlineCompareView.prototype.setConflicting =  function(conflicting){	
		this._conflcit = conflicting;
	};
	
	InlineCompareView.prototype.gotoDiff = function(changeNumber){
		this._diffNavigator.gotoChangeUsingIndex(changeNumber);
	};
	
	/**
	 * Scrolls to the specified line and selects
	 * the characters between start and end.
	 * @param[in] lineNumber The 0 based line number to reveal.
	 * @param[in] optional start The index at which the selection should start.
	 * @param[in] optional end The index at which the selection should end.
	 * @param[in] optional callback The callback function after the line is moved.
	 */
	InlineCompareView.prototype.gotoLine = function(lineNumber/*zero based*/, start, end, callback){
		if(typeof start !== "number") {
			start = 0;
		}
		var mergedNumber = mCompareUtils.convertMergedLineNumber(this._mapper, lineNumber);
		var gotoLineCallback = function() {
			if(callback) {
				callback(mergedNumber);
			}
		}.bind(this);
		this._editor.onGotoLine(mergedNumber, start, end, gotoLineCallback);
	};
	InlineCompareView.prototype.getMainEditor = function(){
		if(this._editor) {
			return this._editor;
		}
		return null;
	};
	/**
	 * Convert the 0-based line number from logical to physical or vice versa. 
	 * @param[int] lineNumber The 0 based line number to convert.
	 * @param[boolean] reverse If false or not defined, convert from logical number to physical number. Otherwise convert from physical to logical.
	 * 				   Physical number is the line number in the text editor, merged if any. Logical number is what shows in the ruler.
	 * @param[boolean] onOldFile If false or not defined, convert from logical number to physical number on the new file. Otherwise convert on the old file.
	 * 				   Physical number is the line number in the text editor, merged if any. Logical number is what shows in the ruler.
	 * @returns {int} the converted number, 0-based. -1 means that the physical number cannot be converted to a logical number, which means an empty number in the ruler.
	 */
	InlineCompareView.prototype.getLineNumber = function(lineNumber, reverse, onOldFile){
		if(reverse) {
			var diffFeeder = this._diffNavigator.getFeeder(onOldFile ? false : true);
			if(diffFeeder) {
				return diffFeeder.getLineNumber(lineNumber);
			}
			return lineNumber;
		} else {
			var mergedNumber = mCompareUtils.convertMergedLineNumber(this._mapper, lineNumber, onOldFile);
			return mergedNumber;
		}
	};
	
	return InlineCompareView;
}());

/**
 * Constructs a toggleable compare view.
 * 
 * @param {String} [startWith="twoWay"] the default view of the toggleable compare view. Can be either "twoWay" or "inline".
 * @param {orion.compare.CompareViewOptions} options the compare view options.
 * 
 * @class A toggleableCompareView is an interchangeable comapre view helper that helps user to switch between the "side by side" and "unified" by only button click. The commandProvider property has to be provided in the option in order to render the toggle command.
 * @name orion.compare.toggleableCompareView
 */
exports.toggleableCompareView = (function() {
	function toggleableCompareView(startWith, options) {
		mEventTarget.attach(this);
		if(options){
			options.toggler = this;
		}
		if(startWith === "inline"){ //$NON-NLS-0$
			this._widget = new exports.InlineCompareView(options);
		} else {
			this._widget = new exports.TwoWayCompareView(options);
		}
	}
	toggleableCompareView.prototype = {
		startup: function(){
			this._widget.startup();
		},
		
		initImageMode: function(){
			this._imageMode = true;
			this._widget.initImageMode();
		},
	
		_toggle: function(options) {
			this._widget.destroy();
			lib.empty(lib.node(options.parentDivId));
			if(this._widget.type === "inline"){ //$NON-NLS-0$
				this._widget = new exports.TwoWayCompareView(options);
			} else {
				this._widget = new exports.InlineCompareView(options);
			}
			if(this._imageMode){
				this._widget.initImageMode();
			} else {
				this._widget.initEditors();
			}
			this._widget.refresh(true);
			if(options.onInputChanged && this._widget.type === "twoWay") {
				options.onInputChanged();
			}
		},
		
		toggle: function(){
			var options = this._widget.options;
			if(!this._imageMode){
				var diffPos = this._widget.getCurrentDiffPos();
				options.blockNumber = diffPos.block;
				options.changeNumber = diffPos.change;
			}
			this._toggle(options);
		},
		
		isDirty: function() {
			return this._widget.isDirty();
		},
		
		destroy: function(){
			return this._widget.destroy();
		},
		
		getWidget: function() {
			return this._widget;
		}
	};
	return toggleableCompareView;
}());

return exports;
});
