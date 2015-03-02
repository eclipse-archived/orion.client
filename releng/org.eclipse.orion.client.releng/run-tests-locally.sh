#!/bin/bash

#
# Run the JS unit tests. Uses the Sauce Labs SSH tunnel to provide access to a webserver running
# on your local machine.
# 
# Requires: Node.js, grunt-cli
# 

function die () {
    echo "Error:" "$1"
    exit 1
}

export TUNNEL=true
script_dir=$( cd $(dirname $0) ; pwd -P )
test_dir="$script_dir/test"

[[ -z "$SAUCE_USERNAME" || -z "$SAUCE_ACCESS_KEY" ]] && die "environment variables SAUCE_USERNAME and SAUCE_ACCESS_KEY must be set"

which grunt >/dev/null || die "grunt not found. Run 'npm install -g grunt-cli', ensure global NPM modules are in your PATH, and retry."

cd "$test_dir" && grunt --verbose

