/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 ******************************************************************************/
/* eslint-env amd */
define({
	// Tern plugins
	'ternDocPluginName': 'Doc Comments',
	'ternDocPluginDescription': 'Tern plug-in to parse and use JSDoc-like comments for inferencing',
	'orionAMQPPluginName': 'Orion AMQP',
	'orionAMQPPluginDescription': 'Plug-in that contributes type information and code templates for AMQP.',
	'orionAngularPluginName': 'AngularJS',
	'orionAngularPluginDescription': 'Plug-in that contributes type information and code templates for AngularJS.',
	'orionComponentPluginName': 'ComponentJS',
	'orionComponentPluginDescription': 'Plug-in that contributes type information and code templates for ComponentJS.',
	'orionExpressPluginName': 'Orion ExpressJS',
	'orionExpressPluginDescription': 'Plug-in that contributes type information and code templates for ExpressJS.',
	'orionMongoDBPluginName': 'Orion MongoDB',
	'orionMongoDBPluginDescription': 'Plug-in that contributes type information and code templates for MongoDB.',
	'orionMySQLPluginName': 'Orion MySQL',
	'orionMySQLPluginDescription': 'Plug-in that contributes type information and code templates for MySQL.',
	'orionNodePluginName': 'Orion Node.js',
	'orionNodePluginDescription': 'Plug-in that contributes type information and code templates for Node.js.',
	'orionPostgresPluginName': 'Orion PostgreSQL',
	'orionPostgresPluginDescription': 'Plug-in that contributes type information and code templates for PostgreSQL.',
	'orionRequirePluginName': 'Orion RequireJS',
	'orionRequirePluginDescription': 'Plug-in that contributes type information and code templates for RequireJS.',
	'orionRedisPluginName': 'Orion Redis',
	'orionRedisPluginDescription': 'Plug-in that contributes type information and code templates for Redis.',
	'ternPluginsPluginName': 'Orion Tern Plug-in Support',
	'ternPluginsPluginDescription': 'Plug-in that allows Orion to inspect and modify plug-ins running in Tern.',
	'openImplPluginName': 'Orion Open Implementation Support',
	'openImplPluginDescription': 'Plug-in that allows Orion to try to find implementation locations of elements rather than simple declarations',
	'htmlDepPluginName': 'Orion HTML Dependency Analysis',
	'htmlDepPluginDescription': 'Resolves script block and script tag dependencies',
	'findTypesName': 'Orion References Support',
	'findTypesDescription': 'Plug-in that provides expanded type-finding support in Orion',

	// Other messages
	'unknownError': 'An unknown error occurred.',
	'failedDeleteRequest': 'Failed to delete file from Tern: ${0}',
	'failedReadRequest': 'Failed to read file into Tern: ${0}',
	'failedToComputeProposals': 'Failed to compute proposals',
	'failedToComputeProposalsNoServer': 'Failed to compute proposals, server not started',
	'failedToComputeDecl': 'Failed to compute declaration',
	'failedToComputeDeclNoServer': 'Failed to compute declaration, server not started',
	'failedToComputeImpl': 'Failed to compute implementation',
	'failedToComputeImplNoServer': 'Failed to compute implementation, server not started',
	'failedToComputeDoc': 'Failed to compute documentation',
	'failedToComputeDocNoServer': 'Failed to compute documentation, server not started',
	'failedToComputeOccurrences': 'Failed to compute occurrences',
	'failedToComputeOccurrencesNoServer': 'failed to compute occurrences, server not started',
	'failedGetInstalledPlugins': 'Failed to get installed plug-ins',
	'failedGetInstalledPluginsNoServer': 'Failed to get installed plug-ins, server not started',
	'failedInstallPlugins': 'Failed to install plug-ins',
	'failedInstallPluginsNoServer': 'Failed to install plug-ins, server not started',
	'failedRemovePlugins': 'Failed to remove plug-ins',
	'failedRemovePluginsNoServer': 'Failed to remove plug-ins, server not started',
	'failedEnablementPlugins': 'Failed to set enablement of plug-ins',
	'failedEnablementPluginsNoServer': 'Failed to set enablement of plug-ins, server not started',
	'failedGetEnvs': 'Failed to get contributed environments',
	'failedGetEnvsNoServer': 'Failed to get contributed environments, server not started',
	'failedRename': 'Failed to compute rename changes',
	'failedRenameNoServer': 'Failed to compute rename changes, server not started',
	'failedRefs': 'Failed to find refs',
	'failedRefsNoServer': 'failed to find refs - server not started',
	'failedType': 'Failed to find type',
	'unknownRequest': 'The request \'${0}\' is unknown',
	'serverNotStarted': 'The server has not been started. Request: \'${0}\'',
	'funcProposalDescription': ' - The name of the function',
	'funcParamProposalDescription': ' - Function parameter',
	'eslintRuleProposalDescripton': ' - ESLint rule',
	'eslintEnvProposalDescription': ' - ESLint environment name',
	'onlineDocumentationProposalEntry': '\n\n[Online documentation](${0})',
	'eslintRuleEnableDisable': ' - ESLint rule enable or disable',
	'eslintEnvDirective': ' - ESLint environment directive',
	'eslintRuleEnable': ' - ESLint rule enablement directive',
	'eslintRuleDisable': ' - ESLint rule disablement directive'
});