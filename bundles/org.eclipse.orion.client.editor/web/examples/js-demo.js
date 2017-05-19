var crypto = require('crypto');

var hello = "hello";
var foo = 123; // line comment
/**
 * Test function.
 * <p>
 * receives three paremeters
 * </p>
 *
 * @param {Number} one
 * @param {Number} two
 * @param {Object} three
 * 
 * @see Tester
*/
function testing(one, two, three) {
	var bool = true;
	this.service.junk("command", 4, bool, foo, hello);
	return one + two + three;
	console.log("Unreachable code");
}
// TODO 
testing();

for (var i = 0; i < 10; i++) {
	foo += i;
}

while (foo < 200) {
	foo++;
}

try {
	// do something
} catch (e) {
	// do more
}
errorVariable = 4;