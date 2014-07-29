/*******************************************************************************
 * @license
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014. All Rights Reserved. 
 * 
 * Note to U.S. Government Users Restricted Rights:  Use, 
 * duplication or disclosure restricted by GSA ADP Schedule 
 * Contract with IBM Corp.
 *******************************************************************************/
 /*global define window document*/
 /*eshint-env browser, amd*/
define(['orion/URITemplate', 'orion/PageLinks', 'orion/explorers/explorer'], function(URITemplate, PageLinks, mExplorer){
	
	function getUrlLinkNode(url, name){
		if(!name){
			name = url;
		}
		var a = document.createElement("a");
		a.target = "_new";
		a.href = url.indexOf("://")<0 ? "http://" + url : url;
		a.title = url;
		a.appendChild(document.createTextNode(name));
		return a;
	}
	
	function ApplicationsRenderer (options) {
		this._init(options);
	}
	ApplicationsRenderer.prototype = new mExplorer.SelectionRenderer(); 
	ApplicationsRenderer.prototype.constructor = ApplicationsRenderer;
	ApplicationsRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	
	ApplicationsRenderer.prototype.emptyCallback = function(bodyElement){
		var tr = document.createElement("tr");
		var td = document.createElement("td");
		td.appendChild(document.createTextNode("You have no applications in this space"));
		tr.appendChild(td);
		bodyElement.appendChild(tr);
	};
	
	ApplicationsRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
			var col = document.createElement("td"); //$NON-NLS-0$
			var span = document.createElement("span"); //$NON-NLS-0$
			span.id = tableRow.id+"navSpan"; //$NON-NLS-0$
			col.appendChild(span);
			span.className = "mainNavColumn singleNavColumn"; //$NON-NLS-0$
			var val = "";
		
		if(item.Type === "Route"){
			switch (col_no) {
				case 0:
					span.appendChild(getUrlLinkNode(item.Host + "." + item.DomainName));
					return col;
				case 1:
				case 2:
					val = "";
					break;
				default:
					return null;
			}
		} else {
			switch(col_no){
				case 0:
					this.getExpandImage(tableRow, span);
					if(item.urls && item.urls.length>0){
						span.appendChild(getUrlLinkNode(item.urls[0], item.Name));
						return col;
					}
					
					val = item.Name;
					break;
				case 1:
					var a = document.createElement("a");
					a.target = "_new";
					var uriTemplate = new URITemplate("{+OrionHome}/cfui/logs.html#{Name,Target*}");
					a.href = uriTemplate.expand({OrionHome : PageLinks.getOrionHome(), Name: item.Name, Target: item.parent.Target});
					a.appendChild(document.createTextNode("Logs"));
					span.appendChild(a);	
					return col;
				case 2:
				col.classList.add("secondaryColumnRight");
				if(item.State === "STARTED"){
					span.className = "imageSprite core-sprite-applicationrunning";
					span.title = (typeof item.Instances !== "undefined" && typeof item.RunningInstances !== "undefined") ? ( item.RunningInstances + " of " + item.Instances + " instances running") : "Started";
					return col;
				} else if(item.State==="STOPPED"){
					span.className = "imageSprite core-sprite-applicationstopped";
					span.title = (typeof item.Instances !== "undefined" && typeof item.RunningInstances !== "undefined") ? ( item.RunningInstances + " of " + item.Instances + " instances running") : "Stopped";
					return col;
				} else if(item.State==="NOT_DEPLOYED"){
					span.className = "imageSprite core-sprite-applicationnotdeployed";
					span.title = "Not deployed";
					return col;
				} else if(item.State==="PROGRESS"){
					span.className = "imageSprite core-sprite-progress";
					span.title = "Checking application state";
					return col;
				} else {
					span.appendChild(document.createTextNode("State unknown"));
					return col;
				}
					
					break;
				default:
					return null;
			}
		}
		
		span.appendChild(document.createTextNode(val));
		return col;
	};
	
	function ApplicationsModel(apps, target){
		this.apps = apps;
		this.apps.Target = target;
	}
	
	ApplicationsModel.prototype = {
		constructor: ApplicationsModel,
		getRoot: function(onItem){
			onItem(this.apps);
		},
		decorateChildren: function(item, children, type){
			if(!children){
				return;
			}
			children.forEach(function(child){
				child.Type = type;
				child.parent = item;
			});
		},
		getChildren: function(item, onItem){
			if(item.Apps){
				this.decorateChildren(item, item.Apps, "App");
				item.children = item.Apps;
				return onItem(item.Apps);
			}
			this.decorateChildren(item, item.Routes, "Route");
			item.children = item.Routes;
			return onItem(item.Routes);
		},
		getId: function(item){
			if(!item){
				return "rootApps";
			}
			return item.Guid;
		},
		destroy: function(){}
	};

	function ApplicationsExplorer(serviceRegistry, selection, commandRegistry, parent){
				
		this.parent = parent;
		
		mExplorer.Explorer.apply(this, [serviceRegistry,
			selection,
		new ApplicationsRenderer({checkbox: false, singleSelection: true,	treeTableClass: "sectionTreeTable",	cachePrefix: "CfExplorer"}),
				commandRegistry]);
		
	}
	
	ApplicationsExplorer.prototype = new mExplorer.Explorer();
	ApplicationsExplorer.prototype.constructor = ApplicationsExplorer;
	
	ApplicationsExplorer.prototype.events = ["update", "create", "delete", "map", "unmap"];
	
	ApplicationsExplorer.prototype.expand = function(item){
		if (this.myTree.isExpanded(item)) {
			//do nothing
		} else {
			this.myTree.expand(this.model.getId(item));
		}
	}
	
	ApplicationsExplorer.prototype.cfEventListener = function(event){
		if(!this.apps.Apps){
			this.apps.Apps = [];
		}
		
		if(event.type === "map" || event.type === "unmap"){
			if(!event.app || !event.route){
				return;
			}
			for(var i=0; i<this.apps.Apps.length; i++){
				if(this.apps.Apps[i].Guid === event.app.Guid){
					var app = this.apps.Apps[i];
					if(event.type === "unmap"){
						for(var j=0; j<app.Routes.length; j++){
							if(app.Routes[j].Guid === event.route.Guid){
								app.Routes.splice(j, 1);
								break;
							}
						}
					} else {
						app.Routes.push(event.route);
					}
				}
			}
			
		} else {
			if(event.oldValue && event.oldValue.Type !== "Route"){
				for(var i=0; i<this.apps.Apps.length; i++){
					if(this.apps.Apps[i].Guid === event.oldValue.Guid){
						if(event.newValue){
							this.apps.Apps[i] = event.newValue;
						} else {
							this.apps.Apps.splice(i, 1);
						}
						break;
					}
				}
			} else if(event.newValue && event.newValue.Type !== "Route"){
				this.apps.Apps.push(event.newValue);
			}
		}
		var model = new ApplicationsModel(this.apps, this.target);
		this.createTree(this.parent, model, {});
		if(event.expand){
			setTimeout(function(){
				this.expand(event.newValue || event.app);
			}.bind(this), 5);
		}
	};
	
	ApplicationsExplorer.prototype.loadApps = function(apps, target){
		this.apps = apps;
		this.target = target;
		this.model = new ApplicationsModel(apps, target);
		this.createTree(this.parent, this.model, {});
	};
	
	var appsCfListenerRef;
	
	ApplicationsExplorer.prototype.destroyListeters = function(){
		if(this.cfEventDispatcher && appsCfListenerRef){
				this.events.forEach(function(eventType){
					this.cfEventDispatcher.removeEventListener(eventType, appsCfListenerRef);
				}.bind(this));
			}
	}
	
	ApplicationsExplorer.prototype.addListeters = function(cfEventDispatcher){
		this.cfEventDispatcher = cfEventDispatcher;
		appsCfListenerRef = this.cfEventListener.bind(this)
		this.events.forEach(function(eventType){
				cfEventDispatcher.addEventListener(eventType, appsCfListenerRef);
			}.bind(this));
	}
	
	function OrphanRoutesRenderer(options){
		this._init(options);
	}
	OrphanRoutesRenderer.prototype = new mExplorer.SelectionRenderer(); 
	OrphanRoutesRenderer.prototype.constructor = OrphanRoutesRenderer;
	OrphanRoutesRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
		var col = document.createElement("td"); //$NON-NLS-0$
		var span = document.createElement("span"); //$NON-NLS-0$
		span.id = tableRow.id+"navSpan"; //$NON-NLS-0$
		col.appendChild(span);
		span.className = "mainNavColumn singleNavColumn"; //$NON-NLS-0$
		var val = "";
	
		switch (col_no) {
			case 0:
				span.appendChild(getUrlLinkNode(item.Host + "." + item.DomainName));
				return col;
			default:
				return null;
		}
		
		span.appendChild(document.createTextNode(val));
		return col;
	};
	
	OrphanRoutesRenderer.prototype.emptyCallback = function(bodyElement){
		var tr = document.createElement("tr");
		var td = document.createElement("td");
		td.appendChild(document.createTextNode("You have no orphan routes in this space"));
		tr.appendChild(td);
		bodyElement.appendChild(tr);
	};
	
	function OrphanRoutesExplorer(serviceRegistry, selection, commandRegistry, parent){
		mExplorer.Explorer.apply(this,
			[serviceRegistry,
			selection,
	new OrphanRoutesRenderer({checkbox: false, singleSelection: true,	treeTableClass: "sectionTreeTable",	cachePrefix: "OrphanRoutesExplorer"}),
				commandRegistry]);
	this.parent = parent;
	}
	
	OrphanRoutesExplorer.prototype = new mExplorer.Explorer();
	OrphanRoutesExplorer.prototype.constructor = OrphanRoutesExplorer;
	OrphanRoutesExplorer.prototype.events = ["update", "create", "delete", "map", "unmap"];
	
	var routesCfEventListenerRef;
	
	OrphanRoutesExplorer.prototype.destroyListeters = function(){
		if(this.cfEventDispatcher && routesCfEventListenerRef){
				this.events.forEach(function(eventType){
					this.cfEventDispatcher.removeEventListener(eventType, routesCfEventListenerRef);
				}.bind(this));
			}
	}
	
	OrphanRoutesExplorer.prototype.addListeters = function(cfEventDispatcher){
		this.cfEventDispatcher = cfEventDispatcher;
		routesCfEventListenerRef = this.cfEventListener.bind(this);
		this.events.forEach(function(eventType){
				cfEventDispatcher.addEventListener(eventType, routesCfEventListenerRef);
			}.bind(this));
	}
	
	OrphanRoutesExplorer.prototype.cfEventListener = function(event){
			if(!this.routes.Routes){
				this.routes.Routes = [];
			}
			
			if(event.type === "map" || event.type === "unmap"){
			if(!event.app || !event.route){
				return;
			}
			for(var i=0; i<this.routes.Routes.length; i++){
				if(this.routes.Routes[i].Guid === event.route.Guid){
					var route = this.routes.Routes[i];
					if(event.type === "unmap"){
						for(var j=0; j<route.Apps.length; j++){
							if(route.Apps[j].Guid === event.app.Guid){
								route.Apps.splice(j, 1);
								break;
							}
						}
					} else {
						route.Apps.push(event.app);
					}
				}
			}
			
		} else {
			
			if(event.oldValue && event.oldValue.Type === "Route"){
				for(var i=0; i<this.routes.Routes.length; i++){
					if(this.routes.Routes[i].Guid === event.oldValue.Guid){
						if(event.newValue){
							this.routes.Routes[i] = event.newValue;
						} else {
							this.routes.Routes.splice(i, 1);
						}
						break;
					}
				}
			} else if(event.newValue && event.newValue.Type === "Route"){
				this.routes.Routes.push(event.newValue);
			}
		}
			this.loadRoutes(this.routes, this.target);
		};
	
	OrphanRoutesExplorer.prototype.loadRoutes = function(routes, target){
		this.routes = routes;
		this.target = target;
		
		var orphanRoutes = [];
			
		if(routes && routes.Routes){
			routes.Routes.forEach(function(route){
				if(!route.Apps || route.Apps.length == 0){
					route.target = target;
					orphanRoutes.push(route);
				}
			});
		}
		
		var routesModel = new mExplorer.ExplorerFlatModel(null, null, orphanRoutes);
		routesModel.getId = function(item){return item.Guid;};		
		this.createTree(this.parent, routesModel, {});
	};
	
	return {
		ApplicationsExplorer: ApplicationsExplorer,
		OrphanRoutesExplorer: OrphanRoutesExplorer
	};
});
