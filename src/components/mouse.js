import jQuery from "jquery";
import { eventThrottle } from "../global/throttle";

/**
 * @typedef {(this: MouseCapture, event: MouseEvent, target: Element)=>} MouseCaptureEvent 鼠标事件 
 * @typedef {string} CssExp Css 表达式
 * @typedef {Boolean} [stopPropagated=false] 阻止向下触发
 * @typedef {Boolean} [holdTriger=false] 子孙触发时依旧触发
 * @typedef {Boolean} [currect=false] 当 currectTarget 匹配时才会触发
 * @typedef {{target: Element|CssExp, fn: MouseCaptureEvent, stopPropagated: stopPropagated, holdTriger: holdTriger, currect: currect, children: MouseCaptureRuleUnit}[]} MouseCaptureRuleUnit
 * @typedef {('downLeft'|'downRight'|'downCenter'|'upLeft'|'upRight'|'upCenter'|'clickLeft'|'clickRight'|'clickCenter'|'doubleClickLeft'|'doubleClickRight'|'doubleClickCenter'|'longClickLeft'|'longClickRight'|'longClickCenter'|'move')} MouseCaptureEventType 触发类型
 */

/**
 * @typedef {Object} MouseCaptureRulesInput
 * @property {MouseCaptureRuleUnit | null} downLeft
 * @property {MouseCaptureRuleUnit | null} downRight
 * @property {MouseCaptureRuleUnit | null} downCenter
 * @property {MouseCaptureRuleUnit | null} upLeft
 * @property {MouseCaptureRuleUnit | null} upRight
 * @property {MouseCaptureRuleUnit | null} upCenter
 * @property {MouseCaptureRuleUnit | null} clickLeft
 * @property {MouseCaptureRuleUnit | null} clickRight
 * @property {MouseCaptureRuleUnit | null} clickCenter
 * @property {MouseCaptureRuleUnit | null} doubleClickLeft
 * @property {MouseCaptureRuleUnit | null} doubleClickRight
 * @property {MouseCaptureRuleUnit | null} doubleClickCenter
 * @property {MouseCaptureRuleUnit | null} longClickLeft
 * @property {MouseCaptureRuleUnit | null} longClickRight
 * @property {MouseCaptureRuleUnit | null} longClickCenter
 * @property {MouseCaptureRuleUnit | null} move
 */

/**
 * @desc 通用鼠标事件规则
 */
class MouseCaptureRules {
    static instanceofMouseCaptureRules(rules) {
        if (!(rules instanceof MouseCaptureRules)) throw new Error('[rules] 不是 MouseCaptureRules');
        return true;
    };

    /**
     * @param {MouseCaptureRulesInput} rules  downLeft | downRight | downCenter | upLeft | upRight | upCenter | clickLeft | clickRight | clickCenter | doubleClickLeft | doubleClickRight | doubleClickCenter | longClickLeft | longClickRight | longClickCenter | move 
     */
    constructor(rules) {
        /**@type {MouseCaptureRuleUnit | null} */
        this.clickLeft = rules.clickLeft || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.clickRight = rules.clickRight || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.clickCenter = rules.clickCenter || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.downLeft = rules.downLeft || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.downRight = rules.downRight || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.downCenter = rules.downCenter || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.upLeft = rules.upLeft || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.upRight = rules.upRight || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.upCenter = rules.upCenter || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.doubleClickLeft = rules.doubleClickLeft || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.doubleClickRight = rules.doubleClickRight || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.doubleClickCenter = rules.doubleClickCenter || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.longClickLeft = rules.longClickLeft || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.longClickRight = rules.longClickRight || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.longClickCenter = rules.longClickCenter || null;
        /**@type {MouseCaptureRuleUnit | null} */
        this.move = rules.move || null;

        // TODO 修改时需要更新下面的参数
        if (this.doubleClickCenter || this.doubleClickLeft || this.doubleClickRight) this.hasDouble = true;
        if (this.longClickCenter || this.longClickLeft || this.longClickRight) this.hasLong = true;
    };

    hasDouble = false;
    hasLong = false;
};

/**
 * @desc 通用鼠标事件管理
 */
class MouseCapture {
    // 默认长按和双击等待时间
    static longTime = 600;
    static doubleTime = 200;

    /**
     * @param {MouseCaptureRules} rules 
     * @param {Element} target 需要监听的父级对象
     */
    constructor(rules, target) {
        MouseCaptureRules.instanceofMouseCaptureRules(rules);
        if (!(target instanceof Element)) throw new Error('[target] 不是 Element');

        /**
         * 按键状态
         */
        this.keyStatus = new Proxy(this.#keyStatus, {
            get: (t, p) => t[p],
            set: () => true
        });
        /**@type {Element} */
        this.target = null;
        this.#rules = rules;

        // 监听 this
        Object.defineProperties(this, {
            target: {
                value: target,
                writable: false
            }
        });

        this.#init();
        this.#build();
    };

    #id = `MC${Math.random().toString(16).slice(2)}`;
    #keyStatus = {
        left: false,
        center: false,
        right: false,
        longClickLeft: false,
        longClickRight: false,
        longClickCenter: false,
        doubleClickLeft: false,
        doubleClickRight: false,
        doubleClickCenter: false,
    };
    #lastActiveTarget = null;
    /**@type {MouseCaptureRules} */
    #rules = null;
    #build() {
        /**@type {Element | null} */
        let moveTargetCache = null;
        let fnCollection = [];
        // 部署监听
        jQuery(document.body).on(`mousedown.${this.#id}`, this.target, ({originalEvent: e}) => {
            switch (e.button) {
                // 左键
                case 0: this.#downKeyBuilder('left', e);
                    break;
                // 中键
                case 1:
                    this.#downKeyBuilder('center', e);
                    break;
                // 右键
                case 2:
                    this.#downKeyBuilder('right', e);
                    break;
            }
        });
        jQuery(document.body).on(`mouseup.${this.#id}`, this.target, ({originalEvent: e}) => {
            switch (e.button) {
                // 左键
                case 0: this.#upKeyBuilder('left', e);
                    break;
                // 中键
                case 1: this.#upKeyBuilder('center', e);
                    break;
                // 右键
                case 2: this.#upKeyBuilder('right', e);
                    break;
            }
        });
        this.#rules.move && jQuery(document.body).on(`mousemove.${this.#id}`, this.target, eventThrottle(({originalEvent: e})=>{
            if(moveTargetCache !== e.target){
                // 收集
                fnCollection = this.#collect('move', e.target);
            };
            
            fnCollection.forEach(item => item.fn && item.fn.call(this, e, item.target));
        }));
    };
    /**
     * @desc 收集需要触发的规则
     * @param {MouseCaptureEventType} type 
     * @param {Element} target 触发目标
     * @returns {{fn: MouseCaptureEvent, target: Element}[]}
     */
    #collect(type, target) {
        const list = [];
        const toParentsCache = [...jQuery(target).parentsUntil(this.target), this.target, document.body];

        if (this.#rules[type]) {
            /**
             * @param {MouseCaptureRuleUnit} object
             * @param {{fn, target, holdTriger}} last
             * @returns {Boolean}
             */
            const BFS = (object, last) => {
                object = object || [];

                const index = list.length;
                let getInThisLoop = false;

                for (var item of object) {

                    if (jQuery(item.target).is(target)) {
                        // 匹配
                        list.push({ fn: item.fn, target: target });
                        getInThisLoop = true;
                    } else {
                        let next;
                        if(!item.currect){
                            for (let ele of toParentsCache) {
                                if (jQuery(ele).is(item.target)) {
                                    // last && last.holdTriger && list.push({fn: last.fn, target: last.target});
                                    next = { fn: item.fn, target: ele, holdTriger: item.holdTriger };
                                    getInThisLoop = true;
                                    break;
                                }
                            };    
                        };

                        if (!item.stopPropagated) {
                            getInThisLoop = BFS(item.children, next) || getInThisLoop;
                        };    
                    };

                    if(getInThisLoop) break;
                };

                if((getInThisLoop && last && last.holdTriger) || (!getInThisLoop && last)) list.splice(index, 0, {fn: last.fn, target: last.target});
                return getInThisLoop;
            };

            BFS(this.#rules[type], null);
        };

        return list;
    }
    /**
     * @param {('left'|'right'|'center')} type
     */
    #downKeyBuilder(type, e) {
        const upperType = { left: 'Left', right: 'Right', center: 'Center' }[type];

        this.#keyStatus[type] = true;
        this.#lastActiveTarget = e.target;

        // 检查双击触发
        if (this.#keyStatus[`doubleClick${upperType}`]) {
            // 触发双击
            clearTimeout(this.#keyStatus[`doubleClick${upperType}`]);
            this.#keyStatus[`doubleClick${upperType}`] = 'ready';
            this.#collect(`doubleClick${upperType}`, e.target).forEach(item => item.fn && item.fn.call(this, e, item.target));
            return;
        };

        // 检查是否需要监听长按
        if (this.#rules[`longClick${upperType}`]) {
            // 创建长按延时器
            this.#keyStatus[`longClick${upperType}`] = setTimeout(() => {
                this.#keyStatus[`longClick${upperType}`] = 'ready';
            }, MouseCapture.longTime);
        };

        this.#collect(`down${upperType}`, e.target).forEach(item => item.fn && item.fn.call(this, e, item.target));
    };
    #init() {
        // 取消绑定
        jQuery(document.body).off(`.${this.#id}`);
        // 初始化标记
        this.#keyStatus.left = false;
        this.#keyStatus.center = false;
        this.#keyStatus.right = false;

        clearTimeout(this.#keyStatus.longClickLeft);
        this.#keyStatus.longClickLeft = false;
        clearTimeout(this.#keyStatus.longClickCenter);
        this.#keyStatus.longClickCenter = false;
        clearTimeout(this.#keyStatus.longClickRight);
        this.#keyStatus.longClickRight = false;

        clearTimeout(this.#keyStatus.doubleClickLeft);
        this.#keyStatus.longClickLeft = false;
        clearTimeout(this.#keyStatus.doubleClickCenter);
        this.#keyStatus.longClickLeft = false;
        clearTimeout(this.#keyStatus.doubleClickRight);
        this.#keyStatus.longClickLeft = false;
    }
    /**
     * @param {('left'|'right'|'center')} type
     */
    #upKeyBuilder(type, e) {
        const upperType = { left: 'Left', right: 'Right', center: 'Center' }[type];

        this.#keyStatus[type] = false;
        this.#collect(`up${upperType}`, e.target).forEach(item => item.fn && item.fn.call(this, e, item.target));

        // 检查长按触发
        if (this.#keyStatus[`longClick${upperType}`] === 'ready') {
            // 触发长按
            this.#collect(`longClick${upperType}`, e.target).forEach(item => item.fn && item.fn.call(this, e, item.target));
            this.#keyStatus[`longClick${upperType}`] = false;
            return
        } else {
            // 取消长按
            clearTimeout(this.#keyStatus[`longClick${upperType}`]);
            this.#keyStatus[`longClick${upperType}`] = false;
        };

        // 检查是否需要监听双击
        if (this.#keyStatus[`doubleClick${upperType}`] !== 'ready' && this.#rules[`doubleClick${upperType}`]) {
            // 创建双击延迟器
            this.#keyStatus[`doubleClick${upperType}`] = setTimeout(() => {
                this.#keyStatus[`doubleClick${upperType}`] = false;
                // 取消双击延迟器，触发单击
                e.target === this.#lastActiveTarget && this.#collect(`click${upperType}`, e.target).forEach(item => item.fn && item.fn.call(this, e, item.target));
            }, MouseCapture.doubleTime);
            return;
        } else if (this.#keyStatus[`doubleClick${upperType}`] == 'ready') {
            // 双击第二次，不执行任何内容
            this.#keyStatus[`doubleClick${upperType}`] = false;
            return;
        };

        // 触发单击
        e.target === this.#lastActiveTarget && this.#collect(`click${upperType}`, e.target).forEach(item => item.fn && item.fn.call(this, e, item.target));
    };

    /**
     * @desc 当修改 rules 时需要重构
     */
    rebuild() {
        this.#init();
        this.#build();
    };
    destroy(){
        this.#init();
    }
};



////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

export {
    MouseCapture,
    MouseCaptureRules
}