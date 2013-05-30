/*globals define*/

define("orion/widgets/settings/EditorSettings", //$NON-NLS-0$
[
	'require', //$NON-NLS-0$
	'orion/util', //$NON-NLS-0$
	'orion/objects', //$NON-NLS-0$
	'orion/webui/littlelib', //$NON-NLS-0$
	'i18n!orion/settings/nls/messages', //$NON-NLS-0$ 
	'orion/widgets/input/LabeledTextfield', 'orion/widgets/input/LabeledCheckbox',  //$NON-NLS-0$  //$NON-NLS-1$ 
	'orion/widgets/input/Select', //$NON-NLS-0$ 
	'orion/widgets/settings/Subsection', //$NON-NLS-0$ 
	'orion/commands'//$NON-NLS-0$ 
], function(require, util, objects, lib, messages, LabeledTextfield, LabeledCheckbox, Select, Subsection, commands)  {
    var KEY_MODES = [
    "Default",
	"Emacs" //$NON-NLS-0$
	//"VI" //$NON-NLS-0$
	];
				
	function EditorSettings(options, node) {
		objects.mixin(this, options);
		this.node = node;
		this._editorPref = options.preferences; //$NON-NLS-0$
	}
	objects.mixin( EditorSettings.prototype, {
		// TODO these should be real Orion sections, not fake DIVs
		templateString: '' +  //$NON-NLS-0$
				'<div>' +  //$NON-NLS-0$
					'<div class="sectionWrapper toolComposite">' + //$NON-NLS-0$
						'<div class="sectionAnchor sectionTitle layoutLeft">${EditorSettings}</div>' +  //$NON-NLS-0$
					'</div>' + //$NON-NLS-0$
					'<div class="sections">' + //$NON-NLS-0$
					
					'</div>' + //$NON-NLS-0$
					'<div></div>' + //$NON-NLS-0$ 
					
				'</div>', //$NON-NLS-0$
		commandTemplate:'<div id="commandButtons">' + //$NON-NLS-0$
				'<div id="editorCommands" class="layoutRight sectionActions"></div>' + //$NON-NLS-0$
				'</div>', //$NON-NLS-0$
		createElements: function() {
			this.node.innerHTML = this.templateString;
			var commandArea = document.getElementById( 'pageActions' ); //$NON-NLS-0$
			commandArea.innerHTML = this.commandTemplate;
			lib.processTextNodes(this.node, messages);
			this.sections = lib.$('.sections', this.node); //$NON-NLS-0$
			this.createSections();
		},
		createSections: function(){
			/* - file management ----------------------------------------------------- */
			var fileMgtFields = [];
			if (this.oldPrefs.autoSaveVisible) {
				fileMgtFields.push(this.autoSaveCheck = new LabeledCheckbox( {fieldlabel:messages['Autosave Enabled']}));
				fileMgtFields.push(this.autoSaveField = new LabeledTextfield( {fieldlabel:messages['Save interval']}));
			}
			
			if (this.oldPrefs.autoLoadVisible) {
				fileMgtFields.push(this.autoLoadCheck = new LabeledCheckbox( {fieldlabel:messages['Autoload Enabled']}));
			}
			
			var fileMgtSubsection = new Subsection( {sectionName: messages['FileMgt'], parentNode: this.sections, children: fileMgtFields} );
			if (fileMgtFields.length > 0) {
				fileMgtSubsection.show();
			}
		
		
			/* - behaviour  ---------------------------------------------------- */			
			var behavrFields = [];
			
			if (this.oldPrefs.tabSizeVisible) {
				behavrFields.push(this.tabField = new LabeledTextfield( {fieldlabel:messages['TabSize']})); //$NON-NLS-0$
			}
			
			if (this.oldPrefs.scrollEnabledVisible) {
				behavrFields.push(this.scrollCheck = new LabeledCheckbox( {fieldlabel:messages['Scrolled']}));
				behavrFields.push(this.scrollField = new LabeledTextfield( {fieldlabel:messages['ScrollAnimation']}));
			}

			var behavrSubsection = new Subsection( {sectionName:messages['Behaviour'], parentNode: this.sections, children: behavrFields } );
			if (behavrFields.length > 0) {
				behavrSubsection.show();
			}
			
			/* - key bindings  ---------------------------------------------------- */	
			var kbFields = [];
			
			if (this.oldPrefs.keyBindingsVisible) {
				var keys = KEY_MODES;
				var options = [];
				for( var i= 0; i < keys.length; i++ ){
					var key = keys[i];
					var set = {
						value: key,
						label: key
					};	
					if( key === this.oldPrefs.keyBindings ){
						set.selected = true;
					}
					options.push(set);
				}	
			
				kbFields.push(this.kbSelect = new Select( {options:options})); //$NON-NLS-0$
					
				var kbSubsection = new Subsection( {sectionName:messages['KeyBindings'], parentNode: this.sections, children: kbFields } );
				kbSubsection.show();
			}
			
			
			var updateCommand = new commands.Command({
				name: messages["Update"],
				tooltip: messages["Update Editor Settings"],
				id: "orion.updateeditorsettings", //$NON-NLS-0$
				callback: function(data){
					this.update(data.items);
				}.bind(this)
			});
			
			this.commandService.addCommand(updateCommand);
			this.commandService.registerCommandContribution('editorSettingCommand', "orion.updateeditorsettings", 1); //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands('editorSettingCommand', lib.node( 'editorCommands' ), this, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$		
			
			var restoreCommand = new commands.Command({
				name: messages["Restore"],
				tooltip: messages["Restore default Editor Settings"],
				id: "orion.restoreeditorsettings", //$NON-NLS-0$
				callback: function(data){
					this.restore(data.items);
				}.bind(this)
			});
		
			
			this.commandService.addCommand(restoreCommand);
			this.commandService.registerCommandContribution('restoreEditorSettingCommand', "orion.restoreeditorsettings", 2); //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands('restoreEditorSettingCommand', lib.node( 'editorCommands' ), this, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$			
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
		validate: function() {
			if (this.autoSaveField) {
				var timeOut = this.autoSaveField.getValue();
				if (isNaN(parseFloat(timeOut)) || !isFinite(timeOut)) {
					return "Invalid save interval.";
				}
			}
			return "";
		},
		update: function() {
			var messageService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
			var currentPrefs = this.valueChanged();
			if (currentPrefs) {
				var msg=this.validate();
				if (msg) {
					messageService.setProgressResult({Message:msg,Severity:"Error"}); 
					return;
				}
				this._editorPref.setPrefs(currentPrefs, function (){ 
					messageService.setProgressResult( {Message:"Editor preferences updated",Severity:"Normal"} ); 
				});
			}
		},
		restore: function() {
			var messageService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
			
			this._editorPref.setPrefs({}, function (editorPrefs){ 
					messageService.setProgressResult( {Message:"Editor defaults restored",Severity:"Normal"} ); 
					this._show(editorPrefs);
				}.bind(this));
		},
		show: function() {
			this._editorPref.getPrefs(function (editorPrefs) {
				this._show(editorPrefs);
			}.bind(this));
		},
		_show: function(editorPrefs) {
			this.oldPrefs = editorPrefs;
			this.createElements();
			this.setValues(editorPrefs);
		},
		getValues: function(editorPrefs) {
			if (this.autoSaveCheck) {
				editorPrefs.autoSaveEnabled = this.autoSaveCheck.isChecked();
			}
			
			if (this.autoSaveField) {
				editorPrefs.autoSaveTimeout = this.autoSaveField.getValue();
			}
			
			if (this.autoLoadCheck) {
				editorPrefs.autoLoadEnabled = this.autoLoadCheck.isChecked();
			}
			
			if (this.tabField) {
				editorPrefs.tabSize = this.tabField.getValue();
			} 
			if (this.scrollCheck) {
				editorPrefs.scrollEnabled = this.scrollCheck.isChecked();
			}
			if (this.scrollField) {
				editorPrefs.scrollAnimation = this.scrollField.getValue();
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
			if (this.scrollCheck) {
				this.scrollCheck.setChecked(editorPrefs.scrollEnabled);
			}
			if (this.scrollField) {
				this.scrollField.setValue(editorPrefs.scrollAnimation);
			}
			if (this.kbSelect) {
				this.kbSelect.setSelectedIndex(Math.max(KEY_MODES.indexOf(editorPrefs.keyBindings),0));
			}
		},
		destroy: function() {
			if (this.node) {
				this.node = null;
			}
		}
	});
	
	return EditorSettings;
});