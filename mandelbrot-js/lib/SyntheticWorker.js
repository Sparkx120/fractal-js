/**
 * Synthetic Worker Class
 * 
 * Alows a worker to be made without an external file.
 * 
 * workfunc is the body of the onmessage listener in the worker
 * onMsg is the parents listener for postedMessages from your workfunc
 * 
 * please terminate the worker when it finishes.
 * 
 * @author  James Wake (SparkX120)
 * @version 0.1 (2016/03)
 * @license MIT
 */
class SyntheticWorker{
    constructor(workerfunc, onMsg){
		
		let funcStr = workerfunc.toString();
		
		if(funcStr.indexOf("function") == 0){   //Fix for next Fix for when Compiled
			funcStr = funcStr.replace("function", "");
		}
		if(funcStr.indexOf("prototype.") >= 0){ //Fix for IE when not Compiled
			funcStr = funcStr.replace("prototype.", "");
		}
        // Make a worker from an anonymous function body that instantiates the workerFunction as an onmessage callback
        let blob = new Blob([
        '(function(global) { global.addEventListener(\'message\', function(e) {',
            'var cb = function ', funcStr, ';',
            'cb(e)',
        '}, false); } )(this)' ], { type: 'application/javascript' } );
        this.blobURL = URL.createObjectURL( blob ); //Generate the Blob URL
        
        this.worker = new Worker( this.blobURL );
        // Cleanup
        this.worker.onmessage = (e)=>{if(e.data.term) worker.terminate(); else if(onMsg) onMsg(e);};
    }
    
    terminate(){
        if(this.worker){
            this.worker.terminate();
            URL.revokeObjectURL( this.blobURL );
        }
    }
    
    postMessage(msg){
        if(this.worker)
            this.worker.postMessage(msg);
    }
}