/*******************************************************************************
 * @license
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Casey Flynn - Google Inc. - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd, mocha*/
define(['chai/chai', 'orion/explorers/explorer-table'], 
			function(chai, mExplorer) {
	var assert = chai.assert;
	
	describe("Explorer Table Tests", function() {
		describe("File Filter Tests", function() {
			it("should construct a file filter with no arguments", function() {
				var filter = new mExplorer.FileFilter();
				assert.isNotNull(filter);
			});
			it("should correctly construct a file filter with resources", function() {
				var filteredResources = {".DS_STORE": true, "Hide.Me": true, ".*": true, "*.*": true};
				var expectedLookup = {".DS_STORE": true, "Hide.Me": true};
				var expectedFilter = [/^\..+$/, /^.+\..+$/];
				var actual = new mExplorer.FileFilter(filteredResources);
				assert.deepEqual(expectedLookup, actual.fileLookup_);
				assert.deepEqual(expectedFilter, actual.fileRegex_);
			});
			it("should return true if the value is an expression", function() {
				var filter = new mExplorer.FileFilter();
				var actual;
				actual = filter.isExpression_("*.*");
				assert.isTrue(actual);
				actual = filter.isExpression_(".*");
				assert.isTrue(actual);
				actual = filter.isExpression_("?someText?");
				assert.isTrue(actual);
			});
			it("should return false if the value is an expression", function() {
				var filter = new mExplorer.FileFilter();
				var actual;
				actual = filter.isExpression_(".DS_STORE");
				assert.isFalse(actual);
				actual = filter.isExpression_("");
				assert.isFalse(actual);
				actual = filter.isExpression_(null);
				assert.isFalse(actual);
				actual = filter.isExpression_("\[/}{)(^$");
				assert.isFalse(actual);
			});
			it("should correctly build a regular expression from a filter expression", function() {
				var filter = new mExplorer.FileFilter();
				var expected, actual;
				expected = /^\..+$/;
				actual = filter.buildExpression_(".*");
				assert.deepEqual(expected, actual);
				expected = /^.+\..+$/;
				actual = filter.buildExpression_("*.*");
				assert.deepEqual(expected, actual);
				expected = /^t.st\.file$/;
				actual = filter.buildExpression_("t?st.file");
				assert.deepEqual(expected, actual);
				expected = /^\[\]\(\)\{\}\,\^\$\|\#$/;
				actual = filter.buildExpression_("[](){},\^$|#");
				assert.deepEqual(expected, actual);
				expected = /^NoEscapedCharacters$/;
				actual = filter.buildExpression_("NoEscapedCharacters");
				assert.deepEqual(expected, actual);
			});
			it("should filter by regex correctly", function() {
				var filter = new mExplorer.FileFilter();
				filter.fileRegex_ = [/^\..+$/];
				assert.isTrue(filter.isFilteredByRegex_(".HiddenFile"));
				assert.isFalse(filter.isFilteredByRegex_("NotA.HiddenFile"));
				
			});
			it("should correctly filter files", function() {
				var filteredResources = {".DS_STORE": true, "Hide.Me": true, ".*": true, "t?st.txt": true};
				var actual = new mExplorer.FileFilter(filteredResources);
				assert.isTrue(actual.isFiltered(".DS_STORE"));
				assert.isTrue(actual.isFiltered("Hide.Me"));
				assert.isTrue(actual.isFiltered(".hiddenFile"));
				assert.isTrue(actual.isFiltered("test.txt"));
				assert.isTrue(actual.isFiltered("ttst.txt"));
				assert.isTrue(actual.isFiltered(".this^wouldn't$happen"));
				assert.isFalse(actual.isFiltered("not.hidden"));
				assert.isFalse(actual.isFiltered("21k@#$%^&(jnvs89"));
				assert.isFalse(actual.isFiltered(""));
			});
		});
	});
});