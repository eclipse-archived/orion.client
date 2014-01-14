/*global parent window document define orion setTimeout*/
	
var uiTestFunc = null;

define(["orion/bootstrap", "orion/xhr", "orion/Deferred", 'cloudoe/cf/cFService', 'orion/PageUtil'], 
		function(mBootstrap, xhr, Deferred, mCFService, PageUtil) {

	mBootstrap.startup().then(
		function(core) {
			
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var cFService = new mCFService.CFService(serviceRegistry);
			var params = PageUtil.matchResourceParameters();
			var location = decodeURIComponent(params.location);
			
			// initial message
			document.getElementById('title').appendChild(document.createTextNode("Deploy Application")); //$NON-NLS-1$//$NON-NLS-0$
			var msgLabel = document.getElementById('messageLabel'); //$NON-NLS-0$
			var msgNode = msgLabel.appendChild(document.createTextNode("Initializing...")); //$NON-NLS-0$
			var warningNode;
			var progressBar = document.getElementById('progressBar');
			var settingsMsg = document.getElementById('settingsMsg'); //$NON-NLS-0$
			
			// cancel button
			var closeFrame = function() {
				 window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
					 source: "org.eclipse.orion.client.cf.deploy", cancelled: true}), "*");
			}
			
			document.getElementById('closeDialog').onclick = closeFrame;
			document.getElementById('cancelbutton').onclick = closeFrame;
			document.getElementById('okbutton').onclick = closeFrame;
			 
			
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
		    
		    

		    
		    
		    // do push, prompt as required
//			var configAdmin = serviceRegistry.getService('orion.cm.configadmin'); //$NON-NLS-0$
//			configAdmin.getConfiguration("app.settings").then(function(config) {
//				 // get target and app, then do push and open application
//				 getTarget(cFService, config, preferences).then(function(result1){
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
//				 },function(error){
//					 postError(error);
//				 });
//			});
			 
	});
	
//	// make sure target is set and it matches the url in settings
//	function getTarget(cFService, config, preferences) {
//		var deferred = new Deferred();
//		
//		preferences.getPreferences('/settingsCF').then(
//			function(settings){
//				var props = config.getProperties() || {};
//				var cfgTarget = props["app.target"] || ""; //$NON-NLS-0$
//				var cfgValid = (typeof cfgTarget === 'string' && cfgTarget.length > 0);
//
//				var defaultTarget = settings.get("targetUrl");
//				if (!cfgValid){
//					props["app.target"] = defaultTarget;
//					props["app.manage.url"] = settings.get("manageUrl");
//					config.update(props);
//				}
//				
//				cFService.getTarget().then(function(result) {
//					var cFTarget = result.target;
//					var cFValid = (typeof cFTarget === 'string' && cFTarget.length > 0);
//					// if cf target is invalid, prompt for target
//					if (!cFValid) {
//						if (defaultTarget) {
//							cFService.setTarget(defaultTarget).then(function (result) {
//								deferred.resolve(result);					
//							}, function(error) {
//								deferred.reject(error);					
//							});
//						} else {
//							promptTarget(cFService, config, false).then(function(result) {
//								deferred.resolve(result);				
//							}, function (error) {
//								deferred.reject(error);
//							});
//						}
//					} else {
//						// if cf target doesn't match settings, change settings
//						if (cFValid && cFTarget !== cfgTarget) {
//							props["app.target"] = cFTarget;
//							config.update(props);
//						}
//						deferred.resolve({target:cFTarget});
//					}
//				}, function (error) {			
//					promptTarget(cFService, config, true).then(function(result) {
//						deferred.resolve(result);				
//					}, function (error) {
//						deferred.reject(error);
//					});
//				});	
//			}
//		)
//
//		return deferred;
//	}
//	
//	// make sure there's a cloud connection
//	function getApps(cFService, config, target) {
//		var deferred = new Deferred();
//		cFService.getApplications().then(function(result) {
//			deferred.resolve(result);
//		}, function (e) {
//			// login error
//			var error = JSON.parse(e.response);
//			if (error.HttpCode === 403 || error.HttpCode === 401) {
//				promptLogin(cFService, target).then(function(result) {
//					deferred.resolve(result);				
//				}, function (error) {
//					deferred.reject(error);
//				});
//			} else {
//				promptTarget(cFService, config, true).then(function(result) {
//					promptLogin(cFService, result).then(function(result) {
//						deferred.resolve(result);				
//					}, function (error) {
//						deferred.reject(error);
//					});
//				}, function (error) {
//					deferred.reject(error);
//				});
//			}
//		});
//		return deferred;
//	}
//	
//	function promptTarget(cFService, config, error) {
//		var deferred = new Deferred();
//		var msgLabel = document.getElementById('messageLabel'); //$NON-NLS-0$
//		var progressBar = document.getElementById('progressBar');
//		progressBar.hidden=msgLabel.hidden=true;
//		
//		var targetRow = document.getElementById('targetRow');
//		var manageRow = document.getElementById('manageRow');
//		var buttonRow = document.getElementById('buttonRow');
//		targetRow.hidden = manageRow.hidden = buttonRow.hidden = false;
//		var setupMsg = document.getElementById('setupMsg');
//		var errorMsg = document.getElementById('errorMsg');
//		setupMsg.hidden=error;
//		errorMsg.hidden=!error;
//		
//		var targetURL = document.getElementById("target"); 
//		var manageURL =  document.getElementById("manage");
//		var props = config.getProperties();
//		targetURL.value = props && props["app.target"] ? props["app.target"] : "";
//		manageURL.value = props && props["app.manage.url"] ? props["app.manage.url"] : "";
//		
//		document.getElementById('target').focus();
//		document.getElementById('submitbutton').onclick = function(e) {
//			var target = targetURL.value;
//			var manage = manageURL.value;
//			if (props) {
//				props["app.target"] = target;
//				props["app.manage.url"] = manage;
//				config.update(props);
//			}
//			errorMsg.hidden = setupMsg.hidden= targetRow.hidden = manageRow.hidden = buttonRow.hidden =true;
//			progressBar.hidden=msgLabel.hidden=false;
//			cFService.setTarget(target).then(function (result) {
//				deferred.resolve(result);					
//			}, function(error) {
//				deferred.reject(error);					
//			});
//		}
//		return deferred;
//	}
//	
//	function promptLogin(cFService, target) {
//		var deferred = new Deferred();
//		var msgLabel = document.getElementById('messageLabel'); //$NON-NLS-0$
//		var progressBar = document.getElementById('progressBar');
//		progressBar.hidden=msgLabel.hidden=true;
//		var loginMsg = document.getElementById('loginMsg');
//		var userIdRow = document.getElementById('userIdRow');
//		var passwordRow = document.getElementById('passwordRow');
//		var buttonRow = document.getElementById('buttonRow');
//		loginMsg.hidden=userIdRow.hidden = passwordRow.hidden = buttonRow.hidden =false;
//		var authenticationLabel = document.getElementById('authenticationLabel');
//		authenticationLabel.innerHTML = 'Authentication required' +	(target? ' for '+target.target:"") + '.';	
//		document.getElementById('userId').focus();
//		document.getElementById('submitbutton').onclick = function() {
//			var user = document.getElementById("userId").value;
//			var password = document.getElementById("password").value;
//			loginMsg.hidden=userIdRow.hidden = passwordRow.hidden = buttonRow.hidden =true;
//			progressBar.hidden=msgLabel.hidden=false;
//			cFService.login(user, password).then(function (result) {
//				deferred.resolve(result);					
//			}, function(error) {
//				deferred.reject(error);					
//			});
//		}		
//		return deferred;
//	}
//	
//	function postMsg(msg) {
//		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
//			 source: "com.ibm.cloudoe.editor.run", 
//			 status: {Message: msg}}), "*");
//	}
//	
//	function postError(error) {
//		var msg = "Unknown error";
//		if (typeof error === 'object') {
//			if (error.response) {
//				try {
//					error = JSON.parse(error.response);
//				} catch (err) {
//				}
//			}
//				
//			if (error.DetailedMessage) {
//				msg = error.DetailedMessage; 
//			} else if (error.Message) {
//				msg = error.Message;
//			} else if (error.error) {
//				msg = error.error;
//			}
//
//			if (error.HttpCode) {
//				msg += " (" + error.HttpCode + ")";
//			}
//		}
//		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
//			 source: "com.ibm.cloudoe.editor.run", 
//			 status: {Message: msg, Severity: "Error"}}), "*");
//	}

});