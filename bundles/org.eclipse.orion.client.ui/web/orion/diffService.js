/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
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
	'orion/extensionCommands', //$NON-NLS-0$
	'orion/compare/diffParser', //$NON-NLS-0$
	'orion/edit/editorContext' //$NON-NLS-0$
], function(mExtensionCommands, mDiffParser, EditorContext) {


	function DiffService(serviceRegistry, inputManager, editor) {
		this._serviceRegistry = serviceRegistry;
		this._inputManager = inputManager;
		this._editor = editor;
		this._enabled = false;
		this.init();
	}

	DiffService.prototype = {
		init: function(){
			var self = this;
			this._inputManager.addEventListener("InputChanged", function() {
				var service = self.getDiffServices();
				if (service) {
					var occurrenceTimer;
					var changeListener = function(e) {
						if(self._enabled){
							if (occurrenceTimer) {
								window.clearTimeout(occurrenceTimer);
							}
							occurrenceTimer = window.setTimeout(function() {
								occurrenceTimer = null;
								self._inputManager.save().then(function() {
									self.showAnnotations(service);
								});
							}, 500);
						}
					};
					self._editor.getTextView().addEventListener("ModelChanged", changeListener);
				}
			});
		},

		getDiffServices: function(){
			var metadata = this._inputManager.getFileMetadata();
			var diffServices = this._serviceRegistry.getServiceReferences("orion.edit.diff"); //$NON-NLS-0$
			for (var i = 0; i < diffServices.length; i++) {
				var serviceReference = diffServices[i];
				var info = {};
				info.validationProperties = serviceReference.getProperty("validationProperties"); //$NON-NLS-0$
				info.forceSingleItem = true;
				var validator = mExtensionCommands._makeValidator(info, this._serviceRegistry);
				if (validator.validationFunction.bind(validator)(metadata)) {
					return this._serviceRegistry.getService(serviceReference);
				}
			}
			return null;
		},

		showAnnotations: function(service){
			var self = this;
			var diffParser = new mDiffParser.DiffParser();
			var context = {
				metadata: this._inputManager.getFileMetadata()
			};
			service.getDiffContent(EditorContext.getEditorContext(this._serviceRegistry), context)
				.then(function(diffContent) {
				diffParser.setLineDelim("\n");
				diffParser.parse("", diffContent);
				var oBlocks = diffParser.getOriginalBlocks();
				var nBlocks = diffParser.getNewBlocks();
				var diffRanges = self.getDiffRanges(oBlocks, nBlocks);
				self._editor.showDiffAnnotations(diffRanges);
			});
		},

		getDiffRanges: function(originalHunkBlocks, newHunkBlocks){
			var additions = [];
			var modifications = [];
			var deletions = [];
			for (var i = 0; i < newHunkBlocks.length; i++) {
				var lineStart = newHunkBlocks[i][0];
				var oldSize = originalHunkBlocks[i][1];
				var newSize = newHunkBlocks[i][1];
				if (newSize === 0) {
					deletions.push(lineStart - 1);
				} else if (oldSize === 0) {
					additions.push({
						start: lineStart - 1,
						end: lineStart + newSize - 1
					});
				} else {
					modifications.push({
						start: lineStart - 1,
						end: lineStart + newSize - 1
					});
				}
			}
			return {
				additions: additions,
				modifications: modifications,
				deletions: deletions
			};
		},

		toggleEnabled: function(){
			this._enabled = !this._enabled;
			this.initiateDiff();
		},

		setEnabled: function(state){
			this._enabled = state;
			this.initiateDiff();
		},

		isEnabled: function(){
			return this._enabled;
		},

		initiateDiff: function(){
			if(this._enabled === false){
				this._editor.showDiffAnnotations([]);
			} else {
				var service = this.getDiffServices();
				if (service) {
					var self = this;
					this._inputManager.save().then(function() {
						self.showAnnotations(service);
					});
				}
			}
		}

	};

	DiffService.prototype.constructor = DiffService;

	//return the module exports
	return {DiffService: DiffService};
});
