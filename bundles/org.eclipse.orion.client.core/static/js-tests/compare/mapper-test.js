/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

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
    var testFrom = 1;
    var testTo =  mapperTestCases.length;
    
	for(var i=(testFrom-1); i<testTo ; i++) {
		var testCase = mapperTestCases[i];
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
