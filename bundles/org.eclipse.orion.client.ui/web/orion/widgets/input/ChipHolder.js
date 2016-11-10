/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define(['orion/objects', 'orion/webui/littlelib','orion/widgets/input/Chip','orion/widgets/input/Textfield'], function(objects, lib, mChip, mTextfield) {

	function ChipHolder(options, node) {
		objects.mixin(this, options);
		this.node = node || document.createElement('div'); //$NON-NLS-0$
		this.node.innerHTML = this.templateString;
		this.chips = lib.$('.orion-chips', this.node); //$NON-NLS-0$
		this.newChip = lib.$('#add-new-Chip', this.node); //$NON-NLS-0$
		this.chipHolder = lib.$('.chip-holder', this.node); //$NON-NLS-0$
		this.chipHolderLabel = lib.$('.setting-label', this.node); //$NON-NLS-0$
	}
	objects.mixin(ChipHolder.prototype, {
		templateString: '' + //$NON-NLS-0$
				'<label>' + //$NON-NLS-0$
					'<span class="setting-label" style="margin-top: 10px;"></span>' +
				'</label>' + //$NON-NLS-0$
				'<button class="orionButton commandButton commandMargins" id="add-new-Chip">Add</button>' + //$NON-NLS-0$
				'<div class="chip-holder setting-indent">' + //$NON-NLS-0$
					'<div class="orion-chips"></div>' + //$NON-NLS-0$
				'</div>',  //$NON-NLS-0$
						
		show: function(){
			this.chipHolderLabel.textContent = this.fieldlabel;
			if(this.fieldTitle){
				this.chipHolderLabel.parentNode.title = this.fieldTitle;
			}
			this.newChip.addEventListener("click", this.inputChipContent.bind(this)); //$NON-NLS-0$
        },
        
        initiat:function(contents){
 			contents.forEach(function(content){
 				this.addNewChip(content);
 			}.bind(this));
        },

		destroy: function() {
			if (this.node) {
				lib.empty(this.node);
				this.node = null;
			}
		},
		
		inputChipContent: function(){
			if(!this.chipContentInput){
				this.chipContentInput = new mTextfield({postChange:this.addNewChip.bind(this)});
				this.chipContentInput.show();
				this.chipContentInput.node.classList.add("orion-chip-input-box");
	        	this.chipHolder.appendChild(this.chipContentInput.node);
			}else{
				this.chipContentInput.node.style.display = "";
				this.chipContentInput.setValue("");
			}
			this.chipContentInput.textfield.focus();
			this.chipContentInput.textfield.select();
		},
		
		addNewChip: function(chipContent){
			if(this.chipContentInput){
				this.chipContentInput.node.style.display = "none";
			}
			if(chipContent){
				var chip = new mChip({chipContent: chipContent, postClose:this.postClose.bind(this)});
				chip.show();
				this.chips.appendChild(chip.node);
				if(this.postInputBoxChange){
					this.postInputBoxChange(chipContent);
				}
			}
		}
    });
    return ChipHolder;
});