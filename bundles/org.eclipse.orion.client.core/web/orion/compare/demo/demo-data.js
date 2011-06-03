/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/**
 * @private Don't document this
 */
var demoData = [
    /* Test data format ******************************************
    [ "",                 //string of input file 
      "",                 //string of diff 
      "",                 //expected string of output file
      [[1,0,2],[2,2,0]],  //expected array of the mapper 
      "some description"] //test case description
    *************************************************************/
    /* Template **************************************************
    //
	[ 
	  //input file 
	  "", 
	  //diff
	  "", 
	  //output file
	  "", 
	  //mapper
	  [],
	  //description  
	  ""]
	, 
    *************************************************************/ 

    //empty test
	[ "", 
	  "", 
	  "", 
	  [],  
	  "empty case"]
	, 
	/***************************************************************************/
	/****************************   Add Lines **********************************/
	/***************************************************************************/
	/**********   adding to empty file *********/
	//add 1 empty line to empty file
	[ 
	  //input file 
	  "", 
	  //diff
	  "@@ -0,0 +1 @@\r\n" + 
	  "+\r\n" + 
	  "", 
	  //output file
	  "\r\n" +
	  "", 
	  //mapper
	  [[2,1,2]],
	  //description  
	  "add 1 empty line to empty file"]
	, 
	//add 2 empty lines to empty file
	[ 
	  //input file 
	  "", 
	  //diff
	  "@@ -0,0 +1,2 @@\r\n" + 
	  "+\r\n" + 
	  "+\r\n" + 
	  "", 
	  //output file
	  "\r\n" + 
	  "\r\n" + 
	  "", 
	  //mapper
	  [[3,1,2]],
	  //description  
	  "add 2 empty lines to empty file"]
	, 
	//add 1 line without \r  to empty file
	[ 
	  //input file 
	  "", 
	  //diff
	  "@@ -0,0 +1 @@\r\n" + 
	  "+line 1\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1", 
	  //mapper
	  [[1,1,2]],
	  //description  
	  "add 1 line without \\r  to empty file"]
	, 
	//add 2 lines  without \r  to empty file
	[ 
	  //input file 
	  "", 
	  //diff
	  "@@ -0,0 +1,2 @@\r\n" + 
	  "+line 1\r\n" + 
	  "+line 2\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2", 
	  //mapper
	  [[2,1,2]],
	  //description  
	  "add 2 lines without \\r  to empty file"]
	, 
	//add 1 line to empty file
	[ 
	  //input file 
	  "", 
	  //diff
	  "@@ -0,0 +1 @@\r\n" + 
	  "+line 1\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "", 
	  //mapper
	  [[2,1,2]],
	  //description  
	  "add 1 line to empty file"]
	, 
	//add 2 lines to empty file
	[ 
	  //input file 
	  "", 
	  //diff
	  "@@ -0,0 +1,2 @@\r\n" + 
	  "+line 1\r\n" + 
	  "+line 2\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "", 
	  //mapper
	  [[3,1,2]],
	  //description  
	  "add 2 lines to empty file"]
	, 
    //add 1 empty line at beginning
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2", 
	  //diff
	  "@@ -1,2 +1,3 @@\r\n" + 
	  "+\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "", 
	  //output file
	  "\r\n" + 
	  "line 1\r\n" + 
	  "line 2", 
	  //mapper
	  [[1,0,2],[2,2,0]],
	  //description  
	  "add 1 empty line at beginning"]
	, 
    //add 2 empty lines at beginning
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2", 
	  //diff
	  "@@ -1,2 +1,4 @@\r\n" + 
	  "+\r\n" + 
	  "+\r\n" + 
	  " line 1\r\n" + 
	  " line 2", 
	  //output file
	  "\r\n" + 
	  "\r\n" + 
	  "line 1\r\n" + 
	  "line 2", 
	  //mapper
	  [[2,0,2],[2,2,0]],
	  //description  
	  "add 2 empty lines at beginning"]
	, 
    //add 1 line at beginning
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2", 
	  //diff
	  "@@ -1,2 +1,3 @@\r\n" + 
	  "+line 01\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "", 
	  //output file
	  "line 01\r\n" + 
	  "line 1\r\n" + 
	  "line 2", 
	  //mapper
	  [[1,0,2],[2,2,0]],
	  //description  
	  "add 1 line at beginning"]
	, 
    //add 2 lines at beginning
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2", 
	  //diff
	  "@@ -1,2 +1,4 @@\r\n" + 
	  "+line 01\r\n" + 
	  "+line 02\r\n" + 
	  " line 1\r\n" + 
	  " line 2", 
	  //output file
	  "line 01\r\n" + 
	  "line 02\r\n" + 
	  "line 1\r\n" + 
	  "line 2", 
	  //mapper
	  [[2,0,2],[2,2,0]],
	  //description  
	  "add 2 lines at beginning"]
	, 
	/******** input file does not have new line at end  ******/
	///////// single line input file ////////
    //add new line at end (1)
	[ 
	  //input file 
	  "line 1", 
	  //diff
	  "@@ -1 +1 @@\r\n" + 
	  "-line 1\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 1\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "", 
	  //mapper
	  [[2,1,4]],
	  //description  
	  "input file without new line at end --> add new line at end (1)"]
	, 
	///////// 2 lines input file ////////
    //add new line at end (2)
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2", 
	  //diff
	  "@@ -1,2 +1,2 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 2\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "", 
	  //mapper
	  [[1,1,0],[2,1,5]],
	  //description  
	  "input file without new line at end --> add new line at end (2)"]
	, 
    //add 1 empty line at end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2", 
	  //diff
	  "@@ -1,2 +1,3 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 2\r\n" + 
	  "+\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "\r\n" + 
	  "", 
	  //mapper
	  [[1,1,0],[3,1,5]],
	  //description  
	  "input file without new line at end --> add 1 empty line at end"]
	,
    //add 2 empty lines at end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2", 
	  //diff
	  "@@ -1,2 +1,4 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 2\r\n" + 
	  "+\r\n" + 
	  "+\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "\r\n" + 
	  "\r\n" + 
	  "", 
	  //mapper
	  [[1,1,0],[4,1,5]],
	  //description  
	  "input file without new line at end --> add 2 empty lines at end"]
	,
    //add 1 line without \r at end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2", 
	  //diff
	  "@@ -1,2 +1,3 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 2\r\n" + 
	  "+line 3\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3", 
	  //mapper
	  [[1,1,0],[2,1,5]],
	  //description  
	  "input file without new line at end --> add 1 line without \\r at end"]
	,
    //add 2 lines without \r at end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2", 
	  //diff
	  "@@ -1,2 +1,4 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 2\r\n" + 
	  "+line 3\r\n" + 
	  "+line 4\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4", 
	  //mapper
	  [[1,1,0],[3,1,5]],
	  //description  
	  "input file without new line at end --> add 2 lines without \\r at end"]
	,
    //add 1 line at end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2", 
	  //diff
	  "@@ -1,2 +1,3 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 2\r\n" + 
	  "+line 3\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "", 
	  //mapper
	  [[1,1,0],[3,1,5]],
	  //description  
	  "input file without new line at end --> add 1 line at end"]
	,
    //add 2 lines at end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2", 
	  //diff
	  "@@ -1,2 +1,4 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 2\r\n" + 
	  "+line 3\r\n" + 
	  "+line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[1,1,0],[4,1,5]],
	  //description  
	  "input file without new line at end --> add 2 lines at end"]
	,
	/******** input file has new line at end  ******/
    //add 1 empty line at end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "", 
	  //diff
	  "@@ -1,2 +1,3 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "+\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "\r\n" + 
	  "", 
	  //mapper
	  [[2,2,0],[2,1,4]],
	  //description  
	  "input file with new line at end --> add 1 empty line at end"]
	,
    //add 1 line without \r at end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "", 
	  //diff
	  "@@ -1,2 +1,3 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "+line 3\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3", 
	  //mapper
	  [[2,2,0],[1,1,4]],
	  //description  
	  "input file with new line at end --> add 1 line without \\r at end"]
	,
    //add 2 lines without \r at end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "", 
	  //diff
	  "@@ -1,2 +1,4 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "+line 3\r\n" + 
	  "+line 4\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4", 
	  //mapper
	  [[2,2,0],[2,1,4]],
	  //description  
	  "input file with new line at end --> add 2 lines without \\r at end"]
	,
    //add 1 line at end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "", 
	  //diff
	  "@@ -1,2 +1,3 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "+line 3\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "", 
	  //mapper
	  [[2,2,0],[2,1,4]],
	  //description  
	  "input file with new line at end --> add 1 line at end"]
	,
    //add 2 lines at end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "", 
	  //diff
	  "@@ -1,2 +1,4 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "+line 3\r\n" + 
	  "+line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[2,2,0],[3,1,4]],
	  //description  
	  "input file with new line at end --> add 2 lines at end"]
	,
    //add 2 lines in the middle 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,6 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "+line 3-1\r\n" + 
	  "+line 3-2\r\n" + 
	  " line 3\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3-1\r\n" + 
	  "line 3-2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[2,2,0],[2,0,4],[3,3,0]],
	  //description  
	  "input file with new line at end -->add 2 lines in the middle"]
	,
    //add 2 empty lines in the middle 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4", 
	  //diff
	  "@@ -1,4 +1,6 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "+\r\n" + 
	  "+\r\n" + 
	  " line 3\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "\r\n" + 
	  "\r\n" + 
	  "line 3\r\n" + 
	  "line 4", 
	  //mapper
	  [[2,2,0],[2,0,4],[2,2,0]],
	  //description  
	  "input file without line at end -->add 2 empty lines in the middle"]
	,
    //add 3 blocks at beginning , middle and end
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,10 @@\r\n" + 
	  "+line 1-1\r\n" + 
	  "+line 1-2\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "+line 3-1\r\n" + 
	  "+line 3-2\r\n" + 
	  " line 3\r\n" + 
	  " line 4\r\n" + 
	  "+line 5\r\n" + 
	  "+line 6\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1-1\r\n" + 
	  "line 1-2\r\n" + 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3-1\r\n" + 
	  "line 3-2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "line 5\r\n" + 
	  "line 6", 
	  //mapper
	  [[2,0,2],[2,2,0],[2,0,6],[2,2,0],[2,1,10]],
	  //description  
	  "input file with new line at end -->add 3 blocks at beginning , middle and end"]
	,
	/***************************************************************************/
	/****************************   remove Lines *******************************/
	/***************************************************************************/
    /***********  input file has new line at end*******************/
	//remove 1 line at beginning
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,3 @@\r\n" + 
	  "-line 1\r\n" + 
	  " line 2\r\n" + 
	  " line 3\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[0,1,-1],[4,4,0]],
	  //description  
	  "input file has new line at end --> remove 1 line at beginning"]
	,
    //remove 2 lines at beginning
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,2 @@\r\n" + 
	  "-line 1\r\n" + 
	  "-line 2\r\n" + 
	  " line 3\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[0,2,-1],[3,3,0]],
	  //description  
	  "input file has new line at end --> remove 2 lines at beginning"]
	,
    //remove 2 lines in the middle 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,2 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "-line 3\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[1,1,0],[0,2,-1],[2,2,0]],
	  //description  
	  "input file has new line at end --> remove 2 lines in the middle"]
	,
    //remove 2 lines at the end 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,2 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "-line 3\r\n" + 
	  "-line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "", 
	  //mapper
	  [[2,2,0],[0,2,-1],[1,1,0]],
	  //description  
	  "input file has new line at end --> remove 2 lines at end"]
	,
    //remove the empty line at the end 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,4 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  " line 3\r\n" + 
	  "-line 4\r\n" + 
	  "+line 4\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" +
	  "line 4",
	  //mapper
	  [[3,3,0],[1,2,6]],
	  //description  
	  "input file has new line at end --> remove  the empty line at the end"]
	,
    //remove 1 empty line in the middle 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "\r\n" + 
	  "\r\n" + 
	  "\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -2,6 +2,5 @@\r\n" + 
	  " line 2\r\n" + 
	  " \r\n" + 
	  " \r\n" + 
	  "-\r\n" + 
	  " line 3\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "\r\n" + 
	  "\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "",
	  //mapper
	  [[4,4,0],[0,1,-1],[3,3,0]],
	  //description  
	  "input file has new line at end --> remove 1 empty line in the middle"]
	,
    //remove the last line and empty line at the end 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,3 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "-line 3\r\n" + 
	  "-line 4\r\n" + 
	  "+line 3\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3", 
	  //mapper
	  [[2,2,0],[1,3,6]],
	  //description  
	  "input file has new line at end --> remove the last line and empty line at the end"]
	,
    //remove all 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +0,0 @@\r\n" + 
	  "-line 1\r\n" + 
	  "-line 2\r\n" + 
	  "-line 3\r\n" + 
	  "-line 4\r\n" + 
	  "", 
	  //output file
	  "", 
	  //mapper
	  [[0,4,-1],[1,1,0]],
	  //description  
	  "input file has new line at end --> remove all"]
	,
    /***********  input file has no new line at end*******************/
    //remove the last line  
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3", 
	  //diff
	  "@@ -1,3 +1,2 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "-line 3\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "", 
	  //mapper
	  [[2,2,0],[1,1,-1]],
	  //description  
	  "input file has no new line at end --> remove the last line"]
	,
    //remove the last line and the new line at the end 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3", 
	  //diff
	  "@@ -1,3 +1,2 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "-line 3\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 2\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2", 
	  //mapper
	  [[1,1,0],[1,2,6]],
	  //description  
	  "input file has no new line at end --> remove the last line and the new line at the end"]
	,
    //remove all 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3", 
	  //diff
	  "@@ -1,3 +0,0 @@\r\n" + 
	  "-line 1\r\n" + 
	  "-line 2\r\n" + 
	  "-line 3\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "", 
	  //mapper
	  [[1,3,-1]],
	  //description  
	  "input file has no new line at end --> remove all"]
	,
	/***************************************************************************/
	/****************************   change Lines *******************************/
	/***************************************************************************/
    /***********  input file has new line at end*******************/
	//change the first line 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,4 @@\r\n" + 
	  "-line 1\r\n" + 
	  "+line 111\r\n" + 
	  " line 2\r\n" + 
	  " line 3\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 111\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[1,1,3],[4,4,0]],
	  //description  
	  "input file has new line at end --> change the first line"]
	,
	//change the first line to 2 lines
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,5 @@\r\n" + 
	  "-line 1\r\n" + 
	  "+line 111\r\n" + 
	  "+line 1111\r\n" + 
	  " line 2\r\n" + 
	  " line 3\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 111\r\n" + 
	  "line 1111\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[2,1,3],[4,4,0]],
	  //description  
	  "input file has new line at end --> change the first line to 2 lines"]
	,
	//change the second line 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,4 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "+line 222\r\n" + 
	  " line 3\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 222\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[1,1,0],[1,1,4],[3,3,0]],
	  //description  
	  "input file has new line at end --> change the second line"]
	,
	//change the last line 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,4 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  " line 3\r\n" + 
	  "-line 4\r\n" + 
	  "+line 444\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 444\r\n" + 
	  "", 
	  //mapper
	  [[3,3,0],[2,2,6]],
	  //description  
	  "input file has new line at end --> change the last line"]
	,
	//change the last line to 2 lines
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,5 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  " line 3\r\n" + 
	  "-line 4\r\n" + 
	  "+line 444\r\n" + 
	  "+line 5\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 444\r\n" + 
	  "line 5\r\n" + 
	  "", 
	  //mapper
	  [[3,3,0],[3,2,6]],
	  //description  
	  "input file has new line at end --> change the last line to 2 lines"]
	,
	//change the middle 2 lines
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,4 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "-line 3\r\n" + 
	  "+line 222\r\n" + 
	  "+line 333\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 222\r\n" + 
	  "line 333\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[1,1,0],[2,2,5],[2,2,0]],
	  //description  
	  "input file has new line at end --> change the midle 2 lines"]
	,
	//change the middle 2 lines to 4 lines
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,6 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "-line 3\r\n" + 
	  "+line 222\r\n" + 
	  "+line 2222\r\n" + 
	  "+line 333\r\n" + 
	  "+\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 222\r\n" + 
	  "line 2222\r\n" + 
	  "line 333\r\n" + 
	  "\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[1,1,0],[4,2,5],[2,2,0]],
	  //description  
	  "input file has new line at end --> change the midle 2 lines to 4 lines"]
	,
	//change the middle 2 lines to 1 line
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,6 @@\r\n" + 
	  " line 1\r\n" + 
	  "-line 2\r\n" + 
	  "-line 3\r\n" + 
	  "+line 2233\r\n" + 
	  " line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2233\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[1,1,0],[1,2,5],[2,2,0]],
	  //description  
	  "input file has new line at end --> change the midle 2 lines to 1 line"]
	,
	//change all lines
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //diff
	  "@@ -1,4 +1,4 @@\r\n" + 
	  "-line 1\r\n" + 
	  "-line 2\r\n" + 
	  "-line 3\r\n" + 
	  "-line 4\r\n" + 
	  "+line 11\r\n" + 
	  "+line 22\r\n" + 
	  "+line 33\r\n" + 
	  "+line 44\r\n" + 
	  "", 
	  //output file
	  "line 11\r\n" + 
	  "line 22\r\n" + 
	  "line 33\r\n" + 
	  "line 44\r\n" + 
	  "", 
	  //mapper
	  [[5,5,6]],
	  //description  
	  "input file has new line at end --> change all lines"]
	,
    /***********  input file has no new line at end*******************/
	//change the last line  
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3", 
	  //diff
	  "@@ -1,3 +1,3 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "-line 3\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 333\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 333", 
	  //mapper
	  [[2,2,0],[1,1,6]],
	  //description  
	  "input file has no new line at end --> change the last line"]
	,
	//change the last line with new line  
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3", 
	  //diff
	  "@@ -1,3 +1,3 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "-line 3\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 333\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 333\r\n" + 
	  "", 
	  //mapper
	  [[2,2,0],[2,1,6]],
	  //description  
	  "input file has no new line at end --> change the last line with new line"]
	,
	//change the last line to 2 lines   
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3", 
	  //diff
	  "@@ -1,3 +1,4 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "-line 3\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 333\r\n" + 
	  "+line 4\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 333\r\n" + 
	  "line 4", 
	  //mapper
	  [[2,2,0],[2,1,6]],
	  //description  
	  "input file has no new line at end --> change the last line to 2 lines"]
	,
	//change the last line to 2 lines with new line  
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3", 
	  //diff
	  "@@ -1,3 +1,4 @@\r\n" + 
	  " line 1\r\n" + 
	  " line 2\r\n" + 
	  "-line 3\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+line 333\r\n" + 
	  "+line 4\r\n" + 
	  "", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 333\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[2,2,0],[3,1,6]],
	  //description  
	  "input file has no new line at end --> change the last line to 2 lines with new line"]
	,
	/***************************************************************************/
	/****************************   remove , change and add lines **************/
	/***************************************************************************/
    /***********  input file has new line at end*******************/
	//remove line 1,2 ;change 4,5 ; add 6-1,6-2 
	[ 
	  //input file 
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "line 5\r\n" + 
	  "line 6\r\n" + 
	  "line 7\r\n" + 
	  "", 
	  //diff
	  "--- test2o.js	Tue Feb 15 13:16:05 2011\r\n" + 
	  "+++ test2n.js	Tue Feb 15 13:17:42 2011\r\n" + 
	  "@@ -1,7 +1,8 @@\r\n" + 
	  "-line 1\r\n" + 
	  "-line 2\r\n" + 
	  " line 3\r\n" + 
	  "-line 4\r\n" + 
	  "-line 5\r\n" + 
	  "+line 444\r\n" + 
	  "+line 555\r\n" + 
	  "+line 555\r\n" + 
	  " line 6\r\n" + 
	  "+line 6-1\r\n" + 
	  "+line 6-2\r\n" + 
	  " line 7\r\n" + 
	  "", 
	  //output file
	  "line 3\r\n" + 
	  "line 444\r\n" + 
	  "line 555\r\n" + 
	  "line 555\r\n" + 
	  "line 6\r\n" + 
	  "line 6-1\r\n" + 
	  "line 6-2\r\n" + 
	  "line 7\r\n" + 
	  "", 
	  //mapper
	  [[0,2,-1],[1,1,0],[3,2,9],[1,1,0],[2,0,13],[2,2,0]],
	  //description  
	  "input file has new line at end --> remove line 1,2 ;change 4,5 ; add 6-1,6-2"]
	,
	////// starting from 52 now 
	[
	  //input file 
	  "var eclipse = eclipse || {};\r\n" + 
	  "\r\n" + 
	  "orion.textview.Ruler = (function() {\r\n" + 
	  "	function Ruler (rulerLocation, rulerOverview, rulerStyle) {\r\n" + 
	  "		this._location = rulerLocation || \"left\";\r\n" + 
	  "		this._overview = rulerOverview || \"page\";\r\n" + 
	  "		this._rulerStyle = rulerStyle;\r\n" + 
	  "		this._editor = null;\r\n" + 
	  "	}\r\n" + 
	  "	Ruler.prototype = {\r\n" + 
	  "		setEditor: function (editor) {\r\n" + 
	  "			if (this._onModelChanged && this._editor) {\r\n" + 
	  "				this._editor.removeEventListener(\"ModelChanged\", this, this._onModelChanged); \r\n" + 
	  "			}\r\n" + 
	  "			this._editor = editor;\r\n" + 
	  "			if (this._onModelChanged && this._editor) {\r\n" + 
	  "				this._editor.addEventListener(\"ModelChanged\", this, this._onModelChanged);\r\n" + 
	  "			}\r\n" + 
	  "		},\r\n" + 
	  "		getLocation: function() {\r\n" + 
	  "			return this._location;\r\n" + 
	  "		},\r\n" + 
	  "		getOverview: function(editor) {\r\n" + 
	  "			return this._overview;\r\n" + 
	  "		}\r\n" + 
	  "	};\r\n" + 
	  "	return Ruler;\r\n" + 
	  "}());\r\n" + 
	  "\r\n" + 
	  "orion.textview.LineNumberRuler = (function() {\r\n" + 
	  "	function LineNumberRuler (rulerLocation, rulerStyle, oddStyle, evenStyle) {\r\n" + 
	  "		orion.textview.Ruler.call(this, rulerLocation, \"page\", rulerStyle);\r\n" + 
	  "		this._oddStyle = oddStyle || {style: {backgroundColor: \"white\"}};\r\n" + 
	  "		this._evenStyle = evenStyle || {style: {backgroundColor: \"white\"}};\r\n" + 
	  "		this._numOfDigits = 0;\r\n" + 
	  "	}\r\n" + 
	  "	LineNumberRuler.prototype = new orion.textview.Ruler(); \r\n" + 
	  "	LineNumberRuler.prototype.getStyle = function(lineIndex) {\r\n" + 
	  "		if (lineIndex === undefined) {\r\n" + 
	  "			return this._rulerStyle;\r\n" + 
	  "		} else {\r\n" + 
	  "			return lineIndex & 1 ? this._oddStyle : this._evenStyle;\r\n" + 
	  "		}\r\n" + 
	  "	};\r\n" + 
	  "	LineNumberRuler.prototype.getHTML = function(lineIndex) {\r\n" + 
	  "		if (lineIndex === -1) {\r\n" + 
	  "			var model = this._editor.getModel();\r\n" + 
	  "			return model.getLineCount();\r\n" + 
	  "		} else {\r\n" + 
	  "			return lineIndex + 1;\r\n" + 
	  "		}\r\n" + 
	  "	};\r\n" + 
	  "	LineNumberRuler.prototype._onModelChanged = function(e) {\r\n" + 
	  "		var start = e.start;\r\n" + 
	  "		var model = this._editor.getModel();\r\n" + 
	  "		var lineCount = model.getLineCount();\r\n" + 
	  "		var numOfDigits = (lineCount+\"\").length;\r\n" + 
	  "		if (this._numOfDigits !== numOfDigits) {\r\n" + 
	  "			this._numOfDigits = numOfDigits;\r\n" + 
	  "			var startLine = model.getLineAtOffset(start);\r\n" + 
	  "			this._editor.redrawLines(startLine, lineCount, this);\r\n" + 
	  "		}\r\n" + 
	  "	};\r\n" + 
	  "	return LineNumberRuler;\r\n" + 
	  "}());\r\n" + 
	  "", 
	  //diff
	  "--- test1o.js	Fri Feb 18 11:25:03 2011\r\n" + 
	  "+++ test1n.js	Fri Feb 18 11:25:44 2011\r\n" + 
	  "@@ -10,10 +10,6 @@\r\n" + 
	  " 	Ruler.prototype = {\r\n" + 
	  " 		setEditor: function (editor) {\r\n" + 
	  " 			if (this._onModelChanged && this._editor) {\r\n" + 
	  "-				this._editor.removeEventListener(\"ModelChanged\", this, this._onModelChanged); \r\n" + 
	  "-			}\r\n" + 
	  "-			this._editor = editor;\r\n" + 
	  "-			if (this._onModelChanged && this._editor) {\r\n" + 
	  " 				this._editor.addEventListener(\"ModelChanged\", this, this._onModelChanged);\r\n" + 
	  " 			}\r\n" + 
	  " 		},\r\n" + 
	  "@@ -30,9 +26,6 @@\r\n" + 
	  " orion.textview.LineNumberRuler = (function() {\r\n" + 
	  " 	function LineNumberRuler (rulerLocation, rulerStyle, oddStyle, evenStyle) {\r\n" + 
	  " 		orion.textview.Ruler.call(this, rulerLocation, \"page\", rulerStyle);\r\n" + 
	  "-		this._oddStyle = oddStyle || {style: {backgroundColor: \"white\"}};\r\n" + 
	  "-		this._evenStyle = evenStyle || {style: {backgroundColor: \"white\"}};\r\n" + 
	  "-		this._numOfDigits = 0;\r\n" + 
	  " 	}\r\n" + 
	  " 	LineNumberRuler.prototype = new orion.textview.Ruler(); \r\n" + 
	  " 	LineNumberRuler.prototype.getStyle = function(lineIndex) {\r\n" + 
	  "@@ -43,9 +36,6 @@\r\n" + 
	  " 		}\r\n" + 
	  " 	};\r\n" + 
	  " 	LineNumberRuler.prototype.getHTML = function(lineIndex) {\r\n" + 
	  "-		if (lineIndex === -1) {\r\n" + 
	  "-			var model = this._editor.getModel();\r\n" + 
	  "-			return model.getLineCount();\r\n" + 
	  " 		} else {\r\n" + 
	  " 			return lineIndex + 1;\r\n" + 
	  " 		}\r\n" + 
	  "@@ -60,6 +50,9 @@\r\n" + 
	  " 			var startLine = model.getLineAtOffset(start);\r\n" + 
	  " 			this._editor.redrawLines(startLine, lineCount, this);\r\n" + 
	  " 		}\r\n" + 
	  "+		sdfasdfasdfasdfasd\r\n" + 
	  "+		asdfasdfasdfasdfasdfas\r\n" + 
	  "+		asdfasdfasdfas\r\n" + 
	  " 	};\r\n" + 
	  " 	return LineNumberRuler;\r\n" + 
	  " }());\r\n" + 
	  "" 
	]
	,
	//test 53
	[ "/*******************************************************************************\r\n" + 
			" * Copyright (c) 2010 IBM Corporation and others All rights reserved. This\r\n" + 
			" * program and the accompanying materials are made available under the terms of\r\n" + 
			" * the Eclipse Public License v1.0 which accompanies this distribution, and is\r\n" + 
			" * available at http://www.eclipse.org/legal/epl-v10.html\r\n" + 
			" * \r\n" + 
			" * Contributors: IBM Corporation - initial API and implementation\r\n" + 
			" ******************************************************************************/\r\n" + 
			"\r\n" + 
			"var eclipse = eclipse || {};\r\n" + 
			"\r\n" + 
			"orion.textview.Ruler = (function() {\r\n" + 
			"	function Ruler (rulerLocation, rulerOverview, rulerStyle) {\r\n" + 
			"		this._location = rulerLocation || \"left\";\r\n" + 
			"		this._overview = rulerOverview || \"page\";\r\n" + 
			"		this._rulerStyle = rulerStyle;\r\n" + 
			"		this._editor = null;\r\n" + 
			"	}\r\n" + 
			"	Ruler.prototype = {\r\n" + 
			"		setEditor: function (editor) {\r\n" + 
			"			if (this._onModelChanged && this._editor) {\r\n" + 
			"				this._editor.removeEventListener(\"ModelChanged\", this, this._onModelChanged); \r\n" + 
			"			}\r\n" + 
			"			this._editor = editor;\r\n" + 
			"			if (this._onModelChanged && this._editor) {\r\n" + 
			"				this._editor.addEventListener(\"ModelChanged\", this, this._onModelChanged);\r\n" + 
			"			}\r\n" + 
			"		},\r\n" + 
			"		getLocation: function() {\r\n" + 
			"			return this._location;\r\n" + 
			"		},\r\n" + 
			"		getOverview: function(editor) {\r\n" + 
			"			return this._overview;\r\n" + 
			"		}\r\n" + 
			"	};\r\n" + 
			"	return Ruler;\r\n" + 
			"}());\r\n" + 
			"\r\n" + 
			"orion.textview.LineNumberRuler = (function() {\r\n" + 
			"	function LineNumberRuler (rulerLocation, rulerStyle, oddStyle, evenStyle) {\r\n" + 
			"		orion.textview.Ruler.call(this, rulerLocation, \"page\", rulerStyle);\r\n" + 
			"		this._oddStyle = oddStyle || {style: {backgroundColor: \"white\"}};\r\n" + 
			"		this._evenStyle = evenStyle || {style: {backgroundColor: \"white\"}};\r\n" + 
			"		this._numOfDigits = 0;\r\n" + 
			"	}\r\n" + 
			"	LineNumberRuler.prototype = new orion.textview.Ruler(); \r\n" + 
			"	LineNumberRuler.prototype.getStyle = function(lineIndex) {\r\n" + 
			"		if (lineIndex === undefined) {\r\n" + 
			"			return this._rulerStyle;\r\n" + 
			"		} else {\r\n" + 
			"			return lineIndex & 1 ? this._oddStyle : this._evenStyle;\r\n" + 
			"		}\r\n" + 
			"	};\r\n" + 
			"	LineNumberRuler.prototype.getHTML = function(lineIndex) {\r\n" + 
			"		if (lineIndex === -1) {\r\n" + 
			"			var model = this._editor.getModel();\r\n" + 
			"			return model.getLineCount();\r\n" + 
			"		} else {\r\n" + 
			"			return lineIndex + 1;\r\n" + 
			"		}\r\n" + 
			"	};\r\n" + 
			"	LineNumberRuler.prototype._onModelChanged = function(e) {\r\n" + 
			"		var start = e.start;\r\n" + 
			"		var model = this._editor.getModel();\r\n" + 
			"		var lineCount = model.getLineCount();\r\n" + 
			"		var numOfDigits = (lineCount+\"\").length;\r\n" + 
			"		if (this._numOfDigits !== numOfDigits) {\r\n" + 
			"			this._numOfDigits = numOfDigits;\r\n" + 
			"			var startLine = model.getLineAtOffset(start);\r\n" + 
			"			this._editor.redrawLines(startLine, lineCount, this);\r\n" + 
			"		}\r\n" + 
			"	};\r\n" + 
			"	return LineNumberRuler;\r\n" + 
			"}());\r\n" + 
			"\r\n" + 
			"orion.textview.AnnotationRuler = (function() {\r\n" + 
			"	function AnnotationRuler (rulerLocation, rulerStyle, defaultAnnotation) {\r\n" + 
			"		orion.textview.Ruler.call(this, rulerLocation, \"page\", rulerStyle);\r\n" + 
			"		this._defaultAnnotation = defaultAnnotation;\r\n" + 
			"		this._annotations = [];\r\n" + 
			"	}\r\n" + 
			"	AnnotationRuler.prototype = new orion.textview.Ruler();\r\n" + 
			"	AnnotationRuler.prototype.clearAnnotations = function() {\r\n" + 
			"		this._annotations = [];\r\n" + 
			"		var lineCount = this._editor.getModel().getLineCount();\r\n" + 
			"		this._editor.redrawLines(0, lineCount, this);\r\n" + 
			"		if (this._overviewRuler) {\r\n" + 
			"			this._editor.redrawLines(0, lineCount, this._overviewRuler);\r\n" + 
			"		}\r\n" + 
			"	};\r\n" + 
			"	AnnotationRuler.prototype.getAnnotation = function(lineIndex) {\r\n" + 
			"		return this._annotations[lineIndex];\r\n" + 
			"	};\r\n" + 
			"	AnnotationRuler.prototype.getAnnotations = function() {\r\n" + 
			"		return this._annotations;\r\n" + 
			"	};\r\n" + 
			"	AnnotationRuler.prototype.getStyle = function(lineIndex) {\r\n" + 
			"		switch (lineIndex) {\r\n" + 
			"			case undefined:\r\n" + 
			"				return this._rulerStyle;\r\n" + 
			"			case -1:\r\n" + 
			"				return this._defaultAnnotation ? this._defaultAnnotation.style : null;\r\n" + 
			"			default:\r\n" + 
			"				return this._annotations[lineIndex] && this._annotations[lineIndex].style ? this._annotations[lineIndex].style : null;\r\n" + 
			"		}\r\n" + 
			"	};\r\n" + 
			"	AnnotationRuler.prototype.getHTML = function(lineIndex) {\r\n" + 
			"		if (lineIndex === -1) {\r\n" + 
			"			return this._defaultAnnotation ? this._defaultAnnotation.html : \"\";\r\n" + 
			"		} else {\r\n" + 
			"			return this._annotations[lineIndex] && this._annotations[lineIndex].html ? this._annotations[lineIndex].html : \"\";\r\n" + 
			"		}\r\n" + 
			"	};\r\n" + 
			"	AnnotationRuler.prototype.setAnnotation = function(lineIndex, annotation) {\r\n" + 
			"		if (lineIndex === undefined) { return; }\r\n" + 
			"		this._annotations[lineIndex] = annotation;\r\n" + 
			"		this._editor.redrawLines(lineIndex, lineIndex + 1, this);\r\n" + 
			"		if (this._overviewRuler) {\r\n" + 
			"			this._editor.redrawLines(lineIndex, lineIndex + 1, this._overviewRuler);\r\n" + 
			"		}\r\n" + 
			"	};\r\n" + 
			"	AnnotationRuler.prototype._onModelChanged = function(e) {\r\n" + 
			"		var start = e.start;\r\n" + 
			"		var removedLineCount = e.removedLineCount;\r\n" + 
			"		var addedLineCount = e.addedLineCount;\r\n" + 
			"		var linesChanged = addedLineCount - removedLineCount;\r\n" + 
			"		if (linesChanged) {\r\n" + 
			"			var model = this._editor.getModel();\r\n" + 
			"			var startLine = model.getLineAtOffset(start);\r\n" + 
			"			var newLines = [], lines = this._annotations;\r\n" + 
			"			var changed = false;\r\n" + 
			"			for (var prop in lines) {\r\n" + 
			"				var i = prop >>> 0;\r\n" + 
			"				if (!(startLine < i && i < startLine + removedLineCount)) {\r\n" + 
			"					var newIndex = i;\r\n" + 
			"					if (i > startLine) {\r\n" + 
			"						newIndex += linesChanged;\r\n" + 
			"						changed = true;\r\n" + 
			"					}\r\n" + 
			"					newLines[newIndex] = lines[i];\r\n" + 
			"				} else {\r\n" + 
			"					changed = true;\r\n" + 
			"				}\r\n" + 
			"			}\r\n" + 
			"			this._annotations = newLines;\r\n" + 
			"			if (changed) {\r\n" + 
			"				var lineCount = model.getLineCount();\r\n" + 
			"				this._editor.redrawLines(startLine, lineCount, this);\r\n" + 
			"				//TODO redraw overview (batch it for performance)\r\n" + 
			"				if (this._overviewRuler) {\r\n" + 
			"					this._editor.redrawLines(0, lineCount, this._overviewRuler);\r\n" + 
			"				}\r\n" + 
			"			}\r\n" + 
			"		}\r\n" + 
			"	};\r\n" + 
			"	return AnnotationRuler;\r\n" + 
			"}());\r\n" + 
			"\r\n" + 
			"orion.textview.OverviewRuler = (function() {\r\n" + 
			"	function OverviewRuler (rulerLocation, rulerStyle, annotationRuler) {\r\n" + 
			"		orion.textview.Ruler.call(this, rulerLocation, \"document\", rulerStyle);\r\n" + 
			"		this._annotationRuler = annotationRuler;\r\n" + 
			"		if (annotationRuler) {\r\n" + 
			"			annotationRuler._overviewRuler = this;\r\n" + 
			"		}\r\n" + 
			"	}\r\n" + 
			"	OverviewRuler.prototype = new orion.textview.Ruler();\r\n" + 
			"	OverviewRuler.prototype.getAnnotations = function() {\r\n" + 
			"		var annotations = this._annotationRuler.getAnnotations();\r\n" + 
			"		var lines = [];\r\n" + 
			"		for (var prop in annotations) {\r\n" + 
			"			var i = prop >>> 0;\r\n" + 
			"			if (annotations[i] !== undefined) {\r\n" + 
			"				lines.push(i);\r\n" + 
			"			}\r\n" + 
			"		}\r\n" + 
			"		return lines;\r\n" + 
			"	};\r\n" + 
			"	OverviewRuler.prototype.getStyle = function(lineIndex) {\r\n" + 
			"		var result, style;\r\n" + 
			"		if (lineIndex === undefined) {\r\n" + 
			"			result = this._rulerStyle || {};\r\n" + 
			"			style = result.style || (result.style = {});\r\n" + 
			"			style.lineHeight = \"1px\";\r\n" + 
			"			style.fontSize = \"1px\";\r\n" + 
			"			style.width = \"14px\";\r\n" + 
			"		} else {\r\n" + 
			"			if (lineIndex !== -1) {\r\n" + 
			"				var annotation = this._annotationRuler.getAnnotation(lineIndex);\r\n" + 
			"				result = annotation.overviewStyle || {};\r\n" + 
			"			} else {\r\n" + 
			"				result = {};\r\n" + 
			"			}\r\n" + 
			"			style = result.style || (result.style = {});\r\n" + 
			"			style.cursor = \"pointer\";\r\n" + 
			"			style.width = \"8px\";\r\n" + 
			"			style.height = \"3px\";\r\n" + 
			"			style.left = \"2px\";\r\n" + 
			"		}\r\n" + 
			"		return result;\r\n" + 
			"	};\r\n" + 
			"	OverviewRuler.prototype.getHTML = function(lineIndex) {\r\n" + 
			"		return \"&nbsp;\";\r\n" + 
			"	};\r\n" + 
			"	OverviewRuler.prototype.onClick = function(lineIndex, e) {\r\n" + 
			"		if (lineIndex === undefined) { return; }\r\n" + 
			"		this._editor.setTopIndex(lineIndex);\r\n" + 
			"	};\r\n" + 
			"	return OverviewRuler;\r\n" + 
			"}());", 
	  "--- test1o.js	Sat Feb 19 11:08:44 2011\r\n" + 
	  "+++ test1n.js	Sat Feb 19 11:10:04 2011\r\n" + 
	  "@@ -1,3 +1,9 @@\r\n" + 
	  "+\r\n" + 
	  "+\r\n" + 
	  "+\r\n" + 
	  "+\r\n" + 
	  "+\r\n" + 
	  "+\r\n" + 
	  " /*******************************************************************************\r\n" + 
	  "  * Copyright (c) 2010 IBM Corporation and others All rights reserved. This\r\n" + 
	  "  * program and the accompanying materials are made available under the terms of\r\n" + 
	  "@@ -9,8 +15,12 @@\r\n" + 
	  " \r\n" + 
	  " var eclipse = eclipse || {};\r\n" + 
	  " \r\n" + 
	  "-orion.textview.Ruler = (function() {\r\n" + 
	  "-	function Ruler (rulerLocation, rulerOverview, rulerStyle) {\r\n" + 
	  "+orion.textview.Ruler11111111 = (function() {\r\n" + 
	  "+	function Ruler (rulerLocation111111111, rulerOverview, rulerStyle) {\r\n" + 
	  "+		sfsaf\r\n" + 
	  "+		asdfasfas\r\n" + 
	  "+		\r\n" + 
	  "+		\r\n" + 
	  " 		this._location = rulerLocation || \"left\";\r\n" + 
	  " 		this._overview = rulerOverview || \"page\";\r\n" + 
	  " 		this._rulerStyle = rulerStyle;\r\n" + 
	  "@@ -37,10 +47,8 @@\r\n" + 
	  " }());\r\n" + 
	  " \r\n" + 
	  " orion.textview.LineNumberRuler = (function() {\r\n" + 
	  "-	function LineNumberRuler (rulerLocation, rulerStyle, oddStyle, evenStyle) {\r\n" + 
	  "-		orion.textview.Ruler.call(this, rulerLocation, \"page\", rulerStyle);\r\n" + 
	  "-		this._oddStyle = oddStyle || {style: {backgroundColor: \"white\"}};\r\n" + 
	  "-		this._evenStyle = evenStyle || {style: {backgroundColor: \"white\"}};\r\n" + 
	  "+		this._oddStyle11111 = oddStyle || {style: {backgroundColor: \"white\"}};\r\n" + 
	  "+		this._evenStyle1111 = evenStyle || {style: {backgroundColor: \"white\"}};\r\n" + 
	  " 		this._numOfDigits = 0;\r\n" + 
	  " 	}\r\n" + 
	  " 	LineNumberRuler.prototype = new orion.textview.Ruler(); \r\n" + 
	  "@@ -59,6 +67,38 @@\r\n" + 
	  " 			return lineIndex + 1;\r\n" + 
	  " 		}\r\n" + 
	  " 	};\r\n" + 
	  "+	LineNumberRuler.prototype.getHTML = function(lineIndex) {\r\n" + 
	  "+		if (lineIndex === -1) {\r\n" + 
	  "+			var model = this._editor.getModel();\r\n" + 
	  "+			return model.getLineCount();\r\n" + 
	  "+		} else {\r\n" + 
	  "+			return lineIndex + 1;\r\n" + 
	  "+		}\r\n" + 
	  "+	};\r\n" + 
	  "+	LineNumberRuler.prototype.getHTML = function(lineIndex) {\r\n" + 
	  "+		if (lineIndex === -1) {\r\n" + 
	  "+			var model = this._editor.getModel();\r\n" + 
	  "+			return model.getLineCount();\r\n" + 
	  "+		} else {\r\n" + 
	  "+			return lineIndex + 1;\r\n" + 
	  "+		}\r\n" + 
	  "+	};\r\n" + 
	  "+	LineNumberRuler.prototype.getHTML = function(lineIndex) {\r\n" + 
	  "+		if (lineIndex === -1) {\r\n" + 
	  "+			var model = this._editor.getModel();\r\n" + 
	  "+			return model.getLineCount();\r\n" + 
	  "+		} else {\r\n" + 
	  "+			return lineIndex + 1;\r\n" + 
	  "+		}\r\n" + 
	  "+	};\r\n" + 
	  "+	LineNumberRuler.prototype.getHTML = function(lineIndex) {\r\n" + 
	  "+		if (lineIndex === -1) {\r\n" + 
	  "+			var model = this._editor.getModel();\r\n" + 
	  "+			return model.getLineCount();\r\n" + 
	  "+		} else {\r\n" + 
	  "+			return lineIndex + 1;\r\n" + 
	  "+		}\r\n" + 
	  "+	};\r\n" + 
	  " 	LineNumberRuler.prototype._onModelChanged = function(e) {\r\n" + 
	  " 		var start = e.start;\r\n" + 
	  " 		var model = this._editor.getModel();\r\n" + 
	  "@@ -93,17 +133,6 @@\r\n" + 
	  " 	};\r\n" + 
	  " 	AnnotationRuler.prototype.getAnnotations = function() {\r\n" + 
	  " 		return this._annotations;\r\n" + 
	  "-	};\r\n" + 
	  "-	AnnotationRuler.prototype.getStyle = function(lineIndex) {\r\n" + 
	  "-		switch (lineIndex) {\r\n" + 
	  "-			case undefined:\r\n" + 
	  "-				return this._rulerStyle;\r\n" + 
	  "-			case -1:\r\n" + 
	  "-				return this._defaultAnnotation ? this._defaultAnnotation.style : null;\r\n" + 
	  "-			default:\r\n" + 
	  "-				return this._annotations[lineIndex] && this._annotations[lineIndex].style ? this._annotations[lineIndex].style : null;\r\n" + 
	  "-		}\r\n" + 
	  "-	};\r\n" + 
	  " 	AnnotationRuler.prototype.getHTML = function(lineIndex) {\r\n" + 
	  " 		if (lineIndex === -1) {\r\n" + 
	  " 			return this._defaultAnnotation ? this._defaultAnnotation.html : \"\";\r\n" + 
	  "@@ -207,4 +236,7 @@\r\n" + 
	  " 		this._editor.setTopIndex(lineIndex);\r\n" + 
	  " 	};\r\n" + 
	  " 	return OverviewRuler;\r\n" + 
	  "-}());\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "+}());\r\n" + 
	  "+asdfasdfasdfasdf\r\n" + 
	  "+asdfasdfasdfasdfasd\r\n" + 
	  "+asdfasdfasdfdasf\r\n" + 
	  "\\ No newline at end of file\r\n" + 
	  "" 
	]
	,
	[
	 "<!doctype html>\r\n" + 
	 "<html style=\"height: 100%\" >\r\n" + 
	 "    <head>\r\n" + 
	 "		<meta name=\"copyright\" content=\"Copyright (c) IBM Corporation and others 2010.\" >\r\n" + 
	 "		<meta http-equiv=\"Content-Language\" content=\"en-us\">\r\n" + 
	 "		<meta http-equiv=\"Content-Type\" content=\"text/html; charset=ISO-8859-1\">\r\n" + 
	 "    	<title>Orion Navigator</title>    \r\n" + 
	 "    \r\n" + 
	 "    <script type=\"text/javascript\">\r\n" + 
	 "        var djConfig = {\r\n" + 
	 "		isDebug: true,\r\n" + 
	 "		modulePaths: {\'widgets\': \'/orion/widgets\'},\r\n" + 
	 "		parseOnLoad: true\r\n" + 
	 "        };\r\n" + 
	 "    </script>\r\n" + 
	 "    <script type=\"text/javascript\" src=\"/org.dojotoolkit/dojo/dojo.js.uncompressed.js\"></script>\r\n" + 
	 "    <script type=\"text/javascript\">\r\n" + 
	 "	dojo.require(\"dijit.Dialog\");\r\n" + 
	 "	dojo.require(\"dijit.form.TextBox\"); dojo.require(\"dijit.form.ComboBox\");\r\n" + 
	 "	dojo.require(\"dijit.form.CheckBox\");\r\n" + 
	 "	dojo.require(\"dojo.data.ItemFileReadStore\");\r\n" + 
	 "	dojo.require(\"widgets.NewItemDialog\");\r\n" + 
	 "	dojo.require(\"widgets.OpenResourceDialog\");\r\n" + 
	 "	dojo.require(\"widgets.ImportDialog\");\r\n" + 
	 " 	</script>    	\r\n" + 
	 "	<style type=\"text/css\">\r\n" + 
	 "		@import \"/org.dojotoolkit/dojo/resources/dojo.css\";\r\n" + 
	 "		@import \"/org.dojotoolkit/dijit/themes/soria/soria.css\";\r\n" + 
	 "		@import \"/org.dojotoolkit/dijit/themes/soria/layout/BorderContainer.css\";\r\n" + 
	 "		@import \"/org.dojotoolkit/dijit/themes/soria/form/Common.css\";\r\n" + 
	 "		@import \"/org.dojotoolkit/dijit/themes/soria/form/Button.css\";\r\n" + 
	 "		@import \"/org.dojotoolkit/dijit/themes/soria/ProgressBar.css\";\r\n" + 
	 "		@import \"/org.dojotoolkit/dojox/form/resources/FileUploader.css\";\r\n" + 
	 "	    @import \"/ide.css\";\r\n" + 
	 "	    @import \"/breadcrumbs.css\"; \r\n" + 
	 "	    @import \"/commands.css\";\r\n" + 
	 "	</style>\r\n" + 
	 "	\r\n" + 
	 "	<!-- Authentication (required for handleAuthenticationError) -->\r\n" + 
	 "	<script type=\"text/javascript\" src=\"js/auth.js\"></script>\r\n" + 
	 "	  	\r\n" + 
	 "   </head>\r\n" + 
	 "\r\n" + 
	 "    <body style=\"height: 100%\" class=\"soria\">\r\n" + 
	 "    \r\n" + 
	 "    <script type=\"text/javascript\" src=\"/openajax/release/all/OpenAjaxManagedHub-all.js\"></script>\r\n" + 
	 "    \r\n" + 
	 "    <!-- Extension Registry -->\r\n" + 
	 "	<script src=\"js/serviceregistry.js\"></script>\r\n" + 
	 "	<script src=\"js/pluginregistry.js\"></script>\r\n" + 
	 "        \r\n" + 
	 "    <!-- Eclipse Application Services -->\r\n" + 
	 "    <!-- START:eas.js -->\r\n" + 
	 " 	<script src=\"js/util.js\"></script>\r\n" + 
	 " 	<script src=\"js/commands.js\"></script>\r\n" + 
	 " 	<script src=\"js/dialogs.js\"></script>\r\n" + 
	 " 	<script src=\"js/input.js\"></script>\r\n" + 
	 " 	<script src=\"js/log.js\"></script>\r\n" + 
	 " 	<script src=\"js/selection.js\"></script>\r\n" + 
	 " 	<script src=\"js/status.js\"></script>\r\n" + 
	 " 	<script src=\"js/users.js\"></script>\r\n" + 
	 "\r\n" + 
	 "	<!-- END:eas.js -->\r\n" + 
	 "	<!-- INSERT:eas.js -->\r\n" + 
	 " 	\r\n" + 
	 "	<!-- Breadcrumbs, table -->\r\n" + 
	 "	<!-- START:navigate-table.js -->\r\n" + 
	 "	<script src=\"js/globalCommands.js\"></script>\r\n" + 
	 "	<!-- END:navigate-table.js -->\r\n" + 
	 " 	<!-- INSERT:navigate-table.js -->\r\n" + 
	 "	\r\n" + 
	 "	<div dojoType=\"dijit.layout.BorderContainer\" design=\"headline\" liveSplitters=\"true\" persist=\"true\" gutters=\"true\" style=\"width: 100%; height: 100%;\">\r\n" + 
	 "		<div class=\"toolbar\" id=\"toolbar\" dojoType=\"dijit.layout.ContentPane\" region=\"top\">\r\n" + 
	 "		</div>\r\n" + 
	 "		\r\n" + 
	 "		<div class=\"paneScrolled\" dojoType=\"dijit.layout.BorderContainer\" design=\"headline\"  liveSplitters=\"true\" persist=\"true\" gutters=\"true\" region=\"leading\" splitter=\"false\">\r\n" + 
	 "			<div class=\"paneScrolled\" id=\"unstagePane\" dojoType=\"dijit.layout.ContentPane\" region=\"center\"  splitter=\"true\">				\r\n" + 
	 "				<div id=\"result\">\r\n" + 
	 "				</div>\r\n" + 
	 "			</div>\r\n" + 
	 "			<div class=\"paneScrolled\" id=\"statgePane\" dojoType=\"dijit.layout.ContentPane\" region=\"bottom\" style=\"height: 40%\" splitter=\"true\">\r\n" + 
	 "				<div id=\"details\">\r\n" + 
	 "					<h2>Failure Stack ...</h2>\r\n" + 
	 "					<div id=\"stackDetails\"></div>\r\n" + 
	 "				</div>\r\n" + 
	 "			</div>\r\n" + 
	 "		</div>\r\n" + 
	 "		\r\n" + 
	 "		<div class=\"paneScrolled\" style=\"margin-left: 8px;\" id=\"rightPane\" dojoType=\"dijit.layout.ContentPane\" region=\"center\" style=\"width: 80%; height: 100%;\" splitter=\"false\">\r\n" + 
	 "			<div id=\"inline-compare-view\">\r\n" + 
	 "				<!-- Breadcrumbs, tree content go here -->\r\n" + 
	 "			</div>\r\n" + 
	 "		</div>\r\n" + 
	 "	</div>\r\n" + 
	 "	\r\n" + 
	 "</body>\r\n" + 
	 "</html>\r\n" + 
	 "",
	 "--- test1n.js	Sat Feb 26 13:01:20 2011\r\n" + 
	 "+++ test1o.js	Sat Feb 26 13:00:38 2011\r\n" + 
	 "@@ -5,24 +5,21 @@\r\n" + 
	 " 		<meta http-equiv=\"Content-Language\" content=\"en-us\">\r\n" + 
	 " 		<meta http-equiv=\"Content-Type\" content=\"text/html; charset=ISO-8859-1\">\r\n" + 
	 "-    	<title>Orion Navigator</title>    \r\n" + 
	 "+    	<title>Git Status</title>    \r\n" + 
	 "     \r\n" + 
	 "     <script type=\"text/javascript\">\r\n" + 
	 "         var djConfig = {\r\n" + 
	 "-		isDebug: true,\r\n" + 
	 "-		modulePaths: {\'widgets\': \'/orion/widgets\'},\r\n" + 
	 "-		parseOnLoad: true\r\n" + 
	 "+		    isDebug:false,\r\n" + 
	 "+			modulePaths: {\'widgets\': \'/orion/widgets\'},\r\n" + 
	 "+		    parseOnLoad:true\r\n" + 
	 "         };\r\n" + 
	 "     </script>\r\n" + 
	 "     <script type=\"text/javascript\" src=\"/org.dojotoolkit/dojo/dojo.js.uncompressed.js\"></script>\r\n" + 
	 "     <script type=\"text/javascript\">\r\n" + 
	 "-	dojo.require(\"dijit.Dialog\");\r\n" + 
	 "-	dojo.require(\"dijit.form.TextBox\"); dojo.require(\"dijit.form.ComboBox\");\r\n" + 
	 "-	dojo.require(\"dijit.form.CheckBox\");\r\n" + 
	 "-	dojo.require(\"dojo.data.ItemFileReadStore\");\r\n" + 
	 "-	dojo.require(\"widgets.NewItemDialog\");\r\n" + 
	 "-	dojo.require(\"widgets.OpenResourceDialog\");\r\n" + 
	 "-	dojo.require(\"widgets.ImportDialog\");\r\n" + 
	 "+		dojo.require(\"dijit.Dialog\");\r\n" + 
	 "+ 	    dojo.require(\"dijit.form.TextBox\");\r\n" + 
	 "+		dojo.require(\"widgets.NewItemDialog\");\r\n" + 
	 "+		dojo.require(\"widgets.OpenResourceDialog\");\r\n" + 
	 "  	</script>    	\r\n" + 
	 " 	<style type=\"text/css\">\r\n" + 
	 " 		@import \"/org.dojotoolkit/dojo/resources/dojo.css\";\r\n" + 
	 "@@ -30,69 +27,322 @@\r\n" + 
	 " 		@import \"/org.dojotoolkit/dijit/themes/soria/layout/BorderContainer.css\";\r\n" + 
	 " 		@import \"/org.dojotoolkit/dijit/themes/soria/form/Common.css\";\r\n" + 
	 " 		@import \"/org.dojotoolkit/dijit/themes/soria/form/Button.css\";\r\n" + 
	 "-		@import \"/org.dojotoolkit/dijit/themes/soria/ProgressBar.css\";\r\n" + 
	 "-		@import \"/org.dojotoolkit/dojox/form/resources/FileUploader.css\";\r\n" + 
	 " 	    @import \"/ide.css\";\r\n" + 
	 " 	    @import \"/breadcrumbs.css\"; \r\n" + 
	 "-	    @import \"/commands.css\";\r\n" + 
	 " 	</style>\r\n" + 
	 " 	\r\n" + 
	 "+	<!-- Extension Registry -->\r\n" + 
	 "+	<script type=\"text/javascript\" src=\"/openajax/release/all/OpenAjaxManagedHub-all.js\"></script>\r\n" + 
	 "+	<script src=\"js/serviceregistry.js\"></script>\r\n" + 
	 "+	\r\n" + 
	 " 	<!-- Authentication (required for handleAuthenticationError) -->\r\n" + 
	 " 	<script type=\"text/javascript\" src=\"js/auth.js\"></script>\r\n" + 
	 "+\r\n" + 
	 "+	<!-- Commands-->\r\n" + 
	 "+	<script src=\"js/commands.js\"></script>\r\n" + 
	 "+	  	\r\n" + 
	 "+ 	\r\n" + 
	 "+ <script language=\"javascript\" type=\"text/javascript\" src=\"/editor/orion/editor.js\"></script>\r\n" + 
	 "+<script language=\"javascript\" type=\"text/javascript\" src=\"/editor/orion/model.js\"></script>\r\n" + 
	 "+<script language=\"javascript\" type=\"text/javascript\" src=\"js/compare/diff-parser.js\"></script>\r\n" + 
	 "+<script language=\"javascript\" type=\"text/javascript\" src=\"js/compare/rulers-inline.js\"></script>\r\n" + 
	 "+<script language=\"javascript\" type=\"text/javascript\" src=\"js/compare/compare-model.js\"></script>\r\n" + 
	 "+<script language=\"javascript\" type=\"text/javascript\" src=\"js/compare/diff-line-feeder.js\"></script>\r\n" + 
	 " 	  	\r\n" + 
	 "-   </head>\r\n" + 
	 "+<script language=\"javascript\" type=\"text/javascript\">\r\n" + 
	 "+\r\n" + 
	 "+var editorReadOnly = true;\r\n" + 
	 "+\r\n" + 
	 "+function initEditor(editor){\r\n" + 
	 "+	var rulerOrigin = new eclipse.LineNumberDiffRuler(false,\"left\", {styleClass: \"ruler_lines\"}, {styleClass: \"ruler_lines_odd\"}, {styleClass: \"ruler_lines_even\"});\r\n" + 
	 "+	var rulerNew = new eclipse.LineNumberDiffRuler(true,\"left\", {styleClass: \"ruler_lines\"}, {styleClass: \"ruler_lines_odd\"}, {styleClass: \"ruler_lines_even\"});\r\n" + 
	 "+	editor.addRuler(rulerOrigin);\r\n" + 
	 "+	editor.addRuler(rulerNew);\r\n" + 
	 "+}\r\n" + 
	 "+var editor;\r\n" + 
	 "+\r\n" + 
	 "+function createEditor(input , diff , delim){\r\n" + 
	 "+	var diffParser = new eclipse.DiffParser(delim);\r\n" + 
	 "+	var result = diffParser.parse(input ,diff,false);\r\n" + 
	 "+	var output = result.outPutFile;\r\n" + 
	 "+	var mapper = result.mapper;\r\n" + 
	 "+	\r\n" + 
	 "+	var model = new orion.textview.TextModel(input, delim);\r\n" + 
	 "+	//var compareModelRight = new eclipse.GapTextModel(modelRight, true , mapper);\r\n" + 
	 "+	var compareModel = new eclipse.CompareTextModel(model, {mapper:mapper , columnIndex:0} , new eclipse.DiffLineFeeder(mapper , diffParser.getDiffArray() , delim));\r\n" + 
	 "+	\r\n" + 
	 "+	var options = {\r\n" + 
	 "+		parent: \"inline-compare-viewer\",\r\n" + 
	 "+		model: compareModel,\r\n" + 
	 "+		readonly: editorReadOnly,\r\n" + 
	 "+		stylesheet: \"js/compare/demo/editor.css\" \r\n" + 
	 "+	};\r\n" + 
	 "+	editor = new orion.textview.TextView(options);\r\n" + 
	 "+	initEditor(editor);\r\n" + 
	 "+	editor.addEventListener(\"LineStyle\", window, function(lineStyleEvent) {\r\n" + 
	 "+		var lineIndex = lineStyleEvent.lineIndex;\r\n" + 
	 "+		var lineStart = lineStyleEvent.lineStart;\r\n" + 
	 "+		var lineType = compareModel.getLineType(lineIndex);\r\n" + 
	 "+		//lineStyleEvent.ranges = [];\r\n" + 
	 "+		//lineStyleEvent.ranges.push ({start: lineStart, end: lineStart + 3, style: {style: {backgroundColor: \"blue\"} }});\r\n" + 
	 "+		if(lineType === \"added\") {\r\n" + 
	 "+			lineStyleEvent.style = {style: {backgroundColor: \"#99EE99\"}};\r\n" + 
	 "+		} else if (lineType === \"removed\"){\r\n" + 
	 "+			lineStyleEvent.style = {style: {backgroundColor: \"#EE9999\"}};\r\n" + 
	 "+		} \r\n" + 
	 "+	}); \r\n" + 
	 "+\r\n" + 
	 "+	editor.redrawRange();\r\n" + 
	 "+}\r\n" + 
	 "+\r\n" + 
	 "+var fileContent ;\r\n" + 
	 "+var fileDiff;\r\n" + 
	 "+function getFileContentGit(hashValue){\r\n" + 
	 "+	\r\n" + 
	 "+	var url = \"/git/index\" + hashValue;\r\n" + 
	 "+	dojo.xhrGet({\r\n" + 
	 "+		url: url, //\"/git/index\" + hashValue;//file/K/bundles/org.eclipse.orion.client.core/static/orion/compare/demo/demo.html\"\r\n" + 
	 "+		//adding some thing \r\n" + 
	 "+		headers: {\r\n" + 
	 "+			\"Orion-Version\": \"1\"\r\n" + 
	 "+		},\r\n" + 
	 "+		handleAs: \"text\",\r\n" + 
	 "+		timeout: 5000,\r\n" + 
	 "+		//adding\r\n" + 
	 "+		load: function(jsonData, ioArgs) {\r\n" + 
	 "+			console.log(jsonData);\r\n" + 
	 "+			fileContent = jsonData;\r\n" + 
	 "+			getFileDiffGit(hashValue);\r\n" + 
	 "+		},\r\n" + 
	 "+		\r\n" + 
	 "+		///adding\r\n" + 
	 "+		///adding\r\n" + 
	 "+		\r\n" + 
	 "+		error: function(response, ioArgs) {\r\n" + 
	 "+			console.error(\"HTTP status code: \", ioArgs.xhr.status);\r\n" + 
	 "+			handleGetAuthenticationError(this, ioArgs);\r\n" + 
	 "+			return response;\r\n" + 
	 "+		}\r\n" + 
	 "+	});\r\n" + 
	 "+	\r\n" + 
	 "+}\r\n" + 
	 "+\r\n" + 
	 "+// THis needs a comment.\r\n" + 
	 "+function getFileDiffGit(hashValue){\r\n" + 
	 "+	\r\n" + 
	 "+	var url = \"/git/diff\" + hashValue;\r\n" + 
	 "+	dojo.xhrGet({\r\n" + 
	 "+		url: url , //\"/git/diff\" + hashValue;///file/K/bundles/org.eclipse.orion.client.core/static/orion/compare/demo/demo.htmlsfasf\"\r\n" + 
	 "+		//changing some thing\r\n" + 
	 "+		headers: {\r\n" + 
	 "+			\"Orion-Version\": \"1\"\r\n" + 
	 "+		},\r\n" + 
	 "+		handleAs: \"text\",\r\n" + 
	 "+		timeout: 5000,\r\n" + 
	 "+		load: function(jsonData, ioArgs) {\r\n" + 
	 "+			//addingg\r\n" + 
	 "+			console.log(jsonData);\r\n" + 
	 "+			fileDiff = jsonData;\r\n" + 
	 "+			createEditor(fileContent , fileDiff ,\"\\n\");\r\n" + 
	 "+		},\r\n" + 
	 "+		error: function(response, ioArgs) {\r\n" + 
	 "+			console.error(\"HTTP status code: \", ioArgs.xhr.status);\r\n" + 
	 "+			handleGetAuthenticationError(this, ioArgs);\r\n" + 
	 "+			return response;\r\n" + 
	 "+		}\r\n" + 
	 "+	});\r\n" + 
	 "+	\r\n" + 
	 "+}\r\n" + 
	 "+\r\n" + 
	 "+window.onload = function() {\r\n" + 
	 "+	var splitted = window.location.href.split(\'#\');\r\n" + 
	 "+	if(splitted.length > 1){\r\n" + 
	 "+		getFileContentGit(splitted[1]);\r\n" + 
	 "+	}\r\n" + 
	 "+};\r\n" + 
	 "+</script>\r\n" + 
	 "+</head>\r\n" + 
	 " \r\n" + 
	 "     <body style=\"height: 100%\" class=\"soria\">\r\n" + 
	 "     \r\n" + 
	 "-    <script type=\"text/javascript\" src=\"/openajax/release/all/OpenAjaxManagedHub-all.js\"></script>\r\n" + 
	 "-    \r\n" + 
	 "-    <!-- Extension Registry -->\r\n" + 
	 "-	<script src=\"js/serviceregistry.js\"></script>\r\n" + 
	 "-	<script src=\"js/pluginregistry.js\"></script>\r\n" + 
	 "-        \r\n" + 
	 "-    <!-- Eclipse Application Services -->\r\n" + 
	 "-    <!-- START:eas.js -->\r\n" + 
	 "+    <!-- Utilities -->\r\n" + 
	 "  	<script src=\"js/util.js\"></script>\r\n" + 
	 "- 	<script src=\"js/commands.js\"></script>\r\n" + 
	 "- 	<script src=\"js/dialogs.js\"></script>\r\n" + 
	 "- 	<script src=\"js/input.js\"></script>\r\n" + 
	 "- 	<script src=\"js/log.js\"></script>\r\n" + 
	 "- 	<script src=\"js/selection.js\"></script>\r\n" + 
	 "- 	<script src=\"js/status.js\"></script>\r\n" + 
	 "- 	<script src=\"js/users.js\"></script>\r\n" + 
	 "-\r\n" + 
	 "-	<!-- END:eas.js -->\r\n" + 
	 "-	<!-- INSERT:eas.js -->\r\n" + 
	 "  	\r\n" + 
	 "-	<!-- Breadcrumbs, table -->\r\n" + 
	 "-	<!-- START:navigate-table.js -->\r\n" + 
	 "-	<script src=\"js/globalCommands.js\"></script>\r\n" + 
	 "-	<!-- END:navigate-table.js -->\r\n" + 
	 "- 	<!-- INSERT:navigate-table.js -->\r\n" + 
	 "+ 	\r\n" + 
	 "+ 	<!-- Tree -->\r\n" + 
	 " 	\r\n" + 
	 "-	<div dojoType=\"dijit.layout.BorderContainer\" design=\"headline\" liveSplitters=\"true\" persist=\"true\" gutters=\"true\" style=\"width: 100%; height: 100%;\">\r\n" + 
	 "+	<!-- Favorites List -->\r\n" + 
	 "+	<script src=\"js/favorites.js\"></script>\r\n" + 
	 "+\r\n" + 
	 "+	<!--Search -->\r\n" + 
	 "+	<script src=\"js/searchClient.js\"></script>\r\n" + 
	 "+    <div dojoType=\"dijit.layout.BorderContainer\" design=\"headline\" liveSplitters=\"true\" persist=\"true\" gutters=\"true\" style=\"width: 100%; height: 100%;\" splitter=\"true\">\r\n" + 
	 " 		<div class=\"toolbar\" id=\"toolbar\" dojoType=\"dijit.layout.ContentPane\" region=\"top\">\r\n" + 
	 " 		</div>\r\n" + 
	 "-		\r\n" + 
	 "-		<div class=\"paneScrolled\" dojoType=\"dijit.layout.BorderContainer\" design=\"headline\"  liveSplitters=\"true\" persist=\"true\" gutters=\"true\" region=\"leading\" splitter=\"false\">\r\n" + 
	 "-			<div class=\"paneScrolled\" id=\"unstagePane\" dojoType=\"dijit.layout.ContentPane\" region=\"center\"  splitter=\"true\">				\r\n" + 
	 "-				<div id=\"result\">\r\n" + 
	 "+		<!--  \r\n" + 
	 "+   		<div dojoType=\"dijit.layout.BorderContainer\" design=\"headline\" liveSplitters=\"true\" region=\"leading\"   persist=\"true\" gutters=\"true\" style=\"width: 40%; height: 100%;\" splitter=\"true\">\r\n" + 
	 "+		-->\r\n" + 
	 "+		<div class=\"paneScrolled\" id=\"statusPane\" dojoType=\"dijit.layout.ContentPane\" region=\"leading\"  style=\"width: 40%;\" splitter=\"true\">				\r\n" + 
	 "+				<table width=\"100%\">\r\n" + 
	 "+					<tr>\r\n" + 
	 "+						<td width=\"50%\" height=\"100%\">\r\n" + 
	 "+							<h2>Unstaged</h2>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td width=\"50%\" height=\"100%\" nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"right\">\r\n" + 
	 "+								<button id = \"stageAll\">Stage All</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+					</tr>\r\n" + 
	 "+				</table>\r\n" + 
	 "+				<hr>\r\n" + 
	 "+				<div id = \"unstagedZone\">\r\n" + 
	 "+				<table width=\"100%\" >\r\n" + 
	 "+					<tr>\r\n" + 
	 "+						<td width=\"100%\" nowrap=\"nowrap\">\r\n" + 
	 "+							<a href=\"http://www.ibm.com\">/file/K/bundles/org.eclipse.orion.client.core/static/orion/compare/demo/demo-inline.html</a>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"center\">\r\n" + 
	 "+								<button >Compare</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"center\">\r\n" + 
	 "+								<button \">Stage</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+					</tr>\r\n" + 
	 "+					<tr>\r\n" + 
	 "+						<td width=\"100%\" nowrap=\"nowrap\">\r\n" + 
	 "+							<a href=\"http://www.ibm.com\">/file/K/bundles/org.eclipse.orion.client.core/static/orion/compare/compare-model.js</a>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"center\">\r\n" + 
	 "+								<button >Compare</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"center\">\r\n" + 
	 "+								<button \">Stage</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+					</tr>\r\n" + 
	 "+				</table>\r\n" + 
	 " 				</div>\r\n" + 
	 "+				<table width=\"100%\" height = \"30px\">\r\n" + 
	 "+				</table>\r\n" + 
	 "+			<!-- \r\n" + 
	 " 			</div>\r\n" + 
	 "-			<div class=\"paneScrolled\" id=\"statgePane\" dojoType=\"dijit.layout.ContentPane\" region=\"bottom\" style=\"height: 40%\" splitter=\"true\">\r\n" + 
	 "-				<div id=\"details\">\r\n" + 
	 "-					<h2>Failure Stack ...</h2>\r\n" + 
	 "-					<div id=\"stackDetails\"></div>\r\n" + 
	 "+			<div class=\"paneScrolled\" id=\"stagedPane\" dojoType=\"dijit.layout.ContentPane\" region=\"bottom\" style=\"height: 50%\" splitter=\"true\">	\r\n" + 
	 "+			-->			\r\n" + 
	 "+				<table width=\"100%\">\r\n" + 
	 "+					<tr>\r\n" + 
	 "+						<td width=\"50%\" height=\"100%\">\r\n" + 
	 "+							<h2>Staged</h2>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td width=\"50%\" height=\"100%\" nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"right\">\r\n" + 
	 "+								<button id = \"stageAll\">Unstage All</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+					</tr>\r\n" + 
	 "+				</table>\r\n" + 
	 "+				<hr>\r\n" + 
	 "+				<div id = \"stagedZone\">\r\n" + 
	 "+				<table width=\"100%\" >\r\n" + 
	 "+					<tr>\r\n" + 
	 "+						<td width=\"100%\" nowrap=\"nowrap\">\r\n" + 
	 "+							<a href=\"http://www.ibm.com\">/file/K/bundles/org.eclipse.orion.client.core/static/orion/compare/diff-line-feeder.js</a>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"center\">\r\n" + 
	 "+								<button >Compare</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"center\">\r\n" + 
	 "+								<button \">Unstage</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+					</tr>\r\n" + 
	 "+					<tr>\r\n" + 
	 "+						<td width=\"100%\" nowrap=\"nowrap\">\r\n" + 
	 "+							<a href=\"http://www.ibm.com\">/file/K/bundles/org.eclipse.orion.client.core/static/orion/compare/gap-line-feeder.js</a>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"center\">\r\n" + 
	 "+								<button >Compare</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"center\">\r\n" + 
	 "+								<button \">Unstage</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+					</tr>\r\n" + 
	 "+					<tr>\r\n" + 
	 "+						<td width=\"100%\" nowrap=\"nowrap\">\r\n" + 
	 "+							<a href=\"http://www.ibm.com\">/file/K/bundles/org.eclipse.orion.client.core/static/orion/compare/diff-parser.js</a>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"center\">\r\n" + 
	 "+								<button >Compare</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: right;\" align=\"center\">\r\n" + 
	 "+								<button \">Unstage</button>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+					</tr>\r\n" + 
	 "+				</table>\r\n" + 
	 "+				</div>\r\n" + 
	 "+				<table width=\"100%\" height = \"30px\">\r\n" + 
	 "+				</table>\r\n" + 
	 "+\r\n" + 
	 "+				<div id = \"commitZone\">\r\n" + 
	 "+				<span>Commit Message : </span>\r\n" + 
	 "+				<table >\r\n" + 
	 "+					<tr>\r\n" + 
	 "+						<td nowrap=\"nowrap\">\r\n" + 
	 "+							<textarea  COLS=40 ROWS=6></textarea>\r\n" + 
	 "+						</td>\r\n" + 
	 "+						<td  nowrap=\"nowrap\">\r\n" + 
	 "+							<div style=\"float: top;\" align=\"top\">\r\n" + 
	 "+								<table>\r\n" + 
	 "+									<tr>\r\n" + 
	 "+										<td nowrap=\"nowrap\">\r\n" + 
	 "+											<button id = \"commit\">commit</button>\r\n" + 
	 "+										</td>\r\n" + 
	 "+									</tr>\r\n" + 
	 "+									<tr>\r\n" + 
	 "+										<td  nowrap=\"nowrap\">\r\n" + 
	 "+											<button id = \"commit\">ammend</button>\r\n" + 
	 "+										</td>\r\n" + 
	 "+									</tr>\r\n" + 
	 "+								</table>\r\n" + 
	 "+							</div>\r\n" + 
	 "+						</td>\r\n" + 
	 "+					</tr>\r\n" + 
	 "+				</table>\r\n" + 
	 " 				</div>\r\n" + 
	 "+\r\n" + 
	 "+			<!-- \r\n" + 
	 " 			</div>\r\n" + 
	 "+			-->\r\n" + 
	 " 		</div>\r\n" + 
	 "+\r\n" + 
	 " 		\r\n" + 
	 "-		<div class=\"paneScrolled\" style=\"margin-left: 8px;\" id=\"rightPane\" dojoType=\"dijit.layout.ContentPane\" region=\"center\" style=\"width: 80%; height: 100%;\" splitter=\"false\">\r\n" + 
	 "-			<div id=\"inline-compare-view\">\r\n" + 
	 "-				<!-- Breadcrumbs, tree content go here -->\r\n" + 
	 "+		<div id = \"rightPane\" style=\"overflow: hidden;\" dojoType=\"dijit.layout.ContentPane\" region=\"center\">\r\n" + 
	 "+			<div >\r\n" + 
	 "+				<h2>/file/K/bundles/org.eclipse.orion.client.core/static/orion/compare/demo/demo-inline.html</h2>\r\n" + 
	 "+			</div>\r\n" + 
	 "+			<hr>\r\n" + 
	 "+			<div id=\"inline-compare-viewer\" style=\"width: 100%; height: 100%;\">\r\n" + 
	 " 			</div>\r\n" + 
	 " 		</div>\r\n" + 
	 "+\r\n" + 
	 " 	</div>\r\n" + 
	 "-	\r\n" + 
	 " </body>\r\n" + 
	 "-</html>\r\n" + 
	 "+</html>\r\n" + 
	 "\\ No newline at end of file\r\n" + 
	 ""
	 ]
];
