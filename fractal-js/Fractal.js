import SyntheticWorker from "synthetic-webworker";
import Canvas2D from 'canvas-2d-framework';

/**
 * Mandelbrot Class to generate and render a Mandelbrot to a Drawable canvas in Javascript
 * Uses my Canvas2D library and ES6.
 * 
 * @author  James Wake (SparkX120)
 * @version 0.2.0 (2017/12)
 * @license MIT
 */

export default class Mandelbrot {
	/**
	 * Constructor for Mandelbrot
	 * 
	 * @param {Canvas2D} canvas2D
	 */
    constructor(canvas2D){

        this.initDefaults();

        this.types         = {
            mandelbrot: 'Mandelbrot',
            julia:      'Julia'
        }

        this.type = this.types.mandelbrot;

        this.z = {
            //TODO
        }

        this.canvas2d      = canvas2D.setSupersampling(this.supersampling);

        this.shaderModes   = {
            "BLUE":0,
            "WHITE":1,
            "HIST":2,
            "INTHIST":3
        };
        this.defaultShader = this.shaderModes["BLUE"];
        this.shader = this.defaultShader;
        
        this.renderParallel = true;
        this.renderTerm = false; //Terminate Rendering Early
        
        this.renderThreads = [];
        
        this.drawControls();
        
        //TODO Switch to non jquery listeners
        this.canvas2d.canvas.addEventListener('mousedown', (event) => this._mousedown(event), false);
        this.canvas2d.canvas.addEventListener('mouseup', (event) => this._mouseup(event), false);
        //$(this.canvas2d.canvas).on('mousedown' , (event) => this._mousedown(event));
		//$(this.canvas2d.canvas).on('mouseup'   , (event) => this._mouseup(event));
    }

    initDefaults(){
        this.iterations    = 256;
        this.scale         = 0.5;
        this.supersampling = 1.0; //Need to adapt screen click coordinates still
        this.xDelta        = 0;
        this.yDelta        = 0;
        this.parallelism   = 2;
        this.heightScalar  = null;
        
        this.c = {
            R: 0,
            i: 0.8
        };
    }

    switchFractal(){
        switch(this.type){
            case this.types.mandelbrot:
                this.type = this.types.julia;
                this.fractalBtn.innerHTML = "Mandelbrot"
                this.initDefaults();
                break;
            case this.types.julia:
                this.type = this.types.mandelbrot;
                this.fractalBtn.innerHTML = "Julia"
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
	drawControls(){
		this.controlContainer = document.createElement("div");
		this.controlContainer.style.position = "absolute";
		this.controlContainer.style.right = "0";
		this.controlContainer.style.top = "0";
		this.controlContainer.style.zindex = "100"

		this.fractalBtn = document.createElement("button");
		this.fractalBtn.innerHTML = "Julia"
		this.fractalBtn.onclick = ()=>this.switchFractal();
		this.controlContainer.appendChild(this.fractalBtn);

		if(this.canvas2d.container){
			this.canvas2d.container.appendChild(this.controlContainer);
		}
	}
    
	/**
	 * Public render method.
	 * Call this to render the mandelbrot to the canvas
	 */
    render(){
		if(this.width != this.canvas2d.getWidth() || this.height != this.canvas2d.getHeight()){
			this.width  = this.canvas2d.getWidth();
        	this.height = this.canvas2d.getHeight();
		}
        
        let rConfig = {
            type:           this.type,
            types:          this.types,
            c:              this.c,
			heightScalar:   this.heightScalar,
            iterations:     this.iterations,
            scale:          this.scale,
            width:          this.width,
            height:         this.height,
            xDelta:         this.xDelta,
            yDelta:         this.yDelta,
            xSkip:          this.parallelism
        }
		
		this.canvas2d.clearBuffer();
        
        if(window.Worker && this.renderParallel){
            this._renderWorkers(rConfig);
        }
        else{
            this._renderDirect(rConfig);
        }
    }
    
	/**
	 * Private render worker based method. Used if Mandelbrot.renderParallel is true and Workers are available
	 * 
	 * @private
	 * @param {Object} rConfig - The Rendering Configuration (Read the render function only place this should be called from)
	 */
    _renderWorkers(rConfig){
        let workers = this.renderThreads;
		let xSkip = rConfig.xSkip;
		let width = rConfig.width;
		
		//Kill Previous Render Thread Workers
		while(this.renderThreads.length > 0){
			this.renderThreads.pop().terminate();
        }
        
        for(var i=0; i<xSkip; i++){
            this.renderThreads[i] = new SyntheticWorker(this._baseRender, (e)=>{
                e.data.line.map((intensity,idx)=>{
                    this.canvas2d.drawBufferedPixel(this._pixelShader(e.data.Px, idx, intensity, this.shader)); 
                });
				this.heightScalar = e.data.heightScalar;
                if(/*e.data.Px % (width*xSkip) <= 1 ||*/ e.data.Px > width-xSkip-1)
                    this.canvas2d.flushBuffer();   
                if(e.data.Px >= width-(xSkip-i))
                    this.renderThreads[i].terminate();
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
    _renderDirect(rConfig){
        rConfig.xSkip = 1;
        rConfig.xInit = 0;
        
        const conf = { data: rConfig };
        let timeout = new Date().getTime();
        this._baseRender(conf, (toRender)=>{
            toRender.line.map((intensity,idx)=>{
                this.canvas2d.drawBufferedPixel(this._pixelShader(toRender.Px, idx, intensity, this.shader)); 
            });
			this.heightScalar = toRender.heightScalar;
            if(new Date().getTime() - timeout > 50){
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
    _baseRender(e, cb){
        var iterations = e.data.iterations;
        var scale  = e.data.scale;
		var width  = e.data.width;
        var height = e.data.height;
        var type   = e.data.type;
        var types  = e.data.types;
        var c      = e.data.c;

        var widthScalar  = 3.5/scale;                // Always fit width
        var heightScalar = (3.5*height/width)/scale; // scale height
        
        switch(type){
            case types.mandelbrot:
                for(var Px = e.data.xInit; Px < width; Px = Px + e.data.xSkip){ //Escape Time Algorithm
                    var line = [];
                    for(var Py=0; Py<height;Py++) {
                        var Tx = Px+(width/2)-(e.data.xDelta*scale); //X-Y Translation
                        var Ty = Py+(height/2)-(e.data.yDelta*scale);
                        var x0 = ((widthScalar/width)*(Tx)) - widthScalar;  // Scaling and Aspect Correction
                        var y0 = ((heightScalar/height)*(Ty)) - heightScalar; //
                        var x  = 0;
                        var y  = 0;
                        var iteration = 0;
                        while (x*x + y*y < 4 /* 2*2 */  &&  iteration < iterations) { //Escape Time Computation
                            var xtemp = x*x - y*y + x0;
                            y = 2*x*y + y0;
                            x = xtemp;
                            iteration ++;
                        }
                        var intensity = ((iteration==iterations) ? 0 : iteration)/iterations;
                        line.push(intensity);
                    }
                    if(cb){ cb({Px:Px,line:line}); }                                  // Handler Callback not in Worker
                    else { postMessage({Px:Px,line:line,heightScalar:heightScalar});} // Assume we are in a Worker Thread 
                }
                break;
            case types.julia:
                for(var Px = e.data.xInit; Px < width; Px = Px + e.data.xSkip){ //Escape Time Algorithm
                    var line = [];
                    for(var Py=0; Py<height;Py++) {
                        var Tx = Px-(e.data.xDelta*scale); //X-Y Translation
                        var Ty = Py-(e.data.yDelta*scale);
                        var x0 = ((widthScalar/width)*(Tx)) - widthScalar/1.4;  // Scaling and Aspect Correction
                        var y0 = ((heightScalar/height)*(Ty)) - heightScalar/2; //
                        var iteration = 0;
                        // var x  = 0;
                        // var y  = 0;
                        while (x0*x0 + y0*y0 < 4 /* 2*2 */  &&  iteration < iterations) { //Escape Time Computation
                            var xtemp = x0*x0 - y0*y0;
                            y0 = 2*x0*y0 + c.i;
                            x0 = xtemp + c.R;
                            iteration ++;
                        }
                        var intensity = ((iteration==iterations) ? 0 : iteration)/iterations;
                        line.push(intensity);
                    }
                    if(cb){ cb({Px:Px,line:line}); }                                  // Handler Callback not in Worker
                    else { postMessage({Px:Px,line:line,heightScalar:heightScalar});} // Assume we are in a Worker Thread 
                }
                break;
            default:
                for(var Px = e.data.xInit; Px < width; Px = Px + e.data.xSkip){ //Escape Time Algorithm
                    var line = [];
                    for(var Py=0; Py<height;Py++) {
                        line.push(1);
                    }
                    if(cb){ cb({Px:Px,line:line}); }                                  // Handler Callback not in Worker
                    else { postMessage({Px:Px,line:line,heightScalar:heightScalar});} // Assume we are in a Worker Thread 
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
    _pixelShader(Px,Py,intensity, mode){
        switch(mode){
            case this.shaderModes["BLUE"]:
                let int1 = intensity*((-1/4)*Math.log((-1/11.112347)*intensity+0.09)-0.25);
                let int2 = (intensity*(1-2.4*Math.log(intensity+0.0000000001)));
                return {x:Px,y:Py,r:255*int1,g:255*int1,b:255*int2,a:255};
            case this.shaderModes["WHITE"]:
                return {x:Px,y:Py,r:255*intensity,g:255*intensity,b:255*intensity,a:255};
            case this.shaderModes["HIST"]:
                //TODO
                break;
            case this.shaderModes["INTHIST"]:
                //TODO
                break;
            default:
                return this._pixelShader(Px,Py,intentisty,this.defaultShader);  
        }
    }
    
	/**
	 * Mouse down event handler for the Mandelbrot canvas.
	 * 
	 * @private
	 * @param {Object} event the Mouse Event
	 */
    _mousedown(event){
		if(event.buttons == 1){ //Left Click only
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
	_mouseup(event){
		console.log(event, event.clientX, event.clientY, this._mouseStartX, event.clientX - this._mouseStartX > 2, this.mouseStartY, event.clientY - this._mouseStartY > 2);
		if(event.clientX - this._mouseStartX > 2 || event.clientY - this._mouseStartY > 2){
			console.log("Translate");
			this.xDelta = this.xDelta + (event.clientX - this._mouseStartX)/this.scale; //TODO Fix bug with zoom translate
			this.yDelta = this.yDelta + (event.clientY - this._mouseStartY)/this.scale;
		} else {
			console.log("Zoom to mouse");
			this.xDelta = this.xDelta + ((this.width/2)-event.clientX)/this.scale;
			this.yDelta = this.yDelta + ((this.height/2)-event.clientY)/this.scale;
			this.scale = this.scale*2;
		}
		this.render();
    }
}