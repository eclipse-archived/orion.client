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
/*global define orion window document */

define(['require', 'orion/assert', 'orion/serviceregistry', 'orion/commands', 'orion/selection', 'orion/Deferred', 'orion/webui/littlelib', 'orion/webui/dropdown'], 
			function(require, assert, mServiceregistry, mCommands, mSelection, Deferred, lib, mDropdown) {
			
	/**
	 * dom elements we need
	 */
	var parentDiv = document.createElement("div");
	var parentUl = document.createElement("ul");
	var menuDiv = document.createElement("div");
	document.body.appendChild(menuDiv);
	var dropdownTrigger = document.createElement("span");
	menuDiv.appendChild(dropdownTrigger);
	dropdownTrigger.classList.add("dropdownTrigger");
	dropdownTrigger.classList.add("commandButton");
	var dropdownMenu = document.createElement("ul");
	menuDiv.appendChild(dropdownMenu);
	dropdownMenu.classList.add("dropdownMenu");
	var parentMenu = new mDropdown.Dropdown({dropdown: dropdownMenu});
		
	/**
	 * mock services
	 */
	var serviceRegistry = new mServiceregistry.ServiceRegistry();
	var selectionService = new mSelection.Selection(serviceRegistry);
	var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selectionService});
	
	/**
	 * mock items
	 */
	var item1 = {
		Name: "Foo",
		Description: "I am Foo",
		IsValid: true
	};
	
	var item2 = {
		Name: "Bar",
		Description: "I am Bar",
		IsValid: true
	};
	
	var item3 = {
		Name: "Baz",
		Description: "I am Baz",
		IsValid: true
	};
	
	var allItems = [item1, item2, item3];
	selectionService.setSelections([item1, item2]);
	
	function initializeItems() {
		item1.IsValid = true;
		item2.IsValid = true;
		item3.IsValid = true;
	}
	
	/**
	 * helpers
	 */
	var isMac = window.navigator.platform.indexOf("Mac") !== -1;

	var visibleWhenAllValid = function(items) {
		if (Array.isArray(items)) {
			for (var i=0; i<items.length; i++) {
				if (!items[0].IsValid) {
					return false;
				}
			}
			return true;
		} else {
			return items.IsValid;
		}
	};
	
	var visibleWhenOnlyOne = function(items) {
		if (Array.isArray(items)) {
			return items.length === 1 && items[0].IsValid;
		} else {
			return items.IsValid;
		}
	};
	 
	var hitCounters = {};
	
	function hitCommand(id) {
		if (hitCounters[id]) {
			hitCounters[id] = hitCounters[id] + 1;
		} else {
			hitCounters[id] = 1;
		}
	}
	
	function fakeKeystroke(keyCode, mod1, mod2, mod3, mod4) {
		// We implement only the parts of event we know that the command framework uses.
		var event = {target: parentDiv};
		event.preventDefault = function() {};		
		event.stopPropagation = function() {};
		if (typeof(keyCode) === "string") {
			event.keyCode = keyCode.toUpperCase().charCodeAt(0);
		} else {
			event.keyCode = keyCode;
		} 
		if (isMac) {
			event.metaKey = !!mod1;
			event.ctrlKey = !!mod4;
		} else {
			event.ctrlKey = !!mod1;
		}
		event.shiftKey = !!mod2;
		event.altKey = !!mod3;
		commandService._processKey(event);
	}
	
	
	 
	/**
	 * mock commands
	 */ 
	 
	 var deleteCommand = new mCommands.Command({
		name: "Delete",
		tooltip: "Delete the selected items",
		imageClass: "core-sprite-delete",
		id: "test.delete",
		visibleWhen: visibleWhenAllValid,
		callback: function(data) {
			hitCommand("test.delete");		
		}
	});
	commandService.addCommand(deleteCommand);
	
	var newCommand = new mCommands.Command({
		name: "New",
		tooltip: "Make a new thing",
		imageClass: "core-sprite-delete",
		id: "test.new",
		visibleWhen: visibleWhenOnlyOne,
		callback: function(data) {
			hitCommand("test.new");		
		}
	});
	commandService.addCommand(newCommand);
	
	var noIconCommand = new mCommands.Command({
		name: "No Icon",
		tooltip: "This thing has no icon",
		id: "test.noIcon",
		visibleWhen: visibleWhenAllValid,
		callback: function(data) {
			hitCommand("test.noIcon");		
		}
	});
	commandService.addCommand(noIconCommand);
	
	var linkCommand = new mCommands.Command({
		name: "Link",
		tooltip: "This thing is a link",
		id: "test.link",
		visibleWhen: visibleWhenOnlyOne,
		hrefCallback: function(data) {
			hitCommand("test.link");
			return "/foo.html";
		}
	});
	commandService.addCommand(linkCommand);
	
	var parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('name', 'text', 'Name:', 'New Thing')]);
	parameters.cumulativeCount = 0;
	var lastCommandInvocation;
	var commandWithParameters = new mCommands.Command({
		name: "Parameters",
		tooltip: "I have parameters",
		id: "test.parameters",
		parameters: parameters,
		visibleWhen: visibleWhenOnlyOne,
		callback: function(data) {
			hitCommand("test.parameters");
			assert.notStrictEqual(data.parameter, parameters);
			assert.notStrictEqual(data, lastCommandInvocation);
			assert.strictEqual(data.command.parameters, parameters);
			parameters.cumulativeCount++;
			parameters.lastValueForName = data.parameters.valueFor("name");
		}
	});
	commandService.addCommand(commandWithParameters);

	var tests = {};

	var contributionId;
	
	function init(testId) {
		window.console.log("Initializing data for test " + testId);
		contributionId = testId;
		parentMenu.empty();
		commandService.destroy(parentDiv);
		commandService.destroy(parentUl);
		initializeItems();
	}
	
	/**
	 * Test rendering of atomic commands as buttons
	 */
	tests.testRenderAtomicButtons = function() {
		init("testRenderAtomicButtons");
		commandService.registerCommandContribution(contributionId, "test.delete", 1);
		commandService.registerCommandContribution(contributionId, "test.new", 2);
		commandService.renderCommands(contributionId, parentDiv, item1, window, "button");
		assert.equal(parentDiv.childNodes.length, 2);
	};
	
	/**
	 * Test rendering of atomic commands as tools
	 */
	tests.testRenderAtomicTools = function() {
		init("testRenderAtomicTools");
		commandService.registerCommandContribution(contributionId, "test.delete", 1);
		commandService.registerCommandContribution(contributionId, "test.new", 2);
		commandService.renderCommands(contributionId, parentDiv, item1, window, "tool");
		assert.equal(parentDiv.childNodes.length, 2);
	};
	
	/**
	 * Test rendering mixed links and buttons
	 */
	tests.testRenderMixedLinksAndButtons = function() {
		init("testRenderMixedLinksAndButtons");
		commandService.registerCommandContribution(contributionId, "test.delete", 1);
		commandService.registerCommandContribution(contributionId, "test.new", 2);
		commandService.registerCommandContribution(contributionId, "test.link", 3);
		commandService.renderCommands(contributionId, parentDiv, item1, window, "button");
		assert.equal(parentDiv.childNodes.length, 3);
		assert.equal(lib.$$("a", parentDiv).length, 1);
	};
	
	/**
	 * Test rendering mixed links and tools
	 */
	tests.testRenderMixedLinksAndTools = function() {
		init("testRenderMixedLinksAndTools");
		commandService.registerCommandContribution(contributionId, "test.delete", 1);
		commandService.registerCommandContribution(contributionId, "test.new", 2);
		commandService.registerCommandContribution(contributionId, "test.link", 3);
		commandService.renderCommands(contributionId, parentDiv, item1, window, "tool");
		assert.equal(parentDiv.childNodes.length, 3);
		assert.equal(lib.$$("a", parentDiv).length, 1);
	};
	
	/**
	 * Test rendering of tools without images
	 */
	tests.testRenderMissingImageTools = function() {
		init("testRenderMissingImageTools");
		commandService.registerCommandContribution(contributionId, "test.delete", 1);
		commandService.registerCommandContribution(contributionId, "test.noIcon", 3);
		commandService.renderCommands(contributionId, parentDiv, allItems, window, "tool");
		assert.equal(parentDiv.childNodes.length, 2);
		assert.equal(lib.$$(".commandSprite", parentDiv).length, 1);
		assert.equal(lib.$$(".commandMissingImageButton", parentDiv).length, 1);
	};
	
	/**
	 * Tests rendering a menu item
	 */
	tests.testRenderAtomicMenu = function() {
		init("testRenderAtomicMenu");
		commandService.registerCommandContribution(contributionId, "test.delete", 1);
		commandService.registerCommandContribution(contributionId, "test.new", 2);
		commandService.registerCommandContribution(contributionId, "test.noIcon", 3);
		commandService.renderCommands(contributionId, dropdownMenu, item1, window, "menu");
		assert.equal(parentMenu.getItems().length, 3);
	};
	
	/**
	 * Test unnamed groups
	 */
	tests.testRenderUnnamedGroups = function() {
		init("testRenderUnnamedGroups");
		commandService.addCommandGroup(contributionId, "testGroup", 1);
		commandService.addCommandGroup(contributionId, "testGroup2", 2);
		commandService.registerCommandContribution(contributionId, "test.delete", 1, "testGroup");
		commandService.registerCommandContribution(contributionId, "test.new", 2, "testGroup");
		commandService.registerCommandContribution(contributionId, "test.noIcon", 1, "testGroup2");
		commandService.renderCommands(contributionId, parentDiv, item1, window, "button");
		assert.equal(lib.$$(".commandSeparator", parentDiv).length, 1);
	};
	
	/**
	 * Test named groups produces a menu
	 */
	tests.testRenderNamedGroupDropDown = function() {
		init("testRenderUnnamedGroups");
		commandService.addCommandGroup(contributionId, "testGroup", 1, "Menu");
		commandService.registerCommandContribution(contributionId, "test.delete", 1, "testGroup");
		commandService.registerCommandContribution(contributionId, "test.new", 2, "testGroup");
		commandService.registerCommandContribution(contributionId, "test.noIcon", 3, "testGroup");
		commandService.renderCommands(contributionId, parentDiv, item1, window, "button");
		assert.equal(lib.$$(".commandButton.dropdownTrigger", parentDiv).length, 1);
	};
	
	/**
	 * Test named group inside a menu
	 */
	tests.testRenderNamedGroupMenu = function() {
		init("testRenderNamedGroupMenu");
		commandService.addCommandGroup(contributionId, "testGroup", 1, "SubMenu");
		commandService.registerCommandContribution(contributionId, "test.delete", 1, "testGroup");
		commandService.registerCommandContribution(contributionId, "test.new", 2, "testGroup");
		commandService.registerCommandContribution(contributionId, "test.noIcon", 3, "testGroup");
		commandService.renderCommands(contributionId, dropdownMenu, item1, window, "menu");
		assert.equal(parentMenu.getItems().length, 1);  // everything is in a submenu
	};
	
	/**
	 * Test render nested groups
	 */
	tests.testRenderNestedGroups = function() {
		init("testRenderNestedGroupsMenu");
		commandService.addCommandGroup(contributionId, "testGroup", 1, "Menu");
		commandService.addCommandGroup(contributionId, "testGroup2", 1, "SubMenu", "testGroup");
		commandService.addCommandGroup(contributionId, "testGroup3", 1, "SubSubMenu", "testGroup/testGroup2");
		commandService.registerCommandContribution(contributionId, "test.delete", 1, "testGroup");
		commandService.registerCommandContribution(contributionId, "test.new", 2, "testGroup/testGroup2");
		commandService.registerCommandContribution(contributionId, "test.noIcon", 3, "testGroup/testGroup2/testGroup3");
		commandService.renderCommands(contributionId, menuDiv, item1, window, "menu");
		assert.equal(lib.$$(".dropdownTrigger", menuDiv).length, 4);  // four menus
		assert.equal(lib.$$(".dropdownTrigger.dropdownMenuItem", menuDiv).length, 3);  // three sub menus
		assert.equal(lib.$$(".dropdownTrigger.commandButton", menuDiv).length, 1);  // one top menu
	};
	
	/**
	 * Test no items match
	 */
	tests.testNoItemsValidate = function() {
		init("testNoItemsValidate");
		item1.IsValid = false;
		item2.IsValid = false;
		item3.IsValid = false;
		commandService.registerCommandContribution(contributionId, "test.delete", 1);
		commandService.registerCommandContribution(contributionId, "test.new", 2);
		commandService.registerCommandContribution(contributionId, "test.link", 3);
		commandService.renderCommands(contributionId, parentDiv, allItems, window, "button");
		assert.equal(parentDiv.childNodes.length, 0);
	};	 
	
	/**
	 * Test selection service when no items
	 */
	tests.testNoItemsSpecified = function() {
		init("testNoItemsSpecified");
		commandService.registerCommandContribution(contributionId, "test.delete", 1);
		commandService.registerCommandContribution(contributionId, "test.noIcon", 2);
		commandService.registerCommandContribution(contributionId, "test.link", 3);
		commandService.renderCommands(contributionId, parentDiv, null, window, "button");
		assert.equal(parentDiv.childNodes.length, 2);  // selection service had two items in it so only two commands (delete and noIcon) validated against it
	};	
	
		/**
	 * Test rendered in ul parent
	 */
	tests.testRenderInUl = function() {
		init("testRenderInUl");
		commandService.registerCommandContribution(contributionId, "test.delete", 1);
		commandService.registerCommandContribution(contributionId, "test.new", 2);
		commandService.registerCommandContribution(contributionId, "test.link", 3);
		commandService.renderCommands(contributionId, parentUl, item1, window, "button");
		assert.equal(lib.$$("a", parentUl).length, 1);
		assert.equal(lib.$$("li > a", parentUl).length, 1);
		assert.equal(parentUl.childNodes.length, 3);
		assert.equal(lib.$$("li", parentUl).length, 3);
	};	
	
	/**
	 * Test life cycle of parameters and invocations
	 */
	tests.testCommandParametersLifeCycle = function() {
		init("testCommandParametersLifeCycle");
		// URL binding is so we know we have a saved invocation for the test.
		commandService.registerCommandContribution(contributionId, "test.parameters", 1, null, false, null,  new mCommands.URLBinding("foo", "name"));
		commandService.renderCommands(contributionId, parentDiv, item1, window, "button");
		hitCounters = {};
		commandService.runCommand("test.parameters");
		commandService.runCommand("test.parameters");
		var d = new Deferred();
		window.setTimeout(function(){
			try {
				assert.equal(hitCounters["test.parameters"], 2);
				assert.equal(parameters.cumulativeCount, 2);
				d.resolve();
			} catch (e) {
				d.reject(e);			
			}
		}, 500);
		return d;
		// running the command has assertions built in for lifecycle
		
	};	
	
	/**
	 * Test key binding execution, rendered command
	 */
	tests.testKeyBindingRendered = function() {
		init("testKeyBindingRendered");
		commandService.registerCommandContribution(contributionId, "test.delete", 1, null, false, new mCommands.CommandKeyBinding('z'));
		commandService.renderCommands(contributionId, parentDiv, allItems, window, "button");
		assert.equal(parentDiv.childNodes.length, 1);
		hitCounters["test.delete"] = 0;
		fakeKeystroke('z');
		var d = new Deferred();
		window.setTimeout(function(){
			try {
				assert.equal(hitCounters["test.delete"], 1);
				d.resolve();
			} catch (e) {
				d.reject(e);			
			}
		}, 500);
		return d;
	};	
	
	/**
	 * Test key binding execution, not rendered command
	 */
	tests.testKeyBindingNotRendered = function() {
		init("testKeyBindingNotRendered");
		commandService.registerCommandContribution(contributionId, "test.noIcon", 1, null, true, new mCommands.CommandKeyBinding('z', true, true));
		commandService.renderCommands(contributionId, parentDiv, item1, window, "button");
		assert.equal(parentDiv.childNodes.length, 0);
		hitCounters["test.noIcon"] = 0;
		fakeKeystroke('z', true, true);
		var d = new Deferred();
		window.setTimeout(function(){
			try {
				assert.equal(hitCounters["test.noIcon"], 1);
				d.resolve();
			} catch (e) {
				d.reject(e);			
			}
		}, 1000);
		return d;
	};
	
	/**
	 * Test key binding execution, rendered command
	 */
	tests.testUrlBindingRendered = function() {
		init("testUrlBindingRendered");
		commandService.registerCommandContribution(contributionId, "test.new", 1, null, false, null, new mCommands.URLBinding("foo", "name"));
		commandService.renderCommands(contributionId, parentDiv, item1, window, "button");
		assert.equal(parentDiv.childNodes.length, 1);
		commandService.processURL("#,foo=fred");
		var d = new Deferred();
		window.setTimeout(function(){
			try {
				assert.equal(parameters.lastValueForName, "fred");
				d.resolve();
			} catch (e) {
				d.reject(e);			
			}
		}, 500);
		return d;		
	};	
	
	/* for testing the unit test page, uncomment when we need to see failures 
	tests.testFailOnPurpose = function() {
		assert.equal(1,2);
	};
	*/
	
	/**
	 * Test url binding execution, not rendered command
	 */
	tests.testUrlBindingNotRendered = function() {
		init("testUrlBindingNotRendered");
		commandService.registerCommandContribution(contributionId, "test.new", 1, null, true, null, new mCommands.URLBinding("foo", "name"));
		commandService.renderCommands(contributionId, parentDiv, item1, window, "button");
		assert.equal(parentDiv.childNodes.length, 0);
		commandService.processURL("#,foo=wilma");
		var d = new Deferred();
		window.setTimeout(function(){
			try {
				assert.equal(parameters.lastValueForName, "wilma");
				d.resolve();
			} catch (e) {
				d.reject(e);			
			}
		}, 1000);
		return d;
	};	
	
	return tests;
});
