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
					span.appendChild(getUrlLinkNode(item.host + "." + item.domain.name));
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
						span.appendChild(getUrlLinkNode(item.urls[0], item.name));
						return col;
					}
					
					val = item.name;
					break;
				case 1:
					var a = document.createElement("a");
					a.target = "_new";
					var uriTemplate = new URITemplate("{+OrionHome}/cfui/logs.html#{Name,Target*}");
					a.href = uriTemplate.expand({OrionHome : PageLinks.getOrionHome(), Name: item.name, Target: item.parent.Target});
					a.appendChild(document.createTextNode("Logs"));
					span.appendChild(a);	
					return col;
				case 2:
				col.classList.add("secondaryColumnRight");
				if(item.state === "STARTED"){
					span.className = "imageSprite core-sprite-applicationrunning";
					span.title = (typeof item.instances !== "undefined" && typeof item.running_instances !== "undefined") ? ( item.running_instances + " of " + item.instances + " instances running") : "Started";
					return col;
				} else if(item.state==="STOPPED"){
					span.className = "imageSprite core-sprite-applicationstopped";
					span.title = (typeof item.instances !== "undefined" && typeof item.running_instances !== "undefined") ? ( item.running_instances + " of " + item.instances + " instances running") : "Stopped";
					return col;
				} else if(item.state==="NOT_DEPLOYED"){
					span.className = "imageSprite core-sprite-applicationnotdeployed";
					span.title = "Not deployed";
					return col;
				} else if(item.state==="PROGRESS"){
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
			if(item.apps){
				if(!item.children){
					this.decorateChildren(item, item.apps, "App");
					item.children = item.apps;
				}
				return onItem(item.apps);
			}
			if(!item.children){
				this.decorateChildren(item, item.routes, "Route");
				item.children = item.routes;
			}
			return onItem(item.routes);
		},
		getId: function(item){
			if(!item){
				return "rootApps";
			}
			return item.guid;
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
	
	ApplicationsExplorer.prototype.events = ["update", "create", "delete"];
	
	ApplicationsExplorer.prototype.cfEventListener = function(event){
		if(!this.apps.apps){
			this.apps.apps = [];
		}
		
		if(event.oldValue && event.oldValue.Type !== "Route"){
			for(var i=0; i<this.apps.apps.length; i++){
				if(this.apps.apps[i].guid === event.oldValue.guid){
					if(event.newValue){
						this.apps.apps[i] = event.newValue;
					} else {
						this.apps.apps.splice(i, 1);
					}
					break;
				}
			}
		} else if(event.newValue && event.newValue.Type !== "Route"){
			this.apps.apps.push(event.newValue);
		}
		var model = new ApplicationsModel(this.apps, this.target);
		this.createTree(this.parent, model, {});
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
	OrphanRoutesExplorer.prototype.events = ["update", "create", "delete"];
	
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
			if(event.oldValue && event.oldValue.Type === "Route"){
				for(var i=0; i<this.routes.Routes.length; i++){
					if(this.routes.Routes[i].Guid === this.routes.Routes.Guid){
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
			this.loadRoutes(this.routes, this.apps, this.target);
		};
	
	OrphanRoutesExplorer.prototype.loadRoutes = function(routes, apps, target){
		this.routes = routes;
		this.apps = apps;
		this.target = target;
		
		var orphanRoutes = [];
			
		if(routes && routes.Routes){
			routes.Routes.forEach(function(route){
				if(apps.apps.every(function(app){
					return app.routes.every(function(appRoute){
						return appRoute.guid !== route.Guid;
					});
				})){
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
	}
});