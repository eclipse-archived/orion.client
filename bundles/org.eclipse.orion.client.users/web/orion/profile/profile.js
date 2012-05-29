/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit window eclipse:true*/

define(['i18n!profile/nls/messages', 'require', 'dojo', 'dijit', 'orion/commands', 'orion/globalCommands', 'orion/auth',
	        'dojo/parser', 'dojo/hash', 'dojo/date/locale', 'dijit/layout/ContentPane', 'dijit/form/TextBox', 'dijit/form/CheckBox', 'dijit/form/Form'], 
			function(messages, require, dojo, dijit, mCommands, mGlobalCommands, mAuth) {

	/**
	 * Used when a value should be displayed as Date but is returned as long.
	 * Value displayed in always read only.
	 */

	function DateLong(options){
		this._init(options);
	}
	DateLong.prototype = {
		_init: function(options){
			options.style = "display: none"; //$NON-NLS-0$
			options.readOnly = true;
			this.contentText = new dijit.form.TextBox(options);
			this.contentText.set('ecliplseCustomValue',true); //$NON-NLS-0$
			this.dateP = dojo.create("span", {innerHTML: "&nbsp;", className: "userprofile"}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.connect(this.contentText, "onChange", dojo.hitch(this, function(myDijit,p){ //$NON-NLS-0$
					if(myDijit.get('value')!==""){ //$NON-NLS-0$
						var value = parseInt(myDijit.get('value')); //$NON-NLS-0$
						p.innerHTML = dojo.date.locale.format(new Date(value), {formatLength: "short"}); //$NON-NLS-0$
					}
					if(p.innerHTML==="") {
						p.innerHTML="&nbsp"; //$NON-NLS-0$
					}
				}, this.contentText, this.dateP));
			this.get = dojo.hitch(this.contentText,this.contentText.get);
			this.set = dojo.hitch(this.contentText,this.contentText.set);
		},
		placeAt: function(node){
			this.contentText.placeAt(node);
			dojo.place(this.dateP, node);
		}
	};

	function Profile(options) {
		this._init(options);
	}
	
	Profile.prototype = {
		_init : function(options) {
	
			this.registry = options.registry;
			this.pluginRegistry = options.pluginRegistry;
			this.profilePlaceholder = options.profilePlaceholder;
			this.commandService = options.commandService;
			this.pageActionsPlaceholder = options.pageActionsPlaceholder;
			this.usersClient = options.usersClient;
			this.iframes = new Array();
			
			var userProfile = this;
			
			this.usersService = this.registry.getService("orion.core.user"); //$NON-NLS-0$
			
			if(this.usersService !== null){
				this.usersService.addEventListener("requiredPluginsChanged", function(pluginsList){ //$NON-NLS-0$
					dojo.hitch(userProfile, userProfile.drawPlugins(pluginsList.plugins));
				});
				this.usersService.addEventListener("userInfoChanged", function(jsonData){ //$NON-NLS-0$
					dojo.hitch(userProfile,	userProfile.populateData(jsonData));
				});
				this.usersService.addEventListener("userDeleted", function(jsonData){ //$NON-NLS-0$
					window.location.replace("/"); //$NON-NLS-0$
				});
				dojo.hitch(userProfile, function(){this.addInputListener();})();
			}
	
		},
		addInputListener: function(){			
			dojo.subscribe("/dojo/hashchange", this, function() { //$NON-NLS-0$
				this.setUserToDisplay(dojo.hash());
			});
			var uri = dojo.hash();
			if(uri && uri!=="") {
				this.setUserToDisplay(uri);
			}
			else{
						
				// TODO if no hash provided current user profile should be loaded - need a better way to find logged user URI
				//NOTE: require.toURL needs special logic here to handle "login"
				var loginUrl = require.toUrl("login._"); //$NON-NLS-0$
				loginUrl = loginUrl.substring(0,loginUrl.length-2);
				
				dojo.xhrPost({
					url : loginUrl, //$NON-NLS-0$
					headers : {
						"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
					},
					handleAs : "json", //$NON-NLS-0$
					timeout : 15000,
					load : function(jsonData, ioArgs) {
						dojo.hash(jsonData.Location);
					},
					error : function(response, ioArgs) {
						var currentXHR = this;
						mAuth.handleAuthenticationError(ioArgs.xhr, function(){
							dojo.xhrPost(currentXHR); // retry POST							
						});
					}
				});
			}
		},
		drawPlugins : function(pluginsList){
			
			var userProfile = this;
			
			if(this.profileForm){
				while(this.profileForm.get("domNode").lastChild){ //$NON-NLS-0$
					dojo.destroy(this.profileForm.get("domNode").lastChild); //$NON-NLS-0$
				}
				
				this.profileForm.destroy();
				this.iframes = new Array();
			}
			this.pageActionsPlaceholder =  dojo.byId('pageActions'); //$NON-NLS-0$
			dojo.empty(this.pageActionsPlaceholder);
			
			this.profileForm = new dijit.form.Form({id: "profileForm"});			 //$NON-NLS-0$
			
			this.profileForm.placeAt(this.profilePlaceholder);
			
			var userPluginDiv = dojo.create("div", null, userProfile.profileForm.get("domNode")); //$NON-NLS-1$ //$NON-NLS-0$
			
			
			this.usersClient.getDivContent().then(function(content) {
				dojo.hitch(userProfile, userProfile.draw(content, userPluginDiv));
			});
			
			
			
			for(var i=0; i<pluginsList.length; i++){
				var pluginDiv = dojo.create("div", {style: "clear: both", innerHTML: dojo.string.substitute(messages["Loading ${0}..."],[pluginsList[i].Url])}, userProfile.profileForm.get("domNode")); //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
				var pluginReference= this.pluginRegistry.getPlugin(pluginsList[i].Url);
				if(pluginReference===null){
					var registry = this.registry;
					dojo.hitch(this, function(div){this.pluginRegistry.installPlugin(pluginsList[i].Url).then(
							function(ref){
								var pluginService = registry.getService(ref.getServiceReferences()[0]);
								if(pluginService.getDivContent) {
									pluginService.getDivContent().then(function(content) {
										dojo.hitch(userProfile, userProfile.draw(content, div));
									});
								}
							});
					})(pluginDiv);
					continue;
				}
				var plugin = this.registry.getService(pluginReference.getServiceReferences()[0]);
				
				if(plugin===null){
					console.error("Could not deploy plugin " + pluginsList[i].Url); //$NON-NLS-0$
					continue;
				}
				dojo.hitch(this, function(div){
					plugin.getDivContent().then(function(content) {
						dojo.hitch(userProfile, userProfile.draw(content, div));
					});
				})(pluginDiv);
			}
			
	
		},
		setUserToDisplay : function(userURI) {
			this.currentUserURI = userURI;
			this.usersClient.initProfile(userURI, "requiredPluginsChanged", "userInfoChanged"); //$NON-NLS-1$ //$NON-NLS-0$
			
		},
		redisplayLastUser : function(){
			var profile = this;
			this.usersClient.getUserInfo(profile.currentUserURI);
		},
		populateData: function(jsonData){
			if(jsonData && jsonData.login){
				this.lastJSON = jsonData;
				if(this.profileForm){
					this.profileForm.reset();
					this.profileForm.set('value', jsonData); //$NON-NLS-0$
					if(dojo.byId("profileBanner")) //$NON-NLS-0$
						dojo.byId("profileBanner").innerHTML = dojo.string.substitute(messages["Profile Information for ${0}"], ["<b style='color: #000'>" + jsonData.login + "</b>"]); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
				}
				for(var i in this.iframes){
					this.setHash(this.iframes[i], jsonData.Location);
				}
			}else{
				throw new Error(messages["User is not defined"]);
			}
		},
		setHash: function(iframe, hash){
			if(iframe.src.indexOf("#")>0){ //$NON-NLS-0$
				iframe.src = iframe.src.substr(0, iframe.src.indexOf("#")) + "#" + hash; //$NON-NLS-1$ //$NON-NLS-0$
			}else{
				iframe.src = iframe.src + "#" + hash; //$NON-NLS-0$
			}
		},
		createFormElem: function(json, node){
			  if(!json.type){
			    throw new Error(messages["type is missing!"]);
			  }
			  var cls = dojo.getObject(json.type, false, dijit.form);
			  if(!cls){
			    cls = dojo.getObject(json.type, false);
			  }
			  if(cls){
				  if(dijit.byId(json.props.id))
					  dijit.byId(json.props.id).destroy();
				  
				  formElem = new cls(json.props);
				  formElem.placeAt(node);
				  
				  function setInnerHTML(myDijit,p){
					  if(myDijit.declaredClass==="dijit.form.CheckBox"){ //$NON-NLS-0$
						  p.innerHTML = myDijit.get('checked') ? messages["yes"] : messages["no"]; //$NON-NLS-0$
						  return;
					  }
					  p.innerHTML = myDijit.get('value'); //$NON-NLS-0$
					  if(p.innerHTML=="")
						  p.innerHTML="&nbsp"; //$NON-NLS-0$
					};
				  
				  if(formElem.get('readOnly')===true && !formElem.get('ecliplseCustomValue')){ //$NON-NLS-1$ //$NON-NLS-0$
					  formElem.set('style', 'display: none'); //$NON-NLS-1$ //$NON-NLS-0$
					  var p = dojo.create("span", {id: formElem.get('id')+"_p", className: "userprofile", innerHTML: formElem.get('value')?formElem.get('value'):"&nbsp;"}, node, "last"); //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					  
					  setInnerHTML(formElem, p);
					  
					  dojo.connect(formElem, "onChange", dojo.hitch(this, function(myDijit,p){ //$NON-NLS-0$
						  if(myDijit.declaredClass==="dijit.form.CheckBox"){ //$NON-NLS-0$
							  p.innerHTML = myDijit.get('checked') ? messages['yes'] : messages['no']; //$NON-NLS-0$
							  return;
						  }
						  p.innerHTML = myDijit.get('value'); //$NON-NLS-0$
						  if(p.innerHTML=="")
							  p.innerHTML="&nbsp"; //$NON-NLS-0$
						}, formElem, p));
				  }
				  
				  return formElem;
			  }else{
				  return new Error(messages["Type not found "] + json.type);
			  }
			  
			},
		drawIframe: function(desc, placeholder){
			var iframe = dojo.create("iframe", desc, placeholder); //$NON-NLS-0$
			this.iframes.push(iframe);
			if(this.lastJSON)
				this.setHash(iframe, this.lastJSON.Location);
			dojo.place(iframe, placeholder);
		},
		
		draw: function(content, placeholder){
			var profile = this;
			placeholder.innerHTML = "";
			if(content.sections)
			for(var i=0; i<content.sections.length; i++){
				
				if(dijit.byId(content.sections[i].id))
					dijit.byId(content.sections[i].id).destroy();

				var titleWrapper = dojo.create( "div", {"class":"sectionWrapper toolComposite", "id": content.sections[i].id + "_SectionHeader"}, placeholder ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				
				dojo.create( "div", { id: content.sections[i].id + "_SectionTitle", "class":"layoutLeft", innerHTML: content.sections[i].name }, titleWrapper ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

				var content2 =	
					'<div class="sectionTable" role="region" aria-labelledby="' + content.sections[i].id + "_SectionTitle" + '">' + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						'<list id="' + content.sections[i].id + '"></list>' + //$NON-NLS-1$ //$NON-NLS-0$
					'</div>'; //$NON-NLS-0$
				
				dojo.place( content2, placeholder );

				var sectionContents = dojo.create("div", null, placeholder); //$NON-NLS-0$
				
				if(content.sections[i].type==="iframe"){ //$NON-NLS-0$
					dojo.hitch(this, this.drawIframe(content.sections[i].data, sectionContents));
					return;
				}

				for(var j=0; j<content.sections[i].data.length; j++){
					var tableListItem = dojo.create( "div", { "class":"sectionTableItem"}, dojo.byId(content.sections[i].id) ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					
					var data = content.sections[i].data[j];
					var label = dojo.create("label", {"for": data.props.id}, tableListItem); //$NON-NLS-1$ //$NON-NLS-0$
					dojo.create( "span", {style: "min-width:150px; display:inline-block", innerHTML: data.label }, label );				 //$NON-NLS-1$ //$NON-NLS-0$
					var input = this.createFormElem(data, label);
					dojo.connect(input, "onKeyPress", dojo.hitch(profile, function(event){ if (event.keyCode === 13) { this.fire(); } else {return true;}})); //$NON-NLS-0$
					if(this.lastJSON && data.props && this.lastJSON[data.props.name]){
						input.set('value', this.lastJSON[data.props.name]); //$NON-NLS-0$
					}
				}
			}
			if(content.actions && content.actions.length>0) {
				var breadcrumbTarget = 	{};
				breadcrumbTarget.Parents = [];
				breadcrumbTarget.Name = profile.lastJSON.Name && profile.lastJSON.Name.replace(/^\s+|\s+$/g,"")!=="" ? profile.lastJSON.Name : profile.lastJSON.login; //$NON-NLS-0$
				mGlobalCommands.setPageTarget({task: "User Profile", breadcrumbTarget: breadcrumbTarget});
			
				dojo.empty(this.pageActionsPlaceholder);
				this.commandService.addCommandGroup(this.pageActionsPlaceholder.id, "eclipse.profileActionsGroup", 100); //$NON-NLS-0$
				for(var i=0; i<content.actions.length; i++){
					var info = content.actions[i];
					var commandOptions = {
							name: info.name,
							image: info.image,
							id: info.id,
							tooltip: info.tooltip,
							callback: dojo.hitch(profile, function(action){this.fire(action);}, info.action)
					};
					var command = new mCommands.Command(commandOptions);
					this.commandService.addCommand(command);					
					this.commandService.registerCommandContribution(this.pageActionsPlaceholder.id, info.id, i, "eclipse.profileActionsGroup"); //$NON-NLS-0$
				}
				this.commandService.renderCommands(this.pageActionsPlaceholder.id, this.pageActionsPlaceholder, {}, {}, "button"); //$NON-NLS-0$
				
			}
			
		},
		fire: function(action){
			var self = this;
			var data = new Object();
			//collect all data that are not reaonly and are not empty passwords
			dojo.forEach(dijit.byId('profileForm').getDescendants(), function(widget){  //$NON-NLS-0$
	            var name = widget.name; 
	            if(!name || widget.disabled || widget.get('readOnly')){ return; } //$NON-NLS-0$
	            if(widget.get('type') && widget.get('type')=='password' && widget.get('value')==="") {return;} //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	            data[name] = widget.get('value'); //$NON-NLS-0$
			});
			var url = this.currentUserURI;
			this.usersClient.fire(action, url, data).then(
					function(info){
//							if(checkUser) checkUser(); //refresh the user header because user might been changed or user could be deleted
							dojo.hitch(self, self.displayMessage)(info, "Info"); //$NON-NLS-0$
						},
					function(error){
							if(error.status===401 || error.status===403 )
								return;
					dojo.hitch(self, self.displayMessage)(error, "Error"); //$NON-NLS-0$

				});
	
		},
		displayMessage: function(message, severity){
			if(!message)
				return;
			
			var display = [];
			
			display.Severity = severity;
			display.HTML = false;
			
			try{
				var resp = JSON.parse(message.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			}catch(Exception){
				display.Message = message.Message;
			}
			
			if(display.Message){
				this.registry.getService("orion.page.message").setProgressResult(display);	 //$NON-NLS-0$
			}
		}
	};
	// this has to be a global for now
	window.eclipse = window.eclipse || {};
	window.eclipse.DateLong = DateLong;
	return {
		Profile:Profile,
		DateLong:DateLong
	};
});
