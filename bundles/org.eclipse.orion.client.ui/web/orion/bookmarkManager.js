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
			this.inputManager.addEventListener("InputChanged", function(evnt) {
				this.currentFileName = evnt.title;
				this.currentEditorType;  // save the editor type.
				var ruler = this.editor.getAnnotationRuler();
				var lineRuler = this.editor.getLineNumberRuler();
				var annotationModel = this.editor.getAnnotationModel();
				lineRuler.onDblClick = ruler.onDblClick = function(lineIndex, e) {
					var bookmark = this.editor.getBookmark(lineIndex);
					if (bookmark.annotation) {
						this.editor.removeBookmark(bookmark.annotation);
					} else {
						var node = e.target;
						this.commandRegistry.prompt(node, messages.Enterbookmarks, messages.OK, messages.Cancel, this.editor.getText(bookmark.start, bookmark.end), false, function(tags) {
							this.editor.addBookmark(bookmark, tags);
							this.saveBookmarks(this.editor.getTitle(), annotationModel);
						}.bind(this), "input");
					}
				}.bind(this);
				annotationModel.addEventListener("Changed", function(e) {
					if (e.changed.some(function(annotation) {
							return annotation.type === "orion.annotation.bookmark";
						})) {
						if (this.bookmarksChangeTimeout) {
							window.clearTimeout(this.bookmarksChangeTimeout);
						}
						this.bookmarksChangeTimeout = window.setTimeout(function() {
							this.saveBookmarks(this.editor.getTitle(), annotationModel);
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
							if (this.currentFileName === this.editor.getTitle()) {
								this.saveBookmarks(this.editor.getTitle(), annotationModel);
							}
							this.bookmarksDeleteTimeout = null;
						}.bind(this), 400);
					}
				}.bind(this));
				this.editor.addEventListener("InputChanged", function(evt) {
					if (!evt.contentsSaved) {
						if (localStorage.bookmarks) {
							var allBookmarks = JSON.parse(localStorage.bookmarks);
							var filename = this.editor.getTitle();
							var thisfileBookmarks = allBookmarks[filename];
							thisfileBookmarks && thisfileBookmarks.forEach(function(bookmark) {
								this.editor.addBookmark(bookmark);
							}.bind(this));
						}
					}
				}.bind(this));
			}.bind(this));
		},

		saveBookmarks: function(filename, annotationModel) {
			var allBookmarks = localStorage.bookmarks ? JSON.parse(localStorage.bookmarks) : {};
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
			localStorage["bookmarks"] = JSON.stringify(allBookmarks);
		}
	};

	return {
		BookmarkManager: BookmarkManager
	};
});