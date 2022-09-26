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
      newer = require('gulp-newer'),
      sftp = require('gulp-sftp'),
      svgmin = require('gulp-svgmin'),
      pathModule = require('path');

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
	// путь к svg
	svg: {
		src: 'src/assets/images/**/*.svg',
		dest: 'dist/assets/images/svg',
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
	return gulp.src([path.html.src, '!src/components/html/**/*.html'])
    .pipe(fileinclude())
    .pipe(gulp.dest(path.html.dest))
    .pipe(browsersync.stream());
}

// ================= изображения ==============

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

function svg() {
	//prettier-ignore
	return gulp.src(path.svg.src)
    .pipe(svgmin())
    .pipe(gulp.dest(path.svg.dest))
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

function fontsStyle(cb) {
	//Файл стилей подключения шрифтов
	const fontsFile = `src/components/scss/fonts.scss`;
	//Проверяем, существуют ли файлы шрифтов
	const fontFiles = fs.readdirSync(path.fonts.dest);
	const fontWeights = {
		thin: 100,
		extralight: 200,
		light: 300,
		medium: 500,
		semibold: 600,
		bold: 700,
		extrabold: 800,
		heavy: 800,
		black: 900,
		default: 400,
	};
	const fileNames = [];

	for (let i = 0; i < fontFiles.length; i++) {
		const filePath = fontFiles[i];
		const fontFileName = pathModule.basename(
			filePath,
			pathModule.extname(filePath)
		);

		if (fileNames.indexOf(fontFileName) !== -1) continue;
		fileNames.push(fontFileName);

		const fileNameParts = fontFileName.split('-');
		// игнорируем все файлы, имя которых не соответсвует маске: FontName-FontWeight
		if (fileNameParts.length !== 2) continue;

		const fontName = fileNameParts[0];
		const fontWeightPart =
			typeof fileNameParts[1] === 'string'
				? fileNameParts[1].toLowerCase()
				: fileNameParts[1];

		const fontWeight = fontWeights[fontWeightPart] || fontWeights.default;

		fs.appendFileSync(
			fontsFile,
			`@font-face{\n\tfont-family: ${fontName};\n\tfont-display: swap;\n\tsrc: url("../assets/fonts/${fontFileName}.woff2") format("woff2"), url("../assets/fonts/${fontFileName}.woff") format("woff");\n\tfont-weight: ${fontWeight};\n\tfont-style: normal;\n}\r\n`
		);
	}

	cb();
}

// ================ sftp

function sftprun() {
	//prettier-ignore
	return gulp.src('dist/**/*')
    .pipe(sftp({
        host: 'website.com',
        user: 'me',
        pass: '1234'
    }));
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
	gulp.watch('src/components/scss/*.scss', stylesDev);
	gulp.watch('src/components/js/*.js', scripts);
	gulp.watch('src/components/html/*.html', html);
}

const info = () => {
	console.log(
		'comands: \n gulp prod: окончательная сборка проекта со сжатием всех файлов \n gulp dev / gulp: классическая сборка проекта \n gulp fonts: автоматическая конвертация и запись в стили шрифтов \n gulp sftp: передача фалов на удаленный сервер в настройках надо вписать данные.\u001b[33m ВНИМАНИЕ!\u001b[0m не забывайте удалять ключи при публикации кода в открытый доступ'
	);
	return;
};

// dev и prod
exports.prod = gulp.series(
	clean,
	otftottf,
	ttftowoff,
	fontsStyle,
	gulp.parallel(scripts, stylesProd, html, img, svg)
);
exports.dev = gulp.series(
	clean,
	otftottf,
	ttftowoff,
	fontsStyle,
	gulp.parallel(scripts, stylesDev, html, img),
	watch
);
exports.default = this.dev;
exports.sftp = sftprun;
exports.info = info;
