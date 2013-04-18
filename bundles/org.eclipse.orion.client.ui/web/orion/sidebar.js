/*global console define*/
define(['orion/Deferred', 'orion/outliner', 'orion/explorers/explorer-table', 'orion/i18nUtil', 'orion/webui/littlelib'],
		function(Deferred, mOutliner, mExplorer, i18nUtil, lib) {
	/**
	 * @name orion.sidebar.Sidebar
	 * @class Sidebar that appears alongside an {@link orion.editor.Editor} in the Orion IDE.
	 * @param {Object} params
	 * @param {orion.commandRegistry.CommandRegistry} params.commandRegistry
	 * @param {orion.core.ContentTypeService} params.contentTypeRegistry
	 * @param {orion.editor.Editor} params.editor
	 * @param {orion.fileClient.FileClient} params.fileClient
	 * @param {orion.editor.InputManager} params.inputManager
	 * @param {orion.outliner.OutlineService} params.outlineService
	 * @param {Element|String} params.parentNode
	 * @param {orion.selection.Selection} params.selection
	 * @param {orion.serviceregistry.ServiceRegistry} params.serviceRegistry
	 */
	function Sidebar(params) {
		var commandRegistry = params.commandRegistry;
		var contentTypeRegistry = this.contentTypeRegistry = params.contentTypeRegistry;
		var editor = this.editor = params.editor;
		var fileClient = params.fileClient;
		var inputManager = this.inputManager = params.inputManager;
		var outlineService = this.outlineService = params.outlineService;
		this.parentNode = lib.node(params.parentNode);
		var selection = params.selection;
		var serviceRegistry = this.serviceRegistry = params.serviceRegistry;

		this.filteredProviders = [];
		this.outliner = null;

		// Create child gadgets -- mini nav
		this.miniNavExplorer = new mExplorer.FileExplorer({
			selection: this.drivesSelection,
			serviceRegistry: serviceRegistry,
			fileClient: fileClient,
			parentId: "DriveContent", //$NON-NLS-0$
			rendererFactory: function(explorer) { //$NON-NLS-0$
				var renderer = new MiniNavRenderer({
					checkbox: false,
					cachePrefix: "Drives"}, explorer, commandRegistry, contentTypeRegistry); //$NON-NLS-0$
				return renderer;
		}}); //$NON-NLS-0$

		// Outliner
		try {
			this.outliner = new mOutliner.Outliner({
				parent: this.parentNode,
				serviceRegistry: serviceRegistry,
				outlineService: outlineService,
				commandService: commandRegistry,
				selectionService: selection,
				onSelectedProvider: function(/**ServiceReference*/ outlineProvider) { //$NON-NLS-0$
					outlineService.setProvider(outlineProvider);
					outlineService.emitOutline(editor.getText(), editor.getTitle());
				}
			});
			if (this.filteredProviders) {
				this.outliner.setOutlineProviders(this.filteredProviders);
			}
		} catch (e) {
			if (typeof console !== "undefined" && console) { console.log(e && e.stack); }
		}

		editor.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
			outlineService.emitOutline(editor.getText(), editor.getTitle());
		});
		var _self = this;
		inputManager.addEventListener("ContentTypeChanged", function(event) {
			_self.setContentType(event.contentType, event.location);
		});
	}
	/**
	 * Called when the inputManager's contentType has changed.
	 * @param {String} fileContentType
	 * @param {String} title TODO this is deprecated, should be removed along with "pattern" property of outliners.
	 */
	Sidebar.prototype.setContentType = function(fileContentType, title) {
		var outlineProviders = this.serviceRegistry.getServiceReferences("orion.edit.outliner"); //$NON-NLS-0$
		var filteredProviders = this.filteredProviders = [];
		var _self = this;
		var i;
		for (i=0; i < outlineProviders.length; i++) {
			var serviceReference = outlineProviders[i],
			    contentTypeIds = serviceReference.getProperty("contentType"), //$NON-NLS-0$
			    pattern = serviceReference.getProperty("pattern"); // for backwards compatibility //$NON-NLS-0$
			var isSupported = false;
			if (contentTypeIds) {
				isSupported = contentTypeIds.some(function(contentTypeId) {
					return _self.contentTypeRegistry.isExtensionOf(fileContentType, contentTypeId);
				});
			} else if (pattern && new RegExp(pattern).test(title)) {
				isSupported = true;
			}
			if (isSupported) {
				filteredProviders.push(serviceReference);
			}
		}
		var deferreds = []; 
		for(i=0; i<filteredProviders.length; i++){
			if(filteredProviders[i].getProperty("nameKey") && filteredProviders[i].getProperty("nls")){ //$NON-NLS-1$ //$NON-NLS-0$
				var deferred = new Deferred();
				deferreds.push(deferred);
				var provider = filteredProviders[i];
				var getDisplayName = function(commandMessages) { //$NON-NLS-0$
					this.provider.displayName = commandMessages[provider.getProperty("nameKey")]; //$NON-NLS-0$
					this.deferred.resolve();
				};
				i18nUtil.getMessageBundle(provider.getProperty("nls")).then(getDisplayName.bind({provider: provider, deferred: deferred}), deferred.reject); //$NON-NLS-0$
			} else {
				filteredProviders[i].displayName = filteredProviders[i].getProperty("name"); //$NON-NLS-0$
			}
		}
		if (deferreds.length===0) {
			this.outlineService.setOutlineProviders(filteredProviders);
			if (this.outliner) {
				this.outliner.setOutlineProviders(filteredProviders);
			}
		} else {
			Deferred.all(deferreds, function(error) { return error; }).then(function(){
				_self.outlineService.setOutlineProviders(filteredProviders);
				if (_self.outliner) {
					_self.outliner.setOutlineProviders(filteredProviders);
				}
			});
		}
	};
	return Sidebar;
});