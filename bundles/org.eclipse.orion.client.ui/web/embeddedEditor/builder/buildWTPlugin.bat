rmdir /s /q temp
node ./copy/copy.js "C:/IDSDev/OrionSource/org.eclipse.orion.client/bundles"
pushd temp
copy C:\IDSDev\OrionSource\org.eclipse.orion.client\bundles\org.eclipse.orion.client.ui\web\embeddedEditor\builder\standAloneWebtoolsPlugin.build.js standAloneWebtoolsPlugin.build.js
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o standAloneWebtoolsPlugin.build.js optimize="none" out="../output/built-webToolsPlugin.js" dir=
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o standAloneWebtoolsPlugin.build.js optimize="closure" out="../output/built-webToolsPlugin.min.js" dir=
popd
