/*******************************************************************************
 * @license
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 * 				 Google Inc. - Casey Flynn (caseyflynn@google.com)
 ******************************************************************************/
/*eslint-env browser, amd, mocha*/
define([
	"chai/chai",
	"orion/bootstrap",
	'orion/serviceregistry',
	"orion/operationsClient",
	"orion/progress",
	"mocha/mocha"
], function(chai, mBootstrap, mServiceRegistry, mOperationsClient, mProgress) {
	var assert = chai.assert;

	describe("Operations Client", function() {
		it("Bug 510646", function(finished) {
			mBootstrap.startup().then(function(core) {
				var serviceRegistry = core.serviceRegistry;
				var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
				var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
				var operation = {};
				operation.Location = "/task/temp/bug510646";
				operation.expires = 0;
				operation.Name = "test";
				operation.progressMonitor = {};
				operation.progressMonitor.progress = function() {};
				progressService.writeOperation(0, operation);
				return operationsClient.removeCompletedOperations()
				.then(function() {
					return operationsClient.getOperations();
				})
				.then(function(operations) {
					assert.equal(Object.keys(operations).length, 0);
					finished();
				});
			})
		});
	});
});
