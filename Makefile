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
LIBS = $(LIBD)/Canvas2D.js $(LIBD)/Mandelbrot.js
DRIVER = $(ROOT)/driver.js

ES6C = babel

CLOSURE_CONF = --language_in=ECMASCRIPT6

es6:
	$(ES6C) $(LIBS) $(DRIVER) > precomp1.js
	#cat precomp1.js | perl -pe 's/(?!^)\"use strict\"; //g' > precomp2.js

closure: es6
	echo "This is running"
	java -jar ./closure/compiler.jar $(CLOSURE_CONF) --js precomp1.js --js_output_file ./js/Mandelbrot.js 2>/dev/null

build: closure

release: build clean

clean:
	rm precomp1.js
	rm precomp2.js

