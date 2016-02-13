/*
 * grunt-productbuild
 * https://github.com/calaverastech/grunt-productbuild
 *
 * Copyright (c) 2015 tmoskun
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
    
 var _ = require('lodash'),
    path = require("path"),
    fs = require("fs"),
    step = require("step");
    
  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks
  
 grunt.config.merge({
    copy: {
        macDistributionCopy: {
            options: {
                process: function(content, srcpath) {
                    return content.replace(/&lt;/g, "<").replace(/^\s*[\r\n]/gm,"");
                }
            }
        }
    },
    clean: {
        pkgfiles: []
    },
    exec: {
        mkdir: {
            cmd: function(dir) {
                return "mkdir -p " + dir;
            }
        },
        mv: {
            cmd: function(file1, file2) {
                return 'mv "' + file1 + '" "' + file2 + '"';
            }
        },
        synthesizeMacProduct: {
			cmd: function(cwd, packages, distr) {
                var packagesStr = _.map(packages.split(","), function(p) {return ' --package "' + path.join(cwd, p) + '"'; }).join(' ');
                return "productbuild --synthesize " + packagesStr + ' "' + distr + '"';
			},
			stdout: true
		},
		createMacProduct: {
			cmd: function(distr, packpath, respath, scriptpath, dest, pkgname) {
                return 'productbuild --distribution "' + distr + '"' +
                            ((!!respath && respath.length > 0) ? (' --resources "'+ respath + '"'):"") +
                            ((!!scriptpath && scriptpath.length > 0) ? (' --scripts "' + scriptpath + '"'):"") +
                            ' --package-path "' + packpath + '" "' + path.join(dest, pkgname) + '.pkg"';
			},
		    stdout: true
		}
	},
    xmlpoke: {
        setLine: {
            options: {
                xpath: '/installer-gui-script',
                valueType: "append"
            }
        },
        setScript: {
            options: {
                replacements: [
                    {
                        xpath: "/installer-gui-script/options",
                        valueType: "remove"
                    },
                    {
                        xpath: '/installer-gui-script',
                        valueType: "append"
                    },
                    {
                        xpath: '//script'
                    }
                ]
            }
        }
    }
 });
    
    var libs = ['grunt-contrib-clean', 'grunt-contrib-copy', 'grunt-exec', 'grunt-pkgbuild', 'grunt-xmlpoke'];
    
    var apppath = process.cwd(),
    dirfiles = [],
    libfiles = [];
    
    process.chdir(__dirname);
    var currpath = process.cwd();
    
    while(currpath !== "/" && libs.length > 0) {
        if(fs.existsSync("node_modules")) {
            dirfiles = grunt.file.expand({cwd: path.join(currpath,"node_modules"), filter:"isDirectory"}, "*" );
            libfiles = _.intersection(dirfiles, libs);
            for(var i = 0; i<libfiles.length; i++) {
                grunt.loadNpmTasks(libfiles[i]);
            }
            libs = _.difference(libs, libfiles);
        }
        currpath = path.join(process.cwd(), "../");
        process.chdir(currpath);
    }
    
    process.chdir(apppath);
    
  //create pkgbuild tasks
  var pkgbuild = {};
  _.each(grunt.config("productbuild"), function(val, key) {
      pkgbuild[key] = val.packages;
         var cwd = val.options.cwd || val.cwd;
         var dest = val.options.dest || val.dest;
         if(!pkgbuild[key].cwd && !!cwd) {
            pkgbuild[key].cwd = cwd;
         }
        if(!pkgbuild[key].dest && !!dest) {
           pkgbuild[key].dest = dest;
        }
  });
  
  grunt.config.merge({pkgbuild: pkgbuild});


  function setTitle(title) {
      return ((!!title && title.length >  0) ? ("<title>"+title+"</title>"+grunt.util.linefeed) : "");
  }
    
  function setResource(type, file) {
      return ((!!file && file.length > 0) ? ("<"+type+" file='"+file+"' />"+grunt.util.linefeed) : "");
  }
    
  function setScriptFunctionName(name) {
      return "<options allow-external-scripts='yes' />" + grunt.util.linefeed + "<installation-check script='" + name + ";' />" + grunt.util.linefeed + "<script />" + grunt.util.linefeed;
 
  }
    
  function getFunction(name, dir, title, message) {
      var str = "";
      var runscr = grunt.file.expand({cwd: dir}, "*").join(" && ");
      if(!!runscr && runscr.length > 0) {
          str = "function " + name + "() {" + grunt.util.linefeed;
          str += 'var exit_code = system.run("'+runscr+'");' + grunt.util.linefeed;
          str += 'if(exit_code !== 0) {' + grunt.util.linefeed;
          str += 'my.result.title = "' + title + '";' + grunt.util.linefeed;
          str += 'my.result.message = "' + message + '";' + grunt.util.linefeed;
          str += 'my.result.type = "Fatal";' + grunt.util.linefeed;
          str += 'return false;' + grunt.util.linefeed;
          str += '}' + grunt.util.linefeed;
          str += 'return true;' + grunt.util.linefeed;
          str += '}';
      }
      return str;
  }
    
  function setScript(script_str) {
      return ((!!script_str && script_str.length > 0) ? ("<![CDATA[" + grunt.util.linefeed + script_str + grunt.util.linefeed + "]]>") : "");
  }
    
  grunt.registerMultiTask('productbuild', 'Create Mac product', function() {
	//Check platform
	if(process.platform !== 'darwin') {
		grunt.log.error("This should be run on a Mac computer");
		return false;
	} 
	  
    var data = this.data,
        options = this.options({cwd: process.cwd(), dest: process.cwd()}),
        packages = _.defaults(data.packages, {cwd: options.cwd, dest: options.dest}),
        taskname = this.target,
        files = packages.files;
                          
    _.each(data, function(val, key) {
        if(key !== "options" && key !== "files") {
            options[key] = val;
        }
    });
                          
    _.each(["cwd", "dest"], function(d) {
        _.each([options, packages], function(a) {
               if(!grunt.file.isPathAbsolute(a[d])) {
                    a[d] = path.resolve(a[d]);
               }
        });
    });
                          

    if(!options.pkgname) {
        console.log("No package name provided, skipping");
        return;
    }
                          
    if(!!options.dest) {
        grunt.task.run("exec:mkdir:"+options.dest);
    }
                          
    var cwd = options.cwd || ".",
        pkgcwd = packages.dest || options.dest || ".",
        dest = options.dest || ".",
        distrfile = path.join(dest, "distribution.dist"),
        distrfile1 = path.join(dest, "distribution1.dist"),
        script_path = "",
        res_path = "",
        distrfiles = {},
        pkgfiles = [];
        distrfiles[distrfile1] = distrfile;
                          
                          
    step(
         function create_pkg() {
            grunt.config("pkgbuild."+taskname+".callback", this);
            grunt.task.run("pkgbuild:"+taskname);
         },
         function synthesize() {
            pkgfiles = grunt.file.expand({cwd: pkgcwd}, "*.pkg");
         
            grunt.config("exec.synthesizeMacProduct.callback", this);
            grunt.task.run("exec:synthesizeMacProduct:"+pkgcwd+":"+pkgfiles+":"+distrfile);
         },
         function set_resources(err, stdout, stderr) {
            if(!!options.resources && (!!options.title || !!options.license || !!options.welcome || !!options.readme)) {
                res_path = grunt.file.isPathAbsolute(options.resources) ? options.resources : path.join(cwd, options.resources);
         
                grunt.config("xmlpoke.setLine.files", distrfiles);
         
                //set title and resource tags in the distribution file
                var line = _.reduce(["welcome", "license", "readme"], function(result, d) {
                    return result + setResource(d, options[d]);
                }, setTitle(options.title));
                          
                grunt.config("xmlpoke.setLine.options.value", line);
                grunt.task.run("xmlpoke:setLine");
         
                grunt.config("exec.mv.callback", this);
                grunt.task.run("exec:mv:"+distrfile1+":"+distrfile);
            } else {
                this.call();
            }
         },
         function get_validation_script() {
            var script_content = "";
            if(_.isString(options.script)) {
                script_content = grunt.file.read(grunt.file.isPathAbsolute(options.script) ? options.script : path.join(cwd, options.script));
            } else if(_.isObject(options.script)) {
                if(!!options.script.src) {
                   var p = grunt.file.isPathAbsolute(options.script.src) ? options.script.src : path.join(cwd, options.script.src);
                   if(grunt.file.isFile(p)) {
                        script_content = grunt.file.read(p);
                   } else if(grunt.file.isDir(p)){
                        script_content = getFunction(options.script.func || "check_installation", p, options.script.title || "Error", options.script.message || "Validation has failed");
                        script_path = p;
                   } else {
                        grunt.log.warn("The script files don't exist, skipping");
                   }
                } else {
                    grunt.log.warn("Script for " + taskname + " is missing, skipping");
                }
            }
            return script_content;
         },
         function set_validation_function(err, scriptContent) {
            var checkfunc = /function\s+(.+\(\))/.exec(scriptContent || "");
            if(!!checkfunc && _.size(checkfunc) > 1) {
                var func_index = _.findIndex(grunt.config.get("xmlpoke.setScript.options.replacements"), function(r) {
                    return r.xpath === "/installer-gui-script";
                });
                grunt.config("xmlpoke.setScript.options.replacements."+func_index+".value", setScriptFunctionName(checkfunc[1]));
                return scriptContent;
            } else {
                grunt.log.warn("No function found in the script, skipping");
                return null;
            }
         },
         function set_validation_script(err, scriptStr) {
            if(!!scriptStr && scriptStr.length > 0) {
                var script_index = _.findIndex(grunt.config.get("xmlpoke.setScript.options.replacements"), function(r) {
                    return r.xpath === "//script";
                });
                grunt.config("xmlpoke.setScript.files", distrfiles);
                grunt.config("xmlpoke.setScript.options.replacements."+script_index+".value", setScript(scriptStr));
                grunt.task.run("xmlpoke:setScript");
                          
                grunt.config("copy.macDistributionCopy.src", distrfile1);
                grunt.config("copy.macDistributionCopy.dest", distrfile);
                          
                // hack, correct messed up symbols in the distribution file
                grunt.task.run("copy:macDistributionCopy");
            }
            return true;
         },
         function create_package() {
                          
            grunt.config("exec.createMacProduct.callback", this);
            grunt.task.run("exec:createMacProduct:"+distrfile+":"+pkgcwd+":"+res_path+":"+script_path+":"+dest+":"+options.pkgname);
            
         },
         function cleanup() {
            //callback
            var func = options.callback;
            if(!func || typeof func !== "function") {
                func = function() {
                    grunt.log.ok("PACKAGE " + options.pkgname +" FOR TASK " + taskname+ " HAS BEEN CREATED");
                };
            }
                          
            grunt.config("clean.pkgfiles", [dest + "/*.dist", dest + "/*.plist"]
                                       .concat(_.map(pkgfiles, function(p) {
                                                    return path.join(dest,p);
                                                } )));
            grunt.task.run("clean:pkgfiles");
            func.call();
         }
    );
                          
  });

};
