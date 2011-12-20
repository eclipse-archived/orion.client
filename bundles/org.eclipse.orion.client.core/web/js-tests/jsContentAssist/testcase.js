/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define orion */

define(["dojo", "orion/assert", "orion/editor/jsContentAssist"], function(dojo, assert, mContentAssist) {
	/**
	 * Helper function to invoke content assist on a given test case. The test case is a string that contains
	 * a special marker '@@@' indicating the cursor position. For example: "var x; x.@@@".
	 */
	function getKeywords(text) {
		var cursor = text.indexOf("@@@");
		if (cursor < 0) {
			assert.fail("Malformed js content assist test case: " + text);
			return;
		}
		var selection = {offset: cursor};
		var buffer = text.replace("@@@", "");
		//compute the prefix
		var index = cursor;
		var c;
		//prefix calculation logic copied from contentAssist.js
		while (index > 0 && ((97 <= (c=buffer.charCodeAt(index-1)) && c <= 122) || (65 <= c && c <= 90) || c === 95 || (48 <= c && c <= 57))) { //LETTER OR UNDERSCORE OR NUMBER
			--index;
		}
		var prefix = buffer.substring(index, cursor);
		var assist = new mContentAssist.JavaScriptContentAssistProvider();
		return assist.getKeywords(prefix, buffer, selection);
	}
	
	/**
	 * Asserts that a given proposal is present in a list of actual proposals. The test just ensures that an actual
	 * proposal starts with the expected value.
	 * @param expectedProposal {String} The expected proposal string
	 * @param actualProposals {Array} Array of string or Proposal objects
	 */
	function assertProposal(expectedProposal, actualProposals) {
		for (var i = 0; i < actualProposals.length; i++) {
			if (typeof(actualProposals[i]) === "string" && actualProposals[i].indexOf(expectedProposal) === 0) {
				return;
			}
			if (typeof(actualProposals[i].proposal) === "string" && actualProposals[i].proposal.indexOf(expectedProposal) === 0) {
				return;
			}
		}
		//we didn't find it, so fail
		assert.fail("Expected to find proposal \'" + expectedProposal + "\' in: " + actualProposals);
	}

	/**
	 * Asserts that a given proposal is NOT present in a list of actual proposals.
	 */
	function assertNoProposal(expectedProposal, actualProposals) {
		for (var i = 0; i < actualProposals.length; i++) {
			if (typeof(actualProposals[i]) === "string" && actualProposals[i].indexOf(expectedProposal) === 0) {
				assert.fail("Did not expect to find proposal \'" + expectedProposal + "\' in: " + actualProposals);
			}
			if (typeof(actualProposals[i].proposal) === "string" && actualProposals[i].proposal.indexOf(expectedProposal) === 0) {
				assert.fail("Did not expect to find proposal \'" + expectedProposal + "\' in: " + actualProposals);
			}
		}
		//we didn't find it, so pass
	}

	var tests = {};
	/**
	 * Test accessing members on a variable that we can't infer the type of.
	 */
	tests.testUnknownVariableFunctions = function() {
		var result = getKeywords("var x; x.@@@");
		assertProposal("toString", result);
		assertProposal("toLocaleString", result);
		assertProposal("valueOf", result);
		assertProposal("hasOwnProperty", result);
		assertProposal("isPrototypeOf", result);
		assertProposal("propertyIsEnumerable", result);
	};

	/**
	 * Test accessing members on a variable that we can't infer the type of, where there is a prefix
	 */
	tests.testUnknownVariableFunctionsWithPrefix = function() {
		var result = getKeywords("var x; x.to@@@");
		assertProposal("toString", result);
		assertProposal("toLocaleString", result);
		assertNoProposal("valueOf", result);
		assertNoProposal("hasOwnProperty", result);
		assertNoProposal("isPrototypeOf", result);
		assertNoProposal("propertyIsEnumerable", result);
	};

	/**
	 * Test accessing members on a variable that we can't infer the type of.
	 */
	tests.testUnknownArgumentFunctions = function() {
		var result = getKeywords("function x(a) {\n a.@@@");
		assertProposal("toString", result);
		assertProposal("toLocaleString", result);
		assertProposal("valueOf", result);
		assertProposal("hasOwnProperty", result);
		assertProposal("isPrototypeOf", result);
		assertProposal("propertyIsEnumerable", result);
	};

	/**
	 * Test accessing members on a variable that we can't infer the type of.
	 */
	tests.testTemplateInFunctionBody= function() {
		var result = getKeywords("function x(a) {\n @@@");
		assertNoProposal("toString", result);
		assertProposal("for", result);
		assertProposal("while", result);
		assertProposal("switch", result);
		assertProposal("try", result);
		assertProposal("if", result);
		assertProposal("do", result);
	};
	return tests;
});
