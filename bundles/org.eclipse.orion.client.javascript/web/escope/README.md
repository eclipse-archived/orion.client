
# Building EScope for Orion

1. Grab the [source from the repo](https://github.com/estools/escope), making sure to check out the branch the approved CQ was for
2. copy the contents of config.main.js into a same-named file in the EScope repo
3. Edit the source to minimize the size of the outputted lib. This requires the following edits:
	* open `package.json` and remove the es6-map and es6-weak-map dependencies, leaving only the estraverse and esrecurse deps

	* open `index.js` and remove `import assert from 'assert';` and `import { version } from '../package.json';`. Then delete the line: `assert(scopeManager.__currentScope === null, 'currentScope should be null.');` and finally create a constant right before
	the export to declare the version number. For example, for 3.6.0, we would add `const version = "3.6.0";`
	
	* open `referencer.js` and remove the `import assert from 'assert';` and delete the assert line, ~ line 548

	* open `scope-manager.js` and remove `import WeakMap from 'es6-weak-map';`, `import Scope from './scope';`, and `import assert from 'assert';`. Then remove the assert statement from ~ line 189

	* open `scope.js` and remove `import Map from 'es6-map';` and `import assert from 'assert';`. Then removes the assert calls on ~lines 410-411 and ~line 610.
4. Run: `npm install --save-dev rollup rollup-plugin-buble`
5. Run: `npm install`
6. Run: `./node_modules/rollup/bin/rollup -c config.main.js
7. Copy the contents from the `/dist/escope.js` file into Orion
8. Fix some bad logic in Escope. In the `Scope.prototype.__addDeclaredVariablesOfNode` function change the first if statement to 
check for `!node` since `node == null` does not work when node is undefined. In the same function, change the next if statement from `variables == null` to `!variables`.

# Escope Issues

I have opened or commented on Github issues to have the unnecessary dependecies removed.
If the issues get fixed, there will be no editing required (no step 3).

* [Drop using assert](https://github.com/estools/escope/issues/115)
* [Drop es6-map and es6-weak-map](https://github.com/estools/escope/issues/113)
* [Stop require'ing package.json](https://github.com/estools/escope/issues/116)