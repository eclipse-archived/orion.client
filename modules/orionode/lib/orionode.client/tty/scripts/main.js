/*global require*/
require({
  baseUrl: "..",
  paths: {
    text: "requirejs/text",
    i18n: "requirejs/i18n",
    domReady: "requirejs/domReady",
    gcli: "gcli/gcli",
    util: "gcli/util"
  }
});
require(["scripts/ttyPage.js"]);
require(["scripts/shell.js"]);
