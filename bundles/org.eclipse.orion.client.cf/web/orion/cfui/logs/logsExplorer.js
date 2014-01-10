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

/*global define window document */
define([
	'orion/webui/littlelib',
	'orion/explorers/explorer',
	'orion/objects',
	'orion/URITemplate'
],
function(lib, mExplorer, objects,URITemplate){
	
	
	function LogsModel(application){
		this.root = application;
		this.numberOfInstances = Object.keys(this.root.logs).length;
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
						child.Target = this.root.Target;
						child.Instance = instance;
					}.bind(this));
					onComplete(this.root.children);
				} else {
					var children = [];
					for(var instanceVal in this.root.logs){
						children.push({Instance: instanceVal, Children: this.root.logs[instanceVal], Type: "Instance"});
					}
					this.root.children = children;
					onComplete(children);
				}
				
			} else if(parentItem.Instance){
				var children = parentItem.Children;
				children.forEach(function(child){
					child.Instance = parentItem.Instance;
				});
			}else{
				onComplete([]);
			}
		},
		getId: function(item){
			if(item === this.root) return this.root.Application;
			if(item.Instance && item.Children) return this.root.Application + "_" + item.Instance;
			if(item.Instance && item.Name) this.root.Application + "_" + item.Instance + "_" + item.Name;
			return this.root.Application + "_" + item.Name;
		},
		constructor: LogsModel
	});

	function LogsRenderer(options, explorer){
		this._init(options);
		this.explorer = explorer;
		this.commandService = options.commandRegistry;
		this.actionScopeId = options.actionScopeId;
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
				var a = document.createElement("a");
				a.appendChild(document.createTextNode(item.Name));
				a.href = new URITemplate("#{,resource,params*}").expand({resource: item.Application, params: {log: item.Name, target: JSON.stringify(item.Target), instance: item.Instance}});
				span.appendChild(a);
			} else if(item.Type === "Instance"){
				this.getExpandImage(tableRow, span);
				span.appendChild(document.createTextNode(item.Instance));
			}
			col.appendChild(span);
			return col;
		},
		prototype: LogsRenderer
	});
	
	
	function LogsExplorer(serviceRegistry, selection, commandRegistry, parent) {
		this.parent = parent;
		mExplorer.Explorer.apply(this, [serviceRegistry, selection, new LogsRenderer({
			checkbox: false,
			commandRegistry: commandRegistry
		}, this), commandRegistry]);
	}
	
	LogsExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	
	objects.mixin(LogsExplorer.prototype, {
		load: function(logs){
			this.logs = logs;
			var model = new LogsModel(logs);
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