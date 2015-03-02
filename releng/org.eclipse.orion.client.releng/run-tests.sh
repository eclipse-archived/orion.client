#!/bin/bash

# Run the unit tests through Maven.
# Requires: Maven
#

# Warning in case user might get into trouble
if [[ ! -f "$HOME/.m2/settings.xml" && ! -f "$HOME/.m2/settings-security.xml" ]]; then
	echo "WARNING: Could not find a Maven settings file. Read this for instructions on how to create one:"
	echo
	echo "    https://wiki.eclipse.org/Orion/Releng_Builds#Maven_setup"
	echo
	echo "Trying to continue anyway..."
	echo
fi

set -o verbose
mvn -Dtests.target=https://api.ng.bluemix.net\
    -Dtests.route=orion-test.ng.bluemix.net\
    -Dtests.space=dev\
    -Dtests.org=orion\
    -P orion-test\
    clean test

