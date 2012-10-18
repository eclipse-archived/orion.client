/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets orion  window console define localStorage*/
/*jslint browser:true*/

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/widgets/settings/Select'], function(messages, require, dojo, dijit) {
	dojo.declare("orion.widgets.settings.LabeledSelect", [orion.widgets.settings.Select],{ //$NON-NLS-0$
		templateString: '<div class="setting-property">' +  //$NON-NLS-0$
							'<label>' + //$NON-NLS-0$
								'<span class="setting-label" data-dojo-attach-point="mylabel"></span>' + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
								'<select class="setting-control" data-dojo-attach-point="selection" data-dojo-attach-event="onchange:change"></select>' + //$NON-NLS-0$
							'</label>' +  //$NON-NLS-0$
						'</div>', //$NON-NLS-0$

		postCreate: function() {
			this.inherited(arguments);
			this.mylabel.textContent = this.fieldlabel + ':'; //$NON-NLS-0$
		}

	});
});