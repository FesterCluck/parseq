/**
 * A simpler alternative to Step
 * @copyright    (c) 2012 Sutoiku, Inc. All rights reserved.
 * @author       psq@sutoiku.com (Pascal Belloncle)
 * @module       parseq
 */

var debug = require("debug")("parseq");

function par() {
  var seqArgs = arguments;
  var max = seqArgs.length-1;
  var slot = 0;
  var results = [];
  var groups = [];
  var error = null;
  debug("new max1", max);
  for (var i = 0; i < seqArgs.length-1; i++) {
    var done = (function newSlot(value) {
      debug("newSlot", value);
      var done1 = function(err, result) {
        if (arguments.length === 0) {
          // return a new callback
          if (groups[value]) {
            max++;
            debug("new max2", max);
            return newSlot(slot++);
          } else {
            debug("new max4", max);
            groups[value] = true;
            return done1;
          }
        } else {
          // record completion
          debug("complete", value, result);
          results[value] = result;
          if (err) {
            error = err;
          }
          max--;
          debug("new max3", max);
          if (max === 0) {
            seqArgs[seqArgs.length-1](error, results);
          }
        }
      };
      return done1;
    })(slot++);
    var result = seqArgs[i].apply(done, []);
    if (typeof result !== "undefined") {
      done(null, result);
    }
  }
}


function seq() {
  var i = 0;
  var seqArgs = arguments;
  var max = seqArgs.length-1;
  var fn = seqArgs[i];
  var args = [null];
  var next = function(err, value) {
    debug("seq.next", err, value);
    args[0] = err;
    args[1] = value;
    var fn = seqArgs[++i];
    if (!err && (i < max)) {
      debug("seq.apply2", i, max);
      var result = fn.apply(next, args);
      if (typeof result !== "undefined") {
        debug("seq.result", i, result);
        return next(null, result);
      }
    } else {
      // call last function
      debug("seq.apply3", i, max);
      seqArgs[max].apply(next, args);
    }
  };
  
  debug("seq.apply1", i, max);
  var result = fn.apply(next, args);
  if (typeof result !== "undefined") {
    debug("seq.result", i, result);
    next(null, result);
  }
}

function each(arr, cb, done) {
  var max = arr.length;
  var current = 0;
  var results = [];
  var error = null;
  function next() {
    if (current < max) {
      cb(arr[current++], function(err, result) {
        if (err && !error) {
          error = err;
        }
        results.push(result);
        next();
      });
    } else {
      done(error, results);
    }
  }
  next();
}

function ParSeq() {
  this.par = par;
  this.seq = seq;
  this.each = each;
}

ParSeq.par = par;
ParSeq.seq = seq;
ParSeq.each = each;

module.exports = ParSeq;