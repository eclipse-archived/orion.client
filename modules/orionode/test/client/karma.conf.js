module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../../lib/orion.client/',

    // Increase timeout so this task will not fail on Travis.
    browserNoActivityTimeout: 60000,

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['requirejs', 'mocha', 'chai', 'jasmine'],


    // list of files / patterns to load in the browser
    files: [
      // Include all files in the orion.client directory, and subdirectories.
      {pattern: './**/*', included: false},
      '../../test/client/test-main.js',
    ],


    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        'orion/**/*.js': ['coverage'],
        'webtools/**/*.js': ['coverage'],
        'javascript/**/*.js': ['coverage'],
    },


    coverageReporter: {
        dir : '../../coverage/client_coverage/',
        reporters: [
            { type: 'html', subdir: 'report-html' },
            { type: 'lcov', subdir: 'report-lcov' },
        ],
    },

    coverageIstanbulReporter: {
        // reports can be any that are listed here: https://github.com/istanbuljs/istanbuljs/tree/aae256fb8b9a3d19414dcf069c592e88712c32c6/packages/istanbul-reports/lib
        reports: ['json'],
        // base output directory. If you include %browser% in the path it will be replaced with the karma browser name
        dir: 'coverage/client_coverage',

        // if using webpack and pre-loaders, work around webpack breaking the source path
        fixWebpackSourcePaths: true,

        // // stop istanbul outputting messages like `File [${filename}] ignored, nothing could be mapped`
        skipFilesWithNoCoverage: true,
    },
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage', 'coverage-istanbul'],

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    //browsers: ['Chrome', 'Firefox', 'Safari', 'IE'],
    browsers: ['ChromeHeadless'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,


    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
