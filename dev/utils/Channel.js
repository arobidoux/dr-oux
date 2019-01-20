const Handler = require("./Handler");

class Channel {    
    constructor(concurent, process) {
        this._backlog = [];
        this._done = false;
        this._awaiting_cb = [];

        this._pool = Handler.processWithPool(
            (s,f)=>{ return this._next(s,f); },
            process,
            concurent
        );

        this._pool.then(()=>{
            Channel.DEBUG && console.log("[Channel-DEBUG] _pool completed");
        });
    }

    /**
     * Returns the next element to be processed, or a promise that will
     * resolved as soon as it is available
     */
    async _next(promise) {
        Channel.DEBUG && console.log("[Channel-DEBUG].next() entering");
        if(this._backlog.length) {
            var backlog = this._backlog.shift();
            
            promise.then(backlog.resolve, backlog.reject);
            Channel.DEBUG && console.log("[Channel-DEBUG].next() from backlog");
            return backlog.elem;
        }
        
        if(this._done) {
            Channel.DEBUG && console.log("[Channel-DEBUG].next() done - returning null");
            return null;
        }

        Channel.DEBUG && console.log("[Channel-DEBUG].next() adding to awaiting_cb");
        return await new Promise((resolve, reject)=>{
            this._awaiting_cb.push({
                promise:promise,
                process:resolve
            });
        });
    }

    /**
     * add another element to the pool of element to be processed, sending it to
     * any available worker
     * Return a promise that will resolve with the process result
     */
    async push(elem) {
        if(this._done) {
            throw new error("Cannot push to closed channel");
        }

        Channel.DEBUG && console.log("[Channel-DEBUG].push() entering");
        if( this._awaiting_cb.length ) {
            Channel.DEBUG && console.log("[Channel-DEBUG].push() sending to awaiting_cb");
            var cb = this._awaiting_cb.shift();
            cb.process(elem);
            return await cb.promise;
        }
        else {
            Channel.DEBUG && console.log("[Channel-DEBUG].push() adding to backlog");
            return await new Promise((resolve, reject)=>{
                this._backlog.push({
                    elem:elem,
                    resolve:resolve,
                    reject:reject
                });
            });
        }
    }


    /**
     * Indicate to the pending workers that everything is fine now and that they can quit
     */
    done() {
        this._done = true;

        Channel.DEBUG && console.log("[Channel-DEBUG].done() entering");
        if( this._backlog.length && this._awaiting_cb.length ) {
            console.error("Clearing awaiting cb when there's still backlog to be cleared");
        }
        for(var i=0;i<this._awaiting_cb.length; i++) {
            this._awaiting_cb[i].process(null);
        }

        Channel.DEBUG && console.log("[Channel-DEBUG].done() returning _pool promise");
        return this._pool;
    }
}

Channel.DEBUG = false;

module.exports = Channel;
