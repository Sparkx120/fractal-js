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
	constructor() {
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
		document.body.appendChild(this.container);

		//Positioning and Scaling
		this.rect = this.canvas.getBoundingClientRect();
		$(window).on('resize', event => {
			this.rect = this.canvas.getBoundingClientRect();
			this.canvas.width = this.rect.width;
			this.canvas.height = this.rect.height;
			this.width = this.rect.width;
			this.height = this.rect.height;
			this.buffer = this.context.createImageData(this.width, this.height);
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
		var index = 4 * (pixel.x + pixel.y * this.width) - 4;
		this.buffer.data[index] = pixel.r;
		this.buffer.data[index + 1] = pixel.g;
		this.buffer.data[index + 2] = pixel.b;
		this.buffer.data[index + 3] = pixel.a;
	}

	flushBuffer() {
		this.context.putImageData(this.buffer, 0, 0);
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
 * @version 0.1 (2016/03)
 * @license MIT
 */

class Mandelbrot {
    constructor(canvas2D) {
        this.canvas2d = canvas2D;
        this.iterations = 255;
        this.scale = 1.0;
        this.xDelta = 0;
        this.yDelta = 0;
        this.cX = 0;
        this.cY = 0;
        this.parallelism = 2;
        this.shaderModes = {
            "BLUE": 0,
            "WHITE": 1,
            "HIST": 2,
            "INTHIST": 3
        };
        this.defaultShader = this.shaderModes["WHITE"];
        this.shader = this.defaultShader;
        $(this.canvas2d.canvas).on('click', event => this._click(event));
    }

    _click(event) {
        //console.log(event.clientX, event.clientY);
        this.xDelta = this.xDelta + (this.width / 2 - event.clientX) / this.scale;
        this.yDelta = this.yDelta + (this.height / 2 - event.clientY) / this.scale;
        this.scale = this.scale * 2;

        console.log(event.clientX, event.clientY, this.cX, this.cY, this.xDelta, this.yDelta, this.scale);
        this.render();
    }

    render() {
        //Disable Webworkers for now

        if (window.Worker) {
            this.canvas2d.clearBuffer();
            const scale = this.scale;
            let width = this.width = this.canvas2d.width;
            let height = this.height = this.canvas2d.height;
            this.cX = this.width / 2;
            this.cY = this.height / 2;
            let xDelta = this.xDelta;
            let yDelta = this.yDelta;
            let xSkip = this.parallelism; //For parallelization;
            let workers = [];

            // for(var i=0; i<xSkip; i++){
            //     workers[i] = new Worker('./js/mandelbrot-worker.js');
            //     workers[i].postMessage({
            //         iterations: this.iterations,
            //         scale: scale,
            //         width: width,
            //         height: height,
            //         xDelta: xDelta,
            //         yDelta: yDelta,
            //         xSkip: xSkip,
            //         xInit: i
            //     });
            //     workers[i].onmessage = (e)=>{
            //         e.data.line.map((intensity,idx)=>{
            //             //console.log(intensity);
            //             this.canvas2d.drawBufferedPixel(this._pixelShader(e.data.Px, idx, intensity, this.shader));
            //         });
            //         this.canvas2d.flushBuffer();
            //         if(e.data.Px >= width-(xSkip-i)){
            //             workers[i].terminate();
            //         }
            //     }
            // }

            for (var i = 0; i < xSkip; i++) {
                workers[i] = new SyntheticWorker(this._baseRender, e => {

                    e.data.line.map((intensity, idx) => {
                        //console.log(intensity);
                        this.canvas2d.drawBufferedPixel(this._pixelShader(e.data.Px, idx, intensity, this.shader));
                    });
                    if (e.data.Px % (width / 100) <= 1) this.canvas2d.flushBuffer();
                    if (e.data.Px >= width - (xSkip - i)) {
                        workers[i].terminate();
                    }
                });

                workers[i].postMessage({
                    iterations: this.iterations,
                    scale: scale,
                    width: width,
                    height: height,
                    xDelta: xDelta,
                    yDelta: yDelta,
                    xSkip: xSkip,
                    xInit: i
                });
            }
        } else {
            this.renderDirect();
        }
    }

    renderDirect() {
        this.canvas2d.clearBuffer();
        const scale = this.scale;
        let width = this.width = this.canvas2d.width;
        let height = this.height = this.canvas2d.height;
        this.cX = this.width / 2;
        this.cY = this.height / 2;
        let xDelta = this.xDelta;
        let yDelta = this.yDelta;
        let xSkip = this.parallelism; //For parallelization;

        conf = { data: { //Simulate Worker
                iterations: this.iterations,
                scale: this.scale,
                width: this.width,
                height: this.height,
                xDelta: this.xDelta,
                yDelta: this.yDelta,
                xSkip: 1,
                xInit: 0
            } };

        let timeout = new Date().getTime();
        this._baseRender(conf, toRender => {
            toRender.line.map((intensity, idx) => {
                this.canvas2d.drawBufferedPixel(this._pixelShader(toRender.Px, idx, intensity, this.shader));
            });
            if (new Date().getTime() - timeout > 50) {
                timeout = new Date().getTime();
                setTimeout(() => {
                    this.canvas2d.flushBuffer();
                }, 50);
            }
        });

        // setTimeout(()=>{
        //     let Px = 0;
        //     let loop = setInterval(()=>{           
        //         for(let Py=0; Py<height;Py++) {
        //             let Tx = Px-(xDelta*scale);
        //             let Ty = Py-(yDelta*scale);
        //             let x0 = ((widthScalar/width)*(Tx)) - widthScalar/1.4;  //These need work not generalized yet
        //             let y0 = ((heightScalar/height)*(Ty)) - heightScalar/2; //
        //             let x  = 0.0;
        //             let y  = 0.0;
        //             let iteration = 0;
        //             while (x*x + y*y < 4 /* 2*2 */  &&  iteration < this.iterations) {
        //                 let xtemp = x*x - y*y + x0;
        //                 y = 2*x*y + y0;
        //                 x = xtemp;
        //                 iteration ++;
        //             }
        //             //color = palette[iteration] //Implement Histogram based color
        //             const intensity = ((iteration==255) ? 0 : iteration)/255;

        //             //BLUE OPTIMIZED
        //             this.canvas2d.drawBufferedPixel(this._pixelShader(e.data.Px, idx, intensity, this.shader));
        //         }
        //         this.canvas2d.flushBuffer();
        //         Px +=1;
        //         if(Px >= width){
        //             clearInterval(loop);
        //         }
        //     },0);
        // }, 10);
    }

    renderDirectOld() {
        this.canvas2d.clearBuffer();
        const scale = this.scale;
        let width = this.width = this.canvas2d.width;
        let height = this.height = this.canvas2d.height;
        this.cX = this.width / 2;
        this.cY = this.height / 2;
        //Transform from Center
        // if(this.cX == 0 || this.cY == 0){
        //     this.cX = this.width/2;
        //     this.cY = this.height/2;
        // }
        // let cX = this.cX = this.cX-this.xDelta/scale;
        // let cY = this.cY = this.cY-this.yDelta/scale;
        let xDelta = this.xDelta;
        let yDelta = this.yDelta;

        //const aspect   = width/height;               //Unused for now
        let widthScalar = 3.5; // Always fit width
        let heightScalar = widthScalar * height / width; //

        widthScalar = widthScalar / this.scale; //Consider integration with previous step
        heightScalar = heightScalar / this.scale;

        //console.log(this.scale);

        setTimeout(() => {
            let Px = 0;
            let loop = setInterval(() => {
                for (let Py = 0; Py < height; Py++) {
                    let Tx = Px - xDelta * scale;
                    let Ty = Py - yDelta * scale;
                    let x0 = widthScalar / width * Tx - widthScalar / 1.4; //These need work not generalized yet
                    let y0 = heightScalar / height * Ty - heightScalar / 2; //
                    let x = 0.0;
                    let y = 0.0;
                    let iteration = 0;
                    while (x * x + y * y < 4 /* 2*2 */ && iteration < this.iterations) {
                        let xtemp = x * x - y * y + x0;
                        y = 2 * x * y + y0;
                        x = xtemp;
                        iteration++;
                    }
                    //color = palette[iteration] //Implement Histogram based color
                    const intensity = (iteration == 255 ? 0 : iteration) / 255;

                    //BLUE OPTIMIZED
                    this.canvas2d.drawBufferedPixel(this._pixelShader(e.data.Px, idx, intensity, this.shader));
                }
                this.canvas2d.flushBuffer();
                Px += 1;
                if (Px >= width) {
                    clearInterval(loop);
                }
            }, 0);
        }, 10);
    }

    _baseRender(e, cb) {
        var iterations = e.data.iterations;
        var scale = e.data.scale;
        var width = e.data.width;
        var height = e.data.height;
        var xDelta = e.data.xDelta;
        var yDelta = e.data.yDelta;
        var xSkip = e.data.xSkip;
        var xInit = e.data.xInit;

        //const aspect   = width/height;               //Unused for now
        var widthScalar = 3.5; // Always fit width
        var heightScalar = widthScalar * height / width; //

        widthScalar = widthScalar / scale; //Consider integration with previous step
        heightScalar = heightScalar / scale;
        for (var Px = xInit; Px < width; Px = Px + xSkip) {
            var line = [];
            for (var Py = 0; Py < height; Py++) {
                var Tx = Px - xDelta * scale;
                var Ty = Py - yDelta * scale;
                var x0 = widthScalar / width * Tx - widthScalar / 1.4; //These need work not generalized yet
                var y0 = heightScalar / height * Ty - heightScalar / 2; //
                var x = 0.0;
                var y = 0.0;
                var iteration = 0;
                while (x * x + y * y < 4 /* 2*2 */ && iteration < iterations) {
                    var xtemp = x * x - y * y + x0;
                    y = 2 * x * y + y0;
                    x = xtemp;
                    iteration++;
                }

                const intensity = (iteration == 255 ? 0 : iteration) / 255;
                line.push(intensity);
            }
            if (cb) cb({ Px: Px, line: line }); // Handler Callback provided don't care
            else postMessage({ Px: Px, line: line }); // Assume we are in a Worker Thread
        }
    }

    _pixelShader(Px, Py, intensity, mode) {
        switch (mode) {
            case this.shaderModes["BLUE"]:
                return { x: Px, y: Py, r: 255 * intensity * 0.2, g: 255 * intensity * 0.5, b: 255 * intensity, a: 255 };
            case this.shaderModes["WHITE"]:
                return { x: Px, y: Py, r: 255 * intensity, g: 255 * intensity, b: 255 * intensity, a: 255 };
            case this.shaderModes["HIST"]:
                //TODO
                break;
            case this.shaderModes["INTHIST"]:
                //TODO
                break;
            default:
                return this._pixelShader(Px, Py, intentisty, this.shaderModes["BLUE"]);
        }
    }
}
class SyntheticWorker {
    constructor(workerfunc, onMsg) {
        // Make a worker from an anonymous function body that instantiates the workerFunction as an onmessage callback
        let blob = new Blob(['(function(global) { global.addEventListener(\'message\', function(e) {', 'var cb = ', workerfunc.toString(), ';', 'cb(e)', '}, false); } )(this)'], { type: 'application/javascript' });
        this.blobURL = URL.createObjectURL(blob); //Generate the Blob URL

        this.worker = new Worker(this.blobURL);
        // Cleanup
        //
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
		mandelbrot = new Mandelbrot(window.canvas2D);
		mandelbrot.render();
		let last = 0;
		$(window).on('resize', () => {
			if (new Date().getTime() - last > 1000) {
				last = new Date().getTime();mandelbrot.render();
			}
		});
	});
})();

