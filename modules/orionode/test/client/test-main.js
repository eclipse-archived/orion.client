var allTestFiles = []
var TEST_REGEXP = /(spec|Tests)\.js$/i

// Array of test files to skip. This is a stop gap measure, tests listed here
// should be fixed to ensure they run.
var BROKEN_TEST_FILES = [
  'js-tests/core/config/configTests',
  'js-tests/core/pluginregistry/pluginregistryTests',
  'js-tests/core/preferences/preferencesTests',
  'js-tests/editor/perf/performanceTests',
  'js-tests/editor/tooltips/tooltipTests',
  'js-tests/javascript/astOutlinerTests',
  'js-tests/javascript/commonJsValidatorTests',
  'js-tests/javascript/computedEnvTests',
  'js-tests/javascript/crossFileTests',
  'js-tests/javascript/dependencyTests',
  'js-tests/javascript/es6OccurrencesTests',
  'js-tests/javascript/es6OutlinerTests',
  'js-tests/javascript/es6QuickfixTests',
  'js-tests/javascript/es6ValidatorTests',
  'js-tests/javascript/es7AssistTests',
  'js-tests/javascript/es7OccurrencesTests',
  'js-tests/javascript/eslintCoreTests',
  'js-tests/javascript/eslintHoverTests',
  'js-tests/javascript/finderTests',
  'js-tests/javascript/lruTests',
  'js-tests/javascript/nodeValidatorTests',
  'js-tests/javascript/occurrencesTests',
  'js-tests/javascript/outlinerTests',
  'js-tests/javascript/packageJsonHoverTests',
  'js-tests/javascript/quickfixGlobalTests',
  'js-tests/javascript/quickfixTests',
  'js-tests/javascript/scriptResolverTests',
  'js-tests/javascript/sigparserTests',
  'js-tests/javascript/ternAssistIndexTests',
  'js-tests/javascript/ternAssistModuleTests',
  'js-tests/javascript/ternAssistTests',
  'js-tests/javascript/ternCommandsTests',
  'js-tests/javascript/ternProjectFileTests',
  'js-tests/javascript/ternProjectHoverTests',
  'js-tests/javascript/ternProjectManagerTests',
  'js-tests/javascript/ternProjectValidatorTests',
  'js-tests/javascript/validatorTests',
  'js-tests/ui/HTMLTemplates/HTMLTemplateTests',
  'js-tests/ui/commands/commandsTests',
  'js-tests/ui/compare/compareTests',
  'js-tests/ui/docker/dockerAssistTests',
  'js-tests/ui/editCommands/editCommandsTests',
  'js-tests/ui/encoding/encodingTests',
  'js-tests/ui/fileapi/fileapiTests',
  'js-tests/ui/i18n/i18nTests',
  'js-tests/webtools/cssParserTests',
  'js-tests/webtools/htmlContentAssistTests',
  'js-tests/webtools/htmlValidatorTests',
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

require.config({
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
