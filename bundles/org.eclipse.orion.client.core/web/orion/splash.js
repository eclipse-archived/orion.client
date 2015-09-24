/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define([], function() {

function step(description, type, total, incrementCount){
	
	this.TYPE_FILLER = 0;
	this.TYPE_DRIVEN = 1;
	
	this.type = type;
	this.incrementCount = incrementCount;
	this.total = total;
	this.description = description;
	
	this.WAITING = 0;
	this.HAPPENING = 1;
	this.COMPLETED = 2;
	this.state = this.WAITING;
	
	this.template = "";
	this.domNode;
	
	this.increments = 0;
}

step.prototype.complete = function(){
	this.state = this.COMPLETED;
	this.domNode.className = 'splashSuccessImage';
};

step.prototype.spin = function(){
	this.state = this.HAPPENING;
	this.domNode.className = 'splashLoadingImage';
};

step.prototype.getStepNode = function(){
	
	var stepNode = document.createElement( 'div' );
	stepNode.className = 'splashStep';
	stepNode.innerHTML =  '<div class="splashVisual">' + 
								'<div id="step' + this.order + '"></div>' +
							'</div>' +
							'<div class="splashVerbal">' + this.description + '</div>';
	
	this.domNode = stepNode.firstChild.firstChild;
	
	if (this.state === this.HAPPENING) {
		this.domNode.className = 'splashLoadingImage';
	} else if (this.state === this.COMPLETED) {
		this.domNode.className = 'splashSuccessImage';
	}
	
	return stepNode;
};

step.prototype.transition = function(){
	switch( this.state ){
	 
		case this.WAITING:
			this.state = this.HAPPENING;
			/* add happening class */
			break;
			
		case this.HAPPENING:
			this.state = this.COMPLETED;
			/* add completed class */
			break;
	}
};

function loader( domNode, subject ){

	this.domNode = domNode;
	this.content;
	this.title = subject;
	this.steps = [];   
	this.FILLER_TIMEOUT = 200;
	this.progressbar = 'progressbar';
	
	this.template = '<div class="splashLoader">' +
						'<div class="splashAbout">Setting up workspace</div>' +
						'<div class="splashProgressbar">' +
							'<progress id ="' + this.progressbar + '"></progress>' +
						'</div>' +
						'<div id="steps" class="splashSteps">' +
						'</div>' +
					'</div>';   
	
	this.initialize();
	
	this.interval;
	
	this.currentStep = -1;
}

loader.prototype.showFillerProgress = function(){

	var splashProgress = this.splashProgress;
	
	var cs = this.steps[ this.currentStep ];
	
	var total = 0;
	
	for( var s = 0; s <= cs.order; s++ ){
		total = total + this.steps[s].total;
	}

	if( splashProgress  ) {	
		var increment = ( total - splashProgress.value )/5;
		splashProgress.value = splashProgress.value + increment;
	}	
};

loader.prototype.startFillerProgress = function(){   
	var myloader = this;
	this.interval = setInterval( function(){ myloader.showFillerProgress(); }, this.FILLER_TIMEOUT );
};
	
loader.prototype.completeFillerProgress = function (){
	clearInterval( this.interval );		
};

loader.prototype.nextStep = function(){
			
	var myStep;
	
	/* complete current step */
	
	if( this.currentStep >= 0  ){
		
		myStep = this.steps[this.currentStep];
	
		switch( myStep.type ){

			case myStep.TYPE_FILLER:
				this.completeFillerProgress();
				myStep.complete();
				break;

			case myStep.TYPE_DRIVEN:
				myStep.complete();
				break;
		}
	}
	
	/* initaliate next step */
	this.currentStep = this.currentStep + 1;
	
	myStep = this.steps[this.currentStep];
	
	if (!myStep) return;
	
	switch( myStep.type ){

			case myStep.TYPE_FILLER:
				this.startFillerProgress();
				myStep.spin();
				break;

			case myStep.TYPE_DRIVEN:
				 myStep.spin();
				break;
	}
};

loader.prototype.initialize = function(){
	this.content = document.getElementById( this.domNode );
	this.content.innerHTML = this.template;
	this.splashProgress = document.getElementById( this.progressbar );
	this.splashProgress.value = 0;
};

loader.prototype.emptySteps = function(){
	var stepsNode = document.getElementById( 'steps' );
	while( stepsNode.firstChild ){
		stepsNode.removeChild( stepsNode.firstChild ) ;
	}   
};

loader.prototype.drawSteps = function(){
	
	this.emptySteps();
	
	var stepsNode = document.getElementById( 'steps' );
	
	for( var s in this.steps ){
		var nextStep = this.steps[s];
		stepsNode.appendChild( nextStep.getStepNode() );
	}
};

/* Newly provided steps need to begin at 1 */

loader.prototype.addStep = function( step ){
	step.order = this.steps.length;
	this.steps.push(step);
	
	var max = 0;
	for(var s = 0; s < this.steps.length; s++ ){
		max = max + this.steps[s].total;
	}
	this.splashProgress.max = max;
	
	this.drawSteps();
};

loader.prototype.increment = function(){
	var cs = this.steps[ this.currentStep ];
	cs.increments = cs.increments + 1;
	var splashProgress = this.splashProgress;
	var increment = cs.total / cs.incrementCount;		
	splashProgress.value = splashProgress.value + increment;
	
	if( cs.increments === cs.incrementCount ){
		this.nextStep();   
	}
};

loader.prototype.takeDown = function() {
	this.nextStep();
	var splash = document.getElementById("splash");
	if (splash && splash.parentNode) {
		splash.parentNode.removeChild(splash);
	}
};

loader.prototype.createStep = function(description, type, total, incrementCount) {
	return new step(description, type, total, incrementCount);
};

var pageLoader;
function start() {
	var splash = document.createElement("div");
	splash.className = 	splash.id = "splash";
	document.body.appendChild(splash);
	var container = document.createElement("div");
	container.id = container.className = "splashContainer";
//	container.style.display = "none";
	splash.appendChild(container);
	
	pageLoader = new loader('splashContainer', 'Setting up workspace');
	var initial = new step('Loading Page', 0, 50);
	pageLoader.addStep(initial);
	
	var pluginStep;
	pluginStep = new step('Loading Plugins', 0, 20);
	pageLoader.addStep(pluginStep );
	
	pluginStep = new step('Loading Workspace', 0, 30);
	pageLoader.addStep(pluginStep);
	
	pageLoader.nextStep();
	
//	setTimeout(function() {
//		container.style.display = "";
//	}, 2000);
}

start();

return pageLoader; 
});
