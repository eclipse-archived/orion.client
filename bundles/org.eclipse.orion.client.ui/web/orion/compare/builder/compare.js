/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 (http://www.eclipse.org/legal/epl-v10.html),
 * and the Eclipse Distribution License v1.0
 * (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define require document console prompt XMLHttpRequest window*/

define(['orion/commandRegistry',
		'orion/Deferred',
		'orion/compare/compareView',
		'orion/compare/compareCommands',
		"orion/editor/textMateStyler",
		"orion/editor/htmlGrammar",
		"examples/editor/textStyler"],
function(mCommandRegistry, Deferred, mCompareView, mCompareCommands, mTextMateStyler, mHtmlGrammar, mTextStyler) {
	var commandService = new mCommandRegistry.CommandRegistry({
	});

	function _fileExt(fName){
		var splitName = fName.split("."); //$NON-NLS-0$
		var ext = "js"; //$NON-NLS-0$
		if(splitName.length > 1){
			ext = splitName[splitName.length - 1];
		}
		return ext;
	}
	
	function _contentType(fName){
		var ext = _fileExt(fName);
		var cType = {id: "application/javascript"}; //$NON-NLS-0$
		switch (ext) {
			case "java": //$NON-NLS-0$
				cType.id = "text/x-java-source"; //$NON-NLS-0$
				break;
			case "css": //$NON-NLS-0$
				cType.id = "text/css"; //$NON-NLS-0$
				break;
		}
		return cType;
	}
	
	function _getFile(fileURL){
		var d = new Deferred(); // create a promise
		var xhr = new XMLHttpRequest();
		xhr.open('GET', fileURL, true); //$NON-NLS-0$
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				var response = typeof xhr.response !== 'undefined' ? xhr.response : xhr.responseText; //$NON-NLS-0$
				var responseText = typeof response === 'string' ? response : null; //$NON-NLS-0$
				var statusCode = xhr.status;
				if (200 <= statusCode && statusCode < 400) {
					d.resolve(responseText);
				} else {
					d.reject(responseText);
				}
			}
		};
		xhr.send();	
		return d;
	}
	
	/*
	 * Default syntax highlighter for js, java, and css. Grammar-based highlighter for html.
	*/
	function DefaultHighlighter() {
		this.styler = null;
	}
	DefaultHighlighter.prototype = {
		highlight: function(fileName, contentType, editor) {
			if (this.styler) {
				this.styler.destroy();
				this.styler = null;
			}
			var lang = _fileExt(fileName);
			if (lang){
				var textView = editor.getTextView();
				var annotationModel = editor.getAnnotationModel();
				switch(lang) {
					case "js": //$NON-NLS-0$
					case "java": //$NON-NLS-0$
					case "css": //$NON-NLS-0$
						this.styler = new mTextStyler.TextStyler(textView, lang, annotationModel);
						break;
					case "html": //$NON-NLS-0$
						this.styler = new mTextMateStyler.TextMateStyler(textView, new mHtmlGrammar.HtmlGrammar());
						break;
				}
				return new Deferred().resolve(editor);
			}
			return null;
		}
	};
    function compare(options){
		var vOptions = options;
		if(!vOptions.highlighters){
			vOptions.highlighters = [new DefaultHighlighter(), new DefaultHighlighter()];
		}
		if(!vOptions.commandService){
			vOptions.commandService = commandService;
		}
		if(vOptions.oldFile && vOptions.oldFile.Name){
			vOptions.oldFile.Type = _contentType(vOptions.oldFile.Name);
		}
		if(vOptions.newFile && vOptions.newFile.Name){
			vOptions.newFile.Type = _contentType(vOptions.newFile.Name);
		}
		var cmdProvider = new mCompareCommands.CompareCommandFactory({commandService: commandService, commandSpanId: vOptions.commandSpanId});
		vOptions.commandProvider = cmdProvider;
		this.compareView = new mCompareView.toggleableCompareView("twoWay", vOptions); //$NON-NLS-0$
		this.compareView.startup();
    }
	compare.prototype = {
		getCompareView: function(){
			return this.compareView;
		},
		refresh: function(){
			var options = this.getCompareView().getWidget().options;
			if(options.oldFile.URL && options.newFile.URL){
				var promises = [];
				promises.push( _getFile(options.oldFile.URL));
				promises.push( _getFile(options.newFile.URL));
				Deferred.all(promises, function(error) { return {_error: error}; }).then(function(results){
					this.getCompareView().getWidget().options.oldFile.Content = results[0];
					this.getCompareView().getWidget().options.newFile.Content = results[1];
					this.getCompareView().getWidget().refresh();
				}.bind(this));
			} else {
				this.getCompareView().getWidget().refresh();
			}
		}
	};
    return compare;
});
