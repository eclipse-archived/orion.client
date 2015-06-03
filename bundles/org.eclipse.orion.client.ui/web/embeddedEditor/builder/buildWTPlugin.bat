rmdir /s /q temp
node ./copy/copy.js "C:/IDSDev/OrionSource/org.eclipse.orion.client/bundles"
pushd temp
copy C:\IDSDev\OrionSource\org.eclipse.orion.client\bundles\org.eclipse.orion.client.ui\web\embeddedEditor\builder\embeddedWebtoolsPlugin.build.js embeddedWebtoolsPlugin.build.js
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o embeddedWebtoolsPlugin.build.js optimize="none" out="../output/webToolsPlugin.js" dir=
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o embeddedWebtoolsPlugin.build.js optimize="closure" out="../output/webToolsPlugin.min.js" dir=
popd
