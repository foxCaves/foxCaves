const path = require('path');

module.exports = function(grunt) {
	const source_directory = 'static',
		  target_directory = 'diststatic';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		imagemin: {
			dist: {
				files: [{
					expand: true,
					cwd: `${source_directory}/img`,
					src: ['**/*.{png,gif}'],
					dest: `${target_directory}/img`,
				}]
			}
		},
		uglify: {
			options: {
				beautify: false,
				compress: true,
				warnings: true,
				mangle: true,
				sourceMap: true,
			},
			dist: {
				files: [{
					expand: true,
					cwd: `${source_directory}/js/dist`,
					src: ['**/*.js'],
					dest: `${target_directory}/js`,
				}],
			}
		},
		cssmin: {
			dist: {
				files: [{
					expand: true,
					cwd: `${source_directory}/css`,
					src: ['**/*.css'],
					dest: `${target_directory}/css`,
				}]
			}
		},
		concurrent: {
			dist: ['imagemin:dist', 'cssmin:dist', 'uglify:dist']
		},
		clean: {
			statics: [target_directory],
			postbuild: ['.tmp']
		},
	});

	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-imagemin');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.registerTask('default', [
		'clean:statics',
		'concurrent:dist',
		'clean:postbuild'
	]);
};
