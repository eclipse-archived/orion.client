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
/*global define dojo dijit orion window document */

define(['require', 'dojo', 'dijit', 'orion/assert', 'orion/serviceregistry', 'orion/commands', 'orion/extensionCommands'], 
			function(require, dojo, dijit, assert, mServiceregistry, mCommands, mExtensionCommands) {
			
	/**
	 * mock services
	 */
	var serviceRegistry = new mServiceregistry.ServiceRegistry();
	var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
	
	/**
	 * mock content types cache
	 */
	var contentTypesCache = [];
	
	/**
	 * mock items
	 */
	var item1 = {
		Name: "Foo",
		Location: "/file/foo/bar/Foo"
	};
	item1.SubObject = {SecondaryLocation: "/secondary/file/foo/bar/Foo"};
	
	var item2 = {
		Name: "Bar",
		AlternateLocation: "/alternate/file/foo/bar/Bar"
	};
	item2.SubObject = {SecondaryAlternateLocation: "http://example.com/secondary/alternate/file/foo/bar/Foo.Secondary"};
	
	/**
	 * helpers
	 */
	function makeInfo(validationProperty, uriTemplate) {
		var info = {};
		if (dojo.isArray(validationProperty)) {
			info.validationProperties = validationProperty;
		} else {
			info.validationProperties = [validationProperty];
		}
		info.name = "TestExtension";
		info.uriTemplate = uriTemplate;
		return info;
	}
	
	var tests = {};


	/**
	 * Test validation property, presence only.
	 */
	tests.testSimpleValidationProperty = function() {
		var validationProperty = {
			source: "Location"
		};
		var validator = mExtensionCommands._makeValidator(makeInfo(validationProperty), serviceRegistry, contentTypesCache);
		assert.equal(validator.validationFunction(item1), true);
		assert.equal(validator.validationFunction(item2), false);
	};
	
	/**
	 * Test OR in validation property.
	 */
	tests.testSimpleValidationProperty = function() {
		var validationProperty = {
			source: "Location|AlternateLocation"
		};
		var validator = mExtensionCommands._makeValidator(makeInfo(validationProperty), serviceRegistry, contentTypesCache);
		assert.equal(validator.validationFunction(item1), true);
		assert.equal(validator.validationFunction(item2), true);
	};	
	
	/**
	 * Test nested validation property.
	 */
	tests.testSimpleValidationProperty = function() {
		var validationProperty = {
			source: "SubObject:SecondaryLocation"
		};
		var validator = mExtensionCommands._makeValidator(makeInfo(validationProperty), serviceRegistry, contentTypesCache);
		assert.equal(validator.validationFunction(item1), true);
		assert.equal(validator.validationFunction(item2), false);
	};	
	
	/**
	 * Test combinations of nested properties and OR properties
	 */
	tests.testSimpleValidationProperty = function() {
		var validationProperty = {
			source: "SubObject:SecondaryLocation|AlternateLocation"
		};
		var validator = mExtensionCommands._makeValidator(makeInfo(validationProperty), serviceRegistry, contentTypesCache);
		assert.equal(validator.validationFunction(item1), true);
		assert.equal(validator.validationFunction(item2), true);
		validationProperty = {
			source: "AlternateLocation|SubObject:SecondaryLocation"
		};
		validator = mExtensionCommands._makeValidator(makeInfo(validationProperty), serviceRegistry, contentTypesCache);
		assert.equal(validator.validationFunction(item1), true);
		assert.equal(validator.validationFunction(item2), true);
		validationProperty = {
			source: "SubObject:SecondaryAlternateLocation|SubObject:SecondaryLocation"
		};
		validator = mExtensionCommands._makeValidator(makeInfo(validationProperty), serviceRegistry, contentTypesCache);
		assert.equal(validator.validationFunction(item1), true);
		assert.equal(validator.validationFunction(item2), true);
	};	
	return tests;
});
