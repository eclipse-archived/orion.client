/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define([],function() {
	var errorClass = "has-error";
	var successClass = "success";

	function copyText(original, destination) {
		document.getElementById(destination).value = document.getElementById(original).value;
	}

	function getParam(key) {
		var regex = new RegExp('[\\?&]' + key + '=([^&#]*)');
		var results = regex.exec(window.location.href);
		if (results === null) {
			return;
		}
		return results[1];
	}

	function passwordSwitcher() {
		var switchContainer = $(this).parents("form").find(".pass-container.hide");

		$(this).parent().addClass("hide");
		$(this).prev().attr("disabled", "disabled");
		switchContainer.removeClass("hide")
		switchContainer.find("input").removeAttr("disabled");
	}

	function showErrorMessage(msg) {
		var statusField = $(".status");
		statusField.text("");

		if (typeof msg !== "undefined") {
			var passwordContainer = $(".pass-container");
			var loginContainer = $(".login-container");
			var emailContainer = $(".email-container");
			var resetContainer = $(".reset-container");
			var resetEmailContainer = $(".reset-email-container");

			var usernameField = document.getElementById("username");
			var username = usernameField.value;
			var userError = "User " + username + " already exists.";

			var userCreated = "All good to go! Please follow the instructions in the e-mail sent to you to login into Orion.";

			var resetMsg = "Username or email are required";
			var resetError = "User " + username + " not found.";

			if (document.getElementById("resetEmail") !== null) {
				var emailField = document.getElementById("resetEmail");
				var email = emailField.value;
				var resetEmailError = "User with email " + email + " not found.";
			}

			console.log(msg);

			var userEmailNotSet = "User " + username + " doesn't have its email set. Contact administrator to reset your password.";

			switch (msg) {
				case "Password must be at least 8 characters long":
				case "Password not specified.":
					passwordContainer.addClass(errorClass);
					loginContainer.removeClass(errorClass);
					emailContainer.removeClass(errorClass);
					statusField.text(msg);
					break;
				case "Password must contain at least one alpha character and one non alpha character":
					passwordContainer.addClass(errorClass);
					loginContainer.removeClass(errorClass);
					emailContainer.removeClass(errorClass);
					statusField.text("Password must contain at least one number or special character");
					break;
				case userError:
				case "User login not specified":
				case "Username must contain at least 3 characters":
					loginContainer.addClass(errorClass);
					passwordContainer.removeClass(errorClass);
					emailContainer.removeClass(errorClass);
					statusField.text(msg);
					break;
				case "Username must contain no more than 20 characters":
					loginContainer.addClass(errorClass);
					statusField.text("Usernames are limited to 20 characters");
					break;
				case "Invalid user or password":
					loginContainer.addClass(errorClass);
					passwordContainer.addClass(errorClass);
					statusField.text(msg);
					break;
				case "User email is mandatory.":
				case "Invalid user email.":
					emailContainer.addClass(errorClass);
					statusField.text(msg);
					break;
				case "Provide username or email to reset.":
					resetContainer.addClass(errorClass);
					resetEmailContainer.addClass(errorClass);
					statusField.text(resetMsg);
					break;
				case resetError:
					resetContainer.addClass(errorClass);
					statusField.text(resetError);
					break;
				case resetEmailError:
					resetEmailContainer.addClass(errorClass);
					statusField.text("User with this email not found");
					break;
				case "Could not send confirmation email.":
					statusField.addClass(errorClass);
					statusField.text(msg);
					break;
				case "Confirmation email has been sent.":
					statusField.text(msg);
					break;
				case "Sending password reset confirmation...":
					statusField.removeClass(errorClass);
					statusField.text(msg);
					break;
				case userEmailNotSet:
					statusField.addClass(errorClass);
					statusField.text(userEmailNotSet);
					break;
				case "Created":
					loginContainer.removeClass(errorClass);
					passwordContainer.removeClass(errorClass);
					emailContainer.removeClass(errorClass);
					statusField.removeClass(errorClass);
					statusField.addClass(successClass);
					statusField.text(userCreated);
					break;
				default:
					loginContainer.removeClass(errorClass);
					passwordContainer.removeClass(errorClass);
					emailContainer.removeClass(errorClass);
			}
		}
	}

	function setUpPage() {
		$("form").on("input", ".has-error input", function() {
				var field = $(this);
				field.parent().removeClass(errorClass);
		});
	}

	setUpPage();

	return {
		copyText: copyText,
		getParam: getParam,
		passwordSwitcher: passwordSwitcher,
		showErrorMessage: showErrorMessage
	};
});