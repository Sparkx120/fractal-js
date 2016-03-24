#Mandelbrot-JS v0.1.5
A Mandelbrot Explorer written in Javascript (es2015) and HTML5 Canvas. It has been tested on Edge, Chrome, and Firefox.
(Note: firefox only works with the the closure compiled version)(Note: Edge currently renders the fastest)

![Mandelbrot-JS Screenshot](https://raw.githubusercontent.com/Sparkx120/mandelbrot-js/master/screenshot.png) 

###Dependencies
- Java 8.x  (for Closure Compile)
- Babel-CLI (NPM)
- gnu make

###Make
The build process has only been tested under Windows 10 with a cygwin environment. It should work on Linux.
There are two modes for making. There is dev and build. Dev does not closure compile the code whereas build does.

Dev:
```bash
make
```

Build:
```bash
make build
```

##Licenses
My code is MIT Liscense.

Included Libraries
- Closure Compiler: Apache.
- jQuery: MIT
