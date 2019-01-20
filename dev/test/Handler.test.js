const assert = require("assert");
const Handler = require("../utils/Handler");

describe("Handler", function() {
  describe("sync .next()", function() {
    it("should resolve passed promise with process result", async function() {
      var values = [1,2,3];
      var offset = 10;
      var promises = [];
      var h = new Handler((p)=>{
        if(values.length == 0)
          return null;
        
        var v = values.shift();

        promises.push(
          p.then((res)=>{
            assert.equal(res, v+offset, "Result doesn't match expected behavior");
          })
        );

        return v;
      },(elem)=>{
        return elem + offset;
      });

      await h.done_promise;
      await Promise.all(promises);
    });
  });

  describe("async .next()", function() {
    it("should resolve passed promise with process async result", async function() {
      var values = [1,2,3];
      var offset = 10;
      var promises = [];
      var h = new Handler(async (p)=>{
        if(values.length == 0)
          return null;
        
        var v = values.shift();

        promises.push(
          p.then((res)=>{
            assert.equal(res, v+offset, "Result doesn't match expected behavior");
          })
        );

        return await new Promise((resolve, reject) => {
          setTimeout(()=>{resolve(v);});
        });
      },async (elem)=>{
        return await new Promise((resolve, reject)=>{
          setTimeout(()=>{
            resolve(elem + offset);
          });
        });
      });

      await h.done_promise;
      await Promise.all(promises);
    });
  });
});
