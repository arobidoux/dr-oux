
const fs = require("fs");

class File {
    constructor(path) {
        this._path = path;
        this._state = File.OPENING;

        this._close_promise = null;
        this._close_resolve = null;
        this._close_reject = null;

        this._operations = 0;
        this._fd = new Promise((resolve, reject)=>{
            fs.open(path, "w", (err,fd)=>{
                if(err) {
                    this._state = File.ERROR;
                    reject(err);
                }
                else {
                    this._state = File.OPENED;
                    resolve(fd);
                }
            });
        });
    }

    write(data) {
        if(this._state > 0) {
            this._operations++;
            this._fd.then((fd)=>{
                fs.write(fd, data,(err)=>{
                    if(err) {
                        this._state = File.ERROR;
                    }
                    if(--this._operations === 0 && this._state == File.CLOSING) {
                        this._close();
                    }
                });
            });
        }
    }

    close() {
        if(!this._close_promise)
            this._close_promise = new Promise((resolve, reject)=>{
                this._close_resolve = resolve;
                this._close_reject = reject;

                if(this._state > 0) {
                    this._state = File.CLOSING;
                    
                    if(this._operations === 0) {
                        this._close();
                    }
                }
            });
        return this._close_promise;
    }

    _close() {
        if(this._state == File.CLOSING)
            this._fd.then((fd)=>{
                fs.close(fd,(err)=>{
                    if(err) {
                        this._state = File.ERROR;
                        console.error(err);
                        this._close_reject(err)
                    }
                    else {
                        this._state = File.CLOSED;
                        this._close_resolve();
                    }
                });
            });
    }
}

File.ERROR = -1;
File.CLOSED = 0;
File.OPENING = 1;
File.OPENED = 2;
File.CLOSING = 3;

module.exports = File;