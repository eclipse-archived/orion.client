/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define */

define([
	'orion/editor/editor',
	'orion/editor/textView',
	'orion/editor/textModel',
	'orion/editor/projectionTextModel',
	'orion/editor/editorFeatures',
	'orion/editor/contentAssist',
	'orion/editor/emacs',
	'orion/editor/vi',
	'orion/editorPreferences',
	'orion/widgets/themes/ThemePreferences',
	'orion/widgets/themes/editor/ThemeData',
	'orion/widgets/settings/EditorSettings',
	'orion/searchAndReplace/textSearcher',
	'orion/editorCommands',
	'orion/edit/dispatcher',
	'orion/highlight',
	'orion/edit/syntaxmodel',
	'orion/markOccurrences',
	'orion/syntaxchecker'
], function(
	mEditor, mTextView, mTextModel, mProjectionTextModel, mEditorFeatures, mContentAssist, mEmacs, mVI,
	mEditorPreferences, mThemePreferences, mThemeData, EditorSettings,
	mSearcher, mEditorCommands,
	mDispatcher, Highlight, SyntaxModelWirer,
	mMarkOccurrences, mSyntaxchecker
) {

	/**
	 * Constructs a new EditorView object.
	 *
	 * @class
	 * @name orion.EditorView
	 */
	function EditorView(options) {
		this._parent = options.parent;
		this.renderToolbars = options.renderToolbars;
		this.serviceRegistry = options.serviceRegistry;
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.commandRegistry = options.commandRegistry;
		this.progress = options.progress;
		this.statusService = options.statusService;
		this.fileClient = options.fileService;
		this.inputManager = options.inputManager;
		this.preferences = options.preferences;
		this.readonly = options.readonly;
		this.searcher = options.searcher;
		this.syntaxHighlighter = new Highlight.SyntaxHighlighter(this.serviceRegistry);
		this.syntaxModelWirer = new SyntaxModelWirer(this.serviceRegistry);
		this.settings = {};
		this._init();
	}
	EditorView.prototype = /** @lends orion.EditorView.prototype */ {
		updateKeyMode: function(textView) {
			if (this.emacs) {
				textView.removeKeyMode(this.emacs);
			}
			if (this.vi) {
				textView.removeKeyMode(this.vi);
			}
			if (this.settings.keyBindings === "Emacs") { //$NON-NLS-0$
				if (!this.emacs) {
					this.emacs = new mEmacs.EmacsMode(textView);
				}
				textView.addKeyMode(this.emacs);
			} else if (this.settings.keyBindings === "vi") { //$NON-NLS-0$
				if (!this.vi) {
					this.vi = new mVI.VIMode(textView, this.statusReporter.bind(this));
				}
				textView.addKeyMode(this.vi);
			}
		},
		updateSettings: function(prefs) {
			this.settings = prefs;
			var editor = this.editor;
			var inputManager = this.inputManager;
			inputManager.setAutoLoadEnabled(prefs.autoLoad);
			inputManager.setAutoSaveTimeout(prefs.autoSave ? prefs.autoSaveTimeout : -1);
			inputManager.setSaveDiffsEnabled(prefs.saveDiffs);
			inputManager.setTrimTrailingWhiteSpace(prefs.trimTrailingWhiteSpace);
			this.updateStyler(prefs);
			var textView = editor.getTextView();
			if (textView) {
				this.updateKeyMode(textView);
				var options = {
					tabSize: prefs.tabSize || 4,
					expandTab: prefs.expandTab,
					scrollAnimation: prefs.scrollAnimation ? prefs.scrollAnimationTimeout : 0
				};
				textView.setOptions(options);
			}
			var sourceCodeActions = editor.getSourceCodeActions();
			if (sourceCodeActions) {
				sourceCodeActions.setAutoPairing(prefs.autoPairing);
				sourceCodeActions.setSmartIndentation(prefs.smartIndentation);
			}
			editor.setAnnotationRulerVisible(prefs.annotationRuler);
			editor.setLineNumberRulerVisible(prefs.lineNumberRuler);
			editor.setFoldingRulerVisible(prefs.foldingRuler);
			editor.setOverviewRulerVisible(prefs.overviewRuler);
			if (this.renderToolbars) {
				this.renderToolbars(inputManager.getFileMetadata());
			}
		},
		updateStyler: function(prefs) {
			var styler = this.syntaxHighlighter.getStyler();
			if (styler) {
				if (styler.setTabsVisible) {
					styler.setTabsVisible(prefs.showTabs);
				}
				if (styler.setSpacesVisible) {
					styler.setSpacesVisible(prefs.showSpaces);
				}
			}
		},
		statusReporter: function(message, type, isAccessible) {
			if (type === "progress") { //$NON-NLS-0$
				this.statusService.setProgressMessage(message);
			} else if (type === "error") { //$NON-NLS-0$
				this.statusService.setErrorMessage(message);
			} else {
				this.statusService.setMessage(message, null, isAccessible);
			}
		},
		_init: function() {
			var editorPreferences = this.editorPreferences = new mEditorPreferences.EditorPreferences (this.preferences, function (prefs) {
				if (!prefs) {
					editorPreferences.getPrefs(this.updateSettings.bind(this));
				} else {
					this.updateSettings(prefs);
				}
			}.bind(this));
			var themePreferences = new mThemePreferences.ThemePreferences(this.preferences, new mThemeData.ThemeData());
			themePreferences.apply();
			var localSettings;

			var self = this;

			var editorDomNode = this._parent;
			var readonly = this.readonly;
			var commandRegistry = this.commandRegistry;
			var serviceRegistry = this.serviceRegistry;
			var fileClient = this.fileClient;
			var inputManager = this.inputManager;
			var searcher = this.searcher;
			var progress = this.progress;
			var contentTypeRegistry = this.contentTypeRegistry;

			var textViewFactory = function() {
				var textView = new mTextView.TextView({
					parent: editorDomNode,
					model: new mProjectionTextModel.ProjectionTextModel(new mTextModel.TextModel()),
					wrappable: true,
					tabSize: self.settings.tabSize || 4,
					expandTab: self.settings.expandTab,
					scrollAnimation: self.settings.scrollAnimation ? self.settings.scrollAnimationTimeout : 0,
					readonly: readonly
				});
				return textView;
			};

			var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {

				var localSearcher = new mSearcher.TextSearcher(editor, commandRegistry, undoStack);

				var keyBindings = new mEditorFeatures.KeyBindingsFactory().createKeyBindings(editor, undoStack, contentAssist, localSearcher);
				var sourceCodeActions = keyBindings.sourceCodeActions;
				sourceCodeActions.setAutoPairing(self.settings.autoPairing);
				sourceCodeActions.setSmartIndentation(self.settings.smartIndentation);

				// Register commands that depend on external services, the registry, etc.  Do this after
				// the generic keybindings so that we can override some of them.
				var commandGenerator = new mEditorCommands.EditorCommandFactory(
					serviceRegistry,
					commandRegistry,
					fileClient,
					inputManager,
					"pageActions", //$NON-NLS-0$
					readonly,
					"pageNavigationActions", //$NON-NLS-0$
					localSearcher,
					searcher,
					function() { return self.settings; },
					localSettings
				);
				commandGenerator.generateEditorCommands(editor);

				var textView = editor.getTextView();
				self.updateKeyMode(textView);

				return keyBindings;
			};

			// Content Assist
			var contentAssistFactory = readonly ? null : {
				createContentAssistMode: function(editor) {
					var contentAssist = new mContentAssist.ContentAssist(editor.getTextView());
					contentAssist.addEventListener("Activating", function() { //$NON-NLS-0$
						// Content assist is about to be activated; set its providers.
						var fileContentType = inputManager.getContentType();
						var fileName = editor.getTitle();
						var serviceReferences = serviceRegistry.getServiceReferences("orion.edit.contentAssist"); //$NON-NLS-0$
						var providers = [];
						for (var i=0; i < serviceReferences.length; i++) {
							var serviceReference = serviceReferences[i],
							    contentTypeIds = serviceReference.getProperty("contentType"), //$NON-NLS-0$
							    pattern = serviceReference.getProperty("pattern"); // backwards compatibility //$NON-NLS-0$
							if ((contentTypeIds && contentTypeRegistry.isSomeExtensionOf(fileContentType, contentTypeIds)) ||
									(pattern && new RegExp(pattern).test(fileName))) {
								providers.push(serviceRegistry.getService(serviceReference));
							}
						}
						contentAssist.setProviders(providers);
						contentAssist.setProgress(progress);
					});
					var widget = new mContentAssist.ContentAssistWidget(contentAssist, "contentassist"); //$NON-NLS-0$
					var result = new mContentAssist.ContentAssistMode(contentAssist, widget);
					contentAssist.setMode(result);
					return result;
				}
			};

			var editor = this.editor = new mEditor.Editor({
				textViewFactory: textViewFactory,
				undoStackFactory: new mEditorFeatures.UndoFactory(),
				textDNDFactory: new mEditorFeatures.TextDNDFactory(),
				annotationFactory: new mEditorFeatures.AnnotationFactory(),
				foldingRulerFactory: new mEditorFeatures.FoldingRulerFactory(),
				lineNumberRulerFactory: new mEditorFeatures.LineNumberRulerFactory(),
				contentAssistFactory: contentAssistFactory,
				keyBindingFactory: keyBindingFactory,
				statusReporter: this.statusReporter.bind(this),
				domNode: editorDomNode
			});
			
			this.dispatcher = new mDispatcher.Dispatcher(this.serviceRegistry, editor);
			localSettings = new EditorSettings({local: true, editor: editor, themePreferences: themePreferences, preferences: editorPreferences});

			inputManager.addEventListener("InputChanged", function(event) { //$NON-NLS-0$
				this.syntaxHighlighter.setup(event.contentType, editor.getTextView(), editor.getAnnotationModel(), event.title, true).then(function() {
					this.dispatcher.setContentType(event.contentType);
					this.updateStyler(this.settings);
				}.bind(this));
			}.bind(this));

			serviceRegistry.getService("orion.core.marker").addEventListener("problemsChanged", function(event) { //$NON-NLS-1$ //$NON-NLS-0$
				editor.showProblems(event.problems);
			});
			serviceRegistry.getService("orion.core.blame").addEventListener("blameChanged", function(event) { //$NON-NLS-1$ //$NON-NLS-0$
				editor.showBlame(event.blameInfo);
			});
			var markOccurrences = new mMarkOccurrences.MarkOccurrences(serviceRegistry, editor);
			editor.addEventListener("TextViewInstalled", function(event) { //$NON-NLS-0$
				markOccurrences.findOccurrences(inputManager, event.textView);
			});
			var syntaxChecker = new mSyntaxchecker.SyntaxChecker(serviceRegistry, editor);
			editor.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
				syntaxChecker.checkSyntax(inputManager.getContentType(), evt.title, evt.message, evt.contents);
			});

			this.editorPreferences.getPrefs(this.updateSettings.bind(this));
		},
		create: function() {
			this.editor.installTextView();
		},
		destroy: function() {
			this.editor.uninstallTextView();
		}
	};
	return {EditorView: EditorView};
});


