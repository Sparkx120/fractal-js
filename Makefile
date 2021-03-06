##
# Mandlebrot-JS Babel and Closure Compiler build.
# 
# Build Environment GnuMake32 on Windows 10 with babel-cli (NPM) and Google Closure Compiler and cygwin environment
# Theoretically works on unix like systems...
#
# THIS MAKE FILE IS CURRENTLY BROKEN ONLY THE ES6 PART WORKS
##

ROOT = ./mandelbrot-js
LIBD = $(ROOT)/lib

STATIC_LIBS = $(ROOT)/static/Math3D.js
LIBS = $(LIBD)/Canvas2D.js $(LIBD)/Mandelbrot.js $(LIBD)/SyntheticWorker.js
DRIVER = $(ROOT)/driver.js

ES6C = babel

CLOSURE_CONF = --language_in=ECMASCRIPT6

all: dev

es6:
	$(ES6C) $(LIBS) $(DRIVER) > precomp1.js
	cat precomp1.js | perl -pe 'BEGIN { print "\"use strict\"\n" }' > precomp2.js
	mv precomp2.js precomp1.js

closure: es6
	echo "Closure Compiling (Currently compiling native es6)"
	java -jar ./closure/compiler.jar $(CLOSURE_CONF) --js precomp1.js --js_output_file ./js/Mandelbrot.js

build: closure

dev: es6
	cp precomp1.js ./js/Mandelbrot.js

release: build clean

clean:
	rm precomp1.js
	rm precomp2.js

