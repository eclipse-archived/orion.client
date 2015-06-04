##To build the embedded/pluggable editor locally
### CD to your Orion client code root, e.g., c:\OrionSource\org.eclipse.orion.client
### Use th following maven command

mvn  -DskipJsdoc -DskipOrionUI -DskipCommitBrowser -DskipEditor -DskipEditorStylers -DskipCompareEditor clean install

### This will create a zip file as below
OrionSource\org.eclipse.orion.client\built-js\built-codeEdit.zip

### Import this zip file into the build folder. Overwrite the exisitng one.