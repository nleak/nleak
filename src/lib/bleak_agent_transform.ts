

/**
 * Portion of the bleak agent that should be transformed to capture scope information.
 * 
 * Purpose of this function: Override bind so that we properly capture __scope__ here.
 * 
 * What is Function.bind - The bind function provides native support for partial application, 
 * and 'implicitly' retains the arguments passed to it.
 * 
 * Why override - native methods hide state from heap snapshots.
 * 
 * After override - Retains the arguments as ordinary JavaScript closure variables.
 *  */ 

// TODO: Can add Maps and Sets here.

 function aFunction(it: Function): Function {
  if (typeof it !== 'function') {
    throw TypeError(it + ' is not a function!');
  }
  return it;
}

function isObject(it: any): it is object {
  return it !== null && (typeof it == 'object' || typeof it == 'function');
}

const _slice = [].slice;
const factories: {[len: number]: Function} = {};

export function test() {
  const f = Function('F,a', 'return new F(a[0])');
  console.log(f.toString());
  console.log(typeof f);
  return factories;
}


function construct(F: Function, len: number, args: any[]) {
  if(!(len in factories)){
    for(var n = [], i = 0; i < len; i++)n[i] = 'a[' + i + ']';
    factories[len] = Function('F,a', 'return new F(' + n.join(',') + ')');
  }
  console.log(factories[len](F, args).toString());
  return factories[len](F, args);
}

function invoke(fn: Function, args: any[], that: any){
  // calls the specified function with a given this value, and arguments provided as an array
  return fn.apply(that, args);
}

Function.prototype.bind = function bind(this: Function, that: any, ...partArgs: any[]): Function {
  const fn       = aFunction(this); // Check 'this' is a function
  const bound = function(this: any, ...restArgs: any[]){
    const args = partArgs.concat(restArgs);
    // if the prototype property of a constructor appears anywhere in the prototype chain of an object.
    return this instanceof bound ? construct(fn, args.length, args) : invoke(fn, args, that);
  };
  if (isObject(fn.prototype)) {
    bound.prototype = fn.prototype;
  }
  return bound;
};

// We use a script that launches Chrome for us, but disables the Notifications feature
// that some apps depends on. Chrome disables the feature by removing the object, breaking
// these apps.
// So we define a skeleton that says 'denied', which is really what Chrome should be doing...
// Make sure we're running in the main browser thread...
// if (typeof(window) !== "undefined") {
//   (window as any)['Notification'] = {
//     permission: 'denied',
//     requestPermission: function() { return Promise.resolve('denied'); }
//   };
// }

