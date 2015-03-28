/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd, mocha*/
define([
	'chai/chai',
	'js-tests/core/config/mockPrefs',
	'orion/Deferred',
	'orion/serviceregistry',
	'orion/operationsClient',
], function(chai, MockPrefsService, Deferred, mServiceRegistry, mOperationsClient) {
	var assert = chai.assert;
	var PREFS_SERVICE = "orion.core.preference";

	var serviceRegistry, preferenceRegistration;

	var setUp = function() {
		serviceRegistry = new mServiceRegistry.ServiceRegistry();
		preferenceRegistration = serviceRegistry.registerService(PREFS_SERVICE, new MockPrefsService());
	};
	var tearDown = function() {
		preferenceRegistration.unregister();
		serviceRegistry = null;
	};

	describe("operationsClient", function() {
		beforeEach(setUp);
		afterEach(tearDown);
		
		it("basic operations", function () {
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var op1 = operationsClient.createOperation("basic", "loadend");
			assert.equal(op1.Name, "basic");
			assert.equal(op1.type, "loadend");
		});
		
		it("retrieve operation", function() {
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var op1 = operationsClient.createOperation("basic", "loadend");
			assert.ok(op1.Location);
			return operationsClient.getOperation(op1.Location).then(function(operation) {
				assert.equal(operation.Location, op1.Location);
				assert.equal(operation.Name, "basic");
				assert.equal(operation.type, "loadend");
			});
		});
		
		it("see all operations", function() {
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var op1 = operationsClient.createOperation("op1", "loadend");
			var op2 = operationsClient.createOperation("op2", "loadend");
			var op3 = operationsClient.createOperation("op3", "loadend");
			return operationsClient.getOperations().then(function(globalOperations) {
				var keys = globalOperations.keys();
				assert.equal(keys.length, 3);
			});
		});
		it("retrieve one from all operations", function() {
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var op1 = operationsClient.createOperation("op1", "loadend");
			var op2 = operationsClient.createOperation("op2", "loadend");
			var op3 = operationsClient.createOperation("op3", "loadend");
			var def = new Deferred();
			var result = def.then(function(operation) {
				assert.equal(operation.Location, op1.Location);
				assert.equal(operation.Name, "op1");
				assert.equal(operation.type, "loadend");
			});
			operationsClient.getOperations().then(function(globalOperations) {
				var keys = globalOperations.keys();
				assert.equal(keys.length, 3);
				operationsClient.getOperation(keys[0]).then(function(operation) {
					def.resolve(operation);
				});
			});
			return result;
		});
		it("remove one from all operations", function() {
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var op1 = operationsClient.createOperation("op1", "loadend");
			var op2 = operationsClient.createOperation("op2", "loadend");
			var op3 = operationsClient.createOperation("op3", "loadend");
			operationsClient.getOperations().then(function(globalOperations) {
				var keys = globalOperations.keys();
				assert.equal(keys.length, 3);
			});
			operationsClient.removeOperation(op2.Location).then(function(location) {
				assert.equal(op2.Location, location);
			});
			return operationsClient.getOperations().then(function(globalOperations) {
				var keys = globalOperations.keys();
				assert.equal(keys.length, 2);
			});
		});
		it("remove no completed operations", function() {
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var op1 = operationsClient.createOperation("op1", "loadstart");
			var op2 = operationsClient.createOperation("op2", "loadstart");
			var op3 = operationsClient.createOperation("op3", "loadstart");
			var def = new Deferred();
			var result = def.then(function(keys) {
				assert.equal(3, keys.length);
			});
			operationsClient.removeCompletedOperations().then(function() {
				operationsClient.getOperations().then(function(globalOperations) {
					var keys = globalOperations.keys();
					def.resolve(keys);
				});
			});
			return result;
		});
		it("remove one completed operations", function() {
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var op1 = operationsClient.createOperation("op1", "loadstart");
			var op2 = operationsClient.createOperation("op2", "loadend");
			var op3 = operationsClient.createOperation("op3", "loadstart");
			var def = new Deferred();
			var result = def.then(function(keys) {
				assert.equal(2, keys.length);
			});
			operationsClient.removeCompletedOperations().then(function() {
				operationsClient.getOperations().then(function(globalOperations) {
					var keys = globalOperations.keys();
					def.resolve(keys);
				});
			});
			return result;
		});
		it("remove all completed operations", function() {
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var op1 = operationsClient.createOperation("op1", "loadend");
			var op2 = operationsClient.createOperation("op2", "loadend");
			var op3 = operationsClient.createOperation("op3", "loadend");
			operationsClient.getOperations().then(function(globalOperations) {
				var keys = globalOperations.keys();
				assert.equal(keys.length, 3);
			});
			var def = new Deferred();
			var result = def.then(function(keys) {
				assert.equal(0, keys.length);
			});
			operationsClient.removeCompletedOperations().then(function() {
				operationsClient.getOperations().then(function(globalOperations) {
					var keys = globalOperations.keys();
					def.resolve(keys);
				});
			});
			return result;
		});
	}); // operationsClient
});
