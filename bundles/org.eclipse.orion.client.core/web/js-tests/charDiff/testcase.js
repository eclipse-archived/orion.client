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

define(["dojo", "orion/assert", "orion/compare/jsdiffAdapter"], function(dojo, assert, mJSDiffAdapter) {

	
	var tests = {};
	var adapter = new mJSDiffAdapter.JSDiffAdapter();
	/**
	 * Basic test function.
	 */
	function testCharDiff(oldString, newString,expetedMap) {
		var map = adapter.adaptCharDiff(oldString, newString);
		assert.deepEqual(map, expetedMap);
	}
	/* 
	  String template
		var oldString =  
	 	   "foo bar bar\n" + 
		   "bar foo bar\n" + 
		   "bar bar foo\n" + 
		   "bar bar bar\n"; 
	*/

	/**
	 * Test adding one char at very beginning.
	 */
	tests.testAddingOneCharAtBeginning = function() {
		var oldString =  
		   "foo bar bar\n";
		var newString =  
		   "bfoo bar bar\n";
		var expetedMap =
			[[0, 1, 0, 0]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	/**
	 * Test adding three chars at very beginning.
	 */
	tests.testAddingThreeCharsAtBeginning = function() {
		var oldString =  
		   "foo bar bar\n";
		var newString =  
		   "barfoo bar bar\n";
		var expetedMap =
			[[0, 3, 0, 0]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	/**
	 * Test adding three chars at the very end.
	 */
	tests.testAddingThreeCharsAtEnd = function() {
		var oldString =  
		   "foo bar bar\n";
		var newString =  
		   "foo bar bar\nbar";
		var expetedMap =
			[[12, 15, 12, 12]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	/**
	 * Test adding two chars in the middle.
	 */
	tests.testAddingTwoCharsInMiddle = function() {
		var oldString =  
		 	   "foo bar bar\n" + 
			   "bar foo bar\n" + 
			   "bar bar foo\n" + 
			   "bar bar bar\n"; 
		var newString =  
		 	   "foo bar bar\n" + 
			   "bar foobb bar\n" + 
			   "bar bar foo\n" + 
			   "bar bar bar\n"; 
		var expetedMap =
			[[19, 21, 19, 19]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	/**
	 * Test removing one char at very beginning.
	 */
	tests.testRemovingOneCharAtBeginning = function() {
		var oldString =  
		   "foo bar bar\n";
		var newString =  
		   "oo bar bar\n";
		var expetedMap =
			[[0, 0, 0, 1]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	/**
	 * Test removing three chars at very beginning.
	 */
	tests.testRemovingThreeCharsAtBeginning = function() {
		var oldString =  
		   "foo bar bar\n";
		var newString =  
		   " bar bar\n";
		var expetedMap =
			[[0, 0, 0, 3]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	/**
	 * Test removing three chars at very end.
	 */
	tests.testRemovingThreeCharsAtEnd = function() {
		var oldString =  
		   "foo bar bar\n";
		var newString =  
		   "foo bar b";
		var expetedMap =
			[[9, 9, 9, 12]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	/**
	 * Test removing two chars in the middle.
	 */
	tests.testRemovingTwoCharsInMiddle = function() {
		var oldString =  
		 	   "foo bar bar\n" + 
			   "bar foo bar\n" + 
			   "bar bar foo\n" + 
			   "bar bar bar\n"; 
		var newString =  
		 	   "foo bar bar\n" + 
			   "bar foo bar\n" + 
			   "bar b foo\n" + 
			   "bar bar bar\n"; 
		var expetedMap =
			[[29, 29, 29, 31]
			];
		testCharDiff(oldString, newString,expetedMap);
	};


	/**
	 * Test Changing one char at very beginning.
	 */
	tests.testChangingOneCharAtBeginning = function() {
		var oldString =  
		   "foo bar bar\n";
		var newString =  
		   "boo bar bar\n";
		var expetedMap =
			[[0, 1, 0, 1]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	/**
	 * Test Changing three chars at very beginning.
	 */
	tests.testChangingThreeCharsAtBeginning = function() {
		var oldString =  
		   "foo bar bar\n";
		var newString =  
		   "bar bar bar\n";
		var expetedMap =
			[[0, 3, 0, 3]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	/**
	 * Test Changing three chars at the very end.
	 */
	tests.testChangingThreeCharsAtEnd = function() {
		var oldString =  
		   "foo bar bar\n";
		var newString =  
		   "foo bar foo\n";
		var expetedMap =
			[[8, 11, 8, 11]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	/**
	 * Test Changing three chars to two in the middle.
	 */
	tests.testChangingThreeCharsToTwo = function() {
		var oldString =  
		   "foo bar bar\n";
		var newString =  
		   "foo fo bar\n";
		var expetedMap =
			[[4, 6, 4, 7]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	/**
	 * Test Changing multiple places.
	 */
	tests.testChangingMutiplePlaces = function() {
		var oldString =  
		 	   "foo bar bar\n" + 
			   "bar foo bar\n" + 
			   "bar bar foo\n" + 
			   "bar bar bar\n"; 
		var newString =  
		 	   "foo foo bar\n" + 
			   "bar foo bar\n" + 
			   "foo bar ba\n" + 
			   "bar bar bar\n"; 
		var expetedMap =
			[[4, 7, 4, 7],
			 [32, 34, 32, 35]
			];
	};

	/**
	 * Test add, remove, and change chars together.
	 */
	tests.testAllcases = function() {
		var oldString =  
		   "foo bar bar\n" + 
		   "bar foo bar\n" + 
		   "bar bar bar\n" + 
		   "bar bar foo"; 
		var newString =  
		   "foo bar bar\n" + 
		   "bar cc bar\n" + 
		   "barr ba bar\n" + 
		   "bar bar ccc"; 
		var expetedMap =
			[[16, 18, 16, 19],
			 [26, 27, 27, 27],
			 [30, 30, 30, 31],
			 [43, 46, 44, 47]
			];
		testCharDiff(oldString, newString,expetedMap);
	};

	return tests;
});
