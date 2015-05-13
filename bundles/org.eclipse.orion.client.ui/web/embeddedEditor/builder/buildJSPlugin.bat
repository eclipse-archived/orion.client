rmdir /s /q temp
node ./copy/copy.js "C:/IDSDev/OrionSource/org.eclipse.orion.client/bundles"
pushd temp
copy C:\IDSDev\OrionSource\org.eclipse.orion.client\bundles\org.eclipse.orion.client.ui\web\embeddedEditor\builder\standAloneJavascriptPlugin.build.js standAloneJavascriptPlugin.build.js
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o standAloneJavascriptPlugin.build.js optimize="none" out="../output/built-javascriptPlugin.js" dir=
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o standAloneJavascriptPlugin.build.js optimize="closure" out="../output/built-javascriptPlugin.min.js" dir=
popd
