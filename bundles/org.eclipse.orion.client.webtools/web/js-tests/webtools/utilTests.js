/*eslint-env amd, mocha*/
define([
    'webtools/util',
    'chai/chai',
    'csslint',
    'mocha/mocha' //global, stays last
], function(Util, chai, CSSLint) {
    
    var assert = chai.assert;
    
    describe("Util Tests", function() {
        
        /**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlock1', function() {
			var text = "<!DOCTYPE html><head><style>@charset 'UTF-8';</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 28);
			assert.equal(blocks[0].text, '@charset \'UTF-8\';');
		});
		
		/**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlock2', function() {
			var text = "<!DOCTYPE html><head><styLe>@charset 'UTF-8';</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 28);
			assert.equal(blocks[0].text, "@charset 'UTF-8';");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlock3', function() {
			var text = "<!DOCTYPE html><head><style>@charset 'UTF-8';</styLe></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 28);
			assert.equal(blocks[0].text, "@charset 'UTF-8';");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlock4', function() {
			var text = "<!DOCTYPE html><head><stYle>@charset 'UTF-8';</Style></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 28);
			assert.equal(blocks[0].text, "@charset 'UTF-8';");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlock5', function() {
			var text = "<!DOCTYPE html><head><style   >@charset 'UTF-8';</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 31);
			assert.equal(blocks[0].text, "@charset 'UTF-8';");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockMulti1', function() {
			var text = "<!DOCTYPE html><head><style>@charset 'UTF-8';</style><style>@import url('UTF-8');</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 2, "Should have found two style blocks");
			assert.equal(blocks[0].offset, 28);
			assert.equal(blocks[0].text, "@charset 'UTF-8';");
			assert.equal(blocks[1].offset, 60);
			assert.equal(blocks[1].text, "@import url('UTF-8');");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockMulti2', function() {
			var text = "<!DOCTYPE html><head><stYle>@charset 'UTF-8';</style><stylE>@import url('UTF-8');</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 2, "Should have found two style blocks");
			assert.equal(blocks[0].offset, 28);
			assert.equal(blocks[0].text, "@charset 'UTF-8';");
			assert.equal(blocks[1].offset, 60);
			assert.equal(blocks[1].text, "@import url('UTF-8');");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockMulti3', function() {
			var text = "<!DOCTYPE html><head><styLe>@charset 'UTF-8';</sTyle><sTyle>@import url('UTF-8');</Style></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 2, "Should have found two style blocks");
			assert.equal(blocks[0].offset, 28);
			assert.equal(blocks[0].text, "@charset 'UTF-8';");
			assert.equal(blocks[1].offset, 60);
			assert.equal(blocks[1].text, "@import url('UTF-8');");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockMulti4', function() {
			var text = "<!DOCTYPE html><head><style >@charset 'UTF-8';</style><style  >@import url('UTF-8');</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 2, "Should have found two style blocks");
			assert.equal(blocks[0].offset, 29);
			assert.equal(blocks[0].text, "@charset 'UTF-8';");
			assert.equal(blocks[1].offset, 63);
			assert.equal(blocks[1].text, "@import url('UTF-8');");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockMultiWithOffset1', function() {
			var text = "<!DOCTYPE html><head><style >@charset 'UTF-8';</style><style  >@import url('UTF-8');</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text, 39);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 29);
			assert.equal(blocks[0].text, "@charset 'UTF-8';");
		});
		/**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockMultiWithOffset2', function() {
			var text = "<!DOCTYPE html><head><style >@charset 'UTF-8';</style><style  >@import url('UTF-8');</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text, 71);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 63);
			assert.equal(blocks[0].text, "@import url('UTF-8');");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockWithOffset1', function() {
			var text = "<!DOCTYPE html><head><style >@import url('UTF-8');</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text, 39);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 29);
			assert.equal(blocks[0].text, "@import url('UTF-8');");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML with postamble text
		 * https:https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockWithSpacePostamble1', function() {
			var text = "<!DOCTYPE html><head><style type=\"text/css\">@import url('UTF-8');</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text, 48);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 44);
			assert.equal(blocks[0].text, "@import url('UTF-8');");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML with postamble text
		 * https:https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockWithSpacePostamble2', function() {
			var text = "<!DOCTYPE html><head><style type=\"text/css\"  >@import url('UTF-8');</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text, 48);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 46);
			assert.equal(blocks[0].text, "@import url('UTF-8');");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML with postamble text
		 * https:https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockWithSpacePostamble3', function() {
			var text = "<!DOCTYPE html><head><style type=\"text/css\" bar  >@import url('UTF-8');</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text, 51);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 50);
			assert.equal(blocks[0].text, "@import url('UTF-8');");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML with postamble text
		 * https:https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockWithSpacePostamble4', function() {
			var text = "<!DOCTYPE html><head><style type=\"text/css\" bar  >@import url('UTF-8');</style type='text/css' ></head><html></html>";
			var blocks = Util.findStyleBlocks(text, 51);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 50);
			assert.equal(blocks[0].text, "@import url('UTF-8');");
		});
	
		/**
		 * Tests the support for finding style blocks with type tags
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findStyleBlockWithType1', function() {
			var text = "<!DOCTYPE html><head><style type=\"\">@import 'foo';</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text, 39);
			assert.equal(blocks.length, 1, "Should have found one style block");
			assert.equal(blocks[0].offset, 36);
			assert.equal(blocks[0].text, "@import 'foo';");
		});
		
		/**
		 * Tests the support for finding style blocks in HTML with postamble text
		 * https:https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findNostyleBlockWithSpacePostamble1', function() {
			var text = "<!DOCTYPE html><head><style type=\"text/css\" bar  > >@import 'foo';</style type= javas cript ></head><html></html>";
			var blocks = Util.findStyleBlocks(text, 39);
			assert.equal(blocks.length, 0, "Should not have found any style blocks");
		});
		
		/**
		 * Tests finding style blocks within comments
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findNoStyleBlockInHTMLComment1', function() {
			var text = "<!DOCTYPE html><head><!--<style>@import 'foo';</style>--></head><html></html>";
			var blocks = Util.findStyleBlocks(text, 33);
			assert.equal(blocks.length, 0, "Should not have found any style blocks");
		});
		/**
		 * Tests finding style blocks within comments
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findNoStyleBlockInHTMLComment2', function() {
			var text = "<!DOCTYPE html><head><!--<style>@import 'foo';</style>--><style>@import 'foo';</style><!--<style>@import 'foo';</style>--></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 1, "Should have found one style block");
		});
		/**
		 * Tests finding style blocks within comments
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findNoStyleBlockInHTMLComment3', function() {
			var text = "<!DOCTYPE html><head><!--<style>@import 'foo';</style><style>function f() {}</style><style>@import 'foo';</style>--></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 0, "Should have found no style blocks");
		});
		/**
		 * Tests finding style blocks within comments
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427821
		 */
		it('test_findNoStyleBlockInHTMLComment2', function() {
			var text = "<!DOCTYPE html><head><style>@import 'foo';</style><!--<style>@import 'foo';</style>--><style>@import 'foo';</style></head><html></html>";
			var blocks = Util.findStyleBlocks(text);
			assert.equal(blocks.length, 2, "Should have found two style blocks");
		});
		
		/**
		 * Tests finding tokens
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=459580
		 */
		it('test_findToken1', function() {
			var text = "@Namespace foo url('bar');";
			var results = CSSLint.verify(text);
			assert(results, 'CSSLint should have produced tokens and an AST');
			var token = Util.findToken(6, results.tokens);
			assert(token, "Should have found the first token in the stream");
			assert.equal(token.type, 'NAMESPACE_SYM', 'We should have found a namespace token');
		});
		
		/**
		 * Tests finding tokens
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=459580
		 */
		it('test_findToken2', function() {
			var text = "@Namespace foo url('bar');";
			var results = CSSLint.verify(text);
			assert(results, 'CSSLint should have produced tokens and an AST');
			var token = Util.findToken(26, results.tokens);
			assert(token, "Should have found the last token in the stream");
			assert(token.type === 'EOF', "The last token should not be EOF");
		});
    });
});