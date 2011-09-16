/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global assertEquals orion AnnotationModelTestCase window*/

if (window.AsyncTestCase) {
	AnnotationModelTestCase = TestCase("AnnotationModelTestCase"); 
} else {
	function AnnotationModelTestCase (view) {
		
	}
//BAD should use Simon's framework ? 
	function assertEquals (msg, expected, actual) {
		if (expected !== actual) {
			if (window.log) {
				log ("Failed", msg, "Expected:", expected, "Actual:", actual)
			};
			return false;
		}
		return true;
	}
}

AnnotationModelTestCase.prototype = {
	test_annotationModelTest1: function () {
//		                      1         2         3         4         5         6         7	
		var text = "01234567890123456789012345678901234567890123456789012345678901234567890123456789";
		var textModel = new orion.textview.TextModel(text, "\n");
		var annotationModel = new orion.textview.AnnotationModel(textModel);
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
		assertEquals("", iter.hasNext(), true);
		assertEquals("", iter.next(), annotation1);
		assertEquals("", iter.hasNext(), true);
		assertEquals("", iter.next(), annotation2);
		assertEquals("", iter.hasNext(), true);
		assertEquals("", iter.next(), annotation3);
		assertEquals("", iter.hasNext(), true);
		assertEquals("", iter.next(), annotation4);
		assertEquals("", iter.hasNext(), false);
		
		
	}
};

