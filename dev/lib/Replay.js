const fs = require("fs");
const File = require("./File");

class Replay {
    constructor(path) {
        this._file = new File(path);
    }

    close() {
        return this._file.close();
    }

    meta(meta) {
        this._file.write("m" + meta + "\n");
    }

    handicap(frame) {
        this._file.write("h" + frame + "\n");
    }

    frame(frame) {
        this._file.write("f" + frame + "\n");
    }

    combo(frame) {
        this._file.write("c" + frame + "\n");
    }
}

class ReadReplay {
    constructor(path) {
        this._fd = new Promise((resolve, reject)=>{
            fs.open(path,"r",(err, fd)=>{
                if(err)
                    return reject(err);
                resolve(fd);
            });
        });
    }
}

module.exports = Replay;
