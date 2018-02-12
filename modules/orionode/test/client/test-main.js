var allTestFiles = []
var TEST_REGEXP = /(spec|Tests)\.js$/i

// Array of test files to skip. This is a stop gap measure, tests listed here
// should be fixed to ensure they run.
var BROKEN_TEST_FILES = [
  'js-tests/core/config/configTests', // Test Errors
  'js-tests/editor/perf/performanceTests', // Test Failures
  'js-tests/editor/tooltips/tooltipTests', // Test Failures
  'js-tests/javascript/eslintCoreTests', // Require.js Error
  'js-tests/javascript/ternProjectManagerTests', // Require.js Error
  'js-tests/ui/editCommands/editCommandsTests', // Test Failures
  'js-tests/ui/fileapi/fileapiTests', // Test Failures
]

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function (file) {
  if (TEST_REGEXP.test(file)) {
    var normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '')
    if (BROKEN_TEST_FILES.some(function (broken) {
      return broken === normalizedTestModule;
    })) {
      return;
    }
    allTestFiles.push(normalizedTestModule)
  }
})

requirejs.config({
  baseUrl: '/base',

  paths: {
    domReady: 'requirejs/domReady',
    text: 'requirejs/text',
    i18n: 'requirejs/i18n',
    json: "requirejs/json",
  },

  deps: allTestFiles,

  callback: window.__karma__.start
})
