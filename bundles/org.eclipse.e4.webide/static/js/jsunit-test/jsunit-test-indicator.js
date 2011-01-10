/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
eclipse = eclipse || {};
eclipse.TestIndicator = (function() {
	function Indicator(options) {
		this._testNumberId  = eclipse.uTestUtils.getOptionValue(options , "testNumberId" , eclipse.uTestConsts.STATE_TEST_NUMBER_ID);
		this._testFailureId  = eclipse.uTestUtils.getOptionValue(options , "testFailureId" , eclipse.uTestConsts.STATE_TEST_FAILURE_ID);
		this._testIndicatorId  = eclipse.uTestUtils.getOptionValue(options , "testIndicatorId" , eclipse.uTestConsts.STATE_TEST_INDICATOR_ID);
	}
	Indicator.prototype = {
		update: function(testNumber , failNumber){
			var testRuns = dojo.byId(this._testNumberId);
			if(testRuns !== undefined)
				testRuns.innerHTML = testNumber;
			var failures = dojo.byId(this._testFailureId);
			if(failures !== undefined)
				failures.innerHTML = failNumber;
			var testState = dojo.byId(this._testIndicatorId);
			if(testState !== undefined)
				testState.color = failNumber === 0 ? "green" : "red";
		}
	};
	return Indicator;
}());