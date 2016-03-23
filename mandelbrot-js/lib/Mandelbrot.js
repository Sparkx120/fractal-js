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
        this.canvas2d      = canvas2D;
        this.iterations    = 256;
        this.scale         = 1.0;
        this.superscaling  = 1.0; //Not Implemented yet
        this.xDelta        = 0;
        this.yDelta        = 0;
        this.cX            = 0;
        this.cY            = 0;
        this.parallelism   = 2;
        this.shaderModes   = {
            "BLUE":0,
            "WHITE":1,
            "HIST":2,
            "INTHIST":3
        };
        this.defaultShader = this.shaderModes["WHITE"];
        this.shader = this.defaultShader
        $(this.canvas2d.canvas).on('click', (event) => this._click(event));
    }
    
    _click(event){
        //console.log(event.clientX, event.clientY);
        this.xDelta = this.xDelta + ((this.width/2)-event.clientX)/this.scale;
        this.yDelta = this.yDelta + ((this.height/2)-event.clientY)/this.scale;
        this.scale = this.scale*2;
        
        console.log(event.clientX, event.clientY, this.cX, this.cY, this.xDelta, this.yDelta, this.scale);
        this.render();
    }
    
    
    render(){
        //Disable Webworkers for now
        
        if(window.Worker){
            this.canvas2d.clearBuffer();
            const scale = this.scale 
            let width   = this.width  = this.canvas2d.width;
            let height  = this.height = this.canvas2d.height;
            this.cX     = this.width/2;
            this.cY     = this.height/2;
            let xDelta  = this.xDelta;
            let yDelta  = this.yDelta;
            let xSkip   = this.parallelism; //For parallelization;
            let workers = [];
            
            for(var i=0; i<xSkip; i++){
                workers[i] = new SyntheticWorker(this._baseRender, (e)=>{
                    
                    e.data.line.map((intensity,idx)=>{
                        //console.log(intensity);
                        this.canvas2d.drawBufferedPixel(this._pixelShader(e.data.Px, idx, intensity, this.shader)); 
                    });
                    if(e.data.Px % (width/100) <= 1 || e.data.Px > width-xSkip-1)
                        this.canvas2d.flushBuffer();
                    if(e.data.Px >= width-(xSkip-i)){
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
        }
        else{
            this.renderDirect();
        }
    }
    
    renderDirect(){
        this.canvas2d.clearBuffer();
        const scale = this.scale 
        let width   = this.width  = this.canvas2d.width;
        let height  = this.height = this.canvas2d.height;
        let xDelta  = this.xDelta;
        let yDelta  = this.yDelta;
        let xSkip   = this.parallelism; //For parallelization;
        
        conf = { data: { //Simulate Worker
            iterations: this.iterations,
            scale: this.scale,
            width: this.width,
            height: this.height,
            xDelta: this.xDelta,
            yDelta: this.yDelta,
            xSkip: 1, //No parallelism for now (will implement with callback structure of some kind maybe)
            xInit: 0
        } };
        
        let timeout = new Date().getTime();
        this._baseRender(conf, (toRender)=>{
            toRender.line.map((intensity,idx)=>{
                this.canvas2d.drawBufferedPixel(this._pixelShader(toRender.Px, idx, intensity, this.shader)); 
            });
            if(new Date().getTime() - timeout > 50){
                timeout = new Date().getTime();
                setTimeout(()=>{
                    this.canvas2d.flushBuffer();
                }, 50);
            }
        });
    }
    
    _baseRender(e, cb){
        var iterations = e.data.iterations;
        var scale  = e.data.scale;
		var width  = e.data.width;
		var height = e.data.height;
        var xDelta = e.data.xDelta;
        var yDelta = e.data.yDelta;
        var xSkip  = e.data.xSkip;
        var xInit  = e.data.xInit;
        
        //const aspect   = width/height;               //Unused for now
        var widthScalar  = 3.5;                        // Always fit width
        var heightScalar = widthScalar*height/width;   //
        
        widthScalar  = widthScalar / scale; //Consider integration with previous step
        heightScalar = heightScalar / scale;
        for(var Px = xInit; Px < width; Px = Px + xSkip){
            var line = [];
            for(var Py=0; Py<height;Py++) {
                var Tx = Px-(xDelta*scale);
                var Ty = Py-(yDelta*scale);
                var x0 = ((widthScalar/width)*(Tx)) - widthScalar/1.4;  //These need work not generalized yet
                var y0 = ((heightScalar/height)*(Ty)) - heightScalar/2; //
                var x  = 0.0;
                var y  = 0.0;
                var iteration = 0;
                while (x*x + y*y < 4 /* 2*2 */  &&  iteration < iterations) {
                    var xtemp = x*x - y*y + x0;
                    y = 2*x*y + y0;
                    x = xtemp;
                    iteration ++;
                }
                
                const intensity = ((iteration==iterations) ? 0 : iteration)/iterations;
                line.push(intensity);
            }
            if(cb)
                cb({Px:Px,line:line});          // Handler Callback provided don't care
            else
                postMessage({Px:Px,line:line}); // Assume we are in a Worker Thread
        }
    }
    
    _pixelShader(Px,Py,intensity, mode){
        switch(mode){
            case this.shaderModes["BLUE"]: 
                return {x:Px,y:Py,r:255*intensity*0.2,g:255*intensity*0.5,b:255*intensity,a:255};
            case this.shaderModes["WHITE"]:
                return {x:Px,y:Py,r:255*intensity,g:255*intensity,b:255*intensity,a:255};
            case this.shaderModes["HIST"]:
                //TODO
                break;
            case this.shaderModes["INTHIST"]:
                //TODO
                break;
            default:
                return this._pixelShader(Px,Py,intentisty,this.shaderModes["BLUE"]);  
        }
    }
}