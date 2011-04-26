/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
eclipse = eclipse || {};

eclipse.uTestConsts = eclipse.uTestConsts || {
	NAVIGATOR_DIV_ID: "nav-tree",
	NAVIGATOR_TREE_ID: "uTestNavTree",
    RESULT_DIV_ID: "result-tree",
    RESULT_TREE_ID: "uTestResultTree",
    RESULT_STACK_DTAILS:"stackDetails",
    STATE_TEST_NUMBER_ID:"testRuns",
    STATE_TEST_FAILURE_ID:"testFailures",
    STATE_TEST_INDICATOR_ID:"testState"
};

eclipse.uTestUtils = eclipse.uTestUtils || {
	getOptionValue: function ( option , optionField , defaultVal){
		var retVal = option === undefined ? undefined : option[optionField];
		if( retVal === undefined)
			retVal = defaultVal;
		return retVal;
	}
};


