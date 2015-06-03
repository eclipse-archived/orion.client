rmdir /s /q temp
node ./copy/copy.js "C:/IDSDev/OrionSource/org.eclipse.orion.client/bundles"
node ./node_modules/requirejs/bin/r.js -o temp/embeddedEditor/builder/embeddedEditor.css.build.json cssIn=temp/embeddedEditor/builder/embeddedEditorBuilder.css out=output/built-codeEdit.css
pushd temp
copy C:\IDSDev\OrionSource\org.eclipse.orion.client\bundles\org.eclipse.orion.client.ui\web\embeddedEditor\builder\embeddedEditor.build.js embeddedEditor.build.js
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o embeddedEditor.build.js optimize="none" out="../output/built-codeEdit.js" dir=
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o embeddedEditor.build.js optimize="closure" out="../output/built-codeEdit.min.js" dir=
popd
