import Canvas2D from "canvas-2d-framework";
import Mandelbrot from "./Mandelbrot.js";

export default function init(canvasID){
	//Canvas
	const canvas2D = new Canvas2D();

	window.onload = ()=>{
		let mandelbrot = new Mandelbrot(canvas2D);
		mandelbrot.render();
		let last = 0;
		let cb = ()=>{if(new Date().getTime()-last > 1000){last=new Date().getTime(); mandelbrot.render();}};
		canvas2D.resizeCB = cb;
	}
};