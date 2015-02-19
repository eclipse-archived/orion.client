/******************************************************************************* 
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/
/*eslint-env amd, browser, mocha*/
define([
	"chai/chai",
	"js-tests/editor/mockTextView",
	"orion/editor/textStyler",
	"js-tests/editor/textStyler/c/tests",
	"js-tests/editor/textStyler/cpp/tests",
	"js-tests/editor/textStyler/csharp/tests",
	"js-tests/editor/textStyler/cshtml/tests",
	"js-tests/editor/textStyler/css/tests",
	"js-tests/editor/textStyler/dockerfile/tests",
	"js-tests/editor/textStyler/ejs/tests",
	"js-tests/editor/textStyler/erlang/tests",
	"js-tests/editor/textStyler/go/tests",
	"js-tests/editor/textStyler/haml/tests",
	"js-tests/editor/textStyler/html/tests",
	"js-tests/editor/textStyler/jade/tests",
	"js-tests/editor/textStyler/java/tests",
	"js-tests/editor/textStyler/js/tests",
	"js-tests/editor/textStyler/json/tests",
	"js-tests/editor/textStyler/jsp/tests",
	"js-tests/editor/textStyler/lua/tests",
	"js-tests/editor/textStyler/objectiveC/tests",
	"js-tests/editor/textStyler/php/tests",
	"js-tests/editor/textStyler/python/tests",
	"js-tests/editor/textStyler/ruby/tests",
	"js-tests/editor/textStyler/swift/tests",
	"js-tests/editor/textStyler/vb/tests",
	"js-tests/editor/textStyler/vbhtml/tests",
	"js-tests/editor/textStyler/xml/tests",
	"js-tests/editor/textStyler/xquery/tests",
	"js-tests/editor/textStyler/yaml/tests"	
], function(chai, mMockTextView, mTextStyler,
	cTests, cppTests, csharpTests, cshtmlTests, cssTests, dockerfileTests, ejsTests, erlangTests, goTests, hamlTests, htmlTests, jadeTests, javaTests,
	jsTests, jsonTests, jspTests, luaTests, objectiveCTests, phpTests, pythonTests, rubyTests, swiftTests, vbTests, vbhtmlTests, xmlTests, xqueryTests, yamlTests) {

	var tests = [
//		cTests,
//		cppTests,
//		csharpTests,
//		cshtmlTests,
		cssTests,
//		dockerfileTests,
//		ejsTests,
//		erlangTests,
//		goTests,
//		hamlTests,
		htmlTests,
//		jadeTests,
		javaTests,
		jsTests,
//		jsonTests,
//		jspTests,
//		luaTests,
//		objectiveCTests,
//		phpTests,
//		pythonTests,
//		rubyTests,
//		swiftTests,
//		vbTests,
//		vbhtmlTests,
//		xmlTests,
//		xqueryTests,
//		yamlTests
	];

	var assert = chai.assert;
	var view;

	describe("TextStyler", function() {
		beforeEach(setup);
		afterEach(teardown);
		
		tests.forEach(function(current) {
			describe(current.mimeType, function() {
				testInitialStyles(current);
				if (current.doMoreTests) {
					current.doMoreTests();
				}
			});
		});
	});

	function compareStyles(computedStyles, expectedStyles) {
		if (computedStyles.length !== expectedStyles.length) {
			return false;
		}
		for (var i = 0; i < computedStyles.length; i++) {
			if (computedStyles[i].start !== expectedStyles[i].start ||
				computedStyles[i].end !== expectedStyles[i].end ||
				computedStyles[i].contentStart !== expectedStyles[i].contentStart ||
				computedStyles[i].contentEnd !== expectedStyles[i].contentEnd ||
				computedStyles[i].name !== expectedStyles[i].name) {
					return false;
			}
		}
		return true;
	}

	function getStyles(block, _styles, output) {
		var style = {
			start: block.start,
			end: block.end,
			contentStart: block.contentStart,
			contentEnd: block.contentEnd,
			name: block.name
		};
		if (output) {
			window.console.log(JSON.stringify(style));
		}
		_styles.push(style);
		var children = block.getBlocks();
		children.forEach(function(current) {
			getStyles(current, _styles, output);
		});
	}

	function setup() {
		var options = {parent: "editorDiv", readonly: true};
		view = new mMockTextView.MockTextView(options);
	}

	function teardown() {
		view = null;
	}

	function testInitialStyles(test) {
		it("Initial Styles", function() {
			var stylerAdapter = new mTextStyler.createPatternBasedAdapter(test.grammar.grammars, test.grammar.id, test.mimeType);
			var styler = new mTextStyler.TextStyler(view, /*annotationModel*/undefined, stylerAdapter);
			view.setText(test.testText);
			var rootBlock = styler.getRootBlock();
			var styles = [];
			getStyles(rootBlock, styles, test.outputStyles);
			if (!test.outputStyles) {
				assert.equal(compareStyles(styles, test.expectedStyles), true);
			} else {
				assert.equal(false, true, "Computed styles were output, so no expected style comparisons were made");
			}
		});
	}
});
