if(typeof(Worker) !== "undefined") {
    onmessage = function(e) {
        console.log('Worker Started');
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
                
                const intensity = ((iteration==255) ? 0 : iteration)/255;
                line.push(intensity);
            }
            postMessage({Px:Px,line:line});
        }
    }
} else {
    // Sorry! No Web Worker support..
}