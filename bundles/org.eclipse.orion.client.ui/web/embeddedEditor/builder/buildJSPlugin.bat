rmdir /s /q temp
node ./copy/copy.js "C:/IDSDev/OrionSource/org.eclipse.orion.client/bundles"
cd temp
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o embeddedEditor/builder/javascriptPlugin.build.almond-js.js optimize="none" out="../output/built-javascriptPlugin.js" dir=
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o embeddedEditor/builder/javascriptPlugin.build.almond-js.js optimize="closure" out="../output/built-javascriptPlugin.min.js" dir=
