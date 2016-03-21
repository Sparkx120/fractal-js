(function(){
	//Canvas
	window.canvas2D = new Canvas2D();

	//Wait for Window load to build system
	$(window).on("load", ()=>{
		mandelbrot = new Mandelbrot(window.canvas2D);
        setTimeout(()=>{
            console.log("Wahoo");
            mandelbrot.render();
        }, 10);
		$(window).on('resize', ()=>{mandelbrot.render();});
	});
})();