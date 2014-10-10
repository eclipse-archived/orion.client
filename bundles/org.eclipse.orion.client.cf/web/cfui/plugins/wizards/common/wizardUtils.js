/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define(['orion/Deferred', 'cfui/cfUtil',  'orion/urlUtils', 'orion/webui/littlelib'], 
		function(Deferred, mCfUtil, URLUtil, lib){
	
	/**
	 * Common wizard utilities.
	 */
	var WizardUtils = {
			
		/**
		 * Posts the given status message.
		 */
		defaultPostMsg : function(status){
			window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
				 source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
				 status: status}), "*");
		},
		
		/**
		 * Builds the post error.
		 */
		buildDefaultPostError : function(defaultDecorateError){
			return function(error, target){
				error = defaultDecorateError(error, target);
				window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
					source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
					status: error}), "*");
			};
		},
		
		/**
		 *  Posts to close the plugin frame.
		 */
		defaultCloseFrame : function(){
			window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
				 source: "org.eclipse.orion.client.cf.deploy.uritemplate", cancelled: true}), "*");
		},
		
		/**
		 * Parses the given message creating a decorated UI.
		 */
		defaultParseMessage : function(msg){
			var chunks, msgNode;
			try {
				chunks = URLUtil.detectValidURL(msg);
			} catch (e) {
				/* contained a corrupt URL */
				chunks = [];
			}
			
			if (chunks.length) {
				msgNode = document.createDocumentFragment();
				URLUtil.processURLSegments(msgNode, chunks);
				
				/* all status links open in new window */
				Array.prototype.forEach.call(lib.$$("a", msgNode), function(link) { //$NON-NLS-0$
					link.target = "_blank"; //$NON-NLS-0$
				});
			}
			
			return msgNode || document.createTextNode(msg);
		},
		
		/**
		 * Displays the message bar panel with the given message.
		 */
		defaultShowMessage : function(message){
			document.getElementById('messageLabel').classList.remove("errorMessage");
			document.getElementById('messageContainer').classList.remove("errorMessage");
			lib.empty(document.getElementById('messageText'));
			
			document.getElementById('messageText').style.width = "100%";
			document.getElementById('messageText').appendChild(WizardUtils.defaultParseMessage(message));
			
			document.getElementById('messageButton').className = "";
			document.getElementById('messageContainer').classList.add("showing");
		},
		
		/**
		 * Hides the message bar panel.
		 */
		defaultHideMessage : function(){
			document.getElementById('messageLabel').classList.remove("errorMessage");
			document.getElementById('messageContainer').classList.remove("errorMessage");
			lib.empty(document.getElementById('messageText'));
			document.getElementById('messageContainer').classList.remove("showing");
		},
		
		/**
		 * Displays the message bar panel with the given error message.
		 */
		defaultShowError : function(message){
			document.getElementById('messageLabel').classList.add("errorMessage");
			document.getElementById('messageContainer').classList.add("errorMessage");
			lib.empty(document.getElementById('messageText'));
			
			document.getElementById('messageText').style.width = "calc(100% - 10px)";
			document.getElementById('messageText').appendChild(WizardUtils.defaultParseMessage(message.Message || message));
			lib.empty(document.getElementById('messageButton'));
			
			document.getElementById('messageButton').className = "dismissButton core-sprite-close imageSprite";
			document.getElementById('messageButton').onclick = WizardUtils.defaultHideMessage;
			document.getElementById('messageContainer').classList.add("showing");
		},
		
		/**
		 * Retrieves the default target by passing the given resource file
		 * meta-data to the cfUtil.getDefaultTarget method.
		 */
		getDefaultTarget : function(fileClient, resource){
			var clientDeferred = new Deferred();
			fileClient.read(resource.ContentLocation, true).then(function(result){
					mCfUtil.getDefaultTarget(result).then(
						clientDeferred.resolve,
						clientDeferred.reject
					);
				}, clientDeferred.reject);
			
			return clientDeferred;
		},
		
		/**
		 * Makes the current iframe draggable.
		 */
		makeDraggable : function(frameHolder){
			var iframe = window.frameElement;
		    setTimeout(function(){
		    	
				var titleBar = document.getElementById('titleBar');
				titleBar.addEventListener('mousedown', function(e) {
					frameHolder._dragging = true;
					if (titleBar.setCapture)
						titleBar.setCapture();
					
					frameHolder.start = {
						screenX: e.screenX,
						screenY: e.screenY
					};
				});
				
				titleBar.addEventListener('mousemove', function(e) {
					if (frameHolder._dragging) {
						var dx = e.screenX - frameHolder.start.screenX;
						var dy = e.screenY - frameHolder.start.screenY;
						
						frameHolder.start.screenX = e.screenX;
						frameHolder.start.screenY = e.screenY;
						
						var x = parseInt(iframe.style.left) + dx;
						var y = parseInt(iframe.style.top) + dy;
						
						iframe.style.left = x+"px";
						iframe.style.top = y+"px";
					}
				});
				
				titleBar.addEventListener('mouseup', function(e) {
					frameHolder._dragging = false;
					if (titleBar.releaseCapture) {
						titleBar.releaseCapture();
					}
				});
		    });
		}
	};
	
	return WizardUtils;
});