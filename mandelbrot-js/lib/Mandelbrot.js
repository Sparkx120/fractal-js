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
        this.canvas2d    = canvas2D;
        this.iterations  = 255;
        this.scale       = 1.0;
        this.xDelta      = 0; //Alignment is bad with scaling need to do position transform first
        this.yDelta      = 0; //
        this.cX          = 0;
        this.cY          = 0;
        $(this.canvas2d.canvas).on('click', (event) => this.click(event));
    }
    
    click(event){
        console.log(event.clientX, event.clientY);
        this.xDelta = this.xDelta + ((this.width/2)-event.clientX)/this.scale;
        this.yDelta = this.yDelta + ((this.height/2)-event.clientY)/this.scale;
        this.scale = this.scale*2;
        
        console.log(event.clientX, event.clientY, this.cX, this.cY, this.xDelta, this.yDelta, this.scale);
        this.render();
    }
    
    render(){ //Put this in a WebWorker
        this.canvas2d.clearBuffer();
        const scale      = this.scale 
		let width        = this.width  = this.canvas2d.width;
		let height       = this.height = this.canvas2d.height;
        this.cX = this.width/2;
        this.cY = this.height/2;
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
        let widthScalar  = 3.5;                        // Always fit width
        let heightScalar = widthScalar*height/width;   //
        
        widthScalar  = widthScalar / this.scale; //Consider integration with previous step
        heightScalar = heightScalar / this.scale;
        
        console.log(this.scale);
        
        setTimeout(()=>{
            let Px = 0;
            let loop = setInterval(()=>{            
                for(let Py=0; Py<height;Py++) {
                    let Tx = Px-(xDelta*scale);
                    let Ty = Py-(yDelta*scale);
                    let x0 = ((widthScalar/width)*(Tx)) - widthScalar/1.4;  //These need work not generalized yet
                    let y0 = ((heightScalar/height)*(Ty)) - heightScalar/2; //
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
                    
                    this.canvas2d.drawBufferedPixel({x:Px,y:Py,r:0,g:intensity*0.3,b:intensity,a:255});
                }
                this.canvas2d.flushBuffer();
                Px +=1;
                if(Px >= width){
                    clearInterval(loop);
                }
            },0);
        }, 10);        
    }
}