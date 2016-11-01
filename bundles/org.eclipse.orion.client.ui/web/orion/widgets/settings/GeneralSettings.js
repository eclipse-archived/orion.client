/*eslint-env browser */
define([
	'i18n!orion/settings/nls/messages', //$NON-NLS-0$
	'orion/section', //$NON-NLS-0$
	'orion/webui/littlelib', //$NON-NLS-0$
	'orion/objects', //$NON-NLS-0$
	'orion/widgets/input/SettingsCheckbox',
	'orion/util'], 
function(messages, mSection, lib, objects, SettingsCheckbox, util) {
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
					postChange: this.setDesktopPolicy.bind(this)})  //$NON-NLS-0$
				];
				if(util.isElectron){
					this.generalFields.push(	new SettingsCheckbox( {fieldlabel: messages["filenameSearchPolicy"], 
					fieldTitle: messages["filenameSearchPolicyTooltip"],
					postChange: this.setFilenameSearchPolicy.bind(this)}));
				}
				new mSection.Section(this.node, {
					id: "fileNavigation", //$NON-NLS-0$
					title: messages.fileNavigation,
					content: '<section class="setting-row" role="region" aria-labelledby="GeneralSettingsTitle" id="setting-row-general">', //$NON-NLS-0$
				});	
				
				var settingsContentElement = document.createElement('div'); //$NON-NLS-0$
				settingsContentElement.className = 'setting-content'; //$NON-NLS-0$
				settingsContentElement.style.paddingLeft = "30px";
				
				lib.node('setting-row-general').appendChild(settingsContentElement); //$NON-NLS-0$

				this.generalFields.forEach(function(child) {
					settingsContentElement.appendChild(child.node);
					//child.show();
				});
			},
					
			setDesktopPolicy: function() {
				var deskTopSelectionEnabled = this.generalFields[0].isChecked();
				this.preferences.getPrefs().then(function (genealPrefs) {
					genealPrefs.desktopSelectionPolicy = deskTopSelectionEnabled;
					this.preferences.setPrefs(genealPrefs);
				}.bind(this));

			},
			
			setFilenameSearchPolicy: function() {
				var filenameSearchUsingIndex = this.generalFields[1].isChecked();
				this.preferences.getPrefs().then(function (genealPrefs) {
					genealPrefs.filenameSearchPolicy = filenameSearchUsingIndex;
					this.preferences.setPrefs(genealPrefs);
				}.bind(this));
			},

			show:function(node, callback){
				if (node) {
					this.node = node;
				}
				this.createElements();
				this.preferences.getPrefs().then(function (genealPrefs) {
					this.generalFields[0].setSelection(genealPrefs.desktopSelectionPolicy);
					this.generalFields[0].show();
					if(util.isElectron){
						this.generalFields[1].setSelection(genealPrefs.filenameSearchPolicy);
						this.generalFields[1].show();
					}
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