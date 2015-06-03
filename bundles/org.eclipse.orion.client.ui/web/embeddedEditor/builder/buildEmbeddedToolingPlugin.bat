rmdir /s /q temp
node ./copy/copy.js "C:/IDSDev/OrionSource/org.eclipse.orion.client/bundles"
pushd temp
copy C:\IDSDev\OrionSource\org.eclipse.orion.client\bundles\org.eclipse.orion.client.ui\web\embeddedEditor\builder\embeddedToolingPlugin.build.js embeddedToolingPlugin.build.js
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o embeddedToolingPlugin.build.js optimize="none" out="../output/embeddedToolingPlugin.js" dir=
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o embeddedToolingPlugin.build.js optimize="closure" out="../output/embeddedToolingPlugin.min.js" dir=
popd
