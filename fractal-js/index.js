import Canvas2D from "canvas-2d-framework";
import Fractal from "./Fractal.js";

export default function init(canvasID){
	//Canvas
	const canvas2D = new Canvas2D();

	

	window.onload = ()=>{
		const mandlBtn = document.getElementById("Mandelbrot");
		const juliaBtn = document.getElementById("Julia");
		let fractal = new Fractal(canvas2D);
		fractal.render();
		let last = 0;
		let cb = ()=>{if(new Date().getTime()-last > 1000){last=new Date().getTime(); fractal.render();}};
		canvas2D.resizeCB = cb;
		//TODO Work on allowing deconstruction
		// if(mandlBtn)
		// 	mandlBtn.onclick = ()=>{
		// 		fractal = new Fractal(canvas2D);
		// 		fractal.type = fractal.types.mandelbrot;
		// 		fractal.render();
		// 	}
		// if(juliaBtn)
		// 	juliaBtn.onclick = ()=>{
		// 		fractal = new Fractal(canvas2D);
		// 		fractal.type = fractal.types.julia;
		// 		fractal.render();
		// 	}
	}
};