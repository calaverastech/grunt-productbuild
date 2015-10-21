/*
 * grunt-productbuild
 * https://github.com/tmoskun/grunt-productbuild
 *
 * Copyright (c) 2015 tmoskun
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
    
 var _ = require('lodash'),
    path = require("path"),
    fs = require("fs");
    
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
                return "mv " + file1 + " " + file2;
            }
        },
        synthesizeMacProduct: {
			cmd: function(cwd, packages, distr) {
                var packagesStr = _.map(packages.split(","), function(p) {return " --package " + cwd + "/" + p; }).join(" ");
                    return "productbuild --synthesize " + packagesStr + " " + cwd + "/" + distr;
			},
			stdout: true
		},
		createMacProduct: {
			cmd: function(distr, packpath, respath, scriptpath, dest, pkgname) {
                return "productbuild --distribution " + distr +
                            ((!!respath && respath.length > 0) ? (" --resources " + respath):"") +
                            ((!!scriptpath && scriptpath.length > 0) ? (" --scripts " + scriptpath):"") +
                            " --package-path " + packpath + " " + dest + "/" + pkgname + ".pkg";
			},
		stdout: true
		},
	    createMacDmg: {
	        cmd: function(prodname, pkgname) {
	            var dest = grunt.config("CWD") + "/installers/mac";
	            return "hdiutil create -volname " + prodname + " -srcfolder " + dest + "/" + pkgname + ".pkg -ov -format UDZO " + dest + "/" + pkgname + ".dmg";
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
    
  var apppath = process.cwd(),
  currpath = process.cwd();
    
  process.chdir(__dirname);
  while(currpath !== "/" && !fs.existsSync("node_modules")) {
    currpath = path.join(process.cwd(), "../");
    process.chdir(currpath);
  }
    
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-pkgbuild');
  grunt.loadNpmTasks('grunt-xmlpoke');
    
  process.chdir(apppath);
    
  grunt.config.merge({pkgbuild: grunt.config("productbuild")});
    
  function setTitle(title) {
     return "<title>"+title+"</title>"+grunt.util.linefeed;
  }
    
  function setResource(type, file) {
      return "<"+type+" file='"+file+"' />"+grunt.util.linefeed;
  }
    
  function setScriptFunctionName(name) {
      return "<options allow-external-scripts='yes' />" + grunt.util.linefeed + "<installation-check script='" + name + ";' />" + grunt.util.linefeed + "<script />" + grunt.util.linefeed;
 
  }
    
  function getFunction(name, dir, title, message) {
      var str = "";
      var runscr = grunt.file.expand({cwd: dir}, "*.sh").join(" && ");
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
      return "<![CDATA[" + grunt.util.linefeed + script_str + grunt.util.linefeed + "]]>";
  }
    
  grunt.registerMultiTask('productbuild', 'Create Mac product', function() {
	//Check platform
	if(process.platform !== 'darwin') {
		grunt.log.error("This should be run on a Mac computer");
		return false;
	} 
	  
    // Merge task-specific and/or target-specific options with these defaults.
    //var options = this.options({

    //});
    var data = this.data,
        options = data.options !== undefined ? data.options : {},
        taskname = this.target,
        files = this.data.files;
                          
    if(!data.pkgname) {
        console.log("No package name provided, skipping");
        return;
    }
                          
    _.each(data, function(val, key) {
        if(key !== "options" && key !== "files") {
            options[key] = val;
        }
    });
                          
                          
    if(!grunt.file.isPathAbsolute(options.cwd)) {
        options.cwd = path.join(process.cwd(), options.cwd);
    }
                          
    if(!grunt.file.isPathAbsolute(options.dest)) {
        options.dest = path.join(process.cwd(), options.dest);
    }
                          
    if(!!options.dest) {
        grunt.task.run("exec:mkdir:"+options.dest);
    }
                          
    // set productbuild as a callback to pkgbuild
    grunt.config("pkgbuild."+taskname+".callback", function() {
        var cwd = options.cwd || ".";
        var dest = options.dest || ".";
        var packages = grunt.file.expand({cwd: dest}, "*.pkg");
        var distrfile = "distribution.dist";
        var script_path = "";
        var res_path = "";
                 
        grunt.task.run("exec:synthesizeMacProduct:"+dest+":"+packages+":"+distrfile);
                 
        var distrfile1 = "distribution1.dist";
        var distrfiles = {};
        distrfiles[path.join(dest, distrfile1)] = path.join(dest, distrfile);
        grunt.config("xmlpoke.setLine.files", distrfiles);
                 
        if(!!options.resources && (!!options.title || !!options.license || !!options.welcome || !!options.readme)) {
            res_path = path.join(cwd, options.resources);
            var line = "";
            if(!!options.title) {
                 line += setTitle(options.title);
            }
            _.each(["welcome", "license", "readme"], function(d) {
                   if(!!options[d]) {
                        line += setResource(d, options[d]);
                   }
            });
            grunt.config("xmlpoke.setLine.options.value", line);
            grunt.task.run("xmlpoke:setLine");
                 
            grunt.task.run("exec:mv:"+path.join(dest, distrfile1)+":"+path.join(dest, distrfile));
        }
        if(!!options.script) {
            var check_str = options.script.func || "check_installation";
            var script_content = "";
            var script_str = "";
            if(_.isString(options.script)) {
                 script_content = grunt.file.read(path.join(cwd, options.script));
            } else if(_.isObject(options.script)) {
                 if(!!options.script.src) {
                    var p = path.join(cwd, options.script.src);
                    if(grunt.file.isFile(p)) {
                        script_content = grunt.file.read(p);
                    } else if(grunt.file.isDir(p)){
                        script_content = getFunction(check_str, p, options.script.title || "Error", options.script.message || "Validation has failed");
                        script_path = p;
                    } else {
                        grunt.log.warn("The script files don't exist, skipping");
                    }
                 } else {
                    grunt.log.warn("Script for " + taskname + " is missing, skipping");
                 }
            }
            var checkfunc = /function\s+(.+\(\))/.exec(script_content);
            if(!!checkfunc) {
                check_str = checkfunc[1];
                var func_index = _.findIndex(grunt.config.get("xmlpoke.setScript.options.replacements"), function(r) {
                    return r.xpath === "/installer-gui-script";
                });
                var val = setScriptFunctionName(check_str);
                grunt.config("xmlpoke.setScript.options.replacements."+func_index+".value", val);
                script_str += script_content;
            } else {
                grunt.log.warn("No function found in the script, skipping");
            }
            if(script_str.length > 0) {
                var checkscript = setScript(script_str);
                var script_index = _.findIndex(grunt.config.get("xmlpoke.setScript.options.replacements"), function(r) {
                        return r.xpath === "//script";
                });
                grunt.config("xmlpoke.setScript.files", distrfiles);
                grunt.config("xmlpoke.setScript.options.replacements."+script_index+".value", checkscript);
                grunt.task.run("xmlpoke:setScript");
                 
                grunt.config("copy.macDistributionCopy.src", dest+"/"+distrfile1);
                grunt.config("copy.macDistributionCopy.dest", dest+"/"+ distrfile);
                 
                grunt.task.run("copy:macDistributionCopy");
                
            }
        }
        //a callback after creating a package
        var func = options.callback;
        if(!func || typeof func !== "function") {
            func = function() {
                 grunt.log.ok("PACKAGE " + options.pkgname +" FOR TASK " + taskname+ " HAS BEEN CREATED");
            };
        }
        grunt.config("exec.createMacProduct.callback", func);
        grunt.task.run("exec:createMacProduct:"+dest+"/"+distrfile+":"+dest+":"+res_path+":"+script_path+":"+dest+":"+options.pkgname);
                 
        grunt.config("clean.pkgfiles", [dest + "/*.dist", dest + "/*.plist"]
                     .concat(_.map(packages, function(p) {
                                return dest + "/" + p;
                            } )));
        grunt.task.run("clean:pkgfiles");
    });
                 
    grunt.task.run("pkgbuild:"+taskname);
                          
  });

};
