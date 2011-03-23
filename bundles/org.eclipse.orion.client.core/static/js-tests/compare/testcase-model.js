/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var testcaseModel = function(assert) {
	var tests = {};
		
	tests["test model : empty file"] = function() {
		var fileText = "";
		var mapper = [] ;
		var model = new eclipse.TextModel(fileText, "\r\n");
		//var gapModel = new orion.GapTextModel(model, false , mapper);
		var gapModel = new orion.CompareTextModel(model, {mapper:mapper , columnIndex:0} , new orion.GapLineFeeder( "\r\n"));
		
		assert.strictEqual(gapModel.getCharCount() , 0);
		assert.strictEqual(gapModel.getLine(0,true) , "");
		assert.strictEqual(gapModel.getLineAtOffset(0) ,0);
		assert.strictEqual(gapModel.getLineCount() , 1);
		assert.strictEqual(gapModel.getLineEnd(0,true) , 0);
		assert.strictEqual(gapModel.getLineStart(0) , 0);
		assert.strictEqual(gapModel.getLineDelimiter() , "\r\n");
	};
	
	tests["test model : 1 empty line"] = function() {
		var fileText = "\r\n";
		var mapper = [] ;
		var model = new eclipse.TextModel(fileText, "\r\n");
		//var gapModel = new orion.GapTextModel(model, false , mapper);
		var gapModel = new orion.CompareTextModel(model, {mapper:mapper , columnIndex:0} , new orion.GapLineFeeder( "\r\n"));
		
		assert.strictEqual(gapModel.getCharCount() , 2);
		assert.strictEqual(gapModel.getLine(0,true) , "\r\n");
		assert.strictEqual(gapModel.getLine(1,true) , "");
		assert.strictEqual(gapModel.getLineAtOffset(0) , 0);
		assert.strictEqual(gapModel.getLineAtOffset(1) , 0);
		assert.strictEqual(gapModel.getLineCount() , 2);
		assert.strictEqual(gapModel.getLineEnd(0,true) , 2);
		assert.strictEqual(gapModel.getLineStart(0) , 0);
		assert.strictEqual(gapModel.getLineStart(1) , 2);
		assert.strictEqual(gapModel.getLineDelimiter() , "\r\n");
	};
	
	tests["test model : 1 line no CR"] = function() {
		var fileText = "line1";
		var mapper = [] ;
		var model = new eclipse.TextModel(fileText, "\r\n");
		//var gapModel = new orion.GapTextModel(model, false , mapper);
		var gapModel = new orion.CompareTextModel(model, {mapper:mapper , columnIndex:0} , new orion.GapLineFeeder("\r\n"));
		
		assert.strictEqual(gapModel.getCharCount() , 5);
		assert.strictEqual(gapModel.getLine(0,true) , "line1");
		assert.strictEqual(gapModel.getLineAtOffset(0) , 0);
		assert.strictEqual(gapModel.getLineAtOffset(5) , 0);
		assert.strictEqual(gapModel.getLineAtOffset(6) , -1);
		assert.strictEqual(gapModel.getLineCount() , 1);
		assert.strictEqual(gapModel.getLineEnd(0,true) , 5);
		assert.strictEqual(gapModel.getLineStart(0) , 0);
		assert.strictEqual(gapModel.getLineDelimiter() , "\r\n");
	};
	
	tests["test model : 1 line with CR"] = function() {
		var fileText = "line1\r\n";
		var mapper = [] ;
		var model = new eclipse.TextModel(fileText, "\r\n");
		//var gapModel = new orion.GapTextModel(model, false , mapper);
		var gapModel = new orion.CompareTextModel(model, {mapper:mapper , columnIndex:0} , new orion.GapLineFeeder("\r\n"));
		
		assert.strictEqual(gapModel.getCharCount() , 7);
		assert.strictEqual(gapModel.getLine(0,true) , "line1\r\n");
		assert.strictEqual(gapModel.getLine(1,true) , "");
		assert.strictEqual(gapModel.getLine(2,true) , null);
		assert.strictEqual(gapModel.getLineAtOffset(0) , 0);
		assert.strictEqual(gapModel.getLineAtOffset(5) , 0);
		assert.strictEqual(gapModel.getLineAtOffset(6) , 0);
		assert.strictEqual(gapModel.getLineAtOffset(8) , -1);
		assert.strictEqual(gapModel.getLineCount() , 2);
		assert.strictEqual(gapModel.getLineEnd(0,true) , 7);
		assert.strictEqual(gapModel.getLineEnd(1,true) , 7);
		assert.strictEqual(gapModel.getLineStart(0) , 0);
		assert.strictEqual(gapModel.getLineStart(1) , 7);
		assert.strictEqual(gapModel.getLineDelimiter() , "\r\n");
	};
	
	tests["test model : 2 lines with CR and 2 gaps at beginning"] = function() {
		var fileText = "line1\r\n" + 
					   "line2\r\n" + 
					   "";
		var mapper = [[0,2,-1],[3,3,0]] ;
		var model = new eclipse.TextModel(fileText, "\r\n");
		//var gapModel = new orion.GapTextModel(model, false , mapper);
		var gapModel = new orion.CompareTextModel(model, {mapper:mapper , columnIndex:0} , new orion.GapLineFeeder("\r\n"));
		
		assert.strictEqual(gapModel.getCharCount() , 18 , "getCharCount()");
		assert.strictEqual(gapModel.getLineCount() , 5 , "getLineCount()");
		assert.strictEqual(gapModel.getLineDelimiter() , "\r\n" , "getLineDelimiter()");
		
		assert.strictEqual(gapModel.getLine(0,true) , "\r\n" , "getLine(0,true)");
		assert.strictEqual(gapModel.getLine(1,true) , "\r\n" , "getLine(1,true)");
		assert.strictEqual(gapModel.getLine(2,true) , "line1\r\n" , "getLine(2,true)");
		assert.strictEqual(gapModel.getLine(3,true) , "line2\r\n" , "getLine(3,true)");
		assert.strictEqual(gapModel.getLine(4,true) , "", "getLine(4,true)");
		
		assert.strictEqual(gapModel.getLineAtOffset(0) , 0 , "getLineAtOffset(0)");
		assert.strictEqual(gapModel.getLineAtOffset(1) , 0 , "getLineAtOffset(1)");
		assert.strictEqual(gapModel.getLineAtOffset(2) , 1 , "getLineAtOffset(2)");
		assert.strictEqual(gapModel.getLineAtOffset(4) , 2 , "getLineAtOffset(4)");
		assert.strictEqual(gapModel.getLineAtOffset(10) , 2 , "getLineAtOffset(10)");
		assert.strictEqual(gapModel.getLineAtOffset(11) , 3 , "getLineAtOffset(11)");
		assert.strictEqual(gapModel.getLineAtOffset(17) , 3 , "getLineAtOffset(17)");
		assert.strictEqual(gapModel.getLineAtOffset(18) , 4 , "getLineAtOffset(18)");
		assert.strictEqual(gapModel.getLineAtOffset(19) , -1 , "getLineAtOffset(19)");
		
		assert.strictEqual(gapModel.getLineEnd(0,true) , 2 , "getLineEnd(0,true)");
		assert.strictEqual(gapModel.getLineEnd(0,false) , 0 , "getLineEnd(0,false)");
		assert.strictEqual(gapModel.getLineEnd(1,true) , 4 , "getLineEnd(1,true)");
		assert.strictEqual(gapModel.getLineEnd(1,false) , 2 , "getLineEnd(1,false)");
		assert.strictEqual(gapModel.getLineEnd(2,true) , 11 , "getLineEnd(2,true)");
		assert.strictEqual(gapModel.getLineEnd(2,false) , 9 , "getLineEnd(2,false)");
		assert.strictEqual(gapModel.getLineEnd(3,true) , 18 , "getLineEnd(3,true)");
		assert.strictEqual(gapModel.getLineEnd(3,false) , 16 , "getLineEnd(3,false)");
		assert.strictEqual(gapModel.getLineEnd(4,true) , 18 , "getLineEnd(4,true)");
		assert.strictEqual(gapModel.getLineEnd(4,false) , 18 , "getLineEnd(4,false)");
		assert.strictEqual(gapModel.getLineEnd(5,true) , -1 , "getLineEnd(5,true)");
		
		assert.strictEqual(gapModel.getLineStart(0) , 0 , "getLineStart(0)");
		assert.strictEqual(gapModel.getLineStart(1) , 2 , "getLineStart(1)");
		assert.strictEqual(gapModel.getLineStart(2) , 4 , "getLineStart(2)");
		assert.strictEqual(gapModel.getLineStart(3) , 11 , "getLineStart(3)");
		assert.strictEqual(gapModel.getLineStart(4) , 18 , "getLineStart(4)");
		assert.strictEqual(gapModel.getLineStart(5) , -1 , "getLineStart(5)");
		
	};
	
	tests["test model : 2 lines with CR and 2 gaps in the middle"] = function() {
		var fileText = "line1\r\n" + 
					   "line2\r\n" + 
					   "";
		var mapper = [[1,1,0],[0,2,-1],[2,2,0]] ;
		var model = new eclipse.TextModel(fileText, "\r\n");
		//var gapModel = new orion.GapTextModel(model, false , mapper);
		var gapModel = new orion.CompareTextModel(model, {mapper:mapper , columnIndex:0} , new orion.GapLineFeeder("\r\n"));
		
		assert.strictEqual(gapModel.getCharCount() , 18 , "getCharCount()");
		assert.strictEqual(gapModel.getLineCount() , 5 , "getLineCount()");
		assert.strictEqual(gapModel.getLineDelimiter() , "\r\n" , "getLineDelimiter()");
		
		assert.strictEqual(gapModel.getLine(1,true) , "\r\n" , "getLine(1,true)");
		assert.strictEqual(gapModel.getLine(2,true) , "\r\n" , "getLine(2,true)");
		assert.strictEqual(gapModel.getLine(0,true) , "line1\r\n" , "getLine(0,true)");
		assert.strictEqual(gapModel.getLine(3,true) , "line2\r\n" , "getLine(3,true)");
		assert.strictEqual(gapModel.getLine(4,true) , "", "getLine(4,true)");
		assert.strictEqual(gapModel.getLine(1,false) , "" , "getLine(1,false)");
		assert.strictEqual(gapModel.getLine(2,false) , "" , "getLine(2,false)");
		assert.strictEqual(gapModel.getLine(0,false) , "line1" , "getLine(0,false)");
		assert.strictEqual(gapModel.getLine(3,false) , "line2" , "getLine(3,false)");
		assert.strictEqual(gapModel.getLine(4,false) , "", "getLine(4,false)");
		assert.strictEqual(gapModel.getLine(5,true) , null, "getLine(5,true)");
		
		assert.strictEqual(gapModel.getLineAtOffset(0) , 0 , "getLineAtOffset(0)");
		assert.strictEqual(gapModel.getLineAtOffset(6) , 0 , "getLineAtOffset(6)");
		assert.strictEqual(gapModel.getLineAtOffset(7) , 1 , "getLineAtOffset(7)");
		assert.strictEqual(gapModel.getLineAtOffset(8) , 1 , "getLineAtOffset(8)");
		assert.strictEqual(gapModel.getLineAtOffset(9) , 2 , "getLineAtOffset(4)");
		assert.strictEqual(gapModel.getLineAtOffset(10) , 2 , "getLineAtOffset(10)");
		assert.strictEqual(gapModel.getLineAtOffset(11) , 3 , "getLineAtOffset(11)");
		assert.strictEqual(gapModel.getLineAtOffset(17) , 3 , "getLineAtOffset(17)");
		assert.strictEqual(gapModel.getLineAtOffset(18) , 4 , "getLineAtOffset(18)");
		assert.strictEqual(gapModel.getLineAtOffset(19) , -1 , "getLineAtOffset(19)");
		
		assert.strictEqual(gapModel.getLineEnd(0,true) , 7 , "getLineEnd(0,true)");
		assert.strictEqual(gapModel.getLineEnd(0,false) , 5 , "getLineEnd(0,false)");
		assert.strictEqual(gapModel.getLineEnd(1,true) , 9 , "getLineEnd(1,true)");
		assert.strictEqual(gapModel.getLineEnd(1,false) , 7 , "getLineEnd(1,false)");
		assert.strictEqual(gapModel.getLineEnd(2,true) , 11 , "getLineEnd(2,true)");
		assert.strictEqual(gapModel.getLineEnd(2,false) , 9 , "getLineEnd(2,false)");
		assert.strictEqual(gapModel.getLineEnd(3,true) , 18 , "getLineEnd(3,true)");
		assert.strictEqual(gapModel.getLineEnd(3,false) , 16 , "getLineEnd(3,false)");
		assert.strictEqual(gapModel.getLineEnd(4,true) , 18 , "getLineEnd(4,true)");
		assert.strictEqual(gapModel.getLineEnd(4,false) , 18 , "getLineEnd(4,false)");
		assert.strictEqual(gapModel.getLineEnd(5,true) , -1 , "getLineEnd(5,true)");
		
		assert.strictEqual(gapModel.getLineStart(0) , 0 , "getLineStart(0)");
		assert.strictEqual(gapModel.getLineStart(1) , 7 , "getLineStart(1)");
		assert.strictEqual(gapModel.getLineStart(2) , 9 , "getLineStart(2)");
		assert.strictEqual(gapModel.getLineStart(3) , 11 , "getLineStart(3)");
		assert.strictEqual(gapModel.getLineStart(4) , 18 , "getLineStart(4)");
		assert.strictEqual(gapModel.getLineStart(5) , -1 , "getLineStart(5)");
		
	};
	
	tests["test model : 2 lines with CR and 2 gaps at the end"] = function() {
		var fileText = "line1\r\n" + 
					   "line2\r\n" + 
					   "";
		var mapper = [[2,2,0],[0,2,-1],[1,1,0]] ;
		var model = new eclipse.TextModel(fileText, "\r\n");
		//var gapModel = new orion.GapTextModel(model, false , mapper);
		var gapModel = new orion.CompareTextModel(model, {mapper:mapper , columnIndex:0} , new orion.GapLineFeeder("\r\n"));
		
		assert.strictEqual(gapModel.getCharCount() , 18 , "getCharCount()");
		assert.strictEqual(gapModel.getLineCount() , 5 , "getLineCount()");
		assert.strictEqual(gapModel.getLineDelimiter() , "\r\n" , "getLineDelimiter()");
		
		assert.strictEqual(gapModel.getLine(2,true) , "\r\n" , "getLine(2,true)");
		assert.strictEqual(gapModel.getLine(3,true) , "\r\n" , "getLine(3,true)");
		assert.strictEqual(gapModel.getLine(0,true) , "line1\r\n" , "getLine(0,true)");
		assert.strictEqual(gapModel.getLine(1,true) , "line2\r\n" , "getLine(1,true)");
		assert.strictEqual(gapModel.getLine(4,true) , "", "getLine(4,true)");
		assert.strictEqual(gapModel.getLine(2,false) , "" , "getLine(2,false)");
		assert.strictEqual(gapModel.getLine(3,false) , "" , "getLine(3,false)");
		assert.strictEqual(gapModel.getLine(0,false) , "line1" , "getLine(0,false)");
		assert.strictEqual(gapModel.getLine(1,false) , "line2" , "getLine(1,false)");
		assert.strictEqual(gapModel.getLine(4,false) , "", "getLine(4,false)");
		assert.strictEqual(gapModel.getLine(5,true) , null, "getLine(5,true)");
		
		assert.strictEqual(gapModel.getLineAtOffset(0) , 0 , "getLineAtOffset(0)");
		assert.strictEqual(gapModel.getLineAtOffset(6) , 0 , "getLineAtOffset(6)");
		assert.strictEqual(gapModel.getLineAtOffset(7) , 1 , "getLineAtOffset(7)");
		assert.strictEqual(gapModel.getLineAtOffset(13) , 1 , "getLineAtOffset(8)");
		assert.strictEqual(gapModel.getLineAtOffset(14) , 2 , "getLineAtOffset(4)");
		assert.strictEqual(gapModel.getLineAtOffset(15) , 2 , "getLineAtOffset(10)");
		assert.strictEqual(gapModel.getLineAtOffset(16) , 3 , "getLineAtOffset(11)");
		assert.strictEqual(gapModel.getLineAtOffset(17) , 3 , "getLineAtOffset(17)");
		assert.strictEqual(gapModel.getLineAtOffset(18) , 4 , "getLineAtOffset(18)");
		assert.strictEqual(gapModel.getLineAtOffset(19) , -1 , "getLineAtOffset(19)");
		
		assert.strictEqual(gapModel.getLineEnd(0,true) , 7 , "getLineEnd(0,true)");
		assert.strictEqual(gapModel.getLineEnd(0,false) , 5 , "getLineEnd(0,false)");
		assert.strictEqual(gapModel.getLineEnd(1,true) , 14 , "getLineEnd(1,true)");
		assert.strictEqual(gapModel.getLineEnd(1,false) , 12 , "getLineEnd(1,false)");
		assert.strictEqual(gapModel.getLineEnd(2,true) , 16 , "getLineEnd(2,true)");
		assert.strictEqual(gapModel.getLineEnd(2,false) , 14 , "getLineEnd(2,false)");
		assert.strictEqual(gapModel.getLineEnd(3,true) , 18 , "getLineEnd(3,true)");
		assert.strictEqual(gapModel.getLineEnd(3,false) , 16 , "getLineEnd(3,false)");
		assert.strictEqual(gapModel.getLineEnd(4,true) , 18 , "getLineEnd(4,true)");
		assert.strictEqual(gapModel.getLineEnd(4,false) , 18 , "getLineEnd(4,false)");
		assert.strictEqual(gapModel.getLineEnd(5,true) , -1 , "getLineEnd(5,true)");
		
		assert.strictEqual(gapModel.getLineStart(0) , 0 , "getLineStart(0)");
		assert.strictEqual(gapModel.getLineStart(1) , 7 , "getLineStart(1)");
		assert.strictEqual(gapModel.getLineStart(2) , 14 , "getLineStart(2)");
		assert.strictEqual(gapModel.getLineStart(3) , 16 , "getLineStart(3)");
		assert.strictEqual(gapModel.getLineStart(4) , 18 , "getLineStart(4)");
		assert.strictEqual(gapModel.getLineStart(5) , -1 , "getLineStart(5)");
		
	};
	
	return tests;
}(orion.Assert);
