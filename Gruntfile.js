module.exports = function(grunt) {

	var source_directory = 'static',
		target_directory = 'diststatic';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		imagemin: {
			dist: {
				files: [{
					expand: true,
					cwd: source_directory,
					src: ['img/**/*.{png,gif}'],
					dest: target_directory,
				}]
			}
		},
		uglify: {
			dist: {
				files: [{
					expand: true,
					cwd: source_directory,
					src: ['js/**/*.js'],
					dest: target_directory,
				}]
			}
		},
		cssmin: {
			dist: {
				files: [{
					expand: true,
					cwd: source_directory,
					src: ['css/**/*.css'],
					dest: target_directory,
				}]
			}
		},
		concurrent: {
			dist: ['imagemin:dist', 'cssmin:dist', 'uglify:dist']
		},
		clean: {
			statics: [target_directory + '/img', target_directory + '/css', target_directory + '/js', target_directory + '/font'],
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