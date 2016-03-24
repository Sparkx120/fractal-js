(function(){
	//Canvas
	window.canvas2D = new Canvas2D();

	//Wait for Window load to build system
	$(window).on("load", ()=>{
		let mandelbrot = new Mandelbrot(window.canvas2D);
                mandelbrot.render();
                let last = 0;
		let cb = ()=>{if(new Date().getTime()-last > 1000){last=new Date().getTime(); mandelbrot.render();}};
		canvas2D.resizeCB = cb;
        });
})();