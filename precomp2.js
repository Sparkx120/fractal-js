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
        this.xDelta = 0; //Alignment is bad with scaling need to do position transform first
        this.yDelta = 0; //
        this.cX = 0;
        this.cY = 0;
        $(this.canvas2d.canvas).on('click', event => this.click(event));
    }

    click(event) {
        console.log(event.clientX, event.clientY);
        this.xDelta = this.cX - event.clientX;
        this.yDelta = this.cY - event.clientY;
        this.scale *= 2;
        console.log(event.clientX, event.clientY, this.cX, this.cY);
        this.render();
    }

    render() {
        //Put this in a WebWorker
        this.canvas2d.clearBuffer();
        if (this.cX == 0 || this.cY == 0) {
            this.cX = this.width / 2;
            this.cY = this.height / 2;
        }
        const scale = this.scale;
        let width = this.width = this.canvas2d.width;
        let height = this.height = this.canvas2d.height;
        let cX = this.cX = this.cX - this.xDelta / scale;
        let cY = this.cY = this.cY - this.yDelta / scale;
        this.xDelta = 0;
        this.yDelta = 0;

        //const aspect   = width/height;               //Unused for now
        let widthScalar = 3.5; // Always fit width
        let heightScalar = widthScalar * height / width; //

        widthScalar = widthScalar / this.scale; //Consider integration with previous step
        heightScalar = heightScalar / this.scale;

        setTimeout(() => {
            let Px = 0;
            let loop = setInterval(() => {
                for (let Py = 0; Py < height; Py++) {
                    let Tx = Px * scale + cX * scale;
                    let Ty = Py * scale + cY * scale;
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
                    const intensity = iteration == 255 ? 0 : iteration;

                    this.canvas2d.drawBufferedPixel({ x: Px, y: Py, r: 0, g: intensity * 0.3, b: intensity, a: 255 });
                }
                this.canvas2d.flushBuffer();
                Px += 1;
                if (Px >= width) {
                    clearInterval(loop);
                }
            }, 0);
        }, 10);
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

