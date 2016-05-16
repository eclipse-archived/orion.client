#!/bin/bash

#
# Run the JS unit tests. Uses the Sauce Labs SSH tunnel to provide access to a webserver running
# on your local machine.
#
# Requires: Node.js, grunt-cli
#
# TODO Dockerize this

function die () {
    echo "Error:" "$1" >&2
    exit 1
}

export TUNNEL=true
script_dir=$( cd $(dirname $0) ; pwd -P )
test_dir="$script_dir/test"

[[ -z "$SAUCE_USERNAME" || -z "$SAUCE_ACCESS_KEY" ]] && die "environment variables SAUCE_USERNAME and SAUCE_ACCESS_KEY must be set"

which grunt >/dev/null || die "grunt not found. Run 'npm install -g grunt-cli', ensure global NPM modules are in your PATH, and retry."

if [ ! -d "$test_dir/node_modules" ]; then
    echo "Installing test dependencies, please wait..."
    ( cd ${test_dir} && npm install . ) || die "Failed to install dependencies, consult the npm log to find out why."
fi

cd "$test_dir" && grunt --verbose --force

