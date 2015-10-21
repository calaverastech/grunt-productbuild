'use strict';

var grunt = require('grunt');
var child_process = require('child_process');
var _ = require('lodash');
var path = require("path");
/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

module.exports = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  installed: function(test) {
      var count = 0;
      _.chain(grunt.config("productbuild"))
            .values()
            .map(function(f) {
                var obj = {files: f.files};
                var options = f.options || {};
                _.each(f, function(val, key) {
                    if(key !== "options" && key !== "files") {
                       options[key] = val;
                    }
                });
                obj.options = options;
                return obj;
            })
            .filter(function(f) {
                return f.options.pkgname.match(/-success$/);
            })
            .each(function(pkg) {
                  var options = pkg.options;
                  var cwd = options.cwd || ".";
                  var dest = options.dest || ".";
                  var pkgname = options.pkgname;
                  var expanded = path.join(dest, pkgname + "-expanded.pkg");
             
                  var files = _.filter(pkg.files, function(f) {
                        return !!f.pkgname;
                  });
                  var locs = _.reduce(files, function(h, f) {
                    if(!!f.location) {
                        var filenames = [];
                        if(!!f.component) {
                            var paths = _.isArray(f.component)?f.component:[f.component];
                            filenames = _.map(paths, function(p) {
                                    return p.replace(/^.*\//, '');
                            });
                        } else if(grunt.file.isDir(path.join(cwd, f.root))) {
                                  filenames = grunt.file.expand({cwd: path.join(cwd, f.root)}, "*");
                        }
                        filenames.forEach(function(f1) {
                            h[f1] = f.location;
                        });
                    }
                    return h;
                 }, {});
                 var nopayload =_.filter(files, function(f) {
                    return !f.root && !f.component && !!f.scripts;
                 });
                 var scripts = _.reduce(nopayload, function(arr, f) {
                    if(grunt.file.isDir(path.join(cwd, f.scripts))) {
                        return arr.concat(grunt.file.expand({filter: 'isFile', cwd: path.join(cwd, f.scripts)}, "*"));
                    }
                 }, []);
                                      
                 var resources = _.filter(["welcome", "license", "readme"], function(r) {
                    return !!options[r];
                 });
                  
                 count +=_.size(resources)*2 + _.size(files) + _.size(locs) + _.size(scripts);
                 test.expect(count);
                                      
                 //check if resources are in the package
                 child_process.execSync("pkgutil --expand " + dest + "/" + pkgname + ".pkg " + expanded);
                 var resourcedir = expanded + "/Resources";
                 var distr = grunt.file.read(expanded + "/Distribution");
                 _.each(resources, function(r) {
                        var len = grunt.file.expand({cwd: resourcedir}, "**/"+options[r]).length;
                        test.notEqual(len, 0, r + " resource is not present");
                        var tag = distr.match(options[r]);
                        test.notEqual(tag, null, "The tag for " + r + " is not present in the distribution file");
                 });
                 //test package receipts
                 files.forEach(function(f) {
                    var file = f.component || f.root;
                    var res1 = new Buffer("");
                    var identifier = f.identifier;
                    if(!!identifier) {
                        try {
                          res1 = child_process.execSync("pkgutil --pkgs / | grep " + identifier);
                        } catch(err) {
                          //console.log(err.message);
                        }
                        if(!!file) {
                          test.equal(res1.toString().trim(), identifier, "the package " + identifier + " is not installed");
                        } else {
                          test.equal(res1.toString().trim(), "", "the package " + identifier + " should not be installed");
                        }
                    }
                 });
      
      
                 //test if files are installed at locations
                 for(var key in locs) {
                    var res2 = new Buffer("");
                    try {
                        res2 = child_process.execSync("ls " + locs[key] + " | grep " + key);
                    } catch(err) {
                        //console.log(err.message);
                    }
                    test.equal(res2.toString().trim(), key, "the file " + key + " is not installed at " + locs[key]);
                 }
      
                 //test if scripts have been run
                 var log = "/tmp/GruntPkgbuildTestScript.txt";
                 scripts.forEach(function(f) {
                    var res3 = new Buffer("");
                    var line = "This is " + f;
                    try {
                        res3 = child_process.execSync('grep -m 1 "' + line + '" ' + log);
                    } catch(err) {
                        //console.log(err.message);
                    }
                    test.equal(res3.toString().trim(), line, "the script " + f + " has not run");
                 });
        }).value();
        test.done();
  },
  failed: function(test) {
        var count = 0;
        _.chain(grunt.config("productbuild"))
            .values()
            .map(function(f) {
                var obj = {files: f.files};
                var options = f.options || {};
                _.each(f, function(val, key) {
                    if(key !== "options" && key !== "files") {
                         options[key] = val;
                    }
                });
                obj.options = options;
                return obj;
            })
            .filter(function(f) {
                return f.options.pkgname.match(/-failure$/);
            })
            .each(function(pkg) {
                  var files = _.filter(pkg.files, function(f) {
                        return !!f.pkgname || !!f.scripts;
                  });
                  count += files.length;
                  test.expect(count);
                  
                  //test package receipts
                  files.forEach(function(f) {
                        var file = f.component || f.root;
                        var res = new Buffer("");
                        var identifier = f.identifier;
                        if(!!identifier) {
                            try {
                                res = child_process.execSync("pkgutil --pkgs / | grep " + identifier);
                            } catch(err) {
                                //console.log(err.message);
                            }
                            test.equal(res.toString().trim(), "", "the package " + identifier + " should not be installed");
                        }
                    });
        }).value();
                  
        test.done();
    }
};
