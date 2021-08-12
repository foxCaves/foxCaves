module.exports = function(grunt) {
	const source_directory = 'static',
		  temp_directory = '.tmp',
		  target_directory = 'dist/static';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		imagemin: {
			dist: {
				files: [{
					expand: true,
					cwd: `${source_directory}/img/`,
					src: ['**/*.{png,gif}'],
					dest: `${target_directory}/img/`,
				}]
			}
		},
		uglify: {
			options: {
				beautify: false,
				compress: true,
				warnings: true,
				mangle: true,
				sourceMap: {
					includeSources: true,
				},
				sourceMapIn(file) {
					return `${file}.map`;
				},
			},
			dist: {
				files: [{
					expand: true,
					cwd: `${temp_directory}/js/`,
					src: ['**/*.js'],
					dest: `${target_directory}/js/`,
				}],
			}
		},
		cssmin: {
			dist: {
				files: [{
					expand: true,
					cwd: `${source_directory}/css/`,
					src: ['**/*.css'],
					dest: `${target_directory}/css/`,
				}]
			}
		},
		copy: {
			dist: {
				files: [{
					expand: true,
					cwd: 'root/',
					src: ['**'],
					dest: 'dist/'
				}]
			}
		},
		exec: {
			luahtml_dist: {
				cwd: 'luahtml/',
				cmd: 'luajit build.lua'
			},
			typescript_dist: {
				cmd: 'tsc --project .'
			},
		},
		htmlmin: {
			dist: {
				options: {
					removeComments: true,
					removeAttributeQuotes: true,
					collapseWhitespace: true,
					collapseBooleanAttributes: true,
					conservativeCollapse: true,
				},
				files: [{
					expand: true,
					cwd: `.tmp/html/`,
					src: ['**/*.html'],
					dest: `dist/`,
				}]
			}
		},
		concurrent: {
			dist: [
				'imagemin:dist',
				'cssmin:dist',
				['exec:typescript_dist', 'uglify:dist'],
				'copy:dist',
				['exec:luahtml_dist', 'htmlmin:dist'],
			]
		},
		clean: {
			prebuild: ['.tmp', 'dist'],
			postbuild: ['.tmp']
		},
	});

	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-imagemin');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-htmlmin');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('default', [
		'clean:prebuild',
		'concurrent:dist',
		'clean:postbuild'
	]);
};
