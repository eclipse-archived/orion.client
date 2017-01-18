/*eslint-env browser */
define([
	'i18n!orion/settings/nls/messages', //$NON-NLS-0$
	'orion/section', //$NON-NLS-0$
	'orion/webui/littlelib', //$NON-NLS-0$
	'orion/objects', //$NON-NLS-0$
	'orion/widgets/settings/Subsection',
	'orion/widgets/input/SettingsCheckbox',
	'orion/widgets/input/SettingsTextfield',
	'orion/widgets/input/ChipHolder',
	'orion/util'], 
function(messages, mSection, lib, objects, Subsection, SettingsCheckbox, SettingsTextfield, mChipHolder, util) {
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
						postChange: this.setDesktopPolicy.bind(this)}),  //$NON-NLS-0$
					new SettingsTextfield({
				    	fieldlabel: messages["filteredResources"], 
				    	fieldTitle: messages["filteredResourcesTooltip"],
				    	postChange: this.setFilteredResources.bind(this)
				    })
				];
				
				var generalSettingSection1 = new Subsection( {sectionName:messages["Selection"], parentNode: this.sections, children: this.generalSection1Fields, additionalCssClass: 'git-setting-header'} );
				generalSettingSection1.show();
				
				if(util.isElectron){
					// Using Index Search Policy
					this.generalSection2Fields=[	new SettingsCheckbox( {fieldlabel: messages["filenameSearchPolicy"], 
					fieldTitle: messages["filenameSearchPolicyTooltip"],
					postChange: this.setFilenameSearchPolicy.bind(this)})
					];
					
					this.chipHolder = new mChipHolder({fieldlabel:messages["ExcludeNames"],fieldTitle:messages["ExcludeNamesToolTip"],postInputBoxChange:this.postInputBoxChange.bind(this),postClose:this.postClose.bind(this)});
					this.generalSection2Fields.push(this.chipHolder);
					
					var generalSettingSection2 = new Subsection( {sectionName:messages["File Search"], parentNode: this.sections, children: this.generalSection2Fields, additionalCssClass: 'git-setting-header'} );
					generalSettingSection2.show();
				}
			},
					
			setDesktopPolicy: function() {
				var deskTopSelectionEnabled = this.generalSection1Fields[0].isChecked();
				this.preferences.getPrefs().then(function (genealPrefs) {
					genealPrefs.desktopSelectionPolicy = deskTopSelectionEnabled;
					this.preferences.setPrefs(genealPrefs);
				}.bind(this));

			},
			
			setFilenameSearchPolicy: function() {
				var filenameSearchUsingIndex = this.generalSection2Fields[0].isChecked();
				this.preferences.getPrefs().then(function (genealPrefs) {
					genealPrefs.filenameSearchPolicy = filenameSearchUsingIndex;
					this.preferences.setPrefs(genealPrefs);
				}.bind(this));
			},
			
			postInputBoxChange: function(content) {
				this.preferences.getPrefs().then(function (genealPrefs) {
					if(genealPrefs.indexExcludeFileNames.indexOf(content) === -1){
						genealPrefs.indexExcludeFileNames.push(content);
						this.preferences.setPrefs(genealPrefs);
					}
				}.bind(this));
			},
			postClose: function(content) {
				this.preferences.getPrefs().then(function (genealPrefs) {
					genealPrefs.indexExcludeFileNames = genealPrefs.indexExcludeFileNames.filter(function (n) { return n !== content; });
					this.preferences.setPrefs(genealPrefs);
				}.bind(this));
			},

			/**
			 * @name setFilteredResources
			 * @description Sets the string of filtered options
			 * @function
			 * @since 13.0
			 */
			setFilteredResources: function setFilteredResources() {
				this.preferences.setPrefs({filteredResources: this.generalSection1Fields[1].getValue()});
			},
			
			show:function(node, callback){
				if (node) {
					this.node = node;
				}
				this.createElements();
				this.preferences.getPrefs().then(function (generalPrefs) {
					this.generalSection1Fields[0].setSelection(generalPrefs.desktopSelectionPolicy);
					this.generalSection1Fields[0].show();
					//filtered resources
					if(typeof generalPrefs.filteredResources !== 'string') {
						this.generalSection1Fields[1].setValue(".git"); //default
					} else {
						this.generalSection1Fields[1].setValue(generalPrefs.filteredResources);
					}
					this.generalSection1Fields[1].show();
					if(util.isElectron){
						this.generalSection2Fields[0].setSelection(generalPrefs.filenameSearchPolicy);
						this.generalSection2Fields[0].show();
						this.chipHolder.initiat(generalPrefs.indexExcludeFileNames || this.preferences.getDefaults().indexExcludeFileNames);
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