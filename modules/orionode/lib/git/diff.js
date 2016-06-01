var async = require('async');
						return new Promise(function(fulfill, reject) {
							async.series(hunks.map(function(hunk) {
								return function(cb) {
									hunk.lines().then(function(lines) {
										buffer.push(hunk.header());
										lines.forEach(function(line) {
											var prefix = " ";
											switch(line.origin()) {
												case git.Diff.LINE.ADDITION:
													prefix = "+";
													break;
												case git.Diff.LINE.DELETION:
													prefix = "-";
													break;
												case git.Diff.LINE.DEL_EOFNL:
												case git.Diff.LINE.ADD_EOFNL:
													prefix = "";
													break;
											}
											buffer.push(prefix + line.content());
										});
									})
									.then(function(){
										cb();
									});
								};
							}), function(err) {
								if (err) {
									reject(err);
								} else {
									fulfill();
								}
							});
						}).then(function(){