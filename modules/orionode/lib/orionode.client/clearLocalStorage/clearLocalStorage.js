/* Clears local storage and changes message on html page 
   depending on success or failure 
   (message already set to failure)
*/

localStorage.clear();

if(localStorage.length == 0) {
	console.log("Local storage successfully cleared.");
	var message = document.getElementById('message');
	message.innerHTML = "Your local storage was successfully cleared.";
} else {
	console.log("Local storage could not be cleared.");
}