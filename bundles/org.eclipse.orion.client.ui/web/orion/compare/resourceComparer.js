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

define(['orion/Deferred', 'orion/compare/diff-provider', 'orion/compare/compareView', 'orion/highlight', 'orion/fileClient'], 
		function(Deferred, mDiffProvider, mCompareView, Highlight, mFileClient) {

var exports = {};

exports.DefaultDiffProvider = (function() {
	function DefaultDiffProvider(serviceRegistry){
		this.serviceRegistry = serviceRegistry;
		this._diffProvider = new mDiffProvider.DiffProvider(serviceRegistry);
	}	
	DefaultDiffProvider.prototype = {
		_resolveTwoFiles: function(oldFileURL, newFileURL, errorCallback){
			var that = this;
			var compareTwo = function(results) {
				if(Array.isArray(results) && results.length === 2 && results[0] && results[1]){
					if(results[0]._error && errorCallback){
						errorCallback(results[0]._error);
					}
					if(results[1]._error && errorCallback){
						errorCallback(results[1]._error);
					}
					var oldFileContentType = results[0];
					var newFileContentType = results[1];
					that.callBack({ oldFile:{URL: oldFileURL, Name: that._resolveFileName(oldFileURL), Type: oldFileContentType},
								newFile:{URL: newFileURL, Name: that._resolveFileName(newFileURL), Type: newFileContentType},
								diffContent: that._diffContent
							 });
				} else {
					var oldFileName = oldFileURL ? that._resolveFileName(oldFileURL) : ""; //$NON-NLS-0$
					var newFileName = newFileURL ? that._resolveFileName(newFileURL) : ""; //$NON-NLS-0$
					that.callBack({ oldFile:{URL: oldFileURL, Name: oldFileName, Type: null},
								newFile:{URL: newFileURL, Name: newFileName, Type: null},
								diffContent: that._diffContent
							 });
				}
			};
			Deferred.all([ that._getContentType(oldFileURL), that._getContentType(newFileURL)], function(error) { return {_error: error}; }).then(compareTwo);
		},
		
		_resolveDiff: function(resource, compareTo, onlyDiff, errorCallback) {
			if(compareTo){
				this._resolveTwoFiles(compareTo, resource, errorCallback);
			} else {
				if(!this._diffProvider){
					console.log("A diff provider is needed for compound diff URL"); //$NON-NLS-0$
					return;
				}
				var that = this;
				that._diffProvider.getDiffContent(resource).then(function(jsonData, secondArg) {
					if (that._hasConflicts) {
						that._diffContent = jsonData.split("diff --git")[1]; //$NON-NLS-0$
					} else {
						that._diffContent = jsonData;
					}
					if (onlyDiff){
						that.callBack({ 
							diffContent: that._diffContent
						 });
					} else {
						that._resolveComplexFileURL(resource);
					}
				}, errorCallback);
			}
		},
		
		//temporary
		//TODO : get the file name from file service
		_resolveFileName: function(fileURL){
			var fileName = fileURL.split("?")[0]; //$NON-NLS-0$
			return fileName;
		},
		
		_getContentType: function(fileURL){
			var filename = this._resolveFileName(fileURL);
			return this.serviceRegistry.getService("orion.core.contenttypes").getFilenameContentType(filename); //$NON-NLS-0$
		},
		
		_resolveComplexFileURL: function(complexURL, errorCallback) {
			var that = this;
			this._diffProvider.getDiffFileURI(complexURL).then(function(jsonData, secondArg) {
				that._resolveTwoFiles(jsonData.Old, jsonData.New, errorCallback);
			}, errorCallback);
		},
		
		provide: function(resource, compareTo, onlyDiff, hasConflicts,callBack, errorCallBack) {
			this.callBack = callBack;
			this._hasConflicts = hasConflicts;
			this._resolveDiff(resource, compareTo, onlyDiff, errorCallBack);
		}
	};
	return DefaultDiffProvider;
}());

function CompareStyler(registry){
	this._syntaxHighlither = new Highlight.SyntaxHighlighter(registry);
}	
CompareStyler.prototype = {
	highlight: function(fileName, contentType, editor) {
		return this._syntaxHighlither.setup(contentType, editor.getTextView(), 
									 null, //passing an AnnotationModel allows the styler to use it to annotate tasks/comment folding/etc, but we do not really need this in compare editor
									 fileName,
									 false /*bug 378193*/);
	}
};

exports.ResourceComparer = (function() {
	function ResourceComparer (serviceRegistry, options, viewOptions) {
		this._registry = serviceRegistry;
		this._fileClient = new mFileClient.FileClient(serviceRegistry);
		this.setOptions(options, true);
		if(options.toggleable) {
			this._compareView = new mCompareView.toggleableCompareView(options.type === "inline" ? "inline" : "twoWay", viewOptions);
		} else if(options.type === "inline") {
			this._compareView = new mCompareView.inlineCompareView(viewOptions);
		} else {
			this._compareView = new mCompareView.TwoWayCompareView(viewOptions);
		}
		if(!viewOptions.highlighters){
			this._compareView.getWidget().setOptions({highlighters: [new CompareStyler(), new CompareStyler()]});
		}
		this._compareView.getWidget().initEditors();
	}
	ResourceComparer.prototype = {
		_clearOptions: function(){
			this.options = {};
		},
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
		},
		resolveDiffByProvider: function() {
			if(!this.options.diffProvider){
				console.log("A diff provider is needed for Complex diff URL"); //$NON-NLS-0$
				return;
			}
			var that = this;
			that.options.diffProvider.provide(that.options.resource, that.options.compareTo, that.options.hasConflicts, function(diffParam){
				that._compareView.getWidget().setOptions(diffParam);
				var viewOptions = that._compareView.getWidget().options;
				if(that.options.callback){
					that.options.callback(viewOptions.oldFile.Name, viewOptions.newFile.Name);
				}
				var filesToLoad = ( viewOptions.diffContent ? [viewOptions.oldFile/*, viewOptions.newFile*/] : [viewOptions.oldFile, viewOptions.newFile]); 
				that.getFilesContents(filesToLoad).then( function(){
					var viewHeight = this._compareView.getWidget().setEditor();
					if(this._onLoadContents){
						this._onLoadContents(viewHeight);
					}
				}.bind(that));
			}, that.options.errorCallback);
		},
	    getFilesContents: function(files){
	        var promises = [];
			files.forEach(function(file) {
				promises.push(this._loadSingleFile(file));
			}.bind(this));
			return Deferred.all(promises, function(error) { return {_error: error}; });
	    },
	    _loadSingleFile: function(file) {
	        return this._registry.getService("orion.page.progress").progress(this._fileClient.read(file.URL), "Getting contents of " + file.URL).then( //$NON-NLS-1$ //$NON-NLS-0$
		        function(contents) {
					file.Content = contents;
					return file;
		        }.bind(this),
		        function(error, ioArgs) {
					if (error.status === 404) {
						file.Content = "";
					} else if (this.errorCallback) {
						this.errorCallback(error, ioArgs);
					}
					return file;
		        }.bind(this)
			);
	    },
		compose: function(onLoadContents){
			this._onLoadContents = onLoadContents;
			if(this.options.resource){
				this.resolveDiffByProvider();
			}
		}
	};
	return ResourceComparer;
}());

return exports;
});
