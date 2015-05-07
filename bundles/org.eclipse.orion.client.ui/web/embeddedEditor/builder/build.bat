rmdir /s /q temp
node ./copy/copy.js "C:/IDSDev/OrionSource/org.eclipse.orion.client/bundles"
xcopy /y .\temp\gitWidgets\builder\i18n.js .\temp\orion
node ./node_modules/requirejs/bin/r.js -o temp/gitWidgets/builder/commitBrowser.css.build.json cssIn=temp/gitWidgets/builder/commitBrowserBuilder.css out=output/built-commitBrowser.css
cd temp
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o gitWidgets/builder/commitBrowser.build.almond-js.js optimize="none" out="../output/built-commitBrowser.js" dir=
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o gitWidgets/builder/commitBrowser.build.almond-js.js optimize="closure" out="../output/built-commitBrowser.min.js" dir=
