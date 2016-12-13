/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 * Contributors: Casey Flynn - Google Inc - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
define(['text!examples/orion-preview.html'],
function(orionPreview) {
	
	ContainerWidget.prototype.template = orionPreview; 

	function ContainerWidget(args) { }
	
	function renderData(editorNode) {
		editorNode.innerHTML = this.template;
	}
	
	ContainerWidget.prototype.renderData = renderData;
	
	function getSelectedExclusions() {
		return [];
	}
	
	ContainerWidget.prototype.getSelectedExclusions = getSelectedExclusions;
	
	return ContainerWidget;
	
});