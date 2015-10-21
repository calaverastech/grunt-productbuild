/*
 * grunt-pkgbuild
 * https://github.com/calaverastech/grunt-pkgbuild
 *
 * Copyright (c) 2015 tmoskun
 * Licensed under the MIT license.
 */


'use strict';
var _ = require('lodash');

module.exports = function(grunt) {
	
  // Project configuration.
  grunt.initConfig({
    date: grunt.template.today('mmmm-dd-yyyy-h-MM-TT'),
    identifier_prefix: "com.calaverastech.Test",
    name_prefix: "GruntPkgbuildTest",
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: [process.cwd() + '/test/packages*/*'],
      apps: [process.cwd() + "/test/fixtures/comp/**/*", process.cwd() + "/test/fixtures/root/**/*"]
    },
    // Configuration to be run (and then tested).
    productbuild: {
        build1: {
            options: {
                    cwd: "test",
                    dest: "test/packages1"
            },
            pkgname: "Test1-<%= date %>-success",
            title: "Test1",
            welcome: "WELCOME.txt",
            license: "LICENSE.txt",
            readme: "README.txt",
            resources: "fixtures/resources1",
            script: "fixtures/validate/check1/check1.js",
            files: [
                    {root: "fixtures/root1", analyze: true, plist: "Info.plist", plistoptions: {"BundleIsRelocatable": false}},
                    {root: "fixtures/root1", plist: "packages1/Info.plist", location: "/tmp", version: "1.0", identifier: "<%= identifier_prefix %>.test1.app.pkg", pkgname: "<%= name_prefix %>-Test1-<%= date %>"},
                    {scripts: "fixtures/scripts/preflight", pkgname: "<%= name_prefix %>-preflight-<%= date %>", identifier: "<%= identifier_prefix %>.test1.preflight.pkg"},
                    {scripts: "fixtures/scripts/postflight", pkgname: "<%= name_prefix %>-postflight-<%= date %>", identifier: "<%= identifier_prefix %>.test1.postflight.pkg"},
            ]
      },
      build2: {
            options: {
                   cwd: "test",
                   dest: "test/packages2",
                   pkgname: "Test2-<%= date %>-failure",
                   title: "Test2",
                   resources: "fixtures/resources2",
                   script: "fixtures/validate/check2/check2.js"
            },
            files: [
                    {root: "fixtures/root2", analyze: true, plist: "Info.plist", plistoptions: {"BundleIsRelocatable": false}},
                    {root: "fixtures/root2", plist: "packages2/Info.plist", location: "/tmp", version: "1.0", identifier: "<%= identifier_prefix %>.test2.app.pkg", pkgname: "<%= name_prefix %>-Test2-<%= date %>"}
            ]
      },
      build3: {
            options: {
                   cwd: "test",
                   dest: "test/packages3"
            },
            pkgname: "Test3-<%= date %>-success",
            title: "Test3",
            script: {src: "fixtures/validate/check3", title: "Check has failed", message: "The shell script for Test3 script doesn't validate. This is incorrect."},
            files: [
                    {root: "fixtures/root3", analyze: true, plist: "Info.plist", plistoptions: {"BundleIsRelocatable": false}},
                    {root: "fixtures/root3", plist: "packages3/Info.plist", location: "/tmp", version: "1.0", identifier: "<%= identifier_prefix %>.test3.app.pkg", pkgname: "<%= name_prefix %>-Test3-<%= date %>"}
                    
            ]
      },
      build4: {
            options: {
                   cwd: "test",
                   dest: "test/packages4"
            },
            pkgname: "Test4-<%= date %>-failure",
            title: "Test4",
            script: {src: "fixtures/validate/check4", title: "Check has failed", message: "The shell script for Test4 script doesn't validate. This is correct."},
            files: [
                    {root: "fixtures/root4", analyze: true, plist: "Info.plist", plistoptions: {"BundleIsRelocatable": false}},
                    {root: "fixtures/root4", plist: "packages4/Info.plist", location: "/tmp", version: "1.0", identifier: "<%= identifier_prefix %>.test4.app.pkg", pkgname: "<%= name_prefix %>-Test4-<%= date %>"}
                           
            ]
      },
      build5: {
            options: {
                cwd: "test",
                dest: "test/packages5"
            },
            pkgname: "Test5-<%= date %>-success",
            files: [
                    {root: "fixtures/root5", analyze: true, plist: "Info.plist", plistoptions: {"BundleIsRelocatable": false}},
                    {root: "fixtures/root5", plist: "packages5/Info.plist", location: "/tmp", version: "1.0", identifier: "<%= identifier_prefix %>.test5.app.pkg", pkgname: "<%= name_prefix %>-Test5-<%= date %>"}
            ]
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    },
    exec: {
		createMacApp: {
			cmd: function(cwd, dir, identifier, script, appname) {
    			return 'cd ' + cwd + ' && mkdir -p ' + dir + ' && /usr/local/bin/platypus -A -y -o "None" -V 1.0 -u "CalaverasTech.com" -I ' + identifier + ' ' + script + ' ' + dir + '/' + appname + '.app';
    		},
			stdout: true
		},
        removeScriptResults: {
            cmd: function(name, passw) {
                return "echo " + passw + " | sudo -S rm -f /tmp/"+name;
            },
            stdout: true
        },
        removeFiles: {
            cmd: function(file, loc, passw) {
                return "cd " + loc + " && echo " + passw + " | sudo -S rm -rf " + file;
            },
            stdout: true
        },
        expandPkg: {
            cmd: function(cwd, pkg) {
                 return "pkgutil --expand " + cwd + "/" + pkg + " " + cwd + "/" + pkg + "-expanded";
            }
        },
        flattenPkg: {
            cmd: function(cwd, pkg) {
                 return "pkgutil --flatten " + cwd + "/" + pkg + " " + cwd + "/" + pkg + "-flattened";
            },
            stdout: true
        },
		installPkg: {
			cmd: function(cwd, pkg, passw) {
                 return "echo " + passw + " | sudo -S installer -pkg " + cwd + "/" + pkg + " -target / | exit 0";
			},
			stdout: true,
            callback: function(error, stdout, stderr) {
                if(!!error) {
                   grunt.log.warn(error);
                }
            }
		},
		uninstallPkg: {
			cmd: function(identifier, passw, location) {
				//return 'echo ' + passw + ' | sudo -S sh -c "$(' + comm + ' pkgutil --forget ' +identifier + ')"';
                console.log('echo ' + passw + ' | sudo -S pkgutil --forget ' +identifier);
                return 'echo ' + passw + ' | sudo -S pkgutil --forget ' +identifier + " | exit 0";
			},
			stdout: true,
            callback: function(error, stdout, stderr) {
                if(!!error) {
                   grunt.log.warn(error);
                }
            }
		}
		
		
    },
    chmod: {
        src: ["test/fixtures/scripts/**/*", "!test/fixtures/check/**/*.js"],
        options: {
            mode: "755"
        }
    }
    
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-chmod');
    
  grunt.registerTask("cleanFiles", function(passw) {
      grunt.task.run(["clean", "exec:removeScriptResults:"+grunt.config("name_prefix")+"Script.txt:"+passw]);
      var files = _.pluck(_.values(grunt.config("productbuild")), "files");
      var filenames = [];
      files.forEach(function(f) {
        if(!!f.location) {
            grunt.task.run("exec:removeFiles:"+grunt.config("name_prefix")+"*:"+f.location+":"+passw);
         }
      });
  });
  
  grunt.registerTask("createFiles", "Create bundles and files for testing", function() {
      grunt.task.run("chmod");
      var identifier = grunt.config("identifier_prefix")+ ".app.pkg";
      _.times(5, function(n) {
            var i = n + 1;
            grunt.task.run("exec:createMacApp:test/fixtures:root"+i+":"+identifier+":scripts/my_script"+i+":"+grunt.config("name_prefix")+"Test"+i);
      });
  });
                     
  grunt.registerTask("installPackages", "Install all created packages", function(passw) {
      _.each(grunt.config("productbuild"), function(val, key){
            var dest = val.options.dest || ".";
            grunt.file.expand({cwd: dest}, "*.pkg").forEach(function(f) {
                grunt.task.run("exec:installPkg:"+dest+":"+f+":"+passw);
            });
      });
  });
  
  grunt.registerTask("uninstallPackages", "Uninstall all created packages", function(passw) {
      var files = _.chain(grunt.config("productbuild")).values().pluck("files").flatten().value();
      files.forEach(function(f) {
            if(!!f.pkgname && (!!f.component || !!f.root)) {
                grunt.task.run("exec:uninstallPkg:"+f.identifier+":"+passw+":"+f.location);
            }
      });
  });
    
  grunt.registerTask("productbuildTest", function() {
      var tests = Array.prototype.splice.call(arguments, 0).map(function(test) {
        return 'test/productbuild_' + test + "_test.js";
      });
      if(tests.length > 0) {
        grunt.config('nodeunit.tests', tests);
      }
      grunt.task.run("nodeunit");
  });
  
  //clean old files, create applications for tesing, create packages with productbuild, install them, test the installation, uninstall them, test the uninstallation
  grunt.registerTask('test', ['cleanFiles:'+grunt.option("passw"), 'createFiles', 'productbuild', 'clean:apps', 'installPackages:'+grunt.option("passw"), 'productbuildTest:installed', 'uninstallPackages:'+grunt.option("passw"), 'productbuildTest:uninstalled']);
    
  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
