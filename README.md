# grunt-productbuild

> Create Mac flat packages from files and scripts

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-productbuild --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-productbuild');
```

## The "productbuild" task

### Overview
In your project's Gruntfile, add a section named `productbuild` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  productbuild: {
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### General Options

#### options.cwd
Type: `String`

All src matches are relative to (but don't include) this path.

#### options.dest
Type: `String`

Created package is placed into this directory

#### options.pkgname
Type: `String`

Package name, without the extension ".pks"

#### options.title
Type: `String`

Product Title in the installer

#### options.resources
Type: `String`

A name of the directory containing package resources

#### options.welcome
Type: `String`

A name of the file for a Welcome message

#### options.readme
Type: `String`

A name of the file containing a README text

#### options.license
Type: `String`

A name of the file containing a LICENSE text

#### options.script
Type: `String`

This Javascript script is run in the beginning of the installation, validating some condition. If the script returns true, the installation continues, if false, the installation fails. The option is either a path to the Javascript validation file or a hash pointing to a folder with shell scripts to be run and specifying the error message title and a message.

### Validation Script Options

#### src
Type: `String`

A path to a folder with validation shell script files. A shell script should exit with the status 0 when it succeeds and with the status 1 when it fails. The permissions for those files should be set to 755.

#### title
Type: `String`

A title for the error popup

#### message
Type: `String`

A message for the error popup


### File Options

The file option format is the same as in the grunt-pkgbuild plugin https://github.com/calaverastech/grunt-pkgbuild .

#### root
Type: `String`

The destination root

#### analyze
Type: `Boolean`

Whether to analyze the destination root instead of creating a package

#### component
Type: `String` or `Array`

The bundle at the path(s) is added to the package. Valid only if you don't use --root

#### plist
Type: `String`

Plist name

#### plistoptions
Type: `Hash`

Options to be edited in plist. Accepted options: BundleIsRelocatable, BundleOverwriteAction, BundlePreInstallScriptPath, BundlePostInstallScriptPath

#### pkgname
Type: `String`

Package name (without the extension ".pkg")

#### identifier
Type: `String`

Package identifier

#### location
Type: `String` or `Array`

Location(s) where the package(components) will be installed

#### version
Type: `String`

Package version

#### scripts
Type: `String`

Directory name with package scripts

### Usage Examples

```js
productbuild: {
	my_target1: {
		options: {
			dest: "my_packages",
            pkgname: "MyTestPackage1",
            title: "My First Flat Mac Package",
            resources: "my_project1/resources",
            welcome: "WELCOME.txt",
            readme: "README.txt",
            license: "LICENSE.txt",
            script: "my_project1/scripts/validate1.js"
		},
		files: [
			{root: "my_files", analyze: true, plist: "Info.plist"},
			{root: "my_files", pkgname: "sample", version: "1.0", plist: "Info.plist", location: "/tmp", identifier: "com.sample.pkg"},
		]
	},
    my_target2: {
        options: {
            cwd: "my_projects",
            dest: "my_packages",
            pkgname: "MyTestPackage2",
            title: "My Second Flat Mac Package",
            script: {src: "my_project2/scripts", title: "Validation Failed", message: "Something doesn't validate"}
        },
        files: {
			{component: ["my_comps1", "my_comps2"], pkgname: "sample", location: "/tmp"},
			{scripts: "scripts", pkgname: "samplescript", identifier: "com.samplescript.pkg"}
        }
    }
}
```

##Testing

To run the grunt test suite type:

> grunt --passw=&lt; your root password &gt;

Password is required to install and uninstall test packages

##Troubleshooting

By default, if a file or directory is not found it is ignored with a grunt log warning.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
2015-10-20 Initial release
