# CD to root dir
cd "$(dirname "$0")"
cd ..
# Make build dir
mkdirs -p build/js
# Run webpack
node_modules/.bin/webpack --display-error-details --config webpack/webpack.config.js
