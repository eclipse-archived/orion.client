/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define defineGlobal */

(define || function(deps, callback) { defineGlobal("tests/textview", deps, callback); })
(["orion/assert", 'orion/textview/textModel', 'orion/textview/annotations'], function(assert, mTextModel, mAnnotations) {

	var tests = {};
	
	tests.testAnnotationModel1 = function () {
//		                      1         2         3         4         5         6         7	
		var text = "01234567890123456789012345678901234567890123456789012345678901234567890123456789";
		var textModel = new mTextModel.TextModel(text, "\n");
		var annotationModel = new mAnnotations.AnnotationModel(textModel);
		var annotation1 = {start: 0, end: 5};
		var annotation2 = {start: 10, end: 15};
		var annotation3 = {start: 20, end: 30};
		var annotation4 = {start: 25, end: 35};
		var annotation5 = {start: 40, end: 60};
		var annotation6 = {start: 35, end: 45};
		var annotation7 = {start: 35, end: 65};
		annotationModel.addAnnotation(annotation1);
		annotationModel.addAnnotation(annotation2);
		annotationModel.addAnnotation(annotation3);
		annotationModel.addAnnotation(annotation4);
		annotationModel.addAnnotation(annotation5);
		annotationModel.addAnnotation(annotation6);
		annotationModel.addAnnotation(annotation7);
		var iter;
		
		iter = annotationModel.getAnnotations(0, 30);
		assert.equal(iter.hasNext(), true);
		assert.equal(iter.next(), annotation1);
		assert.equal(iter.hasNext(), true);
		assert.equal(iter.next(), annotation2);
		assert.equal(iter.hasNext(), true);
		assert.equal(iter.next(), annotation3);
		assert.equal(iter.hasNext(), true);
		assert.equal(iter.next(), annotation4);
		assert.equal(iter.hasNext(), false);
	};
	
	return tests;

});
