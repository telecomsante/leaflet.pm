var gulp = require('gulp');
var mainBowerFiles = require('main-bower-files');

gulp.task('default', function() {
    return gulp.src(mainBowerFiles())
        .pipe(gulp.dest('libs'))
});
