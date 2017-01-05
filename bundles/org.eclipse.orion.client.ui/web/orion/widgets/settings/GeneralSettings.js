/*eslint-env browser */
define([
	'i18n!orion/settings/nls/messages',
	'orion/section',
	'orion/webui/littlelib',
	'orion/objects',
	'orion/widgets/input/SettingsCheckbox',
	'orion/widgets/input/SettingsTextfield'
], function(messages, mSection, lib, objects, SettingsCheckbox, SettingsTextfield) {
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
				    	postChange: this.setDesktopPolicy.bind(this)}),
				    new SettingsTextfield({
				    	fieldlabel: messages["filteredResources"], 
				    	fieldTitle: messages["filteredResourcesTooltip"],
				    	postChange: this.setFilteredResources.bind(this)
				    })
				];
				new mSection.Section(this.node, {
					id: "fileNavigation", //$NON-NLS-0$
					title: messages.fileNavigation,
					content: '<section class="setting-row" role="region" aria-labelledby="fileNavigationTitle" id="setting-row-general">', //$NON-NLS-0$
				});	
				
				var settingsContentElement = document.createElement('div');
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
				this.preferences.setPrefs({desktopSelectionPolicy: deskTopSelectionEnabled});
			},

			/**
			 * @name setFilteredResources
			 * @description Sets the string of filtered options
			 * @function
			 * @since 13.0
			 */
			setFilteredResources: function setFilteredResources() {
				this.preferences.setPrefs({filteredResources: this.generalFields[1].getValue()});
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
						this.generalFields[1].setValue(".git"); //default
					} else {
						this.generalFields[1].setValue(generalPrefs.filteredResources);
					}
					this.generalFields[1].show();
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