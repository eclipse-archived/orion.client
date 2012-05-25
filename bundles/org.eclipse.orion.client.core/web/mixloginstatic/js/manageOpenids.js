var confirmOpenId; //this is used by openid servlet to return the verified identifier
var handleOpenIDResponse;

dojo.require("dojo.hash");

 var lastHash;
 var jsonData;
 
function onHashChange(hash){
	if(lastHash===hash){
		return;
	}
	
	loadUserData(hash);
	
	lastHash = hash;
 }

handleOpenIDResponse = function(openid) {
	
	 var openids = jsonData.properties.openid ? jsonData.properties.openid.split('\n') : [];
	 for(var i=0; i<openids.length; i++){
		 if(openids[i]===openid){
			 return;
		 }
	 }
	 
	if(!jsonData.properties.openid){
		jsonData.properties.openid = openid;
	}else{
		jsonData.properties.openid += '\n' + openid;
	}
	
	dojo.xhrPut({
		url : jsonData.Location,
		putData: dojo.toJson(jsonData),
		headers : {
			"Orion-Version" : "1"
		},
		handleAs : "json",
		timeout : 15000,
		load : function(returnData, secondArg) {
			loadUserData(jsonData.Location);
		},
		error : function(error, ioArgs) {
			console.error(error.message);
		}
	});
	
}

confirmOpenId = function(openid){
	if (openid != "" && openid != null) {
		win = window.open("../mixlogin/manageopenids/openid?openid=" + encodeURIComponent(openid),
				"openid_popup", "width=790,height=580");
	}

};

 function loadUserData(userLocation){
		dojo.xhrGet({
			url : userLocation,
			headers : {
				"Orion-Version" : "1"
			},
			handleAs : "json",
			timeout : 15000,
			load : function(jsonData, secondArg) {
				loadAttachedOpenIds(jsonData);
			},
			error : function(error, ioArgs) {
				console.error(error.message);
			}
		});
 }
 
 function removeOpenId(openid){
	 if(confirm("Are you sure you want to remove " + openid + " from the list of your external accounts?")){
		 var openids = jsonData.properties.openid.split('\n');
		 var newopenids = "";
		 for(var i=0; i<openids.length; i++){
			 if(openids[i]!==openid){
				 newopenids+=(openids[i]+'\n');
			 }
		 }
		jsonData.properties.openid = newopenids;
		
		dojo.xhrPut({
			url : jsonData.Location,
			putData: dojo.toJson(jsonData),
			headers : {
				"Orion-Version" : "1"
			},
			handleAs : "json",
			timeout : 15000,
			load : function(returnData, secondArg) {
				loadUserData(jsonData.Location);
			},
			error : function(error, ioArgs) {
				console.error(error.message);
			}
		});
		
	 }
 }
 
 window.onload = function() {
	 
		dojo.subscribe("/dojo/hashchange", this, function() {
			onHashChange(dojo.hash());
		});
	 
		onHashChange(dojo.hash());
 };
 
 function loadAttachedOpenIds(userjsonData){
	 jsonData = userjsonData;
	 var divId = "openidList";
	 var table = dojo.create("table", null, divId, "only");
	 if(jsonData.properties && jsonData.properties.openid){
		 
		 var openids = jsonData.properties.openid ? jsonData.properties.openid.split('\n') : [];
		 
		 if(openids.length>0){
			 var thead = dojo.create("thead", null, table, "only");
			 dojo.addClass(thead, "navTableHeading");
			 var tr = dojo.create("tr", null, thead, "last");
			 var td = dojo.create("td", {innerHTML: "<h2>External Id</h2>"}, tr, "last");
			 dojo.addClass(td, "navColumn");
			 td = dojo.create("td", {innerHTML: "<h2>Actions</h2>"}, tr, "last");
			 
		 }
		 
		for(var i=0; i<openids.length; i++){
			
			var openid = openids[i];
			if(openid===""){
				continue;
			}
			var tr = dojo.create("tr", null, table, "last");
			dojo.style(tr, "verticalAlign", "baseline");
			dojo.addClass(tr, i%2===0 ? "lightTreeTableRow" : "darkTreeTableRow");
			var td = dojo.create("td", null, tr, "last");
			dojo.addClass(td, "navColumn");
			var span = dojo.create("span", null, td, "only");
			var textNode = document.createTextNode(openid.length > 70 ? (openid.substring(0, 65) + "...") : openid);
			span.title = openid;
			dojo.place(textNode, span);
			
			
			td = dojo.create("td", null, tr, "last");
			dojo.addClass(td, "navColumn");
			var removeLink = dojo.create("a", {innerHTML: "Remove", title: "Remove " + openid, id:"remlink"+i, style:"visibility: hidden"}, td, "last");
			 
			dojo.connect(removeLink, "onclick", removeLink, dojo.hitch(this, function(openid) {
				removeOpenId(openid);	
			}, openid));			
			dojo.connect(removeLink, "onmouseover", removeLink, dojo.hitch(this, function(removeLink) {
				removeLink.style.cursor = "pointer";
			}, removeLink));
			dojo.connect(removeLink, "onmouseout", removeLink, dojo.hitch(this, function(removeLink) {
				removeLink.style.cursor = "default";
			}, removeLink));
			
			dojo.connect(tr, "onmouseover", tr, dojo.hitch(this, function(removeLink) {
				dojo.style(removeLink, "visibility", "visible");
			}, removeLink));
			
			dojo.connect(tr, "onmouseout", tr, dojo.hitch (this, function(removeLink) {
				dojo.style(removeLink, "visibility", "hidden");
			}, removeLink));
			 
		 }
	 }
 }