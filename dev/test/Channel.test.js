const assert = require("assert");
const Channel = require("../utils/Channel");

describe("Channel", function() {
  describe("async process .push()", function() {
    it("should resolve passed promise with process result", async function() {
      const offset = 5;
      var values = [1,2,3];
      var syncValues = [4,5,6];
      //Channel.DEBUG = true;

      var channel = new Channel(1,async (v)=>{
        return await new Promise((resolve, reject)=>{
          setTimeout(()=>{
            resolve(v+offset);
          });
        });
      });

      var promises = [];

      while(values.length) {
        ((v)=>{
          promises.push(
            channel.push(v).then((r)=>{
              assert.equal(r, v+offset,"Math is broken");
            })
          );
        })(values.shift());
      }

      await Promise.all(promises);
      
      while(syncValues.length) {
        var v = syncValues.shift()
        
        var r = await channel.push(v);
        assert.equal(r, v+offset,"Math is broken");
      }
      
      await channel.done();
    });
  });

});
