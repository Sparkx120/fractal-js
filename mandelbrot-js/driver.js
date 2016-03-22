(function(){
	//Canvas
	window.canvas2D = new Canvas2D();

	//Wait for Window load to build system
	$(window).on("load", ()=>{
		mandelbrot = new Mandelbrot(window.canvas2D);
                mandelbrot.render();
                let last = 0;
                $(window).on('resize', ()=>{if(new Date().getTime()-last > 1000){last=new Date().getTime(); mandelbrot.render();}});
        });
})();