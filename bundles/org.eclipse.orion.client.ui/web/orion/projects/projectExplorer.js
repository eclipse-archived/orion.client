/*******************************************************************************
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
define([
	'i18n!orion/edit/nls/messages',
	'orion/URITemplate',
	'orion/webui/littlelib',
	'orion/explorers/explorer',
	'orion/section',
	'orion/bidiUtils'
], function(messages, URITemplate, lib, mExplorer, mSection, bidiUtils){
	
	var ID_COUNT = 0;
	
	var editTemplate = new URITemplate("../edit/edit.html#{,resource,params*}"); //$NON-NLS-0$
			
	function ProjectsRenderer(options){
		this._init(options);
	}
	
	var newActionsScope = "newProjectActions";
	
	ProjectsRenderer.prototype = new mExplorer.SelectionRenderer();
	
	ProjectsRenderer.prototype.getCellHeaderElement = function(){
		return null;
	};
	
	ProjectsRenderer.prototype.emptyCallback = function(bodyElement) {
		var tr = document.createElement("tr"); //$NON-NLS-0$
		var td = document.createElement("td"); //$NON-NLS-0$
		td.colSpan = this.oneColumn ? 1 : 3;
		var noProjects = document.createElement("div"); //$NON-NLS-0$
		noProjects.classList.add("noFile"); //$NON-NLS-0$
		noProjects.textContent = messages.NoProjects;
		var plusIcon = document.createElement("span"); //$NON-NLS-0$
		plusIcon.appendChild(document.createTextNode(messages["File"]));
		lib.processDOMNodes(noProjects, [plusIcon]);
		td.appendChild(noProjects);
		tr.appendChild(td);
		bodyElement.appendChild(tr);
	};

	ProjectsRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		var cell = document.createElement("td");
		
		function getDescription(item){
			if(!item.Description){
				return " ";
			}
			var itemDesc = item.Description;
			if (bidiUtils.isBidiEnabled()) {
				itemDesc = bidiUtils.enforceTextDirWithUcc(itemDesc);
			}
			if(item.Description.length>200){
				return itemDesc.substring(0, 180) + "...";
			}
			return itemDesc;
		}
		
		switch(col_no){
			case 0:
				cell.className = "navColumnNoIcon";
				var a = document.createElement("a");
				var itemName = item.Name;
				if (bidiUtils.isBidiEnabled()) {
					itemName = bidiUtils.enforceTextDirWithUcc(itemName);
				}
				a.appendChild(document.createTextNode(itemName));
				a.href = editTemplate.expand({resource: item.ContentLocation}); //$NON-NLS-0$
				cell.appendChild(a);
				return cell;
			case 1:
				cell.appendChild(document.createTextNode(getDescription(item)));
				return cell;
			case 2:
				if(item.Url){
					a = document.createElement("a");
					a.appendChild(document.createTextNode(item.Url));
					a.href = item.Url;
					cell.appendChild(a);
				} else {
					cell.appendChild(document.createTextNode(" "));
				}
				return cell;
		}
		return null;
	};

	function ProjectExplorer(parentId, serviceRegistry, selection, commandRegistry) {
		this.idCount = ID_COUNT++;
		this.registry = serviceRegistry;
		this.selection = selection;
		this.commandRegistry = commandRegistry;
		this.parentId = parentId;
		this.renderer = new ProjectsRenderer({});
		this.renderer.explorer = this;
		this.myTree = null;
		this.newActionsScope = newActionsScope;
		this.actionsSections = [this.newActionsScope];
		this._init();
	}
	
	ProjectExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	
	ProjectExplorer.prototype._init = function(){
		var projectsSection = new mSection.Section(lib.node(this.parentId), {id: "projectsSection" + this.idCount, title: messages['projectsSectionTitle'], canHide: true});
		var div = document.createElement("div");
		div.id = "projectsExplorer" + this.idCount;
		projectsSection.embedExplorer(this, div);
	};
	
	ProjectExplorer.prototype.loadProjects = function(projects){
		
		this.model = new mExplorer.SimpleFlatModel(projects, "orion.project.", function(item){
			if(item.ContentLocation){
				return item.ContentLocation.replace(/[\\\/]/g, "");
			}
		});
		this.myTree = this.createTree(this.parent, this.model, {indent: '8px', selectionPolicy: this.renderer.selectionPolicy});
		this.updateCommands();
	};
	
	return{
		ProjectExplorer: ProjectExplorer,
		newActionsScope: newActionsScope
	};

//end of define
});

