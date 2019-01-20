module.exports = class Handler {
    static processWithPool(next, process, concurent) {
        var workerCount = concurent || 1;
        var workers = [];
        for( var i=0; i<workerCount; i++) {
            var h = new Handler(next, process);
            workers.push(h.done_promise);
        }

        return Promise.all(workers);
    }
    
    constructor(next, process) {
        this._next = next;
        this._process = process;
        this._done_count = 0;

        this.done_promise = new Promise((resolve, reject)=>{
            this._resolve = resolve;
            this._reject = reject;
            this._processNext();
        });
    }

    async _processNext() {  
        var p = new Promise((resolve, reject)=>{
            this._current_resolve = resolve;
            this._current_reject = reject;
        });

        // prep call next on next iteration
        p.then(()=>{ this._processNext(); });

        var elem = await this._next(p);
        
        if(elem == null) {
            this._resolve(this._done_count);
            return;
        }

        var result = null;
        try {
            result = await this._process(elem);
            this._done_count++;
        } catch(e) {
            // manually queue the next execution
            setTimeout(()=>{ this._processNext(); });
            return this._current_reject(e);
        }

        this._current_resolve(result);
    }
}