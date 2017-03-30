/*eslint-env browser */
define([
	'i18n!orion/settings/nls/messages',
	'orion/section',
	'orion/webui/littlelib',
	'orion/objects',
	'orion/widgets/input/SettingsCheckbox',
	'orion/widgets/input/SettingsTextfield',
	'orion/widgets/settings/Subsection', 
], function(messages, mSection, lib, objects, SettingsCheckbox, SettingsTextfield, Subsection) {
	function GeneralSettings(options, node) {
		objects.mixin(this, options);
		this.node = node;
	}
	objects.mixin(GeneralSettings.prototype, {
		dispatch: true,

			createElements: function() {
				this.createSections();
			},

			createSections: function(){
				/* - desktop selection policy fields ----------------------------------------------------- */
				this.generalFields = [
					new SettingsCheckbox( {fieldlabel: messages["desktopSelectionPolicy"],
						fieldTitle: messages["desktopSelectionPolicyTooltip"],
						postChange: this.setPreferences.bind(this)
					}),
					new SettingsTextfield({
						fieldlabel: messages["filteredResources"],
						fieldTitle: messages["filteredResourcesTooltip"],
						postChange: this.setPreferences.bind(this)
					}),
					new SettingsCheckbox({
						fieldlabel: messages["enableEditorTabs"],
						fieldTitle: messages["enableEditorTabsTooltip"],
						postChange: this.setPreferences.bind(this)
					}),
					new SettingsTextfield({
						fieldlabel: messages["maximumEditorTabs"],
						fieldTitle: messages["maximumEditorTabsTooltip"],
						postChange: this.setPreferences.bind(this)
					}),
					new SettingsCheckbox({
						fieldlabel: messages["enableDebugger"],
						fieldTitle: messages["enableDebuggerTooltip"],
						postChange: this.setPreferences.bind(this)
					}),
				];

				new mSection.Section(this.node, {
					id: "fileNavigation", //$NON-NLS-0$
					title: messages.fileNavigation,
					content: '<section class="setting-row" role="region" aria-labelledby="fileNavigationTitle" id="setting-row-general">', //$NON-NLS-0$
				});

				var settingsContentElement = document.createElement('div');
				settingsContentElement.className = 'setting-content'; //$NON-NLS-0$
				lib.node('setting-row-general').appendChild(settingsContentElement); //$NON-NLS-0$
				
				var fileSubsection = new Subsection({
					sectionName: messages["Files"],
					parentNode: settingsContentElement,
					children: [this.generalFields[0], this.generalFields[1]]
				});
				fileSubsection.show();
				
				var editorTabs = new Subsection({
					sectionName: messages["EditorTabs"],
					parentNode: settingsContentElement,
					children: [this.generalFields[2], this.generalFields[3]]
				});
				editorTabs.show();
				
				var debuggerSubsection = new Subsection({
					sectionName: messages["Debugger"],
					parentNode: settingsContentElement,
					children: [this.generalFields[4]]
				});
				debuggerSubsection.show();
			},

			setPreferences: function() {
				// Return the promise for test purposes.
				return this.preferences.getPrefs().then(function (generalPrefs) {
					generalPrefs.desktopSelectionPolicy = this.generalFields[0].isChecked();
					generalPrefs.filteredResources = this.generalFields[1].getValue();
					generalPrefs.enableEditorTabs = this.generalFields[2].isChecked();
					var maxTabs = parseInt(this.generalFields[3].getValue(), 10);
					maxTabs = isNaN(maxTabs) ? 0 : maxTabs;
					generalPrefs.maximumEditorTabs = maxTabs;
					generalPrefs.enableDebugger = this.generalFields[4].isChecked();
					this.preferences.setPrefs(generalPrefs);
				}.bind(this));
			},

			show:function(node, callback){
				if (node) {
					this.node = node;
				}
				this.createElements();
				this.preferences.getPrefs().then(function (generalPrefs) {
					this.generalFields[0].setSelection(generalPrefs.desktopSelectionPolicy);
					this.generalFields[0].show();

					//filtered resources
					if(typeof generalPrefs.filteredResources !== 'string') {
						this.generalFields[1].setValue(".git, .DS_Store"); //default
					} else {
						this.generalFields[1].setValue(generalPrefs.filteredResources);
					}
					this.generalFields[1].show();
					
					// Enable editor tabs.
					this.generalFields[2].setSelection(generalPrefs.enableEditorTabs);
					this.generalFields[2].show();
					
					// Maximum editor tabs.
					this.generalFields[3].setValue(generalPrefs.maximumEditorTabs);
					this.generalFields[3].show();
					
					// Enable debugger.
					this.generalFields[4].setSelection(generalPrefs.enableDebugger);
					this.generalFields[4].show();

					if (callback) {
						callback();
					}
				}.bind(this));
			},
			destroy: function() {
				if (this.node) {
					this.node = null;
				}
			}
	});
	return GeneralSettings;
});
