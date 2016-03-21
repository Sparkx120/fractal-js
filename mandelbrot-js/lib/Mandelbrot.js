/**
 * Mandelbrot Class to generate and render a Mandelbrot to a Drawable canvas in Javascript
 * Uses my Canvas2D library and ES6.
 * 
 * @author  James Wake (SparkX120)
 * @version 0.1 (2016/03)
 * @license MIT
 */

class Mandelbrot {
    constructor(canvas2D){
        this.canvas2d   = canvas2D;
        this.iterations  = 255;
        this.scale       = 1.0;
        this.xDelta      = 0; //Alignment is bad with scaling need to do position transform first
        this.yDelta      = 0; //
    }
    
    render(){
        this.canvas2d.clearBuffer();
		let width        = this.width  = this.canvas2d.width;
		let height       = this.height = this.canvas2d.height;
        let xDelta       = this.xDelta;
        let yDelta       = this.yDelta;
        
        let scale        = this.scale
        
        let widthScalar  = 3.5; //Need to modify this to be dynamic and not cause stretching
        let heightScalar = 2;   //
        
        widthScalar  = widthScalar / this.scale;
        heightScalar = heightScalar / this.scale;
        
        for(let Px=0; Px<width; Px++){
            for(let Py=0; Py<height;Py++) {
                let x0 = ((widthScalar/width)*(Px+xDelta)) - widthScalar/1.4;  //These need work not generalized yet
                let y0 = ((heightScalar/height)*(Py+yDelta)) - heightScalar/2; //
                let x  = 0.0;
                let y  = 0.0;
                let iteration = 0;
                while (x*x + y*y < 4 /* 2*2 */  &&  iteration < this.iterations) {
                    let xtemp = x*x - y*y + x0;
                    y = 2*x*y + y0;
                    x = xtemp;
                    iteration ++;
                }
                //color = palette[iteration] //Implement Histogram based color
                const intensity = (iteration==255) ? 0 : iteration;
                
                this.canvas2d.drawPixel({x:Px,y:Py,r:0,g:intensity*0.3,b:intensity,a:255});
            }
        };        
    }
}