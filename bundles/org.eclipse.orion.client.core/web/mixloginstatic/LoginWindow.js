/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint browser:true devel:true*/
/*global define navigator window*/

define(['domReady', 'orion/xhr', 'orion/PageUtil', 'persona/include'], function(domReady, xhr, PageUtil) {
	var userCreationEnabled;
	var registrationURI;
	var forceUserEmail;
	var personaLoginClicked = false;

	function injectPlaceholderShims() {
		function textFocus(e) {
			var input = e.target;
			if (input.value === input.getAttribute('placeholder')) {
				input.value = '';
			}
		}
		function textBlur(e) {
			var input = e.target;
			if (input.value === '') {
				input.value = input.getAttribute('placeholder');
			}
		}
		function passwordFocus(e) {
			var input = e.target;
			if (input.value === input.getAttribute('placeholder')) {
				input.value = '';
				input.type = 'password';
			}
		}
		function passwordBlur(e) {
			var input = e.target;
			if (input.value === '') {
				input.value = input.getAttribute('placeholder');
				input.type = 'text';
			}
		}
		if (typeof document.createElement('input').placeholder === 'undefined') {
			var inputs = document.getElementsByTagName('input');
			for (var i=0 ; i < inputs.length; i++) {
				var input = inputs[i];
				var placeholderText = input.getAttribute('placeholder');
				switch (placeholderText && input.type) {
					case 'text':
						input.value = placeholderText;
						input.addEventListener('focus', textFocus);
						input.addEventListener('blur', textBlur);
						break;
					case 'password':
						input.value = placeholderText;
						input.addEventListener('focus', passwordFocus);
						input.addEventListener('blur', passwordBlur);
						input.type = 'text';
						break;
				}
			}
		}
	}

	function getParam(key) {
		var regex = new RegExp('[\\?&]' + key + '=([^&#]*)');
		var results = regex.exec(window.location.href);
		if (results === null) {
			return;
		}
		return results[1];
	}

	function decodeBase64(input) {

		var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length) {

			enc1 = _keyStr.indexOf(input.charAt(i++));
			enc2 = _keyStr.indexOf(input.charAt(i++));
			enc3 = _keyStr.indexOf(input.charAt(i++));
			enc4 = _keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 !== 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 !== 64) {
				output = output + String.fromCharCode(chr3);
			}

		}
		output = output.replace(/\r\n/g, "\n");
		var utftext = "";

		for (var n = 0; n < output.length; n++) {

			var c = output.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			} else if ((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			} else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	}

	function showErrorMessage(msg) {
		if (typeof msg !== "undefined") {
			document.getElementById("errorMessage").textContent = msg;
		}
		document.getElementById("errorWin").style.visibility = '';
	}

	function hideErrorMessage() {
		document.getElementById("errorMessage").textContent = "\u00a0";
		document.getElementById("errorWin").style.visibility = 'hidden';
	}

	function setResetMessage(isError, message) {
		//document.getElementById("reset_errorList").className = isError ? "loginError" : "loginInfo";
		showErrorMessage(message);
	}

	function confirmResetUser() {
		var responseObject;
		if (document.getElementById("reset").value === "" && document.getElementById("resetEmail").value === "") {
			setResetMessage(true, "Provide username or email to reset.");
			return;
		}
		var mypostrequest = new XMLHttpRequest();
		mypostrequest.onreadystatechange = function() {
			hideErrorMessage();
			if (mypostrequest.readyState === 4) {
				if (mypostrequest.status === 200) {
					responseObject = JSON.parse(mypostrequest.responseText);
					if (responseObject.Message) {
						setResetMessage(false, responseObject.Message);
					} else {
						showErrorMessage();
					}
				} else {
					try {
						responseObject = JSON.parse(mypostrequest.responseText);
						if (responseObject.Message) {
							setResetMessage(true, responseObject.Message);
							return;
						}
					} catch (e) {
						// not json
					}
					setResetMessage(true, mypostrequest.statusText);
				}
			}
		};

		mypostrequest.open("POST", "../useremailconfirmation", true);
		mypostrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		mypostrequest.setRequestHeader("Orion-Version", "1");
		mypostrequest.send("{login='" + document.getElementById("reset").value + "', email='" + document.getElementById("resetEmail").value + "'}");

		setResetMessage(false, "Sending password reset confirmation...");
	}

	function getRedirect() {
		var regex = new RegExp('[\\?&]redirect=([^&#]*)');
		var results = regex.exec(window.location.href);
		return results === null ? null : results[1];
	}

	function finishLogin() {
		var redirect = getRedirect();
		if (redirect !== null) {
			redirect = decodeURIComponent(redirect);
			if(PageUtil.validateURLScheme(redirect)) {
				window.location = decodeURIComponent(redirect);
				return;
			}
		}
		window.close();
		
	}

	function createOpenIdLink(openid) {
		if (openid !== "" && openid !== null) {
			var redirect = getRedirect();
			if (redirect !== null && PageUtil.validateURLScheme(decodeURIComponent(redirect))) {
				return "../login/openid?openid=" + encodeURIComponent(openid) + "&redirect=" + redirect;
			} else {
				return "../login/openid?openid=" + encodeURIComponent(openid);
			}
		}
	}
	
	/* handleSelectionEvent - centralize decision making criteria for the key press,
	   click, gesture etc that we respect as a user choice */
	
	function handleSelectionEvent( event ){
	
		var outcome = false;
		
		if( event.type === 'click' || event.keyCode === 13 ){
			outcome = true;
		}
		
		event.stopPropagation();
		
		return outcome;
	}

	function personaLogin( event ) {
		if( handleSelectionEvent( event ) ){
			personaLoginClicked = true;
			navigator.id.request();
		}
	}

	function addPersonaHandler(button) {
		var currentUser = null;
		navigator.id.watch({
			loggedInUser: currentUser, 
			onlogin: function(assertion) {
				if (personaLoginClicked) {
					xhr("POST", "../login/persona", {
						headers: {
							"Content-type": "application/x-www-form-urlencoded",
							"Orion-Version": "1"
						},
						data: "assertion=" + encodeURIComponent(assertion)
					}).then(function() {
						finishLogin();
					}, function(error) {
						showErrorMessage(JSON.parse(error.responseText).error);
					});
				}
			},
			onlogout: function() {
				// TODO
			}
		});
	}

	function confirmLogin(login, password) {
		if (!login) {
			login = document.getElementById('login').value;
			password = document.getElementById('password').value;
		}
		
		if( login.length > 0 && password.length > 0 ){ 
		
			var mypostrequest = new XMLHttpRequest();
			mypostrequest.onreadystatechange = function() {
				if (mypostrequest.readyState === 4) {
					if (mypostrequest.status !== 200 && window.location.href.indexOf("http") !== -1) {
						var responseObject = JSON.parse(mypostrequest.responseText);
						showErrorMessage(responseObject.error);
					} else {
						finishLogin();
					}
				}
			};
	
			var parameters = "login=" + encodeURIComponent(login) + "&password=" + encodeURIComponent(password);
			mypostrequest.open("POST", "../login/form", true);
			mypostrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			mypostrequest.setRequestHeader("Orion-Version", "1");
			mypostrequest.send(parameters);
		}
	}

	function validatePassword() {
		if (document.getElementById("create_password").value !== document.getElementById("create_passwordRetype").value) {
			showErrorMessage("Passwords don't match!");
			return false;
		}
		hideErrorMessage();
		return true;
	}
	
	function hideRegistration() {
		document.getElementById('newUserHeaderShown').style.visibility = 'hidden';
		document.getElementById('orionOpen').style.visibility = '';
		
		if (userCreationEnabled || registrationURI) {
			document.getElementById('orionRegister').style.visibility = '';
		}
	}

	function confirmCreateUser() {
		if (!validatePassword()) {
			document.getElementById("create_password").setAttribute("aria-invalid", "true");
			document.getElementById("create_passwordRetype").setAttribute("aria-invalid", "true");
			return;
		}
		document.getElementById("create_password").setAttribute("aria-invalid", "false");
		document.getElementById("create_passwordRetype").setAttribute("aria-invalid", "false");
		var mypostrequest = new XMLHttpRequest();
		var login = document.getElementById("create_login").value;
		var password = document.getElementById("create_password").value;
		var email =  document.getElementById("create_email").value;
		mypostrequest.onreadystatechange = function() {
			if (mypostrequest.readyState === 4) {
				if (mypostrequest.status !== 200 && window.location.href.indexOf("http") !== -1) {
					if (!mypostrequest.responseText) {
						return;
					}
					var responseObject = JSON.parse(mypostrequest.responseText);
					showErrorMessage(responseObject.Message);
					if(mypostrequest.status === 201){
						hideRegistration();
					}
				} else {
					confirmLogin(login, password);
				}
			}
		};
		var parameters = "login=" + encodeURIComponent(login) + "&password=" + encodeURIComponent(password) + "&email=" + encodeURIComponent(email);
		mypostrequest.open("POST", "../users", true);
		mypostrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		mypostrequest.setRequestHeader("Orion-Version", "1");
		mypostrequest.send(parameters);
	}

	function revealRegistration( event ) {
		// If registrationURI is set and userCreation is not, open the URI in a new window
		
		if( handleSelectionEvent( event ) ){
		
			if (!userCreationEnabled && registrationURI) {
				window.open(registrationURI);
				return;
			}
		
			document.getElementById('orionOpen').style.visibility = 'hidden';
			document.getElementById('orionRegister').style.visibility = 'hidden';
		
			document.getElementById('orionLoginForm').style.visibility = 'hidden';
			document.getElementById('orionRegister').style.visibility = 'hidden';
			document.getElementById('newUserHeaderShown').style.visibility = '';
			document.getElementById('create_login').focus();
		}
	}

	function formatForNoUserCreation() {
		document.getElementById('orionRegister').style.visibility = 'hidden';
	}

	function revealResetUser() {
		document.getElementById('orionLoginForm').style.visibility = 'hidden';
		if (!userCreationEnabled && !registrationURI) {
			document.getElementById('orionRegister').style.visibility = 'hidden';
			document.getElementById('orionReset').style.height = '212px';
		}
		document.getElementById('newUserHeaderShown').style.display = 'none';
		document.getElementById('orionReset').style.visibility = '';
		document.getElementById('reset').focus();
	}

	function hideResetUser() {
		document.getElementById('orionLoginForm').style.visibility = '';
		document.getElementById('newUserHeaderShown').style.display = '';
		document.getElementById('orionReset').style.visibility = 'hidden';
	}

	function openServerInformation() {
		window.open("/mixloginstatic/ServerStatus.html");
	}
	
	function revealLogin( event ){
		if( handleSelectionEvent( event ) ){
			event.stopPropagation();
			document.getElementById('orionOpen').style.visibility = 'hidden';
			document.getElementById('orionRegister').style.visibility = 'hidden';		
			document.getElementById('orionLoginForm').style.visibility = '';
			document.getElementById("login").focus();
		}
	}
	
	function cancelLogin(){
		document.getElementById('orionLoginForm').style.visibility = 'hidden';
		document.getElementById('orionOpen').style.visibility = '';
		
		if (userCreationEnabled || registrationURI) {
			document.getElementById('orionRegister').style.visibility = '';
		}
		
		hideErrorMessage();
	}

	function googleLogin( event ){
		if( handleSelectionEvent( event ) ){
			event.srcElement.click();
		}
	}

	domReady(function() {
		addPersonaHandler(document.getElementById("personaLogin"));

		var error = getParam("error");
		if (error) {
			var errorMessage = decodeBase64(error);

			showErrorMessage(errorMessage);
		}

		var checkusersrequest = new XMLHttpRequest();
		checkusersrequest.onreadystatechange = function() {
			if (checkusersrequest.readyState === 4) {
				if (checkusersrequest.status === 200) {
					var responseObject = JSON.parse(checkusersrequest.responseText);
					userCreationEnabled = responseObject.CanAddUsers;
					forceUserEmail = responseObject.ForceEmail;
					document.getElementById("create_email").setAttribute("aria-required", forceUserEmail);
					registrationURI = responseObject.RegistrationURI;
					if (!userCreationEnabled && !registrationURI) {
						formatForNoUserCreation();
					}
					document.getElementById("login-window").style.display = '';
					document.getElementById("orionLogin").focus();
				}
			}
		};

		checkusersrequest.open("POST", "../login/canaddusers", true);
		checkusersrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		checkusersrequest.setRequestHeader("Orion-Version", "1");
		checkusersrequest.send();

		var checkemailrequest = new XMLHttpRequest();
		checkemailrequest.onreadystatechange = function() {
			if (checkemailrequest.readyState === 4) {
				if (checkemailrequest.status === 200) {
					var responseObject = JSON.parse(checkemailrequest.responseText);
					if (responseObject.emailConfigured === false) {
						document.getElementById("resetUserLink").style.display = 'none';
					}
				}
			}
		};

		checkemailrequest.open("POST", "../useremailconfirmation/cansendemails", true);
		checkemailrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		checkemailrequest.setRequestHeader("Orion-Version", "1");
		checkemailrequest.send();

		xhr("GET", "/server-status.json", { //$NON-NLS-0$
			timeout: 15000
		}).then(function(result) {
			var results = JSON.parse(result.response);
			var messages = results.messages;
			if (messages.length > 0) {
				var currentDate = new Date();
				var startDate = new Date(messages[0].startdate);
				startDate.setHours(0, 0, 0, 0);
				if (startDate > currentDate) return;
				var endDate = new Date(messages[0].enddate);
				endDate.setHours(23, 59, 59);
				if (endDate <= currentDate)  return;
				document.getElementById("orionInfoArea").style.visibility = '';
				document.getElementById("orionInfoMessage").textContent = messages[0].title;
			}
		}, function(error) {
		});

		injectPlaceholderShims();

		// TODO: Temporary --- old page logic
		document.getElementById("login").onkeypress = function(event) {
			if (event.keyCode === 13) {
				confirmLogin();
			} else {
				return true;
			}
		};

		document.getElementById("password").onkeypress = function(event) {
			if (event.keyCode === 13) {
				confirmLogin();
			} else {
				return true;
			}
		};

		document.getElementById("loginButton").onclick = function() {
			confirmLogin();
		};

		document.getElementById("orionInfoArea").onclick = openServerInformation;

		document.getElementById("resetUserLink").onclick = revealResetUser;

		document.getElementById("reset").onkeypress = function(event) {
			if (event.keyCode === 13) {
				confirmResetUser();
			}
			return true;
		};
		
		document.getElementById("resetEmail").onkeypress = function(event) {
			if (event.keyCode === 13) {
				confirmResetUser();
			}
			return true;
		};

		document.getElementById("registerButton").onclick = revealRegistration;
		document.getElementById("registerButton").onkeydown = revealRegistration;

		document.getElementById("create_password").onkeyup = function(event) {
			if (event.keyCode === 13) {
				confirmCreateUser();
			} else {
				validatePassword();
			}
		};

		document.getElementById("create_passwordRetype").onkeyup = function(event) {
			if (event.keyCode === 13) {
				confirmCreateUser();
			} else {
				validatePassword();
			}
		};

		document.getElementById("createButton").onclick = confirmCreateUser;
		document.getElementById('cancelLoginButton').onclick = cancelLogin;

		document.getElementById("hideRegisterButton").onclick = hideRegistration;

		document.getElementById("googleLoginLink").href = createOpenIdLink("https://www.google.com/accounts/o8/id");
		document.getElementById("googleLogin").onkeydown = googleLogin;
		
		document.getElementById("orionLoginLink").onclick = revealLogin;
		document.getElementById("orionLogin").onkeydown = revealLogin;
		
		document.getElementById("personaLogin").onclick = personaLogin;
		document.getElementById("personaLogin").onkeydown = personaLogin;

		document.getElementById("cancelResetButton").onclick = hideResetUser;

		document.getElementById("sendResetButton").onclick = confirmResetUser;
	});
});
