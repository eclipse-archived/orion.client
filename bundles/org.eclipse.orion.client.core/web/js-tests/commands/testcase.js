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

define(['require', 'dojo', 'orion/assert', 'orion/serviceregistry', 'orion/commands', 'orion/selection'], 
			function(require, dojo, assert, mServiceregistry, mCommands, mSelection) {
		
	/**
	 * mock services
	 */
	var serviceRegistry = new mServiceregistry.ServiceRegistry();
	var selectionService = new mSelection.Selection(serviceRegistry);
	var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selectionService});
	/**
	 * mock items
	 */
	 
	/**
	 * mock commands
	 */ 
	 
	var tests = {};
	
	/**
	 * Test rendering of atomic commands as buttons
	 */
	tests.renderAtomicButtons = function() {
		assert(commandService);
	};
	
	/**
	 * Test rendering of atomic commands as tools
	 */
	tests.renderAtomicTools = function() {
	};
	
	/**
	 * Test rendering mixed links and buttons
	 */
	tests.renderMixedLinksAndButtons = function() {
	};
	
	/**
	 * Test rendering mixed links and tools
	 */
	tests.renderMixedLinksAndTools = function() {
	};
	
	/**
	 * Test rendering of tools without images
	 */
	tests.renderMissingImageTools = function() {
	};
	
	/**
	 * Tests rendering a menu item
	 */
	tests.renderAtomicMenu = function() {
	};
	
	/**
	 * Test unnamed groups
	 */
	tests.renderUnnamedGroups = function() {
	};
	
	/**
	 * Test named groups produces a menu
	 */
	tests.renderNamedGroupDropDown = function() {
	};
	
	/**
	 * Test named group inside a menu
	 */
	tests.renderNamedGroupMenu = function() {
	};
	
	/**
	 * Test render nested groups
	 */
	tests.renderNestedGroups = function() {
	};
	
	/**
	 * Test no items match
	 */
	tests.noItemsValidate = function() {
	};	 
	
	/**
	 * Test selection service when no items
	 */
	tests.noItemsSpecified = function() {
	};	
	
	/**
	 * Test commandInvocation is unique
	 */
	tests.invokeCommandTwice = function() {
	};	
	
	/**
	 * Test original command parameters are stable
	 */
	tests.commandParametersLifeCycle = function() {
	};	
	
	/**
	 * Test key binding execution, rendered command
	 */
	tests.keyBindingRendered = function() {
	};	
	
	/**
	 * Test key binding execution, not rendered command
	 */
	tests.keyBindingNotRendered = function() {
	};
	
	/**
	 * Test key binding execution, rendered command
	 */
	tests.urlBindingRendered = function() {
	};	
	
	/**
	 * Test url binding execution, not rendered command
	 */
	tests.urlBindingNotRendered = function() {
	};	
	
	/**
	 * Test rendered in ul parent
	 */
	tests.renderInUl = function() {
	};	
	
	return tests;
});
