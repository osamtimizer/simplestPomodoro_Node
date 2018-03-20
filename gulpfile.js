const gulp = require('gulp');
const sass = require('gulp-sass');

gulp.task('sass', () => {
  gulp.src('./public/stylesheets/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./public/stylesheets/build/'));
});

gulp.task('sass-watch', ['sass'], () => {
  const watcher = gulp.watch('./public/stylesheets/*.scss', ['sass']);
  watcher.on('change', (event) => {
    console.log('File ' + event.path + ' was ' + event.type + ' , runnning tasks...');
  });
});

gulp.task('default', ['sass-watch']);
