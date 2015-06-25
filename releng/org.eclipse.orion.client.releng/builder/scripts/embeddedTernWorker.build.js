/*******************************************************************************
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
({
	baseUrl: ".", //$NON-NLS-1$
	paths: {
		text: "requirejs/text", //$NON-NLS-1$
		esprima: "esprima/esprima", //$NON-NLS-1$
		estraverse: "estraverse/estraverse", //$NON-NLS-1$
		escope: "escope/escope", //$NON-NLS-1$
		logger: "javascript/logger", //$NON-NLS-1$
		doctrine: 'doctrine/doctrine', //$NON-NLS-1$
		i18n: "requirejs/i18n" //$NON-NLS-1$
	},
	packages: [
		{
			name: "eslint/conf", //$NON-NLS-1$
			location: "eslint/conf" //$NON-NLS-1$
		},
		{
			name: "eslint", //$NON-NLS-1$
			location: "eslint/lib", //$NON-NLS-1$
			main: "eslint" //$NON-NLS-1$
		},
	],
	name: "javascript/plugins/ternWorkerCore",
	wrap: {
		start: "importScripts('../../requirejs/require.min.js');\n",
		end: ""
	}
})
