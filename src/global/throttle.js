
/**
 * 事件节流
 * @param {Function} fn 
 * @example
 * document.body.addEventListener("wheel", eventThrottle((event) => {}));
 */
const eventThrottle = function(fn){

    let scan = false;

    return function(...arg){
        if(!scan && fn){
            scan = setTimeout(() => {
                scan = false;
            }, 20);
            fn && fn.call(this, ...arg);
        }else{
            (arg[0] instanceof Event) && arg[0].preventDefault();
        }
    }
};


export {
    eventThrottle
};

/**
 * 节流
 * @module throttle
 * @author Iktsuarpok
 * @version 1.0
 */