/*eslint-env browser */
define([
	'i18n!orion/settings/nls/messages', //$NON-NLS-0$
	'orion/section', //$NON-NLS-0$
	'orion/webui/littlelib', //$NON-NLS-0$
	'orion/objects', //$NON-NLS-0$
	'orion/widgets/settings/Subsection',
	'orion/widgets/input/SettingsCheckbox',
	'orion/widgets/input/ChipHolder',
	'orion/util'], 
function(messages, mSection, lib, objects, Subsection, SettingsCheckbox, mChipHolder, util) {
	function GeneralSettings(options, node) {
		objects.mixin(this, options);
		this.node = node;
	}
	objects.mixin(GeneralSettings.prototype, {
		dispatch: true,
		templateString: '' +  //$NON-NLS-0$
					'<div class="sectionWrapper toolComposite">' +
						'<div class="sectionAnchor sectionTitle layoutLeft">${fileNavigation}</div>' + 
						'<div id="userCommands" class="layoutRight sectionActions"></div>' +
					'</div>' + //$NON-NLS-2$ //$NON-NLS-0$
					'<div class="sections sectionTable">' + //$NON-NLS-0$
					'</div>', //$NON-NLS-0$

			createElements: function() {
				this.node.innerHTML = this.templateString;
				lib.processTextNodes(this.node, messages);
			
			 	this.sections = lib.$('.sections', this.node);
				this.createSections();
			},	
					
			createSections: function(){
				/* - desktop selection policy fields ----------------------------------------------------- */
				this.generalSection1Fields = [
					new SettingsCheckbox( {fieldlabel: messages["desktopSelectionPolicy"], 
					fieldTitle: messages["desktopSelectionPolicyTooltip"],
					postChange: this.setDesktopPolicy.bind(this)})  //$NON-NLS-0$
				];
				
				
//				if(util.isElectron){
					// Using Index Search Policy
				this.generalSection2Fields=[	new SettingsCheckbox( {fieldlabel: messages["filenameSearchPolicy"], 
					fieldTitle: messages["filenameSearchPolicyTooltip"],
					postChange: this.setFilenameSearchPolicy.bind(this)})
					// Index include node_modules Policy 
//					new SettingsCheckbox( {fieldlabel: messages["indexNodeModulePolicy"], 
//					fieldTitle: messages["indexNodeModulePolicyTooltip"],
//					postChange: this.setFilenameSearchNodeModulesPolicy.bind(this)})
				];
//				}
				
				var chipholder = new mChipHolder({fieldlabel:messages["ExcludeNames"],fieldTitle:messages["ExcludeNamesToolTip"]});
				
				this.generalSection2Fields.push(chipholder);
				var generalSettingSection1 = new Subsection( {sectionName:messages["Selection"], parentNode: this.sections, children: this.generalSection1Fields, additionalCssClass: 'git-setting-header'} );
				generalSettingSection1.show();
				
				var generalSettingSection2 = new Subsection( {sectionName:messages["File Search"], parentNode: this.sections, children: this.generalSection2Fields, additionalCssClass: 'git-setting-header'} );
				generalSettingSection2.show();
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
			
			setFilenameSearchNodeModulesPolicy: function() {
				var indexNodeModules = this.generalFields[2].isChecked();
				this.preferences.getPrefs().then(function (genealPrefs) {
					genealPrefs.filenameSearchNodeModulesPolicy = indexNodeModules;
					this.preferences.setPrefs(genealPrefs);
				}.bind(this));
			},

			show:function(node, callback){
				if (node) {
					this.node = node;
				}
				this.createElements();
				this.preferences.getPrefs().then(function (genealPrefs) {
					this.generalSection1Fields[0].setSelection(genealPrefs.desktopSelectionPolicy);
					this.generalSection1Fields[0].show();
//					if(util.isElectron){
						this.generalSection2Fields[0].setSelection(genealPrefs.filenameSearchPolicy);
						this.generalSection2Fields[0].show();
//					}
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