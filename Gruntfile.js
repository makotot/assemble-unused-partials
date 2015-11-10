module.exports = function (grunt) {

  require('jit-grunt')(grunt, {
    browserSync: 'grunt-browser-sync'
  });
  require('time-grunt')(grunt);

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    path: {
      src: './src',
      env: './dev'
    },

    clean: {
      all: ['<%= path.env %>']
    },

    assemble: {
      options: {
        layoutdir: '<%= path.src %>/layouts',
        partials: [
          '<%= path.src %>/partials/**/*.hbs',
          '<%= path.src %>/sub-partials/**/*.hbs'
        ],
        helpers: [
        ],
        plugins: [
          './index.js'
        ],
        unusedPartials: {
          excludes: [
            '<%= path.src %>/partials/excludes.hbs',
            '<%= path.src %>/partials/excludes/*.hbs'
          ]
        }
      },
      all: {
        options: {
          layout: 'default.hbs'
        },
        files: [
          {
            expand: true,
            cwd: '<%= path.src %>/pages',
            src: '**/*.hbs',
            dest: '<%= path.env %>'
          }
        ]
      }
    },

    watch: {
      options: {
        spawn: false
      },
      html: {
        files: ['<%= path.src %>/**/*.hbs'],
        tasks: ['assemble']
      }
    },

    browserSync: {
      all: {
        options: {
          watchTask: true,
          server: '<%= path.env %>',
          open: false
        },
        bsFiles: {
          src: [
            '<%= path.env %>/**/*.html'
          ]
        }
      }
    }
  });


  grunt.registerTask('default', ['clean']);
  grunt.registerTask('build', ['clean', 'assemble']);
};
