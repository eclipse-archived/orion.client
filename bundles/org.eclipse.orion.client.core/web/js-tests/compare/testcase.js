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


define(["orion/assert", "orion/compare/diff-parser", "./mapper-test-data", 'jsdiff/diff'], function(assert, mDiffParser, mMapperTestData) {
	var tests = {};
	var mapperTestCases = mMapperTestData.mapperTestCases;

	var _inTestArray = function(testDataIndexs, index){
		var ret = false;
		for(var k = 0; k < testDataIndexs.length; k++){
			if(testDataIndexs[k] === index){
				return true;
			}
		}
		return false;
	};
	
	var testMapper = function (testData, testOnly, skipTest){
		for ( var i = 0; i < testData.length; i++) {
			if(testOnly){
				if(!_inTestArray(testOnly, i)){
					continue;
				}
			} else if(skipTest){
				if(_inTestArray(skipTest, i)){
					continue;
				}
			}
			var testCase = testData[i];
			var input = testCase[0];
			var diff = testCase[1];
			var expectedOutput = testCase[2];
			var expectedMapping = testCase[3];
			var description = testCase[4];
			var j = i + 1;
			
			// Note: This is not a great way to do tests. Each test should be separate
			tests["test " + j + ": " + description] = function(input, diff, expectedOutput, expectedMapping) {
				return function() {
					var diffParser = new mDiffParser.DiffParser("\n");
					var result = diffParser.parse(input, diff);
					assert.deepEqual(result.mapper, expectedMapping);
					assert.equal(result.outPutFile, expectedOutput);
				};				
			}(input, diff, expectedOutput, expectedMapping);
		}
	};
	
	var _mapperPartialEqual = function(mapper, expectedMapper){
		if(mapper.length !== expectedMapper.length){
			throw new assert.AssertionError({
				message :  "mapper failed at total length",
				expected : expectedMapper,
				actual : mapper
			});
			return;
		}
		for(var i = 0; i < mapper.length; i++ ){
			for(var j= 0; j < 3; j++){
				if(j < 2 || ( j === 2 && expectedMapper[i][j] < 1) ){
					if(mapper[i][j] !== expectedMapper[i][j]){
						throw new assert.AssertionError({
							message :  "mapper failed at index " + i,
							expected : expectedMapper,
							actual : mapper
						});
						return;
					}
				}
			}
		}
	};
	
	var testJSDiff = function (testData, testOnly, skipTest){
		for ( var i = 0; i < testData.length; i++) {
			if(testOnly){
				if(!_inTestArray(testOnly, i)){
					continue;
				}
			} else if(skipTest){
				if(_inTestArray(skipTest, i)){
					continue;
				}
			}
			var testCase = testData[i];
			var input = testCase[0];
			var expectedOutput = testCase[2];
			var diff = JsDiff.createPatch("foo", input.split("\r").join(""), expectedOutput.split("\r").join(""), "", "") ;			
			var expectedMapping = testCase[3];
			var description = testCase[4];
			var j = i + 1;
			
			// Note: This is not a great way to do tests. Each test should be separate
			tests["test jsDiff " + j + ": " + description] = function(input, diff, expectedOutput, expectedMapping) {
				return function() {
					var diffParser = new mDiffParser.DiffParser("\n");
					//console.log("\n\nDiff:\n");
					//console.log(diff);
					var result = diffParser.parse(input, diff, false,true);
					_mapperPartialEqual(result.mapper, expectedMapping);
				};				
			}(input, diff, expectedOutput, expectedMapping);
		}
		
	};
	
	testMapper(mapperTestCases);
	testJSDiff(mapperTestCases, null, [23,29,39,40]);
	
	tests["test empty case"] = function() {
		var input = "";
		var diff = "";
		var expectedOutput = "";
		var expectedMapping = [];

		var diffParser = new mDiffParser.DiffParser();
		var result = diffParser.parse(input, diff);
		assert.deepEqual(result.mapper, expectedMapping);
		assert.equal(result.outPutFile, expectedOutput);
	};
	

	tests["test add 1 empty line to empty file"] = function() {
		var input = "";
		var diff = "@@ -0,0 +1 @@\r\n" + 
		  "+\r\n" + 
		  "";
		var expectedOutput = "\r\n" +
		  "";
		var expectedMapping = [[1, 0, 2]];

		var diffParser = new mDiffParser.DiffParser();
		var result = diffParser.parse(input, diff);
		assert.deepEqual(result.mapper, expectedMapping);
		assert.equal(result.outPutFile, expectedOutput);
	};
	

	tests["test add 2 empty lines to empty file"] = function() {
		var input = "";
		
		var diff = "@@ -0,0 +1,2 @@\r\n" + 
		  "+\r\n" + 
		  "+\r\n" + 
		  "";
		
		var expectedOutput = "\r\n" + 
		  "\r\n" + 
		  "";
		
		var expectedMapping = [[2, 0, 2]];

		var diffParser = new mDiffParser.DiffParser();
		var result = diffParser.parse(input, diff);
		assert.deepEqual(result.mapper, expectedMapping);
		assert.equal(result.outPutFile, expectedOutput);
	};
	return tests;
});
