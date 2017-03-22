/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
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
	"i18n!orion/edit/nls/messages",
], function(
	messages
) {
	/**
	 * Constructs a new BookmarkManager object.
	 *
	 * @class
	 * @name orion.BookmarkManager
	 */
	function BookmarkManager(options) {
		this.commandRegistry = options.commandRegistry;
		this.inputManager = options.inputManager;
		this.editor = options.editor;
		this._init();
	}
	BookmarkManager.prototype = /** @lends orion.EditorView.prototype */ {
		_init: function() {
			this.editor.addEventListener("InputChanged", function(evnt) {
				if (!evnt.contentsSaved) {
					this.loadBookmarks();
				}
			}.bind(this));
			
			this.inputManager.addEventListener("InputChanged", function(evnt) {
				this.currentFileName = evnt.title;
			}.bind(this));
			
			this.editor.addEventListener("TextViewInstalled", function() {
				var annotationModel = this.editor.getAnnotationModel();
				this.editor.bookmarkPrompt = function(node, defaultText, callback) {
					this.commandRegistry.prompt(node, messages.Enterbookmarks, messages.OK, messages.Cancel, defaultText, false, function(inputs) {
						callback(inputs);
						this.saveBookmarks(this.inputManager.getFileMetadata()["Location"], annotationModel);
					}.bind(this));
				}.bind(this);
				annotationModel.addEventListener("Changed", function(e) {
					if (e.changed.some(function(annotation) {
							return annotation.type === "orion.annotation.bookmark";
						})) {
						if (this.bookmarksChangeTimeout) {
							window.clearTimeout(this.bookmarksChangeTimeout);
						}
						this.bookmarksChangeTimeout = window.setTimeout(function() {
							this.saveBookmarks(this.inputManager.getFileMetadata()["Location"], annotationModel);
							this.bookmarksChangeTimeout = null;
						}.bind(this), 400);
					}
					if (e.removed.some(function(annotation) {
							return annotation.type === "orion.annotation.bookmark";
						})) {
						if (this.bookmarksDeleteTimeout) {
							window.clearTimeout(this.bookmarksDeleteTimeout);
						}
						this.bookmarksDeleteTimeout = window.setTimeout(function() {
							if (this.currentFileName === this.inputManager.getFileMetadata()["Location"]) {
								this.saveBookmarks(this.inputManager.getFileMetadata()["Location"], annotationModel);
							}
							this.bookmarksDeleteTimeout = null;
						}.bind(this), 400);
					}
				}.bind(this));
			}.bind(this));
		},

		loadBookmarks: function() {
			if (localStorage.editorBookmarks) {
				var allBookmarks = JSON.parse(localStorage.editorBookmarks);
				var filename = this.inputManager.getFileMetadata()["Location"];
				var thisfileBookmarks = allBookmarks[filename];
				thisfileBookmarks && thisfileBookmarks.forEach(function(bookmark) {
					var addBookmark, editor;
					if(this.editor.addBookmark){
						addBookmark = this.editor.addBookmark;
						editor = this.editor;
					}else{
						addBookmark = this.editor._editorView.editor.addBookmark;
						editor = this.editor._editorView.editor;
					}
					addBookmark.apply(editor, [bookmark.start, bookmark.end, bookmark.description]);
				}.bind(this));
			}
		},

		saveBookmarks: function(filename, annotationModel) {
			var allBookmarks = localStorage.editorBookmarks ? JSON.parse(localStorage.editorBookmarks) : {};
			var thisfileBookmarks = [];
			var annotations = annotationModel.getAnnotations();
			while (annotations.hasNext()) {
				var annotation = annotations.next();
				if (annotation.type === "orion.annotation.bookmark") {
					var textModel = this.editor.getModel();
					var line = textModel.getLineAtOffset(annotation.start) + 1;
					annotation.line = line;
					thisfileBookmarks.push({
						line: annotation.line,
						description: annotation.title,
						end: annotation.end,
						start: annotation.start // end and start are both needed to redraw(recreate) the bookmark annotations 
					});
				}
			}
			allBookmarks[filename] = thisfileBookmarks;
			localStorage.editorBookmarks = JSON.stringify(allBookmarks);
		}
	};

	return {
		BookmarkManager: BookmarkManager
	};
});