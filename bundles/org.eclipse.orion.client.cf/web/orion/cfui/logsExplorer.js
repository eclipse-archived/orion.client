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
define([
	'orion/webui/littlelib',
	'orion/explorers/explorer',
	'orion/objects',
	'orion/URITemplate'
],
function(lib, mExplorer, objects,URITemplate){
	
	
	function LogsModel(application, prefix){
		this.root = application;
		this.numberOfInstances = Object.keys(this.root.logs).length;
		this.prefix = prefix;
	}
	
	LogsModel.prototype = new mExplorer.ExplorerModel();
	
	objects.mixin(LogsModel.prototype, {
		getRoot: function(onItem){
			onItem(this.root);
		},
		getChildren: function(parentItem, onComplete){
			if(parentItem === this.root){
				
				if(this.numberOfInstances===1){
					var instance = Object.keys(this.root.logs)[0];
					this.root.children = this.root.logs[instance];
					this.root.children.forEach(function(child){
						child.parent = this.root;
						child.Target = this.root.Target;
						child.Instance = instance;
					}.bind(this));
					onComplete(this.root.children);
				} else {
					var children = [];
					for(var instanceVal in this.root.logs){
						children.push({Instance: instanceVal, Children: this.root.logs[instanceVal], Type: "Instance", parent: parentItem});
					}
					this.root.children = children;
					onComplete(children);
				}
				
			} else if(parentItem.Instance){
				var children = parentItem.Children;
				children.forEach(function(child){
					child.parent = parentItem;
					child.Instance = parentItem.Instance;
					child.Target = this.root.Target;
				}.bind(this));
				parentItem.children = children;
				onComplete(children);
			}else{
				onComplete([]);
			}
		},
		getId: function(item){
			if(item === this.root) return this.prefix + this.root.Application;
			if(item.Instance && item.Children) return this.prefix + this.root.Application + "_" + item.Instance;
			if(item.Instance && item.Name) return this.prefix + this.root.Application + "_" + item.Instance + "_" + item.Name;
			return this.prefix + this.root.Application + "_" + item.Name;
		},
		constructor: LogsModel
	});

	function LogsRenderer(options, explorer){
		this._init(options);
		this.explorer = explorer;
		this.commandService = options.commandRegistry;
		this.actionScopeId = options.actionScopeId;
		this.colorLightDarkRows = options.isMiniNav;
	}
	
	LogsRenderer.prototype = new mExplorer.SelectionRenderer();
	LogsRenderer.prototype.constructor = LogsRenderer;
	
	objects.mixin(LogsRenderer.prototype, {
		getCellElement: function(col_no, item, tableRow){
			if(col_no!==0){
				return null;
			}
			var col = document.createElement('td'); //$NON-NLS-0$
			var span = document.createElement("span"); //$NON-NLS-0$
			span.id = tableRow.id+"MainCol"; //$NON-NLS-0$
			span.setAttribute("role", "presentation"); //$NON-NLS-1$ //$NON-NLS-0$
			col.appendChild(span);
			col.setAttribute("role", "presentation"); //$NON-NLS-1$ //$NON-NLS-0$
			span.className = "mainNavColumn"; //$NON-NLS-0$

			if(item.Type === "Log"){
				var image = document.createElement("span");
				image.className = "coreImageSprite core-sprite-file";
				image.style.paddingLeft = "16px";
				span.appendChild(image);
				var a = document.createElement("a");
				a.appendChild(document.createTextNode(item.Name));
				var params = item.Target ? objects.clone(item.Target) : {};
				objects.mixin(params, {instance: item.Instance, log: item.Name});
				a.href = new URITemplate("#{,resource,params*}").expand({resource: item.Application, params: params});
				span.appendChild(a);
			} else if(item.Type === "Instance"){
				this.getExpandImage(tableRow, span);
				span.appendChild(document.createTextNode("Instance: " + item.Instance));
			}
			col.appendChild(span);
			return col;
		},
		rowsChanged: function() {
			mExplorer.SelectionRenderer.prototype.rowsChanged.apply(this, arguments);
			if(this.colorLightDarkRows){
				lib.$$array(".darkSectionTreeTableRow", this.tableNode).forEach(function(node, i) {
					node.classList.remove("darkSectionTreeTableRow");
				});
				lib.$$array(".lightSectionTreeTableRow", this.tableNode).forEach(function(node, i) {
					node.classList.remove("lightSectionTreeTableRow");
				});
			}
		},
		prototype: LogsRenderer
	});
	
	
	function LogsExplorer(serviceRegistry, selection, commandRegistry, parent, titleNode, isMiniNav) {
		this.parent = parent;
		this.titleNode = titleNode;
		mExplorer.Explorer.apply(this, [serviceRegistry, selection, new LogsRenderer({
			singleSelection: true,
			checkbox: false,
			commandRegistry: commandRegistry,
			isMiniNav: isMiniNav
		}, this), commandRegistry]);
	}
	
	LogsExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	
	objects.mixin(LogsExplorer.prototype, {
		load: function(logs){
			this.logs = logs;
			if(logs.Application && this.titleNode){
				lib.empty(this.titleNode);
				var span = document.createElement("span");
				span.id = "LogsNavigationTitle";
				span.className = "filesystemName layoutLeft";
				span.appendChild(document.createTextNode(logs.Application));
				this.titleNode.appendChild(span);
			}
			var model = new LogsModel(logs, this.parent.id);
			this.createTree(this.parent, model,  {indent: '8px'});
			this.initNavHandler();
		},
		constructor: LogsExplorer
	});
	
	//return module exports
	return {
		LogsExplorer: LogsExplorer
	};
});