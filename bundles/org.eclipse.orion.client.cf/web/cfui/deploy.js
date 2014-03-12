/*global parent window document define orion setTimeout*/
	
var uiTestFunc = null;

define(["orion/bootstrap", "orion/xhr", 'orion/webui/littlelib', 'orion/Deferred', 'orion/cfui/cFClient', 'orion/PageUtil', 'orion/selection', 'orion/explorers/explorer'], 
		function(mBootstrap, xhr, lib, Deferred, CFClient, PageUtil, mSelection, mExplorer) {

	mBootstrap.startup().then(
		function(core) {
			
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var cFService = new CFClient.CFService(serviceRegistry);
			var params = PageUtil.matchResourceParameters();
			var location = decodeURIComponent(params.location);
			
			// initial message
			document.getElementById('title').appendChild(document.createTextNode("Choose Space To Deploy")); //$NON-NLS-1$//$NON-NLS-0$
			var msgLabel = document.getElementById('messageLabel'); //$NON-NLS-0$
			var msgNode = msgLabel.appendChild(document.createTextNode("Getting spaces...")); //$NON-NLS-0$
			var warningNode;
			var progressBar = document.getElementById('progressBar');
			var settingsMsg = document.getElementById('settingsMsg'); //$NON-NLS-0$
			var orgsTree = document.getElementById('orgsTree'); //$NON-NLS-0$
			var okButton = document.getElementById('okbutton'); //$NON-NLS-0$
			
			// cancel button
			var closeFrame = function() {
				 window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
					 source: "org.eclipse.orion.client.cf.deploy", cancelled: true}), "*");
			};
			
			var validate = function() {
				this.selection.getSelection(function(selection) {
					if(selection===null || selection.length===0){
						okButton.classList.add(self.DISABLED);
						okButton.disabled = true;
						return;
					}
					okButton.classList.remove(self.DISABLED);
					okButton.disabled = false;
				});
			};

			document.getElementById('okbutton').onclick = closeFrame;
			document.getElementById('closeDialog').onclick = closeFrame;
			 
			// allow frame to be dragged by title bar
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
				titleBar.addEventListener('mouseup', function(e) {
					that._dragging=false;
					if (titleBar.releaseCapture) {
						titleBar.releaseCapture();
					}
				});
		    });

		    //
			var configAdmin = serviceRegistry.getService('orion.cm.configadmin'); //$NON-NLS-0$
			configAdmin.getConfiguration("app.settings").then(
				function(config) {
					 // get target and app, then do push and open application
					getTarget(cFService, config, preferences).then(
						function(result1){
							cFService.getOrgs(result1).then(
								function(result2){
									msgLabel.removeChild(msgNode);
									
									var spaces = [];
									result2.Orgs.forEach(function(org){
										if (org.Spaces)
											org.Spaces.forEach(function(space){
												space.Org = org;
												spaces.push(space);
											});
									});
									
									this.selection = new mSelection.Selection(serviceRegistry, "orion.Spaces.selection"); //$NON-NLS-0$
									this.selection.addEventListener("selectionChanged", validate);

									this.explorer = new mExplorer.Explorer(
										serviceRegistry,
										this.selection,
										new SpacesRenderer({checkbox: false, singleSelection: true, treeTableClass: "Spaces"}));
									var model = new mExplorer.ExplorerFlatModel(null, null, spaces);
									model.getId = function(item){
										return item.Name + item.Org.Name;
									};
									this.explorer.createTree(orgsTree.id, model, {});
								}
							);
							
//					 getApps(cFService, config, result1).then(function(result2){
//						 
//						msgLabel.removeChild(msgNode);
//						var props = config.getProperties();
//						var targetUrl = props["app.target"];
//						var manageUrl = props["app.manage.url"];
//						var msg = "Pushing application into " + targetUrl + ".";
//						msgNode = msgLabel.appendChild(document.createTextNode(msg));
//						var warningLabel = document.getElementById('warningLabel'); //$NON-NLS-0$
//						var msgWarning = "Note: This can take several minutes.";
//						warningNode = warningLabel.appendChild(document.createTextNode(msgWarning));
//						settingsMsg.hidden = false;
//						 
//						cFService.pushApplication(null, location).then(function(result) {
//							 // open app
//							if (result.applications && result.applications.length>0 && result.applications[0].uris.length>0) {
//								var appUrl = "http://" + result.applications[0].uris[0];
//								var name = result.applications[0].name;
//								var message = "Click [here](" + appUrl + ") to view '" + name + "'.";
//								
//								if (manageUrl){
//									var appManageUrl = manageUrl + "?appName=" + name;
//									message += " Click [here](" + appManageUrl + ") to manage '" + name + "'.";	
//								}
//		
//								postMsg(message);
//							} else {
//								postMsg("This application has no url");
//							}
//						 },function(error){
//							 postError(error);
//						 });
//					 },function(error){
//						 postError(error);
//					 });
						}, function(error){
							postError(error);
						}
					);
				}
			);
		}
	);
	
	// make sure target is set and it matches the url in settings
	function getTarget(cFService, config, preferences) {
		var deferred = new Deferred();
		
		preferences.getPreferences('/settingsCF').then(
			function(settings){
				var props = config.getProperties() || {};
				var cfgTarget = props["app.target"] || ""; //$NON-NLS-0$
				var cfgValid = (typeof cfgTarget === 'string' && cfgTarget.length > 0);

				var defaultTarget = settings.get("targetUrl");
				if (!cfgValid){
					props["app.target"] = defaultTarget;
					props["app.manage.url"] = settings.get("manageUrl");
					config.update(props);
				}
				
				cFService.getTarget().then(function(result) {
					var cFTarget = result.target;
					var cFValid = (typeof cFTarget === 'string' && cFTarget.length > 0);
					// if cf target is invalid, prompt for target
					if (!cFValid) {
						if (defaultTarget) {
							cFService.setTarget(defaultTarget).then(function (result) {
								deferred.resolve(result);					
							}, function(error) {
								deferred.reject(error);					
							});
						} else {
							promptTarget(cFService, config, false).then(function(result) {
								deferred.resolve(result);				
							}, function (error) {
								deferred.reject(error);
							});
						}
					} else {
						// if cf target doesn't match settings, change settings
						if (cFValid && cFTarget !== cfgTarget) {
							props["app.target"] = cFTarget;
							config.update(props);
						}
						deferred.resolve({target:cFTarget});
					}
				}, function (error) {			
					promptTarget(cFService, config, true).then(function(result) {
						deferred.resolve(result);				
					}, function (error) {
						deferred.reject(error);
					});
				});	
			}
		);

		return deferred;
	}

	function postMsg(msg) {
		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
			 source: "com.ibm.cloudoe.editor.run", 
			 status: {Message: msg}}), "*");
	}
	
	function postError(error) {
		var msg = "Unknown error";
		if (typeof error === 'object') {
			if (error.response) {
				try {
					error = JSON.parse(error.response);
				} catch (err) {
				}
			}
				
			if (error.DetailedMessage) {
				msg = error.DetailedMessage; 
			} else if (error.Message) {
				msg = error.Message;
			} else if (error.error) {
				msg = error.error;
			}

			if (error.HttpCode) {
				msg += " (" + error.HttpCode + ")";
			}
		}
		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
			 source: "com.ibm.cloudoe.editor.run", 
			 status: {Message: msg, Severity: "Error"}}), "*");
	}
	
	function SpacesRenderer (options) {
		this._init(options);
	}
	SpacesRenderer.prototype = new mExplorer.SelectionRenderer(); 
	SpacesRenderer.prototype.constructor = SpacesRenderer;
	SpacesRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	SpacesRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		if(col_no===0){
			var col = document.createElement("td"); //$NON-NLS-0$
			var span = document.createElement("span"); //$NON-NLS-0$
			span.id = tableRow.id+"navSpan"; //$NON-NLS-0$
			col.appendChild(span);
			span.className = "mainNavColumn singleNavColumn"; //$NON-NLS-0$
			span.appendChild(document.createTextNode(item.Name + " (" + item.Org.Name + ")"));
			return col;
		}
	};

});