rmdir /s /q temp
node ./copy/copy.js "C:/IDSDev/OrionSource/org.eclipse.orion.client/bundles"
pushd temp
copy C:\IDSDev\OrionSource\org.eclipse.orion.client\bundles\org.eclipse.orion.client.ui\web\embeddedEditor\builder\ternWorker.build.js ternWorker.build.js
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o ternWorker.build.js optimize="none" out="../output/ternWorker.js" 
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o ternWorker.build.js optimize="closure" out="../output/ternWorker.min.js" 
popd