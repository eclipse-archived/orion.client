var testCases = [
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
	//add 1 line to empty file
	[ 
	  //input file 
	  "", 
	  //diff
	  "@@ -0,0 +1 @@\n" + 
	  "+line 1", 
	  //output file
	  "line 1", 
	  //mapper
	  [[1,0,2]],
	  //description  
	  "add line 1 to empty file"]
	, 
	//add 2 lines to empty file
	[ 
	  //input file 
	  "", 
	  //diff
	  "@@ -0,0 +1,2 @@\n" + 
	  "+line 1\n" + 
	  "+line 2", 
	  //output file
	  "line 1\n" + 
	  "line 2", 
	  //mapper
	  [[2,0,2]],
	  //description  
	  "add 2 lines to empty file"]
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
	  " line 2", 
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
	  "+line 3", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3" + 
	  "", 
	  //mapper
	  [[2,2,0],[1,0,4]],
	  //description  
	  "add 1 line at end"]
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
	  "+line 4", 
	  //output file
	  "line 1\r\n" + 
	  "line 2\r\n" + 
	  "line 3\r\n" + 
	  "line 4\r\n" + 
	  "", 
	  //mapper
	  [[2,2,0],[2,0,4]],
	  //description  
	  "add 2 lines at end"]
	/*	adding more here ...
	changed one line
	added two lines to an empty file
	deleted two lines
	changed two lines
	added one line in the middle of a three line file
	add one line at the beginning and one line at the end to a file that had two lines
	total number of test cases: 20-40
	*/
/*	, 
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
*/	
];

function compareResult(result , expectedOutput , expectedMapper){
	var output = result[0];
	var mapping = result[1];
	for(var i = 0 ; i < mapping.length ; i++){
		for (var j = 0; j < 3;j++){
			if(expectedMapper[i][j] !== mapping[i][j])
				return "mapper failed at   " +i+":"+j;
		}
	} 
	if(expectedOutput !== output )
		return "out put file failed\n" + output;
	return "success !!!!!!!!!!!!!!!!!!!";
}

function runTests() {
    var diffParser = new eclipse.DiffParser();
	for(var i=0; i<testCases.length; i++) {
		var testCase = testCases[i];
		var input = testCase[0];
		var diff = testCase[1];
		var expectedOutput = testCase[2];
		var expectedMapper = testCase[3];
		var description = testCase[4];
		var j = i+1;
		console.log("*************************  test case " + j +":  " + description +"*********************");
		var result = diffParser.parse(input ,diff);
		var message = compareResult(result , expectedOutput , expectedMapper);
		console.log(message);
	}
}

window.onload = function() {
	runTests();
};
