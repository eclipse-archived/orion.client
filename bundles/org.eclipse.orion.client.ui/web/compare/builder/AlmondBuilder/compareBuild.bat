rmdir /s /q temp
node ./copy/copy.js "D:/JazzIntegration/OrionSource/org.eclipse.orion.client/bundles"
xcopy /y .\temp\compare\builder\i18n.js .\temp\orion
node ./node_modules/requirejs/bin/r.js -o temp/compare/builder/compare.css.build.json cssIn=temp/compare/builder/compareBuilder.css out=output/built-compare.css
cd temp
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o compare/builder/compare.build.almond-js.js optimize="none" out="../output/built-compare.js" dir=
java -classpath ../builderLibs/js.jar;../builderLibs/compiler.jar org.mozilla.javascript.tools.shell.Main ../builderLibs/r.js -o compare/builder/compare.build.almond-js.js optimize="closure" out="../output/built-compare.min.js" dir=
