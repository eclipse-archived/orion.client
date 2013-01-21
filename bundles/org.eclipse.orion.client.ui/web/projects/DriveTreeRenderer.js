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
/*global define window orion document */
/*jslint browser:true */

define(['i18n!orion/widgets/nls/messages', 'orion/explorers/explorer'], 
function(messages, mExplorer) {

	function DriveTreeRenderer( options, explorer ){
		this.explorer = explorer;
		this._init(options);
	}
	
	function setTarget( target ){
	
	}
	
	DriveTreeRenderer.prototype = new mExplorer.SelectionRenderer(); 
	
	DriveTreeRenderer.prototype.constructor = DriveTreeRenderer;
	
	DriveTreeRenderer.prototype.setTarget = setTarget;
	
	DriveTreeRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	
	DriveTreeRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		var col = document.createElement("td"); //$NON-NLS-0$
		tableRow.appendChild(col);
		var span = document.createElement("span"); //$NON-NLS-0$
		span.id = tableRow.id+"navSpan"; //$NON-NLS-0$
		col.appendChild(span);
		span.className = "mainNavColumn singleNavColumn"; //$NON-NLS-0$
		this.getExpandImage(tableRow, span);
		span.appendChild(document.createTextNode(item.Name)); 
	};
	
	return DriveTreeRenderer;
});