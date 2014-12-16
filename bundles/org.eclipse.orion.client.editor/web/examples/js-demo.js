/*
 * 
 * 	This is a comment block
 */

var hello = "hello";
var foo = 123; // line comment

function testing (one, two, three){
	var bool = true;
	this.service.junk("command", 4, bool, foo, hello);
	
	return one + two + three;
}
// TODO 
testing();

for (var i = 0; i < 10; i++){
	foo += i;
}

while (foo < 200){
	foo++;
}

try {
	// do something
} catch (e) {
	// do more
}