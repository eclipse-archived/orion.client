export LC_CTYPE=C 
export LANG=C
# Runs the amdtoes6custom node script on all js files
for f in $(find bundles -name '*.js'); do
 node ../amdtoes6custom/command-line.js $f > tmp_copy.tmp -b | grep Unable
 rm $f
 mv tmp_copy.tmp $f
done
find * -name messages.js | grep nls/messages.js | xargs -o rm
# Copies back dependency dirs
cp -R ../backup/bundles/org.eclipse.orion.client.ui/web/gcli/ bundles/org.eclipse.orion.client.ui/web/gcli/
cp -R ../backup/bundles/org.eclipse.orion.client.javascript/web/eslint bundles/org.eclipse.orion.client.javascript/web/eslint
cp -R ../backup/bundles/org.eclipse.orion.client.ui/web/jsdiff/ bundles/org.eclipse.orion.client.ui/web/jsdiff/
cp -R ../backup/bundles/org.eclipse.orion.client.ui/web/marked/ bundles/org.eclipse.orion.client.ui/web/marked/
cp -R ../backup/bundles/org.eclipse.orion.client.javascript/web/eslint/ bundles/org.eclipse.orion.client.javascript/web/eslint/
# Removes all json!
LC_ALL=C find bundles -type f -print0 | xargs -0 sed -i '' 's/json!//g'
# Removes all instances of i18n!
LC_ALL=C find bundles -type f -print0 | xargs -0 sed -i '' 's/i18n!//g'
# Replaces all instances on text!
LC_ALL=C find bundles -type f -print0 | xargs -0 sed -i '' 's/text!//g'
# Removes all domReady! imports, since they are now handled by script defer tags
LC_ALL=C find bundles -type f -print0 | xargs -0 sed -i '' 's/import '\''domReady!'\'';//g'
LC_ALL=C find bundles -type f -print0 | xargs -0 sed -i '' 's/import "domReady!";//g'
# Changes any files that use "exports" as a variable
git grep -l --null "export default exports" | xargs -0 sed -i '' 's/exports/exp/g'
