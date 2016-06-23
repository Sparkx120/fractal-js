/**
 * Adapted from my Mandelbrot-JS Project
 * http://sparkx120.github.io/mandelbrot.html
 * https://github.com/Sparkx120/mandelbrot-js
 * 
 * By: James Wake (SparkX120)
 * Copyright (c) 2016 James Wake
 * 
 * MIT
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{   
    const float iterations = 512.0;                             // Iterations to compute over
    const float maxZoom    = 20.0;                              // Max Zoom Time
    float scale  = 0.5*pow(2.0, mod(iGlobalTime, maxZoom));     // Set Scale to 2^time and Loop at MaxZoomTime
    
	float width  = iResolution[0];                              // Width Height
	float height = iResolution[1];                              //
      
    float widthScalar  = 3.5/scale;                             // Always fit width
    float heightScalar = 3.5*height/width/scale;                // scale height
        
    float Px = fragCoord.x;                                     // Set Pixel Position
    float Py = fragCoord.y;                                     //
    
    vec2 offset   = vec2(0.0, 0.0);                             //Hacky solution for multiple coordinates
    float modTime = mod(iGlobalTime/maxZoom, 3.0);
    if(modTime >= 0.0 && modTime < 1.0){
      offset = vec2(21.30899, -5.33795);                        // Coordinate 1
    }
    if(modTime >= 1.0 && modTime < 2.0){
      offset = vec2(5.39307,-41.7374);                          // Coordinate 2
    }
    if(modTime >= 2.0 && modTime < 3.0){
      offset = vec2(48.895,0.0);                                // Coordinate 3
    }
    
    float xDelta = iResolution.x/100.0*offset.x;                // Mandelbrot space offset
    float yDelta = iResolution.y/100.0*offset.y;                //
    
    float Tx = Px-xDelta*scale;                                 // X-Y Translation
    float Ty = Py-yDelta*scale;
    float x0 = widthScalar/width*Tx - widthScalar/1.4;          // Scaling and Aspect Correction
    float y0 = heightScalar/height*Ty - heightScalar/2.0;       //
    float x  = 0.0;
	float y  = 0.0;
    
    float iteration = iterations;
    int end = 0;
    
    for (float i=0.0; i < iterations; i++) {                    // Escape Time Computation
        float xtemp = x*x-y*y+x0;
        y = 2.0*x*y+y0;
        x = xtemp;
        if(x*x+y*y > 4.0){
            iteration = i;
            break;
        }
    }
    
    float intensity = iteration == iterations ? 0.0 : iteration/iterations;
    
    // Custom Color Shader based on log functions
    float redGreen = intensity*((-1.0/4.0)*log((-1.0/11.112347)*intensity+0.09)-0.25);
    float blue = (intensity*(1.0-2.4*log(intensity+0.0000000001)));
    
	fragColor = vec4(redGreen,redGreen, blue, 1.0);
}