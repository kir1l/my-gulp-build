//prettier-ignore
const gulp = require('gulp'), // основной модуль
      sass = require('gulp-sass')(require('sass')), // модуль препроцессора
      del = require('del'), // модуль очистки
      autoprefixer = require('gulp-autoprefixer'), // автопрефиксер
      csso = require('gulp-csso'), // css мнификатор
      babel = require('gulp-babel'),
      uglify = require('gulp-uglify'),
      fileinclude = require('gulp-file-include'),
      sourcemaps = require('gulp-sourcemaps'),
      image = require('gulp-tinypng-compress'),
      browsersync = require('browser-sync').create(),
      fs = require('fs'),
      fonter = require('gulp-fonter'),
      ttf2woff2 = require('gulp-ttf2woff'),
      img2webp = require('gulp-webp'),
      newer = require('gulp-newer');

// пути
const path = {
	// пути стилей
	styles: {
		src: 'src/styles/scss/*.scss',
		dest: 'dist/css/',
	},
	// пути скриптов
	scripts: {
		src: 'src/scripts/**/*.js',
		dest: 'dist/scripts/',
	},
	// пути HTML
	html: {
		src: 'src/**/*.html',
		dest: 'dist/',
	},
	// пути к картинкам
	img: {
		src: 'src/assets/images/**/*.{png,jpg,jpeg,webp,gif}',
		dest: 'dist/assets/images/',
	},
	// пути к шрифтам
	fonts: {
		src: 'src/assets/fonts/',
		dest: 'dist/assets/fonts/',
	},
};

// ================ стили ===========
function clean() {
	return del(['dist/*', '!dist/assets/images']);
}

function stylesProd() {
	//prettier-ignore
	return gulp.src(path.styles.src)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer({
        cascade: false
    }))
    .pipe(csso({
        restructure: true,
        sourceMap: true,
        debug: false
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(path.styles.dest));
}

function stylesDev() {
	//prettier-ignore
	return gulp.src(path.styles.src)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer({
        cascade: false
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(path.styles.dest))
    .pipe(browsersync.stream());
}

// ================ скрипты ===========

function scripts() {
	return gulp
		.src(path.scripts.src, {
			sourcemaps: true,
		})
		.pipe(sourcemaps.init())
		.pipe(
			babel({
				presets: ['@babel/env'],
			})
		)
		.pipe(uglify())
	        .pipe(sourcemaps.write())
		.pipe(gulp.dest(path.scripts.dest))
		.pipe(browsersync.stream());
}

// ================ html ===========

function html() {
	//prettier-ignore
	return gulp.src([path.html.src, '!src/components/**/*.html'])
    .pipe(fileinclude())
    .pipe(gulp.dest(path.html.dest))
    .pipe(browsersync.stream());
}

// ================= IMAGES==============

function img() {
	//prettier-ignore
	return gulp.src(path.img.src)
    .pipe(newer(path.img.dest))
    .pipe(image({
        key: 'fPv2DXfQrCWJSzLR8wbSW3CfNmhNTYVg',
        sigFile: 'images/.tinypng-sigs',
        log: true
    }))
    .pipe(img2webp())
    .pipe(gulp.dest(path.img.dest))
}

// =============== шрифты =============

function otftottf() {
	return gulp
		.src(path.fonts.src)
		.pipe(
			fonter({
				formats: ['ttf'],
			})
		)
		.pipe(gulp.src(path.fonts.src));
}

function ttftowoff() {
	return gulp
		.src(path.fonts.src)
		.pipe(
			fonter({
				formats: ['woff'],
			})
		)
		.pipe(gulp.dest(path.fonts.dest))
		.pipe(gulp.src('src/assets/fonts/*.ttf'))
		.pipe(ttf2woff2())
		.pipe(gulp.dest(path.fonts.dest));
}

function fontsStyle() {
	//Файл стилей подключения шрифтов
	let fontsFile = `dist/css/fonts.css`;
	//Проверяем, существуют ли файлы шрифтов
	fs.readdir(path.fonts.dest, function (err, fontsFiles) {
		if (fontsFiles) {
			let cb = () => {
				console.log('succes');
			};
			//Проверяем, существует ли файл стилей для подключения шрифтов
			if (!fs.existsSync(fontsFile)) {
				//Если файла нет, создаём его
				fs.writeFile(fontsFile, '', cb);
				let newFileOnly;
				for (var i = 0; i < fontsFiles.length; i++) {
					//Записываем подключения шрифтов в файл стилей
					let fontFileName = fontsFiles[i].split('.')[0];
					if (newFileOnly !== fontFileName) {
						let fontName = fontFileName.split('-')[0] ? fontFileName.split('-')[0] : fontFileName;
						let fontWeight = fontFileName.split('-')[1] ? fontFileName.split('-')[1] : fontFileName;
						if (fontWeight.toLowerCase() === 'thin') {
							fontWeight = 100;
						} else if (fontWeight.toLowerCase() === 'extralight') {
							fontWeight = 200;
						} else if (fontWeight.toLowerCase() === 'light') {
							fontWeight = 300;
						} else if (fontWeight.toLowerCase() === 'medium') {
							fontWeight = 500;
						} else if (fontWeight.toLowerCase() === 'semibold') {
							fontWeight = 600;
						} else if (fontWeight.toLowerCase() === 'bold') {
							fontWeight = 700;
						} else if (fontWeight.toLowerCase() === 'extrabold' || fontWeight.toLowerCase() === 'heavy') {
							fontWeight = 800;
						} else if (fontWeight.toLowerCase() === 'black') {
							fontWeight = 900;
						} else {
							fontWeight = 400;
						}
						fs.appendFile(
							fontsFile,
							`@font-face{\n\tfont-family: ${fontName};\n\tfont-display: swap;\n\tsrc: url("../assets/fonts/${fontFileName}.woff2") format("woff2"), url("../assets/fonts/${fontFileName}.woff") format("woff");\n\tfont-weight: ${fontWeight};\n\tfont-style: normal;\n}\r\n`,
							cb
						);
						newFileOnly = fontFileName;
					}
				}
			} else {
				//Если файл есть, выводим сообщение
				console.log('Файл scss/fonts.css уже существует. Для обновления файла нужно его удалить!');
			}
		}
	});
	return gulp.dest(path.styles.dest);
}

//=========================================================================

function watch() {
	browsersync.init({
		server: {
			baseDir: './dist/',
		},
	});
	gulp.watch(path.styles.src, stylesDev);
	gulp.watch(path.scripts.src, scripts);
	gulp.watch(path.html.src, html);
}

const info = () => {
	console.log(
		'comands: \n gulp prod: окончательная сборка проекта со сжатием всех файлов \n gulp dev / gulp: классическая сборка проекта \n gulp fonts: автоматическая конвертация и запись в стили шрифтов'
	);
};

// dev и prod
exports.prod = gulp.series(clean, gulp.parallel(scripts, stylesProd, html, img));
exports.dev = gulp.series(clean, gulp.parallel(scripts, stylesDev, html, img), watch);
exports.default = this.dev;
exports.fonts = gulp.series(otftottf, ttftowoff, fontsStyle);
exports.info = info;
