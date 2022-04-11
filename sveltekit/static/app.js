
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = "livereload.js?snipver=1"; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
import { formatMoney, getTaxableTransactions, getTaxFormData, getTaxRate, isNameRegistered, SecurityType, getSecurity, cacheExchangeRates, CurrencyCode, exchangeRatesMap, setECBHostname, setInvestingComHostname, IBKRAdapter, Trading212Adapter } from '../src/tobcalc-lib.js';

function noop() { }
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function validate_store(store, name) {
    if (store != null && typeof store.subscribe !== 'function') {
        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
    }
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function set_store_value(store, ret, value) {
    store.set(value);
    return ret;
}
function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
    return function (event) {
        event.preventDefault();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_input_value(input, value) {
    input.value = value == null ? '' : value;
}
function custom_event(type, detail, bubbles = false) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, bubbles, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function
function flush() {
    const saved_component = current_component;
    do {
        // first, call beforeUpdate functions
        // and update components
        while (flushidx < dirty_components.length) {
            const component = dirty_components[flushidx];
            flushidx++;
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        flushidx = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
    set_current_component(saved_component);
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);
function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, 1, () => {
        lookup.delete(block.key);
    });
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(child_ctx, dirty);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    return new_blocks;
}
function validate_each_keys(ctx, list, get_context, get_key) {
    const keys = new Set();
    for (let i = 0; i < list.length; i++) {
        const key = get_key(get_context(ctx, list, i));
        if (keys.has(key)) {
            throw new Error('Cannot have duplicate keys in a keyed each');
        }
        keys.add(key);
    }
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
}
function append_dev(target, node) {
    dispatch_dev('SvelteDOMInsert', { target, node });
    append(target, node);
}
function insert_dev(target, node, anchor) {
    dispatch_dev('SvelteDOMInsert', { target, node, anchor });
    insert(target, node, anchor);
}
function detach_dev(node) {
    dispatch_dev('SvelteDOMRemove', { node });
    detach(node);
}
function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
    const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default)
        modifiers.push('preventDefault');
    if (has_stop_propagation)
        modifiers.push('stopPropagation');
    dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
    const dispose = listen(node, event, handler, options);
    return () => {
        dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
        dispose();
    };
}
function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
        dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
    else
        dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
}
function set_data_dev(text, data) {
    data = '' + data;
    if (text.wholeText === data)
        return;
    dispatch_dev('SvelteDOMSetData', { node: text, data });
    text.data = data;
}
function validate_each_argument(arg) {
    if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
        let msg = '{#each} only iterates over array-like objects.';
        if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
            msg += ' You can use a spread to convert this iterable into an array.';
        }
        throw new Error(msg);
    }
}
function validate_slots(name, slot, keys) {
    for (const slot_key of Object.keys(slot)) {
        if (!~keys.indexOf(slot_key)) {
            console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
        }
    }
}
/**
 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
 */
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error("'target' is a required option");
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn('Component was already destroyed'); // eslint-disable-line no-console
        };
    }
    $capture_state() { }
    $inject_state() { }
}

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = new Set();
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (const subscriber of subscribers) {
                    subscriber[1]();
                    subscriber_queue.push(subscriber, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

function createGlobalTaxFormDataStore() {
    const { subscribe, set, update } = writable(new Map());
    return {
        subscribe,
        set,
        update,
        delete: (serviceNumber) => {
            update(globalTaxFormData => {
                globalTaxFormData.delete(serviceNumber);
                return globalTaxFormData;
            });
        },
        setTaxFormData: (serviceNumber, taxFormData) => {
            update(globalTaxFormData => {
                globalTaxFormData.set(serviceNumber, taxFormData);
                return globalTaxFormData;
            });
        },
    };
}
const globalTaxFormData = createGlobalTaxFormDataStore();
const adapterNumber = writable(0);

var Broker;
(function (Broker) {
    Broker["InteractiveBrokers"] = "Interactive Brokers";
    Broker["Trading212"] = "Trading 212";
})(Broker || (Broker = {}));
const brokers = [
    Broker.InteractiveBrokers,
    Broker.Trading212,
];

/* src/Adapter.svelte generated by Svelte v3.46.4 */

const file$1 = "src/Adapter.svelte";

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[11] = list[i][0];
	child_ctx[12] = list[i][1];
	child_ctx[14] = i;
	return child_ctx;
}

function get_each_context_1$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[15] = list[i];
	return child_ctx;
}

// (48:4) {#each taxableTransactions as taxableTransaction}
function create_each_block_1$1(ctx) {
	let tr;
	let td0;
	let t0_value = /*taxableTransaction*/ ctx[15].security.name + "";
	let t0;
	let t1;
	let td1;
	let t2_value = formatMoney(/*taxableTransaction*/ ctx[15].value) + "";
	let t2;
	let t3;
	let td2;
	let t4_value = /*getSecurityTypeString*/ ctx[6](/*taxableTransaction*/ ctx[15].security.type) + "";
	let t4;
	let t5;
	let td3;
	let t6_value = /*taxableTransaction*/ ctx[15].countryCode + "";
	let t6;
	let t7;
	let td4;
	let t8_value = formatPercentage(getTaxRate(/*taxableTransaction*/ ctx[15])) + "";
	let t8;
	let t9;
	let td5;

	let t10_value = (isNameRegistered(/*taxableTransaction*/ ctx[15].security.name)
	? "Registered"
	: "Not registered") + "";

	let t10;
	let t11;

	const block = {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			t3 = space();
			td2 = element("td");
			t4 = text(t4_value);
			t5 = space();
			td3 = element("td");
			t6 = text(t6_value);
			t7 = space();
			td4 = element("td");
			t8 = text(t8_value);
			t9 = space();
			td5 = element("td");
			t10 = text(t10_value);
			t11 = space();
			add_location(td0, file$1, 49, 8, 1615);
			add_location(td1, file$1, 50, 8, 1667);
			add_location(td2, file$1, 51, 8, 1724);
			add_location(td3, file$1, 52, 8, 1799);
			add_location(td4, file$1, 53, 8, 1849);
			add_location(td5, file$1, 54, 8, 1917);
			add_location(tr, file$1, 48, 4, 1602);
		},
		m: function mount(target, anchor) {
			insert_dev(target, tr, anchor);
			append_dev(tr, td0);
			append_dev(td0, t0);
			append_dev(tr, t1);
			append_dev(tr, td1);
			append_dev(td1, t2);
			append_dev(tr, t3);
			append_dev(tr, td2);
			append_dev(td2, t4);
			append_dev(tr, t5);
			append_dev(tr, td3);
			append_dev(td3, t6);
			append_dev(tr, t7);
			append_dev(tr, td4);
			append_dev(td4, t8);
			append_dev(tr, t9);
			append_dev(tr, td5);
			append_dev(td5, t10);
			append_dev(tr, t11);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*taxableTransactions*/ 8 && t0_value !== (t0_value = /*taxableTransaction*/ ctx[15].security.name + "")) set_data_dev(t0, t0_value);
			if (dirty & /*taxableTransactions*/ 8 && t2_value !== (t2_value = formatMoney(/*taxableTransaction*/ ctx[15].value) + "")) set_data_dev(t2, t2_value);
			if (dirty & /*taxableTransactions*/ 8 && t4_value !== (t4_value = /*getSecurityTypeString*/ ctx[6](/*taxableTransaction*/ ctx[15].security.type) + "")) set_data_dev(t4, t4_value);
			if (dirty & /*taxableTransactions*/ 8 && t6_value !== (t6_value = /*taxableTransaction*/ ctx[15].countryCode + "")) set_data_dev(t6, t6_value);
			if (dirty & /*taxableTransactions*/ 8 && t8_value !== (t8_value = formatPercentage(getTaxRate(/*taxableTransaction*/ ctx[15])) + "")) set_data_dev(t8, t8_value);

			if (dirty & /*taxableTransactions*/ 8 && t10_value !== (t10_value = (isNameRegistered(/*taxableTransaction*/ ctx[15].security.name)
			? "Registered"
			: "Not registered") + "")) set_data_dev(t10, t10_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(tr);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block_1$1.name,
		type: "each",
		source: "(48:4) {#each taxableTransactions as taxableTransaction}",
		ctx
	});

	return block;
}

// (67:4) {#each [...taxFormData.entries()] as [taxRate, formRow], i}
function create_each_block$1(ctx) {
	let tr;
	let td0;
	let t0_value = /*i*/ ctx[14] + 1 + "";
	let t0;
	let t1;
	let td1;
	let t2_value = formatPercentage(/*taxRate*/ ctx[11]) + "";
	let t2;
	let t3;
	let td2;
	let t4_value = /*formRow*/ ctx[12].quantity + "";
	let t4;
	let t5;
	let td3;
	let t6_value = formatMoney(/*formRow*/ ctx[12].taxBase) + "";
	let t6;
	let t7;
	let td4;
	let t8_value = formatMoney(/*formRow*/ ctx[12].taxValue) + "";
	let t8;
	let t9;

	const block = {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			t3 = space();
			td2 = element("td");
			t4 = text(t4_value);
			t5 = space();
			td3 = element("td");
			t6 = text(t6_value);
			t7 = space();
			td4 = element("td");
			t8 = text(t8_value);
			t9 = space();
			add_location(td0, file$1, 68, 8, 2299);
			add_location(td1, file$1, 69, 8, 2324);
			add_location(td2, file$1, 70, 8, 2369);
			add_location(td3, file$1, 71, 8, 2405);
			add_location(td4, file$1, 72, 8, 2453);
			add_location(tr, file$1, 67, 4, 2286);
		},
		m: function mount(target, anchor) {
			insert_dev(target, tr, anchor);
			append_dev(tr, td0);
			append_dev(td0, t0);
			append_dev(tr, t1);
			append_dev(tr, td1);
			append_dev(td1, t2);
			append_dev(tr, t3);
			append_dev(tr, td2);
			append_dev(td2, t4);
			append_dev(tr, t5);
			append_dev(tr, td3);
			append_dev(td3, t6);
			append_dev(tr, t7);
			append_dev(tr, td4);
			append_dev(td4, t8);
			append_dev(tr, t9);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*taxFormData*/ 16 && t2_value !== (t2_value = formatPercentage(/*taxRate*/ ctx[11]) + "")) set_data_dev(t2, t2_value);
			if (dirty & /*taxFormData*/ 16 && t4_value !== (t4_value = /*formRow*/ ctx[12].quantity + "")) set_data_dev(t4, t4_value);
			if (dirty & /*taxFormData*/ 16 && t6_value !== (t6_value = formatMoney(/*formRow*/ ctx[12].taxBase) + "")) set_data_dev(t6, t6_value);
			if (dirty & /*taxFormData*/ 16 && t8_value !== (t8_value = formatMoney(/*formRow*/ ctx[12].taxValue) + "")) set_data_dev(t8, t8_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(tr);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$1.name,
		type: "each",
		source: "(67:4) {#each [...taxFormData.entries()] as [taxRate, formRow], i}",
		ctx
	});

	return block;
}

function create_fragment$1(ctx) {
	let label;
	let t0;
	let t1;
	let t2;
	let label_for_value;
	let t3;
	let input;
	let input_name_value;
	let t4;
	let p;
	let t5;
	let t6;
	let table0;
	let tr0;
	let th0;
	let t8;
	let th1;
	let t10;
	let th2;
	let t12;
	let th3;
	let t14;
	let th4;
	let t16;
	let th5;
	let t18;
	let t19;
	let table1;
	let tr1;
	let th6;
	let t21;
	let th7;
	let t23;
	let th8;
	let t25;
	let th9;
	let t27;
	let th10;
	let t29;
	let mounted;
	let dispose;
	let each_value_1 = /*taxableTransactions*/ ctx[3];
	validate_each_argument(each_value_1);
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
	}

	let each_value = [.../*taxFormData*/ ctx[4].entries()];
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const block = {
		c: function create() {
			label = element("label");
			t0 = text("Choose ");
			t1 = text(/*broker*/ ctx[0]);
			t2 = text(" csv");
			t3 = space();
			input = element("input");
			t4 = space();
			p = element("p");
			t5 = text(/*adapterError*/ ctx[5]);
			t6 = space();
			table0 = element("table");
			tr0 = element("tr");
			th0 = element("th");
			th0.textContent = "Name";
			t8 = space();
			th1 = element("th");
			th1.textContent = "Value";
			t10 = space();
			th2 = element("th");
			th2.textContent = "Type";
			t12 = space();
			th3 = element("th");
			th3.textContent = "Country";
			t14 = space();
			th4 = element("th");
			th4.textContent = "Tax";
			t16 = space();
			th5 = element("th");
			th5.textContent = "Registered";
			t18 = space();

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t19 = space();
			table1 = element("table");
			tr1 = element("tr");
			th6 = element("th");
			th6.textContent = "Row no.";
			t21 = space();
			th7 = element("th");
			th7.textContent = "Tax";
			t23 = space();
			th8 = element("th");
			th8.textContent = "Quantity";
			t25 = space();
			th9 = element("th");
			th9.textContent = "Tax base";
			t27 = space();
			th10 = element("th");
			th10.textContent = "Tax value";
			t29 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(label, "for", label_for_value = `adapter_${/*selectedBrokerNumber*/ ctx[1]}`);
			add_location(label, file$1, 35, 0, 1107);
			attr_dev(input, "name", input_name_value = `adapter_${/*selectedBrokerNumber*/ ctx[1]}`);
			attr_dev(input, "type", "file");
			attr_dev(input, "accept", "text/csv, .csv");
			add_location(input, file$1, 36, 0, 1182);
			attr_dev(p, "class", "adapter-error");
			add_location(p, file$1, 37, 0, 1303);
			add_location(th0, file$1, 40, 8, 1401);
			add_location(th1, file$1, 41, 8, 1423);
			add_location(th2, file$1, 42, 8, 1446);
			add_location(th3, file$1, 43, 8, 1468);
			add_location(th4, file$1, 44, 8, 1493);
			add_location(th5, file$1, 45, 8, 1514);
			add_location(tr0, file$1, 39, 4, 1388);
			attr_dev(table0, "class", "taxable-transactions");
			add_location(table0, file$1, 38, 0, 1347);
			add_location(th6, file$1, 60, 8, 2091);
			add_location(th7, file$1, 61, 8, 2116);
			add_location(th8, file$1, 62, 8, 2137);
			add_location(th9, file$1, 63, 8, 2163);
			add_location(th10, file$1, 64, 8, 2189);
			add_location(tr1, file$1, 59, 4, 2078);
			attr_dev(table1, "class", "tax-form-data");
			add_location(table1, file$1, 58, 0, 2044);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, label, anchor);
			append_dev(label, t0);
			append_dev(label, t1);
			append_dev(label, t2);
			insert_dev(target, t3, anchor);
			insert_dev(target, input, anchor);
			insert_dev(target, t4, anchor);
			insert_dev(target, p, anchor);
			append_dev(p, t5);
			insert_dev(target, t6, anchor);
			insert_dev(target, table0, anchor);
			append_dev(table0, tr0);
			append_dev(tr0, th0);
			append_dev(tr0, t8);
			append_dev(tr0, th1);
			append_dev(tr0, t10);
			append_dev(tr0, th2);
			append_dev(tr0, t12);
			append_dev(tr0, th3);
			append_dev(tr0, t14);
			append_dev(tr0, th4);
			append_dev(tr0, t16);
			append_dev(tr0, th5);
			append_dev(table0, t18);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(table0, null);
			}

			insert_dev(target, t19, anchor);
			insert_dev(target, table1, anchor);
			append_dev(table1, tr1);
			append_dev(tr1, th6);
			append_dev(tr1, t21);
			append_dev(tr1, th7);
			append_dev(tr1, t23);
			append_dev(tr1, th8);
			append_dev(tr1, t25);
			append_dev(tr1, th9);
			append_dev(tr1, t27);
			append_dev(tr1, th10);
			append_dev(table1, t29);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table1, null);
			}

			if (!mounted) {
				dispose = [
					listen_dev(input, "change", /*input_change_handler*/ ctx[9]),
					listen_dev(input, "change", /*loadedFile*/ ctx[7], false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*broker*/ 1) set_data_dev(t1, /*broker*/ ctx[0]);

			if (dirty & /*selectedBrokerNumber*/ 2 && label_for_value !== (label_for_value = `adapter_${/*selectedBrokerNumber*/ ctx[1]}`)) {
				attr_dev(label, "for", label_for_value);
			}

			if (dirty & /*selectedBrokerNumber*/ 2 && input_name_value !== (input_name_value = `adapter_${/*selectedBrokerNumber*/ ctx[1]}`)) {
				attr_dev(input, "name", input_name_value);
			}

			if (dirty & /*adapterError*/ 32) set_data_dev(t5, /*adapterError*/ ctx[5]);

			if (dirty & /*isNameRegistered, taxableTransactions, formatPercentage, getTaxRate, getSecurityTypeString, formatMoney*/ 72) {
				each_value_1 = /*taxableTransactions*/ ctx[3];
				validate_each_argument(each_value_1);
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1$1(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(table0, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty & /*formatMoney, taxFormData, formatPercentage*/ 16) {
				each_value = [.../*taxFormData*/ ctx[4].entries()];
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(table1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(label);
			if (detaching) detach_dev(t3);
			if (detaching) detach_dev(input);
			if (detaching) detach_dev(t4);
			if (detaching) detach_dev(p);
			if (detaching) detach_dev(t6);
			if (detaching) detach_dev(table0);
			destroy_each(each_blocks_1, detaching);
			if (detaching) detach_dev(t19);
			if (detaching) detach_dev(table1);
			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$1.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function formatPercentage(value) {
	return `${(value * 100).toFixed(2)}%`;
}

function instance$1($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots('Adapter', slots, []);

	function getSecurityTypeString(securityType) {
		switch (securityType) {
			case SecurityType.Stock:
				return "Stock";
			case SecurityType.ETF:
				return "ETF";
		}
	}

	let { broker } = $$props;
	let { selectedBrokerNumber } = $$props;
	let { brokerAdapter } = $$props;
	let files = [];
	let brokerTransactions = [];
	let taxableTransactions = [];
	let taxFormData = new Map();
	let adapterError = "";

	async function loadedFile() {
		try {
			brokerTransactions = await brokerAdapter(files[0]);
			$$invalidate(3, taxableTransactions = await getTaxableTransactions(brokerTransactions));
			$$invalidate(4, taxFormData = await getTaxFormData(taxableTransactions));
			globalTaxFormData.setTaxFormData(selectedBrokerNumber, taxFormData);
		} catch(error) {
			$$invalidate(5, adapterError = error.message);
		}
	}

	const writable_props = ['broker', 'selectedBrokerNumber', 'brokerAdapter'];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Adapter> was created with unknown prop '${key}'`);
	});

	function input_change_handler() {
		files = this.files;
		$$invalidate(2, files);
	}

	$$self.$$set = $$props => {
		if ('broker' in $$props) $$invalidate(0, broker = $$props.broker);
		if ('selectedBrokerNumber' in $$props) $$invalidate(1, selectedBrokerNumber = $$props.selectedBrokerNumber);
		if ('brokerAdapter' in $$props) $$invalidate(8, brokerAdapter = $$props.brokerAdapter);
	};

	$$self.$capture_state = () => ({
		globalTaxFormData,
		formatMoney,
		getTaxableTransactions,
		getTaxFormData,
		getTaxRate,
		isNameRegistered,
		SecurityType,
		formatPercentage,
		getSecurityTypeString,
		broker,
		selectedBrokerNumber,
		brokerAdapter,
		files,
		brokerTransactions,
		taxableTransactions,
		taxFormData,
		adapterError,
		loadedFile
	});

	$$self.$inject_state = $$props => {
		if ('broker' in $$props) $$invalidate(0, broker = $$props.broker);
		if ('selectedBrokerNumber' in $$props) $$invalidate(1, selectedBrokerNumber = $$props.selectedBrokerNumber);
		if ('brokerAdapter' in $$props) $$invalidate(8, brokerAdapter = $$props.brokerAdapter);
		if ('files' in $$props) $$invalidate(2, files = $$props.files);
		if ('brokerTransactions' in $$props) brokerTransactions = $$props.brokerTransactions;
		if ('taxableTransactions' in $$props) $$invalidate(3, taxableTransactions = $$props.taxableTransactions);
		if ('taxFormData' in $$props) $$invalidate(4, taxFormData = $$props.taxFormData);
		if ('adapterError' in $$props) $$invalidate(5, adapterError = $$props.adapterError);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [
		broker,
		selectedBrokerNumber,
		files,
		taxableTransactions,
		taxFormData,
		adapterError,
		getSecurityTypeString,
		loadedFile,
		brokerAdapter,
		input_change_handler
	];
}

class Adapter extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
			broker: 0,
			selectedBrokerNumber: 1,
			brokerAdapter: 8
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Adapter",
			options,
			id: create_fragment$1.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*broker*/ ctx[0] === undefined && !('broker' in props)) {
			console.warn("<Adapter> was created without expected prop 'broker'");
		}

		if (/*selectedBrokerNumber*/ ctx[1] === undefined && !('selectedBrokerNumber' in props)) {
			console.warn("<Adapter> was created without expected prop 'selectedBrokerNumber'");
		}

		if (/*brokerAdapter*/ ctx[8] === undefined && !('brokerAdapter' in props)) {
			console.warn("<Adapter> was created without expected prop 'brokerAdapter'");
		}
	}

	get broker() {
		throw new Error("<Adapter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set broker(value) {
		throw new Error("<Adapter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get selectedBrokerNumber() {
		throw new Error("<Adapter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selectedBrokerNumber(value) {
		throw new Error("<Adapter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get brokerAdapter() {
		throw new Error("<Adapter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set brokerAdapter(value) {
		throw new Error("<Adapter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

// TODO: use informative error instead of string?
async function runTests() {
    try {
        const securityIWDA = await getSecurity("IE00B4L5Y983");
        if (securityIWDA.type !== SecurityType.ETF) {
            return "Wrong security type for IWDA";
        }
        if (!securityIWDA.accumulating) {
            return "Wrong security data for IWDA (showing as distributing)";
        }
    }
    catch (error) {
        return "Could not get security data for IWDA";
    }
    try {
        const securityVWCE = await getSecurity("IE00BK5BQT80");
        if (securityVWCE.type !== SecurityType.ETF) {
            return "Wrong security type for VWCE";
        }
        if (!securityVWCE.accumulating) {
            return "Wrong security data for VWCE (showing as distributing)";
        }
    }
    catch (error) {
        return "Could not get security data for VWCE";
    }
    const start = new Date("21 February 2022 00:00:00 GMT");
    const end = new Date("25 February 2022 00:00:00 GMT");
    const expectedRates = {
        "2022-02-21": 1.1338,
        "2022-02-22": 1.1342,
        "2022-02-23": 1.1344,
        "2022-02-24": 1.1163,
        "2022-02-25": 1.1216,
    };
    try {
        await cacheExchangeRates(start, end, CurrencyCode.USD);
        const rates = exchangeRatesMap.get(CurrencyCode.USD);
        if (rates === undefined) {
            return "Failed exchange rates test";
        }
        for (const date in expectedRates) {
            if (expectedRates[date] !== rates.get(date)) {
                return "Failed exchange rates test";
            }
        }
    }
    catch (error) {
        return "Failed exchanges rates test";
    }
    return null;
}

/* src/index.svelte generated by Svelte v3.46.4 */

const { Map: Map_1, Object: Object_1 } = globals;
const file = "src/index.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[48] = list[i][0];
	child_ctx[49] = list[i][1];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[52] = list[i];
	return child_ctx;
}

// (137:0) {#if failedTestsError !== ""}
function create_if_block_2(ctx) {
	let h2;
	let t0;
	let t1;

	const block = {
		c: function create() {
			h2 = element("h2");
			t0 = text("Error while performing checks: ");
			t1 = text(/*failedTestsError*/ ctx[0]);
			add_location(h2, file, 137, 0, 4858);
		},
		m: function mount(target, anchor) {
			insert_dev(target, h2, anchor);
			append_dev(h2, t0);
			append_dev(h2, t1);
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*failedTestsError*/ 1) set_data_dev(t1, /*failedTestsError*/ ctx[0]);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(h2);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2.name,
		type: "if",
		source: "(137:0) {#if failedTestsError !== \\\"\\\"}",
		ctx
	});

	return block;
}

// (166:3) {#each brokers as service}
function create_each_block_1(ctx) {
	let option;
	let t_value = /*service*/ ctx[52] + "";
	let t;

	const block = {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = /*service*/ ctx[52];
			option.value = option.__value;
			add_location(option, file, 166, 4, 7005);
		},
		m: function mount(target, anchor) {
			insert_dev(target, option, anchor);
			append_dev(option, t);
		},
		p: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(option);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block_1.name,
		type: "each",
		source: "(166:3) {#each brokers as service}",
		ctx
	});

	return block;
}

// (173:49) 
function create_if_block_1(ctx) {
	let adapter;
	let current;

	adapter = new Adapter({
			props: {
				selectedBrokerNumber: /*selectedBrokerNumber*/ ctx[48],
				broker: /*selectedBroker*/ ctx[49],
				brokerAdapter: Trading212Adapter
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(adapter.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(adapter, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const adapter_changes = {};
			if (dirty[0] & /*selectedBrokers*/ 2) adapter_changes.selectedBrokerNumber = /*selectedBrokerNumber*/ ctx[48];
			if (dirty[0] & /*selectedBrokers*/ 2) adapter_changes.broker = /*selectedBroker*/ ctx[49];
			adapter.$set(adapter_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(adapter.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(adapter.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(adapter, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1.name,
		type: "if",
		source: "(173:49) ",
		ctx
	});

	return block;
}

// (171:2) {#if selectedBroker === Broker.InteractiveBrokers}
function create_if_block(ctx) {
	let adapter;
	let current;

	adapter = new Adapter({
			props: {
				selectedBrokerNumber: /*selectedBrokerNumber*/ ctx[48],
				broker: /*selectedBroker*/ ctx[49],
				brokerAdapter: IBKRAdapter
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(adapter.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(adapter, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const adapter_changes = {};
			if (dirty[0] & /*selectedBrokers*/ 2) adapter_changes.selectedBrokerNumber = /*selectedBrokerNumber*/ ctx[48];
			if (dirty[0] & /*selectedBrokers*/ 2) adapter_changes.broker = /*selectedBroker*/ ctx[49];
			adapter.$set(adapter_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(adapter.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(adapter.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(adapter, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block.name,
		type: "if",
		source: "(171:2) {#if selectedBroker === Broker.InteractiveBrokers}",
		ctx
	});

	return block;
}

// (163:1) {#each [...selectedBrokers.entries()] as [selectedBrokerNumber, selectedBroker] (selectedBrokerNumber)}
function create_each_block(key_1, ctx) {
	let div;
	let select;
	let t0;
	let button;
	let t2;
	let current_block_type_index;
	let if_block;
	let t3;
	let current;
	let mounted;
	let dispose;
	let each_value_1 = brokers;
	validate_each_argument(each_value_1);
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	function change_handler(...args) {
		return /*change_handler*/ ctx[36](/*selectedBrokerNumber*/ ctx[48], ...args);
	}

	function click_handler_1() {
		return /*click_handler_1*/ ctx[37](/*selectedBrokerNumber*/ ctx[48]);
	}

	const if_block_creators = [create_if_block, create_if_block_1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*selectedBroker*/ ctx[49] === Broker.InteractiveBrokers) return 0;
		if (/*selectedBroker*/ ctx[49] === Broker.Trading212) return 1;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	const block = {
		key: key_1,
		first: null,
		c: function create() {
			div = element("div");
			select = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t0 = space();
			button = element("button");
			button.textContent = "Remove";
			t2 = space();
			if (if_block) if_block.c();
			t3 = space();
			add_location(select, file, 164, 2, 6881);
			attr_dev(button, "class", "svelte-1ldobu6");
			add_location(button, file, 169, 2, 7073);
			attr_dev(div, "class", "selected-service svelte-1ldobu6");
			add_location(div, file, 163, 1, 6848);
			this.first = div;
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, select);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			append_dev(div, t0);
			append_dev(div, button);
			append_dev(div, t2);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(div, null);
			}

			append_dev(div, t3);
			current = true;

			if (!mounted) {
				dispose = [
					listen_dev(select, "change", change_handler, false, false, false),
					listen_dev(button, "click", prevent_default(click_handler_1), false, true, false)
				];

				mounted = true;
			}
		},
		p: function update(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*brokers*/ 0) {
				each_value_1 = brokers;
				validate_each_argument(each_value_1);
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_1.length;
			}

			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if (~current_block_type_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				}
			} else {
				if (if_block) {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
				}

				if (~current_block_type_index) {
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(div, t3);
				} else {
					if_block = null;
				}
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_each(each_blocks, detaching);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d();
			}

			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block.name,
		type: "each",
		source: "(163:1) {#each [...selectedBrokers.entries()] as [selectedBrokerNumber, selectedBroker] (selectedBrokerNumber)}",
		ctx
	});

	return block;
}

function create_fragment(ctx) {
	let t0;
	let div0;
	let label0;
	let t2;
	let input0;
	let t3;
	let label1;
	let t5;
	let input1;
	let t6;
	let input2;
	let t7;
	let input3;
	let t8;
	let input4;
	let t9;
	let input5;
	let t10;
	let input6;
	let t11;
	let input7;
	let t12;
	let input8;
	let t13;
	let input9;
	let t14;
	let input10;
	let t15;
	let label2;
	let t17;
	let input11;
	let t18;
	let div1;
	let button0;
	let t20;
	let each_blocks = [];
	let each_1_lookup = new Map_1();
	let t21;
	let div2;
	let a;
	let t23;
	let button1;
	let t25;
	let p;
	let t26;
	let t27;
	let embed;
	let current;
	let mounted;
	let dispose;
	let if_block = /*failedTestsError*/ ctx[0] !== "" && create_if_block_2(ctx);
	let each_value = [.../*selectedBrokers*/ ctx[1].entries()];
	validate_each_argument(each_value);
	const get_key = ctx => /*selectedBrokerNumber*/ ctx[48];
	validate_each_keys(ctx, each_value, get_each_context, get_key);

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	const block = {
		c: function create() {
			if (if_block) if_block.c();
			t0 = space();
			div0 = element("div");
			label0 = element("label");
			label0.textContent = "Start date";
			t2 = space();
			input0 = element("input");
			t3 = space();
			label1 = element("label");
			label1.textContent = "End date";
			t5 = space();
			input1 = element("input");
			t6 = space();
			input2 = element("input");
			t7 = space();
			input3 = element("input");
			t8 = space();
			input4 = element("input");
			t9 = space();
			input5 = element("input");
			t10 = space();
			input6 = element("input");
			t11 = space();
			input7 = element("input");
			t12 = space();
			input8 = element("input");
			t13 = space();
			input9 = element("input");
			t14 = space();
			input10 = element("input");
			t15 = space();
			label2 = element("label");
			label2.textContent = "Choose signature png";
			t17 = space();
			input11 = element("input");
			t18 = space();
			div1 = element("div");
			button0 = element("button");
			button0.textContent = "New service";
			t20 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t21 = space();
			div2 = element("div");
			a = element("a");
			a.textContent = "Download pdf";
			t23 = space();
			button1 = element("button");
			button1.textContent = "Download pdf";
			t25 = space();
			p = element("p");
			t26 = text(/*pdfError*/ ctx[16]);
			t27 = space();
			embed = element("embed");
			attr_dev(label0, "for", "start");
			attr_dev(label0, "class", "svelte-1ldobu6");
			add_location(label0, file, 141, 1, 4946);
			attr_dev(input0, "id", "start");
			attr_dev(input0, "name", "start");
			attr_dev(input0, "type", "date");
			attr_dev(input0, "class", "svelte-1ldobu6");
			add_location(input0, file, 142, 1, 4985);
			attr_dev(label1, "for", "end");
			attr_dev(label1, "class", "svelte-1ldobu6");
			add_location(label1, file, 143, 1, 5088);
			attr_dev(input1, "id", "end");
			attr_dev(input1, "name", "end");
			attr_dev(input1, "type", "date");
			attr_dev(input1, "class", "svelte-1ldobu6");
			add_location(input1, file, 144, 1, 5123);
			attr_dev(input2, "name", "national_registration_number");
			attr_dev(input2, "placeholder", "National registration number");
			attr_dev(input2, "type", "text");
			attr_dev(input2, "class", "svelte-1ldobu6");
			add_location(input2, file, 145, 1, 5220);
			attr_dev(input3, "name", "full_name");
			attr_dev(input3, "placeholder", "Full name");
			attr_dev(input3, "type", "text");
			attr_dev(input3, "class", "svelte-1ldobu6");
			add_location(input3, file, 146, 1, 5395);
			attr_dev(input4, "name", "address_line_1");
			attr_dev(input4, "placeholder", "Address line 1");
			attr_dev(input4, "type", "text");
			attr_dev(input4, "class", "svelte-1ldobu6");
			add_location(input4, file, 147, 1, 5509);
			attr_dev(input5, "name", "address_line_2");
			attr_dev(input5, "placeholder", "Address line 2");
			attr_dev(input5, "type", "text");
			attr_dev(input5, "class", "svelte-1ldobu6");
			add_location(input5, file, 148, 1, 5642);
			attr_dev(input6, "name", "address_line_3");
			attr_dev(input6, "placeholder", "Address line 3");
			attr_dev(input6, "type", "text");
			attr_dev(input6, "class", "svelte-1ldobu6");
			add_location(input6, file, 149, 1, 5775);
			attr_dev(input7, "name", "signature_name");
			attr_dev(input7, "placeholder", "Signature name");
			attr_dev(input7, "type", "text");
			attr_dev(input7, "class", "svelte-1ldobu6");
			add_location(input7, file, 150, 1, 5908);
			attr_dev(input8, "name", "signature_capacity");
			attr_dev(input8, "placeholder", "Signature capacity");
			attr_dev(input8, "type", "text");
			attr_dev(input8, "class", "svelte-1ldobu6");
			add_location(input8, file, 151, 1, 6042);
			attr_dev(input9, "name", "location");
			attr_dev(input9, "placeholder", "Location");
			attr_dev(input9, "type", "text");
			attr_dev(input9, "class", "svelte-1ldobu6");
			add_location(input9, file, 152, 1, 6188);
			attr_dev(input10, "name", "date");
			attr_dev(input10, "placeholder", "Date");
			attr_dev(input10, "type", "text");
			attr_dev(input10, "class", "svelte-1ldobu6");
			add_location(input10, file, 153, 1, 6305);
			attr_dev(label2, "for", "signature_png");
			attr_dev(label2, "class", "svelte-1ldobu6");
			add_location(label2, file, 155, 1, 6411);
			attr_dev(input11, "id", "signature_png");
			attr_dev(input11, "name", "signature_png");
			attr_dev(input11, "type", "file");
			attr_dev(input11, "accept", "image/png");
			attr_dev(input11, "class", "svelte-1ldobu6");
			add_location(input11, file, 156, 1, 6468);
			attr_dev(div0, "class", "column svelte-1ldobu6");
			add_location(div0, file, 140, 0, 4924);
			attr_dev(button0, "class", "svelte-1ldobu6");
			add_location(button0, file, 160, 1, 6635);
			attr_dev(div1, "class", "column svelte-1ldobu6");
			add_location(div1, file, 159, 0, 6613);
			attr_dev(a, "id", "download-link");
			attr_dev(a, "download", "tob-filled.pdf");
			attr_dev(a, "class", "svelte-1ldobu6");
			add_location(a, file, 180, 1, 7558);
			attr_dev(button1, "class", "svelte-1ldobu6");
			add_location(button1, file, 181, 1, 7652);
			attr_dev(p, "class", "pdf-error");
			add_location(p, file, 182, 1, 7739);
			attr_dev(embed, "width", "500");
			attr_dev(embed, "height", "700");
			add_location(embed, file, 183, 1, 7776);
			attr_dev(div2, "class", "column svelte-1ldobu6");
			add_location(div2, file, 179, 0, 7536);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, t0, anchor);
			insert_dev(target, div0, anchor);
			append_dev(div0, label0);
			append_dev(div0, t2);
			append_dev(div0, input0);
			set_input_value(input0, /*startDateValue*/ ctx[4]);
			append_dev(div0, t3);
			append_dev(div0, label1);
			append_dev(div0, t5);
			append_dev(div0, input1);
			set_input_value(input1, /*endDateValue*/ ctx[5]);
			append_dev(div0, t6);
			append_dev(div0, input2);
			set_input_value(input2, /*nationalRegistrationNumberValue*/ ctx[6]);
			append_dev(div0, t7);
			append_dev(div0, input3);
			set_input_value(input3, /*fullName*/ ctx[7]);
			append_dev(div0, t8);
			append_dev(div0, input4);
			set_input_value(input4, /*addressLine1Value*/ ctx[8]);
			append_dev(div0, t9);
			append_dev(div0, input5);
			set_input_value(input5, /*addressLine2Value*/ ctx[9]);
			append_dev(div0, t10);
			append_dev(div0, input6);
			set_input_value(input6, /*addressLine3Value*/ ctx[10]);
			append_dev(div0, t11);
			append_dev(div0, input7);
			set_input_value(input7, /*signatureNameValue*/ ctx[11]);
			append_dev(div0, t12);
			append_dev(div0, input8);
			set_input_value(input8, /*signatureCapacityValue*/ ctx[12]);
			append_dev(div0, t13);
			append_dev(div0, input9);
			set_input_value(input9, /*locationValue*/ ctx[14]);
			append_dev(div0, t14);
			append_dev(div0, input10);
			set_input_value(input10, /*dateValue*/ ctx[15]);
			append_dev(div0, t15);
			append_dev(div0, label2);
			append_dev(div0, t17);
			append_dev(div0, input11);
			insert_dev(target, t18, anchor);
			insert_dev(target, div1, anchor);
			append_dev(div1, button0);
			append_dev(div1, t20);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div1, null);
			}

			insert_dev(target, t21, anchor);
			insert_dev(target, div2, anchor);
			append_dev(div2, a);
			/*a_binding*/ ctx[38](a);
			append_dev(div2, t23);
			append_dev(div2, button1);
			append_dev(div2, t25);
			append_dev(div2, p);
			append_dev(p, t26);
			append_dev(div2, t27);
			append_dev(div2, embed);
			/*embed_binding*/ ctx[40](embed);
			current = true;

			if (!mounted) {
				dispose = [
					listen_dev(input0, "input", /*input0_input_handler*/ ctx[23]),
					listen_dev(input0, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(input1, "input", /*input1_input_handler*/ ctx[24]),
					listen_dev(input1, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(input2, "input", /*input2_input_handler*/ ctx[25]),
					listen_dev(input2, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(input3, "input", /*input3_input_handler*/ ctx[26]),
					listen_dev(input3, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(input4, "input", /*input4_input_handler*/ ctx[27]),
					listen_dev(input4, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(input5, "input", /*input5_input_handler*/ ctx[28]),
					listen_dev(input5, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(input6, "input", /*input6_input_handler*/ ctx[29]),
					listen_dev(input6, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(input7, "input", /*input7_input_handler*/ ctx[30]),
					listen_dev(input7, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(input8, "input", /*input8_input_handler*/ ctx[31]),
					listen_dev(input8, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(input9, "input", /*input9_input_handler*/ ctx[32]),
					listen_dev(input9, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(input10, "input", /*input10_input_handler*/ ctx[33]),
					listen_dev(input10, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(input11, "change", /*input11_change_handler*/ ctx[34]),
					listen_dev(input11, "input", /*delayedPdfUpdate*/ ctx[20], false, false, false),
					listen_dev(button0, "click", prevent_default(/*click_handler*/ ctx[35]), false, true, false),
					listen_dev(button1, "click", prevent_default(/*click_handler_2*/ ctx[39]), false, true, false)
				];

				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			if (/*failedTestsError*/ ctx[0] !== "") {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_2(ctx);
					if_block.c();
					if_block.m(t0.parentNode, t0);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty[0] & /*startDateValue*/ 16) {
				set_input_value(input0, /*startDateValue*/ ctx[4]);
			}

			if (dirty[0] & /*endDateValue*/ 32) {
				set_input_value(input1, /*endDateValue*/ ctx[5]);
			}

			if (dirty[0] & /*nationalRegistrationNumberValue*/ 64 && input2.value !== /*nationalRegistrationNumberValue*/ ctx[6]) {
				set_input_value(input2, /*nationalRegistrationNumberValue*/ ctx[6]);
			}

			if (dirty[0] & /*fullName*/ 128 && input3.value !== /*fullName*/ ctx[7]) {
				set_input_value(input3, /*fullName*/ ctx[7]);
			}

			if (dirty[0] & /*addressLine1Value*/ 256 && input4.value !== /*addressLine1Value*/ ctx[8]) {
				set_input_value(input4, /*addressLine1Value*/ ctx[8]);
			}

			if (dirty[0] & /*addressLine2Value*/ 512 && input5.value !== /*addressLine2Value*/ ctx[9]) {
				set_input_value(input5, /*addressLine2Value*/ ctx[9]);
			}

			if (dirty[0] & /*addressLine3Value*/ 1024 && input6.value !== /*addressLine3Value*/ ctx[10]) {
				set_input_value(input6, /*addressLine3Value*/ ctx[10]);
			}

			if (dirty[0] & /*signatureNameValue*/ 2048 && input7.value !== /*signatureNameValue*/ ctx[11]) {
				set_input_value(input7, /*signatureNameValue*/ ctx[11]);
			}

			if (dirty[0] & /*signatureCapacityValue*/ 4096 && input8.value !== /*signatureCapacityValue*/ ctx[12]) {
				set_input_value(input8, /*signatureCapacityValue*/ ctx[12]);
			}

			if (dirty[0] & /*locationValue*/ 16384 && input9.value !== /*locationValue*/ ctx[14]) {
				set_input_value(input9, /*locationValue*/ ctx[14]);
			}

			if (dirty[0] & /*dateValue*/ 32768 && input10.value !== /*dateValue*/ ctx[15]) {
				set_input_value(input10, /*dateValue*/ ctx[15]);
			}

			if (dirty[0] & /*selectedBrokers, removeSelectedBroker, setSelectedBroker*/ 786434) {
				each_value = [.../*selectedBrokers*/ ctx[1].entries()];
				validate_each_argument(each_value);
				group_outros();
				validate_each_keys(ctx, each_value, get_each_context, get_key);
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, outro_and_destroy_block, create_each_block, null, get_each_context);
				check_outros();
			}

			if (!current || dirty[0] & /*pdfError*/ 65536) set_data_dev(t26, /*pdfError*/ ctx[16]);
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(div0);
			if (detaching) detach_dev(t18);
			if (detaching) detach_dev(div1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			if (detaching) detach_dev(t21);
			if (detaching) detach_dev(div2);
			/*a_binding*/ ctx[38](null);
			/*embed_binding*/ ctx[40](null);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance($$self, $$props, $$invalidate) {
	let $globalTaxFormData;
	let $adapterNumber;
	validate_store(globalTaxFormData, 'globalTaxFormData');
	component_subscribe($$self, globalTaxFormData, $$value => $$invalidate(22, $globalTaxFormData = $$value));
	validate_store(adapterNumber, 'adapterNumber');
	component_subscribe($$self, adapterNumber, $$value => $$invalidate(44, $adapterNumber = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots('App', slots, []);
	const pdfWorker = new Worker("tobcalc-lib-pdf.js");
	let resolveFillPdfPromise;

	const workerFillPdf = (...params) => {
		pdfWorker.postMessage(params);
		return new Promise(resolve => resolveFillPdfPromise = resolve);
	};

	pdfWorker.onmessage = event => {
		resolveFillPdfPromise(event.data);
	};

	setECBHostname("localhost:8081/ecb");
	setInvestingComHostname("localhost:8081/investing_com");
	let failedTestsError = "";

	runTests().then(result => {
		if (result !== null) {
			$$invalidate(0, failedTestsError = result);
		}
	});

	let selectedBrokers = new Map();
	selectedBrokers.set(set_store_value(adapterNumber, $adapterNumber++, $adapterNumber), Broker.InteractiveBrokers);

	function addSelectedBroker(service) {
		selectedBrokers.set(set_store_value(adapterNumber, $adapterNumber++, $adapterNumber), service);

		// Force reactivity change
		$$invalidate(1, selectedBrokers);
	}

	function setSelectedBroker(selectedBrokerNumber, broker) {
		selectedBrokers.set(selectedBrokerNumber, broker);
		$$invalidate(1, selectedBrokers);
	}

	function removeSelectedBroker(selectedBrokerNumber) {
		selectedBrokers.delete(selectedBrokerNumber);
		globalTaxFormData.delete(selectedBrokerNumber);
		$$invalidate(1, selectedBrokers);
	}

	let pdfBytes;

	fetch("tob-fillable.pdf").then(async response => {
		$$invalidate(21, pdfBytes = new Uint8Array(await response.arrayBuffer()));
	});

	let pdfObjectUrl = "";
	let downloadElement;
	let embedElement;
	let startDateValue;
	let endDateValue;
	let nationalRegistrationNumberValue;
	let fullName;
	let addressLine1Value;
	let addressLine2Value;
	let addressLine3Value;
	let signatureNameValue;
	let signatureCapacityValue;
	let signatureFiles = [];
	let locationValue;
	let dateValue;
	let pdfError = "";

	async function setPdfUrl(pdfTaxFormData) {
		const emptyFormRow = { quantity: 0, taxBase: 0, taxValue: 0 };
		const tax012FormRow = Object.assign({}, emptyFormRow);
		const tax035FormRow = Object.assign({}, emptyFormRow);
		const tax132FormRow = Object.assign({}, emptyFormRow);
		let totalTaxValue = 0;

		for (const [_, taxFormData] of pdfTaxFormData) {
			for (const [taxRate, { quantity, taxBase, taxValue }] of taxFormData) {
				let aggregatedFormRow;

				switch (taxRate) {
					case 0.0012:
						aggregatedFormRow = tax012FormRow;
						break;
					case 0.0035:
						aggregatedFormRow = tax035FormRow;
						break;
					default:
						aggregatedFormRow = tax132FormRow;
				}

				aggregatedFormRow.quantity += quantity;
				aggregatedFormRow.taxBase += taxBase;
				aggregatedFormRow.taxValue += taxValue;
				totalTaxValue += taxValue;
			}
		}

		try {
			const objectUrl = await workerFillPdf(pdfBytes, {
				start: startDateValue ? new Date(startDateValue) : new Date(),
				end: startDateValue ? new Date(endDateValue) : new Date(),
				nationalRegistrationNumber: nationalRegistrationNumberValue,
				fullName,
				addressLine1: addressLine1Value,
				addressLine2: addressLine2Value,
				addressLine3: addressLine3Value,
				tableATax012Quantity: tax012FormRow.quantity,
				tableATax035Quantity: tax035FormRow.quantity,
				tableATax132Quantity: tax132FormRow.quantity,
				tableATax012TaxBase: tax012FormRow.taxBase,
				tableATax035TaxBase: tax035FormRow.taxBase,
				tableATax132TaxBase: tax132FormRow.taxBase,
				tableATax012TaxValue: tax012FormRow.taxValue,
				tableATax035TaxValue: tax035FormRow.taxValue,
				tableATax132TaxValue: tax132FormRow.taxValue,
				tableATotalTaxValue: totalTaxValue,
				totalTaxValue,
				signaturePng: signatureFiles[0]
				? new Uint8Array(await signatureFiles[0].arrayBuffer())
				: undefined,
				signatureName: signatureNameValue,
				signatureCapacity: signatureCapacityValue,
				location: locationValue,
				date: dateValue
			});

			$$invalidate(2, downloadElement.href = objectUrl, downloadElement);
			$$invalidate(3, embedElement.src = objectUrl, embedElement);
		} catch(error) {
			$$invalidate(16, pdfError = error.message);
		}
	}

	let previousTimeoutId;

	function delayedPdfUpdate() {
		if (previousTimeoutId !== undefined) {
			clearTimeout(previousTimeoutId);
		}

		previousTimeoutId = setTimeout(
			() => {
				setPdfUrl($globalTaxFormData);
			},
			500
		);
	}

	const writable_props = [];

	Object_1.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
	});

	function input0_input_handler() {
		startDateValue = this.value;
		$$invalidate(4, startDateValue);
	}

	function input1_input_handler() {
		endDateValue = this.value;
		$$invalidate(5, endDateValue);
	}

	function input2_input_handler() {
		nationalRegistrationNumberValue = this.value;
		$$invalidate(6, nationalRegistrationNumberValue);
	}

	function input3_input_handler() {
		fullName = this.value;
		$$invalidate(7, fullName);
	}

	function input4_input_handler() {
		addressLine1Value = this.value;
		$$invalidate(8, addressLine1Value);
	}

	function input5_input_handler() {
		addressLine2Value = this.value;
		$$invalidate(9, addressLine2Value);
	}

	function input6_input_handler() {
		addressLine3Value = this.value;
		$$invalidate(10, addressLine3Value);
	}

	function input7_input_handler() {
		signatureNameValue = this.value;
		$$invalidate(11, signatureNameValue);
	}

	function input8_input_handler() {
		signatureCapacityValue = this.value;
		$$invalidate(12, signatureCapacityValue);
	}

	function input9_input_handler() {
		locationValue = this.value;
		$$invalidate(14, locationValue);
	}

	function input10_input_handler() {
		dateValue = this.value;
		$$invalidate(15, dateValue);
	}

	function input11_change_handler() {
		signatureFiles = this.files;
		$$invalidate(13, signatureFiles);
	}

	const click_handler = () => addSelectedBroker(Broker.InteractiveBrokers);
	const change_handler = (selectedBrokerNumber, event) => setSelectedBroker(selectedBrokerNumber, event.target.value);
	const click_handler_1 = selectedBrokerNumber => removeSelectedBroker(selectedBrokerNumber);

	function a_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			downloadElement = $$value;
			$$invalidate(2, downloadElement);
		});
	}

	const click_handler_2 = () => downloadElement.click();

	function embed_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			embedElement = $$value;
			$$invalidate(3, embedElement);
		});
	}

	$$self.$capture_state = () => ({
		adapterNumber,
		globalTaxFormData,
		Broker,
		brokers,
		Adapter,
		IBKRAdapter,
		Trading212Adapter,
		setECBHostname,
		setInvestingComHostname,
		runTests,
		pdfWorker,
		resolveFillPdfPromise,
		workerFillPdf,
		failedTestsError,
		selectedBrokers,
		addSelectedBroker,
		setSelectedBroker,
		removeSelectedBroker,
		pdfBytes,
		pdfObjectUrl,
		downloadElement,
		embedElement,
		startDateValue,
		endDateValue,
		nationalRegistrationNumberValue,
		fullName,
		addressLine1Value,
		addressLine2Value,
		addressLine3Value,
		signatureNameValue,
		signatureCapacityValue,
		signatureFiles,
		locationValue,
		dateValue,
		pdfError,
		setPdfUrl,
		previousTimeoutId,
		delayedPdfUpdate,
		$globalTaxFormData,
		$adapterNumber
	});

	$$self.$inject_state = $$props => {
		if ('resolveFillPdfPromise' in $$props) resolveFillPdfPromise = $$props.resolveFillPdfPromise;
		if ('failedTestsError' in $$props) $$invalidate(0, failedTestsError = $$props.failedTestsError);
		if ('selectedBrokers' in $$props) $$invalidate(1, selectedBrokers = $$props.selectedBrokers);
		if ('pdfBytes' in $$props) $$invalidate(21, pdfBytes = $$props.pdfBytes);
		if ('pdfObjectUrl' in $$props) pdfObjectUrl = $$props.pdfObjectUrl;
		if ('downloadElement' in $$props) $$invalidate(2, downloadElement = $$props.downloadElement);
		if ('embedElement' in $$props) $$invalidate(3, embedElement = $$props.embedElement);
		if ('startDateValue' in $$props) $$invalidate(4, startDateValue = $$props.startDateValue);
		if ('endDateValue' in $$props) $$invalidate(5, endDateValue = $$props.endDateValue);
		if ('nationalRegistrationNumberValue' in $$props) $$invalidate(6, nationalRegistrationNumberValue = $$props.nationalRegistrationNumberValue);
		if ('fullName' in $$props) $$invalidate(7, fullName = $$props.fullName);
		if ('addressLine1Value' in $$props) $$invalidate(8, addressLine1Value = $$props.addressLine1Value);
		if ('addressLine2Value' in $$props) $$invalidate(9, addressLine2Value = $$props.addressLine2Value);
		if ('addressLine3Value' in $$props) $$invalidate(10, addressLine3Value = $$props.addressLine3Value);
		if ('signatureNameValue' in $$props) $$invalidate(11, signatureNameValue = $$props.signatureNameValue);
		if ('signatureCapacityValue' in $$props) $$invalidate(12, signatureCapacityValue = $$props.signatureCapacityValue);
		if ('signatureFiles' in $$props) $$invalidate(13, signatureFiles = $$props.signatureFiles);
		if ('locationValue' in $$props) $$invalidate(14, locationValue = $$props.locationValue);
		if ('dateValue' in $$props) $$invalidate(15, dateValue = $$props.dateValue);
		if ('pdfError' in $$props) $$invalidate(16, pdfError = $$props.pdfError);
		if ('previousTimeoutId' in $$props) previousTimeoutId = $$props.previousTimeoutId;
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*pdfBytes, $globalTaxFormData*/ 6291456) {
			{
				if (pdfBytes !== undefined) {
					setPdfUrl($globalTaxFormData);
				}
			}
		}
	};

	return [
		failedTestsError,
		selectedBrokers,
		downloadElement,
		embedElement,
		startDateValue,
		endDateValue,
		nationalRegistrationNumberValue,
		fullName,
		addressLine1Value,
		addressLine2Value,
		addressLine3Value,
		signatureNameValue,
		signatureCapacityValue,
		signatureFiles,
		locationValue,
		dateValue,
		pdfError,
		addSelectedBroker,
		setSelectedBroker,
		removeSelectedBroker,
		delayedPdfUpdate,
		pdfBytes,
		$globalTaxFormData,
		input0_input_handler,
		input1_input_handler,
		input2_input_handler,
		input3_input_handler,
		input4_input_handler,
		input5_input_handler,
		input6_input_handler,
		input7_input_handler,
		input8_input_handler,
		input9_input_handler,
		input10_input_handler,
		input11_change_handler,
		click_handler,
		change_handler,
		click_handler_1,
		a_binding,
		click_handler_2,
		embed_binding
	];
}

class App extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1]);

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "App",
			options,
			id: create_fragment.name
		});
	}
}

const app = new App({
    target: document.body,
    props: {
        name: 'world'
    }
});

export { app as default };
//# sourceMappingURL=app.js.map
