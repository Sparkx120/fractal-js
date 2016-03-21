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
		$(window).on('resize', function (event) {
			this.rect = this.canvas.getBoundingClientRect();
			this.canvas.width = this.rect.width;
			this.canvas.height = this.rect.height;
			this.width = this.rect.width;
			this.height = this.rect.height;
			this.buffer = this.context.createImageData(this.width, this.height);
		}.bind(this));
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

	drawPixelToBuffer(pixel) {
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
    }

    render() {
        this.canvas2d.clearBuffer();
        let width = this.width = this.canvas2d.width;
        let height = this.height = this.canvas2d.height;
        let xDelta = this.xDelta;
        let yDelta = this.yDelta;

        let scale = this.scale;

        let widthScalar = 3.5; //Need to modify this to be dynamic and not cause stretching
        let heightScalar = 2; //

        widthScalar = widthScalar / this.scale;
        heightScalar = heightScalar / this.scale;

        for (let Px = 0; Px < width; Px++) {
            for (let Py = 0; Py < height; Py++) {
                let x0 = widthScalar / width * (Px + xDelta) - widthScalar / 1.4; //These need work not generalized yet
                let y0 = heightScalar / height * (Py + yDelta) - heightScalar / 2; //
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

                this.canvas2d.drawPixel({ x: Px, y: Py, r: 0, g: intensity * 0.3, b: intensity, a: 255 });
            }
        };
    }
}
(function () {
	//Canvas
	window.canvas2D = new Canvas2D();

	//Wait for Window load to build system
	$(window).on("load", () => {
		mandelbrot = new Mandelbrot(window.canvas2D);
		setTimeout(() => {
			console.log("Wahoo");
			mandelbrot.render();
		}, 10);
		$(window).on('resize', () => {
			mandelbrot.render();
		});
	});
})();

