/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/* eslint-env amd */
/* eslint-disable missing-nls */
define([
	"i18n!javascript/nls/problems"
], function(Messages) {
	
	var rules = {
		defaults: {
			"accessor-pairs" : 1,
			"curly" : 0,
			"eqeqeq": 1,
			"missing-doc" : 0, 
			"missing-nls" : 0,
			"new-parens" : 1,
			"no-caller": 1,
			"no-comma-dangle" : 0, 
			"no-cond-assign" : 2,
			"no-console" : 0, 
			"no-constant-condition" : 2,
			"no-control-regex" : 2,
			"no-debugger" : 1,
			"no-dupe-keys" : 2,
			"no-duplicate-case": 2,
			"no-else-return" : 1,
			"no-empty-block" : 0,
			"no-empty-character-class" : 2,
			"no-empty-label" : 2,
			"no-eq-null" : 2,
			"no-eval" : 0,
			"no-extra-boolean-cast" : 2,
			"no-extra-parens" : 1,
			"no-extra-semi": 1,
			"no-fallthrough" : 2, 
			"no-implied-eval" : 0,
			"no-invalid-regexp": 2,
			"no-irregular-whitespace" : 0,
			"no-iterator": 2, 
			"no-jslint" : 1, 
			"no-mixed-spaces-and-tabs" : 0,
			"no-negated-in-lhs" : 2,
			"no-new-array": 1,
			"no-new-func" : 1,
			"no-new-object" : 1,
			"no-new-wrappers" : 1,
			"no-obj-calls" : 2,
			"no-proto" : 2, 
			"no-redeclare" : 1,
			"no-regex-spaces" : 2,
			"no-reserved-keys" : 2,
			"no-self-compare" : 2,
			"no-self-assign" : 2,
			"no-shadow" : 1,
			"no-shadow-global" : 1,
			"no-sparse-arrays" : 1, 
			"no-throw-literal" : 1,
			"no-undef" : 2,
			"no-undef-init" : 1,
			"no-unreachable" : 2, 
			"no-unused-params" : 1,
			"no-unused-vars" : 1,
			"no-use-before-define" : 1,
			"no-with" : 1,
			"radix" : 1,
			"semi" : 1,
			"type-checked-consistent-return" : 0,
			"unnecessary-nls" : 0,
			"use-isnan" : 2,
			"valid-typeof" : 2
		},

		metadata: {
			"accessor-pairs" : {
				description: Messages['accessor-pairs-description'],
				url: 'http://eslint.org/docs/rules/accessor-pairs'
			},
			"curly" : {
				description: Messages['curly-description'],
	            url: 'http://eslint.org/docs/rules/curly'
			},
			"eqeqeq": {
				description: Messages['eqeqeq-description'],
			    url: "http://eslint.org/docs/rules/eqeqeq"
			},
	
			"missing-doc" : {
				description: Messages['missing-doc-description'],
			    url: 'http://eslint.org/docs/rules/valid-jsdoc'
			},
			"missing-nls" : {
				description: Messages['missing-nls-description']
			},
			"new-parens" : {
				description: Messages['new-parens-description'],
			    url: 'http://eslint.org/docs/rules/new-parens'
			},
			"no-caller": {
				description: Messages['no-caller-description'],
	            url: 'http://eslint.org/docs/rules/no-caller'
	        },
			"no-comma-dangle" : {
				description: Messages['no-comma-dangle-description'],
	            url: 'http://eslint.org/docs/rules/no-comma-dangle'
	        },
			"no-cond-assign" : {
				description: Messages['no-cond-assign-description'],
	            url: 'http://eslint.org/docs/rules/no-cond-assign'
	        },
			"no-console" : {
				description: Messages['no-console-description'],
	            url: 'http://eslint.org/docs/rules/no-console'
			}, 
			"no-constant-condition" : {
				description: Messages['no-constant-condition-description'],
	            url: 'http://eslint.org/docs/rules/no-constant-condition'
			},
			"no-control-regex" : {
				description: Messages['no-control-regex-description'],
				url: 'http://eslint.org/docs/rules/no-control-regex'
			},
			"no-debugger" : {
				description: Messages['no-debugger-description'],
		    	url: 'http://eslint.org/docs/rules/no-debugger'
			},
			"no-dupe-keys" : {
				description: Messages['no-dupe-keys-description'],
			    url: 'http://eslint.org/docs/rules/no-dupe-keys'
			},
			"no-duplicate-case": {
				description: Messages['no-duplicate-case-description'],
				url: 'http://eslint.org/docs/rules/no-duplicate-case'
			},
			"no-else-return" : {
				description: Messages['no-else-return-description'],
				url: 'http://eslint.org/docs/rules/no-else-return'
			},
			"no-empty-block" : {
				description: Messages['no-empty-block-description'],
			    url: 'http://eslint.org/docs/rules/no-empty'
			},
			"no-empty-character-class" : {
				description: Messages['no-empty-character-class-description'],
				url: 'http://eslint.org/docs/rules/no-empty-character-class'
			},
			"no-empty-label" : {
				description: Messages['no-empty-label-description'],
				url: 'http://eslint.org/docs/rules/no-empty-label'
			},
			"no-eq-null" : {
				description: Messages['no-eq-null-description'],
				url: 'http://eslint.org/docs/rules/no-eq-null'
			},
			"no-eval" : {
				description: Messages['no-eval-description'],
		    	url: 'http://eslint.org/docs/rules/no-eval'
			},
			"no-extra-boolean-cast" : {
				description: Messages['no-extra-boolean-cast-description'],
				url: 'http://eslint.org/docs/rules/no-extra-boolean-cast'
			},
			"no-extra-parens" : {
				description: Messages['no-extra-parens-description'],
				url: 'http://eslint.org/docs/rules/no-extra-parens'
			},
			"no-extra-semi": {
				description: Messages['no-extra-semi-description'],
		    	url: 'http://eslint.org/docs/rules/no-extra-semi'
			},
			"no-fallthrough" : {
				description: Messages['no-fallthrough-description'],
			    url: 'http://eslint.org/docs/rules/no-fallthrough'
			}, 
			"no-implied-eval" : {
				description: Messages['no-implied-eval-description'],
        		url: 'http://eslint.org/docs/rules/no-implied-eval'
			},
			"no-invalid-regexp": {
				description: Messages['no-invalid-regexp-description'],
				url: 'http://eslint.org/docs/rules/no-invalid-regexp'
			},
			"no-irregular-whitespace" : {
				description: Messages['no-irregular-whitespace-description'],
				url: 'http://eslint.org/docs/rules/no-irregular-whitespace'
			},
			"no-iterator": {
				description: Messages['no-iterator-description'],
            	url: 'http://eslint.org/docs/rules/no-iterator'
			}, 
			"no-jslint" : {
				description: Messages['no-jslint-description']
			}, 
			"no-mixed-spaces-and-tabs" : {
				description: Messages['no-mixed-spaces-and-tabs-description'],
				url: 'http://eslint.org/docs/rules/no-mixed-spaces-and-tabs'
			},
			"no-negated-in-lhs" : {
				description: Messages['no-negated-in-lhs-description'],
				url: 'http://eslint.org/docs/rules/no-negated-in-lhs'
			},
			"no-new-array": {
				description: Messages['no-new-array-description'],
				url: 'http://eslint.org/docs/rules/no-array-constructor.html'
			},
			"no-new-func" : {
				description: Messages['no-new-func-description'],
			    url: 'http://eslint.org/docs/rules/no-new-func'
			},
			"no-new-object" : {
				description: Messages['no-new-object-description'],
			    url: 'http://eslint.org/docs/rules/no-new-object'
			},
			"no-new-wrappers" : {
				description: Messages['no-new-wrappers-description'],
			    url: 'http://eslint.org/docs/rules/no-new-wrappers'
			},
			"no-obj-calls" : {
				description: Messages['no-obj-calls-description'],
				url: 'http://eslint.org/docs/rules/no-obj-calls'
			},
			"no-proto" : {
				description: Messages['no-proto-description'],
	            url: 'http://eslint.org/docs/rules/no-proto.html'
			}, 
			"no-redeclare" : {
				description: Messages['no-redeclare-description'],
			    url: 'http://eslint.org/docs/rules/no-redeclare'
			},
			"no-regex-spaces" : {
				description: Messages['no-regex-spaces-description'],
	            url: 'http://eslint.org/docs/rules/no-regex-spaces'
			},
			"no-reserved-keys" : {
				description: Messages['no-reserved-keys-description'],
	            url: 'http://eslint.org/docs/rules/no-reserved-keys'
			},
			"no-self-compare" : {
				description: Messages['no-self-compare-description'],
				url: 'http://eslint.org/docs/rules/no-self-compare'
			},
			"no-self-assign" : {
				description: Messages['no-self-assign-description'],
				url: 'http://eslint.org/docs/rules/no-self-assign'
			},
			"no-shadow" : {
				description: Messages['no-shadow-description'],
	            url: 'http://eslint.org/docs/rules/no-shadow'
			},
			"no-shadow-global" : {
				description: Messages['no-shadow-global-description']
			},
			"no-sparse-arrays" : {
				description: Messages['no-sparse-arrays-description'],
			    url: 'http://eslint.org/docs/rules/no-sparse-arrays'
			}, 
			"no-throw-literal" : {
				description: Messages['no-throw-literal-description'],
	            url: 'http://eslint.org/docs/rules/no-throw-literal'
			},
			"no-undef" : {
				description: Messages['no-undef-description'],
			    url: 'http://eslint.org/docs/rules/no-undef'
			},
			"no-undef-init" : {
				description: Messages['no-undef-init-description'],
	        	url: 'http://eslint.org/docs/rules/no-undef-init.html'
			},
			"no-unreachable" : {
				description: Messages['no-unreachable-description'],
			    url: 'http://eslint.org/docs/rules/no-unreachable'
			}, 
			"no-unused-params" : {
				description: Messages['no-unused-params-description']
			},
			"no-unused-vars" : {
				description: Messages['no-unused-vars-description'],
			    url: 'http://eslint.org/docs/rules/no-unused-vars'
			},
			"no-use-before-define" : {
				description: Messages['no-use-before-define-description'],
			    url: 'http://eslint.org/docs/rules/no-use-before-define'
			},
			"no-with" : {
				description: Messages['no-with-description'],
	        	url: 'http://eslint.org/docs/rules/no-with'
			},
			"radix" : {
				description: Messages['radix-description'],
	            url: 'http://eslint.org/docs/rules/radix'
			},
			"semi" : {
				description: Messages['semi-description'],
			    url: 'http://eslint.org/docs/rules/semi'
			},
			"unnecessary-nls" : {
				description: Messages['unnecessary-nls-description']
			},
			"use-isnan" : {
				description: Messages['use-isnan-description'],
			    url: 'http://eslint.org/docs/rules/use-isnan'
			},
			"valid-typeof" : {
				description: Messages['valid-typeof-description'],
			    url: 'http://eslint.org/docs/rules/valid-typeof'
			},
			"type-checked-consistent-return" : {
				description: Messages['type-checked-consistent-return-description']
			}
		}
	};
	return rules;
});