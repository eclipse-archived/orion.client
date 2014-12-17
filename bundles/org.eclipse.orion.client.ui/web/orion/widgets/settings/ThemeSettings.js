/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define("orion/widgets/settings/ThemeSettings", //$NON-NLS-0$
[
	'i18n!orion/settings/nls/messages', //$NON-NLS-0$
	'orion/section', //$NON-NLS-0$
	'orion/objects', //$NON-NLS-0$
	'orion/webui/littlelib' //$NON-NLS-0$
], function(messages, mSection, objects, lib)  {

	function ThemeSettings(options, node) {
		objects.mixin(this, options);
		this.node = node;
	}
	objects.mixin( ThemeSettings.prototype, {
		templateString: '<div class="sections"></div>', //$NON-NLS-0$
		commandTemplate:
				'<div id="commandButtons">' + //$NON-NLS-0$
					'<div id="editorCommands" class="layoutRight sectionActions"></div>' + //$NON-NLS-0$
				'</div>', //$NON-NLS-0$
		createElements: function() {
			this.node.innerHTML = this.templateString;
			this.sections = lib.$('.sections', this.node); //$NON-NLS-0$
			this.createSections();
			if (this.local) {
				this.sections.classList.add("local"); //$NON-NLS-0$
			} else {
				var commandArea = document.getElementById( 'pageActions' ); //$NON-NLS-0$
				commandArea.innerHTML = this.commandTemplate;
				this.createToolbar();
			}
		},
		createSections: function() {
			if (!this.local && this.editorThemeWidget) {
				this.editorThemeSection = new mSection.Section(this.sections, {
					id: "editorThemeSettings", //$NON-NLS-0$
					title: messages.EditorThemes,
					slideout: true
				});

				this.editorThemeWidget.renderData( this.editorThemeSection.getContentElement(), 'INITIALIZE' ); //$NON-NLS-0$
			} 
		},
		validate: function(prefs) {
			var msg = "";
			this._forEach(function(property, info) {
				if (info.validate) {
					msg = info.validate(property, prefs);
					if (msg) {
						return false;
					}
				}
				return true;
			});
			return msg;
		},
		_progress: function(msg, severity) {
			if (this.registry) {
				var messageService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
				messageService.setProgressResult( {Message:msg, Severity:severity} );
			}
		},
		update: function() {
			var currentPrefs = this.valueChanged();
			if (currentPrefs) {
				var msg = this.validate(currentPrefs);
				if (msg) {
					this._progress(msg,"Error"); //$NON-NLS-0$
					return;
				}
				this.preferences.setPrefs(currentPrefs, function () {
					this.setValues(this.oldPrefs = currentPrefs);
					this._progress(messages["Editor preferences updated"], "Normal"); //$NON-NLS-0$
				}.bind(this));
			} else {
				this.setValues(this.oldPrefs);
			}
			if (this.editor) {
				this.editor.focus();
			}
		},
		show: function(node, callback) {
			if (node) {
				this.node = node;
			}
			this.themePreferences.getTheme(function(themeStyles) {
				this.preferences.getPrefs(function (editorPrefs) {
					this._show(editorPrefs, themeStyles);
					if (callback) {
						callback();
					}
				}.bind(this));
			}.bind(this));
		},
		_show: function(editorPrefs, themeStyles) {
			if (themeStyles) {
				this.oldThemeStyles = themeStyles;
			}
			this.oldPrefs = editorPrefs;
			this.createElements();
			this.setValues(editorPrefs);
		},
		destroy: function() {
			if (this.node) {
				this.node = null;
			}
			if (this.editorThemeWidget) {
				this.editorThemeWidget.destroy();
				this.editorThemeWidget = null;
			}
		}
	});

	return ThemeSettings;
});
