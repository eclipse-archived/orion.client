/*globals define document*/

define("orion/widgets/settings/EditorSettings", //$NON-NLS-0$
[
	'i18n!orion/settings/nls/messages', //$NON-NLS-0$ 
	'orion/widgets/input/LabeledTextfield', 'orion/widgets/input/LabeledCheckbox',  //$NON-NLS-0$  //$NON-NLS-1$ 
	'orion/widgets/input/LabeledSelect', //$NON-NLS-0$ 
	'orion/section', //$NON-NLS-0$ 
	'orion/widgets/settings/Subsection', //$NON-NLS-0$
	'orion/commands', //$NON-NLS-0$ 
	'orion/objects', //$NON-NLS-0$
	'orion/webui/littlelib' //$NON-NLS-0$
], function(messages, LabeledTextfield, LabeledCheckbox, LabeledSelect, mSection, Subsection, commands, objects, lib)  {
    var KEY_MODES = [
	    messages.Default,
		"Emacs", //$NON-NLS-0$
		"vi" //$NON-NLS-0$
	];
				
	function EditorSettings(options, node) {
		objects.mixin(this, options);
		this.node = node;
	}
	objects.mixin( EditorSettings.prototype, {
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
			var prefs = this.oldPrefs;
		
			var fields = [], subSection, options, set, select;
			var themePreferences = this.themePreferences;
			if (!this.local && this.editorThemeWidget) {
				this.editorThemeSection = new mSection.Section(this.sections, {
					id: "editorThemeSettings", //$NON-NLS-0$
					title: messages.EditorThemes,
					canHide: true,
					slideout: true
				});
				
				this.editorThemeWidget.renderData( this.editorThemeSection.getContentElement(), 'INITIALIZE' ); //$NON-NLS-0$
			} else {
				var themeStyles = this.oldThemeStyles;
				if (prefs.themeVisible && (!this.local || prefs.themeLocalVisible)) {
					var styles = themeStyles.styles;
					options = [];
					for( var theme= 0; theme < styles.length; theme++ ){
						set = {
							value: styles[theme].name,
							label: styles[theme].name
						};	
						if( styles[theme].name === themeStyles.style.name ){
							set.selected = true;
						}
						options.push(set);
					}	
					fields.push(select = this.themeSelect = new LabeledSelect( {fieldlabel:messages.Theme, options:options}));
					select.setStorageItem = function(name) {
						themePreferences.setTheme(name);
					};
				}
				if (prefs.fontSizeVisible && (!this.local || prefs.fontSizeLocalVisible)) {
					var fontSize = themeStyles.style.fontSize;
					options = [];
					for( var size = 8; size < 19; size++ ){
						set = {
							value: size + 'pt', //$NON-NLS-0$
							label: size + 'pt' //$NON-NLS-0$
						};
						if( set.label === fontSize ){
							set.selected = true;
						}
						options.push(set);
					}	
					fields.push(select = this.sizeSelect = new LabeledSelect( {fieldlabel:messages["Font Size"], options:options}));
					select.setStorageItem = function(size) {
						themePreferences.setFontSize(size);
					};
				}
				if (!this.local && fields.length > 0) {
					subSection = new Subsection( {sectionName:messages.Theme, parentNode: this.editorThemeSection.getContentElement(), children: fields} );
					subSection.show();
					fields = [];
				}
			}
		
			if (!this.local) {
				this.settingsSection = new mSection.Section(this.sections, {
					id: "editorSettings", //$NON-NLS-0$
					title: messages.EditorSettings,
					canHide: true,
					slideout: true
				});
			}
		
			if (prefs.keyBindingsVisible && (!this.local || prefs.keyBindingsLocalVisible)) {
				var keys = KEY_MODES;
				options = [];
				for( var i= 0; i < keys.length; i++ ){
					var key = keys[i];
					set = {
						value: key,
						label: key
					};	
					if( key === prefs.keyBindings ){
						set.selected = true;
					}
					options.push(set);
				}	
				fields.push(this.kbSelect = new LabeledSelect( {fieldlabel:messages.Scheme, options:options}));
			}
			if (!this.local && fields.length > 0) {
				subSection = new Subsection( {sectionName:messages.KeyBindings, parentNode: this.settingsSection.getContentElement(), children: fields } );
				subSection.show();
				fields = [];
			}
			
			if (prefs.autoSaveVisible && (!this.local || prefs.autoSaveLocalVisible)) {
				fields.push(this.autoSaveCheck = new LabeledCheckbox( {fieldlabel:messages['Auto Save']}));
			}
			if (prefs.autoSaveTimeoutVisible && (!this.local || prefs.autoSaveTimeoutLocalVisible)) {
				fields.push(this.autoSaveField = new LabeledTextfield( {fieldlabel:messages['Save interval']}));
			}
			if (prefs.autoLoadVisible && (!this.local || prefs.autoLoadLocalVisible)) {
				fields.push(this.autoLoadCheck = new LabeledCheckbox( {fieldlabel:messages['Auto Load']}));
			}
			if (!this.local && fields.length > 0) {
				subSection = new Subsection( {sectionName: messages.FileMgt, parentNode: this.settingsSection.getContentElement(), children: fields} );
				subSection.show();
				fields = [];
			}
		
			if (prefs.tabSizeVisible && (!this.local || prefs.tabSizeLocalVisible)) {
				fields.push(this.tabField = new LabeledTextfield( {fieldlabel:messages.TabSize}));
			}
			if (prefs.expandTabVisible && (!this.local || prefs.expandTabLocalVisible)) {
				fields.push(this.expandTabCheck = new LabeledCheckbox( {fieldlabel:messages.ExpandTab}));
			}
			if (!this.local && fields.length > 0) {
				subSection = new Subsection( {sectionName:messages.Tabs, parentNode: this.settingsSection.getContentElement(), children: fields } );
				subSection.show();
				fields = [];
			}
					
			if (prefs.scrollAnimationVisible && (!this.local || prefs.scrollAnimationLocalVisible)) {
				fields.push(this.scrollAnimationCheck = new LabeledCheckbox( {fieldlabel:messages.ScrollAnimationEnabled}));
			}
			if (prefs.scrollAnimationTimeoutVisible && (!this.local || prefs.scrollAnimationTimeoutLocalVisible)) {
				fields.push(this.scrollAnimationField = new LabeledTextfield( {fieldlabel:messages.ScrollAnimationTimeout}));
			}
			if (!this.local && fields.length > 0) {
				subSection = new Subsection( {sectionName:messages.ScrollAnimation, parentNode: this.settingsSection.getContentElement(), children: fields } );
				subSection.show();
				fields = [];
			}
			
			if (this.local) {
				fields.forEach(function(child) {
					this.sections.appendChild( child.node );
					child.setStorageItem = this.update.bind(this);
					child.show();
				}.bind(this));
			}
		},
		createToolbar: function() {
			var toolbar = lib.node( 'editorSettingsToolActionsArea' ); //$NON-NLS-0$
			var restoreCommand = new commands.Command({
				name: messages.Restore,
				tooltip: messages["Restore default Editor Settings"],
				id: "orion.restoreeditorsettings", //$NON-NLS-0$
				callback: function(data){
					this.restore(data.items);
				}.bind(this)
			});
			this.commandService.addCommand(restoreCommand);
			this.commandService.registerCommandContribution('restoreEditorSettingCommand', "orion.restoreeditorsettings", 2); //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands('restoreEditorSettingCommand', toolbar, this, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$			

			var updateCommand = new commands.Command({
				name: messages.Update,
				tooltip: messages["Update Editor Settings"],
				id: "orion.updateeditorsettings", //$NON-NLS-0$
				callback: function(data){
					this.update(data.items);
				}.bind(this)
			});
			this.commandService.addCommand(updateCommand);
			this.commandService.registerCommandContribution('editorSettingCommand', "orion.updateeditorsettings", 1); //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands('editorSettingCommand', toolbar, this, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$		
		},
		valueChanged: function() {
			var currentPrefs = {};
			for (var property in this.oldPrefs) {
				if (this.oldPrefs.hasOwnProperty(property)) {
					currentPrefs[property] = this.oldPrefs[property];
				}
			}
			this.getValues(currentPrefs);
			for (var prop in currentPrefs) {
				if (currentPrefs.hasOwnProperty(prop)) {
					if (currentPrefs[prop] !== this.oldPrefs[prop]) {
						return currentPrefs;
					}
				}
			}
			return undefined;
		},
		validate: function(prefs) {
			if (isNaN(prefs.autoSaveTimeout) || !isFinite(prefs.autoSaveTimeout)) {
				return messages["Invalid save interval."];
			}
			if (isNaN(prefs.scrollAnimationTimeout) || !isFinite(prefs.scrollAnimationTimeout)) {
				return messages["Invalid scrolling duration."];
			}
			if (!(1 <= prefs.tabSize && prefs.tabSize <= 16)) {
				return messages["Invalid tab size."];
			}
			return "";
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
		},
		restore: function() {
			this.preferences.setPrefs({}, function (editorPrefs){ 
				this._show(editorPrefs);
				this._progress(messages["Editor defaults restored"], "Normal"); //$NON-NLS-0$
			}.bind(this));
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
		getValues: function(editorPrefs) {
			if (this.autoSaveCheck) {
				editorPrefs.autoSaveEnabled = this.autoSaveCheck.isChecked();
			}
			if (this.autoSaveField) {
				editorPrefs.autoSaveTimeout = parseInt(this.autoSaveField.getValue(), 10);
			}
			if (this.autoLoadCheck) {
				editorPrefs.autoLoadEnabled = this.autoLoadCheck.isChecked();
			}
			if (this.tabField) {
				editorPrefs.tabSize = parseInt(this.tabField.getValue(), 10);
			} 
			if (this.expandTabCheck) {
				editorPrefs.expandTab = this.expandTabCheck.isChecked();
			}
			if (this.scrollAnimationCheck) {
				editorPrefs.scrollAnimationEnabled = this.scrollAnimationCheck.isChecked();
			}
			if (this.scrollAnimationField) {
				editorPrefs.scrollAnimationTimeout = parseInt(this.scrollAnimationField.getValue(), 10);
			}
			if (this.kbSelect) {
				editorPrefs.keyBindings = this.kbSelect.getSelected();
			}
		},
		setValues: function(editorPrefs) {
			if (this.autoSaveCheck) {
				this.autoSaveCheck.setChecked(editorPrefs.autoSaveEnabled);
			}
			if (this.autoSaveField) {
				this.autoSaveField.setValue(editorPrefs.autoSaveTimeout);
			}
			if (this.autoLoadCheck) {
				this.autoLoadCheck.setChecked(editorPrefs.autoLoadEnabled);
			}
			if (this.tabField) {
				this.tabField.setValue(editorPrefs.tabSize);
			} 
			if (this.expandTabCheck) {
				this.expandTabCheck.setChecked(editorPrefs.expandTab);
			} 
			if (this.scrollAnimationCheck) {
				this.scrollAnimationCheck.setChecked(editorPrefs.scrollAnimationEnabled);
			}
			if (this.scrollAnimationField) {
				this.scrollAnimationField.setValue(editorPrefs.scrollAnimationTimeout);
			}
			if (this.kbSelect) {
				this.kbSelect.setSelectedIndex(Math.max(KEY_MODES.indexOf(editorPrefs.keyBindings),0));
			}
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
	
	return EditorSettings;
});