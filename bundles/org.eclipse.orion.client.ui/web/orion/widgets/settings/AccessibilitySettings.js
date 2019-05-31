define([
	'i18n!orion/settings/nls/messages',
	'orion/section',
	'orion/webui/littlelib',
	'orion/objects',
	'orion/i18nUtil',
	'orion/util',
	'orion/widgets/settings/Subsection',
	'orion/widgets/input/SettingsCheckbox',
	'orion/widgets/input/SettingsInfo',
	'marked/marked'
], function(messages, mSection, lib, objects, i18nUtil, util, Subsection, SettingsCheckbox, SettingsInfo, marked) {

	function AccessibilitySettings(options, node) {
		objects.mixin(this, options);
		this.node = node;
		this.node.style.fontSize = "larger";
	}
	objects.mixin(AccessibilitySettings.prototype, {
		dispatch: true,

			createElements: function() {
				this.createSections();
			},

			createSections: function() {
				new mSection.Section(this.node, {
					id: "accessibility", //$NON-NLS-0$
					title: messages.Accessibility,
					content: '<div class="setting-row" id="setting-row-a11y">', //$NON-NLS-0$
				});

				var settingsContentElement = document.createElement('div');
				settingsContentElement.className = 'setting-content'; //$NON-NLS-0$
				lib.node('setting-row-a11y').appendChild(settingsContentElement); //$NON-NLS-0$

				this.disableCodeFoldingCheckbox = new SettingsCheckbox({
					fieldlabel: messages["disableCodeFolding"],
					fieldTitle: messages["disableCodeFoldingTooltip"],
					postChange: this.setPreferences.bind(this)
				});
				this.hideCodeMapCheckbox = new SettingsCheckbox({
					fieldlabel: messages["hideCodeMap"],
					postChange: this.setPreferences.bind(this)
				});

				var visualizationSubsection = new Subsection({
					sectionName: messages["Visualizations"],
					additionalCssClass: 'accessibility-setting-header',
					parentNode: settingsContentElement,
					children: [this.disableCodeFoldingCheckbox, this.hideCodeMapCheckbox]
				});
				visualizationSubsection.show();

				var shortcutInfo = new SettingsInfo({
					content: this._shortcutContent()
				});
				
				var keyboardSubsection = new Subsection({
					sectionName: messages["Keyboard"],
					additionalCssClass: 'accessibility-setting-header',
					parentNode: settingsContentElement,
					children: [shortcutInfo]
				});
				keyboardSubsection.show();

				var themeInfo = new SettingsInfo({
					content: i18nUtil.formatMessage(this._themeContent(), "#,category=themeSettings", "#,category=ideThemeSettings")
				});
				
				var themeSubsection = new Subsection({
					sectionName: messages["Themes"],
					additionalCssClass: 'accessibility-setting-header',
					parentNode: settingsContentElement,
					children: [themeInfo]
				});
				themeSubsection.show();

				var srInfo = new SettingsInfo({
					content: this._srContent()
				});
				
				var srSubsection = new Subsection({
					sectionName: messages["ScreenReaders"],
					additionalCssClass: 'accessibility-setting-header',
					parentNode: settingsContentElement,
					children: [srInfo]
				});
				srSubsection.show();

				this.preferences.get("/a11yLinks").then( function(prefs) {
					return prefs.a11yInfoLink || "https://wiki.eclipse.org/Orion/Accessibility"; // backup URL
				}).then( function(url) {
					var markup = marked(i18nUtil.formatMessage(messages["docInfo.md"], url), {
						sanitize: true
					});
					var docInfo = new SettingsInfo({
						content: markup
					});
					var documentationSubsection = new Subsection({
						sectionName: messages["Documentation"],
						additionalCssClass: 'accessibility-setting-header',
						parentNode: settingsContentElement,
						children: [docInfo]
					});
					documentationSubsection.show();
				});
			},
			
			_shortcutContent: function() {
				var markup = marked(messages[util.isMac ? "shortcutInfoMac.md" : "shortcutInfoWin.md"], {
					sanitize: true
				});
				return markup;
			},

			_themeContent: function() {
				var markup = marked(messages["themeInfo.md"], {
					sanitize: true
				});
				return markup;
			},

			_srContent: function() {
				var markup = marked(messages["srInfo.md"], {
					sanitize: true
				});
				return markup;
			},

			_progress: function(msg, severity) {
				if (this.registry) {
					var messageService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
					messageService.setProgressResult( {Message:msg, Severity:severity} );
				}
			},
			
			setPreferences: function() {
				var disableCodeFolding = this.disableCodeFoldingCheckbox.isChecked();
				var hideCodeMap = this.hideCodeMapCheckbox.isChecked();
				this.editorPreferences.setPrefs({"foldingRuler":!disableCodeFolding, "zoomRuler":!hideCodeMap}, function () {
					this._progress(messages["Editor preferences updated"], "Normal"); //$NON-NLS-0$
				}.bind(this));
			},

			show: function() {
				this.createElements();
				this.editorPreferences.getPrefs().then(function (a11yPrefs) {
					this.disableCodeFoldingCheckbox.setSelection(!a11yPrefs.foldingRuler);
					this.disableCodeFoldingCheckbox.show();
					this.hideCodeMapCheckbox.setSelection(!a11yPrefs.zoomRuler);
					this.hideCodeMapCheckbox.show();
				}.bind(this));
			},
			destroy: function() {
				if (this.node) {
					this.node = null;
				}
			}
	});
	return AccessibilitySettings;
});
