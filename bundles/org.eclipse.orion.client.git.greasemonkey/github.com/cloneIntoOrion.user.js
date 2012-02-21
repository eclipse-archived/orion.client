// ==UserScript==
// @name           Clone from Github into Orion
// @version        0.4
// @namespace      http://eclipse.org/orion
// @description    Allows to clone repositories from Github into Orion
// @include        https://github.com/*/*
// ==/UserScript==

/*
 * An excerpt from a repo summary page from github.com:
 * 
 * <div class="url-box">
 *  <ul class="native-clones">
 *   <li><a href="/eclipse/orion.client/zipball/master" class="minibutton btn-download " rel="nofollow" title="Download this repository as a zip file"><span><span class="icon"></span>ZIP</span></a>
 *  </ul>
 *  <ul class="clone-urls">
 *   <li class="http_clone_url"><a href="https://github.com/eclipse/orion.client.git" data-permissions="Read-Only">HTTP</a></li>
 *   <li class="public_clone_url"><a href="git://github.com/eclipse/orion.client.git" data-permissions="Read-Only">Git Read-Only</a></li>
 *  </ul>
 *  <input type="text" spellcheck="false" class="url-field" />
 *  <span style="display:none" id="clippy_4858" class="clippy-text"></span>
 *  <span id="clippy_tooltip_clippy_4858" class="clippy-tooltip tooltipped" title="copy to clipboard">...</span>
 *  <p class="url-description"><strong>Read+Write</strong> access</p>
 * </div>
 */
(function () {
	try {

		var nativeClonesUl = document.getElementsByClassName("native-clones")[0];
		var gitRepoUrl = document.getElementsByClassName("url-field")[0].value;
		var orionSmallGif = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAOCAYAAAC2POVFAAAAAXNSR0IArs4c6QAABUpJREFUSMfFll1sHFcZhp9zdnZn1xs7tjebqBvbUrxJ6/inMu1N4wuaKkikgggat1X5KdA6iUoQSL2jlwhZCJCQkBKVpq1UpNKEn0YRCTQqitM0EsgWiUtLDU0g3vgva7Nr7493d2Zn5nxcbG2apimX+aS5+XTOnPe853lnjuIjValUZGZ2lqmpKTLT0yQ3b2agr5/tO7YTj8fRWivuYCkAEZHFpSVeevFl3vnbu7S1tbJly2bK5RI3FrJ0dHTx1FPfZGdvD1YodOcEi4jMzy/IwUPPyPCjj8mpU6dlcXFJSqWS5PN5+eulS3L48HfliSe+KpOTk2KMkTsmtu668uOf/FT2Dz8m4+MTt4gREclkrsvXn/yWPPPtw1IsFgTAGCNrj4jcNOd2fQAJaiJB7ZZ+EARSLpfF87xb1l97n5VdXOKdyUn27HmI+++/7xYulVLKGCPfePJrHDn6PFNT/8R1Xbl48SLl8iqO45JMJiiVytLS0qx8P5CJiQkKhQIP7Prs/8SsvidB4QLelUMgAV7mBxJK7EM336caeanx+usn2bo1RRAEEvoQt9XVVS5ceJvu7m6s69dnCYwwtGsIy7I+kUettfrP0pJsiDcxfS3Dzp09nDx5ipXlAhta4uRyeXY9sIvV1YqIGN588xz/ztxgoLerITR/RoKrhzC1a6CjjaiU/kyw8idk+bio9q+owGg++OAK58bOk0wmMcaI1lpls1leffVXPPLIl9ArK3lsO0JTU9On4tIUj9PW1oZbr6EUhMMRegf6eO6577Pvi/uYmLjEzMwMSik2tmwkFo0QjW9BvGUJZkYx7g3QsbVMN47YmYX5n+FVF8SOKJpb2gh84ZVXfkkulwPAsixisSjRaAxtTIDvB2itP1WsMYa656FUYzEjhni8ibbWVlpbWzCmjud5DXS0IqQVSofB+RdSfRe4TS6daeqFy6zh3d7eTKlU5MSJ3+L7vqyZqBRYiUQCz/PJ53OIiKg1NR+rcrlMqVjEtmMopbHtCAvzC/z+9Gkuvv0X0untpFKp9Y1ZVggxPlKfB/RNjn4scvjOHKEWwfM8+vv7uOeeHl544RgDA/2k093E43FEwEqn00TCFuPj4wwODt7OVTnzxzeoOS733tuPZVkoNPMLN7h65QqdnV08++z3SCY3qXrdEzGCGAUKlNL//2OvowD4vk84bDM0NMTKSoGXXzrGgw/tRlBorbGSySS7dz/I2bNn+czgIL7vy0eDZoyRTCbDideO09fbSzqdxvM8HNehoyOFkhTZxSxGzLpTAhjxUcoCuxtU+LauoiC84W4IaYwYqtUKkUiYhx/ey9TU3xkbe4tI2MayNDocDqvh4f10p+/myNHn+c2vf8fs3JwUiyXJZrMydv4tRkd/hIjh4MERotGoqtVq1ByHrR0d7B/+MtWqw9Ejv6BSrUgoFEIpReDXMRKCWB+67XOfzKxSsHEP9sYBjBFMIATGYIyhqSmmnn56hPb2BLVqrRE2gEQiofL5ZTn+2nHO/OEMY+fH2LQpSaG4QrFYJJ1Oc2BkhK6uznUmPdfFdWr09PTw+OOPcuzYi4ydO8/evZ9HKXCcCjWnjlJxZWrTwvzPCZbfAON+KDSMlfgCbP0OOtysCsWq+L6LCfz1sKVSd3HgwAijPxylWnVupr5er0sul+P99/9BsbiCbdvs2LGDbdu2Ydv2+ljXdWV2bp6obZNK3UW9XufadIZYLEpHKsXs3Bw1x6Grs5Pm5ubG/cMvi6m8h9SuNrTG0uj4IMraoADqXiBzszMoDV2dXaz9FHzfl8uXL5NMbua/c8bERMhYc/8AAAAASUVORK5CYII=)";

		var li = document.createElement("li");
		var a = document.createElement("a");
		a.className = "minibutton";
		a.href = "http://orionhub.org/git/git-repository.html#,cloneGitRepository=" + gitRepoUrl;
		a.target = "_blank";

		var span = document.createElement("span");
		span.innerHTML = "Clone into";
		span.style.backgroundRepeat = "no-repeat";
		span.style.backgroundPosition = "right 2px";
		span.style.paddingLeft = "2px";
		span.style.paddingRight = "45px";
		span.style.backgroundImage = orionSmallGif;
		span.style.marginRight = "5px";

		a.appendChild(span);
		li.appendChild(a);
		nativeClonesUl.appendChild(li);
	} catch (e) {
		// silently ignore, not on the right page
	}
})();
