(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Canvas Wrapper object to handle pixel level drawing on the HTML5 Canvas as well as manage the canvas
 * Automatically deploys a canvas to the body (for now)
 * 
 * (Now in ES6)
 * 
 * @author  James Wake (SparkX120)
 * @version 0.0.6 (2017/12)
 * @license MIT
 */
var Canvas2D = function () {
	function Canvas2D(config) {
		var _this = this;

		_classCallCheck(this, Canvas2D);

		//Create the Canvas and Deploy it
		this.container = document.createElement('div');
		this.canvas = document.createElement('canvas');
		this.bufferedImage = document.createElement('canvas');

		//Get Supersampling and Style configurations
		if (config && config.supersampling) this.supersampling = config.supersampling;else this.supersampling = 1.0;

		if (config && config.canvasStyle) {
			for (var i in config.canvasStyle) {
				this.canvas.style[i] = config.canvasStyle[i];
			}
		}
		if (config && config.containerStyle) {
			for (var _i in config.containerStyle) {
				this.container.style[_i] = config.containerStyle[_i];
			}
		} else {
			this.container.style.margin = "0%";
			this.container.style.width = "100vw";
			this.container.style.height = "100vh";
			this.container.style.position = "relative";
		}

		//Setup Contexts
		this.context = this.canvas.getContext('2d');
		this.bufferedContext = this.bufferedImage.getContext('2d');

		//Compose the container and put into the document
		this.container.appendChild(this.canvas);
		document.body.appendChild(this.container);

		//Positioning and Scaling
		this.rect = this.container.getBoundingClientRect();
		window.addEventListener('resize', function (event) {
			_this.setSupersampling(_this.supersampling);
			if (_this.resizeCB) {
				_this.resizeCB();
			}
		});
		window.addEventListener('load', function (event) {
			_this.setSupersampling(_this.supersampling);
			if (_this.resizeCB) {
				_this.resizeCB();
			}
		});
		this.canvas.width = this.rect.width;
		this.canvas.height = this.rect.height;
		this.width = this.rect.width;
		this.height = this.rect.height;

		//Persistant Pixel Image Data Object
		this.pixelImageData = this.context.createImageData(1, 1);
		this.buffer = this.context.createImageData(this.width, this.height);
	}

	/**
  * Set a supersampling factor for the buffered canvas (access super sample width and height via getWidth and getHeight)
  * @param {*} supersampling - The supersampling factor to use
  */


	_createClass(Canvas2D, [{
		key: 'setSupersampling',
		value: function setSupersampling(supersampling) {
			//Compute Dimensions to use
			this.supersampling = supersampling;
			this.rect = this.canvas.getBoundingClientRect();
			this.canvas.width = Math.floor(this.rect.width);
			this.canvas.height = Math.floor(this.rect.height);
			this.width = Math.floor(this.rect.width);
			this.height = Math.floor(this.rect.height);
			this.context.scale(1 / supersampling, 1 / supersampling);

			//Setup the supersampled ArrayBuffer
			this.buffer = this.context.createImageData(this.getWidth(), this.getHeight());
			this.bufferedImage.width = this.getWidth();
			this.bufferedImage.height = this.getHeight();
			return this;
		}

		/**
   * Get the width of canvas with supersampling
   * @returns the width with supersampling
   */

	}, {
		key: 'getWidth',
		value: function getWidth() {
			return Math.ceil(this.width * this.supersampling);
		}

		/**
   * Get height of canvas with supersampling
   * @returns the height with supersampling
   */

	}, {
		key: 'getHeight',
		value: function getHeight() {
			return Math.ceil(this.height * this.supersampling);
		}

		/**
   * Draws a pixel to this Canvas. Note that RGBA are between 0 and 255
   * @param  {{x: Number, y: Number, r: Number, g: Number, b: Number, a: Number}} pixel The Pixel to draw
   */

	}, {
		key: 'drawPixel',
		value: function drawPixel(pixel) {
			this.pixelImageData.data[0] = pixel.r;
			this.pixelImageData.data[1] = pixel.g;
			this.pixelImageData.data[2] = pixel.b;
			this.pixelImageData.data[3] = pixel.a;
			this.context.putImageData(this.pixelImageData, pixel.x / this.supersampling, pixel.y / this.supersampling);
		}

		/**
   * Draws a pixel to the supersampled ArrayBuffer
   * @param {*} pixel - The pixel to draw
   */

	}, {
		key: 'drawBufferedPixel',
		value: function drawBufferedPixel(pixel) {
			var index = 4 * (pixel.x + pixel.y * this.getWidth()) - 4;
			this.buffer.data[index] = pixel.r;
			this.buffer.data[index + 1] = pixel.g;
			this.buffer.data[index + 2] = pixel.b;
			this.buffer.data[index + 3] = pixel.a;
		}

		/**
   * Flushes the supersampled ArrayBuffer to the rendered canvas' drawing context
   */

	}, {
		key: 'flushBuffer',
		value: function flushBuffer() {
			this.bufferedContext.putImageData(this.buffer, 0, 0);
			this.context.drawImage(this.bufferedImage, 0, 0); //Still not working
		}

		/**
   * Clears the supersampled ArrayBuffer
   */

	}, {
		key: 'clearBuffer',
		value: function clearBuffer() {
			this.buffer = this.context.createImageData(this.getWidth(), this.getHeight());
		}

		/**
   * Draws a Line on the canvas directly between 2 points
   * @param {{x1,x2,y1,y2}} line 
   */

	}, {
		key: 'drawLine',
		value: function drawLine(line) {
			this.context.beginPath();
			this.context.moveTo(line.x1, line.y1);
			this.context.lineTo(line.x2, line.y2);
			this.context.stroke();
		}
	}]);

	return Canvas2D;
}();

exports.default = Canvas2D;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _syntheticWebworker = require('synthetic-webworker');

var _syntheticWebworker2 = _interopRequireDefault(_syntheticWebworker);

var _canvas2dFramework = require('canvas-2d-framework');

var _canvas2dFramework2 = _interopRequireDefault(_canvas2dFramework);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Mandelbrot Class to generate and render a Mandelbrot to a Drawable canvas in Javascript
 * Uses my Canvas2D library and ES6.
 * 
 * @author  James Wake (SparkX120)
 * @version 0.2.0 (2017/12)
 * @license MIT
 */

var Mandelbrot = function () {
    /**
     * Constructor for Mandelbrot
     * 
     * @param {Canvas2D} canvas2D
     */
    function Mandelbrot(canvas2D) {
        var _this = this;

        _classCallCheck(this, Mandelbrot);

        this.initDefaults();

        this.types = {
            mandelbrot: 'Mandelbrot',
            julia: 'Julia'
        };

        this.type = this.types.mandelbrot;

        this.z = {
            //TODO
        };

        this.canvas2d = canvas2D.setSupersampling(this.supersampling);

        this.shaderModes = {
            "BLUE": 0,
            "WHITE": 1,
            "HIST": 2,
            "INTHIST": 3
        };
        this.defaultShader = this.shaderModes["BLUE"];
        this.shader = this.defaultShader;

        this.renderParallel = true;
        this.renderTerm = false; //Terminate Rendering Early

        this.renderThreads = [];

        this.drawControls();

        //TODO Switch to non jquery listeners
        this.canvas2d.canvas.addEventListener('mousedown', function (event) {
            return _this._mousedown(event);
        }, false);
        this.canvas2d.canvas.addEventListener('mouseup', function (event) {
            return _this._mouseup(event);
        }, false);
        //$(this.canvas2d.canvas).on('mousedown' , (event) => this._mousedown(event));
        //$(this.canvas2d.canvas).on('mouseup'   , (event) => this._mouseup(event));
    }

    _createClass(Mandelbrot, [{
        key: 'initDefaults',
        value: function initDefaults() {
            this.iterations = 256;
            this.scale = 0.5;
            this.supersampling = 1.0; //Need to adapt screen click coordinates still
            this.xDelta = 0;
            this.yDelta = 0;
            this.parallelism = 2;
            this.heightScalar = null;

            this.c = {
                R: 0,
                i: 0.8
            };
        }
    }, {
        key: 'switchFractal',
        value: function switchFractal() {
            switch (this.type) {
                case this.types.mandelbrot:
                    this.type = this.types.julia;
                    this.fractalBtn.innerHTML = "Mandelbrot";
                    this.initDefaults();
                    break;
                case this.types.julia:
                    this.type = this.types.mandelbrot;
                    this.fractalBtn.innerHTML = "Julia";
                    this.initDefaults();
                    break;
            }
            this.render();
        }

        /**
        * Draw Controls over the render
        * 
        * TODO Consider adding this to Canvas 2D and making it configurable
        * for my other projects
        */

    }, {
        key: 'drawControls',
        value: function drawControls() {
            var _this2 = this;

            this.controlContainer = document.createElement("div");
            this.controlContainer.style.position = "absolute";
            this.controlContainer.style.right = "0";
            this.controlContainer.style.top = "0";
            this.controlContainer.style.zindex = "100";

            this.fractalBtn = document.createElement("button");
            this.fractalBtn.innerHTML = "Julia";
            this.fractalBtn.onclick = function () {
                return _this2.switchFractal();
            };
            this.controlContainer.appendChild(this.fractalBtn);

            if (this.canvas2d.container) {
                this.canvas2d.container.appendChild(this.controlContainer);
            }
        }

        /**
         * Public render method.
         * Call this to render the mandelbrot to the canvas
         */

    }, {
        key: 'render',
        value: function render() {
            if (this.width != this.canvas2d.getWidth() || this.height != this.canvas2d.getHeight()) {
                this.width = this.canvas2d.getWidth();
                this.height = this.canvas2d.getHeight();
            }

            var rConfig = {
                type: this.type,
                types: this.types,
                c: this.c,
                heightScalar: this.heightScalar,
                iterations: this.iterations,
                scale: this.scale,
                width: this.width,
                height: this.height,
                xDelta: this.xDelta,
                yDelta: this.yDelta,
                xSkip: this.parallelism
            };

            this.canvas2d.clearBuffer();

            if (window.Worker && this.renderParallel) {
                this._renderWorkers(rConfig);
            } else {
                this._renderDirect(rConfig);
            }
        }

        /**
         * Private render worker based method. Used if Mandelbrot.renderParallel is true and Workers are available
         * 
         * @private
         * @param {Object} rConfig - The Rendering Configuration (Read the render function only place this should be called from)
         */

    }, {
        key: '_renderWorkers',
        value: function _renderWorkers(rConfig) {
            var _this3 = this;

            var workers = this.renderThreads;
            var xSkip = rConfig.xSkip;
            var width = rConfig.width;

            //Kill Previous Render Thread Workers
            while (this.renderThreads.length > 0) {
                this.renderThreads.pop().terminate();
            }

            for (var i = 0; i < xSkip; i++) {
                this.renderThreads[i] = new _syntheticWebworker2.default(this._baseRender, function (e) {
                    e.data.line.map(function (intensity, idx) {
                        _this3.canvas2d.drawBufferedPixel(_this3._pixelShader(e.data.Px, idx, intensity, _this3.shader));
                    });
                    _this3.heightScalar = e.data.heightScalar;
                    if ( /*e.data.Px % (width*xSkip) <= 1 ||*/e.data.Px > width - xSkip - 1) _this3.canvas2d.flushBuffer();
                    if (e.data.Px >= width - (xSkip - i)) _this3.renderThreads[i].terminate();
                });

                rConfig.xInit = i;
                this.renderThreads[i].postMessage(rConfig);
            }
        }

        /**
         * Private render direct method. Used if Mandelbrot.renderParallel is false or Workers are not available
         * 
         * @private
         * @param {Object} rConfig - The Rendering Configuration (Read the render function only place this should be called from)
         */

    }, {
        key: '_renderDirect',
        value: function _renderDirect(rConfig) {
            var _this4 = this;

            rConfig.xSkip = 1;
            rConfig.xInit = 0;

            var conf = { data: rConfig };
            var timeout = new Date().getTime();
            this._baseRender(conf, function (toRender) {
                toRender.line.map(function (intensity, idx) {
                    _this4.canvas2d.drawBufferedPixel(_this4._pixelShader(toRender.Px, idx, intensity, _this4.shader));
                });
                _this4.heightScalar = toRender.heightScalar;
                if (new Date().getTime() - timeout > 50) {
                    timeout = new Date().getTime();
                    // setTimeout(()=>{
                    //     this.canvas2d.flushBuffer();
                    // }, 0);
                    // this.canvas2d.flushBuffer();
                }
            });
            this.canvas2d.flushBuffer();
        }

        /**
         * The Base render loop implementing the Mandelbrot Escape Time algorithm
         * 
         * @private
         * @param {Object} e The Worker like msg object containing an rConfig (Reference render())
         * @param {Function} cb Pass this if not in a worker to get the respnose line
         */

    }, {
        key: '_baseRender',
        value: function _baseRender(e, cb) {
            var iterations = e.data.iterations;
            var scale = e.data.scale;
            var width = e.data.width;
            var height = e.data.height;
            var type = e.data.type;
            var types = e.data.types;
            var c = e.data.c;

            var widthScalar = 3.5 / scale; // Always fit width
            var heightScalar = 3.5 * height / width / scale; // scale height

            switch (type) {
                case types.mandelbrot:
                    for (var Px = e.data.xInit; Px < width; Px = Px + e.data.xSkip) {
                        //Escape Time Algorithm
                        var line = [];
                        for (var Py = 0; Py < height; Py++) {
                            var Tx = Px + width / 2 - e.data.xDelta * scale; //X-Y Translation
                            var Ty = Py + height / 2 - e.data.yDelta * scale;
                            var x0 = widthScalar / width * Tx - widthScalar; // Scaling and Aspect Correction
                            var y0 = heightScalar / height * Ty - heightScalar; //
                            var x = 0;
                            var y = 0;
                            var iteration = 0;
                            while (x * x + y * y < 4 /* 2*2 */ && iteration < iterations) {
                                //Escape Time Computation
                                var xtemp = x * x - y * y + x0;
                                y = 2 * x * y + y0;
                                x = xtemp;
                                iteration++;
                            }
                            var intensity = (iteration == iterations ? 0 : iteration) / iterations;
                            line.push(intensity);
                        }
                        if (cb) {
                            cb({ Px: Px, line: line });
                        } // Handler Callback not in Worker
                        else {
                                postMessage({ Px: Px, line: line, heightScalar: heightScalar });
                            } // Assume we are in a Worker Thread 
                    }
                    break;
                case types.julia:
                    for (var Px = e.data.xInit; Px < width; Px = Px + e.data.xSkip) {
                        //Escape Time Algorithm
                        var line = [];
                        for (var Py = 0; Py < height; Py++) {
                            var Tx = Px - e.data.xDelta * scale; //X-Y Translation
                            var Ty = Py - e.data.yDelta * scale;
                            var x0 = widthScalar / width * Tx - widthScalar / 1.4; // Scaling and Aspect Correction
                            var y0 = heightScalar / height * Ty - heightScalar / 2; //
                            var iteration = 0;
                            // var x  = 0;
                            // var y  = 0;
                            while (x0 * x0 + y0 * y0 < 4 /* 2*2 */ && iteration < iterations) {
                                //Escape Time Computation
                                var xtemp = x0 * x0 - y0 * y0;
                                y0 = 2 * x0 * y0 + c.i;
                                x0 = xtemp + c.R;
                                iteration++;
                            }
                            var intensity = (iteration == iterations ? 0 : iteration) / iterations;
                            line.push(intensity);
                        }
                        if (cb) {
                            cb({ Px: Px, line: line });
                        } // Handler Callback not in Worker
                        else {
                                postMessage({ Px: Px, line: line, heightScalar: heightScalar });
                            } // Assume we are in a Worker Thread 
                    }
                    break;
                default:
                    for (var Px = e.data.xInit; Px < width; Px = Px + e.data.xSkip) {
                        //Escape Time Algorithm
                        var line = [];
                        for (var Py = 0; Py < height; Py++) {
                            line.push(1);
                        }
                        if (cb) {
                            cb({ Px: Px, line: line });
                        } // Handler Callback not in Worker
                        else {
                                postMessage({ Px: Px, line: line, heightScalar: heightScalar });
                            } // Assume we are in a Worker Thread 
                    }
                    break;
            }
        }

        /**
         * Private pixel shader. Generates a colored pixel based on intensity from the escape time algorithm.
         * 
         * @private
         * @param {Number} Px the x coordinate of the pixel
         * @param {Number} Py the y coordinate of the pixel
         * @param {Number} intensity the intensity computed by the escape time algorithm
         * @param {Number} mode the shader mode to use (Defined in the constructor) 
         */

    }, {
        key: '_pixelShader',
        value: function _pixelShader(Px, Py, intensity, mode) {
            switch (mode) {
                case this.shaderModes["BLUE"]:
                    var int1 = intensity * (-1 / 4 * Math.log(-1 / 11.112347 * intensity + 0.09) - 0.25);
                    var int2 = intensity * (1 - 2.4 * Math.log(intensity + 0.0000000001));
                    return { x: Px, y: Py, r: 255 * int1, g: 255 * int1, b: 255 * int2, a: 255 };
                case this.shaderModes["WHITE"]:
                    return { x: Px, y: Py, r: 255 * intensity, g: 255 * intensity, b: 255 * intensity, a: 255 };
                case this.shaderModes["HIST"]:
                    //TODO
                    break;
                case this.shaderModes["INTHIST"]:
                    //TODO
                    break;
                default:
                    return this._pixelShader(Px, Py, intentisty, this.defaultShader);
            }
        }

        /**
         * Mouse down event handler for the Mandelbrot canvas.
         * 
         * @private
         * @param {Object} event the Mouse Event
         */

    }, {
        key: '_mousedown',
        value: function _mousedown(event) {
            if (event.buttons == 1) {
                //Left Click only
                console.log(event, event.clientX, event.clientY);
                this._mouseStartX = event.clientX;
                this._mouseStartY = event.clientY;
            }
        }

        /**
         * Mouse up event handler for the Mandelbrot canvas.
         * 
         * @private
         * @param {Object} event the Mouse Event
         */

    }, {
        key: '_mouseup',
        value: function _mouseup(event) {
            console.log(event, event.clientX, event.clientY, this._mouseStartX, event.clientX - this._mouseStartX > 2, this.mouseStartY, event.clientY - this._mouseStartY > 2);
            if (event.clientX - this._mouseStartX > 2 || event.clientY - this._mouseStartY > 2) {
                console.log("Translate");
                this.xDelta = this.xDelta + (event.clientX - this._mouseStartX) / this.scale; //TODO Fix bug with zoom translate
                this.yDelta = this.yDelta + (event.clientY - this._mouseStartY) / this.scale;
            } else {
                console.log("Zoom to mouse");
                this.xDelta = this.xDelta + (this.width / 2 - event.clientX) / this.scale;
                this.yDelta = this.yDelta + (this.height / 2 - event.clientY) / this.scale;
                this.scale = this.scale * 2;
            }
            this.render();
        }
    }]);

    return Mandelbrot;
}();

exports.default = Mandelbrot;

},{"canvas-2d-framework":1,"synthetic-webworker":5}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = init;

var _canvas2dFramework = require("canvas-2d-framework");

var _canvas2dFramework2 = _interopRequireDefault(_canvas2dFramework);

var _Fractal = require("./Fractal.js");

var _Fractal2 = _interopRequireDefault(_Fractal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(canvasID) {
	//Canvas
	var canvas2D = new _canvas2dFramework2.default({
		containerStyle: {
			margin: "0%",
			width: "100vw",
			height: "calc(100vh - 2px)",
			position: "relative"
		},
		canvasStyle: {
			margin: "0%",
			width: "100vw",
			height: "calc(100vh - 5px)",
			position: "relative"
		}
	});

	window.onload = function () {
		var mandlBtn = document.getElementById("Mandelbrot");
		var juliaBtn = document.getElementById("Julia");
		var fractal = new _Fractal2.default(canvas2D);

		// fractal.type = fractal.types.julia;
		// fractal.c = {R:0.285, i:0.01}

		fractal.render();
		var last = 0;
		var cb = function cb() {
			if (new Date().getTime() - last > 1000) {
				last = new Date().getTime();fractal.render();
			}
		};
		canvas2D.resizeCB = cb;
		//TODO Work on allowing deconstruction
		// if(mandlBtn)
		// 	mandlBtn.onclick = ()=>{
		// 		fractal = new Fractal(canvas2D);
		// 		fractal.type = fractal.types.mandelbrot;
		// 		fractal.render();
		// 	}
		// if(juliaBtn)
		// 	juliaBtn.onclick = ()=>{
		// 		fractal = new Fractal(canvas2D);
		// 		fractal.type = fractal.types.julia;
		// 		fractal.render();
		// 	}
	};
};

},{"./Fractal.js":2,"canvas-2d-framework":1}],4:[function(require,module,exports){
"use strict";

var _index = require("./fractal-js/index.js");

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _index2.default)();

},{"./fractal-js/index.js":3}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Synthetic Worker Class
 * 
 * Alows a worker to be made without an external file.
 * 
 * workfunc is the body of the onmessage listener in the worker
 * onMsg is the parents listener for postedMessages from your workfunc
 * 
 * please terminate the worker when it finishes.
 * 
 * @author  James Wake (SparkX120)
 * @version 0.0.5 (2017/12)
 * @license MIT
 */
var SyntheticWorker = function () {
    function SyntheticWorker(workerfunc, onMsg) {
        _classCallCheck(this, SyntheticWorker);

        var funcStr = workerfunc.toString();

        if (funcStr.indexOf("function") == 0) {
            //Fix for next Fix for when Compiled
            funcStr = funcStr.replace("function", "");
        }
        if (funcStr.indexOf("prototype.") >= 0) {
            //Fix for IE when not Compiled
            funcStr = funcStr.replace("prototype.", "");
        }
        // Make a worker from an anonymous function body that instantiates the workerFunction as an onmessage callback
        var blob = new Blob(['(function(global) { global.addEventListener(\'message\', function(e) {', 'var cb = function ', funcStr, ';', 'cb(e)', '}, false); } )(this)'], { type: 'application/javascript' });
        this.blobURL = URL.createObjectURL(blob); //Generate the Blob URL

        this.worker = new Worker(this.blobURL);
        // Cleanup
        this.worker.onmessage = function (e) {
            if (e.data.term) worker.terminate();else if (onMsg) onMsg(e);
        };
    }

    _createClass(SyntheticWorker, [{
        key: "terminate",
        value: function terminate() {
            if (this.worker) {
                this.worker.terminate();
                URL.revokeObjectURL(this.blobURL);
            }
        }
    }, {
        key: "postMessage",
        value: function postMessage(msg) {
            if (this.worker) this.worker.postMessage(msg);
        }
    }]);

    return SyntheticWorker;
}();

exports.default = SyntheticWorker;

},{}]},{},[4]);
