/**
 * @typedef {(this: any, dataFromScope: any, ...args)=>} EventScopeEvent
 */


/**
 * EventScope规则
 */
class EventScopeRules {
    static instanceofEventScopeRules(rules) {
        if (!(rules instanceof EventScopeRules)) throw new Error('[rules] 不是 EventScopeRules');
        return true;
    }

    /**
     * @param {Object.<string, EventScopeEvent>} rules 
     * @param {EventScopeEvent} [exclude] 未匹配时执行
     */
    constructor(rules, exclude) {
        this.#rules = rules;
        this.#exclude = exclude || rules.default || null;
    };

    /**@type {Object.<string, EventScopeEvent>} */
    #rules = {};
    /**@type {EventScopeEvent || null} */
    #exclude = null;

    /**
     * 添加规则，立即生效
     * @param {string} scopeName 
     * @param {EventScopeEvent} scopeEvent 
     */
    addRule(scopeName, scopeEvent) { };
    /**
     * 获取 EventScopeEvent
     * @param {string} scopeName
     * @returns {EventScopeEvent|Object.<string, EventScopeEvent>}
     */
    getRules(scopeName) {
        if(scopeName){
            switch(scopeName){
                case 'default':
                    return this.#exclude;
                default:
                    return this.#rules[scopeName] || null;
            }
        };
    };
}

class EventScope {
    /**
     * @param {String} scopeName 初始 scopeName
     */
    constructor(scopeName) {
        this.#scope = scopeName || 'default';
    };

    #scope = 'default';
    #data = undefined;

    /**
     * 切换作用域
     * @param {string} [scopeName]
     * @param {} [data] 传递的参数
     */
    switch(scopeName, data){
        this.#scope = scopeName || 'default';
        this.#data = data || undefined;
    };
    /**
     * 绑定规则
     * @param {EventScopeRules} rules 
     */
    bindRules(rules){
        const eventScopeRules = EventScopeRules.instanceofEventScopeRules(rules) && rules;
        const scope = ()=>this.#scope;
        const data = ()=>this.#data;

        return function(...arg){
            const fn = eventScopeRules.getRules(scope()) || eventScopeRules.getRules('default');
            fn && fn.call(this , data(), ...arg);    
        }
    };
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////


export {
    EventScope,
    EventScopeRules
}