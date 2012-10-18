/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define dojo window orion widgets */
/*jslint browser:true */

define(['i18n!orion/widgets/nls/messages', 'dojo', 'dijit', 'orion/fileUtils', 'orion/selection', 'orion/explorers/navigationUtils', 'orion/explorers/explorer', 'orion/explorers/explorer-table', 'dijit/Dialog', 'dijit/form/Button', 'orion/widgets/_OrionDialogMixin', 'text!orion/widgets/templates/DirectoryPrompterDialog.html'], 
function(messages, dojo, dijit, mFileUtils, mSelection, mNavUtils, mExplorer, mExplorerTable) {

	function DirectoryPrompterRenderer (options, explorer) {
		this.explorer = explorer;
		this._init(options);
	}
	DirectoryPrompterRenderer.prototype = new mExplorer.SelectionRenderer(); 
	DirectoryPrompterRenderer.prototype.constructor = DirectoryPrompterRenderer;
	DirectoryPrompterRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	DirectoryPrompterRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		var col = dojo.create("td", null, tableRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
		var span = dojo.create("span", {id: tableRow.id+"navSpan"}, col, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		dojo.addClass(span, "mainNavColumn singleNavColumn"); //$NON-NLS-0$
		this.getExpandImage(tableRow, span);
		dojo.place(window.document.createTextNode(item.Name), span, "last"); //$NON-NLS-0$
	};

	/**
	* @param options {{
			func : function(item)     Function to be called with the selected item
			message : String          (Optional) Message to display in dialog.
			title : String            (Optional) Dialog title.
		}}
	 */
	 
	var DirectoryPrompterDialog = dojo.declare("orion.widgets.DirectoryPrompterDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], { //$NON-NLS-0$
		widgetsInTemplate : true,
		templateString : dojo.cache('orion', 'widgets/templates/DirectoryPrompterDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
		constructor : function() {
			this.options = arguments[0] || {};
		},
		
		postMixInProperties : function() {
			this.inherited(arguments);
			this.title = this.options.title || messages['Choose a Folder'];
			this.fileClient = this.options.fileClient;
			this.serviceRegistry = this.options.serviceRegistry;
			this.buttonOk = messages['OK'];	
			this.message = this.options.message || "";
		},
		
		postCreate : function() {
			this.inherited(arguments);
			this.loadFolderList("/");	// workspace root //$NON-NLS-0$
			if (!this.message) {
				dojo.style(this.messageCell, {display: "none"}); //$NON-NLS-0$
			}
			this.browseDirectoryExplorerTree.focus();
		},
		
		loadFolderList: function(path) {
			path = mFileUtils.makeRelative(path);
			this.selection = new mSelection.Selection(this.serviceRegistry, "orion.directoryPrompter.selection"); //$NON-NLS-0$
	
			this.explorer = new mExplorerTable.FileExplorer({treeRoot: {children:[]}, selection: this.selection, serviceRegistry: this.serviceRegistry,
					fileClient: this.fileClient, parentId: this.id+"_browseDirectoryExplorerTree", excludeFiles: true, rendererFactory: function(explorer) {  //$NON-NLS-0$
						return new DirectoryPrompterRenderer({checkbox: false, singleSelection: true, decorateAlternatingLines: false, treeTableClass: "directoryPrompter" }, explorer);   //$NON-NLS-0$
					}}); //$NON-NLS-0$
			this.explorer.loadResourceList(path, true, null);
		},
		
		execute : function() {
			this.selection.getSelection(function(selection) {
				this.onHide();
				this.options.func(selection);
			}.bind(this));
		}
	});
	return DirectoryPrompterDialog;
});