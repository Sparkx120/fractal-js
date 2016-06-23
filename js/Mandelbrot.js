"use strict"
/**
 * Canvas Wrapper object to handle pixel level drawing on the HTML5 Canvas as well as manage the canvas
 * Automatically deploys a canvas to the body
 *
 * (Now in ES6)
 * 
 * @author  James Wake (SparkX120)
 * @version 0.1 (2015/07)
 * @license MIT
 */
class Canvas2D {
	constructor(config) {
		// //Create the Canvas and Deploy it
		this.container = document.createElement('div');
		this.canvas = document.createElement('canvas');
		//this.canvas.style.border      = "1px solid black";
		this.canvas.style.width = "100vw";
		this.canvas.style.height = "100vh";
		this.canvas.style.position = "absolute";
		this.container.style.margin = "0%";
		this.container.style.width = "100vw";
		this.container.style.height = "100vh";
		this.container.style.position = "relative";
		this.context = this.canvas.getContext('2d');
		this.container.appendChild(this.canvas);
		this.supersampling = 1.0;

		if (config && config.supersampling) this.supersampling = config.supersampling;

		document.body.appendChild(this.container);

		//Positioning and Scaling
		this.rect = this.canvas.getBoundingClientRect();
		$(window).on('resize', event => {
			this.rect = this.canvas.getBoundingClientRect();
			this.canvas.width = this.rect.width;
			this.canvas.height = this.rect.height;
			this.width = this.rect.width;
			this.height = this.rect.height;
			this.buffer = this.context.createImageData(this.width * this.supersampling, this.height * this.supersampling);
			if (this.resizeCB) {
				this.resizeCB();
			}
		});
		this.canvas.width = this.rect.width;
		this.canvas.height = this.rect.height;
		this.width = this.rect.width;
		this.height = this.rect.height;
		//Persistant Pixel Image Data Object
		this.pixelImageData = this.context.createImageData(1, 1);
		this.buffer = this.context.createImageData(this.width, this.height);
		// this.pixelData = this.pixelImageData.data
	}

	setSupersampling(supersampling) {
		this.supersampling = supersampling;
		this.rect = this.canvas.getBoundingClientRect();
		this.canvas.width = this.rect.width;
		this.canvas.height = this.rect.height;
		this.width = this.rect.width;
		this.height = this.rect.height;
		this.buffer = this.context.createImageData(this.width * this.supersampling, this.height * this.supersampling);
		return this;
	}

	getWidth() {
		return this.width * this.supersampling;
	}

	getHeight() {
		return this.height * this.supersampling;
	}

	/**
  * Draws a pixel to this Canvas. Note that RGBA are between 0 and 255
  * @param  {{x: Number, y: Number, r: Number, g: Number, b: Number, a: Number}} pixel The Pixel to draw
  */
	drawPixel(pixel) {
		// setTimeout(function(){
		//console.log("this Happened", pixel.r, pixel.g, pixel.b, pixel.a);
		this.pixelImageData.data[0] = pixel.r;
		this.pixelImageData.data[1] = pixel.g;
		this.pixelImageData.data[2] = pixel.b;
		this.pixelImageData.data[3] = pixel.a;
		this.context.putImageData(this.pixelImageData, pixel.x, pixel.y);
		// }.bind(this),0);
	}

	drawBufferedPixel(pixel) {
		var index = 4 * (pixel.x + pixel.y * this.width * this.supersampling) - 4;
		this.buffer.data[index] = pixel.r;
		this.buffer.data[index + 1] = pixel.g;
		this.buffer.data[index + 2] = pixel.b;
		this.buffer.data[index + 3] = pixel.a;
	}

	flushBuffer() {
		if (this.supersampling > 1) this.context.putImageData(this.buffer, 0, 0, 0, 0, this.width, this.height); //TODO Not functional
		else this.context.putImageData(this.buffer, 0, 0);
	}

	clearBuffer() {
		this.buffer = this.context.createImageData(this.width, this.height);
	}

	drawLine(line) {
		this.context.beginPath();
		this.context.moveTo(line.x1, line.y1);
		this.context.lineTo(line.x2, line.y2);
		this.context.stroke();
	}
}
/**
 * Mandelbrot Class to generate and render a Mandelbrot to a Drawable canvas in Javascript
 * Uses my Canvas2D library and ES6.
 * 
 * @author  James Wake (SparkX120)
 * @version 0.1.5 (2016/03)
 * @license MIT
 */

class Mandelbrot {
    /**
     * Constructor for Mandelbrot
     * 
     * @param {Canvas2D} canvas2D
     */
    constructor(canvas2D) {
        this.iterations = 256;
        this.scale = 1.0;
        this.supersampling = 1.0; // Not ready
        this.xDelta = 0;
        this.yDelta = 0;
        this.parallelism = 2;
        this.heightScalar = null;

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

        $(this.canvas2d.canvas).on('mousedown', event => this._mousedown(event));
        $(this.canvas2d.canvas).on('mouseup', event => this._mouseup(event));
    }

    /**
     * Public render method.
     * Call this to render the mandelbrot to the canvas
     */
    render() {
        if (this.width != this.canvas2d.getWidth() || this.height != this.canvas2d.getHeight()) {
            this.width = this.canvas2d.getWidth();
            this.height = this.canvas2d.getHeight();
        }

        let rConfig = {
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
    _renderWorkers(rConfig) {
        let workers = this.renderThreads;
        let xSkip = rConfig.xSkip;
        let width = rConfig.width;

        //Kill Previous Render Thread Workers
        while (this.renderThreads.length > 0) {
            this.renderThreads.pop().terminate();
        }

        for (var i = 0; i < xSkip; i++) {
            this.renderThreads[i] = new SyntheticWorker(this._baseRender, e => {
                e.data.line.map((intensity, idx) => {
                    this.canvas2d.drawBufferedPixel(this._pixelShader(e.data.Px, idx, intensity, this.shader));
                });
                this.heightScalar = e.data.heightScalar;
                if (e.data.Px % (width * xSkip / 100) <= 1 || e.data.Px > width - xSkip - 1) this.canvas2d.flushBuffer();
                if (e.data.Px >= width - (xSkip - i)) this.renderThreads[i].terminate();
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
    _renderDirect(rConfig) {
        rConfig.xSkip = 1;
        rConfig.xInit = 0;

        const conf = { data: rConfig };

        let timeout = new Date().getTime();
        this._baseRender(conf, toRender => {
            toRender.line.map((intensity, idx) => {
                this.canvas2d.drawBufferedPixel(this._pixelShader(toRender.Px, idx, intensity, this.shader));
            });
            this.heightScalar = toRender.heightScalar;
            if (new Date().getTime() - timeout > 50) {
                timeout = new Date().getTime();
                setTimeout(() => {
                    this.canvas2d.flushBuffer();
                }, 50);
            }
        });
    }

    /**
     * The Base render loop implementing the Mandelbrot Escape Time algorithm
     * 
     * @private
     * @param {Object} e The Worker like msg object containing an rConfig (Reference render())
     * @param {Function} cb Pass this if not in a worker to get the respnose line
     */
    _baseRender(e, cb) {
        var iterations = e.data.iterations;
        var scale = e.data.scale;
        var width = e.data.width;
        var height = e.data.height;

        var widthScalar = 3.5 / scale; // Always fit width
        var heightScalar = 3.5 * height / width / scale; // scale height

        for (var Px = e.data.xInit; Px < width; Px = Px + e.data.xSkip) {
            //Escape Time Algorithm
            var line = [];
            for (var Py = 0; Py < height; Py++) {
                var Tx = Px - e.data.xDelta * scale; //X-Y Translation
                var Ty = Py - e.data.yDelta * scale;
                var x0 = widthScalar / width * Tx - widthScalar / 1.4; // Scaling and Aspect Correction
                var y0 = heightScalar / height * Ty - heightScalar / 2; //
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
    _pixelShader(Px, Py, intensity, mode) {
        switch (mode) {
            case this.shaderModes["BLUE"]:
                let int1 = intensity * (-1 / 4 * Math.log(-1 / 11.112347 * intensity + 0.09) - 0.25);
                let int2 = intensity * (1 - 2.4 * Math.log(intensity + 0.0000000001));
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
    _mousedown(event) {
        if (event.buttons == 1) {
            //Left Click only
            //console.log(event, event.clientX, event.clientY);
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
    _mouseup(event) {
        //console.log(event, event.clientX, event.clientY);
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
}
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
 * @version 0.1 (2016/03)
 * @license MIT
 */
class SyntheticWorker {
    constructor(workerfunc, onMsg) {

        let funcStr = workerfunc.toString();

        if (funcStr.indexOf("function") == 0) {
            //Fix for next Fix for when Compiled
            funcStr = funcStr.replace("function", "");
        }
        if (funcStr.indexOf("prototype.") >= 0) {
            //Fix for IE when not Compiled
            funcStr = funcStr.replace("prototype.", "");
        }
        // Make a worker from an anonymous function body that instantiates the workerFunction as an onmessage callback
        let blob = new Blob(['(function(global) { global.addEventListener(\'message\', function(e) {', 'var cb = function ', funcStr, ';', 'cb(e)', '}, false); } )(this)'], { type: 'application/javascript' });
        this.blobURL = URL.createObjectURL(blob); //Generate the Blob URL

        this.worker = new Worker(this.blobURL);
        // Cleanup
        this.worker.onmessage = e => {
            if (e.data.term) worker.terminate();else if (onMsg) onMsg(e);
        };
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
            URL.revokeObjectURL(this.blobURL);
        }
    }

    postMessage(msg) {
        if (this.worker) this.worker.postMessage(msg);
    }
}
(function () {
	//Canvas
	window.canvas2D = new Canvas2D();

	//Wait for Window load to build system
	$(window).on("load", () => {
		let mandelbrot = new Mandelbrot(window.canvas2D);
		mandelbrot.render();
		let last = 0;
		let cb = () => {
			if (new Date().getTime() - last > 1000) {
				last = new Date().getTime();mandelbrot.render();
			}
		};
		canvas2D.resizeCB = cb;
	});
})();

