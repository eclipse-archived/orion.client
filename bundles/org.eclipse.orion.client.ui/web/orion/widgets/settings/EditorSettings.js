/*globals define*/

define("orion/widgets/settings/EditorSettings", //$NON-NLS-0$
[
	'require', //$NON-NLS-0$
	'orion/util', //$NON-NLS-0$
	'orion/objects', //$NON-NLS-0$
	'orion/webui/littlelib', //$NON-NLS-0$
	'i18n!orion/settings/nls/messages', //$NON-NLS-0$ 
	'orion/widgets/input/LabeledTextfield', 'orion/widgets/input/LabeledCheckbox',  //$NON-NLS-0$  //$NON-NLS-1$ 
	'orion/widgets/settings/Subsection', //$NON-NLS-0$ 
	'orion/commands'//$NON-NLS-0$ 
], function(require, util, objects, lib, messages,LabeledTextfield, LabeledCheckbox, Subsection, commands)  {

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
						'<div class="sectionAnchor sectionTitle layoutLeft">${File Management}</div>' +  //$NON-NLS-0$
						'<div id="editorCommands" class="layoutRight sectionActions"></div>' + //$NON-NLS-0$
					'</div>' + //$NON-NLS-0$
					'<div class="sections">' + //$NON-NLS-0$
					
					'</div>' + //$NON-NLS-0$
					'<div></div>' + //$NON-NLS-0$ 
					
				'</div>', //$NON-NLS-0$
		createElements: function() {
			this.node.innerHTML = this.templateString;
			lib.processTextNodes(this.node, messages);
			this.sections = lib.$('.sections', this.node); //$NON-NLS-0$
			this.createSections();
		},
		createSections: function(){
			/* - autossave ----------------------------------------------------- */
			this.autoSaveFields = [
				new LabeledCheckbox( {fieldlabel:messages['Autosave Enabled']}),
				new LabeledTextfield( {fieldlabel:messages['Save interval']})
			];
			var autoSaveSubsection = new Subsection( {sectionName: messages['Autosave'], parentNode: this.sections, children: this.autoSaveFields} );
			autoSaveSubsection.show();
		
		
			/* - autoload ---------------------------------------------------- */
			this.autoLoadFields = [
				new LabeledCheckbox( {fieldlabel:messages['Autoload Enabled']}) //$NON-NLS-0$
			];
			var autoLoadSubsection = new Subsection( {sectionName:messages['Autoload'], parentNode: this.sections, children: this.autoLoadFields } );
			autoLoadSubsection.show();
			
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
					
		},
		valueChanged: function() {
			var currentPrefs = {
				autoLoadEnabled: this.autoLoadFields[0].isChecked(),
				autoSaveEnabled: this.autoSaveFields[0].isChecked(),
				autoSaveTimeout: this.autoSaveFields[1].getValue()
			};
			for (var prop in currentPrefs) {
				if (currentPrefs.hasOwnProperty(prop)) {
					if (currentPrefs[prop] !== this.oldPrefs[prop]) {
						return currentPrefs;
					}
				}
			}
			return undefined;
		},
		update: function() {
			var messageService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
			
			var currentPrefs = this.valueChanged();
			if (currentPrefs) {
				var timeOut = this.autoSaveFields[1].getValue();
				if (!isNaN(parseFloat(timeOut)) && isFinite(timeOut)) {
					this._editorPref.setPrefs(currentPrefs, function (){ 
						messageService.setProgressResult( {Message:"Editor preferences updated",Severity:"Normal"} ); 
					});
				} else {
					messageService.setProgressResult( {Message:"Invalid save interval.",Severity:"Error"} );
					this.autoSaveFields[1].setValue(this.oldAutoInterval);
				}
			}
		},
		show: function() {
			this.createElements();
			this._editorPref.getPrefs(function (editorPrefs) {
				this.oldPrefs = editorPrefs;
				this.autoLoadFields[0].setChecked(editorPrefs.autoLoadEnabled);
				this.autoSaveFields[0].setChecked(editorPrefs.autoSaveEnabled);
				this.autoSaveFields[1].setValue(editorPrefs.autoSaveTimeout);
			}.bind(this));
		},
		destroy: function() {
			if (this.node) {
				this.node = null;
			}
		}
	});
	
	return EditorSettings;
});