/* eslint-env amd */
/* eslint-disable missing-nls */
define([
'htmlparser2/tokenizer',
'eslint/lib/events'
], function(Tokenizer, events) {
	
	/*
		Options:
	
		xmlMode: Disables the special behavior for script/style tags (false by default)
		lowerCaseAttributeNames: call .toLowerCase for each attribute name (true if xmlMode is `false`)
		lowerCaseTags: call .toLowerCase for each tag name (true if xmlMode is `false`)
	*/
	
	/*
		Callbacks:
	
		oncdataend,
		oncdatastart,
		onclosetag,
		oncomment,
		oncommentend,
		onerror,
		onopentag,
		onprocessinginstruction,
		onreset,
		ontext
	*/
	
	var formTags = {
		input: true,
		option: true,
		optgroup: true,
		select: true,
		button: true,
		datalist: true,
		textarea: true
	};
	
	var openImpliesClose = {
		tr      : { tr:true, th:true, td:true },
		th      : { th:true },
		td      : { thead:true, th:true, td:true },
		body    : { head:true, link:true, script:true },
		li      : { li:true },
		p       : { p:true },
		h1      : { p:true },
		h2      : { p:true },
		h3      : { p:true },
		h4      : { p:true },
		h5      : { p:true },
		h6      : { p:true },
		select  : formTags,
		input   : formTags,
		output  : formTags,
		button  : formTags,
		datalist: formTags,
		textarea: formTags,
		option  : { option:true },
		optgroup: { optgroup:true }
	};
	
	// ORION Implement the HTML5 optional close tags spec
	// right side describes the end tag that is optional, the left side describes what the following element must be
	var openImpliesCloseHTML5 = {
		li      : { li:true },
		dd      : { dd:true, dt:true },
		dt      : { dd:true, dt:true },
		address	: { p:true },
		article	: { p:true },
		aside	: { p:true },
		blockquote	: { p:true },
		div		: { p:true },
		dl		: { p:true },
		fieldset: { p:true },
		footer	: { p:true },
		form	: { p:true },
		h1      : { p:true },
		h2      : { p:true },
		h3      : { p:true },
		h4      : { p:true },
		h5      : { p:true },
		h6      : { p:true },
		header	: { p:true },
		hgroup	: { p:true },
		hr		: { p:true },
		main	: { p:true },
		nav		: { p:true },
		ol		: { p:true },
		p		: { p:true },
		pre		: { p:true },
		section	: { p:true },
		table	: { p:true },
		ul		: { p:true },
		rb		: { rb:true, rt:true, rtc:true, rp:true},
		rt		: { rb:true, rt:true, rp:true}, // rtc does no end followed by an rt
		rtc		: { rb:true, rt:true, rtc:true, rp:true},
		rp		: { rb:true, rt:true, rtc:true, rp:true},	
		optgroup: { optgroup:true, option:true },
		option	: { option:true },
		tbody	: { tbody:true, tfoot:true, thead:true },
		tfoot 	: { tbody:true, thead:true },
		tr      : { tr:true, th:true, td:true },
		th      : { th:true },
		td      : { thead:true, th:true, td:true },
	};
	
	var voidElements = {
		__proto__: null,
		area: true,
		base: true,
		basefont: true,
		br: true,
		col: true,
		command: true,
		embed: true,
		frame: true,
		hr: true,
		img: true,
		input: true,
		isindex: true,
		keygen: true,
		link: true,
		meta: true,
		param: true,
		source: true,
		track: true,
		wbr: true,
	
		//common self closing svg elements
		path: true,
		circle: true,
		ellipse: true,
		line: true,
		rect: true,
		use: true,
		stop: true,
		polyline: true,
		polygon: true
	};
	
	var re_nameEnd = /\s|\//;
	
	function Parser(cbs, options){
		this._options = options || {};
		this._cbs = cbs || {};
	
		this._tagname = "";
		this._attribname = "";
		this._attribvalue = null; // TODO Orion 11.0 Make null to distinguish between no value and =""
		this._attribrange = [];
		this._attribs = null;
		this._stack = [];
	
		this.startIndex = 0;
		this.endIndex = null;
	
		this._lowerCaseTagNames = "lowerCaseTags" in this._options ?
										!!this._options.lowerCaseTags :
										!this._options.xmlMode;
		this._lowerCaseAttributeNames = "lowerCaseAttributeNames" in this._options ?
										!!this._options.lowerCaseAttributeNames :
										!this._options.xmlMode;
	
		this._tokenizer = new Tokenizer(this._options, this);
	
		if(this._cbs.onparserinit) this._cbs.onparserinit(this);
	}
	
	/**
	 * ORION
	 * shim for node.js util.inherits
	 */
	function inherits(ctor, sctor) {
		ctor.prototype = Object.create(sctor.prototype);
		ctor._super = sctor;
	}
	
	inherits(Parser, events.EventEmitter);
	
	Parser.prototype._updatePosition = function(initialOffset){
		if(this.endIndex === null){
			if(this._tokenizer._sectionStart <= initialOffset){
				this.startIndex = 0;
			} else {
				this.startIndex = this._tokenizer._sectionStart - initialOffset;
			}
		}
		else this.startIndex = this.endIndex + 1;
		this.endIndex = this._tokenizer.getAbsoluteIndex();
	};
	
	//Tokenizer event handlers
	Parser.prototype.ontext = function(data){
		this._updatePosition(1);
		this.endIndex--;
	
		if(this._cbs.ontext) this._cbs.ontext(data);
	};
	
	Parser.prototype.onopentagname = function(name){
		if(this._lowerCaseTagNames){
			name = name.toLowerCase();
		}
	
		this._tagname = name;
		
		// ORION Use the HTML 5 optional tag spec for open implies close
		if(!this._options.xmlMode && name in openImpliesCloseHTML5) {
			for(
				var el;
				(el = this._stack[this._stack.length - 1]) in openImpliesCloseHTML5[name];
				this.onclosetag(el, true) // ORION Don't update position when closing a tag this way
			);
		}
	
		if(this._options.xmlMode || !(name in voidElements)){
			this._stack.push(name);
		}
	
		if(this._cbs.onopentagname) this._cbs.onopentagname(name, this._tokenizer._sectionStart-1);
		if(this._cbs.onopentag) this._attribs = {};
	};
	
	Parser.prototype.onopentagend = function(){
		this._updatePosition(1);
	
		if(this._attribs){
			if(this._cbs.onopentag) this._cbs.onopentag(this._tagname, this._attribs, [this.startIndex, this.endIndex+1]); //ORION
			this._attribs = null;
		}
	
		if(!this._options.xmlMode && this._cbs.onclosetag && this._tagname in voidElements){
			this._cbs.onclosetag(this._tagname);
		}
	
		this._tagname = "";
	};
	
	Parser.prototype.onclosetag = function(name, skipPositionUpdate){
		// ORION Allow skipping of position update when closing a tag due to HTML optional tag rules
		if (!skipPositionUpdate){
			this._updatePosition(1);
		}
	
		if(this._lowerCaseTagNames){
			name = name.toLowerCase();
		}
	
		if(this._stack.length && (!(name in voidElements) || this._options.xmlMode)){
			var pos = this._stack.lastIndexOf(name);
			if(pos !== -1){
				if(this._cbs.onclosetag){
					pos = this._stack.length - pos;
					while(pos--){
						// ORION Recovery for mismatched tags, return end range for the tag with matching name
						var poppedTag = this._stack.pop();
						if (poppedTag === name){
							this._cbs.onclosetag(poppedTag, [this.startIndex, this.endIndex+1]); //ORION
						} else {
							this._cbs.onclosetag(poppedTag); 
						}
					} 
				}
				else this._stack.length = pos;
			} else if(name === "p" && !this._options.xmlMode){
				this.onopentagname(name);
				this._closeCurrentTag();
			}
		} else if(!this._options.xmlMode && (name === "br" || name === "p")){
			this.onopentagname(name);
			this._closeCurrentTag();
		}
	};
	
	Parser.prototype.onselfclosingtag = function(){
		if(this._options.xmlMode || this._options.recognizeSelfClosing){
			this._closeCurrentTag();
		} else {
			this.onopentagend();
		}
	};
	
	Parser.prototype._closeCurrentTag = function(){
		var name = this._tagname;
	
		this.onopentagend();
	
		//self-closing tags will be on the top of the stack
		//(cheaper check than in onclosetag)
		if(this._stack[this._stack.length - 1] === name){
			if(this._cbs.onclosetag){
				this._cbs.onclosetag(name);
			}
			this._stack.pop();
		}
	};
	
	Parser.prototype.onattribname = function(name){
		this._attribrange[0] = this._tokenizer._sectionStart; // TODO Orion 11.0 Collect attribute ranges
		if (this._cbs.onattribname) this._cbs.onattribname(name, this._attribrange[0]); // TODO Orion 11.0 Collect open tags to recover
		if(this._lowerCaseAttributeNames){
			name = name.toLowerCase();
		}
		this._attribname = name;
	};
	
	Parser.prototype.onattribdata = function(value){
		if (this._attribvalue){
			this._attribvalue += value;
		} else {
			this._attribvalue = value; // TODO Orion 11.0 Distinguish between no value and =""
		}

	};
	
	Parser.prototype.onattribend = function(isQuoted, valueStart){
		// TODO Orion 11.0 Collect attribute ranges
		if (valueStart) {
			this._attribrange[1] = valueStart;
			this._attribrange[2] = this._tokenizer.getAbsoluteIndex();
			// If the attribute is in quotes include them in the range
			if (isQuoted){
				this._attribrange[2]++;
			}
		} else {
			this._attribrange[1] = this._tokenizer.getAbsoluteIndex();
			// If the attribute is in quotes include them in the range
			if (isQuoted){
				this._attribrange[1]++;
			}
		}
		if(this._cbs.onattribute) this._cbs.onattribute(this._attribname, this._attribvalue, this._attribrange);
		if(
			this._attribs &&
			!Object.prototype.hasOwnProperty.call(this._attribs, this._attribname)
		){
			this._attribs[this._attribname] = this._attribvalue;
		}
		this._attribname = "";
		this._attribvalue = null;
	};
	
	Parser.prototype._getInstructionName = function(value){
		var idx = value.search(re_nameEnd),
		    name = idx < 0 ? value : value.substr(0, idx);
	
		if(this._lowerCaseTagNames){
			name = name.toLowerCase();
		}
	
		return name;
	};
	
	Parser.prototype.ondeclaration = function(value){
		if(this._cbs.onprocessinginstruction){
			var name = this._getInstructionName(value);
			this._cbs.onprocessinginstruction("!" + name, "!" + value, [this.startIndex, this._tokenizer.getAbsoluteIndex()]); //ORION
		}
	};
	
	Parser.prototype.onprocessinginstruction = function(value){
		if(this._cbs.onprocessinginstruction){
			var name = this._getInstructionName(value);
			this._cbs.onprocessinginstruction("?" + name, "?" + value, [this.startIndex, this._tokenizer.getAbsoluteIndex()]); //ORION
		}
	};
	
	Parser.prototype.oncomment = function(value){
		this._updatePosition(4);
	
		if(this._cbs.oncomment) this._cbs.oncomment(value, [this.startIndex, this.endIndex]); //ORION
		if(this._cbs.oncommentend) this._cbs.oncommentend([this.startIndex, this.endIndex]); //ORION
	};
	
	Parser.prototype.oncdata = function(value){
		this._updatePosition(1);
	
		if(this._options.xmlMode || this._options.recognizeCDATA){
			if(this._cbs.oncdatastart) this._cbs.oncdatastart();
			if(this._cbs.ontext) this._cbs.ontext(value);
			if(this._cbs.oncdataend) this._cbs.oncdataend();
		} else {
			this.oncomment("[CDATA[" + value + "]]", [this.startIndex, this.endIndex]); //ORION
		}
	};
	
	Parser.prototype.onerror = function(err){
		if(this._cbs.onerror) this._cbs.onerror(err);
	};
	
	Parser.prototype.onend = function(){
		if(this._cbs.onclosetag){
			for(
				var i = this._stack.length;
				i > 0;
				this._cbs.onclosetag(this._stack[--i])
			);
		}
		if(this._cbs.onend) {
			this._cbs.onend([this.startIndex, this._tokenizer._eof]); //ORION
		}
	};
	
	
	//Resets the parser to a blank state, ready to parse a new HTML document
	Parser.prototype.reset = function(){
		if(this._cbs.onreset) this._cbs.onreset();
		this._tokenizer.reset();
	
		this._tagname = "";
		this._attribname = "";
		this._attribs = null;
		this._stack = [];
	
		if(this._cbs.onparserinit) this._cbs.onparserinit(this);
	};
	
	//Parses a complete HTML document and pushes it to the handler
	Parser.prototype.parseComplete = function(data){
		this.reset();
		this.end(data);
	};
	
	Parser.prototype.write = function(chunk){
		this._tokenizer.write(chunk);
	};
	
	Parser.prototype.end = function(chunk){
		this._tokenizer.end(chunk);
	};
	
	Parser.prototype.pause = function(){
		this._tokenizer.pause();
	};
	
	Parser.prototype.resume = function(){
		this._tokenizer.resume();
	};
	
	//alias for backwards compat
	Parser.prototype.parseChunk = Parser.prototype.write;
	Parser.prototype.done = Parser.prototype.end;
	
	return  Parser;
});
