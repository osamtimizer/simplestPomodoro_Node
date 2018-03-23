const gulp = require('gulp');
const sass = require('gulp-sass');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');

const webpackConfig = require('./webpack.config');

gulp.task('sass', () => {
  gulp.src('./public/stylesheets/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./public/stylesheets/build/'));
});

gulp.task('webpack', () => {
  webpackStream(webpackConfig, webpack)
    .pipe(gulp.dest('./public/javascripts/build/'));
});

gulp.task('sass-watch', ['sass'], () => {
  const watcher = gulp.watch('./public/stylesheets/*.scss', ['sass']);
  watcher.on('change', (event) => {
    console.log('File ' + event.path + ' was ' + event.type + ' , runnning tasks...');
  });
});

gulp.task('webpack-watch', ['sass'], () => {
  const watcher = gulp.watch('./public/javascripts/*.js', ['webpack']);
  watcher.on('change', (event) => {
    console.log('File ' + event.path + ' was ' + event.type + ' , runnning tasks...');
  });
});

gulp.task('default', ['sass-watch', 'webpack-watch']);
