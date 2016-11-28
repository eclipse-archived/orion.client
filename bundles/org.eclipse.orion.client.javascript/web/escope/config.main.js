/*globals esrecurse estraverse*/
/*eslint-env es_modules */
import buble from 'rollup-plugin-buble';

export default {
	entry: 'src/index.js',
	moduleName: 'escope',
	treeshake: true,
	banner: "/*eslint-disable*/",
	paths: {
		estraverse: 'estraverse/estraverse',
		esrecurse: 'esrecurse/esrecurse'
	},
	external: [
		'esrecurse',
		'estraverse'
	],
	plugins: [ 
		buble()
    ],
	targets: [
		{ dest: 'dist/escope.js', format: 'umd' },
	]
};