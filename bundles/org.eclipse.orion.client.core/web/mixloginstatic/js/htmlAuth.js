/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others. All rights reserved.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v1.0 which accompanies this distribution,
 * and is available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global document window XMLHttpRequest */

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


window.onload = function() {

	var error = getParam("error");
	if (error) {
		var errorMessage = decodeBase64(error);

		document.getElementById("errorWin").style.visibility = '';
		document.getElementById("errorMessage").innerHTML = errorMessage;
	}

	var checkusersrequest = new XMLHttpRequest();
	checkusersrequest.onreadystatechange = function() {
		if (checkusersrequest.readyState === 4) {
			if (checkusersrequest.status === 200) {
				var responseObject = JSON.parse(checkusersrequest.responseText);
				if (responseObject.CanAddUsers === false) {
					formatForNoUserCreation();
				}
				document.getElementById("login-window").style.display = '';
				document.getElementById("login").focus();
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

};

function setResetMessage(isError, message) {
	document.getElementById("reset_errorMessage").innerHTML = message;
	document.getElementById("reset_errorList").className = isError ? "loginError" : "loginInfo";
	document.getElementById("reset_errorWin").style.display = '';
}

function confirmResetUser() {
	var responseObject;
	if (document.getElementById("reset").value === "" && document.getElementById("resetEmail").value === "") {
		setResetMessage(true, "Provide user or email to reset.");
		return;
	}
	var mypostrequest = new XMLHttpRequest();
	mypostrequest.onreadystatechange = function() {
		document.getElementById("reset_errorWin").style.display = 'none';
		if (mypostrequest.readyState === 4) {
			if (mypostrequest.status === 200) {
				responseObject = JSON.parse(mypostrequest.responseText);
				if (responseObject.Message) {
					setResetMessage(false, responseObject.Message);
				} else {
					document.getElementById("reset_errorWin").style.display = 'none';
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

function confirmOpenId(openid) {
	notify = true;
	if (openid !== "" && openid !== null) {
		var redirect = getRedirect();
		if (redirect !== null) {
			window.location = "../login/openid?openid=" + encodeURIComponent(openid) + "&redirect=" + getRedirect();
		} else {
			window.location = "../login/openid?openid=" + encodeURIComponent(openid);
		}
	}
}

function confirmLogin(login, password) {
	if (!login) {
		login = document.getElementById('login').value;
		password = document.getElementById('password').value;
	}
	var mypostrequest = new XMLHttpRequest();
	mypostrequest.onreadystatechange = function() {
		if (mypostrequest.readyState === 4) {
			if (mypostrequest.status !== 200 && window.location.href.indexOf("http") !== -1) {
				var responseObject = JSON.parse(mypostrequest.responseText);
				document.getElementById("errorMessage").innerHTML = responseObject.error;
				document.getElementById("errorWin").style.visibility = '';
			} else {
				var redirect = getRedirect();
				if (redirect !== null) {
					window.location = decodeURIComponent(redirect);
				} else {
					window.close();
				}

			}
		}
	};

	var parameters = "login=" + encodeURIComponent(login) + "&password=" + encodeURIComponent(password);
	mypostrequest.open("POST", "../login/form", true);
	mypostrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	mypostrequest.setRequestHeader("Orion-Version", "1");
	mypostrequest.send(parameters);
}

function goToCreateUser() {
	document.getElementById("createUserForm").style.display = "";
	document.getElementById("newUserHeaderShown").style.display = "";
	document.getElementById("newUserHeader").style.display = "none";

}

function goToLoginWindow() {
	document.getElementById("createUserForm").style.display = "none";
	document.getElementById("newUserHeaderShown").style.display = "none";
	document.getElementById("newUserHeader").style.display = "";
}

function validatePassword() {
	if (document.getElementById("create_password").value !== document.getElementById("create_passwordRetype").value) {
		document.getElementById("errorWin").style.visibility = '';
		document.getElementById("errorMessage").innerHTML = "Passwords don't match!";
		return false;
	}
	document.getElementById("errorWin").style.visibility = 'hidden';
	document.getElementById("errorMessage").innerHTML = "&nbsp;";
	return true;
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
	mypostrequest.onreadystatechange = function() {
		if (mypostrequest.readyState === 4) {
			if (mypostrequest.status !== 200 && window.location.href.indexOf("http") !== -1) {
				if (!mypostrequest.responseText) {
					return;	
				}
				var responseObject = JSON.parse(mypostrequest.responseText);
				document.getElementById("errorMessage").innerHTML = responseObject.Message;
				document.getElementById("errorWin").style.visibility = '';
			} else {
				confirmLogin(login, password);
			}
		}
	};
	var parameters = "login=" + encodeURIComponent(login) + "&password=" + encodeURIComponent(password);
	mypostrequest.open("POST", "../users", true);
	mypostrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	mypostrequest.setRequestHeader("Orion-Version", "1");
	mypostrequest.send(parameters);
}

function revealRegistration(){
	document.getElementById('orionLogin').style.visibility = 'hidden';
	document.getElementById('orionRegister').style.visibility = 'hidden';
	document.getElementById('newUserHeaderShown').style.visibility = '';
}

function hideRegistration(){
	document.getElementById('orionLogin').style.visibility = '';
	document.getElementById('orionRegister').style.visibility = '';
	document.getElementById('newUserHeaderShown').style.visibility = 'hidden';
}

function focusUserField( event ){
	if( event.currentTarget.value === 'username' ){
		event.currentTarget.value = '';
	}
}

function focusPasswordField( event ){
	event.currentTarget.type = 'password';
	if( event.currentTarget.value === 'password' || event.currentTarget.value === 'retype password'){
		event.currentTarget.value = '';
	}
}

function formatForNoUserCreation(){
	document.getElementById('orionRegister').style.visibility = 'hidden';
	document.getElementById('orionOpen').style.top = '188px';
	document.getElementById('orionOpen').style.height = '75px';
	document.getElementById('orionOpen').style.paddingTop = '55px';
}


function showResetUser() {
	document.getElementById('resetUser').style.display = '';
}

function hideResetUser() {
	document.getElementById('resetUser').style.display = 'none';
	document.getElementById("reset_errorWin").style.display = 'none';
}