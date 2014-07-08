/*eslint-env browser, amd*/
/*global URL*/
define([
	"cfui/cfPrefs",
	"orion/bootstrap",
	'orion/webui/littlelib',
	'orion/Deferred',
	'orion/cfui/cFClient',
	'orion/PageUtil',
	'orion/selection',
	'orion/URITemplate',
	'orion/PageLinks',
	'orion/preferences',
	'orion/URL-shim', // no exports
], function(PreferencesProvider, mBootstrap, lib, Deferred, CFClient, PageUtil, mSelection, URITemplate, PageLinks, Preferences) {
	mBootstrap.startup().then(function(core) {
		var pageParams = PageUtil.matchResourceParameters();
		var deployResource = decodeURIComponent(pageParams.resource);
		var deployResourceJSON = JSON.parse(deployResource);
		var showDev = !!(deployResourceJSON.ShowDevDeploy);
		
		var serviceRegistry = core.serviceRegistry;
		var cFService = new CFClient.CFService(serviceRegistry);
		
		// initial message
		document.getElementById('title').appendChild(document.createTextNode("Configure Application Deployment")); //$NON-NLS-1$//$NON-NLS-0$
		var msgContainer = document.getElementById('messageContainer'); //$NON-NLS-0$
		var msgLabel = document.getElementById('messageLabel'); //$NON-NLS-0$

		var deployForm = document.getElementById('deployForm'); //$NON-NLS-0$
		var okbutton = document.getElementById('okbutton'); //$NON-NLS-0$
		var orgsDropdown;
		var spacesDropdown;
		var devCheckbox = document.getElementById('devCheckbox'), //$NON-NLS-0$
		    devPassword = document.getElementById('devPassword'), //$NON-NLS-0$
		    devUrlPrefix = document.getElementById('devUrlPrefix'); //$NON-NLS-0$
		
		var selection,
		    targets;
		
		function showMessage(message){
			msgLabel.appendChild(document.createTextNode(message));
			msgContainer.classList.add("showing"); //$NON-NLS-0$
		}
		
		function hideMessage(){
			lib.empty(msgLabel);
			msgContainer.classList.remove("showing"); //$NON-NLS-0$
		}
		
		function setValid(valid){
			if(valid){
				okbutton.classList.remove("disabled");
			} else {
				okbutton.classList.add("disabled");
			}
			okbutton.disabled = !valid;
		}
		
		function validate() {
			var isValid = deployForm.checkValidity();
			setValid(isValid);
			return isValid;
		}

		function selectionValid() {
			if(!selection){
				return false;
			}
			return selection && selection.getSelection() !== null;
		}

		// allow frame to be dragged by title bar
		function addDragHandler() {
			var that=this;
			var iframe = window.frameElement;
		    setTimeout(function() {
				var titleBar = document.getElementById('titleBar');
				titleBar.addEventListener('mousedown', function(e) {
					that._dragging=true;
					if (titleBar.setCapture) {
						titleBar.setCapture();
					}
					that.start = {screenX: e.screenX,screenY: e.screenY};
				});
				titleBar.addEventListener('mousemove', function(e) {
					if (that._dragging) {
						var dx = e.screenX - that.start.screenX;
						var dy = e.screenY - that.start.screenY;
						that.start.screenX = e.screenX;
						that.start.screenY = e.screenY;
						var x = parseInt(iframe.style.left) + dx;
						var y = parseInt(iframe.style.top) + dy;
						iframe.style.left = x+"px";
						iframe.style.top = y+"px";
					}
				});
				titleBar.addEventListener('mouseup', function(/*e*/) {
					that._dragging=false;
					if (titleBar.releaseCapture) {
						titleBar.releaseCapture();
					}
				});
		    });
		}

		function renderOrgs(orgs) {
			document.getElementById("orgsLabel").appendChild(document.createTextNode("Organization:"));

			orgsDropdown = document.createElement("select");
			orgs.Orgs.forEach(function(org){
				var option = document.createElement("option");
				option.appendChild(document.createTextNode(org.Name));
				option.org = org;
				orgsDropdown.appendChild(option);
			});

			orgsDropdown.onchange = function(event){
				var selectedOrg = event.target.value;
				loadTargets(selectedOrg);
			};

			document.getElementById("orgs").appendChild(orgsDropdown);
		}
		
		function renderSpaces() {
			selection = new mSelection.Selection(serviceRegistry, "orion.Spaces.selection"); //$NON-NLS-0$
			selection.addEventListener("selectionChanged", function() {
				if (selectionValid()) {
					orgsDropdown.setCustomValidity("");
					spacesDropdown.setCustomValidity("");
				} else {
					orgsDropdown.setCustomValidity("Select an organization.");
					spacesDropdown.setCustomValidity("Select a space.");
				}
				validate();
			});
			document.getElementById("spacesLabel").appendChild(document.createTextNode("Space:"));
			spacesDropdown = document.createElement("select");
			document.getElementById("spaces").appendChild(spacesDropdown);
			
			spacesDropdown.onchange = setSelection;
		}

		function renderDevSection() {
			if (!showDev) {
				document.getElementById("devSection").classList.add("hidden");
				return;
			}
			devCheckbox.addEventListener("change", function() {
				var disabled = !(devCheckbox.checked);
				devPassword.disabled = disabled;
				devPassword.required = !disabled;
				devUrlPrefix.disabled = disabled;
				validate();
				if (!disabled && !(devPassword.length)) {
					devPassword.focus();
				}
			});
			devPassword.addEventListener("input", function() {
				if (devPassword.value.length)
					devPassword.setCustomValidity("");
				else
					devPassword.setCustomValidity("Set a password.");
				validate();
			});
		}

		function toTargets(target, orgs) {
			var cloudManageUrl = target.ManageUrl;
			var targets = {};
			orgs.Orgs.forEach(function(org){
				targets[org.Name] = [];
				if (org.Spaces)
					org.Spaces.forEach(function(space){
						var newTarget = {};
						newTarget.Url = target.Url;
						if (cloudManageUrl)
							newTarget.ManageUrl = cloudManageUrl;
						newTarget.Org = org.Name;
						newTarget.Space = space.Name;
						targets[org.Name].push(newTarget);
					});
			});
			return targets;
		}

		function renderManifest() {
			document.getElementById("manifestLabel").appendChild(document.createTextNode("Using manifest:"));
			var manifestFolder = deployResourceJSON.AppPath || "";
			manifestFolder = manifestFolder.substring(0, manifestFolder.lastIndexOf("/")+1);
			document.getElementById("manifest").appendChild(document.createTextNode("/" + manifestFolder + "manifest.yml"));
		}

		function loadTargets(org){
			var targetsToDisplay = targets[org];
			lib.empty(spacesDropdown);
			targetsToDisplay.forEach(function(target){
				var option = document.createElement("option");
				option.appendChild(document.createTextNode(target.Space));
				option.target = target;
				spacesDropdown.appendChild(option);
			});
			setSelection();
			validate();
			deployForm.classList.remove("hidden");
		}

		function setSelection(){
			var selectedSpace = spacesDropdown.value;
			var orgTargets = targets[orgsDropdown.value];
			var foundOrgTarget;
			orgTargets.some(function(orgTarget) {
				if (orgTarget.Space === selectedSpace) {
					foundOrgTarget = orgTarget;
					return true; // break
				}
			});
			selection.setSelections(foundOrgTarget);
		}

		// cancel button
		function closeFrame() {
			 window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
				 source: "org.eclipse.orion.client.cf.deploy.uritemplate", cancelled: true}), "*");
		}

		function doAction() {
			showMessage("Deploying...");
			setValid(false);
			if (!selectionValid()) {
				closeFrame();
				return;
			}
			var selected = selection.getSelection();
			if(orgsDropdown){
				orgsDropdown.disabled = true;
			}
			if(spacesDropdown){
				spacesDropdown.disabled = true;
			}
			if (devCheckbox.checked) {
				selected.DebugPassword = devPassword.value;
				selected.DebugUrlPrefix = devUrlPrefix.value;
			}

			var appPath = decodeURIComponent(deployResourceJSON.ContentLocation + deployResourceJSON.AppPath);
			cFService.pushApp(selected, null, appPath).then(function(result){
				var appName = result.App.name || result.App.entity.name;
				var host = (result.Route !== undefined ? (result.Route.host || result.Route.entity.host) : undefined);
				var launchConfName = appName + " on " + result.Target.Space.Name + " / " + result.Target.Org.Name;
				postMsg({
					CheckState: true,
					ToSave: {
						ConfigurationName: launchConfName,
						Parameters: {
							Target: {
								Url: result.Target.Url,
								Org: result.Target.Org.Name,
								Space: result.Target.Space.Name
							},
							Name: appName,
							Timeout: (result.Timeout !== undefined) ? result.Timeout : undefined,
							DebugPassword: selected.DebugPassword,
							DebugUrlPrefix: selected.DebugUrlPrefix,
						},
						Url: (result.Route !== undefined) ? "http://" + host + "." + result.Domain : undefined,
						UrlTitle: (result.Route !== undefined) ? appName : undefined,
						Type: "Cloud Foundry",
						ManageUrl: result.ManageUrl,
						Path: deployResourceJSON.AppPath
					}
				});
			}, postError);
		}

		function postError(error) {
			if (error.HttpCode === 404){
				error = {
					State: "NOT_DEPLOYED",
					Message: error.Message
				};
			} else if (error.JsonData && error.JsonData.error_code) {
				var err = error.JsonData, code = err.error_code;
				if (code === "CF-InvalidAuthToken" || code === "CF-NotAuthenticated"){
					error.Retry = {
						parameters: [{id: "user", type: "text", name: "User:"}, {id: "password", type: "password", name: "Password:"}]
					};
				} else if (code === "CF-TargetNotSet"){
					var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
					error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
					error.Severity = "Warning";
				}
			}
			
			window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
				 source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
				 status: error}), "*");
		}

		okbutton.addEventListener('click', doAction); //$NON-NLS-1$ //$NON-NLS-0$
		document.getElementById('closeDialog').addEventListener('click', closeFrame); //$NON-NLS-1$ //$NON-NLS-0$
		document.getElementById('cancelButton').addEventListener('click', closeFrame); //$NON-NLS-1$ //$NON-NLS-0$
		document.getElementsByTagName("body")[0].addEventListener("keyup", function(e) { //$NON-NLS-1$ //$NON-NLS-0$
			if (e.keyCode === lib.KEY.ESCAPE)
				closeFrame();
		});
		deployForm.addEventListener("keyup", function(e) { //$NON-NLS-0$
			if (e.keyCode === lib.KEY.ENTER) {
				if (validate()) {
					e.preventDefault();
					doAction();
				}
			}
		});
		addDragHandler();

		showMessage("Loading deployment settings...");
		validate();
		
		
		// register hacked pref service
		var prefLocation = new URL("../prefs/user", window.location.href).href;
		var service = new PreferencesProvider(prefLocation);
		serviceRegistry.registerService("orion.core.preference.provider", service, {});
		
		// This is code to ensure the first visit to orion works
		// we read settings and wait for the plugin registry to fully startup before continuing
		var preferences = new Preferences.PreferencesService(serviceRegistry);
		
		var configAdmin = serviceRegistry.getService('orion.cm.configadmin'); //$NON-NLS-0$
		configAdmin.getConfiguration("app.settings").then(function(config) {
			// get target and app, then do push and open application
			return getTarget(preferences).then(function(target){
				return cFService.getOrgs(target).then(function(orgs){
					hideMessage();
					targets = toTargets(target, orgs);
					renderOrgs(orgs, target);
					renderSpaces(targets);
					renderManifest();
					renderDevSection();

					loadTargets(orgsDropdown.value);
				});
			});
		}).then(null, postError);
	});
	
	/**
	 * make sure target is set and it matches the url in settings
	 * @returns Resolves with target, or rejects with "CF-TargetNotSet" if cloud is not set up.
	 */
	function getTarget(preferences) {
		return preferences.getPreferences('/cm/configurations').then(function(settings){
			var cloud = settings.get("org.eclipse.orion.client.cf.settings");
			if (cloud && cloud.targetUrl){
				var target = {};
				target.Url = cloud.targetUrl;
				if (cloud.manageUrl)
					target.ManageUrl = cloud.manageUrl;
				if (cloud.org)
					target.Org = cloud.org;
				if (cloud.space)
					target.Space = cloud.space;
				return target;
			} else {
				// Treat as "target not set"
				var err = new Error();
				err.JsonData = { error_code: "CF-TargetNotSet" };
				return new Deferred().reject(err);
			}
		});
	}

	function postMsg(status) {
		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
			 source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
			 status: status}), "*");
	}

});