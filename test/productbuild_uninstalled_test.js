'use strict';

var grunt = require('grunt');
var child_process = require('child_process');
var _ = require('lodash');

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
  uninstalled: function(test) {
      var count = 0;
      _.chain(grunt.config("productbuild"))
      .values()
      .each(function(pkg) {
            var files = _.filter(pkg.packages.files, function(f) {
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
