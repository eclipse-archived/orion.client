/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var testcase = function(assert) {
	var tests = {};


	for ( var i = 0; i < mapperTestCases.length; i++) {
		var testCase = mapperTestCases[i];
		var input = testCase[0];
		var diff = testCase[1];
		var expectedOutput = testCase[2];
		var expectedMapping = testCase[3];
		var description = testCase[4];
		var j = i + 1;
		
		// Note: This is not a great way to do tests. Each test should be separate
		tests["test " + j + ": " + description] = function(input, diff, expectedOutput, expectedMapping) {
			return function() {
				var diffParser = new eclipse.DiffParser("\r\n");
				var result = diffParser.parse(input, diff);
				assert.deepEqual(result.mapper, expectedMapping);
				assert.equal(result.outPutFile, expectedOutput);
			};				
		}(input, diff, expectedOutput, expectedMapping);
	}

	return tests;
}(orion.Assert);
