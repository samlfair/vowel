(function () {
	'use strict';

	var DEV = false;

	var is_array = Array.isArray;
	var index_of = Array.prototype.indexOf;
	var includes = Array.prototype.includes;
	var array_from = Array.from;
	var define_property = Object.defineProperty;
	var get_descriptor = Object.getOwnPropertyDescriptor;
	var get_descriptors = Object.getOwnPropertyDescriptors;
	var object_prototype = Object.prototype;
	var array_prototype = Array.prototype;
	var get_prototype_of = Object.getPrototypeOf;
	var is_extensible = Object.isExtensible;
	const noop = () => {};
	function run_all(arr) {
		for (var i = 0; i < arr.length; i++) {
			arr[i]();
		}
	}
	function deferred() {
		var resolve;
		var reject;
		var promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return { promise, resolve, reject };
	}
	function to_array(value, n) {
		if (Array.isArray(value)) {
			return value;
		}
		if (!(Symbol.iterator in value)) {
			return Array.from(value);
		}
		const array = [];
		for (const element of value) {
			array.push(element);
			if (array.length === n) break;
		}
		return array;
	}

	const DERIVED = 1 << 1;
	const EFFECT = 1 << 2;
	const RENDER_EFFECT = 1 << 3;
	const MANAGED_EFFECT = 1 << 24;
	const BLOCK_EFFECT = 1 << 4;
	const BRANCH_EFFECT = 1 << 5;
	const ROOT_EFFECT = 1 << 6;
	const BOUNDARY_EFFECT = 1 << 7;
	const PAUSED = 1 << 8;
	const CONNECTED = 1 << 9;
	const CLEAN = 1 << 10;
	const DIRTY = 1 << 11;
	const MAYBE_DIRTY = 1 << 12;
	const INERT = 1 << 13;
	const DESTROYED = 1 << 14;
	const REACTION_RAN = 1 << 15;
	const DESTROYING = 1 << 25;
	const EFFECT_TRANSPARENT = 1 << 16;
	const EAGER_EFFECT = 1 << 17;
	const HEAD_EFFECT = 1 << 18;
	const EFFECT_PRESERVED = 1 << 19;
	const USER_EFFECT = 1 << 20;
	const EFFECT_OFFSCREEN = 1 << 25;
	const WAS_MARKED = 1 << 16;
	const REACTION_IS_UPDATING = 1 << 21;
	const ASYNC = 1 << 22;
	const ERROR_VALUE = 1 << 23;
	const STATE_SYMBOL = Symbol('$state');
	const COMPONENT_SYMBOL = Symbol('component');
	const LEGACY_PROPS = Symbol('legacy props');
	const LOADING_ATTR_SYMBOL = Symbol('');
	const ATTRIBUTES_CACHE = Symbol('attributes');
	const CLASS_CACHE = Symbol('class');
	const STYLE_CACHE = Symbol('style');
	const TEXT_CACHE = Symbol('text');
	const STALE_REACTION = new (class StaleReactionError extends Error {
		name = 'StaleReactionError';
		message = 'The reaction that called `getAbortSignal()` was re-run or destroyed';
	})();
	const IS_XHTML =
		!!globalThis.document?.contentType &&
		 globalThis.document.contentType.includes('xml');

	const EACH_ITEM_REACTIVE = 1;
	const EACH_INDEX_REACTIVE = 1 << 1;
	const EACH_IS_CONTROLLED = 1 << 2;
	const EACH_IS_ANIMATED = 1 << 3;
	const EACH_ITEM_IMMUTABLE = 1 << 4;
	const PROPS_IS_IMMUTABLE = 1;
	const PROPS_IS_RUNES = 1 << 1;
	const PROPS_IS_UPDATED = 1 << 2;
	const PROPS_IS_BINDABLE = 1 << 3;
	const PROPS_IS_LAZY_INITIAL = 1 << 4;
	const TEMPLATE_FRAGMENT = 1;
	const TEMPLATE_USE_IMPORT_NODE = 1 << 1;
	const UNINITIALIZED = Symbol('uninitialized');
	const NAMESPACE_HTML = 'http://www.w3.org/1999/xhtml';
	const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
	const NAMESPACE_MATHML = 'http://www.w3.org/1998/Math/MathML';
	const ATTACHMENT_KEY = '@attach';

	function derived_inert() {
		{
			console.warn(`https://svelte.dev/e/derived_inert`);
		}
	}
	function select_multiple_invalid_value() {
		{
			console.warn(`https://svelte.dev/e/select_multiple_invalid_value`);
		}
	}
	function svelte_boundary_reset_noop() {
		{
			console.warn(`https://svelte.dev/e/svelte_boundary_reset_noop`);
		}
	}

	function equals(value) {
		return value === this.v;
	}
	function safe_not_equal(a, b) {
		return a != a
			? b == b
			: a !== b || (a !== null && typeof a === 'object') || typeof a === 'function';
	}
	function safe_equals(value) {
		return !safe_not_equal(value, this.v);
	}

	function lifecycle_outside_component(name) {
		{
			throw new Error(`https://svelte.dev/e/lifecycle_outside_component`);
		}
	}

	function async_derived_orphan() {
		{
			throw new Error(`https://svelte.dev/e/async_derived_orphan`);
		}
	}
	function each_key_duplicate(a, b, value) {
		{
			throw new Error(`https://svelte.dev/e/each_key_duplicate`);
		}
	}
	function effect_in_teardown(rune) {
		{
			throw new Error(`https://svelte.dev/e/effect_in_teardown`);
		}
	}
	function effect_in_unowned_derived() {
		{
			throw new Error(`https://svelte.dev/e/effect_in_unowned_derived`);
		}
	}
	function effect_orphan(rune) {
		{
			throw new Error(`https://svelte.dev/e/effect_orphan`);
		}
	}
	function effect_update_depth_exceeded() {
		{
			throw new Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
		}
	}
	function props_invalid_value(key) {
		{
			throw new Error(`https://svelte.dev/e/props_invalid_value`);
		}
	}
	function state_descriptors_fixed() {
		{
			throw new Error(`https://svelte.dev/e/state_descriptors_fixed`);
		}
	}
	function state_prototype_fixed() {
		{
			throw new Error(`https://svelte.dev/e/state_prototype_fixed`);
		}
	}
	function state_unsafe_mutation() {
		{
			throw new Error(`https://svelte.dev/e/state_unsafe_mutation`);
		}
	}
	function svelte_boundary_reset_onerror() {
		{
			throw new Error(`https://svelte.dev/e/svelte_boundary_reset_onerror`);
		}
	}

	let legacy_mode_flag = false;
	let tracing_mode_flag = false;
	function enable_legacy_mode_flag() {
		legacy_mode_flag = true;
	}

	const empty$2 = [];
	function snapshot(value, skip_warning = false, no_tojson = false) {
		return clone(value, new Map(), '', empty$2, null, no_tojson);
	}
	function clone(value, cloned, path, paths, original = null, no_tojson = false) {
		if (typeof value === 'object' && value !== null) {
			var unwrapped = cloned.get(value);
			if (unwrapped !== undefined) return unwrapped;
			if (value instanceof Map) return  (new Map(value));
			if (value instanceof Set) return  (new Set(value));
			if (is_array(value)) {
				var copy =  (Array(value.length));
				cloned.set(value, copy);
				if (original !== null) {
					cloned.set(original, copy);
				}
				for (var i = 0; i < value.length; i += 1) {
					var element = value[i];
					if (i in value) {
						copy[i] = clone(element, cloned, path, paths, null, no_tojson);
					}
				}
				return copy;
			}
			if (get_prototype_of(value) === object_prototype) {
				copy = {};
				cloned.set(value, copy);
				if (original !== null) {
					cloned.set(original, copy);
				}
				for (var key of Object.keys(value)) {
					copy[key] = clone(
						value[key],
						cloned,
						path,
						paths,
						null,
						no_tojson
					);
				}
				return copy;
			}
			if (value instanceof Date) {
				value.getTime();
				return  (structuredClone(value));
			}
			if (typeof ( (value).toJSON) === 'function' && !no_tojson) {
				return clone(
					 (value).toJSON(),
					cloned,
					path,
					paths,
					value
				);
			}
		}
		if (value instanceof EventTarget) {
			return  (value);
		}
		try {
			return  (structuredClone(value));
		} catch (e) {
			return  (value);
		}
	}

	function get_parent_context(context) {
		let parent = context.p;
		while (parent !== null && parent.c === null) {
			parent = parent.p;
		}
		return parent?.c ?? null;
	}
	function get_or_init_context_map(context, name) {
		if (context === null) {
			lifecycle_outside_component();
		}
		return (context.c ??= new Map(get_parent_context(context) || undefined));
	}

	let component_context = null;
	function set_component_context(context) {
		component_context = context;
	}
	function getContext(key) {
		const context_map = get_or_init_context_map(component_context);
		const result =  (context_map.get(key));
		return result;
	}
	function setContext(key, context) {
		const context_map = get_or_init_context_map(component_context);
		context_map.set(key, context);
		return context;
	}
	function push(props, runes = false, fn) {
		component_context = {
			p: component_context,
			i: false,
			c: null,
			e: null,
			s: props,
			x: null,
			r:  (active_effect),
			l: legacy_mode_flag && !runes ? { s: null, u: null, $: [] } : null
		};
	}
	function pop(component) {
		var context =  (component_context);
		var effects = context.e;
		if (effects !== null) {
			context.e = null;
			for (var fn of effects) {
				create_user_effect(fn);
			}
		}
		if (component !== undefined) {
			context.x = component;
		}
		context.i = true;
		component_context = context.p;
		return mark_as_component(component);
	}
	function mark_as_component(component = {}) {
		define_property(component, COMPONENT_SYMBOL, { value: true });
		return component;
	}
	function is_runes() {
		return !legacy_mode_flag || (component_context !== null && component_context.l === null);
	}

	let micro_tasks = [];
	function run_micro_tasks() {
		var tasks = micro_tasks;
		micro_tasks = [];
		run_all(tasks);
	}
	function queue_micro_task(fn) {
		if (micro_tasks.length === 0 && !is_flushing_sync) {
			var tasks = micro_tasks;
			queueMicrotask(() => {
				if (tasks === micro_tasks) run_micro_tasks();
			});
		}
		micro_tasks.push(fn);
	}
	function flush_tasks() {
		while (micro_tasks.length > 0) {
			run_micro_tasks();
		}
	}

	const STATUS_MASK = -7169;
	function set_signal_status(signal, status) {
		signal.f = (signal.f & STATUS_MASK) | status;
	}
	function update_derived_status(derived) {
		if ((derived.f & CONNECTED) !== 0 || derived.deps === null) {
			set_signal_status(derived, CLEAN);
		} else {
			set_signal_status(derived, MAYBE_DIRTY);
		}
	}

	function clear_marked(deps) {
		if (deps === null) return;
		for (const dep of deps) {
			if ((dep.f & DERIVED) === 0 || (dep.f & WAS_MARKED) === 0) {
				continue;
			}
			dep.f ^= WAS_MARKED;
			clear_marked( (dep).deps);
		}
	}
	function defer_effect(effect, dirty_effects, maybe_dirty_effects) {
		if ((effect.f & DIRTY) !== 0) {
			dirty_effects.add(effect);
		} else if ((effect.f & MAYBE_DIRTY) !== 0) {
			maybe_dirty_effects.add(effect);
		}
		clear_marked(effect.deps);
		set_signal_status(effect, CLEAN);
	}

	let is_store_binding = false;
	function capture_store_binding(fn) {
		var previous_is_store_binding = is_store_binding;
		try {
			is_store_binding = false;
			return [fn(), is_store_binding];
		} finally {
			is_store_binding = previous_is_store_binding;
		}
	}

	function autofocus(dom, value) {
		if (value) {
			const body = document.body;
			dom.autofocus = true;
			queue_micro_task(() => {
				if (document.activeElement === body) {
					dom.focus();
				}
			});
		}
	}

	function without_reactive_context(fn) {
		var previous_reaction = active_reaction;
		var previous_effect = active_effect;
		set_active_reaction(null);
		set_active_effect(null);
		try {
			return fn();
		} finally {
			set_active_reaction(previous_reaction);
			set_active_effect(previous_effect);
		}
	}

	function flatten(blockers, sync, async, fn) {
		const d = is_runes() ? derived : derived_safe_equal;
		var pending = blockers.filter((b) => !b.settled);
		var deriveds = sync.map(d);
		if (async.length === 0 && pending.length === 0) {
			fn(deriveds);
			return;
		}
		var parent =  (active_effect);
		var restore = capture();
		var blocker_promise =
			pending.length === 1
				? pending[0].promise
				: pending.length > 1
					? Promise.all(pending.map((b) => b.promise))
					: null;
		function finish(async) {
			if ((parent.f & DESTROYED) !== 0) {
				return;
			}
			restore();
			try {
				fn([...deriveds, ...async]);
			} catch (error) {
				invoke_error_boundary(error, parent);
			}
			unset_context();
		}
		var decrement_pending = increment_pending();
		if (async.length === 0) {
			 (blocker_promise).then(() => finish([])).finally(decrement_pending);
			return;
		}
		function run() {
			Promise.all(async.map((expression) => async_derived(expression)))
				.then(finish)
				.catch((error) => invoke_error_boundary(error, parent))
				.finally(decrement_pending);
		}
		if (blocker_promise) {
			blocker_promise.then(() => {
				restore();
				run();
				unset_context();
			});
		} else {
			run();
		}
	}
	function capture() {
		var previous_effect =  (active_effect);
		var previous_reaction = active_reaction;
		var previous_component_context = component_context;
		var previous_batch =  (current_batch);
		return function restore(activate_batch = true) {
			set_active_effect(previous_effect);
			set_active_reaction(previous_reaction);
			set_component_context(previous_component_context);
			if (activate_batch && (previous_effect.f & DESTROYED) === 0) {
				previous_batch?.activate();
				previous_batch?.apply();
			}
		};
	}
	function unset_context(deactivate_batch = true) {
		set_active_effect(null);
		set_active_reaction(null);
		set_component_context(null);
		if (deactivate_batch) current_batch?.deactivate();
	}
	function increment_pending() {
		var effect =  (active_effect);
		var boundary = effect.b;
		var batch =  (current_batch);
		var blocking = !!boundary?.is_rendered();
		boundary?.update_pending_count(1, batch);
		batch.increment(blocking, effect);
		return () => {
			boundary?.update_pending_count(-1, batch);
			batch.decrement(blocking, effect);
		};
	}

	function derived(fn) {
		var flags = DERIVED | DIRTY;
		if (active_effect !== null) {
			active_effect.f |= EFFECT_PRESERVED;
		}
		const signal = {
			ctx: component_context,
			deps: null,
			effects: null,
			equals,
			f: flags,
			fn,
			reactions: null,
			rv: 0,
			v:  (UNINITIALIZED),
			wv: 0,
			parent: active_effect,
			ac: null
		};
		return signal;
	}
	const OBSOLETE = Symbol('obsolete');
	function async_derived(fn, label, location) {
		let parent =  (active_effect);
		if (parent === null) {
			async_derived_orphan();
		}
		var promise =  ( (undefined));
		var signal = source( (UNINITIALIZED));
		var should_suspend = !active_reaction;
		var deferreds = new Set();
		async_effect(() => {
			var effect =  (active_effect);
			var d = deferred();
			promise = d.promise;
			try {
				Promise.resolve(fn())
					.then(d.resolve, (e) => {
						if (e !== STALE_REACTION) d.reject(e);
					})
					.finally(unset_context);
			} catch (error) {
				d.reject(error);
				unset_context();
			}
			var batch =  (current_batch);
			if (should_suspend) {
				if ((effect.f & REACTION_RAN) !== 0) {
					var decrement_pending = increment_pending();
				}
				if (
					parent.b?.is_rendered()
				) {
					batch.async_deriveds.get(effect)?.reject(OBSOLETE);
				} else {
					for (const d of deferreds.values()) {
						d.reject(OBSOLETE);
					}
				}
				deferreds.add(d);
				batch.async_deriveds.set(effect, d);
			}
			const handler = (value, error = undefined) => {
				decrement_pending?.();
				deferreds.delete(d);
				if (error === OBSOLETE) return;
				batch.activate();
				if (error) {
					signal.f |= ERROR_VALUE;
					internal_set(signal, error);
				} else {
					if ((signal.f & ERROR_VALUE) !== 0) {
						signal.f ^= ERROR_VALUE;
					}
					internal_set(signal, value);
				}
				batch.deactivate();
			};
			d.promise.then(handler, (e) => handler(null, e || 'unknown'));
		});
		teardown(() => {
			for (const d of deferreds) {
				d.reject(OBSOLETE);
			}
		});
		return new Promise((fulfil) => {
			function next(p) {
				function go() {
					if (p === promise) {
						fulfil(signal);
					} else {
						next(promise);
					}
				}
				p.then(go, go);
			}
			next(promise);
		});
	}
	function user_derived(fn) {
		const d = derived(fn);
		push_reaction_value(d);
		return d;
	}
	function derived_safe_equal(fn) {
		const signal = derived(fn);
		signal.equals = safe_equals;
		return signal;
	}
	function destroy_derived_effects(derived) {
		var effects = derived.effects;
		if (effects !== null) {
			derived.effects = null;
			for (var i = 0; i < effects.length; i += 1) {
				destroy_effect( (effects[i]));
			}
		}
	}
	function execute_derived(derived) {
		var value;
		var prev_active_effect = active_effect;
		var parent = derived.parent;
		if (
			!is_destroying_effect &&
			parent !== null &&
			derived.v !== UNINITIALIZED &&
			(parent.f & (DESTROYED | INERT)) !== 0
		) {
			derived_inert();
			return derived.v;
		}
		set_active_effect(parent);
		{
			try {
				derived.f &= ~WAS_MARKED;
				destroy_derived_effects(derived);
				value = update_reaction(derived);
			} finally {
				set_active_effect(prev_active_effect);
			}
		}
		return value;
	}
	function update_derived(derived) {
		var value = execute_derived(derived);
		if (!derived.equals(value)) {
			derived.wv = increment_write_version();
			if (!current_batch?.is_fork || derived.deps === null) {
				if (current_batch !== null) {
					current_batch.capture(derived, value, true);
					previous_batch?.capture(derived, value, true);
				} else {
					derived.v = value;
				}
				if (derived.deps === null) {
					set_signal_status(derived, CLEAN);
					return;
				}
			}
		}
		if (is_destroying_effect) {
			return;
		}
		if (batch_values !== null) {
			if (effect_tracking() || current_batch?.is_fork) {
				batch_values.set(derived, value);
			}
		} else {
			update_derived_status(derived);
		}
	}
	function freeze_derived_effects(derived) {
		if (derived.effects === null) return;
		for (const e of derived.effects) {
			if (e.teardown || e.ac) {
				e.teardown?.();
				if (e.ac !== null) {
					without_reactive_context(() => {
						 (e.ac).abort(STALE_REACTION);
						e.ac = null;
					});
				}
				if (e.fn !== null) e.teardown = noop;
				remove_reactions(e, 0);
				destroy_effect_children(e);
			}
		}
	}
	function unfreeze_derived_effects(derived) {
		if (derived.effects === null) return;
		for (const e of derived.effects) {
			if (e.teardown && e.fn !== null) {
				update_effect(e);
			}
		}
	}

	let first_batch = null;
	let last_batch = null;
	let current_batch = null;
	let previous_batch = null;
	let batch_values = null;
	let last_scheduled_effect = null;
	let is_flushing_sync = false;
	let is_processing = false;
	let collected_effects = null;
	let legacy_updates = null;
	var flush_count = 0;
	var source_stacks = new Set();
	let uid = 1;
	class Batch {
		id = uid++;
		#started = false;
		linked = true;
		#prev = null;
		#next = null;
		async_deriveds = new Map();
		current = new Map();
		previous = new Map();
		#commit_callbacks = new Set();
		#discard_callbacks = new Set();
		#pending = 0;
		#blocking_pending = new Map();
		#deferred = null;
		#roots = [];
		#new_effects = [];
		#dirty_effects = new Set();
		#maybe_dirty_effects = new Set();
		#skipped_branches = new Map();
		#unskipped_branches = new Set();
		is_fork = false;
		#decrement_queued = false;
		constructor() {
			if (last_batch === null) {
				first_batch = last_batch = this;
			} else {
				last_batch.#next = this;
				this.#prev = last_batch;
			}
			last_batch = this;
		}
		#is_deferred() {
			if (this.is_fork) return true;
			for (const effect of this.#blocking_pending.keys()) {
				var e = effect;
				var skipped = false;
				while (e.parent !== null) {
					if (this.#skipped_branches.has(e)) {
						skipped = true;
						break;
					}
					e = e.parent;
				}
				if (!skipped) {
					return true;
				}
			}
			return false;
		}
		skip_effect(effect) {
			if (!this.#skipped_branches.has(effect)) {
				this.#skipped_branches.set(effect, { d: [], m: [] });
			}
			this.#unskipped_branches.delete(effect);
		}
		unskip_effect(effect, callback = (e) => this.schedule(e)) {
			var tracked = this.#skipped_branches.get(effect);
			if (tracked) {
				this.#skipped_branches.delete(effect);
				for (var e of tracked.d) {
					set_signal_status(e, DIRTY);
					callback(e);
				}
				for (e of tracked.m) {
					set_signal_status(e, MAYBE_DIRTY);
					callback(e);
				}
			}
			this.#unskipped_branches.add(effect);
		}
		#process() {
			this.#started = true;
			if (flush_count++ > 1000) {
				this.#unlink();
				infinite_loop_guard();
			}
			for (const e of this.#dirty_effects) {
				this.#maybe_dirty_effects.delete(e);
				set_signal_status(e, DIRTY);
				this.schedule(e);
			}
			for (const e of this.#maybe_dirty_effects) {
				set_signal_status(e, MAYBE_DIRTY);
				this.schedule(e);
			}
			const roots = this.#roots;
			this.#roots = [];
			this.apply();
			var effects = (collected_effects = []);
			var render_effects = [];
			var updates = (legacy_updates = []);
			for (const root of roots) {
				try {
					this.#traverse(root, effects, render_effects);
				} catch (e) {
					reset_all(root);
					if (!this.#is_deferred()) this.discard();
					throw e;
				}
			}
			current_batch = null;
			if (updates.length > 0) {
				var batch = Batch.ensure();
				for (const e of updates) {
					batch.schedule(e);
				}
			}
			collected_effects = null;
			legacy_updates = null;
			if (this.#is_deferred()) {
				this.#defer_effects(render_effects);
				this.#defer_effects(effects);
				for (const [e, t] of this.#skipped_branches) {
					reset_branch(e, t);
				}
				if (updates.length > 0) {
					 ( (current_batch)).#process();
				}
				return;
			}
			const earlier_batch = this.#find_earlier_batch();
			if (earlier_batch) {
				this.#defer_effects(render_effects);
				this.#defer_effects(effects);
				earlier_batch.#merge(this);
				return;
			}
			this.#dirty_effects.clear();
			this.#maybe_dirty_effects.clear();
			for (const fn of this.#commit_callbacks) fn(this);
			this.#commit_callbacks.clear();
			previous_batch = this;
			flush_queued_effects(render_effects);
			flush_queued_effects(effects);
			previous_batch = null;
			this.#deferred?.resolve();
			var next_batch =  ( (current_batch));
			if (this.#pending === 0 && (this.#roots.length === 0 || next_batch !== null)) {
				this.#unlink();
			}
			if (this.#roots.length > 0) {
				if (next_batch !== null) {
					const batch = next_batch;
					batch.#roots.push(...this.#roots.filter((r) => !batch.#roots.includes(r)));
				} else {
					next_batch = this;
				}
			}
			if (next_batch !== null) {
				old_values.clear();
				next_batch.#process();
			}
		}
		#traverse(root, effects, render_effects) {
			root.f ^= CLEAN;
			var effect = root.first;
			while (effect !== null) {
				var flags = effect.f;
				var is_branch = (flags & (BRANCH_EFFECT | ROOT_EFFECT)) !== 0;
				var is_skippable_branch = is_branch && (flags & CLEAN) !== 0;
				var skip = is_skippable_branch || (flags & INERT) !== 0 || this.#skipped_branches.has(effect);
				if (!skip && effect.fn !== null) {
					if (is_branch) {
						effect.f ^= CLEAN;
					} else if ((flags & EFFECT) !== 0) {
						effects.push(effect);
					} else if (is_dirty(effect)) {
						if ((flags & BLOCK_EFFECT) !== 0) this.#maybe_dirty_effects.add(effect);
						update_effect(effect);
					}
					var child = effect.first;
					if (child !== null) {
						effect = child;
						continue;
					}
				}
				while (effect !== null) {
					var next = effect.next;
					if (next !== null) {
						effect = next;
						break;
					}
					effect = effect.parent;
				}
			}
		}
		#find_earlier_batch() {
			var batch = this.#prev;
			while (batch !== null) {
				if (!batch.is_fork) {
					for (const [value, [, is_derived]] of this.current) {
						if (batch.current.has(value) && !is_derived) {
							return batch;
						}
					}
				}
				batch = batch.#prev;
			}
			return null;
		}
		#merge(batch) {
			for (const [source, value] of batch.current) {
				if (!this.previous.has(source) && batch.previous.has(source)) {
					this.previous.set(source, batch.previous.get(source));
				}
				this.current.set(source, value);
			}
			for (const [effect, deferred] of batch.async_deriveds) {
				const d = this.async_deriveds.get(effect);
				if (d) deferred.promise.then(d.resolve).catch(d.reject);
			}
			batch.async_deriveds.clear();
			this.transfer_effects(batch.#dirty_effects, batch.#maybe_dirty_effects);
			const mark = (value) => {
				var reactions = value.reactions;
				if (reactions === null) return;
				if ((value.f & DERIVED) !== 0 && (value.f & (DIRTY | MAYBE_DIRTY)) === 0) {
					return;
				}
				for (const reaction of reactions) {
					var flags = reaction.f;
					if ((flags & DERIVED) !== 0) {
						mark( (reaction));
					} else {
						var effect =  (reaction);
						if (flags & (ASYNC | BLOCK_EFFECT) && !this.async_deriveds.has(effect)) {
							this.#maybe_dirty_effects.delete(effect);
							set_signal_status(effect, DIRTY);
							this.schedule(effect);
						}
					}
				}
			};
			for (const source of this.current.keys()) {
				mark(source);
			}
			this.oncommit(() => batch.discard());
			batch.#unlink();
			current_batch = this;
			this.#process();
		}
		#defer_effects(effects) {
			for (var i = 0; i < effects.length; i += 1) {
				defer_effect(effects[i], this.#dirty_effects, this.#maybe_dirty_effects);
			}
		}
		capture(source, value, is_derived = false) {
			if (source.v !== UNINITIALIZED && !this.previous.has(source)) {
				this.previous.set(source, source.v);
			}
			if ((source.f & ERROR_VALUE) === 0) {
				this.current.set(source, [value, is_derived]);
				batch_values?.set(source, value);
			}
			if (!this.is_fork) {
				source.v = value;
			}
		}
		activate() {
			current_batch = this;
		}
		deactivate() {
			current_batch = null;
			batch_values = null;
		}
		flush() {
			try {
				if (DEV) ;
				is_processing = true;
				current_batch = this;
				this.#process();
			} finally {
				flush_count = 0;
				last_scheduled_effect = null;
				collected_effects = null;
				legacy_updates = null;
				is_processing = false;
				current_batch = null;
				batch_values = null;
				old_values.clear();
			}
		}
		discard() {
			for (const fn of this.#discard_callbacks) fn(this);
			this.#discard_callbacks.clear();
			for (const deferred of this.async_deriveds.values()) {
				deferred.reject(OBSOLETE);
			}
			this.#unlink();
			this.#deferred?.resolve();
		}
		register_created_effect(effect) {
			this.#new_effects.push(effect);
		}
		#commit() {
			for (let batch = first_batch; batch !== null; batch = batch.#next) {
				var is_earlier = batch.id < this.id;
				var sources = [];
				for (const [source, [value, is_derived]] of this.current) {
					if (batch.current.has(source)) {
						var batch_value =  (batch.current.get(source))[0];
						if (is_earlier && value !== batch_value) {
							batch.current.set(source, [value, is_derived]);
						} else {
							continue;
						}
					}
					sources.push(source);
				}
				if (is_earlier) {
					for (const [effect, deferred] of this.async_deriveds) {
						const d = batch.async_deriveds.get(effect);
						if (d) deferred.promise.then(d.resolve).catch(d.reject);
					}
				}
				var current = [...batch.current.keys()].filter(
					(source) => !( (batch.current.get(source))[1])
				);
				if (!batch.#started || current.length === 0) continue;
				var others = current.filter((source) => !this.current.has(source));
				if (others.length === 0) {
					if (is_earlier) {
						batch.discard();
					}
				} else if (sources.length > 0) {
					if (is_earlier) {
						for (const unskipped of this.#unskipped_branches) {
							batch.unskip_effect(unskipped, (e) => {
								if ((e.f & (BLOCK_EFFECT | ASYNC)) !== 0) {
									batch.schedule(e);
								} else {
									batch.#defer_effects([e]);
								}
							});
						}
					}
					batch.activate();
					var marked = new Set();
					var checked = new Map();
					for (var source of sources) {
						mark_effects(source, others, marked, checked);
					}
					checked = new Map();
					var current_unequal = [...batch.current]
						.filter(([c, v1]) => {
							const v2 = this.current.get(c);
							if (!v2) return true;
							return v2[0] !== v1[0] || v2[1] !== v1[1];
						})
						.map(([c]) => c);
					if (current_unequal.length > 0) {
						for (const effect of this.#new_effects) {
							if (
								(effect.f & (DESTROYED | INERT | EAGER_EFFECT)) === 0 &&
								depends_on(effect, current_unequal, checked)
							) {
								if ((effect.f & (ASYNC | BLOCK_EFFECT)) !== 0) {
									set_signal_status(effect, DIRTY);
									batch.schedule(effect);
								} else {
									batch.#dirty_effects.add(effect);
								}
							}
						}
					}
					if (batch.#roots.length > 0 && !batch.#decrement_queued) {
						batch.apply();
						for (var root of batch.#roots) {
							batch.#traverse(root, [], []);
						}
						batch.#roots = [];
					}
					batch.deactivate();
				}
			}
		}
		increment(blocking, effect) {
			this.#pending += 1;
			if (blocking) {
				let blocking_pending_count = this.#blocking_pending.get(effect) ?? 0;
				this.#blocking_pending.set(effect, blocking_pending_count + 1);
			}
		}
		decrement(blocking, effect) {
			this.#pending -= 1;
			if (blocking) {
				let blocking_pending_count = this.#blocking_pending.get(effect) ?? 0;
				if (blocking_pending_count === 1) {
					this.#blocking_pending.delete(effect);
				} else {
					this.#blocking_pending.set(effect, blocking_pending_count - 1);
				}
			}
			if (this.#decrement_queued) return;
			this.#decrement_queued = true;
			queue_micro_task(() => {
				this.#decrement_queued = false;
				if (this.linked) {
					this.flush();
				}
			});
		}
		transfer_effects(dirty_effects, maybe_dirty_effects) {
			for (const e of dirty_effects) {
				this.#dirty_effects.add(e);
			}
			for (const e of maybe_dirty_effects) {
				this.#maybe_dirty_effects.add(e);
			}
			dirty_effects.clear();
			maybe_dirty_effects.clear();
		}
		oncommit(fn) {
			this.#commit_callbacks.add(fn);
		}
		ondiscard(fn) {
			this.#discard_callbacks.add(fn);
		}
		settled() {
			return (this.#deferred ??= deferred()).promise;
		}
		static ensure() {
			if (current_batch === null) {
				const batch = (current_batch = new Batch());
				if (!is_processing && !is_flushing_sync) {
					queue_micro_task(() => {
						if (!batch.#started) {
							batch.flush();
						}
					});
				}
			}
			return current_batch;
		}
		apply() {
			{
				batch_values = null;
				return;
			}
		}
		schedule(effect) {
			last_scheduled_effect = effect;
			if (
				effect.b?.is_pending &&
				(effect.f & (EFFECT | RENDER_EFFECT | MANAGED_EFFECT)) !== 0 &&
				(effect.f & REACTION_RAN) === 0
			) {
				effect.b.defer_effect(effect);
				return;
			}
			var e = effect;
			while (e.parent !== null) {
				e = e.parent;
				var flags = e.f;
				if (collected_effects !== null && e === active_effect) {
					if (
						(active_reaction === null || (active_reaction.f & DERIVED) === 0) &&
						true
					) {
						return;
					}
				}
				if ((flags & (ROOT_EFFECT | BRANCH_EFFECT)) !== 0) {
					if ((flags & CLEAN) === 0) {
						return;
					}
					e.f ^= CLEAN;
				}
			}
			this.#roots.push(e);
		}
		#unlink() {
			if (!this.linked) return;
			var prev = this.#prev;
			var next = this.#next;
			if (prev === null) {
				first_batch = next;
			} else {
				prev.#next = next;
			}
			if (next === null) {
				last_batch = prev;
			} else {
				next.#prev = prev;
			}
			this.linked = false;
		}
	}
	function flushSync(fn) {
		var was_flushing_sync = is_flushing_sync;
		is_flushing_sync = true;
		try {
			var result;
			if (fn) {
				if (current_batch !== null && !current_batch.is_fork) {
					current_batch.flush();
				}
				result = fn();
			}
			while (true) {
				flush_tasks();
				if (current_batch === null) {
					return  (result);
				}
				current_batch.flush();
			}
		} finally {
			is_flushing_sync = was_flushing_sync;
		}
	}
	function infinite_loop_guard() {
		try {
			effect_update_depth_exceeded();
		} catch (error) {
			invoke_error_boundary(error, last_scheduled_effect);
		}
	}
	let eager_block_effects = null;
	function flush_queued_effects(effects) {
		var length = effects.length;
		if (length === 0) return;
		var i = 0;
		while (i < length) {
			var effect = effects[i++];
			if ((effect.f & (DESTROYED | INERT)) === 0 && is_dirty(effect)) {
				eager_block_effects = new Set();
				update_effect(effect);
				if (
					effect.deps === null &&
					effect.first === null &&
					effect.nodes === null &&
					effect.teardown === null &&
					effect.ac === null
				) {
					unlink_effect(effect);
				}
				if (eager_block_effects?.size > 0) {
					old_values.clear();
					for (const e of eager_block_effects) {
						if ((e.f & (DESTROYED | INERT)) !== 0) continue;
						const ordered_effects = [e];
						let ancestor = e.parent;
						while (ancestor !== null) {
							if (eager_block_effects.has(ancestor)) {
								eager_block_effects.delete(ancestor);
								ordered_effects.push(ancestor);
							}
							ancestor = ancestor.parent;
						}
						for (let j = ordered_effects.length - 1; j >= 0; j--) {
							const e = ordered_effects[j];
							if ((e.f & (DESTROYED | INERT)) !== 0) continue;
							update_effect(e);
						}
					}
					eager_block_effects.clear();
				}
			}
		}
		eager_block_effects = null;
	}
	function mark_effects(value, sources, marked, checked) {
		if (marked.has(value)) return;
		marked.add(value);
		if (value.reactions !== null) {
			for (const reaction of value.reactions) {
				const flags = reaction.f;
				if ((flags & DERIVED) !== 0) {
					mark_effects( (reaction), sources, marked, checked);
				} else if (
					(flags & (ASYNC | BLOCK_EFFECT)) !== 0 &&
					(flags & DIRTY) === 0 &&
					depends_on(reaction, sources, checked)
				) {
					set_signal_status(reaction, DIRTY);
					schedule_effect( (reaction));
				}
			}
		}
	}
	function depends_on(reaction, sources, checked) {
		const depends = checked.get(reaction);
		if (depends !== undefined) return depends;
		if (reaction.deps !== null) {
			for (const dep of reaction.deps) {
				if (includes.call(sources, dep)) {
					return true;
				}
				if ((dep.f & DERIVED) !== 0 && depends_on( (dep), sources, checked)) {
					checked.set( (dep), true);
					return true;
				}
			}
		}
		checked.set(reaction, false);
		return false;
	}
	function schedule_effect(effect) {
		 (current_batch).schedule(effect);
	}
	function reset_branch(effect, tracked) {
		if ((effect.f & BRANCH_EFFECT) !== 0 && (effect.f & CLEAN) !== 0) {
			return;
		}
		if ((effect.f & DIRTY) !== 0) {
			tracked.d.push(effect);
		} else if ((effect.f & MAYBE_DIRTY) !== 0) {
			tracked.m.push(effect);
		}
		set_signal_status(effect, CLEAN);
		var e = effect.first;
		while (e !== null) {
			reset_branch(e, tracked);
			e = e.next;
		}
	}
	function reset_all(effect) {
		set_signal_status(effect, CLEAN);
		var e = effect.first;
		while (e !== null) {
			reset_all(e);
			e = e.next;
		}
	}

	let eager_effects = new Set();
	const old_values = new Map();
	let eager_effects_deferred = false;
	function source(v, stack) {
		var signal = {
			f: 0,
			v,
			reactions: null,
			equals,
			rv: 0,
			wv: 0
		};
		return signal;
	}
	function state(v, stack) {
		const s = source(v);
		push_reaction_value(s);
		return s;
	}
	function mutable_source(initial_value, immutable = false, trackable = true) {
		const s = source(initial_value);
		if (!immutable) {
			s.equals = safe_equals;
		}
		if (legacy_mode_flag && trackable && component_context !== null && component_context.l !== null) {
			(component_context.l.s ??= []).push(s);
		}
		return s;
	}
	function set$1(source, value, should_proxy = false) {
		if (
			active_reaction !== null &&
			(!untracking || (active_reaction.f & EAGER_EFFECT) !== 0) &&
			is_runes() &&
			(active_reaction.f & (DERIVED | BLOCK_EFFECT | ASYNC | EAGER_EFFECT)) !== 0 &&
			(current_sources === null || !current_sources.has(source))
		) {
			state_unsafe_mutation();
		}
		let new_value = should_proxy ? proxy(value) : value;
		return internal_set(source, new_value, legacy_updates);
	}
	function internal_set(source, value, updated_during_traversal = null) {
		if (!source.equals(value)) {
			if (is_destroying_effect) {
				old_values.set(source, value);
			} else if (!old_values.has(source)) {
				old_values.set(source, source.v);
			}
			var batch = Batch.ensure();
			batch.capture(source, value);
			if ((source.f & DERIVED) !== 0) {
				const derived =  (source);
				if ((source.f & DIRTY) !== 0) {
					execute_derived(derived);
				}
				if (batch_values === null) {
					update_derived_status(derived);
				}
			}
			source.wv = increment_write_version();
			mark_reactions(source, DIRTY, updated_during_traversal);
			if (
				is_runes() &&
				active_effect !== null &&
				(active_effect.f & CLEAN) !== 0 &&
				(active_effect.f & (BRANCH_EFFECT | ROOT_EFFECT)) === 0
			) {
				if (untracked_writes === null) {
					set_untracked_writes([source]);
				} else {
					untracked_writes.push(source);
				}
			}
			if (!batch.is_fork && eager_effects.size > 0 && !eager_effects_deferred) {
				flush_eager_effects();
			}
		}
		return value;
	}
	function flush_eager_effects() {
		eager_effects_deferred = false;
		for (const effect of eager_effects) {
			if ((effect.f & CLEAN) !== 0) {
				set_signal_status(effect, MAYBE_DIRTY);
			}
			let dirty;
			try {
				dirty = is_dirty(effect);
			} catch {
				dirty = true;
			}
			if (dirty) {
				update_effect(effect);
			}
		}
		eager_effects.clear();
	}
	function increment(source) {
		set$1(source, source.v + 1);
	}
	function mark_reactions(signal, status, updated_during_traversal) {
		var reactions = signal.reactions;
		if (reactions === null) return;
		var runes = is_runes();
		var length = reactions.length;
		for (var i = 0; i < length; i++) {
			var reaction = reactions[i];
			var flags = reaction.f;
			if (!runes && reaction === active_effect) continue;
			var not_dirty = (flags & DIRTY) === 0;
			if (not_dirty) {
				set_signal_status(reaction, status);
			}
			if ((flags & EAGER_EFFECT) !== 0) {
				eager_effects.add( (reaction));
			} else if ((flags & DERIVED) !== 0) {
				var derived =  (reaction);
				batch_values?.delete(derived);
				if ((flags & WAS_MARKED) === 0) {
					if (
						flags & CONNECTED &&
						(active_effect === null || (active_effect.f & REACTION_IS_UPDATING) === 0)
					) {
						reaction.f |= WAS_MARKED;
					}
					mark_reactions(derived, MAYBE_DIRTY, updated_during_traversal);
				}
			} else if (not_dirty) {
				var effect =  (reaction);
				if ((flags & BLOCK_EFFECT) !== 0 && eager_block_effects !== null) {
					eager_block_effects.add(effect);
				}
				if (updated_during_traversal !== null) {
					updated_during_traversal.push(effect);
				} else {
					schedule_effect(effect);
				}
			}
		}
	}

	function proxy(value) {
		if (
			typeof value !== 'object' ||
			value === null ||
			STATE_SYMBOL in value ||
			COMPONENT_SYMBOL in value
		) {
			return value;
		}
		const prototype = get_prototype_of(value);
		if (prototype !== object_prototype && prototype !== array_prototype) {
			return value;
		}
		var sources = new Map();
		var is_proxied_array = is_array(value);
		var version = state(0);
		var parent_version = update_version;
		var with_parent = (fn) => {
			if (update_version === parent_version) {
				return fn();
			}
			var reaction = active_reaction;
			var version = update_version;
			set_active_reaction(null);
			set_update_version(parent_version);
			var result = fn();
			set_active_reaction(reaction);
			set_update_version(version);
			return result;
		};
		if (is_proxied_array) {
			sources.set('length', state( (value).length));
		}
		return new Proxy( (value), {
			defineProperty(_, prop, descriptor) {
				if (
					!('value' in descriptor) ||
					descriptor.configurable === false ||
					descriptor.enumerable === false ||
					descriptor.writable === false
				) {
					state_descriptors_fixed();
				}
				var s = sources.get(prop);
				if (s === undefined) {
					with_parent(() => {
						var s = state(descriptor.value);
						sources.set(prop, s);
						return s;
					});
				} else {
					set$1(s, descriptor.value, true);
				}
				return true;
			},
			deleteProperty(target, prop) {
				var s = sources.get(prop);
				if (s === undefined) {
					if (prop in target) {
						const s = with_parent(() => state(UNINITIALIZED));
						sources.set(prop, s);
						increment(version);
					}
				} else {
					set$1(s, UNINITIALIZED);
					increment(version);
				}
				return true;
			},
			get(target, prop, receiver) {
				if (prop === STATE_SYMBOL) {
					return value;
				}
				var s = sources.get(prop);
				var exists = prop in target;
				if (s === undefined && (!exists || get_descriptor(target, prop)?.writable)) {
					s = with_parent(() => {
						var p = proxy(exists ? target[prop] : UNINITIALIZED);
						var s = state(p);
						return s;
					});
					sources.set(prop, s);
				}
				if (s !== undefined) {
					var v = get$1(s);
					return v === UNINITIALIZED ? undefined : v;
				}
				return Reflect.get(target, prop, receiver);
			},
			getOwnPropertyDescriptor(target, prop) {
				var descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
				if (descriptor && 'value' in descriptor) {
					var s = sources.get(prop);
					if (s) descriptor.value = get$1(s);
				} else if (descriptor === undefined) {
					var source = sources.get(prop);
					var value = source?.v;
					if (source !== undefined && value !== UNINITIALIZED) {
						return {
							enumerable: true,
							configurable: true,
							value,
							writable: true
						};
					}
				}
				return descriptor;
			},
			has(target, prop) {
				if (prop === STATE_SYMBOL) {
					return true;
				}
				var s = sources.get(prop);
				var has = (s !== undefined && s.v !== UNINITIALIZED) || Reflect.has(target, prop);
				if (
					s !== undefined ||
					(active_effect !== null && (!has || get_descriptor(target, prop)?.writable))
				) {
					if (s === undefined) {
						s = with_parent(() => {
							var p = has ? proxy(target[prop]) : UNINITIALIZED;
							var s = state(p);
							return s;
						});
						sources.set(prop, s);
					}
					var value = get$1(s);
					if (value === UNINITIALIZED) {
						return false;
					}
				}
				return has;
			},
			set(target, prop, value, receiver) {
				var s = sources.get(prop);
				var has = prop in target;
				if (is_proxied_array && prop === 'length') {
					for (var i = value; i <  (s).v; i += 1) {
						var other_s = sources.get(i + '');
						if (other_s !== undefined) {
							set$1(other_s, UNINITIALIZED);
						} else if (i in target) {
							other_s = with_parent(() => state(UNINITIALIZED));
							sources.set(i + '', other_s);
						}
					}
				}
				if (s === undefined) {
					if (!has || get_descriptor(target, prop)?.writable) {
						s = with_parent(() => state(undefined));
						set$1(s, proxy(value));
						sources.set(prop, s);
					}
				} else {
					has = s.v !== UNINITIALIZED;
					var p = with_parent(() => proxy(value));
					set$1(s, p);
				}
				var descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
				if (descriptor?.set) {
					descriptor.set.call(receiver, value);
				}
				if (!has) {
					if (is_proxied_array && typeof prop === 'string') {
						var ls =  (sources.get('length'));
						var n = Number(prop);
						if (Number.isInteger(n) && n >= ls.v) {
							set$1(ls, n + 1);
						}
					}
					increment(version);
				}
				return true;
			},
			ownKeys(target) {
				get$1(version);
				var own_keys = Reflect.ownKeys(target).filter((key) => {
					var source = sources.get(key);
					return source === undefined || source.v !== UNINITIALIZED;
				});
				for (var [key, source] of sources) {
					if (source.v !== UNINITIALIZED && !(key in target)) {
						own_keys.push(key);
					}
				}
				return own_keys;
			},
			setPrototypeOf() {
				state_prototype_fixed();
			}
		});
	}
	function get_proxied_value(value) {
		try {
			if (value !== null && typeof value === 'object' && STATE_SYMBOL in value) {
				return value[STATE_SYMBOL];
			}
		} catch {
		}
		return value;
	}
	function is(a, b) {
		return Object.is(get_proxied_value(a), get_proxied_value(b));
	}

	var $window;
	var $document;
	var is_firefox;
	var first_child_getter;
	var next_sibling_getter;
	function init_operations() {
		if ($window !== undefined) {
			return;
		}
		$window = window;
		$document = document;
		is_firefox = /Firefox/.test(navigator.userAgent);
		var element_prototype = Element.prototype;
		var node_prototype = Node.prototype;
		var text_prototype = Text.prototype;
		first_child_getter = get_descriptor(node_prototype, 'firstChild').get;
		next_sibling_getter = get_descriptor(node_prototype, 'nextSibling').get;
		if (is_extensible(element_prototype)) {
			 (element_prototype)[CLASS_CACHE] = undefined;
			 (element_prototype)[ATTRIBUTES_CACHE] = null;
			 (element_prototype)[STYLE_CACHE] = undefined;
			element_prototype.__e = undefined;
		}
		if (is_extensible(text_prototype)) {
			 (text_prototype)[TEXT_CACHE] = undefined;
		}
	}
	function create_text(value = '') {
		return document.createTextNode(value);
	}
	function get_first_child(node) {
		return  (first_child_getter.call(node));
	}
	function get_next_sibling(node) {
		return  (next_sibling_getter.call(node));
	}
	function child(node, is_text) {
		{
			return get_first_child(node);
		}
	}
	function first_child(node, is_text = false) {
		{
			var first = get_first_child(node);
			if (first instanceof Comment && first.data === '') return get_next_sibling(first);
			return first;
		}
	}
	function only_child(node, is_text = false) {
		{
			return get_first_child(node);
		}
	}
	function sibling(node, count = 1, is_text = false) {
		let next_sibling = node;
		while (count--) {
			next_sibling =  (get_next_sibling(next_sibling));
		}
		{
			return next_sibling;
		}
	}
	function clear_text_content(node) {
		node.textContent = '';
	}
	function should_defer_append() {
		return false;
	}
	function create_element(tag, namespace, is) {
		if (namespace == null || namespace === NAMESPACE_HTML) {
			return  (
				is ? document.createElement(tag, { is }) : document.createElement(tag)
			);
		}
		return  (
			is ? document.createElementNS(namespace, tag, { is }) : document.createElementNS(namespace, tag)
		);
	}

	function handle_error(error) {
		var effect = active_effect;
		if (effect === null) {
			 (active_reaction).f |= ERROR_VALUE;
			return error;
		}
		if ((effect.f & REACTION_RAN) === 0 && (effect.f & EFFECT) === 0) {
			throw error;
		}
		invoke_error_boundary(error, effect);
	}
	function invoke_error_boundary(error, effect) {
		if (effect !== null && (effect.f & DESTROYED) !== 0) {
			return;
		}
		while (effect !== null) {
			if ((effect.f & BOUNDARY_EFFECT) !== 0 && (effect.f & (DESTROYED | DESTROYING)) === 0) {
				if ((effect.f & REACTION_RAN) === 0) {
					throw error;
				}
				try {
					 (effect.b).error(error);
					return;
				} catch (e) {
					error = e;
				}
			}
			effect = effect.parent;
		}
		throw error;
	}

	function validate_effect(rune) {
		if (active_effect === null) {
			if (active_reaction === null) {
				effect_orphan();
			}
			effect_in_unowned_derived();
		}
		if (is_destroying_effect) {
			effect_in_teardown();
		}
	}
	function push_effect(effect, parent_effect) {
		var parent_last = parent_effect.last;
		if (parent_last === null) {
			parent_effect.last = parent_effect.first = effect;
		} else {
			parent_last.next = effect;
			effect.prev = parent_last;
			parent_effect.last = effect;
		}
	}
	function create_effect(type, fn) {
		var parent = active_effect;
		if (parent !== null && (parent.f & INERT) !== 0) {
			type |= INERT;
		}
		var effect = {
			ctx: component_context,
			deps: null,
			nodes: null,
			f: type | DIRTY | CONNECTED,
			first: null,
			fn,
			last: null,
			next: null,
			parent,
			b: parent && parent.b,
			prev: null,
			teardown: null,
			wv: 0,
			ac: null
		};
		current_batch?.register_created_effect(effect);
		var e = effect;
		if ((type & EFFECT) !== 0) {
			if (collected_effects !== null) {
				collected_effects.push(effect);
			} else {
				Batch.ensure().schedule(effect);
			}
		} else if (fn !== null) {
			try {
				update_effect(effect);
			} catch (e) {
				destroy_effect(effect);
				throw e;
			}
			if (
				e.deps === null &&
				e.teardown === null &&
				e.nodes === null &&
				e.first === e.last &&
				(e.f & EFFECT_PRESERVED) === 0
			) {
				e = e.first;
				if ((type & BLOCK_EFFECT) !== 0 && (type & EFFECT_TRANSPARENT) !== 0 && e !== null) {
					e.f |= EFFECT_TRANSPARENT;
				}
			}
		}
		if (e !== null) {
			e.parent = parent;
			if (parent !== null) {
				push_effect(e, parent);
			}
			if (
				active_reaction !== null &&
				(active_reaction.f & DERIVED) !== 0 &&
				(type & ROOT_EFFECT) === 0
			) {
				var derived =  (active_reaction);
				(derived.effects ??= []).push(e);
			}
		}
		return effect;
	}
	function effect_tracking() {
		return active_reaction !== null && !untracking;
	}
	function teardown(fn) {
		const effect = create_effect(RENDER_EFFECT, null);
		set_signal_status(effect, CLEAN);
		effect.teardown = fn;
		return effect;
	}
	function user_effect(fn) {
		validate_effect();
		var flags =  (active_effect).f;
		var defer =
			!active_reaction &&
			(flags & BRANCH_EFFECT) !== 0 &&
			component_context !== null &&
			!component_context.i;
		if (defer) {
			var context =  (component_context);
			(context.e ??= []).push(fn);
		} else {
			return create_user_effect(fn);
		}
	}
	function create_user_effect(fn) {
		return create_effect(EFFECT | USER_EFFECT, fn);
	}
	function component_root(fn) {
		Batch.ensure();
		const effect = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn);
		return (options = {}) => {
			return new Promise((fulfil) => {
				if (options.outro) {
					pause_effect(effect, () => {
						destroy_effect(effect);
						fulfil(undefined);
					});
				} else {
					destroy_effect(effect);
					fulfil(undefined);
				}
			});
		};
	}
	function effect(fn) {
		return create_effect(EFFECT, fn);
	}
	function async_effect(fn) {
		return create_effect(ASYNC | EFFECT_PRESERVED, fn);
	}
	function render_effect(fn, flags = 0) {
		return create_effect(RENDER_EFFECT | flags, fn);
	}
	function template_effect(fn, sync = [], async = [], blockers = []) {
		flatten(blockers, sync, async, (values) => {
			create_effect(RENDER_EFFECT, () => {
				fn(...values.map(get$1));
			});
		});
	}
	function block(fn, flags = 0) {
		var effect = create_effect(BLOCK_EFFECT | flags, fn);
		return effect;
	}
	function managed(fn, flags = 0) {
		var effect = create_effect(MANAGED_EFFECT | flags, fn);
		return effect;
	}
	function branch(fn) {
		return create_effect(BRANCH_EFFECT | EFFECT_PRESERVED, fn);
	}
	function execute_effect_teardown(effect) {
		var teardown = effect.teardown;
		if (teardown !== null) {
			const previously_destroying_effect = is_destroying_effect;
			const previous_reaction = active_reaction;
			set_is_destroying_effect(true);
			set_active_reaction(null);
			try {
				teardown.call(null);
			} catch (error) {
				invoke_error_boundary(error, effect.parent);
			} finally {
				set_is_destroying_effect(previously_destroying_effect);
				set_active_reaction(previous_reaction);
			}
		}
	}
	function destroy_effect_children(signal, remove_dom = false) {
		var effect = signal.first;
		signal.first = signal.last = null;
		while (effect !== null) {
			const controller = effect.ac;
			if (controller !== null) {
				without_reactive_context(() => {
					controller.abort(STALE_REACTION);
				});
			}
			var next = effect.next;
			if ((effect.f & ROOT_EFFECT) !== 0) {
				effect.parent = null;
			} else {
				destroy_effect(effect, remove_dom);
			}
			effect = next;
		}
	}
	function destroy_block_effect_children(signal) {
		var effect = signal.first;
		while (effect !== null) {
			var next = effect.next;
			if ((effect.f & BRANCH_EFFECT) === 0) {
				destroy_effect(effect);
			}
			effect = next;
		}
	}
	function destroy_effect(effect, remove_dom = true) {
		var removed = false;
		if (
			(remove_dom || (effect.f & HEAD_EFFECT) !== 0) &&
			effect.nodes !== null &&
			effect.nodes.end !== null
		) {
			remove_effect_dom(effect.nodes.start,  (effect.nodes.end));
			removed = true;
		}
		effect.f |= DESTROYING;
		destroy_effect_children(effect, remove_dom && !removed);
		remove_reactions(effect, 0);
		var transitions = effect.nodes && effect.nodes.t;
		if (transitions !== null) {
			for (const transition of transitions) {
				transition.stop();
			}
		}
		execute_effect_teardown(effect);
		effect.f ^= DESTROYING;
		effect.f |= DESTROYED;
		var parent = effect.parent;
		if (parent !== null && parent.first !== null) {
			unlink_effect(effect);
		}
		effect.next =
			effect.prev =
			effect.teardown =
			effect.ctx =
			effect.deps =
			effect.fn =
			effect.nodes =
			effect.ac =
			effect.b =
				null;
	}
	function remove_effect_dom(node, end) {
		while (node !== null) {
			var next = node === end ? null : get_next_sibling(node);
			node.remove();
			node = next;
		}
	}
	function unlink_effect(effect) {
		var parent = effect.parent;
		var prev = effect.prev;
		var next = effect.next;
		if (prev !== null) prev.next = next;
		if (next !== null) next.prev = prev;
		if (parent !== null) {
			if (parent.first === effect) parent.first = next;
			if (parent.last === effect) parent.last = prev;
		}
	}
	function pause_effect(effect, callback, destroy = true) {
		var transitions = [];
		effect.f |= PAUSED;
		pause_children(effect, transitions, true);
		var fn = () => {
			if (destroy) destroy_effect(effect);
			if (callback) callback();
		};
		var remaining = transitions.length;
		if (remaining > 0) {
			var check = () => --remaining || fn();
			for (var transition of transitions) {
				transition.out(check);
			}
		} else {
			fn();
		}
	}
	function pause_children(effect, transitions, local) {
		if ((effect.f & INERT) !== 0) return;
		effect.f ^= INERT;
		var t = effect.nodes && effect.nodes.t;
		if (t !== null) {
			for (const transition of t) {
				if (transition.is_global || local) {
					transitions.push(transition);
				}
			}
		}
		var child = effect.first;
		while (child !== null) {
			var sibling = child.next;
			if ((child.f & ROOT_EFFECT) === 0) {
				var transparent =
					(child.f & EFFECT_TRANSPARENT) !== 0 ||
					((child.f & BRANCH_EFFECT) !== 0 && (effect.f & BLOCK_EFFECT) !== 0);
				pause_children(child, transitions, transparent ? local : false);
			}
			child = sibling;
		}
	}
	function resume_effect(effect) {
		effect.f &= ~PAUSED;
		resume_children(effect, true);
	}
	function resume_children(effect, local) {
		if ((effect.f & PAUSED) !== 0) return;
		if ((effect.f & INERT) === 0) return;
		effect.f ^= INERT;
		if ((effect.f & CLEAN) === 0) {
			set_signal_status(effect, DIRTY);
			Batch.ensure().schedule(effect);
		}
		var child = effect.first;
		while (child !== null) {
			var sibling = child.next;
			var transparent = (child.f & EFFECT_TRANSPARENT) !== 0 || (child.f & BRANCH_EFFECT) !== 0;
			resume_children(child, transparent ? local : false);
			child = sibling;
		}
		var t = effect.nodes && effect.nodes.t;
		if (t !== null) {
			for (const transition of t) {
				if (transition.is_global || local) {
					transition.in();
				}
			}
		}
	}
	function move_effect(effect, fragment) {
		if (!effect.nodes) return;
		var node = effect.nodes.start;
		var end = effect.nodes.end;
		while (node !== null) {
			var next = node === end ? null : get_next_sibling(node);
			fragment.append(node);
			node = next;
		}
	}

	let is_updating_effect = false;
	let is_destroying_effect = false;
	function set_is_destroying_effect(value) {
		is_destroying_effect = value;
	}
	let active_reaction = null;
	let untracking = false;
	function set_active_reaction(reaction) {
		active_reaction = reaction;
	}
	let active_effect = null;
	function set_active_effect(effect) {
		active_effect = effect;
	}
	let current_sources = null;
	function push_reaction_value(value) {
		if (active_reaction !== null && (true)) {
			(current_sources ??= new Set()).add(value);
		}
	}
	let new_deps = null;
	let skipped_deps = 0;
	let untracked_writes = null;
	function set_untracked_writes(value) {
		untracked_writes = value;
	}
	let write_version = 1;
	let read_version = 0;
	let update_version = read_version;
	function set_update_version(value) {
		update_version = value;
	}
	function increment_write_version() {
		return ++write_version;
	}
	function is_dirty(reaction) {
		var flags = reaction.f;
		if ((flags & DIRTY) !== 0) {
			return true;
		}
		if (flags & DERIVED) {
			reaction.f &= ~WAS_MARKED;
		}
		if ((flags & MAYBE_DIRTY) !== 0) {
			var dependencies =  (reaction.deps);
			var length = dependencies.length;
			for (var i = 0; i < length; i++) {
				var dependency = dependencies[i];
				if (is_dirty( (dependency))) {
					update_derived( (dependency));
				}
				if (dependency.wv > reaction.wv) {
					return true;
				}
			}
			if (
				(flags & CONNECTED) !== 0 &&
				batch_values === null
			) {
				set_signal_status(reaction, CLEAN);
			}
		}
		return false;
	}
	function schedule_possible_effect_self_invalidation(signal, effect, root = true) {
		var reactions = signal.reactions;
		if (reactions === null) return;
		if (current_sources !== null && current_sources.has(signal)) {
			return;
		}
		for (var i = 0; i < reactions.length; i++) {
			var reaction = reactions[i];
			if ((reaction.f & DERIVED) !== 0) {
				schedule_possible_effect_self_invalidation( (reaction), effect, false);
			} else if (effect === reaction) {
				if (root) {
					set_signal_status(reaction, DIRTY);
				} else if ((reaction.f & CLEAN) !== 0) {
					set_signal_status(reaction, MAYBE_DIRTY);
				}
				schedule_effect( (reaction));
			}
		}
	}
	function update_reaction(reaction) {
		var previous_deps = new_deps;
		var previous_skipped_deps = skipped_deps;
		var previous_untracked_writes = untracked_writes;
		var previous_reaction = active_reaction;
		var previous_sources = current_sources;
		var previous_component_context = component_context;
		var previous_untracking = untracking;
		var previous_update_version = update_version;
		var flags = reaction.f;
		new_deps =  (null);
		skipped_deps = 0;
		untracked_writes = null;
		active_reaction = (flags & (BRANCH_EFFECT | ROOT_EFFECT)) === 0 ? reaction : null;
		current_sources = null;
		set_component_context(reaction.ctx);
		untracking = false;
		update_version = ++read_version;
		if (reaction.ac !== null) {
			without_reactive_context(() => {
				 (reaction.ac).abort(STALE_REACTION);
			});
			reaction.ac = null;
		}
		try {
			reaction.f |= REACTION_IS_UPDATING;
			var fn =  (reaction.fn);
			var result = fn();
			reaction.f |= REACTION_RAN;
			var deps = update_dependencies(reaction);
			if (
				is_runes() &&
				untracked_writes !== null &&
				!untracking &&
				deps !== null &&
				(reaction.f & (DERIVED | MAYBE_DIRTY | DIRTY)) === 0
			) {
				for (var i = 0; i <  (untracked_writes).length; i++) {
					schedule_possible_effect_self_invalidation(
						untracked_writes[i],
						 (reaction)
					);
				}
			}
			if (previous_reaction !== null && previous_reaction !== reaction) {
				read_version++;
				if (previous_reaction.deps !== null) {
					for (let i = 0; i < previous_skipped_deps; i += 1) {
						previous_reaction.deps[i].rv = read_version;
					}
				}
				if (previous_deps !== null) {
					for (const dep of previous_deps) {
						dep.rv = read_version;
					}
				}
				if (untracked_writes !== null) {
					if (previous_untracked_writes === null) {
						previous_untracked_writes = untracked_writes;
					} else {
						previous_untracked_writes.push(... (untracked_writes));
					}
				}
			}
			if ((reaction.f & ERROR_VALUE) !== 0) {
				reaction.f ^= ERROR_VALUE;
			}
			return result;
		} catch (error) {
			update_dependencies(reaction);
			return handle_error(error);
		} finally {
			reaction.f ^= REACTION_IS_UPDATING;
			new_deps = previous_deps;
			skipped_deps = previous_skipped_deps;
			untracked_writes = previous_untracked_writes;
			active_reaction = previous_reaction;
			current_sources = previous_sources;
			set_component_context(previous_component_context);
			untracking = previous_untracking;
			update_version = previous_update_version;
		}
	}
	function update_dependencies(reaction) {
		var deps = reaction.deps;
		var is_fork = current_batch?.is_fork;
		if (new_deps !== null) {
			var i;
			if (!is_fork) {
				remove_reactions(reaction, skipped_deps);
			}
			if (deps !== null && skipped_deps > 0) {
				deps.length = skipped_deps + new_deps.length;
				for (i = 0; i < new_deps.length; i++) {
					deps[skipped_deps + i] = new_deps[i];
				}
			} else {
				reaction.deps = deps = new_deps;
			}
			if (effect_tracking() && (reaction.f & CONNECTED) !== 0) {
				for (i = skipped_deps; i < deps.length; i++) {
					(deps[i].reactions ??= []).push(reaction);
				}
			}
		} else if (!is_fork && deps !== null && skipped_deps < deps.length) {
			remove_reactions(reaction, skipped_deps);
			deps.length = skipped_deps;
		}
		return deps;
	}
	function remove_reaction(signal, dependency) {
		let reactions = dependency.reactions;
		if (reactions !== null) {
			var index = index_of.call(reactions, signal);
			if (index !== -1) {
				var new_length = reactions.length - 1;
				if (new_length === 0) {
					reactions = dependency.reactions = null;
				} else {
					reactions[index] = reactions[new_length];
					reactions.pop();
				}
			}
		}
		if (
			reactions === null &&
			(dependency.f & DERIVED) !== 0 &&
			(new_deps === null || !includes.call(new_deps, dependency))
		) {
			var derived =  (dependency);
			if ((derived.f & CONNECTED) !== 0) {
				derived.f ^= CONNECTED;
				derived.f &= ~WAS_MARKED;
			}
			if (derived.v !== UNINITIALIZED) {
				update_derived_status(derived);
			}
			if (derived.ac !== null) {
				without_reactive_context(() => {
					 (derived.ac).abort(STALE_REACTION);
					derived.ac = null;
					set_signal_status(derived, DIRTY);
				});
			}
			freeze_derived_effects(derived);
			remove_reactions(derived, 0);
		}
	}
	function remove_reactions(signal, start_index) {
		var dependencies = signal.deps;
		if (dependencies === null) return;
		for (var i = start_index; i < dependencies.length; i++) {
			remove_reaction(signal, dependencies[i]);
		}
	}
	function update_effect(effect) {
		var flags = effect.f;
		if ((flags & DESTROYED) !== 0) {
			return;
		}
		set_signal_status(effect, CLEAN);
		var previous_effect = active_effect;
		var was_updating_effect = is_updating_effect;
		active_effect = effect;
		is_updating_effect = (flags & (BRANCH_EFFECT | ROOT_EFFECT)) === 0;
		try {
			if ((flags & (BLOCK_EFFECT | MANAGED_EFFECT)) !== 0) {
				destroy_block_effect_children(effect);
			} else {
				destroy_effect_children(effect);
			}
			execute_effect_teardown(effect);
			var teardown = update_reaction(effect);
			effect.teardown = typeof teardown === 'function' ? teardown : null;
			effect.wv = write_version;
			var dep; if (DEV && tracing_mode_flag && (effect.f & DIRTY) !== 0 && effect.deps !== null) ;
		} finally {
			is_updating_effect = was_updating_effect;
			active_effect = previous_effect;
		}
	}
	async function tick() {
		await Promise.resolve();
		flushSync();
	}
	function get$1(signal) {
		var flags = signal.f;
		var is_derived = (flags & DERIVED) !== 0;
		if (active_reaction !== null && !untracking) {
			var destroyed = active_effect !== null && (active_effect.f & DESTROYED) !== 0;
			if (!destroyed && (current_sources === null || !current_sources.has(signal))) {
				var deps = active_reaction.deps;
				if ((active_reaction.f & REACTION_IS_UPDATING) !== 0) {
					if (signal.rv < read_version) {
						signal.rv = read_version;
						if (new_deps === null && deps !== null && deps[skipped_deps] === signal) {
							skipped_deps++;
						} else if (new_deps === null) {
							new_deps = [signal];
						} else {
							new_deps.push(signal);
						}
					}
				} else {
					active_reaction.deps ??= [];
					if (!includes.call(active_reaction.deps, signal)) {
						active_reaction.deps.push(signal);
					}
					var reactions = signal.reactions;
					if (reactions === null) {
						signal.reactions = [active_reaction];
					} else if (!includes.call(reactions, active_reaction)) {
						reactions.push(active_reaction);
					}
				}
			}
		}
		if (is_destroying_effect && old_values.has(signal)) {
			return old_values.get(signal);
		}
		if (is_derived) {
			var derived =  (signal);
			if (is_destroying_effect) {
				var value = derived.v;
				if (
					((derived.f & CLEAN) === 0 && derived.reactions !== null) ||
					depends_on_old_values(derived)
				) {
					value = execute_derived(derived);
				}
				old_values.set(derived, value);
				return value;
			}
			var should_connect =
				(derived.f & CONNECTED) === 0 &&
				!untracking &&
				active_reaction !== null &&
				(is_updating_effect || (active_reaction.f & CONNECTED) !== 0);
			var is_new = (derived.f & REACTION_RAN) === 0;
			if (is_dirty(derived)) {
				if (should_connect) {
					derived.f |= CONNECTED;
				}
				update_derived(derived);
			}
			if (should_connect && !is_new) {
				unfreeze_derived_effects(derived);
				reconnect(derived);
			}
		}
		if (batch_values?.has(signal)) {
			return batch_values.get(signal);
		}
		if ((signal.f & ERROR_VALUE) !== 0) {
			throw signal.v;
		}
		return signal.v;
	}
	function reconnect(derived) {
		derived.f |= CONNECTED;
		if (derived.deps === null) return;
		for (const dep of derived.deps) {
			(dep.reactions ??= []).push(derived);
			if ((dep.f & DERIVED) !== 0 && (dep.f & CONNECTED) === 0) {
				unfreeze_derived_effects( (dep));
				reconnect( (dep));
			}
		}
	}
	function depends_on_old_values(derived) {
		if (derived.v === UNINITIALIZED) return true;
		if (derived.deps === null) return false;
		for (const dep of derived.deps) {
			if (old_values.has(dep)) {
				return true;
			}
			if ((dep.f & DERIVED) !== 0 && depends_on_old_values( (dep))) {
				return true;
			}
		}
		return false;
	}
	function untrack(fn) {
		var previous_untracking = untracking;
		try {
			untracking = true;
			return fn();
		} finally {
			untracking = previous_untracking;
		}
	}

	function is_capture_event(name) {
		return name.endsWith('capture') && name !== 'gotpointercapture' && name !== 'lostpointercapture';
	}
	const DELEGATED_EVENTS = [
		'beforeinput',
		'click',
		'change',
		'dblclick',
		'contextmenu',
		'focusin',
		'focusout',
		'input',
		'keydown',
		'keyup',
		'mousedown',
		'mousemove',
		'mouseout',
		'mouseover',
		'mouseup',
		'pointerdown',
		'pointermove',
		'pointerout',
		'pointerover',
		'pointerup',
		'touchend',
		'touchmove',
		'touchstart'
	];
	function can_delegate_event(event_name) {
		return DELEGATED_EVENTS.includes(event_name);
	}
	const ATTRIBUTE_ALIASES = {
		formnovalidate: 'formNoValidate',
		ismap: 'isMap',
		nomodule: 'noModule',
		playsinline: 'playsInline',
		readonly: 'readOnly',
		defaultvalue: 'defaultValue',
		defaultchecked: 'defaultChecked',
		srcobject: 'srcObject',
		novalidate: 'noValidate',
		allowfullscreen: 'allowFullscreen',
		disablepictureinpicture: 'disablePictureInPicture',
		disableremoteplayback: 'disableRemotePlayback'
	};
	function normalize_attribute(name) {
		name = name.toLowerCase();
		return ATTRIBUTE_ALIASES[name] ?? name;
	}
	const PASSIVE_EVENTS = ['touchstart', 'touchmove'];
	function is_passive_event(name) {
		return PASSIVE_EVENTS.includes(name);
	}

	const event_symbol = Symbol('events');
	const all_registered_events = new Set();
	const root_event_handles = new Set();
	function create_event(event_name, dom, handler, options = {}) {
		function target_handler( event) {
			if (!options.capture) {
				handle_event_propagation.call(dom, event);
			}
			if (!event.cancelBubble) {
				return without_reactive_context(() => {
					return handler?.call(this, event);
				});
			}
		}
		if (
			event_name.startsWith('pointer') ||
			event_name.startsWith('touch') ||
			event_name === 'wheel'
		) {
			queue_micro_task(() => {
				dom.addEventListener(event_name, target_handler, options);
			});
		} else {
			dom.addEventListener(event_name, target_handler, options);
		}
		return target_handler;
	}
	function event(event_name, dom, handler, capture, passive) {
		var options = { capture, passive };
		var target_handler = create_event(event_name, dom, handler, options);
		if (
			dom === document.body ||
			dom === window ||
			dom === document ||
			dom instanceof HTMLMediaElement
		) {
			teardown(() => {
				dom.removeEventListener(event_name, target_handler, options);
			});
		}
	}
	function delegated(event_name, element, handler) {
		(element[event_symbol] ??= {})[event_name] = handler;
	}
	function delegate(events) {
		for (var i = 0; i < events.length; i++) {
			all_registered_events.add(events[i]);
		}
		for (var fn of root_event_handles) {
			fn(events);
		}
	}
	let last_propagated_event = null;
	let last_propagated_event_clear_scheduled = false;
	function handle_event_propagation(event) {
		var handler_element = this;
		var owner_document =  (handler_element).ownerDocument;
		var event_name = event.type;
		var path = event.composedPath?.() || [];
		var current_target =  (path[0] || event.target);
		last_propagated_event = event;
		if (!last_propagated_event_clear_scheduled) {
			last_propagated_event_clear_scheduled = true;
			setTimeout(() => {
				last_propagated_event_clear_scheduled = false;
				last_propagated_event = null;
			});
		}
		var path_idx = 0;
		var handled_at = last_propagated_event === event && event[event_symbol];
		if (handled_at) {
			var at_idx = path.indexOf(handled_at);
			if (
				at_idx !== -1 &&
				(handler_element === document || handler_element ===  (window))
			) {
				event[event_symbol] = handler_element;
				return;
			}
			var handler_idx = path.indexOf(handler_element);
			if (handler_idx === -1) {
				return;
			}
			if (at_idx <= handler_idx) {
				path_idx = at_idx;
			}
		}
		current_target =  (path[path_idx] || event.target);
		if (current_target === handler_element) return;
		define_property(event, 'currentTarget', {
			configurable: true,
			get() {
				return current_target || owner_document;
			}
		});
		var previous_reaction = active_reaction;
		var previous_effect = active_effect;
		set_active_reaction(null);
		set_active_effect(null);
		try {
			var throw_error;
			var other_errors = [];
			while (current_target !== null) {
				if (current_target === handler_element) break;
				try {
					var delegated = current_target[event_symbol]?.[event_name];
					if (
						delegated != null &&
						(!( (current_target).disabled) ||
							event.target === current_target)
					) {
						delegated.call(current_target, event);
					}
				} catch (error) {
					if (throw_error) {
						other_errors.push(error);
					} else {
						throw_error = error;
					}
				}
				if (event.cancelBubble) break;
				path_idx++;
				current_target = path_idx < path.length ?  (path[path_idx]) : null;
			}
			if (throw_error) {
				for (let error of other_errors) {
					queueMicrotask(() => {
						throw error;
					});
				}
				throw throw_error;
			}
		} finally {
			event[event_symbol] = handler_element;
			delete event.currentTarget;
			set_active_reaction(previous_reaction);
			set_active_effect(previous_effect);
		}
	}

	const policy =
		globalThis?.window?.trustedTypes &&
		 globalThis.window.trustedTypes.createPolicy('svelte-trusted-html', {
			createHTML: (html) => {
				return html;
			}
		});
	function create_trusted_html(html) {
		return  (policy?.createHTML(html) ?? html);
	}
	function create_fragment_from_html(html) {
		var elem = create_element('template');
		elem.innerHTML = create_trusted_html(html.replaceAll('<!>', '<!---->'));
		return elem.content;
	}

	function assign_nodes(start, end) {
		var effect =  (active_effect);
		if (effect.nodes === null) {
			effect.nodes = { start, end, a: null, t: null };
		}
	}
	function from_html(content, flags) {
		var is_fragment = (flags & TEMPLATE_FRAGMENT) !== 0;
		var use_import_node = (flags & TEMPLATE_USE_IMPORT_NODE) !== 0;
		var node;
		var has_start = !content.startsWith('<!>');
		return () => {
			if (node === undefined) {
				node = create_fragment_from_html(has_start ? content : '<!>' + content);
				if (!is_fragment) node =  (get_first_child(node));
			}
			var clone =  (
				use_import_node || is_firefox ? document.importNode(node, true) : node.cloneNode(true)
			);
			if (is_fragment) {
				var start =  (get_first_child(clone));
				var end =  (clone.lastChild);
				assign_nodes(start, end);
			} else {
				assign_nodes(clone, clone);
			}
			return clone;
		};
	}
	function text$1(value = '') {
		{
			var t = create_text(value + '');
			assign_nodes(t, t);
			return t;
		}
	}
	function comment() {
		var frag = document.createDocumentFragment();
		var start = document.createComment('');
		var anchor = create_text();
		frag.append(start, anchor);
		assign_nodes(start, anchor);
		return frag;
	}
	function append(anchor, dom) {
		if (anchor === null) {
			return;
		}
		anchor.before( (dom));
	}

	function createSubscriber(start) {
		let subscribers = 0;
		let version = source(0);
		let stop;
		return () => {
			if (effect_tracking()) {
				get$1(version);
				render_effect(() => {
					if (subscribers === 0) {
						stop = untrack(() => start(() => increment(version)));
					}
					subscribers += 1;
					return () => {
						queue_micro_task(() => {
							subscribers -= 1;
							if (subscribers === 0) {
								stop?.();
								stop = undefined;
								increment(version);
							}
						});
					};
				});
			}
		};
	}

	var flags = EFFECT_TRANSPARENT | EFFECT_PRESERVED;
	function boundary(node, props, children, transform_error) {
		new Boundary(node, props, children, transform_error);
	}
	class Boundary {
		parent;
		is_pending = false;
		transform_error;
		#anchor;
		#hydrate_open = null;
		#props;
		#children;
		#effect;
		#main_effect = null;
		#pending_effect = null;
		#failed_effect = null;
		#offscreen_fragment = null;
		#local_pending_count = 0;
		#pending_count = 0;
		#pending_count_update_queued = false;
		#dirty_effects = new Set();
		#maybe_dirty_effects = new Set();
		#effect_pending = null;
		#effect_pending_subscriber = createSubscriber(() => {
			this.#effect_pending = source(this.#local_pending_count);
			return () => {
				this.#effect_pending = null;
			};
		});
		constructor(node, props, children, transform_error) {
			this.#anchor = node;
			this.#props = props;
			this.#children = (anchor) => {
				var effect =  (active_effect);
				effect.b = this;
				effect.f |= BOUNDARY_EFFECT;
				children(anchor);
			};
			this.parent =  (active_effect).b;
			this.transform_error = transform_error ?? this.parent?.transform_error ?? ((e) => e);
			this.#effect = block(() => {
				{
					this.#render();
				}
			}, flags);
		}
		#hydrate_resolved_content() {
			try {
				this.#main_effect = branch(() => this.#children(this.#anchor));
			} catch (error) {
				this.error(error);
			}
		}
		#hydrate_failed_content(error) {
			const failed = this.#props.failed;
			const { reset, invoke_onerror } = this.#create_reset(error);
			queue_micro_task(invoke_onerror);
			if (!failed) return;
			this.#failed_effect = branch(() => {
				failed(
					this.#anchor,
					() => error,
					() => reset
				);
			});
		}
		#create_reset(error) {
			var did_reset = false;
			var calling_on_error = false;
			const reset = () => {
				if (did_reset) {
					svelte_boundary_reset_noop();
					return;
				}
				did_reset = true;
				if (calling_on_error) {
					svelte_boundary_reset_onerror();
				}
				if (this.#failed_effect !== null) {
					pause_effect(this.#failed_effect, () => {
						this.#failed_effect = null;
					});
				}
				this.#run(() => {
					this.#render();
				});
			};
			const invoke_onerror = () => {
				try {
					calling_on_error = true;
					this.#props.onerror?.(error, reset);
					calling_on_error = false;
				} catch (err) {
					invoke_error_boundary(err, this.#effect && this.#effect.parent);
				}
			};
			return { reset, invoke_onerror };
		}
		#hydrate_pending_content() {
			const pending = this.#props.pending;
			if (!pending) return;
			this.is_pending = true;
			this.#pending_effect = branch(() => pending(this.#anchor));
			queue_micro_task(() => {
				var fragment = (this.#offscreen_fragment = document.createDocumentFragment());
				var anchor = create_text();
				var handled = false;
				fragment.append(anchor);
				this.#main_effect = this.#run(() => {
					try {
						return branch(() => this.#children(anchor));
					} catch (error) {
						try {
							this.error(error);
							handled = true;
						} catch (error) {
							invoke_error_boundary(error, this.#effect.parent);
						}
						return null;
					}
				});
				if (this.#main_effect === null) {
					this.#offscreen_fragment = null;
					if (handled) this.#resolve( (current_batch));
					return;
				}
				if (this.#pending_count === 0) {
					this.#anchor.before(fragment);
					this.#offscreen_fragment = null;
					pause_effect( (this.#pending_effect), () => {
						this.#pending_effect = null;
					});
					this.#resolve( (current_batch));
				}
			});
		}
		#render() {
			try {
				this.is_pending = this.has_pending_snippet();
				this.#pending_count = 0;
				this.#local_pending_count = 0;
				this.#main_effect = branch(() => {
					this.#children(this.#anchor);
				});
				if (this.#pending_count > 0) {
					var fragment = (this.#offscreen_fragment = document.createDocumentFragment());
					move_effect(this.#main_effect, fragment);
					const pending =  (this.#props.pending);
					this.#pending_effect = branch(() => pending(this.#anchor));
				} else {
					this.#resolve( (current_batch));
				}
			} catch (error) {
				this.error(error);
			}
		}
		#resolve(batch) {
			this.is_pending = false;
			batch.transfer_effects(this.#dirty_effects, this.#maybe_dirty_effects);
		}
		defer_effect(effect) {
			defer_effect(effect, this.#dirty_effects, this.#maybe_dirty_effects);
		}
		is_rendered() {
			return !this.is_pending && (!this.parent || this.parent.is_rendered());
		}
		has_pending_snippet() {
			return !!this.#props.pending;
		}
		#run(fn) {
			var previous_effect = active_effect;
			var previous_reaction = active_reaction;
			var previous_ctx = component_context;
			set_active_effect(this.#effect);
			set_active_reaction(this.#effect);
			set_component_context(this.#effect.ctx);
			try {
				Batch.ensure();
				return fn();
			} finally {
				set_active_effect(previous_effect);
				set_active_reaction(previous_reaction);
				set_component_context(previous_ctx);
			}
		}
		#update_pending_count(d, batch) {
			if (!this.has_pending_snippet()) {
				if (this.parent) {
					this.parent.#update_pending_count(d, batch);
				}
				return;
			}
			this.#pending_count += d;
			if (this.#pending_count === 0) {
				this.#resolve(batch);
				if (this.#pending_effect) {
					pause_effect(this.#pending_effect, () => {
						this.#pending_effect = null;
					});
				}
				if (this.#offscreen_fragment) {
					this.#anchor.before(this.#offscreen_fragment);
					this.#offscreen_fragment = null;
				}
			}
		}
		update_pending_count(d, batch) {
			this.#update_pending_count(d, batch);
			this.#local_pending_count += d;
			if (!this.#effect_pending || this.#pending_count_update_queued) return;
			this.#pending_count_update_queued = true;
			queue_micro_task(() => {
				this.#pending_count_update_queued = false;
				if (this.#effect_pending) {
					internal_set(this.#effect_pending, this.#local_pending_count);
				}
			});
		}
		get_effect_pending() {
			this.#effect_pending_subscriber();
			return get$1( (this.#effect_pending));
		}
		error(error) {
			if (!this.#props.onerror && !this.#props.failed) {
				throw error;
			}
			if (current_batch?.is_fork) {
				if (this.#main_effect) current_batch.skip_effect(this.#main_effect);
				if (this.#pending_effect) current_batch.skip_effect(this.#pending_effect);
				if (this.#failed_effect) current_batch.skip_effect(this.#failed_effect);
				current_batch.oncommit(() => {
					this.#handle_error(error);
				});
			} else {
				this.#handle_error(error);
			}
		}
		#handle_error(error) {
			if (this.#main_effect) {
				destroy_effect(this.#main_effect);
				this.#main_effect = null;
			}
			if (this.#pending_effect) {
				destroy_effect(this.#pending_effect);
				this.#pending_effect = null;
			}
			if (this.#failed_effect) {
				destroy_effect(this.#failed_effect);
				this.#failed_effect = null;
			}
			let failed = this.#props.failed;
			const handle_error_result = (transformed_error) => {
				const { reset, invoke_onerror } = this.#create_reset(transformed_error);
				invoke_onerror();
				if (failed) {
					this.#failed_effect = this.#run(() => {
						try {
							return branch(() => {
								var effect =  (active_effect);
								effect.b = this;
								effect.f |= BOUNDARY_EFFECT;
								failed(
									this.#anchor,
									() => transformed_error,
									() => reset
								);
							});
						} catch (error) {
							invoke_error_boundary(error,  (this.#effect.parent));
							return null;
						}
					});
				}
			};
			queue_micro_task(() => {
				var result;
				try {
					result = this.transform_error(error);
				} catch (e) {
					invoke_error_boundary(e, this.#effect && this.#effect.parent);
					return;
				}
				if (
					result !== null &&
					typeof result === 'object' &&
					typeof ( (result).then) === 'function'
				) {
					 (result).then(
						handle_error_result,
						(e) => invoke_error_boundary(e, this.#effect && this.#effect.parent)
					);
				} else {
					handle_error_result(result);
				}
			});
		}
	}

	function set_text(text, value) {
		var str = value == null ? '' : typeof value === 'object' ? `${value}` : value;
		if (str !== ( (text)[TEXT_CACHE] ??= text.nodeValue)) {
			 (text)[TEXT_CACHE] = str;
			text.nodeValue = `${str}`;
		}
	}
	function mount(component, options) {
		return _mount(component, options);
	}
	const listeners = new Map();
	function _mount(
		Component,
		{ target, anchor, props = {}, events, context, intro = true, transformError }
	) {
		init_operations();
		var component = undefined;
		var unmount = component_root(() => {
			var anchor_node = anchor ?? target.appendChild(create_text());
			boundary(
				 (anchor_node),
				{
					pending: () => {}
				},
				(anchor_node) => {
					push({});
					var ctx =  (component_context);
					if (context) ctx.c = context;
					if (events) {
						 (props).$$events = events;
					}
					component = Component(anchor_node, props) || mark_as_component();
					pop();
				},
				transformError
			);
			var registered_events = new Set();
			var event_handle = (events) => {
				for (var i = 0; i < events.length; i++) {
					var event_name = events[i];
					if (registered_events.has(event_name)) continue;
					registered_events.add(event_name);
					var passive = is_passive_event(event_name);
					for (const node of [target, document]) {
						var counts = listeners.get(node);
						if (counts === undefined) {
							counts = new Map();
							listeners.set(node, counts);
						}
						var count = counts.get(event_name);
						if (count === undefined) {
							node.addEventListener(event_name, handle_event_propagation, { passive });
							counts.set(event_name, 1);
						} else {
							counts.set(event_name, count + 1);
						}
					}
				}
			};
			event_handle(array_from(all_registered_events));
			root_event_handles.add(event_handle);
			return () => {
				for (var event_name of registered_events) {
					for (const node of [target, document]) {
						var counts =  (listeners.get(node));
						var count =  (counts.get(event_name));
						if (--count == 0) {
							node.removeEventListener(event_name, handle_event_propagation);
							counts.delete(event_name);
							if (counts.size === 0) {
								listeners.delete(node);
							}
						} else {
							counts.set(event_name, count);
						}
					}
				}
				root_event_handles.delete(event_handle);
				if (anchor_node !== anchor) {
					anchor_node.parentNode?.removeChild(anchor_node);
				}
			};
		});
		mounted_components.set(component, unmount);
		return component;
	}
	let mounted_components = new WeakMap();
	function unmount(component, options) {
		const fn = mounted_components.get(component);
		if (fn) {
			mounted_components.delete(component);
			return fn(options);
		}
		return Promise.resolve();
	}

	class BranchManager {
		anchor;
		#batches = new Map();
		#onscreen = new Map();
		#offscreen = new Map();
		#outroing = new Set();
		#transition = true;
		constructor(anchor, transition = true) {
			this.anchor = anchor;
			this.#transition = transition;
		}
		#commit = (batch) => {
			if (!this.#batches.has(batch)) return;
			var key =  (this.#batches.get(batch));
			var onscreen = this.#onscreen.get(key);
			if (onscreen) {
				resume_effect(onscreen);
				this.#outroing.delete(key);
			} else {
				var offscreen = this.#offscreen.get(key);
				if (offscreen) {
					resume_effect(offscreen.effect);
					this.#onscreen.set(key, offscreen.effect);
					this.#offscreen.delete(key);
					 (offscreen.fragment.lastChild).remove();
					this.anchor.before(offscreen.fragment);
					onscreen = offscreen.effect;
				}
			}
			for (const [b, k] of this.#batches) {
				this.#batches.delete(b);
				if (b === batch) {
					break;
				}
				const offscreen = this.#offscreen.get(k);
				if (offscreen) {
					destroy_effect(offscreen.effect);
					this.#offscreen.delete(k);
				}
			}
			for (const [k, effect] of this.#onscreen) {
				if (k === key || this.#outroing.has(k)) continue;
				const on_destroy = () => {
					const keys = Array.from(this.#batches.values());
					if (keys.includes(k)) {
						var fragment = document.createDocumentFragment();
						move_effect(effect, fragment);
						fragment.append(create_text());
						this.#offscreen.set(k, { effect, fragment });
					} else {
						destroy_effect(effect);
					}
					this.#outroing.delete(k);
					this.#onscreen.delete(k);
				};
				if (this.#transition || !onscreen) {
					this.#outroing.add(k);
					pause_effect(effect, on_destroy, false);
				} else {
					on_destroy();
				}
			}
		};
		#discard = (batch) => {
			this.#batches.delete(batch);
			const keys = Array.from(this.#batches.values());
			for (const [k, branch] of this.#offscreen) {
				if (!keys.includes(k)) {
					destroy_effect(branch.effect);
					this.#offscreen.delete(k);
				}
			}
		};
		ensure(key, fn) {
			var batch =  (current_batch);
			var defer = should_defer_append();
			if (fn && !this.#onscreen.has(key) && !this.#offscreen.has(key)) {
				if (defer) {
					var fragment = document.createDocumentFragment();
					var target = create_text();
					fragment.append(target);
					this.#offscreen.set(key, {
						effect: branch(() => fn(target)),
						fragment
					});
				} else {
					this.#onscreen.set(
						key,
						branch(() => fn(this.anchor))
					);
				}
			}
			this.#batches.set(batch, key);
			if (defer) {
				for (const [k, effect] of this.#onscreen) {
					if (k === key) {
						batch.unskip_effect(effect);
					} else {
						batch.skip_effect(effect);
					}
				}
				for (const [k, branch] of this.#offscreen) {
					if (k === key) {
						batch.unskip_effect(branch.effect);
					} else {
						batch.skip_effect(branch.effect);
					}
				}
				batch.oncommit(this.#commit);
				batch.ondiscard(this.#discard);
			} else {
				this.#commit(batch);
			}
		}
	}

	function if_block(node, fn, elseif = false) {
		var branches = new BranchManager(node);
		var flags = elseif ? EFFECT_TRANSPARENT : 0;
		function update_branch(key, fn) {
			branches.ensure(key, fn);
		}
		block(() => {
			var has_branch = false;
			fn((fn, key = 0) => {
				has_branch = true;
				update_branch(key, fn);
			});
			if (!has_branch) {
				update_branch(-1, null);
			}
		}, flags);
	}

	const NAN = Symbol('NaN');
	function key(node, get_key, render_fn) {
		var branches = new BranchManager(node);
		var legacy = !is_runes();
		block(() => {
			var key = get_key();
			if (key !== key) {
				key =  (NAN);
			}
			if (legacy && key !== null && typeof key === 'object') {
				key =  ({});
			}
			branches.ensure(key, render_fn);
		});
	}

	function index(_, i) {
		return i;
	}
	function pause_effects(state, to_destroy, controlled_anchor) {
		var transitions = [];
		var length = to_destroy.length;
		var group;
		var remaining = to_destroy.length;
		for (var i = 0; i < length; i++) {
			let effect = to_destroy[i];
			pause_effect(
				effect,
				() => {
					if (group) {
						group.pending.delete(effect);
						group.done.add(effect);
						if (group.pending.size === 0) {
							var groups =  (state.outrogroups);
							destroy_effects(state, array_from(group.done));
							groups.delete(group);
							if (groups.size === 0) {
								state.outrogroups = null;
							}
						}
					} else {
						remaining -= 1;
					}
				},
				false
			);
		}
		if (remaining === 0) {
			var fast_path =
				transitions.length === 0 && controlled_anchor !== null && state.pending.size === 0;
			if (fast_path) {
				var anchor =  (controlled_anchor);
				var parent_node =  (anchor.parentNode);
				clear_text_content(parent_node);
				parent_node.append(anchor);
				state.items.clear();
			}
			destroy_effects(state, to_destroy, !fast_path);
		} else {
			group = {
				pending: new Set(to_destroy),
				done: new Set()
			};
			(state.outrogroups ??= new Set()).add(group);
		}
	}
	function destroy_effects(state, to_destroy, remove_dom = true) {
		var preserved_effects;
		if (state.pending.size > 0) {
			preserved_effects = new Set();
			for (const keys of state.pending.values()) {
				for (const key of keys) {
					preserved_effects.add( (state.items.get(key)).e);
				}
			}
		}
		for (var i = 0; i < to_destroy.length; i++) {
			var e = to_destroy[i];
			if (preserved_effects?.has(e)) {
				e.f |= EFFECT_OFFSCREEN;
				const fragment = document.createDocumentFragment();
				move_effect(e, fragment);
			} else {
				destroy_effect(to_destroy[i], remove_dom);
			}
		}
	}
	var offscreen_anchor;
	function each(node, flags, get_collection, get_key, render_fn, fallback_fn = null) {
		var anchor = node;
		var items = new Map();
		var is_controlled = (flags & EACH_IS_CONTROLLED) !== 0;
		if (is_controlled) {
			var parent_node =  (node);
			anchor = parent_node.appendChild(create_text());
		}
		var fallback = null;
		var each_array = derived_safe_equal(() => {
			var collection = get_collection();
			return  (
				is_array(collection) ? collection : collection == null ? [] : array_from(collection)
			);
		});
		var array;
		var pending = new Map();
		var first_run = true;
		function commit(batch) {
			if ((state.effect.f & DESTROYED) !== 0) {
				return;
			}
			state.pending.delete(batch);
			state.fallback = fallback;
			reconcile(state, array, anchor, flags, get_key);
			if (fallback !== null) {
				if (array.length === 0) {
					if ((fallback.f & EFFECT_OFFSCREEN) === 0) {
						resume_effect(fallback);
					} else {
						fallback.f ^= EFFECT_OFFSCREEN;
						move(fallback, null, anchor);
					}
				} else {
					pause_effect(fallback, () => {
						fallback = null;
					});
				}
			}
		}
		function discard(batch) {
			state.pending.delete(batch);
		}
		var effect = block(() => {
			array =  (get$1(each_array));
			var length = array.length;
			var keys = new Set();
			var batch =  (current_batch);
			var defer = should_defer_append();
			for (var index = 0; index < length; index += 1) {
				var value = array[index];
				var key = get_key(value, index);
				var item = first_run ? null : items.get(key);
				if (item) {
					if (item.v) internal_set(item.v, value);
					if (item.i) internal_set(item.i, index);
					if (defer) {
						batch.unskip_effect(item.e);
					}
				} else {
					item = create_item(
						items,
						first_run ? anchor : (offscreen_anchor ??= create_text()),
						value,
						key,
						index,
						render_fn,
						flags,
						get_collection
					);
					if (!first_run) {
						item.e.f |= EFFECT_OFFSCREEN;
					}
					items.set(key, item);
				}
				keys.add(key);
			}
			if (length === 0 && fallback_fn && !fallback) {
				if (first_run) {
					fallback = branch(() => fallback_fn(anchor));
				} else {
					fallback = branch(() => fallback_fn((offscreen_anchor ??= create_text())));
					fallback.f |= EFFECT_OFFSCREEN;
				}
			}
			if (length > keys.size) {
				{
					each_key_duplicate();
				}
			}
			if (!first_run) {
				pending.set(batch, keys);
				if (defer) {
					for (const [key, item] of items) {
						if (!keys.has(key)) {
							batch.skip_effect(item.e);
						}
					}
					batch.oncommit(commit);
					batch.ondiscard(discard);
				} else {
					commit(batch);
				}
			}
			get$1(each_array);
		});
		var state = { effect, items, pending, outrogroups: null, fallback };
		first_run = false;
	}
	function skip_to_branch(effect) {
		while (effect !== null && (effect.f & BRANCH_EFFECT) === 0) {
			effect = effect.next;
		}
		return effect;
	}
	function reconcile(state, array, anchor, flags, get_key) {
		var is_animated = (flags & EACH_IS_ANIMATED) !== 0;
		var length = array.length;
		var items = state.items;
		var current = skip_to_branch(state.effect.first);
		var seen;
		var prev = null;
		var to_animate;
		var matched = [];
		var stashed = [];
		var value;
		var key;
		var effect;
		var i;
		if (is_animated) {
			for (i = 0; i < length; i += 1) {
				value = array[i];
				key = get_key(value, i);
				effect =  (items.get(key)).e;
				if ((effect.f & EFFECT_OFFSCREEN) === 0) {
					effect.nodes?.a?.measure();
					(to_animate ??= new Set()).add(effect);
				}
			}
		}
		for (i = 0; i < length; i += 1) {
			value = array[i];
			key = get_key(value, i);
			effect =  (items.get(key)).e;
			if (state.outrogroups !== null) {
				for (const group of state.outrogroups) {
					group.pending.delete(effect);
					group.done.delete(effect);
				}
			}
			if ((effect.f & INERT) !== 0) {
				resume_effect(effect);
				if (is_animated) {
					effect.nodes?.a?.unfix();
					(to_animate ??= new Set()).delete(effect);
				}
			}
			if ((effect.f & EFFECT_OFFSCREEN) !== 0) {
				effect.f ^= EFFECT_OFFSCREEN;
				if (effect === current) {
					move(effect, null, anchor);
				} else {
					var next = prev ? prev.next : current;
					if (effect === state.effect.last) {
						state.effect.last = effect.prev;
					}
					if (effect.prev) effect.prev.next = effect.next;
					if (effect.next) effect.next.prev = effect.prev;
					link$1(state, prev, effect);
					link$1(state, effect, next);
					move(effect, next, anchor);
					prev = effect;
					matched = [];
					stashed = [];
					current = skip_to_branch(prev.next);
					continue;
				}
			}
			if (effect !== current) {
				if (seen !== undefined && seen.has(effect)) {
					if (matched.length < stashed.length) {
						var start = stashed[0];
						var j;
						prev = start.prev;
						var a = matched[0];
						var b = matched[matched.length - 1];
						for (j = 0; j < matched.length; j += 1) {
							move(matched[j], start, anchor);
						}
						for (j = 0; j < stashed.length; j += 1) {
							seen.delete(stashed[j]);
						}
						link$1(state, a.prev, b.next);
						link$1(state, prev, a);
						link$1(state, b, start);
						current = start;
						prev = b;
						i -= 1;
						matched = [];
						stashed = [];
					} else {
						seen.delete(effect);
						move(effect, current, anchor);
						link$1(state, effect.prev, effect.next);
						link$1(state, effect, prev === null ? state.effect.first : prev.next);
						link$1(state, prev, effect);
						prev = effect;
					}
					continue;
				}
				matched = [];
				stashed = [];
				while (current !== null && current !== effect) {
					(seen ??= new Set()).add(current);
					stashed.push(current);
					current = skip_to_branch(current.next);
				}
				if (current === null) {
					continue;
				}
			}
			if ((effect.f & EFFECT_OFFSCREEN) === 0) {
				matched.push(effect);
			}
			prev = effect;
			current = skip_to_branch(effect.next);
		}
		if (state.outrogroups !== null) {
			for (const group of state.outrogroups) {
				if (group.pending.size === 0) {
					destroy_effects(state, array_from(group.done));
					state.outrogroups?.delete(group);
				}
			}
			if (state.outrogroups.size === 0) {
				state.outrogroups = null;
			}
		}
		if (current !== null || seen !== undefined) {
			var to_destroy = [];
			if (seen !== undefined) {
				for (effect of seen) {
					if ((effect.f & INERT) === 0) {
						to_destroy.push(effect);
					}
				}
			}
			while (current !== null) {
				if ((current.f & INERT) === 0 && current !== state.fallback) {
					to_destroy.push(current);
				}
				current = skip_to_branch(current.next);
			}
			var destroy_length = to_destroy.length;
			if (destroy_length > 0) {
				var controlled_anchor = (flags & EACH_IS_CONTROLLED) !== 0 && length === 0 ? anchor : null;
				if (is_animated) {
					for (i = 0; i < destroy_length; i += 1) {
						to_destroy[i].nodes?.a?.measure();
					}
					for (i = 0; i < destroy_length; i += 1) {
						to_destroy[i].nodes?.a?.fix();
					}
				}
				pause_effects(state, to_destroy, controlled_anchor);
			}
		}
		if (is_animated) {
			queue_micro_task(() => {
				if (to_animate === undefined) return;
				for (effect of to_animate) {
					effect.nodes?.a?.apply();
				}
			});
		}
	}
	function create_item(items, anchor, value, key, index, render_fn, flags, get_collection) {
		var v =
			(flags & EACH_ITEM_REACTIVE) !== 0
				? (flags & EACH_ITEM_IMMUTABLE) === 0
					? mutable_source(value, false, false)
					: source(value)
				: null;
		var i = (flags & EACH_INDEX_REACTIVE) !== 0 ? source(index) : null;
		return {
			v,
			i,
			e: branch(() => {
				render_fn(anchor, v ?? value, i ?? index, get_collection);
				return () => {
					items.delete(key);
				};
			})
		};
	}
	function move(effect, next, anchor) {
		if (!effect.nodes) return;
		var node = effect.nodes.start;
		var end = effect.nodes.end;
		var dest =
			next && (next.f & EFFECT_OFFSCREEN) === 0
				?  (next.nodes).start
				: anchor;
		while (node !== null) {
			var next_node =  (get_next_sibling(node));
			dest.before(node);
			if (node === end) {
				return;
			}
			node = next_node;
		}
	}
	function link$1(state, prev, next) {
		if (prev === null) {
			state.effect.first = next;
		} else {
			prev.next = next;
		}
		if (next === null) {
			state.effect.last = prev;
		} else {
			next.prev = prev;
		}
	}

	function html$1(
		node,
		get_value,
		is_controlled = false,
		svg = false,
		mathml = false,
		skip_warning = false
	) {
		var anchor = node;
		var value = '';
		if (is_controlled) {
			var parent_node =  (node);
		}
		template_effect(() => {
			var effect =  (active_effect);
			if (value === (value = get_value() ?? '')) {
				return;
			}
			if (is_controlled && true) {
				effect.nodes = null;
				parent_node.innerHTML =  (value);
				if (value !== '') {
					assign_nodes(
						 (get_first_child(parent_node)),
						 (parent_node.lastChild)
					);
				}
				return;
			}
			if (effect.nodes !== null) {
				remove_effect_dom(effect.nodes.start,  (effect.nodes.end));
				effect.nodes = null;
			}
			if (value === '') return;
			var ns = svg ? NAMESPACE_SVG : mathml ? NAMESPACE_MATHML : undefined;
			var wrapper =  (
				create_element(svg ? 'svg' : mathml ? 'math' : 'template', ns)
			);
			wrapper.innerHTML =  (value);
			var node = svg || mathml ? wrapper :  (wrapper).content;
			assign_nodes(
				 (get_first_child(node)),
				 (node.lastChild)
			);
			if (svg || mathml) {
				while (get_first_child(node)) {
					anchor.before( (get_first_child(node)));
				}
			} else {
				anchor.before(node);
			}
		});
	}

	function snippet(node, get_snippet, ...args) {
		var branches = new BranchManager(node);
		block(() => {
			const snippet = get_snippet() ?? null;
			branches.ensure(snippet, snippet && ((anchor) => snippet(anchor, ...args)));
		}, EFFECT_TRANSPARENT);
	}

	function component(node, get_component, render_fn) {
		var branches = new BranchManager(node);
		block(() => {
			var component = get_component() ?? null;
			branches.ensure(component, component && ((target) => render_fn(target, component)));
		}, EFFECT_TRANSPARENT);
	}

	function element$1(node, get_tag, is_svg, render_fn, get_namespace, location) {
		var element = null;
		var anchor =  (node);
		var branches = new BranchManager(anchor, false);
		block(() => {
			const next_tag = get_tag() || null;
			var ns = next_tag === 'svg'
					? NAMESPACE_SVG
					: undefined;
			if (next_tag === null) {
				branches.ensure(null, null);
				return;
			}
			branches.ensure(next_tag, (anchor) => {
				if (next_tag) {
					element = create_element(next_tag, ns);
					assign_nodes(element, element);
					if (render_fn) {
						var tmp_comment = null;
						var child_anchor = element.appendChild(create_text());
						render_fn(element, child_anchor);
						tmp_comment?.remove();
					}
					 (active_effect).nodes.end = element;
					anchor.before(element);
				}
			});
			return () => {
			};
		}, EFFECT_TRANSPARENT);
		teardown(() => {
		});
	}

	function append_styles$1(anchor, css) {
		effect(() => {
			anchor = active_effect?.parent?.nodes?.start ?? anchor;
			var root = anchor.getRootNode();
			var target =  (root).host
				?  (root)
				:  (root).head ??  (root.ownerDocument).head;
			if (!target.querySelector('#' + css.hash)) {
				const style = create_element('style');
				style.id = css.hash;
				style.textContent = css.code;
				target.appendChild(style);
			}
		});
	}

	function attach(node, get_fn) {
		var fn = undefined;
		var e;
		managed(() => {
			if (fn !== (fn = get_fn())) {
				if (e) {
					destroy_effect(e);
					e = null;
				}
				if (fn) {
					e = branch(() => {
						effect(() =>  (fn)(node));
					});
				}
			}
		});
	}

	function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f);}else for(f in e)e[f]&&(n&&(n+=" "),n+=f);return n}function clsx$1(){for(var e,t,f=0,n="",o=arguments.length;f<o;f++)(e=arguments[f])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}

	function clsx(value) {
		if (typeof value === 'object') {
			return clsx$1(value);
		} else {
			return value ?? '';
		}
	}
	const whitespace = [...' \t\n\r\f\u00a0\u000b\ufeff'];
	function to_class(value, hash, directives) {
		var classname = value == null ? '' : '' + value;
		if (hash) {
			classname = classname ? classname + ' ' + hash : hash;
		}
		if (directives) {
			for (var key of Object.keys(directives)) {
				if (directives[key]) {
					classname = classname ? classname + ' ' + key : key;
				} else if (classname.length) {
					var len = key.length;
					var a = 0;
					while ((a = classname.indexOf(key, a)) >= 0) {
						var b = a + len;
						if (
							(a === 0 || whitespace.includes(classname[a - 1])) &&
							(b === classname.length || whitespace.includes(classname[b]))
						) {
							classname = (a === 0 ? '' : classname.substring(0, a)) + classname.substring(b + 1);
						} else {
							a = b;
						}
					}
				}
			}
		}
		return classname === '' ? null : classname;
	}
	function append_styles(styles, important = false) {
		var separator = important ? ' !important;' : ';';
		var css = '';
		for (var key of Object.keys(styles)) {
			var value = styles[key];
			if (value != null && value !== '') {
				css += ' ' + key + ': ' + value + separator;
			}
		}
		return css;
	}
	function to_css_name(name) {
		if (name[0] !== '-' || name[1] !== '-') {
			return name.toLowerCase();
		}
		return name;
	}
	function to_style(value, styles) {
		if (styles) {
			var new_style = '';
			var normal_styles;
			var important_styles;
			if (Array.isArray(styles)) {
				normal_styles = styles[0];
				important_styles = styles[1];
			} else {
				normal_styles = styles;
			}
			if (value) {
				value = String(value)
					.replaceAll(/\/\*.*?\*\//g, '')
					.trim();
				var in_str = false;
				var in_apo = 0;
				var in_comment = false;
				var reserved_names = [];
				if (normal_styles) {
					reserved_names.push(...Object.keys(normal_styles).map(to_css_name));
				}
				if (important_styles) {
					reserved_names.push(...Object.keys(important_styles).map(to_css_name));
				}
				var start_index = 0;
				var name_index = -1;
				const len = value.length;
				for (var i = 0; i < len; i++) {
					var c = value[i];
					if (in_comment) {
						if (c === '/' && value[i - 1] === '*') {
							in_comment = false;
						}
					} else if (in_str) {
						if (in_str === c) {
							in_str = false;
						}
					} else if (c === '/' && value[i + 1] === '*') {
						in_comment = true;
					} else if (c === '"' || c === "'") {
						in_str = c;
					} else if (c === '(') {
						in_apo++;
					} else if (c === ')') {
						in_apo--;
					}
					if (!in_comment && in_str === false && in_apo === 0) {
						if (c === ':' && name_index === -1) {
							name_index = i;
						} else if (c === ';' || i === len - 1) {
							if (name_index !== -1) {
								var name = to_css_name(value.substring(start_index, name_index).trim());
								if (!reserved_names.includes(name)) {
									if (c !== ';') {
										i++;
									}
									var property = value.substring(start_index, i).trim();
									new_style += ' ' + property + ';';
								}
							}
							start_index = i + 1;
							name_index = -1;
						}
					}
				}
			}
			if (normal_styles) {
				new_style += append_styles(normal_styles);
			}
			if (important_styles) {
				new_style += append_styles(important_styles, true);
			}
			new_style = new_style.trim();
			return new_style === '' ? null : new_style;
		}
		return value == null ? null : String(value);
	}

	function set_class(dom, is_html, value, hash, prev_classes, next_classes) {
		var prev =  (dom)[CLASS_CACHE];
		if (
			prev !== value ||
			prev === undefined
		) {
			var next_class_name = to_class(value, hash, next_classes);
			{
				if (next_class_name == null) {
					dom.removeAttribute('class');
				} else if (is_html) {
					dom.className = next_class_name;
				} else {
					dom.setAttribute('class', next_class_name);
				}
			}
			 (dom)[CLASS_CACHE] = value;
		} else if (next_classes && prev_classes !== next_classes) {
			for (var key in next_classes) {
				var is_present = !!next_classes[key];
				if (prev_classes == null || is_present !== !!prev_classes[key]) {
					dom.classList.toggle(key, is_present);
				}
			}
		}
		return next_classes;
	}

	function update_styles(dom, prev = {}, next, priority) {
		for (var key in next) {
			var value = next[key];
			if (prev[key] !== value) {
				if (next[key] == null) {
					dom.style.removeProperty(key);
				} else {
					dom.style.setProperty(key, value, priority);
				}
			}
		}
	}
	function set_style(dom, value, prev_styles, next_styles) {
		var prev =  (dom)[STYLE_CACHE];
		if (prev !== value) {
			var next_style_attr = to_style(value, next_styles);
			{
				if (next_style_attr == null) {
					dom.removeAttribute('style');
				} else {
					dom.style.cssText = next_style_attr;
				}
			}
			 (dom)[STYLE_CACHE] = value;
		} else if (next_styles) {
			if (Array.isArray(next_styles)) {
				update_styles(dom, prev_styles?.[0], next_styles[0]);
				update_styles(dom, prev_styles?.[1], next_styles[1], 'important');
			} else {
				update_styles(dom, prev_styles, next_styles);
			}
		}
		return next_styles;
	}

	function set_selected(option, selected) {
		if (selected) {
			if (!option.hasAttribute('selected')) option.setAttribute('selected', '');
		} else {
			option.removeAttribute('selected');
		}
	}
	function set_default_select_value(select, value) {
		var mounting = !('__defaultValue' in select);
		if (!mounting && select.__defaultValue === value) return;
		select.__defaultValue = value;
		apply_default_select_value(select, !mounting || '__value' in select);
	}
	function apply_default_select_value(select, preserve) {
		var value = select.__defaultValue;
		var multiple = select.multiple;
		var values = multiple ? value ?? [] : null;
		if (multiple && !is_array(values)) return;
		var index = select.selectedIndex;
		var selected = preserve && multiple ? new Set(select.selectedOptions) : null;
		for (var option of select.options) {
			var option_value = get_option_value(option);
			set_selected(
				option,
				multiple ?  (values).includes(option_value) : is(option_value, value)
			);
		}
		if (!preserve) return;
		if (selected !== null) {
			for (option of select.options) {
				var was_selected = selected.has(option);
				if (option.selected !== was_selected) option.selected = was_selected;
			}
		} else if (select.selectedIndex !== index) {
			select.selectedIndex = index;
		}
	}
	function select_option(select, value, mounting = false) {
		if (select.multiple) {
			if (value == undefined) {
				return;
			}
			if (!is_array(value)) {
				return select_multiple_invalid_value();
			}
			for (var option of select.options) {
				option.selected = value.includes(get_option_value(option));
			}
			return;
		}
		for (option of select.options) {
			var option_value = get_option_value(option);
			if (is(option_value, value)) {
				option.selected = true;
				return;
			}
		}
		if (!mounting || value !== undefined) {
			select.selectedIndex = -1;
		}
	}
	function init_select(select) {
		var observer = new MutationObserver((entries) => {
			if (entries.every(is_selectedcontent_mutation)) return;
			if ('__defaultValue' in select) {
				apply_default_select_value(select, false);
			}
			if ('__value' in select) {
				select_option(select, select.__value);
			}
		});
		observer.observe(select, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['value']
		});
		teardown(() => {
			observer.disconnect();
		});
	}
	function get_option_value(option) {
		if ('__value' in option) {
			return option.__value;
		} else {
			return option.value;
		}
	}
	function is_selectedcontent_mutation(entry) {
		if ( (entry.target).closest('selectedcontent') !== null) {
			return true;
		}
		if (entry.type === 'childList') {
			var nodes = [...entry.addedNodes, ...entry.removedNodes];
			return nodes.length > 0 && nodes.every((node) => node.nodeName === 'SELECTEDCONTENT');
		}
		return false;
	}

	const CLASS = Symbol('class');
	const STYLE = Symbol('style');
	const IS_CUSTOM_ELEMENT = Symbol('is custom element');
	const IS_HTML = Symbol('is html');
	const INPUT_TAG = IS_XHTML ? 'input' : 'INPUT';
	const OPTION_TAG = IS_XHTML ? 'option' : 'OPTION';
	const SELECT_TAG = IS_XHTML ? 'select' : 'SELECT';
	const PROGRESS_TAG = IS_XHTML ? 'progress' : 'PROGRESS';
	function set_value(element, value) {
		var attributes = get_attributes(element);
		if (
			attributes.value ===
				(attributes.value =
					value ?? undefined) ||
			(element.value === value && (value !== 0 || element.nodeName !== PROGRESS_TAG))
		) {
			return;
		}
		element.value = value ?? '';
	}
	function set_checked(element, checked) {
		var attributes = get_attributes(element);
		if (
			attributes.checked ===
			(attributes.checked =
				checked ?? undefined)
		) {
			return;
		}
		element.checked = checked;
	}
	function set_attribute(element, attribute, value, skip_warning) {
		var attributes = get_attributes(element);
		if (attributes[attribute] === (attributes[attribute] = value)) return;
		if (attribute === 'loading') {
			element[LOADING_ATTR_SYMBOL] = value;
		}
		if (value == null) {
			element.removeAttribute(attribute);
		} else if (typeof value !== 'string' && get_setters(element).has(attribute)) {
			element[attribute] = value;
		} else {
			element.setAttribute(attribute, value);
		}
	}
	function set_attributes(
		element,
		prev,
		next,
		css_hash,
		should_remove_defaults = false,
		skip_warning = false
	) {
		var attributes = get_attributes(element);
		var is_custom_element = attributes[IS_CUSTOM_ELEMENT];
		var preserve_attribute_case = !attributes[IS_HTML];
		var current = prev || {};
		var is_option_element = element.nodeName === OPTION_TAG;
		var is_select_element = element.nodeName === SELECT_TAG;
		for (var key in prev) {
			if (!(key in next) && key[0] + key[1] !== '$$') {
				next[key] = null;
			}
		}
		if (next.class) {
			next.class = clsx(next.class);
		} else if (css_hash || next[CLASS]) {
			next.class = null;
		}
		if (next[STYLE]) {
			next.style ??= null;
		}
		var setters = get_setters(element);
		if (element.nodeName === INPUT_TAG && 'type' in next && ('value' in next || '__value' in next)) {
			var type = next.type;
			if (type !== current.type || (type === undefined && element.hasAttribute('type'))) {
				current.type = type;
				set_attribute(element, 'type', type);
			}
		}
		for (const key in next) {
			let value = next[key];
			if (is_option_element && key === 'value' && value == null) {
				element.value = element.__value = '';
				current[key] = value;
				continue;
			}
			if (key === 'class') {
				var is_html = element.namespaceURI === 'http://www.w3.org/1999/xhtml';
				set_class(element, is_html, value, css_hash, prev?.[CLASS], next[CLASS]);
				current[key] = value;
				current[CLASS] = next[CLASS];
				continue;
			}
			if (key === 'style') {
				set_style(element, value, prev?.[STYLE], next[STYLE]);
				current[key] = value;
				current[STYLE] = next[STYLE];
				continue;
			}
			var prev_value = current[key];
			if (value === prev_value && !(value === undefined && element.hasAttribute(key))) {
				continue;
			}
			current[key] = value;
			var prefix = key[0] + key[1];
			if (prefix === '$$') continue;
			if (prefix === 'on') {
				const opts = {};
				const event_handle_key = '$$' + key;
				let event_name = key.slice(2);
				var is_delegated = can_delegate_event(event_name);
				if (is_capture_event(event_name)) {
					event_name = event_name.slice(0, -7);
					opts.capture = true;
				}
				if (!is_delegated && prev_value) {
					if (value != null) continue;
					element.removeEventListener(event_name, current[event_handle_key], opts);
					current[event_handle_key] = null;
				}
				if (is_delegated) {
					delegated(event_name, element, value);
					delegate([event_name]);
				} else if (value != null) {
					function handle(evt) {
						current[key].call(this, evt);
					}
					current[event_handle_key] = create_event(event_name, element, handle, opts);
				}
			} else if (key === 'style') {
				set_attribute(element, key, value);
			} else if (key === 'autofocus') {
				autofocus( (element), Boolean(value));
			} else if (!is_custom_element && (key === '__value' || (key === 'value' && value != null))) {
				element.value = element.__value = value;
			} else if (key === 'selected' && is_option_element) {
				set_selected( (element), value);
			} else {
				var name = key;
				if (!preserve_attribute_case) {
					name = normalize_attribute(name);
				}
				var is_default = name === 'defaultValue' || name === 'defaultChecked';
				if (is_select_element && name === 'defaultValue') continue;
				if (value == null && !is_custom_element && !is_default) {
					attributes[key] = null;
					if (name === 'value' || name === 'checked') {
						let input =  (element);
						const use_default = prev === undefined;
						if (name === 'value') {
							let previous = input.defaultValue;
							input.removeAttribute(name);
							input.defaultValue = previous;
							input.value = input.__value = use_default ? previous : null;
						} else {
							let previous = input.defaultChecked;
							input.removeAttribute(name);
							input.defaultChecked = previous;
							input.checked = use_default ? previous : false;
						}
					} else {
						element.removeAttribute(key);
					}
				} else if (
					is_default ||
					((is_custom_element || typeof value !== 'string') && setters.has(name))
				) {
					element[name] = value;
					if (name in attributes) attributes[name] = UNINITIALIZED;
				} else if (typeof value !== 'function') {
					set_attribute(element, name, value);
				}
			}
		}
		return current;
	}
	function attribute_effect(
		element,
		fn,
		sync = [],
		async = [],
		blockers = [],
		css_hash,
		should_remove_defaults = false,
		skip_warning = false
	) {
		flatten(blockers, sync, async, (values) => {
			var prev = undefined;
			var effects = {};
			var is_select = element.nodeName === SELECT_TAG;
			var inited = false;
			managed(() => {
				var next = fn(...values.map(get$1));
				var current = set_attributes(
					element,
					prev,
					next,
					css_hash,
					should_remove_defaults,
					skip_warning
				);
				if (inited && is_select) {
					var select =  (element);
					if ('defaultValue' in next) {
						set_default_select_value(select, next.defaultValue);
					}
					if ('value' in next) {
						select_option(select, next.value);
					}
				}
				for (let symbol of Object.getOwnPropertySymbols(effects)) {
					if (!next[symbol]) destroy_effect(effects[symbol]);
				}
				for (let symbol of Object.getOwnPropertySymbols(next)) {
					var n = next[symbol];
					if (symbol.description === ATTACHMENT_KEY && (!prev || n !== prev[symbol])) {
						if (effects[symbol]) destroy_effect(effects[symbol]);
						effects[symbol] = branch(() => attach(element, () => n));
					}
					current[symbol] = n;
				}
				prev = current;
			});
			if (is_select) {
				var select =  (element);
				effect(() => {
					var attrs =  (prev);
					if ('defaultValue' in attrs) {
						set_default_select_value(select, attrs.defaultValue);
					}
					select_option(select, attrs.value, true);
					init_select(select);
				});
			}
			inited = true;
		});
	}
	function get_attributes(element) {
		return  (
			 (element)[ATTRIBUTES_CACHE] ??= {
				[IS_CUSTOM_ELEMENT]: element.nodeName.includes('-'),
				[IS_HTML]: element.namespaceURI === NAMESPACE_HTML
			}
		);
	}
	var setters_cache = new Map();
	function get_setters(element) {
		var cache_key = element.getAttribute('is') || element.nodeName;
		var setters = setters_cache.get(cache_key);
		if (setters) return setters;
		setters_cache.set(cache_key, (setters = new Set()));
		var descriptors;
		var proto = element;
		var element_proto = Element.prototype;
		while (element_proto !== proto) {
			descriptors = get_descriptors(proto);
			for (var key in descriptors) {
				if (
					descriptors[key].set &&
					key !== 'innerHTML' &&
					key !== 'textContent' &&
					key !== 'innerText'
				) {
					setters.add(key);
				}
			}
			proto = get_prototype_of(proto);
		}
		return setters;
	}

	function is_bound_this(bound_value, element_or_component) {
		return (
			bound_value === element_or_component || bound_value?.[STATE_SYMBOL] === element_or_component
		);
	}
	function bind_this(
		element_or_component = mark_as_component(),
		update,
		get_value,
		get_parts
	) {
		var component_effect =  (component_context).r;
		var parent =  (active_effect);
		effect(() => {
			var old_parts;
			var parts;
			render_effect(() => {
				old_parts = parts;
				parts = [];
				untrack(() => {
					if (!is_bound_this(get_value(...parts), element_or_component)) {
						update(element_or_component, ...parts);
						if (old_parts && is_bound_this(get_value(...old_parts), element_or_component)) {
							update(null, ...old_parts);
						}
					}
				});
			});
			return () => {
				let p = parent;
				while (p !== component_effect && p.parent !== null && p.parent.f & DESTROYING) {
					p = p.parent;
				}
				const teardown = () => {
					if (parts && is_bound_this(get_value(...parts), element_or_component)) {
						update(null, ...parts);
					}
				};
				const original_teardown = p.teardown;
				p.teardown = () => {
					teardown();
					original_teardown?.();
				};
			};
		});
		return element_or_component;
	}

	const rest_props_handler = {
		get(target, key) {
			if (target.exclude.has(key)) return;
			return target.props[key];
		},
		set(target, key) {
			return false;
		},
		getOwnPropertyDescriptor(target, key) {
			if (target.exclude.has(key)) return;
			if (key in target.props) {
				return {
					enumerable: true,
					configurable: true,
					value: target.props[key]
				};
			}
		},
		has(target, key) {
			if (target.exclude.has(key)) return false;
			return key in target.props;
		},
		ownKeys(target) {
			return Reflect.ownKeys(target.props).filter((key) => !target.exclude.has(key));
		}
	};
	function rest_props(props, exclude, name) {
		return new Proxy({ props, exclude }, rest_props_handler);
	}
	function prop(props, key, flags, fallback) {
		var runes = !legacy_mode_flag || (flags & PROPS_IS_RUNES) !== 0;
		var bindable = (flags & PROPS_IS_BINDABLE) !== 0;
		var lazy = (flags & PROPS_IS_LAZY_INITIAL) !== 0;
		var fallback_value =  (fallback);
		var fallback_dirty = true;
		var fallback_signal =  (undefined);
		var get_fallback = () => {
			if (lazy && runes) {
				fallback_signal ??= derived( (fallback));
				return get$1(fallback_signal);
			}
			if (fallback_dirty) {
				fallback_dirty = false;
				fallback_value = lazy
					? untrack( (fallback))
					:  (fallback);
			}
			return fallback_value;
		};
		let setter;
		if (bindable) {
			var is_entry_props = STATE_SYMBOL in props || LEGACY_PROPS in props;
			setter =
				get_descriptor(props, key)?.set ??
				(is_entry_props && key in props ? (v) => (props[key] = v) : undefined);
		}
		var initial_value;
		var is_store_sub = false;
		if (bindable) {
			[initial_value, is_store_sub] = capture_store_binding(() =>  (props[key]));
		} else {
			initial_value =  (props[key]);
		}
		if (initial_value === undefined && fallback !== undefined) {
			initial_value = get_fallback();
			if (setter) {
				if (runes) props_invalid_value();
				setter(initial_value);
			}
		}
		var getter;
		if (runes) {
			getter = () => {
				var value =  (props[key]);
				if (value === undefined) return get_fallback();
				fallback_dirty = true;
				return value;
			};
		} else {
			getter = () => {
				var value =  (props[key]);
				if (value !== undefined) {
					fallback_value =  (undefined);
				}
				return value === undefined ? fallback_value : value;
			};
		}
		if (runes && (flags & PROPS_IS_UPDATED) === 0) {
			return getter;
		}
		if (setter) {
			var legacy_parent = props.$$legacy;
			return  (
				function ( value,  mutation) {
					if (arguments.length > 0) {
						if (!runes || !mutation || legacy_parent || is_store_sub) {
							 (setter)(mutation ? getter() : value);
						}
						return value;
					}
					return getter();
				}
			);
		}
		var overridden = false;
		var d = ((flags & PROPS_IS_IMMUTABLE) !== 0 ? derived : derived_safe_equal)(() => {
			overridden = false;
			return getter();
		});
		if (bindable) get$1(d);
		var parent_effect =  (active_effect);
		return  (
			function ( value,  mutation) {
				if (arguments.length > 0) {
					const new_value = mutation ? get$1(d) : runes && bindable ? proxy(value) : value;
					set$1(d, new_value);
					overridden = true;
					if (fallback_value !== undefined) {
						fallback_value = new_value;
					}
					return value;
				}
				if ((is_destroying_effect && overridden) || (parent_effect.f & DESTROYED) !== 0) {
					return d.v;
				}
				return get$1(d);
			}
		);
	}

	const PUBLIC_VERSION = '5';

	if (typeof window !== 'undefined') {
		((window.__svelte ??= {}).v ??= new Set()).add(PUBLIC_VERSION);
	}

	const SEGMENTER = new Intl.Segmenter('en', { granularity: 'grapheme' });
	const VIRTUAL_KEYBOARD_MIN_HEIGHT = 50;
	function is_virtual_keyboard_active() {
	    if (typeof window === 'undefined' || typeof document === 'undefined') {
	        return false;
	    }
	    if (!is_mobile_browser()) {
	        return false;
	    }
	    const visual_viewport = window.visualViewport;
	    if (!visual_viewport) {
	        return false;
	    }
	    return visual_viewport.height < document.documentElement.clientHeight - VIRTUAL_KEYBOARD_MIN_HEIGHT;
	}
	function is_mobile_browser() {
	    if (typeof navigator === 'undefined') {
	        return false;
	    }
	    const user_agent = navigator.userAgent;
	    return /iPhone|iPad|iPod|Android|Mobile/i.test(user_agent);
	}
	function get_char_length(str) {
	    return [...SEGMENTER.segment(str)].length;
	}
	function char_slice(str, start, end = undefined) {
	    const segments = [...SEGMENTER.segment(str)];
	    return segments
	        .slice(start, end)
	        .map((s) => s.segment)
	        .join('');
	}
	function char_to_utf16_offset(str, char_offset) {
	    const segments = [...SEGMENTER.segment(str)];
	    let utf16_offset = 0;
	    for (let i = 0; i < Math.min(char_offset, segments.length); i++) {
	        utf16_offset += segments[i].segment.length;
	    }
	    return utf16_offset;
	}
	function split_text(text_value, at_position) {
	    const { content } = text_value;
	    const left = {
	        content: char_slice(content, 0, at_position),
	        marks: [],
	        annotations: []
	    };
	    const right = {
	        content: char_slice(content, at_position),
	        marks: [],
	        annotations: []
	    };
	    for (const key of ['marks', 'annotations']) {
	        for (const { start_offset, end_offset, node_id } of text_value[key] ?? []) {
	            if (end_offset <= at_position) {
	                left[key].push({ start_offset, end_offset, node_id });
	            }
	            else if (start_offset >= at_position) {
	                right[key].push({
	                    start_offset: start_offset - at_position,
	                    end_offset: end_offset - at_position,
	                    node_id
	                });
	            }
	            else {
	                left[key].push({ start_offset, end_offset: at_position, node_id });
	                right[key].push({ start_offset: 0, end_offset: end_offset - at_position, node_id });
	            }
	        }
	    }
	    return [left, right];
	}
	function join_text(first_text, second_text) {
	    const joined = {
	        content: first_text.content + second_text.content,
	        marks: [],
	        annotations: []
	    };
	    const offset = get_char_length(first_text.content);
	    for (const key of ['marks', 'annotations']) {
	        const joined_ranges = (first_text[key] ?? []).map((range) => ({ ...range }));
	        for (const { start_offset, end_offset, node_id } of second_text[key] ?? []) {
	            const shifted_range = {
	                start_offset: start_offset + offset,
	                end_offset: end_offset + offset,
	                node_id
	            };
	            const last_range = joined_ranges[joined_ranges.length - 1];
	            if (last_range &&
	                last_range.end_offset === shifted_range.start_offset &&
	                last_range.node_id === shifted_range.node_id) {
	                last_range.end_offset = shifted_range.end_offset;
	            }
	            else {
	                joined_ranges.push(shifted_range);
	            }
	        }
	        joined[key] = joined_ranges;
	    }
	    return joined;
	}
	const PATH_SEPARATOR = '__';
	const PATH_STRING_SEGMENT_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;
	const PATH_INDEX_SEGMENT_RE = /^(0|[1-9]\d*)$/;
	function is_path_string_segment_valid(segment) {
	    return (typeof segment === 'string' &&
	        PATH_STRING_SEGMENT_RE.test(segment) &&
	        !segment.includes(PATH_SEPARATOR));
	}
	function assert_path_string_segment(segment, label = 'Path segment') {
	    if (!is_path_string_segment_valid(segment)) {
	        throw new Error(`${label} must start with a letter or underscore and contain only letters, numbers, underscores, or dashes. It must not contain "${PATH_SEPARATOR}".`);
	    }
	}
	function serialize_path(path) {
	    return path
	        .map((segment) => {
	        if (typeof segment === 'number') {
	            if (!Number.isInteger(segment) || segment < 0) {
	                throw new Error(`Path index must be a non-negative integer: ${segment}`);
	            }
	            return String(segment);
	        }
	        assert_path_string_segment(segment);
	        return segment;
	    })
	        .join(PATH_SEPARATOR);
	}
	function deserialize_path(serialized_path) {
	    if (serialized_path === '')
	        return [];
	    return serialized_path.split(PATH_SEPARATOR).map((segment) => {
	        if (segment === '') {
	            throw new Error(`Invalid serialized path: ${serialized_path}`);
	        }
	        if (/^\d+$/.test(segment)) {
	            if (!PATH_INDEX_SEGMENT_RE.test(segment)) {
	                throw new Error(`Invalid serialized path index: ${segment}`);
	            }
	            return Number(segment);
	        }
	        assert_path_string_segment(segment, 'Serialized path segment');
	        return segment;
	    });
	}
	function paths_equal(a, b) {
	    if (a.length !== b.length)
	        return false;
	    return a.every((segment, index) => segment === b[index]);
	}
	function traverse_ids(node_id, schema, nodes) {
	    const ids = [];
	    const visited = {};
	    const visit = (node) => {
	        if (!node || visited[node.id]) {
	            return;
	        }
	        visited[node.id] = true;
	        for (const [property_name, value] of Object.entries(node)) {
	            const property_definition = schema[node.type].properties[property_name];
	            if (property_definition?.type === 'node_array') {
	                for (const v of value?.nodes || []) {
	                    if (typeof v === 'string') {
	                        visit(nodes[v]);
	                    }
	                }
	                for (const range of [...(value?.marks || []), ...(value?.annotations || [])]) {
	                    visit(nodes[range.node_id]);
	                }
	            }
	            else if (property_definition?.type === 'node') {
	                visit(nodes[value]);
	            }
	            else if (property_definition?.type === 'text') {
	                for (const range of [...(value.marks || []), ...(value.annotations || [])]) {
	                    visit(nodes[range.node_id]);
	                }
	            }
	        }
	        ids.push(node.id);
	    };
	    visit(nodes[node_id]);
	    return ids;
	}
	function traverse(node_id, schema, nodes) {
	    const json = [];
	    const visited = {};
	    const visit = (node) => {
	        if (!node || visited[node.id]) {
	            return;
	        }
	        visited[node.id] = true;
	        for (const [property_name, value] of Object.entries(node)) {
	            const property_definition = schema[node.type].properties[property_name];
	            if (property_definition?.type === 'node_array') {
	                const node_ids = value?.nodes || [];
	                for (const v of node_ids) {
	                    if (typeof v === 'string') {
	                        visit(nodes[v]);
	                    }
	                }
	                for (const range of [...(value?.marks || []), ...(value?.annotations || [])]) {
	                    visit(nodes[range.node_id]);
	                }
	            }
	            else if (property_definition?.type === 'node') {
	                visit(nodes[value]);
	            }
	            else if (property_definition?.type === 'text') {
	                for (const range of [...(value.marks || []), ...(value.annotations || [])]) {
	                    visit(nodes[range.node_id]);
	                }
	            }
	        }
	        json.push(structuredClone(node));
	    };
	    visit(nodes[node_id]);
	    return json;
	}
	function get_selection_range(selection) {
	    if (selection && selection.type !== 'property') {
	        return {
	            start_offset: Math.min(selection.anchor_offset, selection.focus_offset),
	            end_offset: Math.max(selection.anchor_offset, selection.focus_offset)
	        };
	    }
	    else {
	        return null;
	    }
	}
	function is_selection_collapsed(selection) {
	    if (selection && selection.type !== 'property') {
	        return selection.anchor_offset === selection.focus_offset;
	    }
	    else {
	        return false;
	    }
	}
	function adjust_ranges_for_deletion(ranges, start, end) {
	    const removed_node_ids = [];
	    const deletion_length = end - start;
	    const next_ranges = ranges
	        .map((range) => {
	        if (range.end_offset <= start)
	            return range;
	        let start_offset = range.start_offset;
	        if (range.start_offset >= end) {
	            start_offset -= deletion_length;
	        }
	        else if (range.start_offset > start) {
	            start_offset = start;
	        }
	        let end_offset = range.end_offset;
	        if (range.end_offset >= end) {
	            end_offset -= deletion_length;
	        }
	        else if (range.end_offset > start) {
	            end_offset = start;
	        }
	        if (start_offset >= end_offset) {
	            removed_node_ids.push(range.node_id);
	            return null;
	        }
	        return { start_offset, end_offset, node_id: range.node_id };
	    })
	        .filter((range) => range !== null);
	    return { ranges: next_ranges, removed_node_ids };
	}
	function adjust_ranges_for_insertion(ranges, offset, length) {
	    if (length === 0)
	        return ranges;
	    return ranges.map((range) => {
	        if (range.end_offset <= offset)
	            return range;
	        if (range.start_offset < offset) {
	            return {
	                start_offset: range.start_offset,
	                end_offset: range.end_offset + length,
	                node_id: range.node_id
	            };
	        }
	        return {
	            start_offset: range.start_offset + length,
	            end_offset: range.end_offset + length,
	            node_id: range.node_id
	        };
	    });
	}
	function are_ranges_exclusive(ranges, length = Infinity) {
	    const sorted = [...ranges].sort((a, b) => a.start_offset - b.start_offset || a.end_offset - b.end_offset);
	    return sorted.every((range, index) => Number.isInteger(range.start_offset) &&
	        Number.isInteger(range.end_offset) &&
	        range.start_offset >= 0 &&
	        range.start_offset < range.end_offset &&
	        range.end_offset <= length &&
	        (index === 0 || range.start_offset >= sorted[index - 1].end_offset));
	}
	function calculate_fragment_ranges(length, marks, selection_highlight_range) {
	    const fragments = [];
	    let last_index = 0;
	    const ranges = [...marks, ...(selection_highlight_range ? [selection_highlight_range] : [])].sort((a, b) => a.start_offset - b.start_offset);
	    for (const range of ranges) {
	        if (range.start_offset > last_index) {
	            fragments.push({
	                type: 'content',
	                start_offset: last_index,
	                end_offset: range.start_offset
	            });
	        }
	        if ('node_id' in range) {
	            const mark = range;
	            const mark_index = mark.mark_index ?? marks.indexOf(mark);
	            fragments.push({
	                type: 'mark',
	                start_offset: mark.start_offset,
	                end_offset: mark.end_offset,
	                node_id: mark.node_id,
	                mark_index
	            });
	        }
	        else {
	            fragments.push({
	                type: 'selection_highlight',
	                start_offset: range.start_offset,
	                end_offset: range.end_offset
	            });
	        }
	        last_index = range.end_offset;
	    }
	    if (last_index < length) {
	        fragments.push({
	            type: 'content',
	            start_offset: last_index,
	            end_offset: length
	        });
	    }
	    return fragments;
	}

	function is_record(value) {
	    return typeof value === 'object' && value !== null;
	}
	function is_text(value) {
	    return (is_record(value) &&
	        typeof value.content === 'string' &&
	        Array.isArray(value.marks) &&
	        Array.isArray(value.annotations));
	}
	function normalize_line_endings(text) {
	    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	}
	function dedent_plain_text(plain_text) {
	    const lines = normalize_line_endings(plain_text).split('\n');
	    if (lines.length < 2)
	        return plain_text;
	    const non_empty_lines = lines.filter((line) => line.trim().length > 0);
	    if (non_empty_lines.length === 0)
	        return plain_text;
	    const indented_non_empty_lines = non_empty_lines.filter((line) => /^[\t ]+/.test(line));
	    const indented_line_ratio = indented_non_empty_lines.length / non_empty_lines.length;
	    if (indented_line_ratio < 0.8)
	        return plain_text;
	    const leading_whitespace_lengths = indented_non_empty_lines
	        .map((line) => line.match(/^[\t ]+/)?.[0].length || 0)
	        .filter(Boolean);
	    if (leading_whitespace_lengths.length === 0)
	        return plain_text;
	    const dedent_size = Math.min(...leading_whitespace_lengths);
	    if (dedent_size <= 0)
	        return plain_text;
	    return lines
	        .map((line) => {
	        if (line.trim().length === 0)
	            return line;
	        let removable_count = 0;
	        while (removable_count < dedent_size && removable_count < line.length) {
	            const char = line[removable_count];
	            if (char === ' ' || char === '\t') {
	                removable_count += 1;
	            }
	            else {
	                break;
	            }
	        }
	        return line.slice(removable_count);
	    })
	        .join('\n');
	}
	function split_plain_text_paragraphs(plain_text) {
	    return normalize_line_endings(plain_text)
	        .split(/\n{2,}/)
	        .map((fragment) => fragment.trim())
	        .filter(Boolean);
	}
	function normalize_plain_text_for_single_line_property(plain_text) {
	    return normalize_line_endings(plain_text).replace(/\s*\n+\s*/g, ' ');
	}
	function get_text_property_name(node_type, schema) {
	    if (!node_type)
	        return null;
	    const node_schema = schema[node_type];
	    if (!node_schema || node_schema.kind !== 'text')
	        return null;
	    if (node_schema.properties?.content?.type === 'text')
	        return 'content';
	    return (Object.entries(node_schema.properties).find(([, property_definition]) => {
	        return property_definition.type === 'text';
	    })?.[0] || null);
	}
	function get_text_content(node, schema) {
	    if (!is_record(node))
	        return null;
	    const node_type = typeof node.type === 'string' ? node.type : null;
	    const text_property_name = get_text_property_name(node_type, schema);
	    if (text_property_name && is_text(node[text_property_name])) {
	        return node[text_property_name];
	    }
	    if (is_text(node.content)) {
	        return node.content;
	    }
	    return null;
	}
	function is_text_like_node_payload(node, schema) {
	    if (!is_record(node))
	        return false;
	    if (typeof node.type === 'string' && schema[node.type]?.kind === 'text')
	        return true;
	    return !!get_text_content(node, schema);
	}
	function get_default_text_node(node_array_property_definition, schema) {
	    if (!is_record(node_array_property_definition) ||
	        node_array_property_definition.type !== 'node_array' ||
	        !Array.isArray(node_array_property_definition.node_types)) {
	        return null;
	    }
	    const default_node_type = node_array_property_definition.default_node_type;
	    if (typeof default_node_type === 'string' && schema[default_node_type]?.kind === 'text') {
	        return default_node_type;
	    }
	    return (node_array_property_definition.node_types.find((node_type) => typeof node_type === 'string' && schema[node_type]?.kind === 'text') || null);
	}
	function create_plain_text_nodes_payload(paragraph_fragments, node_type, schema) {
	    if (!Array.isArray(paragraph_fragments) || paragraph_fragments.length === 0 || !node_type) {
	        return null;
	    }
	    const text_property_name = get_text_property_name(node_type, schema);
	    if (!text_property_name)
	        return null;
	    const payload = {
	        main_nodes: [],
	        nodes: {}
	    };
	    for (let i = 0; i < paragraph_fragments.length; i++) {
	        const fragment = paragraph_fragments[i];
	        const node_id = 'fragment_' + i;
	        payload.nodes[node_id] = {
	            id: node_id,
	            type: node_type,
	            [text_property_name]: {
	                content: fragment,
	                marks: [],
	                annotations: []
	            }
	        };
	        payload.main_nodes.push(node_id);
	    }
	    return payload;
	}

	var read_methods = ['forEach', 'isDisjointFrom', 'isSubsetOf', 'isSupersetOf'];
	var set_like_methods = ['difference', 'intersection', 'symmetricDifference', 'union'];
	var inited = false;
	class SvelteSet extends Set {
		#sources = new Map();
		#version = state(0);
		#size = state(0);
		#update_version = update_version || -1;
		constructor(value) {
			super();
			if (value) {
				for (var element of value) {
					super.add(element);
				}
				this.#size.v = super.size;
			}
			if (!inited) this.#init();
		}
		#source(value) {
			return update_version === this.#update_version ? state(value) : source(value);
		}
		#init() {
			inited = true;
			var proto = SvelteSet.prototype;
			var set_proto = Set.prototype;
			for (const method of read_methods) {
				proto[method] = function (...v) {
					get$1(this.#version);
					return set_proto[method].apply(this, v);
				};
			}
			for (const method of set_like_methods) {
				proto[method] = function (...v) {
					get$1(this.#version);
					var set =  (set_proto[method].apply(this, v));
					return new SvelteSet(set);
				};
			}
		}
		has(value) {
			var has = super.has(value);
			var sources = this.#sources;
			var s = sources.get(value);
			if (s === undefined) {
				if (!has) {
					get$1(this.#version);
					return false;
				}
				s = this.#source(true);
				sources.set(value, s);
			}
			get$1(s);
			return has;
		}
		add(value) {
			if (!super.has(value)) {
				super.add(value);
				set$1(this.#size, super.size);
				increment(this.#version);
			}
			return this;
		}
		delete(value) {
			var deleted = super.delete(value);
			var sources = this.#sources;
			var s = sources.get(value);
			if (s !== undefined) {
				sources.delete(value);
				set$1(s, false);
			}
			if (deleted) {
				set$1(this.#size, super.size);
				increment(this.#version);
			}
			return deleted;
		}
		clear() {
			if (super.size === 0) {
				return;
			}
			super.clear();
			var sources = this.#sources;
			for (var s of sources.values()) {
				set$1(s, false);
			}
			sources.clear();
			set$1(this.#size, 0);
			increment(this.#version);
		}
		keys() {
			return this.values();
		}
		values() {
			get$1(this.#version);
			return super.values();
		}
		entries() {
			get$1(this.#version);
			return super.entries();
		}
		[Symbol.iterator]() {
			return this.keys();
		}
		get size() {
			return get$1(this.#size);
		}
	}

	class SvelteMap extends Map {
		#sources = new Map();
		#version = state(0);
		#size = state(0);
		#update_version = update_version || -1;
		constructor(value) {
			super();
			if (value) {
				for (var [key, v] of value) {
					super.set(key, v);
				}
				this.#size.v = super.size;
			}
		}
		#source(value) {
			return update_version === this.#update_version ? state(value) : source(value);
		}
		has(key) {
			var sources = this.#sources;
			var s = sources.get(key);
			if (s === undefined) {
				if (super.has(key)) {
					s = this.#source(0);
					sources.set(key, s);
				} else {
					get$1(this.#version);
					return false;
				}
			}
			get$1(s);
			return true;
		}
		forEach(callbackfn, this_arg) {
			this.#read_all();
			super.forEach(callbackfn, this_arg);
		}
		get(key) {
			var sources = this.#sources;
			var s = sources.get(key);
			if (s === undefined) {
				if (super.has(key)) {
					s = this.#source(0);
					sources.set(key, s);
				} else {
					get$1(this.#version);
					return undefined;
				}
			}
			get$1(s);
			return super.get(key);
		}
		getOrInsert(key, value) {
			if (!super.has(key)) {
				this.set(key, value);
			}
			return  (this.get(key));
		}
		getOrInsertComputed(key, callbackFn) {
			if (!super.has(key)) {
				this.set(key, callbackFn(key));
			}
			return  (this.get(key));
		}
		set(key, value) {
			var sources = this.#sources;
			var s = sources.get(key);
			var prev_res = super.get(key);
			var res = super.set(key, value);
			var version = this.#version;
			if (s === undefined) {
				s = this.#source(0);
				sources.set(key, s);
				set$1(this.#size, super.size);
				increment(version);
			} else if (prev_res !== value) {
				increment(s);
				var v_reactions = version.reactions === null ? null : new Set(version.reactions);
				var needs_version_increase =
					v_reactions === null ||
					!s.reactions?.every((r) =>
						 (v_reactions).has(r)
					);
				if (needs_version_increase) {
					increment(version);
				}
			}
			return res;
		}
		delete(key) {
			var sources = this.#sources;
			var s = sources.get(key);
			var res = super.delete(key);
			if (s !== undefined) {
				sources.delete(key);
				set$1(s, -1);
			}
			if (res) {
				set$1(this.#size, super.size);
				increment(this.#version);
			}
			return res;
		}
		clear() {
			if (super.size === 0) {
				return;
			}
			super.clear();
			var sources = this.#sources;
			set$1(this.#size, 0);
			for (var s of sources.values()) {
				set$1(s, -1);
			}
			increment(this.#version);
			sources.clear();
		}
		#read_all() {
			get$1(this.#version);
			var sources = this.#sources;
			if (this.#size.v !== sources.size) {
				for (var key of super.keys()) {
					if (!sources.has(key)) {
						var s = this.#source(0);
						sources.set(key, s);
					}
				}
			}
			for ([, s] of this.#sources) {
				get$1(s);
			}
		}
		keys() {
			get$1(this.#version);
			return super.keys();
		}
		values() {
			this.#read_all();
			return super.values();
		}
		entries() {
			this.#read_all();
			return super.entries();
		}
		[Symbol.iterator]() {
			return this.entries();
		}
		get size() {
			get$1(this.#size);
			return super.size;
		}
	}

	const OVERSCAN_PX = 500;
	const EDGE_TOLERANCE_PX = 10;
	class VisibilityRegistry {
		#array_indices = new Map();
		edge_map = new SvelteMap();
		#io = null;
		#view_io = null;
		#array_ro = null;
		#registered_paths = new Map();
		#path_owners = new Map();
		#near_nodes = new Set();
		#array_els = new Set();
		#array_owners = new Map();
		view_classes = true;
		visibility_culling = true;
		start() {
			if (typeof window === 'undefined') return;
			if (this.visibility_culling && !this.#io) {
				this.#io = new IntersectionObserver((entries) => this.#process_near(entries), { rootMargin: `${OVERSCAN_PX}px`, threshold: [0] });
			}
			if (this.view_classes && !this.#view_io) {
				this.#view_io = new IntersectionObserver((entries) => this.#process_view(entries), { threshold: [0, 1] });
			}
			if (!this.#array_ro) {
				this.#array_ro = new ResizeObserver((entries) => {
					for (const entry of entries) this.sync_edge_state(entry.target);
				});
			}
		}
		stop() {
			this.#io?.disconnect();
			this.#io = null;
			this.#view_io?.disconnect();
			this.#view_io = null;
			this.#array_ro?.disconnect();
			this.#array_ro = null;
			this.#registered_paths.clear();
			this.#path_owners.clear();
			this.#near_nodes.clear();
			this.#array_els.clear();
			this.#array_owners.clear();
			this.edge_map.clear();
			for (const set of this.#array_indices.values()) set.clear();
		}
		get_array_indices(array_path_str) {
			let set = this.#array_indices.get(array_path_str);
			if (!set) {
				set = new SvelteSet();
				this.#array_indices.set(array_path_str, set);
			}
			return set;
		}
		track_node(path) {
			return (el) => {
				this.#register_node(el, path);
				return () => this.#unregister_node(el, path);
			};
		}
		track_array(path) {
			return (el) => {
				this.start();
				this.#array_els.add(el);
				this.#array_owners.set(path, el);
				this.#array_ro?.observe(el);
				this.sync_edge_state(el);
				return () => {
					this.#array_els.delete(el);
					this.#array_ro?.unobserve(el);
					untrack(() => {
						if (this.#array_owners.get(path) === el) {
							this.#array_owners.delete(path);
							this.edge_map.delete(path);
						}
					});
				};
			};
		}
		has_array(el) {
			return this.#array_els.has(el);
		}
		sync_all_edge_states() {
			for (const el of this.#array_els) {
				if (el.isConnected) this.sync_edge_state(el);
			}
		}
		#register_node(el, path) {
			this.start();
			untrack(() => {
				this.#registered_paths.set(el, path);
				this.#path_owners.set(path, el);
				this.#io?.observe(el);
				this.#view_io?.observe(el);
				const needs_rect = this.visibility_culling || this.view_classes;
				const bcr = needs_rect ? el.getBoundingClientRect() : null;
				const vh = window.innerHeight;
				const vw = window.innerWidth;
				const is_near = !this.visibility_culling || bcr.bottom > -OVERSCAN_PX && bcr.top < vh + OVERSCAN_PX && bcr.right > -OVERSCAN_PX && bcr.left < vw + OVERSCAN_PX;
				if (is_near) this.#add_near_node(el, path);
				if (this.view_classes) {
					const in_viewport = bcr.bottom > 0 && bcr.top < vh && bcr.right > 0 && bcr.left < vw;
					this.#apply_view_classes(el, in_viewport, bcr, vh);
				}
			});
		}
		#unregister_node(el, path) {
			this.#registered_paths.delete(el);
			this.#near_nodes.delete(el);
			this.#io?.unobserve(el);
			this.#view_io?.unobserve(el);
			untrack(() => {
				if (this.#path_owners.get(path) === el) {
					this.#path_owners.delete(path);
					const split = this.#split_path(path);
					if (split) this.#array_indices.get(split.array_path)?.delete(split.index);
				}
			});
		}
		#add_near_node(el, path) {
			this.#near_nodes.add(el);
			const split = this.#split_path(path);
			if (split) this.get_array_indices(split.array_path).add(split.index);
		}
		#remove_near_node(el, path) {
			this.#near_nodes.delete(el);
			if (this.#path_owners.get(path) !== el) return;
			const split = this.#split_path(path);
			if (split) this.#array_indices.get(split.array_path)?.delete(split.index);
		}
		sync_edge_state(array_el) {
			if (!array_el) return false;
			const path = array_el.dataset.path;
			if (!path) return false;
			const style = getComputedStyle(array_el);
			const clips_x = style.overflowX !== 'visible';
			const clips_y = style.overflowY !== 'visible';
			let first = true;
			let last = true;
			if (clips_x) {
				const sl = array_el.scrollLeft;
				first = sl <= EDGE_TOLERANCE_PX;
				last = sl + array_el.clientWidth >= array_el.scrollWidth - EDGE_TOLERANCE_PX;
			}
			if (clips_y) {
				const st = array_el.scrollTop;
				first = first && st <= EDGE_TOLERANCE_PX;
				last = last && st + array_el.clientHeight >= array_el.scrollHeight - EDGE_TOLERANCE_PX;
			}
			return untrack(() => {
				const prev = this.edge_map.get(path);
				if (prev && prev.first === first && prev.last === last) return false;
				this.edge_map.set(path, { first, last });
				return true;
			});
		}
		#apply_view_classes(el, in_viewport, bcr, vh) {
			const cl = el.classList;
			cl.toggle('in-view', in_viewport);
			if (in_viewport) {
				cl.add('seen');
				const top_clipped = bcr.top < -0.5;
				const bottom_clipped = bcr.bottom > vh + 0.5;
				cl.toggle('fully-in-view', !top_clipped && !bottom_clipped);
				cl.toggle('visible-top', !top_clipped && bottom_clipped);
				cl.toggle('visible-bottom', top_clipped && !bottom_clipped);
			} else {
				cl.remove('fully-in-view', 'visible-top', 'visible-bottom');
			}
		}
		#split_path(path) {
			const sep = path.lastIndexOf(PATH_SEPARATOR);
			if (sep < 0) return null;
			const index = parseInt(path.slice(sep + PATH_SEPARATOR.length), 10);
			if (Number.isNaN(index)) return null;
			return { array_path: path.slice(0, sep), index };
		}
		#process_near(entries) {
			for (const entry of entries) {
				const el = entry.target;
				const path = this.#registered_paths.get(el);
				if (!path || !el.isConnected) continue;
				const is_near = entry.isIntersecting;
				if (is_near === this.#near_nodes.has(el)) continue;
				if (is_near) this.#add_near_node(el, path); else this.#remove_near_node(el, path);
			}
		}
		#process_view(entries) {
			const vh = window.innerHeight;
			for (const entry of entries) {
				const el = entry.target;
				if (!this.#registered_paths.has(el) || !el.isConnected) continue;
				this.#apply_view_classes(el, entry.isIntersecting, entry.boundingClientRect, vh);
			}
		}
	}
	function create_node_visibility(svedit) {
		const registry = new VisibilityRegistry();
		registry.view_classes = svedit.session?.config?.view_classes !== false;
		registry.visibility_culling = svedit.session?.config?.visibility_culling !== false;
		svedit.visibility_registry = registry;
		user_effect(() => {
			if (typeof window === 'undefined') return;
			registry.start();
			const pending_scroll_arrays = new Set();
			let scroll_raf = 0;
			function flush_scroll_sync() {
				scroll_raf = 0;
				for (const arr of pending_scroll_arrays) {
					if (arr.isConnected) registry.sync_edge_state(arr);
				}
				pending_scroll_arrays.clear();
			}
			function on_scroll(event) {
				const target = event.target;
				const arr = target?.closest?.('[data-type="node_array"]');
				if (!arr || !registry.has_array(arr)) return;
				pending_scroll_arrays.add(arr);
				if (!scroll_raf) scroll_raf = requestAnimationFrame(flush_scroll_sync);
			}
			document.addEventListener('scroll', on_scroll, { capture: true, passive: true });
			return () => {
				document.removeEventListener('scroll', on_scroll, true);
				cancelAnimationFrame(scroll_raf);
				pending_scroll_arrays.clear();
				registry.stop();
			};
		});
		user_effect(() => {
			if (typeof window === 'undefined') return;
			svedit.session.doc;
			svedit.editable;
			let cancelled = false;
			tick().then(() => {
				if (!cancelled) registry.sync_all_edge_states();
			});
			return () => {
				cancelled = true;
			};
		});
	}
	function should_position_gap(near, edge_state, offset, is_last, empty) {
		if (!near) return false;
		if (empty) {
			return near.has(0);
		}
		if (offset === 0) {
			if (!near.has(0)) return false;
			return edge_state?.first === true;
		}
		if (is_last) {
			if (!near.has(offset - 1)) return false;
			return edge_state?.last === true;
		}
		return near.has(offset - 1) && near.has(offset);
	}

	var root$m = from_html(`<div class="selected-property-overlay svelte-ozckc"></div>`);
	var root_1$8 = from_html(`<div class="selected-node-overlay svelte-ozckc"></div>`);
	var root_2$4 = from_html(`<!> <!>`, 1);

	const $$css$c = {
		hash: 'svelte-ozckc',
		code: '.selected-node-overlay.svelte-ozckc,\n	.selected-property-overlay.svelte-ozckc {\n		/* Selection frame: a single 1px outline, offset -0.5px so the\n		   hairline centers on the node\'s edge and neighboring frames merge\n		   into one shared line. Alternatives tried and rejected:\n		   - Plain 1px border: adjacent selected nodes stack their borders\n		     into a 2px seam between them, which looks ugly.\n		   - Thick translucent frame (8px border) plus an inner hairline\n		     outline: multiple nested lines take more cognitive effort to\n		     parse than a single line.\n		   - Inset box-shadow rings (1px stroke + 8px translucent): same\n		     layered-frame look, same objection.\n		   Performance note: outlines don\'t participate in layout, so\n		   selection changes can\'t trigger reflows. */position:absolute;background:var(--editing-muted);outline:1px solid var(--editing);outline-offset:-0.5px;border-radius:1px;top:anchor(top);left:anchor(left);bottom:anchor(bottom);right:anchor(right);pointer-events:none;z-index:12;}'
	};

	function NodeSelectionMarkers($$anchor, $$props) {
		push($$props, true);
		append_styles$1($$anchor, $$css$c);

		const svedit = getContext('svedit');
		let selected_node_paths = user_derived(get_selected_node_paths);

		function get_selected_node_paths() {
			const paths = [];
			const selection = svedit.session.selection;

			if (!selection) return;
			if (selection.type !== 'node' || selection.anchor_offset === selection.focus_offset) return;

			const start = Math.min(selection.anchor_offset, selection.focus_offset);
			const end = Math.max(selection.anchor_offset, selection.focus_offset);

			for (let index = start; index < end; index++) {
				paths.push([...selection.path, index]);
			}

			return paths;
		}

		var fragment = root_2$4();
		var node = first_child(fragment);

		{
			var consequent = ($$anchor) => {
				var div = root$m();

				template_effect(($0) => set_style(div, `position-anchor: --${$0 ?? ''};`), [() => serialize_path(svedit.session.selection.path)]);
				append($$anchor, div);
			};

			if_block(node, ($$render) => {
				if (svedit.session.selection?.type === 'property') $$render(consequent);
			});
		}

		var node_1 = sibling(node, 2);

		{
			var consequent_1 = ($$anchor) => {
				var fragment_1 = comment();
				var node_2 = first_child(fragment_1);

				each(node_2, 17, () => get$1(selected_node_paths), (path) => serialize_path(path), ($$anchor, path) => {
					var div_1 = root_1$8();

					template_effect(($0) => set_style(div_1, `position-anchor: --${$0 ?? ''};`), [() => serialize_path(get$1(path))]);
					append($$anchor, div_1);
				});

				append($$anchor, fragment_1);
			};

			if_block(node_1, ($$render) => {
				if (get$1(selected_node_paths)) $$render(consequent_1);
			});
		}

		append($$anchor, fragment);
		pop();
	}

	var root_1$7 = from_html(`<div><!> <!> <div><!></div></div>`);

	const $$css$b = {
		hash: 'svelte-1fkh1fs',
		code: '.svedit-canvas.svelte-1fkh1fs {caret-color:var(--editing);caret-shape:bar;\n		/* Default to vertical/ column flow with: --row: 0; (the most common case)\n		Prevents silent failures when developers forget to set the row property in their top level node component.\n		TODO: Warn developers in dev mode via console if they forget to set the --row property and use a different flow.*/--row: 0;&:focus {outline:none;}}\n\n	/* Selection paint — wrapped in :where() so consumers can override with\n	   a plain `::selection` rule. Svelte still adds the scope hash inside\n	   the :where(), but the wrapper zeroes its specificity contribution.\n	   Final specificity is just (0,0,1), trivially beatable. */:where(.svedit-canvas.svelte-1fkh1fs) ::selection {background:var(--editing-muted);}\n\n	@media not (pointer: coarse) {.svedit-canvas.hide-selection.svelte-1fkh1fs {caret-color:transparent;}\n	}\n\n	/* When the caret is in a node gap we never want to see the caret */.svedit-canvas.node-caret.svelte-1fkh1fs,\n	.svedit-canvas.property-selection.svelte-1fkh1fs {caret-color:transparent;}\n\n	@media not (pointer: coarse) {\n		@supports (anchor-name: --test) {.svedit-canvas.hide-selection.svelte-1fkh1fs ::selection {background:transparent;}\n		}\n	}'
	};

	function Svedit($$anchor, $$props) {
		push($$props, true);
		append_styles$1($$anchor, $$css$b);

		let session = prop($$props, 'session', 7),
			editable = prop($$props, 'editable', 15, false),
			autocapitalize = prop($$props, 'autocapitalize', 3, 'on'),
			spellcheck = prop($$props, 'spellcheck', 3, 'true');

		let canvas_el;
		let root_node = user_derived(() => session().get($$props.path));
		let Overlays = user_derived(() => session().config.system_components?.overlays);
		let NodeSelectionMarkers$1 = user_derived(() => session().config.system_components?.node_selection_markers ?? NodeSelectionMarkers);
		let RootComponent = user_derived(() => session().config.node_components[get$1(root_node).type]);
		let is_composing = state(false);
		let canvas_focused = state(false);
		let before_composition_selection = null;

		// Selection restoration and selection revealing are separate concerns.
		// DOM changes (for example, toggling an annotation) can require rebuilding
		// the native selection even when the logical selection did not move. Keep
		// the last selection rendered while focused so those rebuilds do not also
		// move the viewport.
		let last_rendered_selection_snapshot = null;

		// Set by onselectionchange before it commits a DOM-derived selection
		// to the model. render_selection consumes-and-clears it to skip
		// rerender on DOM-driven changes (the DOM is already in place).
		let selection_source_is_dom = false;

		// let is_mobile = $derived(is_mobile_browser());
		// let is_chrome_desktop = $derived(is_chrome_desktop_browser());
		/** Expose function so parent can call it */
		const context = {
			get session() {
				return session();
			},

			get editable() {
				return editable();
			},

			set editable(value) {
				editable(value);
			},

			get is_composing() {
				return get$1(is_composing);
			},

			get canvas_el() {
				return canvas_el;
			},

			get canvas_focused() {
				return get$1(canvas_focused);
			},
			focus_canvas
		};

		setContext('svedit', context);
		create_node_visibility(context);

		user_effect(() => {
			check_duplicate_paths();
		});

		function check_duplicate_paths() {
			if (!canvas_el) return;

			const mounted_paths = Object.create(null);

			for (const element of canvas_el.querySelectorAll('[data-path]')) {
				if (element.closest('.svedit-canvas') !== canvas_el) continue;

				const path_str = element.getAttribute('data-path');

				if (!path_str) continue;

				if (mounted_paths[path_str]) {
					console.warn(`[svedit] Path "${path_str}" is mounted more than once. Within a single Svedit document, each path may be mounted exactly once. To render shared content in multiple places (e.g. header + footer nav), use distinct node_arrays or separate Svedit instances.`);
				}

				mounted_paths[path_str] = true;
			}
		}

		// Get KeyMapper from context (may be undefined if not provided)
		const key_mapper = getContext('key_mapper');

		// Initialize commands and keymap on the session
		user_effect(() => {
			session().initialize_commands(context);
		});

		/**
		 * @param {InputEvent} event
		 */
		async function onbeforeinput(event) {
			// console.log(`onbeforeinput: ${event.inputType}, data: "${event.data}", isComposing: ${event.isComposing}`, event);
			if (event.inputType === 'historyUndo' && get$1(is_composing)) {
				// Let the historyundo event pass through (when triggered from within oncompositionend)
				return;
			}

			// Sometimes the part that should be replaced is not the same as the current DOM selection
			// that's why we look into event.getTargetRanges()[0] if it exists.
			let target_selection;

			if (event.getTargetRanges?.()?.[0]) {
				target_selection = __get_text_selection_from_dom(event.getTargetRanges()[0]);
			}

			// While composing, Svedit does nothing and lets the oncompositionend
			// event handle the final replacement.
			if (event.isComposing) {
				// NOTE: We only capture the initial selection right after the composition started
				// We're not interested in the target selections during the composition.
				if (!before_composition_selection) {
					before_composition_selection = target_selection;
				}

				return;
			}

			// NOTE: in cases we can't reliably map event.getTargetRanges()[0] to a session selection,
			// the original session.selection is used.
			if (target_selection) {
				session().selection = target_selection;
			}

			// Only take input when in a valid text selection inside the canvas
			if (!canvas_el?.contains(document.activeElement)) {
				event.preventDefault();

				return;
			}

			if (event.inputType === 'formatBold' && session().selection?.type === 'text') {
				session().apply(session().tr.toggle_mark('strong'));
				event.preventDefault();
				event.stopPropagation();
			}

			if (event.inputType === 'formatItalic' && session().selection?.type === 'text') {
				session().apply(session().tr.toggle_mark('emphasis'));
				event.preventDefault();
				event.stopPropagation();
			}

			// NOTE: underline doesn't make much sense as a semantic mark,
			// so we rewire `cmd + u` to toggle highlights
			if (event.inputType === 'formatUnderline' && session().selection?.type === 'text') {
				session().apply(session().tr.toggle_mark('highlight'));
				event.preventDefault();
				event.stopPropagation();
			}

			if ([
				'deleteContentBackward',
				'deleteWordBackward',
				'deleteContent'
			].includes(event.inputType)) {
				session().apply(session().tr.delete_selection('backward'));
				event.preventDefault();
				event.stopPropagation();

				return;
			}

			if (['deleteContentForward', 'deleteWordForward'].includes(event.inputType)) {
				session().apply(session().tr.delete_selection('forward'));
				event.preventDefault();
				event.stopPropagation();

				return;
			}

			// For now I reject drag+drop text movements.
			// TODO: If I want to support those, I need to handle them in such a way that
			// you can drag from one text property to another too.
			if (event.inputType === 'deleteByDrag' || event.inputType === 'insertFromDrop') {
				event.preventDefault();

				return;
			}

			// Insert the character, unless there is none.
			let inserted_text = event.data;

			// Sometimes (e.g. for replacements) the inserted_text is available via
			// event.dataTransfer, not event.data
			if (!inserted_text && event.dataTransfer) {
				inserted_text = event.dataTransfer?.getData('text/plain');
			}

			// Skip, if there's no inserted_text at all
			if (!inserted_text) {
				event.preventDefault();

				return;
			}

			const tr = session().tr;

			tr.insert_text(inserted_text);
			session().apply(tr, { batch: true });
			event.preventDefault();
		}

		/**
		 * Handles composition start events for input methods like dead keys
		 * This occurs when user starts typing a composed character (e.g., backtick for accents)
		 */
		function oncompositionstart(/*event*/) {
			// console.log('DEBUG: oncompositionstart', event.data);
			if (session().selection.type !== 'text') {
				// Remove all ranges - completely clears the selection
				window.getSelection()?.removeAllRanges();

				// Restore
				setTimeout(
					() => {
						render_selection();
					},
					0
				);

				return;
			}

			// Disable keydown event handling during composition. This way, you can confirm
			// a diacritic (a->ä) with ENTER without causing a line break.
			key_mapper.skip_onkeydown = true;

			set$1(is_composing, true);

			return;
		}

		/**
		 * Handles composition end events for input methods like dead keys
		 * This occurs when composition is complete (e.g., after typing 'a' following backtick to get 'à')
		 */
		function oncompositionend(event) {
			// console.log('DEBUG: oncompositionend, insert:', event.data, event);
			if (!canvas_el?.contains(document.activeElement)) return;

			if (session().selection?.type === 'text') {
				// We need to remember the user's selection, as it might have changed in the process
				// of finishing a composition. For instance, the user might have selected a different
				// part of the text while composing.
				const user_selection = __get_selection_from_dom();

				// HACK: In order to restore the DOM state from before composition, we just run contenteditable's
				// native undo command. Then the DOM will be in sync again with the editor's internal state.
				document.execCommand('undo', false, null);

				// Firefox may not undo native composition DOM. If the composed text is
				// still present, remove it manually before applying the Svedit transaction.
				__remove_native_composition_text(before_composition_selection, event.data);

				// Set the selection to where the user initiated the composition, make changes, and apply.
				// NOTE: We need to check for valid selection here, as there is a rare race condition
				// where the user had no text selection at the start of composition.
				if (before_composition_selection) {
					session().selection = before_composition_selection;

					// console.log('event.data', event.data);
					const tr = session().tr;

					tr.insert_text(event.data);
					session().apply(tr);

					// Recover user selection after composition. This assumes that document positions of natively
					// modified DOM (before transaction applied) are equal to the positions after the transaction.
					session().selection = user_selection;
				}

				// NOTE: We need a little timeout to nudge Safari into not handling the
				// ENTER press when confirming a diacritic
				setTimeout(
					() => {
						key_mapper.skip_onkeydown = false;
						set$1(is_composing, false);
					},
					100
				);
			}

			// Reset before_composition_selection, so we are ready for capturing the starting selection
			// of the next composition.
			before_composition_selection = null;

			return;
		}

		// Map DOM selection to internal model
		function onselectionchange() {
			if (!editable()) return;
			if (!get$1(canvas_focused)) return;
			if (get$1(is_composing)) return;

			const dom_selection = window.getSelection();

			if (!dom_selection.rangeCount) return;

			// Only handle selection changes if selection is within the canvas
			const range = dom_selection.getRangeAt(0);

			if (!canvas_el?.contains(range.commonAncestorContainer)) return;

			let selection = __get_selection_from_dom();

			if (selection) {
				// Avoid assigning a new object reference when the selection is
				// structurally identical — prevents a redundant $effect cycle
				// (render_selection → scrollIntoView) on every DOM layout change.
				if (JSON.stringify(selection) === JSON.stringify(session().selection)) return;

				selection_source_is_dom = true;
				session().selection = selection;
			}
		}

		/**
		 * Creates HTML clipboard format with embedded svedit data
		 * @param {Object} json_data - The svedit data to embed
		 * @param {string} fallback_html - HTML for cross-app compatibility
		 * @returns {string} HTML with embedded svedit data
		 */
		function create_svedit_html_format(json_data, fallback_html) {
			// Use encodeURIComponent to handle Unicode, then base64 encode
			const json_string = JSON.stringify(json_data);

			const encoded_data = btoa(encodeURIComponent(json_string));

			return `<meta charset="utf-8">
<div>
  <span data-svedit="${encoded_data}"></span>
</div>
${fallback_html}`;
		}

		/**
		 * Extracts svedit data from HTML clipboard format
		 * @param {string} html - HTML content from clipboard
		 * @returns {Object|null} Parsed svedit data or null if not found
		 */
		function extract_svedit_data_from_html(html) {
			const svedit_regex = /data-svedit="([^"]+)"/;
			const match = html.match(svedit_regex);

			if (match && match[1]) {
				try {
					// Decode base64, then decode URI component to handle Unicode
					const base64_decoded = atob(match[1]);

					const decoded_data = decodeURIComponent(base64_decoded);

					return JSON.parse(decoded_data);
				} catch(e) {
					console.warn('Failed to decode svedit data from HTML:', e);

					return null;
				}
			}

			return null;
		}

		/**
		 * Default node exporter for nodes without specific exporters
		 * @param {Object} node - Node object
		 * @returns {string} HTML representation
		 */
		function default_node_html_exporter(node, session, html_exporters) {
			let html = '';
			const node_schema = session.schema[node.type];

			for (const [prop_name, prop_value] of Object.entries(node)) {
				if (prop_name === 'id' || prop_name === 'type') continue;

				const property_definition = node_schema.properties[prop_name];

				// Check if this is a text property.
				if (property_definition.type === 'text') {
					const text_content = prop_value.content;

					if (text_content.trim()) {
						html += `<p>${text_content}</p>`;
					}
				} else if (property_definition.type === 'node_array') {
					for (const child_id of prop_value.nodes) {
						const child = session.get(child_id);
						const child_exporter = html_exporters[child.type] || default_node_html_exporter;

						html += child_exporter(child, session, html_exporters);
					}
				}
			}

			return html;
		}

		function default_node_plain_text_exporter(node) {
			let plain_text = '';

			for (const [prop_name, prop_value] of Object.entries(node)) {
				if (prop_name === 'id' || prop_name === 'type') continue;

				// Check if this is a text property value.
				if (typeof prop_value === 'object' && prop_value !== null && typeof prop_value.content === 'string') {
					const text_content = prop_value.content;

					if (text_content.trim()) {
						plain_text += `${text_content.trim()}\n\n`;
					}
				}
			}

			return plain_text;
		}

		/**
		 * Exports nodes to HTML using document config exporters
		 * @param {Object[]} nodes - Array of node objects
		 * @returns {string} HTML representation
		 */
		function export_html(nodes) {
			let html = '';

			for (const node of nodes) {
				const html_exporters = session().config.html_exporters || {};

				if (html_exporters[node.type]) {
					// Use custom exporter for this node type
					html += html_exporters[node.type](node, session(), html_exporters);
				} else {
					// Use default exporter
					html += default_node_html_exporter(node, session(), html_exporters);
				}
			}

			return html;
		}

		function export_plain_text(nodes) {
			let plain_text = '';

			for (const node of nodes) {
				plain_text += default_node_plain_text_exporter(node);
			}

			return plain_text.trim();
		}

		/**
		 * @param {ClipboardEvent} event
		 * @param {boolean} delete_selection - used by oncut()
		 */
		function oncopy(event, delete_selection = false) {
			// Only handle copy events if editable and focus is within the canvas
			if (!editable()) return;

			if (!canvas_el?.contains(document.activeElement)) return;

			event.preventDefault();
			event.stopPropagation();

			let plain_text, text, html;

			if (session().selection?.type === 'text') {
				plain_text = session().get_selected_plain_text();
				text = session().get_selected_text();

				const fallback_html = `<span>${text.content}</span>`;

				// console.log('Text copy:', {
				// 	text,
				// 	plain_text,
				// 	html
				// });
				html = create_svedit_html_format(text, fallback_html);
			} else if (session().selection?.type === 'node') {
				const json_data = session().get_selected_annotated_nodes();
				const { nodes, main_nodes } = json_data;

				// console.log('Node copy:', {
				// 	selected_nodes,
				// 	nodes,
				// 	total_nodes: Object.keys(nodes).length,
				// 	operation: delete_selection ? 'cut' : 'copy'
				// });
				// Generate fallback HTML for cross-app compatibility
				const selected_node_objects = main_nodes.map((id) => nodes[id]);

				const fallback_html = export_html(selected_node_objects);

				// Create HTML with embedded svedit data
				html = create_svedit_html_format(json_data, fallback_html);

				// Generate plain text representation
				plain_text = export_plain_text(selected_node_objects);
			} else if (session().selection?.type === 'property') {
				const property_definition = session().inspect(session().selection.path);
				const value = session().get(session().selection.path);

				const json_data = {
					kind: 'property',
					name: property_definition.name,
					type: property_definition.type,
					value
				};

				html = create_svedit_html_format(json_data, `<span>${value}</span>`);
				plain_text = String(value);
			}

			// Write to clipboard using event.clipboardData
			try {
				event.clipboardData?.setData('text/plain', plain_text || '');
				event.clipboardData?.setData('text/html', html || '');
			} catch(err) {
				console.error('Failed to copy data: ', err);
			}

			if (delete_selection) {
				session().apply(session().tr.delete_selection());
			}
		}

		function oncut(event) {
			if (!editable()) return;

			oncopy(event, true);
		}

		/**
		 * @returns {NodeSelection|null}
		 */
		function get_root_node_insert_caret() {
			const root_node = session().get($$props.path);
			const root_schema = root_node ? session().schema[root_node.type] : null;

			if (!root_schema?.properties) return null;

			const preferred_property_name = root_schema.properties.body?.type === 'node_array'
				? 'body'
				: Object.entries(root_schema.properties).find(([, property_definition]) => {
					return property_definition.type === 'node_array';
				})?.[0];

			if (!preferred_property_name) return null;

			const node_array_path = [...$$props.path, preferred_property_name];
			const node_array = session().get(node_array_path);

			if (!node_array || !Array.isArray(node_array.nodes)) return null;

			return {
				type: 'node',
				path: node_array_path,
				anchor_offset: node_array.nodes.length,
				focus_offset: node_array.nodes.length
			};
		}

		/**
		 * @param {Selection|null} [selection]
		 * @returns {NodeSelection|null}
		 */
		function get_target_node_insert_caret(selection = session().selection) {
			if (selection?.type === 'node') {
				return selection;
			}

			const next_node_insert_caret = session().get_next_node_insert_caret(selection);

			if (next_node_insert_caret?.type === 'node') {
				return next_node_insert_caret;
			}

			return get_root_node_insert_caret();
		}

		/**
		 * @param {Selection|null} [selection]
		 * @returns {NodeSelection|null}
		 */
		function get_node_insert_caret_after_text_selection(selection = session().selection) {
			if (selection?.type !== 'text') return null;

			const node_index = selection.path.at(-2);

			return {
				type: 'node',
				path: selection.path.slice(0, -2),
				anchor_offset: node_index + 1,
				focus_offset: node_index + 1
			};
		}

		/**
		 * Attempts to paste JSON data as a node at the current selection.
		 *
		 * @param {string|object} pasted_json - The JSON data to paste, either as a string or parsed object
		 * @param {Selection} [selection] - Optional selection (node caret) where the payload should be pasted
		 * @returns {boolean} True if the paste operation was successful, false otherwise
		 */
		function try_node_paste(pasted_json, selection) {
			const { nodes, main_nodes, marks = [], annotations = [] } = pasted_json || {};

			if (!nodes || !main_nodes?.length) return false;

			let tr = session().tr;

			if (selection) {
				tr.set_selection(selection);
			}

			if (tr.selection?.type !== 'node') return false;

			const property_definition = session().inspect(tr.selection.path);

			if (property_definition?.type !== 'node_array') return false;

			const default_text_node_type = get_default_text_node(property_definition, session().schema);
			const target_text_property_name = get_text_property_name(default_text_node_type, session().schema);
			const nodes_to_insert = [];
			let rejected = false;

			for (const node_id of main_nodes) {
				const node = nodes[node_id];

				if (!node) {
					rejected = true;

					break;
				}

				if (!property_definition.node_types.includes(node.type)) {
					const text_content = get_text_content(node, session().schema);

					if (is_text_like_node_payload(node, session().schema) && default_text_node_type && target_text_property_name) {
						const new_node_id = tr.build('the_node', {
							the_node: {
								id: 'the_node',
								type: default_text_node_type,
								[target_text_property_name]: text_content || { content: '', marks: [], annotations: [] }
							}
						});

						nodes_to_insert.push(new_node_id);
					} else {
						rejected = true;

						break;
					}
				} else {
					const new_node_id = tr.build(node_id, nodes);

					nodes_to_insert.push(new_node_id);
				}
			}

			if (!rejected) {
				tr.insert_nodes(nodes_to_insert, marks, annotations, nodes);
				session().apply(tr);

				return true;
			}

			if (tr.selection.path.length >= 2) {
				const next_node_insert_caret = session().get_next_node_insert_caret(tr.selection);

				if (next_node_insert_caret) {
					return try_node_paste(pasted_json, next_node_insert_caret);
				}
			}

			return false;
		}

		async function onpaste(event) {
			// Only handle paste events if editable and focus is within the canvas
			if (!editable()) return;

			if (!canvas_el?.contains(document.activeElement)) return;

			event.preventDefault();

			let plain_text, pasted_json, pasted_media = [];

			// NOTE: For some reason, await navigator.clipboard.read()
			const clipboard_items = event.clipboardData?.items || [];

			for (const item of clipboard_items || []) {
				if (item.type.startsWith('image/') || item.type.startsWith('video/') || item.type.startsWith('audio/')) {
					const blob = item.getAsFile();
					const data_url = URL.createObjectURL(blob);

					pasted_media.push({ blob, data_url, type: item.type, size: blob.size });
				}
			}

			if (pasted_media.length > 0) {
				const handle_media_paste = session().config.handle_media_paste || session().config.handle_image_paste;

				pasted_json = await handle_media_paste(session(), pasted_media);

				// NOTE: If no pasted_json is returned from the custom handler, we assume that content creation has been
				// handled inside handle_media_paste already.
				if (!pasted_json) return;
			} else {
				// First try to extract svedit data from HTML format
				try {
					const html_content = event.clipboardData?.getData('text/html');

					if (html_content) {
						pasted_json = extract_svedit_data_from_html(html_content);
					}
				} catch {
					// No HTML format available or failed to extract svedit data
					pasted_json = undefined;
				}

				try {
					plain_text = event.clipboardData?.getData('text/plain');
				} catch(e) {
					console.error('Failed to paste any content:', e);
				}

				// Try to construct a node payload from plain text when applicable
				if (!pasted_json && typeof plain_text === 'string') {
					plain_text = normalize_line_endings(plain_text);
					plain_text = dedent_plain_text(plain_text);

					const plain_text_fragments = split_plain_text_paragraphs(plain_text);
					const has_multiple_paragraphs = plain_text_fragments.length > 1;

					if (session().selection?.type === 'text') {
						const property_definition = session().inspect(session().selection.path);

						if (property_definition?.type === 'text' && !property_definition.allow_newlines) {
							plain_text = normalize_plain_text_for_single_line_property(plain_text);
						}

						const owner_node = session().get(session().selection.path.slice(0, -1));
						const owner_is_text_node = owner_node && session().kind(owner_node) === 'text';

						if (owner_is_text_node && has_multiple_paragraphs) {
							const node_array_property_definition = session().inspect(session().selection.path.slice(0, -2));
							const default_text_node_type = get_default_text_node(node_array_property_definition, session().schema);
							const node_insert_caret = get_node_insert_caret_after_text_selection(session().selection);
							const plain_text_nodes_payload = create_plain_text_nodes_payload(plain_text_fragments, default_text_node_type, session().schema);

							if (node_insert_caret && plain_text_nodes_payload) {
								const did_paste_nodes = try_node_paste(plain_text_nodes_payload, node_insert_caret);

								if (did_paste_nodes) {
									return;
								}
							}
						}
					} else {
						const target_node_insert_caret = get_target_node_insert_caret(session().selection);

						if (target_node_insert_caret) {
							const node_array_property_definition = session().inspect(target_node_insert_caret.path);
							const default_text_node_type = get_default_text_node(node_array_property_definition, session().schema);

							pasted_json = create_plain_text_nodes_payload(plain_text_fragments, default_text_node_type, session().schema);
						}
					}
				}
			}

			// console.log('plain_text', plain_text);
			// console.log('pasted_json', pasted_json);
			if (pasted_json?.main_nodes && session().selection?.type === 'node') {
				// Paste nodes at a node selection
				try_node_paste(pasted_json);
			} else if (pasted_json?.kind === 'property' && session().selection?.type === 'property') {
				const property_definition = session().inspect(session().selection.path);

				if (property_definition.type === pasted_json.type) {
					if (property_definition.type === 'node') {
						const tr = session().tr;

						const new_id = tr.build('some_new_node_id', {
							some_new_node_id: { ...pasted_json.value, id: 'some_new_node_id' }
						});

						tr.set(session().selection.path, new_id);
						session().apply(tr);
					} else {
						// we assume that we have a value type for the property (string, number)
						session().apply(session().tr.set(session().selection.path, pasted_json.value));
					}
				}
			} else if (session().selection?.type === 'text' && pasted_json?.content) {
				// Paste text at a text selection
				session().apply(session().tr.insert_text(pasted_json.content, pasted_json.marks, pasted_json.annotations, pasted_json.nodes));
			} else if (session().selection?.type === 'text' && pasted_json?.main_nodes?.length === 1 && is_text_like_node_payload(pasted_json?.nodes[pasted_json.main_nodes[0]], session().schema)) {
				// Paste a single text node, at a text caret
				const text_property = get_text_content(pasted_json.nodes[pasted_json.main_nodes[0]], session().schema);

				if (text_property) {
					session().apply(session().tr.insert_text(text_property.content, text_property.marks, text_property.annotations, pasted_json.nodes));
				}
			} else if (['text', 'property'].includes(session().selection?.type) && pasted_json?.nodes) {
				// Paste nodes at a text or property selection by finding the next valid insert caret
				const target_node_insert_caret = get_target_node_insert_caret(session().selection);

				if (target_node_insert_caret) {
					try_node_paste(pasted_json, target_node_insert_caret);
				}
			} else if (typeof plain_text === 'string') {
				// External paste: Fallback to plain text when no svedit data is found
				session().apply(session().tr.insert_text(plain_text));
			}
		}

		function render_selection(dom_driven = false, should_scroll_selection_into_view = true) {
			const selection = session().selection;

			if (!selection) {
				// No model selection -> just leave things as they are
				// NOTE: removeAllRanges() makes the document lose selection on
				// refocus of the window, hence I disable it for now.
				// let dom_selection = window.getSelection();
				// dom_selection.removeAllRanges();
				return;
			}

			// DOM-driven updates already reflect the new selection — skip
			// the rerender when DOM matches model. Model-driven updates
			// (insert/undo) can have DOM matching by coincidence (Svelte
			// reuses gap elements with shifted data-gap-offset), so for those
			// we always rerender to scroll the cursor into view.
			const is_empty_text_selection = selection.type === 'text' && session().get(selection.path).content.length === 0;

			if (dom_driven && !is_empty_text_selection) {
				const prev_selection = __get_selection_from_dom();

				if (JSON.stringify(selection) === JSON.stringify(prev_selection) && canvas_el?.contains(document.activeElement)) {
					return;
				}
			}

			if (selection?.type === 'text') {
				__render_text_selection(should_scroll_selection_into_view);
			} else if (selection?.type === 'node') {
				__render_node_selection(should_scroll_selection_into_view);
			} else if (selection?.type === 'property') {
				__render_property_selection(should_scroll_selection_into_view);
			} else {
				console.warn('unsupported selection', snapshot(selection));
			}
		}

		// Handle focus - push session's keymap onto stack
		function handle_canvas_focus() {
			// Use flushSync so highlight spans are removed from the DOM
			// immediately, before the browser processes the click's selection.
			flushSync(() => {
				set$1(canvas_focused, true);
			});

			key_mapper?.push_scope(session().keymap);
		}

		// Handle blur - pop document's keymap from stack.
		function handle_canvas_blur() {
			// Use flushSync so the selection highlight span (with its CSS anchor)
			// is in the DOM immediately, before any popover/dialog tries to
			// position itself.
			flushSync(() => {
				set$1(canvas_focused, false);
			});

			key_mapper?.pop_scope();
		}

		function focus_canvas() {
			// Use flushSync so highlight spans are removed from the DOM
			// immediately, before we focus and render_selection walks the
			// text nodes.
			flushSync(() => {
				set$1(canvas_focused, true);
			});

			canvas_el?.focus();
		}

		/**
		 * When a DOM selection endpoint lands in a sibling NodeGap (not inside
		 * a node), resolves the adjacent node element for the walk-up algorithm.
		 * @param {HTMLElement} el
		 * @returns {HTMLElement | null}
		 */
		function __resolve_node_from_gap(el) {
			const gap = el.closest('[data-gap-array-path]');

			if (!gap) return null;

			const array_path = deserialize_path(gap.dataset.gapArrayPath);
			const offset = parseInt(gap.dataset.gapOffset, 10);
			const node_idx = offset > 0 ? offset - 1 : 0;

			return canvas_el.querySelector(`[data-path="${serialize_path([...array_path, node_idx])}"][data-type="node"]`);
		}

		/**
		 * Extracts a NodeSelection from the current DOM selection.
		 *
		 *
		 * @returns {NodeSelection | null} A NodeSelection object if the DOM selection
		 *   represents a valid node selection, null otherwise
		 */
		function __get_node_selection_from_dom() {
			const dom_selection = window.getSelection();

			if (dom_selection.rangeCount === 0) return null;

			let focus_node = dom_selection.focusNode;
			let anchor_node = dom_selection.anchorNode;

			// If focus_node or anchor_node not an element node (e.g. a text node), we need
			// to use the parent element, so we can perform the closest() query on it.
			if (focus_node.nodeType !== Node.ELEMENT_NODE) focus_node = focus_node.parentElement;

			if (anchor_node.nodeType !== Node.ELEMENT_NODE) anchor_node = anchor_node.parentElement;

			// EDGE CASE: Collapsed selection inside an empty node placeholder.
			// Firefox can place the DOM selection on the placeholder node itself,
			// which otherwise looks like selecting node index 0 in an empty array.
			const focus_empty_placeholder = focus_node.closest('.empty-node-placeholder[data-path][data-type="node"]');

			const anchor_empty_placeholder = anchor_node.closest('.empty-node-placeholder[data-path][data-type="node"]');

			if (focus_empty_placeholder && focus_empty_placeholder === anchor_empty_placeholder) {
				const empty_placeholder_path = deserialize_path(focus_empty_placeholder.dataset.path);
				const array_path = empty_placeholder_path.slice(0, -1);
				const node_array = session().get(array_path);

				if (node_array?.nodes?.length === 0) {
					return {
						type: 'node',
						path: array_path,
						anchor_offset: 0,
						focus_offset: 0
					};
				}
			}

			// EDGE CASE: Collapsed selection inside a node gap (gap-after or gap-before).
			// Gaps are siblings of nodes with data-gap-array-path and data-gap-offset.
			const gap_el = focus_node.closest('[data-gap-array-path]');

			if (gap_el && focus_node === anchor_node) {
				const array_path = deserialize_path(gap_el.dataset.gapArrayPath);
				const gap_offset = parseInt(gap_el.dataset.gapOffset, 10);

				return {
					type: 'node',
					path: array_path,
					anchor_offset: gap_offset,
					focus_offset: gap_offset
				};
			}

			let focus_root = __resolve_node_from_gap(focus_node) ?? focus_node.closest('[data-path][data-type="node"]');

			if (!focus_root) return null;

			let anchor_root = __resolve_node_from_gap(anchor_node) ?? anchor_node.closest('[data-path][data-type="node"]');

			if (!anchor_root) return null;

			let focus_root_path = deserialize_path(focus_root.dataset.path);
			let anchor_root_path = deserialize_path(anchor_root.dataset.path);
			let focus_node_depth = focus_root_path.length;
			let anchor_node_depth = anchor_root_path.length;

			// Walk both endpoints up the DOM until they share the same parent node_array.
			// This handles selections that span across arbitrarily nested node arrays by
			// finding the lowest common ancestor node_array and projecting each endpoint
			// onto its index within that array.
			let focus_walked_up = false;

			let anchor_walked_up = false;

			while (!paths_equal(focus_root_path.slice(0, -1), anchor_root_path.slice(0, -1))) {
				if (focus_root_path.length > anchor_root_path.length) {
					// Focus is deeper — walk it up
					focus_root = focus_root.parentElement?.closest('[data-path][data-type="node"]');

					if (!focus_root) return null;

					focus_root_path = deserialize_path(focus_root.dataset.path);
					focus_walked_up = true;
				} else if (anchor_root_path.length > focus_root_path.length) {
					// Anchor is deeper — walk it up
					anchor_root = anchor_root.parentElement?.closest('[data-path][data-type="node"]');

					if (!anchor_root) return null;

					anchor_root_path = deserialize_path(anchor_root.dataset.path);
					anchor_walked_up = true;
				} else {
					// Same depth but different node arrays — walk both up
					focus_root = focus_root.parentElement?.closest('[data-path][data-type="node"]');

					if (!focus_root) return null;

					focus_root_path = deserialize_path(focus_root.dataset.path);
					focus_walked_up = true;
					anchor_root = anchor_root.parentElement?.closest('[data-path][data-type="node"]');

					if (!anchor_root) return null;

					anchor_root_path = deserialize_path(anchor_root.dataset.path);
					anchor_walked_up = true;
				}
			}

			// If both paths walked up to the root node, there's no common parent node_array
			// (e.g. selecting between nav and page body). The resulting path would be empty.
			if (anchor_root_path.length <= 1) return null;

			const parent_array_path = anchor_root_path.slice(0, -1);

			// A node selection is only valid inside a node_array property.
			const parent_property = session().inspect(parent_array_path);

			if (!parent_property || parent_property.type !== 'node_array') return null;

			let anchor_offset = Number(anchor_root_path.at(-1));
			let focus_offset = Number(focus_root_path.at(-1));

			// Check if it's a backwards selection
			const is_backwards = __is_dom_selection_backwards();

			if (is_backwards) anchor_offset += 1; else focus_offset += 1;

			// EDGE CASE: Exclude first node when anchor_node is a gap-after
			// in a non-collapsed forward selection.
			// Only apply when anchor wasn't walked up — if it was, the gap is at a
			// deeper nesting level and no longer relevant to the resolved node array.
			if (!anchor_walked_up && anchor_node.parentElement?.dataset.type === 'gap-after' && !is_backwards && anchor_offset !== focus_offset) {
				anchor_offset += 1;
			} else // EDGE CASE: Exclude first node when focus_node is a gap-after
			// in a non-collapsed backward selection.
			// Only apply when focus wasn't walked up — same reasoning as above.
			if (!focus_walked_up && focus_node.parentElement?.dataset.type === 'gap-after' && is_backwards && anchor_offset !== focus_offset && // EDGE CASE: Only do correction when drag started from a deeper or equally deep anchor node
			anchor_node_depth >= focus_node_depth) {
				focus_offset += 1;
			}

			return {
				type: 'node',
				path: parent_array_path,
				anchor_offset,
				focus_offset
			};
		}

		/**
		 * Extracts a PropertySelection from the current DOM selection.
		 *
		 *
		 * @returns {PropertySelection | null} A PropertySelection object if the DOM selection
		 *   represents a valid property selection, null otherwise
		 */
		function __get_property_selection_from_dom() {
			const dom_selection = window.getSelection();

			if (dom_selection.rangeCount === 0) return null;

			let focus_root = dom_selection.focusNode.parentElement?.closest('[data-path][data-type="property"]');

			if (!focus_root) return null;

			let anchor_root = dom_selection.anchorNode.parentElement?.closest('[data-path][data-type="property"]');

			if (!anchor_root) return null;

			if (focus_root === anchor_root) {
				return {
					type: 'property',
					path: deserialize_path(focus_root.dataset.path)
				};
			}

			return null;
		}

		function __get_selection_from_dom() {
			return __get_property_selection_from_dom() || __get_text_selection_from_dom() || __get_node_selection_from_dom();
		}

		/**
		 * Extracts a TextSelection from the current DOM selection.
		 *
		 *
		 * @returns {TextSelection | null} A TextSelection object if the DOM selection
		 *   represents a valid text selection, null otherwise
		 */
		function __get_text_selection_from_dom(range = null) {
			let dom_selection = null;
			let focus_node;
			let anchor_node;
			let focus_offset_in_node; // anchor_offset_in_node;

			if (range) {
				// When range is provided, use it directly
				focus_node = range.endContainer;

				anchor_node = range.startContainer;
				focus_offset_in_node = range.endOffset;

				// anchor_offset_in_node = range.startOffset;
			} else {
				// Otherwise get from window selection
				dom_selection = window.getSelection();

				if (dom_selection.rangeCount === 0) return null;

				focus_node = dom_selection.focusNode;
				anchor_node = dom_selection.anchorNode;
				focus_offset_in_node = dom_selection.focusOffset;

				// anchor_offset_in_node = dom_selection.anchorOffset;
				range = dom_selection.getRangeAt(0);
			}

			function get_text_root(node) {
				if (!node) return null;

				if (node instanceof Element) {
					return node.closest('[data-path][data-type="text"]');
				}

				return node.parentElement?.closest('[data-path][data-type="text"]') ?? null;
			}

			let focus_root;
			let anchor_root;

			if (focus_node === anchor_node && focus_node instanceof HTMLElement && focus_node.dataset.type === 'text') {
				// EDGE CASE 1: Either text node is empty (only a <br> is present), or caret is after a <br> at the very end of the text node
				focus_root = anchor_root = focus_node;
			} else {
				focus_root = get_text_root(focus_node);

				if (!focus_root) return null;

				anchor_root = get_text_root(anchor_node);

				if (!anchor_root) return null;
			}

			if (focus_root !== anchor_root) {
				return null;
			}

			const path = deserialize_path(focus_root.dataset.path);

			if (!path) return null;

			// EDGE CASE 1B: Caret after trailing <br> at end of text
			//
			// TextProperty renders a trailing <br> for non-empty or non-focused text.
			// When the user places their caret after this <br>, focusNode is the container
			// element (not a text node), and normal processing would return position 0.
			// We detect this and return the current DOM text length instead.
			// During compositionend, the browser has already inserted the composed
			// character into the DOM, while the Svedit model still has the old text.
			const dom_text_length = get_char_length(focus_root.textContent ?? '');

			const child_nodes = focus_root.childNodes;

			if (range.collapsed && focus_node === anchor_node && focus_node === focus_root && focus_root.dataset?.type === 'text' && !focus_root.classList.contains('empty')) {
				// Find the last non-comment child node (comments are inserted by Svelte)
				let last_element_index = child_nodes.length - 1;

				while (last_element_index >= 0 && child_nodes[last_element_index].nodeType === Node.COMMENT_NODE) {
					last_element_index--;
				}

				// Check if caret is at or after the trailing <br>
				if (last_element_index >= 0 && child_nodes[last_element_index].nodeName === 'BR' && focus_offset_in_node >= last_element_index) {
					return {
						type: 'text',
						path,
						anchor_offset: dom_text_length,
						focus_offset: dom_text_length
					};
				}
			}

			function get_text_offset(container, offset) {
				const offset_range = window.document.createRange();

				offset_range.setStart(focus_root, 0);
				offset_range.setEnd(container, offset);

				return get_char_length(offset_range.toString());
			}

			const start_offset = get_text_offset(range.startContainer, range.startOffset);
			const end_offset = get_text_offset(range.endContainer, range.endOffset);

			// Check if it's a backward selection
			// When range is provided, we can't detect backward selection from the range alone
			// since ranges are always normalized (start before end)
			const is_backward = dom_selection ? __is_dom_selection_backwards() : false;

			// Assign to anchor/focus based on direction
			const anchor_offset = is_backward ? end_offset : start_offset;

			const focus_offset = is_backward ? start_offset : end_offset;

			return { type: 'text', path, anchor_offset, focus_offset };
		}

		function __get_node_element(node_array_path, node_offset) {
			if (!canvas_el) return null;

			return canvas_el.querySelector(`[data-path="${serialize_path([...node_array_path, node_offset])}"][data-type="node"]`);
		}

		/**
		 * True when any part of the element's border box overlaps the window
		 * viewport. Used to keep node-selection re-renders from scrolling a
		 * cursor that is already on screen. Tests the window viewport, so a
		 * node clipped only by an inner scroll container still counts visible.
		 * @param {Element | null | undefined} el
		 */
		function __intersects_viewport(el) {
			if (!el) return false;

			const r = el.getBoundingClientRect();

			return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
		}

		function __render_node_selection(should_scroll_selection_into_view = true) {
			const selection = session().selection;
			const node_array_path = selection.path;
			const node_array_path_str = serialize_path(node_array_path);
			const is_collapsed = is_selection_collapsed(selection);
			const is_backward = !is_collapsed && selection.anchor_offset > selection.focus_offset;
			const node_array_el = canvas_el.querySelector(`[data-path="${node_array_path_str}"][data-type="node_array"]`);

			if (!node_array_el) return;

			const dom_selection = window.getSelection();
			const range = window.document.createRange();
			const gap_selector = (offset) => `[data-gap-array-path="${node_array_path_str}"][data-gap-offset="${offset}"]`;

			if (is_collapsed) {
				const gap_el = node_array_el.querySelector(gap_selector(selection.anchor_offset));

				if (!gap_el) return;

				// Target .svedit-selectable (has a box), not gap_el which is
				// display:contents and would cause the browser to normalize
				// the range into the parent, breaking read-back.
				const selectable = gap_el.querySelector('.svedit-selectable');

				if (!selectable) return;

				range.setStart(selectable, 1);
				range.setEnd(selectable, 1);
				dom_selection.removeAllRanges();
				dom_selection.addRange(range);
			} else {
				const anchor_gap = node_array_el.querySelector(gap_selector(selection.anchor_offset));
				const focus_gap = node_array_el.querySelector(gap_selector(selection.focus_offset));

				if (!anchor_gap || !focus_gap) return;

				const anchor_sel = anchor_gap.querySelector('.svedit-selectable');
				const focus_sel = focus_gap.querySelector('.svedit-selectable');

				if (!anchor_sel || !focus_sel) return;

				if (is_backward) {
					// setBaseAndExtent replaces the current selection, so no
					// removeAllRanges is needed — every selection-API call forces a
					// synchronous layout when the DOM is dirty, and this runs right
					// after the per-change reconcile on every apply.
					dom_selection.setBaseAndExtent(anchor_sel, 1, focus_sel, 1);
				} else {
					range.setStart(anchor_sel, 1);
					range.setEnd(focus_sel, 1);
					dom_selection.removeAllRanges();
					dom_selection.addRange(range);
				}
			}

			if (!should_scroll_selection_into_view) return;

			// Scroll the cursor into view, but only when it is genuinely
			// off-screen. This runs on every node-selection re-render — a
			// transaction (type/layout change), select-parent, window refocus
			// — so an unconditional scroll would yank the viewport on each of
			// them. cursor_offset is a gap offset and the gap has no box of
			// its own, so visibility is judged from the nodes flanking it.
			const node_array = session().get(node_array_path);

			if (!node_array?.nodes) return;

			// Collapsed: anchor === focus, so focus is the gap offset.
			// Range: cursor sits at the focus end (anchor when backward).
			const cursor_offset = is_backward ? selection.anchor_offset : selection.focus_offset;

			const array_length = node_array.nodes.length;

			// node_before is null at offset 0: cursor_offset - 1 would be -1,
			// and serialize_path rejects a negative index.
			const node_before = cursor_offset > 0
				? __get_node_element(node_array_path, cursor_offset - 1)
				: null;

			const node_after = __get_node_element(node_array_path, cursor_offset);
			let scroll_target = null;
			let scroll_array_to_start = false;
			let scroll_array_to_end = false;

			if (cursor_offset === 0) {
				scroll_array_to_start = true;
			} else if (cursor_offset >= array_length) {
				scroll_array_to_end = true;
			} else {
				// A range selection's selected node IS node_before; scrolling
				// node_after would reveal the following node and leave the
				// selection itself off-screen. For a collapsed caret node_after's
				// leading edge is the cursor, so that stays the right target.
				scroll_target = is_collapsed ? node_after : node_before;
			}

			setTimeout(
				() => {
					// If either node flanking the cursor is already (even
					// partially) on screen, the cursor is visible — keep the
					// viewport stable and scroll nothing. Do this layout read in the
					// deferred callback, after Svelte/browser layout has settled.
					if (__intersects_viewport(node_before) || __intersects_viewport(node_after)) return;

					if (scroll_array_to_start) {
						node_array_el.scrollLeft = 0;
						node_array_el.scrollTop = 0;

						return;
					}

					if (scroll_array_to_end) {
						const max_left = Math.max(0, node_array_el.scrollWidth - node_array_el.clientWidth);
						const max_top = Math.max(0, node_array_el.scrollHeight - node_array_el.clientHeight);

						node_array_el.scrollLeft = max_left;
						node_array_el.scrollTop = max_top;

						if (max_left === 0 && max_top === 0) {
							node_before?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
						}

						return;
					}

					scroll_target?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
				},
				0
			);
		}

		function __render_property_selection(should_scroll_selection_into_view = true) {
			const selection = session().selection;

			// The element that holds the property
			const el = canvas_el.querySelector(`[data-path="${serialize_path(selection.path)}"][data-type="property"]`);

			const gap_selectable = el.querySelector('.svedit-selectable');
			const range = window.document.createRange();
			const dom_selection = window.getSelection();

			// Select the entire gap element contents and collapse to start
			range.selectNodeContents(gap_selectable);

			range.collapse(true); // Collapse to start position
			dom_selection.removeAllRanges();
			dom_selection.addRange(range);

			if (should_scroll_selection_into_view) {
				setTimeout(
					() => {
						el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
					},
					0
				);
			}
		}

		function __render_text_selection(should_scroll_selection_into_view = true) {
			const selection = session().selection;

			// The element that holds the annotated string
			const el = canvas_el.querySelector(`[data-path="${serialize_path(selection.path)}"][data-type="text"]`);

			const empty_text = session().get(selection.path).content.length === 0;
			const dom_selection = window.getSelection();
			let current_offset = 0;
			let anchor_node;
			let focus_node;
			let anchor_node_offset;
			let focus_node_offset;
			const is_backward = selection.anchor_offset > selection.focus_offset;
			const start_offset = Math.min(selection.anchor_offset, selection.focus_offset);
			const end_offset = Math.max(selection.anchor_offset, selection.focus_offset);

			// Helper function to process each node
			function process_node(node) {
				if (node instanceof Text) {
					const node_text = node.textContent;
					const node_char_length = get_char_length(node_text);

					if (is_backward) {
						if (!focus_node && current_offset + node_char_length >= start_offset) {
							focus_node = node;

							const char_offset = start_offset - current_offset;

							focus_node_offset = char_to_utf16_offset(node_text, char_offset);
						}
					} else {
						if (!anchor_node && current_offset + node_char_length >= start_offset) {
							anchor_node = node;

							const char_offset = start_offset - current_offset;

							anchor_node_offset = char_to_utf16_offset(node_text, char_offset);
						}
					}

					// Find end node
					if (is_backward) {
						if (!anchor_node && current_offset + node_char_length >= end_offset) {
							anchor_node = node;

							const char_offset = end_offset - current_offset;

							anchor_node_offset = char_to_utf16_offset(node_text, char_offset);

							return true; // Stop iteration
						}
					} else {
						if (!focus_node && current_offset + node_char_length >= end_offset) {
							focus_node = node;

							const char_offset = end_offset - current_offset;

							focus_node_offset = char_to_utf16_offset(node_text, char_offset);

							return true; // Stop iteration
						}
					}

					current_offset += node_char_length;
				} else if (node instanceof HTMLElement) {
					for (const child_node of node.childNodes) {
						if (process_node(child_node)) return true; // Stop iteration if end found
					}
				}

				return false; // Continue iteration
			}

			// EDGE CASE: When text is empty, we need to set a different DOM selection
			if (start_offset === end_offset && start_offset === 0 && empty_text) {
				// Markup for empty text looks like this `<div data-type="text"><br></div>`.
				// And the correct caret position is after the <br> element.
				anchor_node = el;

				anchor_node_offset = 1;
				focus_node = el;
				focus_node_offset = 1;
			} else {
				// DEFAULT CASE
				for (const child_node of el.childNodes) {
					if (process_node(child_node)) break;
				}
			}

			// Set the range if both start and end were found
			if (anchor_node && focus_node) {
				// NOTE: Only using setBaseAndExtent() will preserve selection direction.
				// It also replaces the current selection, so no removeAllRanges is
				// needed — every selection-API call forces a synchronous layout when
				// the DOM is dirty, and this runs on every apply.
				dom_selection.setBaseAndExtent(anchor_node, anchor_node_offset, focus_node, focus_node_offset);

				if (should_scroll_selection_into_view) {
					// Scroll the rendered selection into view. Capture the target now:
					// the browser selection is live and may be cleared before this
					// deferred callback runs, e.g. when app UI focuses an external input.
					const selected_element = focus_node.parentElement;

					setTimeout(
						() => {
							if (selected_element?.isConnected) {
								selected_element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
							}
						},
						0
					);
				}
			}
		}

		// Utils
		// --------------------------
		function __remove_native_composition_text(selection, inserted_text) {
			if (!selection || selection.type !== 'text' || !inserted_text) return;

			const text_el = canvas_el.querySelector(`[data-path="${serialize_path(selection.path)}"][data-type="text"]`);

			if (!text_el) return;

			const model_text = session().get(selection.path).content;

			if ((text_el.textContent ?? '') === model_text) return;

			let current_offset = 0;

			function get_dom_text_position(root, target_offset) {
				for (const node of root.childNodes) {
					if (node.nodeType === Node.TEXT_NODE) {
						const node_text = node.textContent ?? '';
						const node_length = get_char_length(node_text);

						if (current_offset + node_length >= target_offset) {
							return {
								node,
								offset: char_to_utf16_offset(node_text, target_offset - current_offset)
							};
						}

						current_offset += node_length;
					} else if (node.nodeType === Node.ELEMENT_NODE) {
						const position = get_dom_text_position(node, target_offset);

						if (position) return position;
					}
				}

				return null;
			}

			const start_offset = Math.min(selection.anchor_offset, selection.focus_offset);
			const end_offset = start_offset + get_char_length(inserted_text);

			current_offset = 0;

			const start_position = get_dom_text_position(text_el, start_offset);

			current_offset = 0;

			const end_position = get_dom_text_position(text_el, end_offset);

			if (!start_position || !end_position) return;

			const range = window.document.createRange();

			range.setStart(start_position.node, start_position.offset);
			range.setEnd(end_position.node, end_position.offset);
			range.deleteContents();
		}

		function __is_dom_selection_backwards() {
			const dom_selection = window.getSelection();

			// If there's no dom_selection, return false
			if (dom_selection.rangeCount === 0) return false;

			// Get the range of the dom_selection
			const range = dom_selection.getRangeAt(0);

			if (range.collapsed) return false;

			// Create a new range for comparison
			const comparisonRange = range.cloneRange();

			// Set the comparison range to start at the dom_selection's anchor and end at its focus
			comparisonRange.setStart(dom_selection.anchorNode, dom_selection.anchorOffset);

			comparisonRange.setEnd(dom_selection.focusNode, dom_selection.focusOffset);

			// If the comparison range is collapsed, the selection is backwards
			return comparisonRange.collapsed;
		}

		// Whenever the model selection changes, render the selection.
		// Skip when canvas is not focused to avoid stealing focus back
		// (e.g., when a dialog is open and selection highlight fragments re-render).
		// Consume the dom-driven flag at the top so it never carries stale
		// state into the next change, even when we early-return.
		user_effect(() => {
			session().selection;

			const dom_driven = selection_source_is_dom;

			selection_source_is_dom = false;

			if (!get$1(canvas_focused)) return;

			const selection_snapshot = JSON.stringify(session().selection);
			const should_scroll_selection_into_view = !dom_driven && selection_snapshot !== last_rendered_selection_snapshot;

			render_selection(dom_driven, should_scroll_selection_into_view);
			last_rendered_selection_snapshot = selection_snapshot;
		});

		var $$exports = { focus_canvas };
		var div = root_1$7();

		event('selectionchange', $document, onselectionchange);
		event('cut', $document, oncut);
		event('copy', $document, oncopy);
		event('paste', $document, onpaste);

		let classes;
		var node_1 = child(div);

		{
			var consequent = ($$anchor) => {
				var fragment = comment();
				var node_2 = first_child(fragment);

				component(node_2, () => get$1(NodeSelectionMarkers$1), ($$anchor, NodeSelectionMarkers_1) => {
					NodeSelectionMarkers_1($$anchor, {});
				});

				append($$anchor, fragment);
			};

			if_block(node_1, ($$render) => {
				if (editable()) $$render(consequent);
			});
		}

		var node_3 = sibling(node_1, 2);

		{
			var consequent_1 = ($$anchor) => {
				var fragment_1 = comment();
				var node_4 = first_child(fragment_1);

				component(node_4, () => get$1(Overlays), ($$anchor, Overlays_1) => {
					Overlays_1($$anchor, {});
				});

				append($$anchor, fragment_1);
			};

			if_block(node_3, ($$render) => {
				if (get$1(Overlays)) $$render(consequent_1);
			});
		}

		var div_1 = sibling(node_3, 2);

		attribute_effect(
			div_1,
			() => ({
				class: `svedit-canvas ${$$props.class ?? ''}`,
				onbeforeinput,
				oncompositionstart,
				oncompositionend,
				onfocus: handle_canvas_focus,
				onblur: handle_canvas_blur,
				inputmode: session().selection?.type === 'text' ? 'text' : 'none',
				contenteditable: editable() ? 'true' : 'false',
				tabindex: '-1',
				autocapitalize: autocapitalize(),
				spellcheck: spellcheck(),
				...{},
				[CLASS]: {
					'hide-selection': editable() && session().selection?.type === 'node',
					'node-caret': session().selection?.type === 'node' && session().selection.anchor_offset === session().selection.focus_offset,
					'property-selection': session().selection?.type === 'property'
				}
			}),
			void 0,
			void 0,
			void 0,
			'svelte-1fkh1fs'
		);

		var node_5 = child(div_1);

		component(node_5, () => get$1(RootComponent), ($$anchor, RootComponent_1) => {
			RootComponent_1($$anchor, {
				get path() {
					return $$props.path;
				}
			});
		});
		bind_this(div_1, ($$value) => canvas_el = $$value, () => canvas_el);
		template_effect(() => classes = set_class(div, 1, 'svedit', null, classes, { editable: editable() }));
		append($$anchor, div);

		return pop($$exports);
	}

	var rest_excludes$3 = new Set([
		'$$slots',
		'$$events',
		'$$legacy',
		'path',
		'class',
		'placeholder',
		'tag',
		'style'
	]);

	var root$l = from_html(`<span class="selection-highlight svelte-14pr6a7" style="anchor-name: --selection-highlight;"> </span>`);
	var root_1$6 = from_html(`<span> </span>`);
	var root_2$3 = from_html(`<br/>`);
	var root_3$2 = from_html(`<!><!>`, 1);

	const $$css$a = {
		hash: 'svelte-14pr6a7',
		code: '\n	/* Editable text base layout; :where() allows easy override without specificity conflicts. */:where(.text.svelte-14pr6a7) {white-space:pre-wrap;overflow-wrap:anywhere;box-sizing:content-box;}\n\n	/* We switch from ::before to ::after when the element is focused. So the the caret is always before the placeholder. */[placeholder].empty.svelte-14pr6a7:not(.focused)::before,\n	[placeholder].empty.focused.svelte-14pr6a7::after {content:attr(placeholder);pointer-events:none;color:color-mix(in oklch, currentcolor 50%, transparent);}\n\n	/* A virtual caret: to fix the caret vertical alignment issue in Chrome and Firefox for empty focused contenteditable with placeholders */\n	/* Browser BUG: iOS Safari only considers the caret color set on the top contenteditable element, not on nested elements (e.g. the second selector doesn\'t work in iOS Safari) */.svedit.editable .svedit-canvas:has([placeholder].empty.focused),\n	.svedit.editable [placeholder].empty.focused.svelte-14pr6a7 {caret-color:transparent !important;}.svedit.editable [placeholder].empty.focused.svelte-14pr6a7::before {content:\'\';\n		/* we limit width & height to avoid layout shifts in case the text has a lower natural height */width:0px;height:1cap;display:inline-block;\n		/* we use box-shadow to draw the caret shape, matching the native caret */box-shadow:0 -0.4cap 0 0.65px var(--editing, AccentColor),\n			0 0 0 0.65px var(--editing, AccentColor),\n			0 0.4cap 0 0.65px var(--editing, AccentColor);\n		animation: var(\n			--node-caret-animation,\n			node-caret-blink var(--node-caret-blink-duration, 1.1s) ease-in-out infinite\n		);}\n\n	/* Hide flickering: in Chrome, the caret jumps from end of placeholder string to start of text property when we focus */.text.svelte-14pr6a7:not(.focused) {caret-color:transparent;}\n\n	/* Disable text-transform when editable and focused so users see original text */.svedit.editable .text.focused.svelte-14pr6a7 {text-transform:none !important;}\n\n	/* Dim the selection highlight when canvas loses native focus */.svedit-canvas:not(:focus-within) .selection-highlight.svelte-14pr6a7 {background:oklch(from var(--editing-muted) l 0 h / alpha);}\n\n	/* Make a collapsed caret visible */.svedit-canvas:not(:focus-within) .selection-highlight.svelte-14pr6a7:empty {background:none;outline:0.5px solid oklch(from var(--editing) l 0 h / alpha);}'
	};

	function TextProperty($$anchor, $$props) {
		push($$props, true);
		append_styles$1($$anchor, $$css$a);

		const svedit = getContext('svedit');

		let placeholder = prop($$props, 'placeholder', 3, ''),
			tag = prop($$props, 'tag', 3, 'div'),
			style = prop($$props, 'style', 3, ''),
			rest = rest_props($$props, rest_excludes$3);

		let path_str = user_derived(() => serialize_path($$props.path));

		let is_focused = user_derived(() => {
			return svedit.session.selection?.type === 'text' && paths_equal($$props.path, svedit.session.selection.path);
		});

		let plain_text = user_derived(() => svedit.session.get($$props.path).content);

		// A string has zero grapheme clusters iff it has zero code units, so a
		// plain length check avoids a full Intl.Segmenter pass (this derived
		// re-runs for every text property on every document change).
		let is_empty = user_derived(() => get$1(plain_text).length === 0 && !(svedit.is_composing && get$1(is_focused)));

		let is_collapsed = user_derived(() => {
			const selection = svedit.session.selection;

			return get$1(is_focused) && selection?.type === 'text' && selection.anchor_offset === selection.focus_offset;
		});

		// Get selection highlight range if it does not touch marks.
		// Only render selection highlight when canvas is NOT focused.
		// This avoids DOM mutations (splitting text nodes for highlight spans)
		// while the user is actively selecting, which would cause selection
		// feedback loops and scroll-to-focus issues.
		let selection_highlight_range = user_derived(() => {
			if (svedit.canvas_focused) return null;
			if (get$1(is_collapsed)) return null;
			if (!get$1(is_focused)) return null;
			if (svedit.session.selected_marks.length > 0) return null;

			const sel = svedit.session.selection;

			if (!sel || sel.type !== 'text') return null;

			return get_selection_range(sel);
		});

		let fragments = user_derived(() => get_fragments(svedit.session.get($$props.path).content, svedit.session.get($$props.path).marks, get$1(selection_highlight_range)));

		/**
		 * Converts text with marks into renderable fragments for display.
		 * Annotations never fragment the text; they are data-only.
		 */
		function get_fragments(text, marks, selection_highlight_range) {
			// Fast path: no marks and no selection highlight means the whole text
			// is a single content fragment. This runs for EVERY text property on
			// EVERY document change, so skipping the two full Intl.Segmenter passes
			// (get_char_length + char_slice over the whole text) matters at scale.
			if (marks.length === 0 && !selection_highlight_range) {
				return text.length > 0 ? [text] : [];
			}

			const ranges = calculate_fragment_ranges(get_char_length(text), marks, selection_highlight_range);
			const fragments = [];

			for (const range of ranges) {
				const content = char_slice(text, range.start_offset, range.end_offset);

				if (range.type === 'mark') {
					const node = svedit.session.get(range.node_id);

					if (!node) throw new Error(`Node not found for mark ${range.node_id}`);

					fragments.push({ type: 'mark', node, content, mark_index: range.mark_index });
				} else if (range.type === 'selection_highlight') {
					fragments.push({ type: 'selection_highlight', content });
				} else {
					fragments.push(content);
				}
			}

			return fragments;
		}

		var fragment_1 = comment();
		var node_1 = first_child(fragment_1);

		element$1(node_1, tag, false, ($$element, $$anchor) => {
			attribute_effect(
				$$element,
				() => ({
					'data-type': 'text',
					'data-path': get$1(path_str),
					style: `anchor-name: --${get$1(path_str) ?? ''};${style() ?? ''}`,
					class: `text svedit-selectable ${$$props.class ?? ''}`,
					placeholder: placeholder(),
					...rest,
					[CLASS]: { empty: get$1(is_empty), focused: get$1(is_focused) }
				}),
				void 0,
				void 0,
				void 0,
				'svelte-14pr6a7'
			);

			var fragment_2 = root_3$2();
			var node_2 = first_child(fragment_2);

			each(node_2, 17, () => get$1(fragments), index, ($$anchor, fragment) => {
				var fragment_3 = comment();
				var node_3 = first_child(fragment_3);

				{
					var consequent = ($$anchor) => {
						var text_1 = text$1();

						template_effect(() => set_text(text_1, get$1(fragment)));
						append($$anchor, text_1);
					};

					var consequent_1 = ($$anchor) => {
						var span = root$l();
						var text_2 = only_child(span, true);

						template_effect(() => set_text(text_2, get$1(fragment).content));
						append($$anchor, span);
					};

					var consequent_3 = ($$anchor) => {
						const MarkComponent = user_derived(() => svedit.session.config.node_components[get$1(fragment).node.type]);
						var fragment_5 = comment();
						var node_4 = first_child(fragment_5);

						{
							var consequent_2 = ($$anchor) => {
								var fragment_6 = comment();
								var node_5 = first_child(fragment_6);

								{
									let $0 = user_derived(() => [
										...$$props.path,
										'marks',
										get$1(fragment).mark_index,
										'node_id'
									]);

									component(node_5, () => get$1(MarkComponent), ($$anchor, MarkComponent_1) => {
										MarkComponent_1($$anchor, {
											get path() {
												return get$1($0);
											},

											get content() {
												return get$1(fragment).content;
											}
										});
									});
								}

								append($$anchor, fragment_6);
							};

							var alternate = ($$anchor) => {
								var span_1 = root_1$6();
								var text_3 = only_child(span_1, true);

								template_effect(() => {
									set_class(span_1, 1, `mark-${get$1(fragment).node.type ?? ''}`, 'svelte-14pr6a7');
									set_text(text_3, get$1(fragment).content);
								});

								append($$anchor, span_1);
							};

							if_block(node_4, ($$render) => {
								if (get$1(MarkComponent)) $$render(consequent_2); else $$render(alternate, -1);
							});
						}

						append($$anchor, fragment_5);
					};

					if_block(node_3, ($$render) => {
						if (typeof get$1(fragment) === 'string') $$render(consequent); else if (get$1(fragment).type === 'selection_highlight') $$render(consequent_1, 1); else if (get$1(fragment).type === 'mark') $$render(consequent_3, 2);
					});
				}

				append($$anchor, fragment_3);
			});

			var node_6 = sibling(node_2);

			{
				var consequent_4 = ($$anchor) => {
					var br = root_2$3();

					append($$anchor, br);
				};

				if_block(node_6, ($$render) => {
					if (!get$1(is_focused) || !get$1(is_empty)) $$render(consequent_4);
				});
			}

			append($$anchor, fragment_2);
		});

		append($$anchor, fragment_1);
		pop();
	}

	var rest_excludes$2 = new Set([
		'$$slots',
		'$$events',
		'$$legacy',
		'path',
		'tag',
		'class',
		'children',
		'style'
	]);

	var root$k = from_html(`<div class="property-selectable svelte-i5fmbv"><div class="svedit-selectable svelte-i5fmbv"><br/></div></div> <!>`, 1);

	const $$css$9 = {
		hash: 'svelte-i5fmbv',
		code: '[data-type=\'property\'].svelte-i5fmbv {position:relative;}.property-selectable.svelte-i5fmbv {position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;outline:none;\n		/* Position the hidden selectable element at the bottom so the\n		   browser\'s native scroll-to-caret ensures the full property\n		   is visible, not just the top edge. */display:none;align-items:flex-end;justify-content:center;}.svedit.editable .property-selectable.svelte-i5fmbv {display:flex;}.svedit-selectable.svelte-i5fmbv {caret-color:transparent;}'
	};

	function CustomProperty($$anchor, $$props) {
		push($$props, true);
		append_styles$1($$anchor, $$css$9);

		let tag = prop($$props, 'tag', 3, 'div'),
			rest = rest_props($$props, rest_excludes$2);

		let path_str = user_derived(() => serialize_path($$props.path));
		var fragment = comment();
		var node = first_child(fragment);

		element$1(node, tag, false, ($$element, $$anchor) => {
			attribute_effect(
				$$element,
				() => ({
					class: $$props.class,
					'data-type': 'property',
					'data-path': get$1(path_str),
					style: `anchor-name: --${get$1(path_str) ?? ''};${$$props.style ? ` ${$$props.style}` : ''}`,
					...rest
				}),
				void 0,
				void 0,
				void 0,
				'svelte-i5fmbv'
			);

			var fragment_1 = root$k();
			var node_1 = sibling(first_child(fragment_1), 2);

			snippet(node_1, () => $$props.children);
			append($$anchor, fragment_1);
		});

		append($$anchor, fragment);
		pop();
	}

	var rest_excludes$1 = new Set([
		'$$slots',
		'$$events',
		'$$legacy',
		'path',
		'children',
		'tag',
		'class',
		'style'
	]);

	const $$css$8 = {
		hash: 'svelte-k0ibrx',
		code: '[data-type=\'node\'].svelte-k0ibrx {\n		/** any other position than static will break the anchor positioning of node gaps and node gap-marker */\n		/* For developers who need to position their node with `position: absolute` or `position: relative`, they need to wrap their node in a div */position:static !important;}'
	};

	function Node$1($$anchor, $$props) {
		push($$props, true);
		append_styles$1($$anchor, $$css$8);

		const svedit = getContext('svedit');

		let tag = prop($$props, 'tag', 3, 'div'),
			style = prop($$props, 'style', 3, ''),
			rest = rest_props($$props, rest_excludes$1);

		let node = user_derived(() => svedit.session.get($$props.path));
		let path_str = user_derived(() => serialize_path($$props.path));
		const node_array_meta = getContext('node_array_meta');
		let child_index = user_derived(() => node_array_meta ? $$props.path.at(-1) : -1);
		let is_first = user_derived(() => node_array_meta && get$1(child_index) === 0);
		let is_last = user_derived(() => node_array_meta && get$1(child_index) === node_array_meta.length - 1);

		// Marks and annotations covering this node become classes automatically:
		// `mark-<type>`/`anno-<type>`, plus `-start`/`-end` variants on the run's
		// first/last covered node. This allows styling ranges (including
		// annotations, which never render wrapper components) with pure CSS. For
		// richer rendering, node components still receive the `mark` and
		// `annotations` props.
		let range_classes = user_derived(() => {
			if (get$1(child_index) < 0 || !node_array_meta?.annotations_for) return '';

			const classes = [];

			const add_classes = (range, prefix) => {
				const range_type = range?.node?.type;

				if (!range_type) return;

				classes.push(`${prefix}-${range_type}`);

				if (range.is_start) classes.push(`${prefix}-${range_type}-start`);
				if (range.is_end) classes.push(`${prefix}-${range_type}-end`);
			};

			add_classes(node_array_meta.mark_for?.(get$1(child_index)), 'mark');

			for (const annotation of node_array_meta.annotations_for(get$1(child_index))) {
				add_classes(annotation, 'anno');
			}

			return classes.join(' ');
		});

		var fragment = comment();
		var node_1 = first_child(fragment);

		element$1(node_1, tag, false, ($$element, $$anchor) => {
			attach($$element, () => svedit.visibility_registry.track_node(get$1(path_str)));

			attribute_effect(
				$$element,
				() => ({
					id: get$1(node).id,
					class: `node-${get$1(node).type ?? ''} ${$$props.class ?? ''}${get$1(range_classes) ? ` ${get$1(range_classes)}` : ''}${get$1(is_first) ? ' first' : ''}${get$1(is_last) ? ' last' : ''}`,
					'data-node-id': get$1(node).id,
					'data-path': get$1(path_str),
					'data-type': 'node',
					style: `anchor-name: --${get$1(path_str) ?? ''};${style() ?? ''}`,
					...rest
				}),
				void 0,
				void 0,
				void 0,
				'svelte-k0ibrx'
			);

			var fragment_1 = comment();
			var node_2 = first_child(fragment_1);

			snippet(node_2, () => $$props.children);
			append($$anchor, fragment_1);
		});

		append($$anchor, fragment);
		pop();
	}

	function UnknownNode($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext('svedit');
		let node = user_derived(() => svedit.session.get($$props.path));

		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {

				var text = text$1();

				template_effect(() => set_text(text, `Unknown: ${get$1(node).type ?? ''}.`));
				append($$anchor, text);
			},
			$$slots: { default: true }
		});

		pop();
	}

	function cycle_z_index(e) {
		const el = e.currentTarget;

		if (el.hasAttribute('data-sent-to-back')) {
			document.querySelectorAll('.svedit-selectable[data-sent-to-back]').forEach((prev) => {
				prev.removeAttribute('data-sent-to-back');
			});
		}

		el.setAttribute('data-sent-to-back', '');
	}

	var root$j = from_html(`<div><div class="svedit-selectable"><br/></div></div>`);
	var root_1$5 = from_html(`<div class="node-gap svelte-1wyy3at"></div>`);

	const $$css$7 = {
		hash: 'svelte-1wyy3at',
		code: '.node-gap.svelte-1wyy3at {display:contents;\n		/* The native browser caret briefly appears inside .svedit-selectable for one frame \n		before the model-driven NodeCaret renders at the correct edge position. \n		Suppressing it here avoids a flash of the native caret. */caret-color:transparent;}\n\n	/* ------------------------------------------------------------------ */\n	/* Un-positioned: no layout box at all                                 */\n	/* ------------------------------------------------------------------ */\n\n	/*\n	 * display: none is load-bearing for large documents. A zero-size\n	 * absolutely-positioned selectable still belongs to the containing\n	 * block\'s out-of-flow list, and the browser lays out EVERY such box\n	 * on EVERY layout pass — measured ~430ms per pass at 2000 nodes\n	 * (~3500 gaps) in Chrome vs ~23ms with the boxes removed. That cost\n	 * hits every keystroke (the per-change reconcile reads a rect for\n	 * every node, and selection rendering forces layout), every window\n	 * resize frame, and every scroll-triggered layout.\n	 *\n	 * Off-screen gaps therefore contribute no layout box. DOM structure\n	 * stays stable (the .node-gap wrapper and selectable elements remain),\n	 * and DOM Ranges may still point into display:none elements, so\n	 * programmatic node selections targeting off-screen gaps keep working.\n	 * Empty-array gaps are excluded: they must stay clickable/visible even\n	 * before reconcile positions them.\n	 */.node-gap:not(.positioned):not(.empty) .svedit-selectable {display:none;}.node-gap:not(.positioned) .svedit-selectable {position:absolute;pointer-events:none;width:0;height:0;overflow:clip;}\n\n	/* ------------------------------------------------------------------ */\n	/* Positioned: full anchor layout                                      */\n	/* ------------------------------------------------------------------ */\n\n	/*\n	 * Anchor references resolved from CSS variable names passed via\n	 * inline style (--_pa = parent anchor, --_next, --_container).\n	 * Same pattern as NodeGapMarkers — keeps JS minimal and anchor() in CSS.\n	 *\n	 * --_pa references the anchor-name of the node this gap belongs to,\n	 * allowing us to position relative to that node\'s edges.\n	 *\n	 * Edge gaps extend outward and clamp to the containing block edge\n	 * (0px floor). This can overlap neighboring elements when the node\n	 * array isn\'t alone in its parent. anchor() only sees the border\n	 * box, so it can\'t detect margin, gap, or parent padding around\n	 * the container. --node-caret-boundary lets consumers set an\n	 * explicit clamp target (a parent element\'s anchor-name) so edge\n	 * gaps stop at that boundary instead. --node-caret-boundary-x and\n	 * --node-caret-boundary-y override per-axis, falling back to\n	 * --node-caret-boundary when unset.\n	 */.node-gap.positioned {\n		/* Fallback 9999999px: when --_pa is orphan (node briefly missing during\n		   edits), anchor() without a fallback invalidates the custom property\n		   and `top` falls back to 0, placing the gap at viewport top as a\n		   giant overlay. 9999999px ensures orphan anchors produce huge values\n		   that min() excludes instead.\n		   LIMIT: documents taller or wider than 9999999px will re-surface\n		   the reported giant-overlay bug — the fallback must exceed the\n		   containing block\'s dimensions to land off-screen. If you need to\n		   support larger documents, bump this value here and in the matching\n		   `* 9999999px` branch-disable trick throughout this file (and in\n		   NodeGapMarkers.svelte). Stay below ~33M px to avoid Blink\'s\n		   LayoutUnit ceiling. */--_s-t: anchor(var(--_pa) top, 9999999px);--_s-b: anchor(var(--_pa) bottom, 9999999px);--_s-l: anchor(var(--_pa) left, 9999999px);--_s-r: anchor(var(--_pa) right, 9999999px);}.node-gap.positioned.gap-before:not(.empty) {--_b-t: anchor(\n			var(--node-caret-boundary-y, var(--node-caret-boundary, --_no-boundary)) top,\n			0px\n		);--_b-l: anchor(\n			var(--node-caret-boundary-x, var(--node-caret-boundary, --_no-boundary)) left,\n			0px\n		);}.node-gap.positioned.gap-after:not(.last) {--_n-t: anchor(var(--_next) top);--_n-l: anchor(var(--_next) left);--_c-r: anchor(var(--_container) right);}.node-gap.positioned.gap-after.last,\n	.node-gap.positioned.gap-before.empty {--_c-t: anchor(var(--_container) top);--_c-b: anchor(var(--_container) bottom);--_c-l: anchor(var(--_container) left);--_c-r: anchor(var(--_container) right);--_b-b: anchor(\n			var(--node-caret-boundary-y, var(--node-caret-boundary, --_no-boundary)) bottom,\n			0px\n		);--_b-r: anchor(\n			var(--node-caret-boundary-x, var(--node-caret-boundary, --_no-boundary)) right,\n			0px\n		);--_b-bt: anchor(\n			var(--node-caret-boundary-y, var(--node-caret-boundary, --_no-boundary)) bottom,\n			9999999px\n		);--_b-rl: anchor(\n			var(--node-caret-boundary-x, var(--node-caret-boundary, --_no-boundary)) right,\n			9999999px\n		);}.node-gap.positioned .svedit-selectable {--_eg: var(--node-caret-edge-gap, 24px);--_gm: var(--node-caret-gap-min-size, 16px);--_R: var(--row, 1);--_C: calc(1 - var(--row, 1));user-select:none;pointer-events:auto;position:absolute;position-anchor:var(--_pa);position-visibility:anchors-visible;z-index:var(--node-caret-gap-z-index, 1);cursor:pointer;}.node-gap.positioned .svedit-selectable[data-sent-to-back] {z-index:0;}\n\n	/* ------------------------------------------------------------------ */\n	/* Merged column / row layout positioning                              */\n	/*                                                                    */\n	/* Uses var(--row, 1) with the * 99999 multiplier trick:              */\n	/*   --_R = var(--row, 1)          → 1 in row, 0 in column           */\n	/*   --_C = calc(1 - var(--row, 1))→ 1 in column, 0 in row           */\n	/* Inside min(), + var(--_R) * 9999999px disables a col branch in row,  */\n	/* + var(--_C) * 9999999px disables a row branch in column.             */\n	/* ------------------------------------------------------------------ */\n\n	/* Between two siblings: col centers vertically, row centers horizontally */.node-gap.positioned.gap-after:not(.last) .svedit-selectable {--_mid: calc((var(--_s-b) + var(--_n-t)) / 2 - var(--_gm) / 2);top:min(\n			calc(var(--_s-b) + var(--_R) * 9999999px),\n			calc(var(--_mid) + var(--_R) * 9999999px),\n			calc(var(--_s-t) + var(--_C) * 9999999px)\n		);bottom:min(\n			calc(var(--_n-t) + var(--_R) * 9999999px),\n			calc(var(--_mid) + var(--_R) * 9999999px),\n			calc(var(--_s-b) + var(--_C) * 9999999px)\n		);left:min(\n			calc(var(--_s-l) + var(--_R) * 9999999px),\n			calc(var(--_s-r) + var(--_C) * 9999999px),\n			calc(\n				(var(--_s-r) + var(--_n-l)) / 2 - var(--_gm) / 2 + max(0px, var(--_s-r) - var(--_n-l)) *\n					999 + var(--_C) * 9999999px\n			),\n			/* Safety clamp for wrap: pins gap inside CB when current/next\n			   wrap across rows. Disabled in nowrap/horizontal-scroll where\n			   next is side-by-side on the same row (n-l > s-r) — there\n			   the other branches position correctly and this clamp would\n			   wrongly force the gap to CB right minus eg. */\n			calc(\n					100% - var(--_eg) + max(0px, var(--_n-l) - var(--_s-r) + 0.5px) * 9999 + var(--_C) *\n						9999999px\n				)\n		);right:min(\n			calc(var(--_s-r) + var(--_R) * 9999999px),\n			calc(\n				max(\n						0px,\n						min(\n							var(--_n-l),\n							calc((var(--_s-r) + var(--_n-l)) / 2 - var(--_gm) / 2),\n							max(\n								min(calc(var(--_c-r) - var(--_eg)), calc(var(--_s-r) - var(--_eg))),\n								calc(var(--_s-r) - (var(--_n-l) - var(--_s-r)) * 999)\n							)\n						)\n					) +\n					var(--_C) * 9999999px\n			)\n		);min-height:calc(var(--_gm) * var(--_C));min-width:calc(var(--_gm) * var(--_R));\n		/* min-height: max(calc(var(--_gm) * var(--_C)), calc(anchor-size(var(--_pa) height, 100%) * var(--_R)));\n		min-width: max(calc(var(--_gm) * var(--_R)), calc(anchor-size(var(--_pa) width, 100%) * var(--_C))); */}\n\n	/* After last node: col extends down, row extends right.\n	   top also clamps to boundary_bottom - eg so that min-height\n	   (which wins over bottom in overconstrained abs-pos) cannot\n	   push the element past the boundary.\n\n	   left\'s third branch (100% - --_eg + max(0, --_s-r - 100% + 0.5px) * 9999)\n	   is the wrap-layout safety clamp: in column or row+wrap layouts\n	   where the last node sits WITHIN the CB (--_s-r < 100%), it pins\n	   the gap inside the CB so it doesn\'t extend past the right edge.\n	   The * 9999 multiplier disables this branch in nowrap horizontal-\n	   scroll (where --_s-r > 100% — the trailing node has overflowed\n	   the CB and the gap is expected to follow it).\n\n	   right\'s `min(--_c-r - --_eg, --_s-r - --_eg)` is what fills the\n	   gap into the whitespace between the last node and the container\n	   in non-overflow layouts. In non-overflow, --_c-r < --_s-r in the\n	   `right` axis (container right is further left than node right\n	   from the CB right edge), so min picks --_c-r - --_eg and the gap\n	   ends at container.right + --_eg (the MUST-RULE overshoot). In\n	   overflow, --_s-r < --_c-r and min picks --_s-r - --_eg — the gap\n	   follows the node out past the container. */.node-gap.positioned.gap-after.last .svedit-selectable {top:min(\n			calc(min(var(--_s-b), calc(var(--_b-bt) - var(--_eg))) + var(--_R) * 9999999px),\n			calc(var(--_s-t) + var(--_C) * 9999999px)\n		);bottom:min(\n			calc(max(var(--_b-b), var(--_s-b) - var(--_eg)) + var(--_R) * 9999999px),\n			calc(var(--_s-b) + var(--_C) * 9999999px)\n		);left:min(\n			calc(var(--_s-l) + var(--_R) * 9999999px),\n			calc(min(var(--_s-r), calc(var(--_b-rl) - var(--_eg))) + var(--_C) * 9999999px),\n			calc(100% - var(--_eg) + max(0px, var(--_s-r) - 100% + 0.5px) * 9999 + var(--_C) * 9999999px)\n		);right:min(\n			calc(var(--_s-r) + var(--_R) * 9999999px),\n			calc(\n				max(var(--_b-r), min(calc(var(--_c-r) - var(--_eg)), calc(var(--_s-r) - var(--_eg)))) +\n					var(--_C) * 9999999px\n			)\n		);min-height:calc(var(--_eg) * var(--_C));min-width:calc(var(--_eg) * var(--_R));}\n\n	/* Before first node: col extends up, row extends left */.node-gap.positioned.gap-before:not(.empty) .svedit-selectable {top:min(\n			calc(max(var(--_b-t), var(--_s-t) - var(--_eg)) + var(--_R) * 9999999px),\n			calc(var(--_s-t) + var(--_C) * 9999999px)\n		);bottom:min(\n			calc(var(--_s-t) + var(--_R) * 9999999px),\n			calc(var(--_s-b) + var(--_C) * 9999999px)\n		);left:min(\n			calc(var(--_s-l) + var(--_R) * 9999999px),\n			calc(max(var(--_b-l), var(--_s-l) - var(--_eg)) + var(--_C) * 9999999px)\n		);right:min(\n			calc(var(--_s-r) + var(--_R) * 9999999px),\n			calc(var(--_s-l) + var(--_C) * 9999999px)\n		);min-height:calc(var(--_eg) * var(--_C));min-width:calc(var(--_eg) * var(--_R));}\n\n	/* Empty array: the gap fills its placeholder, which is this\n	   selectable\'s containing block (NodeArrayProperty sets it\n	   position: relative). inset:0 fills it with no anchor() — so no\n	   .positioned gating and no anchor cost. The width:auto, height:auto\n	   and pointer-events:auto override the :not(.positioned) 0×0\n	   collapse; position-visibility:always overrides the .positioned\n	   rule\'s anchors-visible, so a transient positioned toggle can\'t\n	   hide the gap. */.node-gap.gap-before.empty .svedit-selectable {position:absolute;inset:0;width:auto;height:auto;pointer-events:auto;position-visibility:always;}\n\n	/* Debugging styles - DO NOT CHANGE OR REMOVE */\n	/* :global(.node-gap.positioned .svedit-selectable) {\n		outline: 2px solid rgba(238, 0, 255, 0.5);\n		background-color: rgba(238, 0, 255, 0.5);\n		outline-offset: -0.5px;\n	} */'
	};

	function NodeGap($$anchor, $$props) {
		push($$props, true);
		append_styles$1($$anchor, $$css$7);

		/**
		 * ┌─────────────────────────────────────────────────────────────────┐
		 * │ MUST RULES — do not violate when modifying this file            │
		 * ├─────────────────────────────────────────────────────────────────┤
		 * │ 1. Edge gaps (gap-before at offset 0 / gap-after.last) MUST      │
		 * │    render OUTSIDE the node-array container — they extend into   │
		 * │    the whitespace above/below (column) or left/right (row) of   │
		 * │    the first/last node. They only clamp when the consumer       │
		 * │    explicitly opts in via --node-caret-boundary(-x/-y).         │
		 * │ 2. Gaps MUST NEVER overlap nodes. They render strictly in the   │
		 * │    whitespace between nodes (mid gaps) or outside the node      │
		 * │    array bounds (edge gaps). Never on top of a node.            │
		 * └─────────────────────────────────────────────────────────────────┘
		 *
		 * Invisible keyboard caret selectable and gap hit area.
		 *
		 * Rendered as a sibling of Node elements inside NodeArrayProperty,
		 * interleaved between nodes in DOM order. This ensures:
		 * - Correct DOM order for native drag-to-select across nodes
		 * - No containing-block issues from transform/filter/will-change on nodes
		 *
		 * Always present in the DOM when editable (stable structure for
		 * selection anchoring, scrollTo, etc.). Anchor positioning is
		 * activated lazily via the `.positioned` class, derived reactively
		 * from the visibility registry's array_indices / edge_map. Svelte's
		 * reactive collections track reads at per-key granularity, so a
		 * registry write only
		 * re-evaluates the adjacent gaps. Applying the class declaratively
		 * (instead of imperative classList toggles) means it survives DOM
		 * recreation without a document change (e.g. dev-mode HMR).
		 *
		 * `position-visibility: anchors-visible` does NOT skip anchor
		 * resolution — the browser resolves all anchor() then hides the
		 * result. The `.positioned` class toggle is required to prevent
		 * O(N) anchor resolution on every layout pass.
		 *
		 * Row/column detection uses var(--row, 1) with the * 99999 multiplier
		 * trick — no @container style() queries, works in all browsers.
		 *
		 * If you override this component via `system_components.node_gap`, make
		 * sure your custom component also handles read-only mode by rendering a
		 * plain `.node-gap` placeholder without editable internals.
		 */
		const svedit = getContext('svedit');

		let empty = prop($$props, 'empty', 3, false);
		let is_editable = user_derived(() => svedit.editable);
		let is_first = user_derived(() => $$props.offset === 0);
		let is_last = user_derived(() => $$props.offset === $$props.count);
		let type = user_derived(() => get$1(is_first) ? 'gap-before' : 'gap-after');
		let path_str = user_derived(() => serialize_path($$props.array_path));

		// Two-derived split is load-bearing: get_array_indices lazily
		// creates the set, and Svelte doesn't track deps on state created
		// inside the reading derived — so acquire here, read in `positioned`.
		let near_indices = user_derived(() => svedit.visibility_registry.get_array_indices(get$1(path_str)));

		let positioned = user_derived(() => get$1(is_editable) && should_position_gap(get$1(near_indices), svedit.visibility_registry.edge_map.get(get$1(path_str)), $$props.offset, get$1(is_last), empty()));

		let gap_style = user_derived(() => {
			if (!get$1(is_editable)) return '';

			const prev_idx = $$props.offset - 1;

			const pa = get$1(is_first)
				? `--${serialize_path([...$$props.array_path, 0])}`
				: `--${serialize_path([...$$props.array_path, prev_idx])}`;

			const next = `--${serialize_path([...$$props.array_path, $$props.offset])}`;
			const container = `--${serialize_path($$props.array_path)}`;

			return `--_pa:${pa};--_next:${next};--_container:${container}`;
		});

		let anchor_name = user_derived(() => {
			if (!get$1(is_editable)) return '';
			if (get$1(is_first)) return `--g-${serialize_path([...$$props.array_path, 0])}-gap-before`;

			return `--g-${serialize_path([...$$props.array_path, $$props.offset - 1])}-gap-after`;
		});

		var fragment = comment();
		var node = first_child(fragment);

		{
			var consequent = ($$anchor) => {
				var div = root$j();
				let classes;
				var div_1 = only_child(div);

				template_effect(() => {
					classes = set_class(div, 1, 'node-gap svelte-1wyy3at', null, classes, {
						'gap-before': get$1(is_first),
						'gap-after': !get$1(is_first),
						empty: empty(),
						last: get$1(is_last),
						positioned: get$1(positioned)
					});

					set_attribute(div, 'data-type', get$1(type));
					set_attribute(div, 'data-gap-array-path', get$1(path_str));
					set_attribute(div, 'data-gap-offset', $$props.offset);
					set_style(div, get$1(gap_style));
					set_style(div_1, `anchor-name:${get$1(anchor_name) ?? ''}`);
				});

				delegated('pointerdown', div_1, cycle_z_index);
				append($$anchor, div);
			};

			var alternate = ($$anchor) => {
				var div_2 = root_1$5();

				append($$anchor, div_2);
			};

			if_block(node, ($$render) => {
				if (get$1(is_editable)) $$render(consequent); else $$render(alternate, -1);
			});
		}

		append($$anchor, fragment);
		pop();
	}

	delegate(['pointerdown']);

	enable_legacy_mode_flag();

	var root$i = from_html(`<div class="caret svelte-mzpbhk" role="none"></div>`);

	const $$css$6 = {
		hash: 'svelte-mzpbhk',
		code: '.caret.svelte-mzpbhk {--_R: var(--row, 1);--_C: calc(1 - var(--row, 1));position:absolute;inset:0;pointer-events:none;z-index:var(--node-caret-z-index, 20);\n		animation: var(\n			--node-caret-animation,\n			node-caret-blink var(--node-caret-blink-duration, 1.1s) ease-in-out infinite\n		);}.caret.svelte-mzpbhk::before {--_ci: var(--node-caret-inset, var(--node-caret-marker-inset, 2px));--_ct: var(--node-caret-thickness, 2px);--_cp: var(--node-caret-row-inline-position, 50%);content:\'\';position:absolute;background:var(--node-caret-bg, var(--editing));\n		/* Increase the visibility of the caret by contrasting it with a box shadow that\'s the inverted brightness of the current text color. */\n		/* Component developers must set their background color and text color on the node itself, not a child element, for this to work. */box-shadow:var(--node-caret-shadow, 0 0 0 0.5px oklch(from currentColor calc(1 - l) c h));border:var(--node-caret-border, none);border-radius:var(--node-caret-radius, 1px);\n		/*\n		 * Column: horizontal line at 50% — top=50%, bottom=50%-thickness.\n		 * Row: vertical line at --_cp — left=cp, right=100%-cp-thickness.\n		 * No explicit height/width — inset pairs control dimensions.\n		 */top:min(\n			calc(50% + var(--_R) * 99999px),\n			calc(var(--_ci) + var(--_C) * 99999px)\n		);bottom:min(\n			calc(50% - var(--_ct) + var(--_R) * 99999px),\n			calc(var(--_ci) + var(--_C) * 99999px)\n		);left:min(\n			calc(var(--_ci) + var(--_R) * 99999px),\n			calc(var(--_cp) + var(--_C) * 99999px)\n		);right:min(\n			calc(var(--_ci) + var(--_R) * 99999px),\n			calc(100% - var(--_cp) - var(--_ct) + var(--_C) * 99999px)\n		);transform:translateY(calc(var(--_C) * -0.5px))\n			translateX(calc(var(--_R) * -0.5px));}'
	};

	function NodeCaret($$anchor) {
		append_styles$1($$anchor, $$css$6);

		var /**
		 * Visual insertion caret rendered inside the active insertion marker.
		 *
		 * This component is presentation-only. It reads styling tokens for
		 * color/shape/animation and switches orientation via var(--row, 1)
		 * with the * 99999 multiplier trick — works in all browsers.
		 */
		div = root$i();

		append($$anchor, div);
	}

	var root$h = from_html(`<!> <!>`, 1);
	var root_1$4 = from_html(`<div contenteditable="false"><!></div>`);

	const $$css$5 = {
		hash: 'svelte-fcy96a',
		code: '\n	/*\n	 * Public customization tokens (set on an ancestor or this component):\n	 * --editing-stroke\n	 * --node-caret-gap-color\n	 * --node-caret-symbol-size\n	 * --node-caret-symbol-stroke\n	 * --node-caret-symbol-gap\n	 * --node-caret-symbol-bg\n	 * --node-caret-symbol-mask\n	 * --node-caret-marker-inset\n	 * --node-caret-edge-gap\n	 * --node-caret-gap-min-size\n	 * --node-caret-marker-padding\n	 * --node-caret-marker-z-index\n	 * --node-caret-line-border\n	 * --node-caret-empty-border\n	 * --node-caret-empty-border-radius\n	 * --node-caret-bg\n	 * --node-caret-shadow\n	 * --node-caret-border\n	 * --node-caret-thickness\n	 * --node-caret-inset\n	 * --node-caret-radius\n	 * --node-caret-z-index\n	 * --node-caret-blink-duration\n	 * --node-caret-animation\n	 * --node-caret-row-inline-position\n	 * --node-caret-boundary          (anchor-name of a parent element; edge\n	 *                                  gaps clamp to its edges instead of 0px.\n	 *                                  Prevents overlap when the node array has\n	 *                                  neighbors. See NodeGap.svelte for details.)\n	 * --node-caret-boundary-x        (per-axis override; clamps left/right only)\n	 * --node-caret-boundary-y        (per-axis override; clamps top/bottom only)\n	 *\n	 * Row/column detection uses var(--row, 1) with the * 9999999 multiplier\n	 * trick throughout. Shorthand:\n	 *   --_R: var(--row, 1)              (1 when row, 0 when column)\n	 *   --_C: calc(1 - var(--row, 1))    (1 when column, 0 when row)\n	 *\n	 * Inside min(): + var(--_X) * 9999999px makes a branch huge → min ignores it.\n	 * Inside max(): + var(--_X) * -9999999px makes a branch tiny → max ignores it.\n	 * Nested min/max inherit the outermost convention: if the root is min(),\n	 * all branches (even inside inner max()) use + 9999999px to disable.\n	 */\n\n	/* Suppress caret blink during active click on a node gap. */.svedit-canvas:active .gap-marker.svelte-fcy96a {--node-caret-animation: none;}\n\n	/*\n	 * Base marker positioning.\n	 *\n	 * Each subclass (gap-empty, gap-mid, gap-edge) provides its own\n	 * top/left/bottom/right anchored to NODE elements directly — never\n	 * to the NodeGap .svedit-selectable. This avoids chained anchor\n	 * positioning (marker → selectable → node) which fails in some\n	 * layouts.\n	 *\n	 * Anchor CSS custom properties (set via inline style on each element):\n	 *   --_ct  node gap (.svedit-selectable anchor-name, unused by markers)\n	 *   --_a   adjacent node (edge gaps) or placeholder (empty arrays)\n	 *   --_p   previous node (mid gaps)\n	 *   --_n   next node (mid gaps, row same-line vs wrap detection)\n	 *   --_f   reference item 0 (row gap narrowing)\n	 *   --_s   reference item 1 (row gap narrowing)\n	 *   --_c   node-array container (edge row.last cap)\n	 */.gap-marker.svelte-fcy96a {--_eg: var(--node-caret-edge-gap, 24px);--_gm: var(--node-caret-gap-min-size, 16px);--_R: var(--row, 1);--_C: calc(1 - var(--row, 1));position:absolute;position-visibility:anchors-visible;pointer-events:none;z-index:var(--node-caret-marker-z-index, 2);padding:var(--node-caret-marker-padding, 2px);margin:0 !important; /* prevent unwanted margin from parent elements */}\n\n	/*\n	 * position-anchor ties the marker\'s containing-block/scroll behavior to\n	 * a specific anchor element, so the marker tracks its anchor\'s scroll\n	 * container the same way NodeGap\'s .svedit-selectable does. Without it,\n	 * markers inside a nested scroll container stay fixed in viewport space\n	 * while the anchored nodes scroll away.\n	 */.gap-marker.gap-empty.svelte-fcy96a,\n	.gap-marker.gap-edge.svelte-fcy96a {position-anchor:var(--_a);}.gap-marker.gap-mid.svelte-fcy96a {position-anchor:var(--_p);}\n\n	/* --------------------------------------------------------------------- */\n	/* Empty array                                                           */\n	/* --------------------------------------------------------------------- */.gap-marker.gap-empty.svelte-fcy96a {--node-caret-row-inline-position: calc(var(--_R) * 0px + var(--_C) * 50%);top:anchor(var(--_a) top);left:anchor(var(--_a) left);bottom:anchor(var(--_a) bottom);right:max(\n			calc(anchor(var(--_a) right) + var(--_R) * -9999999px),\n			calc(anchor(var(--_a) right) + var(--_C) * -9999999px),\n			calc(anchor(var(--_a) left) - var(--_eg) + var(--_C) * -9999999px)\n		);}\n\n	/* --------------------------------------------------------------------- */\n	/* Mid gap (between two nodes) — anchors directly to --_p and --_n.     */\n	/* Column: spans from prev bottom to next top, with a centering branch  */\n	/* that guarantees at least --_gm height when the gap is too small.     */\n	/* Row: spans prev node. Row left/right use complex narrowing logic;    */\n	/* row branches all get + var(--_C) * 9999999px so they\'re ignored in     */\n	/* column layout.                                                        */\n	/* --------------------------------------------------------------------- */.gap-marker.gap-mid.svelte-fcy96a {top:min(\n			calc(anchor(var(--_p) bottom) + var(--_R) * 9999999px),\n			calc(\n				(anchor(var(--_p) bottom) + anchor(var(--_n) top)) / 2\n				- var(--_gm) / 2\n				+ var(--_R) * 9999999px\n			),\n			calc(anchor(var(--_p) top) + var(--_C) * 9999999px)\n		);bottom:min(\n			calc(anchor(var(--_n) top) + var(--_R) * 9999999px),\n			calc(\n				(anchor(var(--_p) bottom) + anchor(var(--_n) top)) / 2\n				- var(--_gm) / 2\n				+ var(--_R) * 9999999px\n			),\n			calc(anchor(var(--_p) bottom) + var(--_C) * 9999999px)\n		);left:min(\n			calc(anchor(var(--_p) left) + var(--_R) * 9999999px),\n			calc(anchor(var(--_p) right) + var(--_C) * 9999999px),\n			calc(\n				(anchor(var(--_p) right) + anchor(var(--_n) left)) / 2\n				- var(--_gm) / 2\n				+ max(0px, anchor(var(--_p) right) - anchor(var(--_n) left)) * 9999\n				+ var(--_C) * 9999999px\n			),\n			/* Wrap narrowing: centers marker in a gap-width region at prev_right.\n			   The + 0.5px disables this branch for zero-gap grids (items touching)\n			   where gap/2 - max(gap,--_gm)/2 would incorrectly shift left by 8px. */\n			calc(\n				anchor(var(--_p) right)\n				+ (max(0px, anchor(var(--_s) left) - anchor(var(--_f) right))) / 2\n				- max(\n					max(0px, anchor(var(--_s) left) - anchor(var(--_f) right)),\n					var(--_gm)\n				) / 2\n				+ max(0px, anchor(var(--_n) left) - anchor(var(--_p) right)) * 9999\n				+ max(0px, anchor(var(--_f) right) - anchor(var(--_s) left) + 0.5px) * 9999\n				+ var(--_C) * 9999999px\n			),\n			/* Safety clamp for wrap: pins marker inside CB when prev/next wrap\n			   across rows (so the marker ends at the right edge of row 1).\n			   Disabled in nowrap/horizontal-scroll where p and n are\n			   side-by-side on the same row — there the other branches\n			   position correctly and this clamp would wrongly force the\n			   marker to the CB right. */\n			calc(\n				100% - var(--_gm)\n				+ max(0px, anchor(var(--_n) left) - anchor(var(--_p) right) + 0.5px) * 9999\n				+ var(--_C) * 9999999px\n			),\n			calc(\n				100% - max(\n					max(0px, anchor(var(--_s) left) - anchor(var(--_f) right)),\n					var(--_gm)\n				)\n				+ max(0px,\n					(max(0px, anchor(var(--_s) left) - anchor(var(--_f) right)))\n					- (anchor(var(--_c) right) - anchor(var(--_p) right))\n					- 0.5px\n				) * 9999\n				+ max(0px, anchor(var(--_n) left) - anchor(var(--_p) right)) * 9999\n				+ var(--_C) * 9999999px\n			)\n		);right:max(\n			/* CB-right floor, disabled in nowrap/horizontal-scroll where n\n			   extends past CB right (p_right - n_left > 0 in right context,\n			   equivalent to n_left_body > p_right_body in layout). In that\n			   case the marker must extend past CB right to reach the gap,\n			   so right must be allowed to go negative. */\n			calc(\n				0px + var(--_C) * -9999999px\n				- max(0px, anchor(var(--_p) right) - anchor(var(--_n) left) + 0.5px) * 9999\n			),\n			min(\n				calc(anchor(var(--_p) right) + var(--_R) * 9999999px),\n				calc(\n					anchor(var(--_n) left) + var(--_C) * 9999999px\n				),\n				calc(\n					(anchor(var(--_p) right) + anchor(var(--_n) left)) / 2\n					- var(--_gm) / 2\n					+ var(--_C) * 9999999px\n				),\n				max(\n					/* Symmetric right-side narrowing. The + 0.5px mirrors the left\n					   fix: disables for zero-gap grids to prevent 8px inward shift. */\n					calc(\n						anchor(var(--_p) right)\n						- (\n							max(0px, anchor(var(--_f) right) - anchor(var(--_s) left))\n							+ max(\n								max(0px, anchor(var(--_f) right) - anchor(var(--_s) left)),\n								var(--_gm)\n							)\n						) / 2\n						- max(0px, anchor(var(--_s) left) - anchor(var(--_f) right) + 0.5px) * 9999\n						+ var(--_C) * 9999999px\n					),\n					calc(\n						anchor(var(--_p) right) - var(--_gm)\n						- max(0px,\n							(anchor(var(--_p) right) - anchor(var(--_c) right))\n							- (max(0px, anchor(var(--_f) right) - anchor(var(--_s) left)))\n							+ 0.5px\n						) * 9999\n						+ var(--_C) * 9999999px\n					),\n					calc(\n						anchor(var(--_p) right) - var(--_gm)\n						- max(0px, anchor(var(--_f) right) - anchor(var(--_s) left)) * 9999\n						+ var(--_C) * 9999999px\n					),\n					calc(\n						anchor(var(--_p) right)\n						- (anchor(var(--_n) left) - anchor(var(--_p) right)) * 9999\n						+ var(--_C) * 9999999px\n					),\n					min(\n						calc(anchor(var(--_c) right) + var(--_C) * 9999999px),\n						calc(anchor(var(--_p) right) - var(--_eg) + var(--_C) * 9999999px)\n					)\n				)\n			)\n		);}\n\n	/* --------------------------------------------------------------------- */\n	/* Edge gaps                                                             */\n	/* --------------------------------------------------------------------- */.gap-marker.gap-edge.svelte-fcy96a {min-height:var(--_gm);min-width:var(--_gm);}\n\n	/* Edge first: column = above first node, row = left of first node */.gap-edge.first.svelte-fcy96a {--_b-t: anchor(var(--node-caret-boundary-y, var(--node-caret-boundary, --_no-boundary)) top, 0px);--_b-l: anchor(var(--node-caret-boundary-x, var(--node-caret-boundary, --_no-boundary)) left, 0px);top:min(\n			calc(anchor(var(--_a) top) + var(--_C) * 9999999px),\n			calc(max(var(--_b-t), calc(anchor(var(--_a) top) - var(--_gm))) + var(--_R) * 9999999px)\n		);bottom:min(\n			calc(anchor(var(--_a) bottom) + var(--_C) * 9999999px),\n			calc(anchor(var(--_a) top) + var(--_R) * 9999999px)\n		);left:min(\n			calc(anchor(var(--_a) left) + var(--_R) * 9999999px),\n			calc(max(var(--_b-l), calc(anchor(var(--_a) left) - var(--_gm))) + var(--_C) * 9999999px)\n		);right:min(\n			calc(anchor(var(--_a) right) + var(--_R) * 9999999px),\n			calc(anchor(var(--_a) left) + var(--_C) * 9999999px)\n		);}\n\n	/* Edge last: column = below last node, row = right of last node.\n	   top/left also clamp to boundary - gm so that min-height/min-width\n	   (which win over bottom/right in overconstrained abs-pos) cannot\n	   push the element past the boundary. */.gap-edge.last.svelte-fcy96a {--_b-b: anchor(var(--node-caret-boundary-y, var(--node-caret-boundary, --_no-boundary)) bottom, 0px);--_b-r: anchor(var(--node-caret-boundary-x, var(--node-caret-boundary, --_no-boundary)) right, 0px);--_b-bt: anchor(var(--node-caret-boundary-y, var(--node-caret-boundary, --_no-boundary)) bottom, 9999999px);--_b-rl: anchor(var(--node-caret-boundary-x, var(--node-caret-boundary, --_no-boundary)) right, 9999999px);top:min(\n			calc(anchor(var(--_a) top) + var(--_C) * 9999999px),\n			calc(\n				min(\n					anchor(var(--_a) bottom),\n					calc(var(--_b-bt) - var(--_gm))\n				) + var(--_R) * 9999999px\n			)\n		);bottom:min(\n			calc(anchor(var(--_a) bottom) + var(--_C) * 9999999px),\n			calc(max(var(--_b-b), calc(anchor(var(--_a) bottom) - var(--_gm))) + var(--_R) * 9999999px)\n		);left:min(\n			calc(anchor(var(--_a) left) + var(--_R) * 9999999px),\n			calc(\n				min(\n					anchor(var(--_a) right),\n					calc(var(--_b-rl) - var(--_gm))\n				) + var(--_C) * 9999999px\n			),\n			calc(100% - var(--_gm) + var(--_C) * 9999999px)\n		);right:max(\n			calc(var(--_b-r) + var(--_C) * -9999999px),\n			calc(anchor(var(--_a) right) + var(--_R) * -9999999px),\n			calc(anchor(var(--_a) right) - var(--_gm) + var(--_C) * -9999999px),\n			/* Column / wrap-layout fill: when the last item sits within\n			   the container (non-overflow), max picks anchor(--_c right)\n			   and the marker stretches to the containers trailing edge.\n			   In row-overflow this branch is dominated by anchor(--_a right)\n			   which is smaller, so the marker follows the trailing node\n			   past the container. */\n			calc(anchor(var(--_c) right) + var(--_C) * -9999999px)\n		);}\n\n	/* --------------------------------------------------------------------- */\n	/* Trailing gap in row with 2+ items: complex narrowing using --_f/--_s  */\n	/* Overrides .gap-edge.last — must re-include col branch for both left   */\n	/* (min: + 9999999px to disable) and right (max: * -9999999px to disable).   */\n	/* --------------------------------------------------------------------- */\n\n	/* Purpose of this + 0.5px: disable for zero-gap grids (see .gap-mid comment). */.gap-marker.gap-edge.last.pair.svelte-fcy96a {left:min(\n			calc(anchor(var(--_a) left) + var(--_R) * 9999999px),\n			calc(anchor(var(--_a) right) + var(--_C) * 9999999px),\n			calc(var(--_b-rl) - var(--_gm) + var(--_C) * 9999999px),\n			calc(\n				anchor(var(--_a) right)\n				+ (max(0px, anchor(var(--_s) left) - anchor(var(--_f) right))) / 2\n				- max(\n					max(0px, anchor(var(--_s) left) - anchor(var(--_f) right)),\n					var(--_gm)\n				) / 2\n				+ max(0px, anchor(var(--_f) right) - anchor(var(--_s) left)) * 9999\n				+ max(0px, anchor(var(--_a) right) - anchor(var(--_c) right) + 0.5px) * 9999\n				+ var(--_C) * 9999999px\n			),\n			/* Safety clamp for wrap: pins marker inside CB when items 0 and 1\n			   wrap across rows. Disabled in nowrap/horizontal-scroll where\n			   items 0 and 1 are side-by-side on the same row — there the\n			   anchor-based branches position correctly and this clamp would\n			   wrongly force the marker to the CB right. */\n			calc(\n				100% - var(--_gm)\n				+ max(0px, anchor(var(--_s) left) - anchor(var(--_f) right) + 0.5px) * 9999\n				+ var(--_C) * 9999999px\n			),\n			calc(\n				100% - max(\n					max(0px, anchor(var(--_s) left) - anchor(var(--_f) right)),\n					var(--_gm)\n				)\n				+ max(0px,\n					(max(0px, anchor(var(--_s) left) - anchor(var(--_f) right)))\n					- (anchor(var(--_c) right) - anchor(var(--_a) right))\n					- 0.5px\n				) * 9999\n				+ var(--_C) * 9999999px\n			)\n		);right:max(\n			calc(anchor(var(--_a) right) + var(--_R) * -9999999px),\n			calc(var(--_b-r) + var(--_C) * -9999999px),\n			calc(\n				anchor(var(--_a) right)\n				- (\n					max(0px, anchor(var(--_f) right) - anchor(var(--_s) left))\n					+ max(\n						max(0px, anchor(var(--_f) right) - anchor(var(--_s) left)),\n						var(--_gm)\n					)\n				) / 2\n				- max(0px, anchor(var(--_s) left) - anchor(var(--_f) right)) * 9999\n				- max(0px, anchor(var(--_c) right) - anchor(var(--_a) right) + 0.5px) * 9999\n				+ var(--_C) * -9999999px\n			),\n			calc(\n				anchor(var(--_a) right) - var(--_gm)\n				- max(0px,\n					(anchor(var(--_a) right) - anchor(var(--_c) right))\n					- (max(0px, anchor(var(--_f) right) - anchor(var(--_s) left)))\n					+ 0.5px\n				) * 9999\n				+ var(--_C) * -9999999px\n			),\n			calc(\n				anchor(var(--_a) right) - var(--_gm)\n				- max(0px, anchor(var(--_f) right) - anchor(var(--_s) left)) * 9999\n				+ var(--_C) * -9999999px\n			),\n			min(\n				calc(anchor(var(--_c) right) + var(--_C) * -9999999px),\n				calc(anchor(var(--_a) right) - var(--_eg) + var(--_C) * -9999999px)\n			)\n		);}\n\n	/* --------------------------------------------------------------------- */\n	/* Marker visuals (line + symbol). Hidden when active (caret shows).     */\n	/* --------------------------------------------------------------------- */.gap-marker.svelte-fcy96a:not(.active) {&::before {content:\'\';position:absolute;--gap-center: calc( var(--node-caret-symbol-size, 6px) / 2 + var(--node-caret-symbol-gap, 4px) );}\n\n		/* Dashed line: horizontal (column) or vertical (row).\n		   Column: top=50% bottom=50% → zero height, border-top is the line.\n		   Row: left=50% right=50% → zero width, border-left is the line.\n		   No explicit height/width — inset pairs control dimensions. */&:not(.gap-empty)::before {--_mi: var(--node-caret-marker-inset, 2px);top:min(\n				calc(50% + var(--_R) * 9999999px),\n				calc(var(--_mi) + var(--_C) * 9999999px)\n			);bottom:min(\n				calc(50% + var(--_R) * 9999999px),\n				calc(var(--_mi) + var(--_C) * 9999999px)\n			);left:min(\n				calc(var(--_mi) + var(--_R) * 9999999px),\n				calc(50% + var(--_C) * 9999999px)\n			);right:min(\n				calc(var(--_mi) + var(--_R) * 9999999px),\n				calc(50% + var(--_C) * 9999999px)\n			);border-top:calc(var(--_C) * 1px) dashed var(--node-caret-gap-color, var(--editing-stroke));border-left:calc(var(--_R) * 1px) dashed var(--node-caret-gap-color, var(--editing-stroke));transform:translateY(calc(var(--_C) * -0.5px))\n				translateX(calc(var(--_R) * -0.5px));mask-image:radial-gradient(\n				circle at center,\n				transparent calc(var(--gap-center) - 0.5px),\n				black var(--gap-center)\n			);}\n\n		/* Empty array marker (dashed outline for discoverability). */&.gap-empty::before {inset:0px;border:var(--node-caret-empty-border, 1px dashed var(--node-caret-gap-color, var(--editing-stroke)));border-radius:var(--node-caret-empty-border-radius, 3px);}\n\n		/* Centered insertion symbol (default mask renders a plus). */&::after {content:\'\';position:absolute;width:var(--node-caret-symbol-size, 6px);height:var(--node-caret-symbol-size, 6px);top:50%;left:50%;transform:translate(-50%, -50%);background:var(--node-caret-symbol-bg, var(--node-caret-gap-color, var(--editing-stroke)));mask:var(--node-caret-symbol-mask,\n				linear-gradient(black, black) center / 100% var(--node-caret-symbol-stroke, 1px) no-repeat,\n				linear-gradient(black, black) center / var(--node-caret-symbol-stroke, 1px) 100% no-repeat\n			);}}\n\n	/* Debugging styles - DO NOT CHANGE OR REMOVE */\n	/* :global([data-type="node_array"]) {\n		outline: 0.1px solid green;\n	}\n	.gap-marker {\n		outline: 1px solid blue;\n		outline-offset: 0.5px;\n	} */'
	};

	function NodeGapMarkers($$anchor, $$props) {
		push($$props, true);
		append_styles$1($$anchor, $$css$5);

		/**
		 * ┌─────────────────────────────────────────────────────────────────┐
		 * │ MUST RULES — do not violate when modifying this file            │
		 * ├─────────────────────────────────────────────────────────────────┤
		 * │ 1. Edge markers (gap-edge.first / gap-edge.last) MUST render    │
		 * │    OUTSIDE the node-array container — they extend into the     │
		 * │    whitespace above/below (column) or left/right (row) of the  │
		 * │    first/last node. They only clamp inward when the consumer   │
		 * │    explicitly opts in via --node-caret-boundary(-x/-y).        │
		 * │ 2. Markers MUST NEVER overlap nodes. They render strictly in   │
		 * │    the whitespace between nodes (mid markers) or outside the   │
		 * │    node array bounds (edge markers). Never on top of a node.  │
		 * └─────────────────────────────────────────────────────────────────┘
		 *
		 * Renders insertion gap markers for a single node_array.
		 *
		 * Lives inside NodeArrayProperty so it inherits the --row CSS variable.
		 * Uses var(--row, 1) with the * 9999999 multiplier trick to switch between
		 * column and row positioning/visuals in pure CSS — no container queries.
		 *
		 * Reads visibility state directly from the registry. SvelteSet's per-key
		 * tracking on `.has()` and iteration means this component only
		 * re-evaluates when THIS array's visible-index set changes.
		 *
		 * The active marker (the one carrying the caret) additionally renders the
		 * consumer's `system_components.node_gap_tools` component when configured
		 * — an extension point for gap-scoped tools (e.g. an insert button).
		 * Rendering inside the marker means the tool inherits --row for
		 * orientation-aware styling and shows/hides together with the caret.
		 * The marker has pointer-events: none — interactive tools must set
		 * pointer-events: auto themselves.
		 */
		const svedit = getContext('svedit');

		let NodeGapTools = user_derived(() => svedit.session.config.system_components?.node_gap_tools);
		let path_str = user_derived(() => serialize_path($$props.path));
		let visible = user_derived(() => svedit.visibility_registry.get_array_indices(get$1(path_str)));

		let caret_gap_key = user_derived(() => {
			const s = svedit.session.selection;

			if (s?.type !== 'node' || s.anchor_offset !== s.focus_offset) return null;

			return `${serialize_path(s.path)}-gap-${s.anchor_offset}`;
		});

		let my_gaps = user_derived(() => {
			const registry = svedit.visibility_registry;
			const edge_state = registry.edge_map.get(get$1(path_str));
			const anchor_prefix = `--${get$1(path_str)}`;
			const g_prefix = `--g-${get$1(path_str)}`;
			const container_var = `;--_c:${anchor_prefix}`;
			const has_pair = $$props.count >= 2;

			const pair_vars = has_pair
				? `;--_f:${anchor_prefix}${PATH_SEPARATOR}0;--_s:${anchor_prefix}${PATH_SEPARATOR}1`
				: '';

			const result = [];

			if ($$props.count === 0) {
				if (get$1(visible).has(0)) {
					result.push({
						key: `${get$1(path_str)}-gap-0`,
						offset: 0,
						type: 'gap-empty',
						vars: `--_ct:${g_prefix}${PATH_SEPARATOR}0-gap-before;--_a:${anchor_prefix}${PATH_SEPARATOR}0${container_var}`,
						is_first: true,
						is_last: true,
						has_pair: false
					});
				}

				return result;
			}

			// Iterate visible indices (O(K)) instead of 0..count (O(N)) — at
			// 1000 nodes with ~30 visible, this drops 1001 SvelteSet/SvelteMap
			// reads per re-derivation to ~30. Filter stale indices >= count
			// that may briefly remain after a node delete (until MO fires).
			const sorted = [];

			for (const i of get$1(visible)) {
				if (i >= 0 && i < $$props.count) sorted.push(i);
			}

			sorted.sort((a, b) => a - b);

			if (sorted.length === 0) return result;

			const offsets = [];

			function add_offset(offset) {
				if (!offsets.includes(offset)) offsets.push(offset);
			}

			// Emissions accumulate in ascending offset order, so iterating
			// `offsets` later doesn't need a sort.
			// Edge gap-before: emit if node 0 is in the near set AND the
			// edge_map says the first node has reached the array's leading
			// edge. edge_map is the scroll-aware BCR check that replaces
			// the stale IO clip_map for edge nodes.
			if (sorted[0] === 0 && edge_state?.first === true) {
				add_offset(0);
			}

			// Mid gaps: between consecutive visible nodes. The gap at offset N
			// sits between node N-1 and node N — emit when both are visible.
			for (let i = 0; i < sorted.length - 1; i++) {
				if (sorted[i + 1] === sorted[i] + 1) add_offset(sorted[i + 1]);
			}

			// Edge gap-after.last: same gate as gap-before but on the trailing edge.
			if (sorted[sorted.length - 1] === $$props.count - 1 && edge_state?.last === true) {
				add_offset($$props.count);
			}

			for (const offset of offsets) {
				const is_first = offset === 0;
				const is_last = offset === $$props.count;

				const g_anchor = is_first
					? `${g_prefix}${PATH_SEPARATOR}0-gap-before`
					: `${g_prefix}${PATH_SEPARATOR}${offset - 1}-gap-after`;

				let type, vars;

				if (is_first || is_last) {
					type = 'gap-edge';

					const adjacent = is_first
						? `${anchor_prefix}${PATH_SEPARATOR}0`
						: `${anchor_prefix}${PATH_SEPARATOR}${$$props.count - 1}`;

					vars = `--_ct:${g_anchor};--_a:${adjacent}${container_var}${pair_vars}`;
				} else {
					type = 'gap-mid';

					const p_anchor = `${anchor_prefix}${PATH_SEPARATOR}${offset - 1}`;
					const n_anchor = `${anchor_prefix}${PATH_SEPARATOR}${offset}`;

					vars = `--_ct:${g_anchor};--_p:${p_anchor};--_n:${n_anchor}${container_var}${pair_vars}`;
				}

				result.push({
					key: `${get$1(path_str)}-gap-${offset}`,
					offset,
					type,
					vars,
					is_first,
					is_last,
					has_pair
				});
			}

			return result;
		});

		var fragment = comment();
		var node = first_child(fragment);

		each(node, 17, () => get$1(my_gaps), (gap) => gap.key, ($$anchor, gap) => {
			var div = root_1$4();
			let classes;
			var node_1 = child(div);

			{
				var consequent_1 = ($$anchor) => {
					var fragment_1 = root$h();
					var node_2 = first_child(fragment_1);

					NodeCaret(node_2);

					var node_3 = sibling(node_2, 2);

					{
						var consequent = ($$anchor) => {
							var fragment_2 = comment();
							var node_4 = first_child(fragment_2);

							component(node_4, () => get$1(NodeGapTools), ($$anchor, NodeGapTools_1) => {
								NodeGapTools_1($$anchor, {
									get path() {
										return $$props.path;
									},

									get offset() {
										return get$1(gap).offset;
									},

									get is_first() {
										return get$1(gap).is_first;
									},

									get is_last() {
										return get$1(gap).is_last;
									}
								});
							});

							append($$anchor, fragment_2);
						};

						if_block(node_3, ($$render) => {
							if (get$1(NodeGapTools)) $$render(consequent);
						});
					}

					append($$anchor, fragment_1);
				};

				if_block(node_1, ($$render) => {
					if (get$1(gap).key === get$1(caret_gap_key)) $$render(consequent_1);
				});
			}

			template_effect(() => {
				classes = set_class(div, 1, `gap-marker ${get$1(gap).type ?? ''}`, 'svelte-fcy96a', classes, {
					active: get$1(gap).key === get$1(caret_gap_key),
					first: get$1(gap).is_first,
					last: get$1(gap).is_last,
					pair: get$1(gap).has_pair
				});

				set_style(div, `${get$1(gap).vars};anchor-name:--gm-${get$1(gap).key}`);
				set_attribute(div, 'data-gap-array-path', get$1(path_str));
				set_attribute(div, 'data-gap-offset', get$1(gap).offset);
			});

			append($$anchor, div);
		});

		append($$anchor, fragment);
		pop();
	}

	var rest_excludes = new Set([
		'$$slots',
		'$$events',
		'$$legacy',
		'path',
		'tag',
		'class',
		'style'
	]);

	var root$g = from_html(`<!> <!>`, 1);
	var root_1$3 = from_html(`<div class="empty-node-placeholder svelte-1lsqwip" data-type="node"><!></div>`);
	var root_2$2 = from_html(`<!> <!> <!> <!>`, 1);

	const $$css$4 = {
		hash: 'svelte-1lsqwip',
		code: '\n	/* position: relative makes this the containing block for the gap\'s\n   .svedit-selectable, which fills it via inset:0. You may override to\n   position: absolute (e.g. so an empty array doesn\'t occupy flow space)\n   — still a containing block; then also set position: relative on the\n   parent node-array container so this placeholder\'s inset:0 resolves\n   against it. */:where(.empty-node-placeholder.svelte-1lsqwip) {position:relative;inset:0;min-height:40px;min-width:24px;cursor:pointer;}'
	};

	function NodeArrayProperty($$anchor, $$props) {
		push($$props, true);
		append_styles$1($$anchor, $$css$4);

		const svedit = getContext('svedit');
		let NodeGap$1 = user_derived(() => svedit.session.config.system_components?.node_gap ?? NodeGap);
		let NodeGapMarkers$1 = user_derived(() => svedit.session.config.system_components?.node_gap_markers ?? NodeGapMarkers);

		let tag = prop($$props, 'tag', 3, 'div'),
			style = prop($$props, 'style', 3, ''),
			rest = rest_props($$props, rest_excludes);

		// Pre-joined once per path change; reused by data-path and by every
		// NodeGap's should_position_gap call to avoid N+1 joins per render.
		let path_str = user_derived(() => serialize_path($$props.path));

		let raw_value = user_derived(() => svedit.session.get($$props.path));
		let node_ids = user_derived(() => get$1(raw_value).nodes);
		let marks = user_derived(() => get$1(raw_value).marks);
		let annotations = user_derived(() => get$1(raw_value).annotations);
		let fragments = user_derived(() => get_fragments(get$1(node_ids), get$1(marks)));

		function get_fragments(node_ids, marks) {
			const ranges = calculate_fragment_ranges(node_ids.length, marks);
			const fragments = [];

			for (const range of ranges) {
				const nodes_slice = node_ids.slice(range.start_offset, range.end_offset);

				if (range.type === 'mark') {
					const node = svedit.session.get(range.node_id);

					fragments.push({
						type: 'mark',
						node,
						nodes: nodes_slice,
						start_index: range.start_offset,
						mark_index: range.mark_index
					});
				} else if (range.type === 'content') {
					fragments.push({
						type: 'nodes',
						nodes: nodes_slice,
						start_index: range.start_offset
					});
				}
			}

			return fragments;
		}

		function get_node_key(node_id, index) {
			let occurrence = 0;

			for (let current_index = 0; current_index < index; current_index++) {
				if (get$1(node_ids)[current_index] === node_id) occurrence += 1;
			}

			return `${node_id}:${occurrence}`;
		}

		function get_range_context(range, index, node_index) {
			const node = svedit.session.get(range.node_id);
			const is_start = node_index === range.start_offset;
			const is_end = node_index === range.end_offset - 1;

			return {
				...range,
				index,
				node,
				is_start,
				is_middle: !is_start && !is_end,
				is_end
			};
		}

		function get_covering_ranges(ranges, node_index) {
			return ranges.map((range, index) => ({ range, index })).filter(({ range }) => range.start_offset <= node_index && node_index < range.end_offset).map(({ range, index }) => get_range_context(range, index, node_index));
		}

		function get_annotation_contexts(node_index) {
			return get_covering_ranges(get$1(annotations), node_index);
		}

		function get_mark(node_index) {
			// The single mark wrapping this node, or null. Mark exclusivity
			// guarantees at most one. Annotations never wrap and are exposed via
			// `annotations` instead.
			return get_covering_ranges(get$1(marks), node_index)[0] ?? null;
		}

		// Mirrors the TextProperty pattern: a `focused` class follows
		// the model selection. Used by the CSS rule below to hide the empty-array
		// NodeGap while the caret is in the placeholder, so its <br> isn't a
		// second arrow-key stop (issue #260).
		let is_focused = user_derived(() => svedit.session.selection?.type === 'node' && serialize_path(svedit.session.selection.path) === get$1(path_str));

		setContext('node_array_meta', {
			get length() {
				return get$1(node_ids).length;
			},

			// Lets Node self-serve the marks and annotations covering a child, so
			// node wrappers can carry range classes without every node component
			// having to thread the `mark`/`annotations` props through.
			mark_for(node_index) {
				return get_mark(node_index);
			},

			annotations_for(node_index) {
				return get_annotation_contexts(node_index);
			}
		});

		var fragment_1 = comment();
		var node_1 = first_child(fragment_1);

		element$1(node_1, tag, false, ($$element, $$anchor) => {
			attach($$element, () => svedit.visibility_registry.track_array(get$1(path_str)));

			attribute_effect(
				$$element,
				() => ({
					class: $$props.class,
					'data-type': 'node_array',
					'data-path': get$1(path_str),
					style: `anchor-name: --${get$1(path_str) ?? ''};${style() ? ` ${style()}` : ''}`,
					...rest,
					[CLASS]: { focused: get$1(is_focused) }
				}),
				void 0,
				void 0,
				void 0,
				'svelte-1lsqwip'
			);

			const render_nodes = ($$anchor, nodes_slice = noop, start_index = noop) => {
				var fragment_2 = comment();
				var node_2 = first_child(fragment_2);

				each(node_2, 19, nodes_slice, (id, slice_index) => get_node_key(id, start_index() + slice_index), ($$anchor, id, slice_index, $$array) => {
					const index = user_derived(() => start_index() + get$1(slice_index));
					const node = user_derived(() => svedit.session.get(get$1(id)));
					const mark = user_derived(() => get_mark(get$1(index)));
					const annotations = user_derived(() => get_annotation_contexts(get$1(index)));
					const Component = user_derived(() => svedit.session.config.node_components[get$1(node).type]);
					var fragment_3 = root$g();
					var node_3 = first_child(fragment_3);

					component(node_3, () => get$1(NodeGap$1), ($$anchor, NodeGap_1) => {
						NodeGap_1($$anchor, {
							get array_path() {
								return $$props.path;
							},

							get offset() {
								return get$1(index);
							},

							get count() {
								return get$1(node_ids).length;
							}
						});
					});

					var node_4 = sibling(node_3, 2);

					{
						var consequent = ($$anchor) => {
							var fragment_4 = comment();
							var node_5 = first_child(fragment_4);

							{
								let $0 = user_derived(() => [...$$props.path, get$1(index)]);

								component(node_5, () => get$1(Component), ($$anchor, Component_1) => {
									Component_1($$anchor, {
										get path() {
											return get$1($0);
										},

										get mark() {
											return get$1(mark);
										},

										get annotations() {
											return get$1(annotations);
										}
									});
								});
							}

							append($$anchor, fragment_4);
						};

						var alternate = ($$anchor) => {
							{
								let $0 = user_derived(() => [...$$props.path, get$1(index)]);

								UnknownNode($$anchor, {
									get path() {
										return get$1($0);
									}
								});
							}
						};

						if_block(node_4, ($$render) => {
							if (get$1(Component)) $$render(consequent); else $$render(alternate, -1);
						});
					}

					append($$anchor, fragment_3);
				});

				append($$anchor, fragment_2);
			};

			var fragment_6 = root_2$2();
			var node_6 = first_child(fragment_6);

			{
				var consequent_1 = ($$anchor) => {
					var div = root_1$3();
					var node_7 = child(div);

					component(node_7, () => get$1(NodeGap$1), ($$anchor, NodeGap_2) => {
						NodeGap_2($$anchor, {
							get array_path() {
								return $$props.path;
							},
							offset: 0,
							count: 0,
							empty: true
						});
					});
					attach(div, () => svedit.visibility_registry.track_node(serialize_path([...$$props.path, 0])));

					template_effect(
						($0, $1) => {
							set_attribute(div, 'data-path', $0);
							set_style(div, `anchor-name: --${$1 ?? ''};`);
						},
						[
							() => serialize_path([...$$props.path, 0]),
							() => serialize_path([...$$props.path, 0])
						]
					);

					append($$anchor, div);
				};

				if_block(node_6, ($$render) => {
					if (get$1(node_ids).length === 0 && svedit.editable) $$render(consequent_1);
				});
			}

			var node_8 = sibling(node_6, 2);

			each(node_8, 17, () => get$1(fragments), index, ($$anchor, fragment) => {
				var fragment_7 = comment();
				var node_9 = first_child(fragment_7);

				{
					var consequent_2 = ($$anchor) => {
						render_nodes($$anchor, () => get$1(fragment).nodes, () => get$1(fragment).start_index);
					};

					var consequent_4 = ($$anchor) => {
						const MarkComponent = user_derived(() => svedit.session.config.node_components[get$1(fragment).node.type]);
						var fragment_9 = comment();
						var node_10 = first_child(fragment_9);

						{
							var consequent_3 = ($$anchor) => {
								var fragment_10 = comment();
								var node_11 = first_child(fragment_10);

								{
									let $0 = user_derived(() => [
										...$$props.path,
										'marks',
										get$1(fragment).mark_index,
										'node_id'
									]);

									component(node_11, () => get$1(MarkComponent), ($$anchor, MarkComponent_1) => {
										MarkComponent_1($$anchor, {
											get path() {
												return get$1($0);
											},

											children: ($$anchor, $$slotProps) => {
												render_nodes($$anchor, () => get$1(fragment).nodes, () => get$1(fragment).start_index);
											},
											$$slots: { default: true }
										});
									});
								}

								append($$anchor, fragment_10);
							};

							var alternate_1 = ($$anchor) => {
								render_nodes($$anchor, () => get$1(fragment).nodes, () => get$1(fragment).start_index);
							};

							if_block(node_10, ($$render) => {
								if (get$1(MarkComponent)) $$render(consequent_3); else $$render(alternate_1, -1);
							});
						}

						append($$anchor, fragment_9);
					};

					if_block(node_9, ($$render) => {
						if (get$1(fragment).type === 'nodes') $$render(consequent_2); else if (get$1(fragment).type === 'mark') $$render(consequent_4, 1);
					});
				}

				append($$anchor, fragment_7);
			});

			var node_12 = sibling(node_8, 2);

			{
				var consequent_5 = ($$anchor) => {
					var fragment_13 = comment();
					var node_13 = first_child(fragment_13);

					component(node_13, () => get$1(NodeGap$1), ($$anchor, NodeGap_3) => {
						NodeGap_3($$anchor, {
							get array_path() {
								return $$props.path;
							},

							get offset() {
								return get$1(node_ids).length;
							},

							get count() {
								return get$1(node_ids).length;
							}
						});
					});

					append($$anchor, fragment_13);
				};

				if_block(node_12, ($$render) => {
					if (get$1(node_ids).length > 0) $$render(consequent_5);
				});
			}

			var node_14 = sibling(node_12, 2);

			{
				var consequent_6 = ($$anchor) => {
					var fragment_14 = comment();
					var node_15 = first_child(fragment_14);

					component(node_15, () => get$1(NodeGapMarkers$1), ($$anchor, NodeGapMarkers_1) => {
						NodeGapMarkers_1($$anchor, {
							get path() {
								return $$props.path;
							},

							get count() {
								return get$1(node_ids).length;
							}
						});
					});

					append($$anchor, fragment_14);
				};

				if_block(node_14, ($$render) => {
					if (svedit.editable && get$1(NodeGapMarkers$1)) $$render(consequent_6);
				});
			}

			append($$anchor, fragment_6);
		});

		append($$anchor, fragment_1);
		pop();
	}

	function define_document_schema(schema) {
	    return schema;
	}
	function is_primitive_type(type) {
	    return [
	        'string',
	        'number',
	        'boolean',
	        'integer',
	        'datetime',
	        'text',
	        'string_array',
	        'number_array',
	        'boolean_array',
	        'integer_array'
	    ].includes(type);
	}
	function get_default_node_type(property_definition) {
	    if (!property_definition || !property_definition.node_types) {
	        return null;
	    }
	    return (property_definition.default_node_type ||
	        (property_definition.node_types.length === 1 ? property_definition.node_types[0] : null));
	}
	function get_property_default(property_definition) {
	    if ('default' in property_definition)
	        return structuredClone(property_definition.default);
	    if (property_definition.type === 'string')
	        return '';
	    if (property_definition.type === 'integer')
	        return 0;
	    if (property_definition.type === 'number')
	        return 0;
	    if (property_definition.type === 'boolean')
	        return false;
	    if (property_definition.type === 'text')
	        return { content: '', marks: [], annotations: [] };
	    if (property_definition.type === 'node_array')
	        return { nodes: [], marks: [], annotations: [] };
	    if (property_definition.type === 'string_array' ||
	        property_definition.type === 'number_array' ||
	        property_definition.type === 'boolean_array' ||
	        property_definition.type === 'integer_array') {
	        return [];
	    }
	    return undefined;
	}
	function fill_node_defaults(node, schema) {
	    const node_schema = schema[node.type];
	    if (!node_schema)
	        return { ...node };
	    const node_with_defaults = { ...node };
	    for (const [property_name, property_definition] of Object.entries(node_schema.properties)) {
	        if (node_with_defaults[property_name] === undefined) {
	            const property_default = get_property_default(property_definition);
	            if (property_default !== undefined)
	                node_with_defaults[property_name] = property_default;
	        }
	    }
	    return node_with_defaults;
	}
	function fill_document_defaults(doc, schema) {
	    const nodes = {};
	    for (const [node_id, node] of Object.entries(doc.nodes)) {
	        nodes[node_id] = fill_node_defaults(node, schema);
	    }
	    return {
	        ...doc,
	        nodes
	    };
	}
	function validate_document_schema(document_schema) {
	    for (const [node_type, node_schema] of Object.entries(document_schema)) {
	        for (const [prop_name, prop_def] of Object.entries(node_schema.properties)) {
	            assert_path_string_segment(prop_name, `Property name "${prop_name}"`);
	            if (prop_def.type === 'string' && prop_def.values !== undefined) {
	                if (!Array.isArray(prop_def.values) ||
	                    prop_def.values.some((value) => typeof value !== 'string')) {
	                    throw new Error(`Node type "${node_type}" property "${prop_name}" values must be an array of strings.`);
	                }
	                if (prop_def.values.length === 0) {
	                    throw new Error(`Node type "${node_type}" property "${prop_name}" values must not be empty.`);
	                }
	                if (new Set(prop_def.values).size !== prop_def.values.length) {
	                    throw new Error(`Node type "${node_type}" property "${prop_name}" values must be unique.`);
	                }
	                if (prop_def.default !== undefined && !prop_def.values.includes(prop_def.default)) {
	                    throw new Error(`Node type "${node_type}" property "${prop_name}" default must be one of its allowed values.`);
	                }
	            }
	            if (prop_def.type === 'integer') {
	                if (prop_def.default !== undefined && !Number.isInteger(prop_def.default)) {
	                    throw new Error(`Node type "${node_type}" property "${prop_name}" default must be an integer.`);
	                }
	                if (prop_def.min !== undefined && !Number.isInteger(prop_def.min)) {
	                    throw new Error(`Node type "${node_type}" property "${prop_name}" min must be an integer.`);
	                }
	                if (prop_def.max !== undefined && !Number.isInteger(prop_def.max)) {
	                    throw new Error(`Node type "${node_type}" property "${prop_name}" max must be an integer.`);
	                }
	                if (prop_def.min !== undefined &&
	                    prop_def.max !== undefined &&
	                    prop_def.min > prop_def.max) {
	                    throw new Error(`Node type "${node_type}" property "${prop_name}" min must not be greater than max.`);
	                }
	                if (prop_def.default !== undefined &&
	                    ((prop_def.min !== undefined && prop_def.default < prop_def.min) ||
	                        (prop_def.max !== undefined && prop_def.default > prop_def.max))) {
	                    throw new Error(`Node type "${node_type}" property "${prop_name}" default must be within its min/max range.`);
	                }
	            }
	            if (prop_def.type === 'node' || prop_def.type === 'node_array') {
	                const missing_types = prop_def.node_types.filter((ref_type) => !(ref_type in document_schema));
	                if (missing_types.length > 0) {
	                    throw new Error(`Node type "${node_type}" property "${prop_name}" references unknown node types: ${missing_types.join(', ')}. Available node types: ${Object.keys(document_schema).join(', ')}`);
	                }
	            }
	            if (prop_def.type === 'text' || prop_def.type === 'node_array') {
	                for (const [key, expected_kind] of [
	                    ['mark_types', 'mark'],
	                    ['annotation_types', 'annotation']
	                ]) {
	                    const invalid_types = (prop_def[key] ?? []).filter((ref_type) => document_schema[ref_type]?.kind !== expected_kind);
	                    if (invalid_types.length > 0) {
	                        throw new Error(`Node type "${node_type}" property "${prop_name}" ${key} must reference node types of kind '${expected_kind}', got: ${invalid_types.join(', ')}.`);
	                    }
	                }
	            }
	        }
	    }
	}
	function validate_config_components(schema, config) {
	    for (const [node_type, node_schema] of Object.entries(schema)) {
	        if (node_schema.kind === 'annotation' && config?.node_components?.[node_type]) {
	            throw new Error(`Annotation type "${node_type}" must not have a registered component. Annotations are data-only; use kind 'mark' for in-place rendered ranges.`);
	        }
	    }
	}
	function validate_primitive_value(type, value) {
	    switch (type) {
	        case 'string':
	            return typeof value === 'string';
	        case 'number':
	            return typeof value === 'number' && !isNaN(value);
	        case 'boolean':
	            return typeof value === 'boolean';
	        case 'integer':
	            return Number.isInteger(value);
	        case 'datetime':
	            return typeof value === 'string' && !isNaN(Date.parse(value));
	        case 'text':
	            return (typeof value === 'object' &&
	                value !== null &&
	                typeof value.content === 'string' &&
	                Array.isArray(value.marks) &&
	                Array.isArray(value.annotations));
	        case 'string_array':
	            return Array.isArray(value) && value.every((v) => typeof v === 'string');
	        case 'number_array':
	            return Array.isArray(value) && value.every((v) => typeof v === 'number' && !isNaN(v));
	        case 'boolean_array':
	            return Array.isArray(value) && value.every((v) => typeof v === 'boolean');
	        case 'integer_array':
	            return Array.isArray(value) && value.every((v) => Number.isInteger(v));
	        default:
	            return false;
	    }
	}
	function validate_range_array(node_id, prop_name, label, ranges, container_length, allowed_types, all_nodes, require_references) {
	    for (const [index, range] of ranges.entries()) {
	        if (typeof range !== 'object' ||
	            range === null ||
	            !Number.isInteger(range.start_offset) ||
	            !Number.isInteger(range.end_offset) ||
	            !is_id_valid(range.node_id)) {
	            throw new Error(`Node ${node_id} property ${prop_name} has an invalid ${label} at index ${index}. Ranges must have integer start_offset/end_offset and a valid node_id.`);
	        }
	        if (range.start_offset < 0 || range.end_offset > container_length) {
	            throw new Error(`Node ${node_id} property ${prop_name} ${label} ${range.node_id} is out of bounds: ${range.start_offset}-${range.end_offset}, container length is ${container_length}.`);
	        }
	        if (range.start_offset >= range.end_offset) {
	            throw new Error(`Node ${node_id} property ${prop_name} ${label} ${range.node_id} must not be empty or reversed: ${range.start_offset}-${range.end_offset}.`);
	        }
	        const referenced_node = all_nodes[range.node_id];
	        if (!referenced_node) {
	            if (require_references) {
	                throw new Error(`Node ${node_id} property ${prop_name} ${label} references missing node ${range.node_id}.`);
	            }
	            continue;
	        }
	        if (allowed_types?.length && !allowed_types.includes(referenced_node.type)) {
	            throw new Error(`Node ${node_id} property ${prop_name} ${label} references node ${range.node_id} of type ${referenced_node.type}, but only types [${allowed_types.join(', ')}] are allowed.`);
	        }
	    }
	}
	function validate_marks_and_annotations(node_id, prop_name, value, prop_def, container_length, all_nodes, require_references) {
	    validate_range_array(node_id, prop_name, 'mark', value.marks, container_length, prop_def.mark_types, all_nodes, require_references);
	    if (!are_ranges_exclusive(value.marks, container_length)) {
	        throw new Error(`Node ${node_id} property ${prop_name} has overlapping marks. Marks must be mutually exclusive.`);
	    }
	    validate_range_array(node_id, prop_name, 'annotation', value.annotations, container_length, prop_def.annotation_types, all_nodes, require_references);
	}
	function validate_text_property(node_id, prop_name, value, prop_def, all_nodes, require_references) {
	    const char_length = get_char_length(value.content);
	    validate_marks_and_annotations(node_id, prop_name, value, prop_def, char_length, all_nodes, require_references);
	}
	function is_id_valid(id) {
	    return typeof id === 'string' && id.length > 0 && is_path_string_segment_valid(id);
	}
	function validate_node(node, schema, all_nodes = {}, options = {}) {
	    const require_references = options.require_references ?? true;
	    if (!is_id_valid(node.id)) {
	        throw new Error(`Node ${node.id} has an invalid id.`);
	    }
	    if (!node.type || !schema[node.type]) {
	        throw new Error(`Node ${node.id} has an invalid type: ${node.type}`);
	    }
	    const node_schema = schema[node.type];
	    for (const [prop_name, prop_def] of Object.entries(node_schema.properties)) {
	        const value = node[prop_name];
	        if (is_primitive_type(prop_def.type)) {
	            if (!validate_primitive_value(prop_def.type, value)) {
	                throw new Error(`Node ${node.id} has an invalid property: ${prop_name} must be of type ${prop_def.type}.`);
	            }
	            if (prop_def.type === 'string' && prop_def.values && !prop_def.values.includes(value)) {
	                throw new Error(`Node ${node.id} has an invalid property: ${prop_name} must be one of [${prop_def.values.join(', ')}].`);
	            }
	            if (prop_def.type === 'integer' &&
	                ((prop_def.min !== undefined && value < prop_def.min) ||
	                    (prop_def.max !== undefined && value > prop_def.max))) {
	                throw new Error(`Node ${node.id} has an invalid property: ${prop_name} must be between ${prop_def.min ?? '-Infinity'} and ${prop_def.max ?? 'Infinity'}.`);
	            }
	        }
	        if (prop_def.type === 'text') {
	            validate_text_property(node.id, prop_name, value, prop_def, all_nodes, require_references);
	        }
	        if (prop_def.type === 'node') {
	            if (!is_id_valid(value)) {
	                throw new Error(`Node ${node.id} has an invalid property: ${prop_name} must be a valid node id.`);
	            }
	            const referenced_node = all_nodes[value];
	            if (!referenced_node) {
	                if (require_references) {
	                    throw new Error(`Node ${node.id} property ${prop_name} references missing node ${value}.`);
	                }
	                continue;
	            }
	            if (!prop_def.node_types.includes(referenced_node.type)) {
	                throw new Error(`Node ${node.id} property ${prop_name} references node ${value} of type ${referenced_node.type}, but only types [${prop_def.node_types.join(', ')}] are allowed.`);
	            }
	        }
	        else if (prop_def.type === 'node_array') {
	            if (!value ||
	                typeof value !== 'object' ||
	                !Array.isArray(value.nodes) ||
	                !Array.isArray(value.marks) ||
	                !Array.isArray(value.annotations)) {
	                throw new Error(`Node ${node.id} has an invalid property: ${prop_name} must be an object with nodes, marks and annotations.`);
	            }
	            const node_array_nodes = value.nodes;
	            if (!node_array_nodes.every((id) => typeof id === 'string' && is_id_valid(id))) {
	                throw new Error(`Node ${node.id} has an invalid property: ${prop_name} must contain valid node ids.`);
	            }
	            for (const ref_id of node_array_nodes) {
	                const referenced_node = all_nodes[ref_id];
	                if (!referenced_node) {
	                    if (require_references) {
	                        throw new Error(`Node ${node.id} property ${prop_name} references missing node ${ref_id}.`);
	                    }
	                    continue;
	                }
	                if (!prop_def.node_types.includes(referenced_node.type)) {
	                    throw new Error(`Node ${node.id} property ${prop_name} references node ${ref_id} of type ${referenced_node.type}, but only types [${prop_def.node_types.join(', ')}] are allowed.`);
	                }
	            }
	            validate_marks_and_annotations(node.id, prop_name, value, prop_def, node_array_nodes.length, all_nodes, require_references);
	        }
	    }
	}
	function validate_document(doc, schema) {
	    if (!is_id_valid(doc.document_id)) {
	        throw new Error(`Document ${doc.document_id} has an invalid id.`);
	    }
	    for (const [node_id, node] of Object.entries(doc.nodes)) {
	        if (!is_id_valid(node_id)) {
	            throw new Error(`Document node map contains an invalid id: ${node_id}.`);
	        }
	        if (node.id !== node_id) {
	            throw new Error(`Document node map key ${node_id} does not match node id ${node.id}.`);
	        }
	        validate_node(node, schema, doc.nodes);
	    }
	}
	function get(schema, doc, path) {
	    if (typeof path === 'string') {
	        path = [path];
	    }
	    if (!(Array.isArray(path) && path.length >= 1)) {
	        throw new Error(`Invalid path provided ${JSON.stringify(path)}`);
	    }
	    let val = doc.nodes[path[0]];
	    let val_type = 'node';
	    for (let i = 1; i < path.length; i++) {
	        const path_segment = path[i];
	        const path_segment_str = String(path_segment);
	        if (val_type === 'node') {
	            if (property_type(schema, val.type, path_segment_str) === 'node_array') {
	                val = val[path_segment];
	                val_type = 'node_array';
	            }
	            else if (property_type(schema, val.type, path_segment_str) === 'text') {
	                val = val[path_segment];
	                val_type = 'text';
	            }
	            else if (property_type(schema, val.type, path_segment_str) === 'node') {
	                val = doc.nodes[val[path_segment]];
	                val_type = 'node';
	            }
	            else if (['string_array', 'integer_array'].includes(property_type(schema, val.type, path_segment_str))) {
	                val = val[path_segment];
	                val_type = 'value_array';
	            }
	            else {
	                val = val[path_segment];
	                val_type = 'value';
	            }
	        }
	        else if (val_type === 'node_array') {
	            if (path_segment === 'nodes') {
	                val = val.nodes;
	                val_type = 'node_id_array';
	            }
	            else if (path_segment === 'marks') {
	                val = val.marks;
	                val_type = 'range_array';
	            }
	            else if (path_segment === 'annotations') {
	                val = val.annotations;
	                val_type = 'range_array';
	            }
	            else if (typeof path_segment === 'number' || /^\d+$/.test(String(path_segment))) {
	                val = doc.nodes[val.nodes[path_segment]];
	                val_type = 'node';
	            }
	            else {
	                throw new Error(`Invalid path segment "${path_segment}" for node_array. Use "nodes", "marks" or "annotations".`);
	            }
	        }
	        else if (val_type === 'node_id_array') {
	            val = doc.nodes[val[path_segment]];
	            val_type = 'node';
	        }
	        else if (val_type === 'value_array') {
	            val = val[path_segment];
	            val_type = 'value';
	        }
	        else if (val_type === 'text') {
	            if (path_segment === 'content') {
	                val = val.content;
	                val_type = 'value';
	            }
	            else if (path_segment === 'marks') {
	                val = val.marks;
	                val_type = 'range_array';
	            }
	            else if (path_segment === 'annotations') {
	                val = val.annotations;
	                val_type = 'range_array';
	            }
	            else {
	                throw new Error(`Invalid path segment "${path_segment}" for text. Use "content", "marks" or "annotations".`);
	            }
	        }
	        else if (val_type === 'range_array') {
	            val = val[path_segment];
	            val_type = 'range';
	        }
	        else if (val_type === 'range') {
	            if (path_segment === 'node_id') {
	                val = doc.nodes[val.node_id];
	                val_type = 'node';
	            }
	            else if (path_segment === 'start_offset') {
	                val = val.start_offset;
	                val_type = 'value';
	            }
	            else if (path_segment === 'end_offset') {
	                val = val.end_offset;
	                val_type = 'value';
	            }
	            else {
	                throw new Error(`Invalid path segment "${path_segment}" for range. Use "start_offset", "end_offset", or "node_id".`);
	            }
	        }
	    }
	    return val;
	}
	function property_type(schema, type, property) {
	    if (typeof type !== 'string')
	        throw new Error(`Invalid type ${type} provided`);
	    if (typeof property !== 'string')
	        throw new Error(`Invalid property ${property} provided`);
	    if (property === 'type')
	        return 'string';
	    if (property === 'id')
	        return 'string';
	    if (!schema[type])
	        throw new Error(`Type ${type} not found in schema`);
	    if (!schema[type].properties[property])
	        throw new Error(`Property ${property} not found in type ${type}`);
	    return schema[type].properties[property].type;
	}
	function kind(schema, node) {
	    return schema[node.type].kind;
	}
	function inspect(schema, doc, path) {
	    const parent = path.length > 1 ? get(schema, doc, path.slice(0, -1)) : undefined;
	    if (parent?.type) {
	        const property_name = path.at(-1);
	        return {
	            kind: 'property',
	            name: property_name,
	            ...schema[parent.type].properties[property_name]
	        };
	    }
	    else {
	        const node = get(schema, doc, path);
	        return {
	            kind: 'node',
	            id: node.id,
	            type: node.type,
	            properties: schema[node.type]
	        };
	    }
	}
	function create_document_draft(doc) {
	    return {
	        ...doc,
	        nodes: { ...doc.nodes }
	    };
	}
	function apply_op_to_draft(draft, op) {
	    const [type, ...args] = op;
	    if (type === 'set') {
	        const [node_id, property] = args[0];
	        draft.nodes[node_id] = {
	            ...draft.nodes[node_id],
	            [property]: structuredClone(args[1])
	        };
	    }
	    else if (type === 'create') {
	        draft.nodes[args[0].id] = structuredClone(args[0]);
	    }
	    else if (type === 'delete') {
	        delete draft.nodes[args[0]];
	    }
	    return draft;
	}
	function count_references(schema, doc, node_id) {
	    let count = 0;
	    for (const node of Object.values(doc.nodes)) {
	        for (const [property, value] of Object.entries(node)) {
	            if (property === 'id' || property === 'type')
	                continue;
	            const prop_type = property_type(schema, node.type, property);
	            if (prop_type === 'node_array') {
	                count += value.nodes.filter((id) => id === node_id).length;
	            }
	            else if (prop_type === 'node' && value === node_id) {
	                count += 1;
	            }
	            if ((prop_type === 'text' || prop_type === 'node_array') && value) {
	                count += [...value.marks, ...value.annotations].filter((range) => range.node_id === node_id).length;
	            }
	        }
	    }
	    return count;
	}
	function can_switch_mark_type(schema, from_type, to_type) {
	    const from_schema = schema[from_type];
	    const to_schema = schema[to_type];
	    return (from_schema?.kind === 'mark' &&
	        to_schema?.kind === 'mark' &&
	        Object.keys(from_schema.properties ?? {}).length === 0 &&
	        Object.keys(to_schema.properties ?? {}).length === 0);
	}
	function get_selected_ranges(schema, doc, selection, key) {
	    if (selection?.type !== 'text' && selection?.type !== 'node')
	        return [];
	    const range = get_selection_range(selection);
	    if (!range)
	        return [];
	    const annotated_prop = get(schema, doc, selection.path);
	    const ranges = annotated_prop?.[key] ?? [];
	    const is_collapsed = range.start_offset === range.end_offset;
	    return ranges
	        .map((attachment, index) => {
	        const node = doc.nodes[attachment.node_id];
	        return {
	            ...attachment,
	            index,
	            node
	        };
	    })
	        .filter(({ start_offset, end_offset }) => {
	        if (is_collapsed) {
	            return start_offset < range.start_offset && end_offset > range.start_offset;
	        }
	        return start_offset < range.end_offset && end_offset > range.start_offset;
	    });
	}
	function get_selected_marks(schema, doc, selection) {
	    return get_selected_ranges(schema, doc, selection, 'marks');
	}
	function get_selected_annotations(schema, doc, selection) {
	    return get_selected_ranges(schema, doc, selection, 'annotations');
	}
	function get_selected_range_types(selected_ranges) {
	    return new Set(selected_ranges.map(({ node }) => node?.type).filter((type) => Boolean(type)));
	}
	function visit_node_references(schema, node, visit) {
	    const node_schema = schema[node.type];
	    if (!node_schema)
	        return;
	    for (const [property, prop_def] of Object.entries(node_schema.properties)) {
	        const value = node[property];
	        if (value === undefined || value === null)
	            continue;
	        const prop_type = prop_def.type;
	        if (prop_type === 'node_array') {
	            for (const id of value.nodes)
	                visit(id);
	        }
	        else if (prop_type === 'node' && typeof value === 'string') {
	            visit(value);
	        }
	        if ((prop_type === 'text' || prop_type === 'node_array') && value) {
	            for (const range of value.marks)
	                visit(range.node_id);
	            for (const range of value.annotations)
	                visit(range.node_id);
	        }
	    }
	}
	function build_reference_counts(schema, doc) {
	    const counts = new Map();
	    for (const node of Object.values(doc.nodes)) {
	        visit_node_references(schema, node, (id) => {
	            counts.set(id, (counts.get(id) || 0) + 1);
	        });
	    }
	    return counts;
	}
	function get_referencing_node_ids(schema, doc, target_node_ids) {
	    const target_ids = new Set(target_node_ids);
	    const referencing_node_ids = new Set();
	    if (target_ids.size === 0)
	        return [];
	    for (const node of Object.values(doc.nodes)) {
	        for (const [property, value] of Object.entries(node)) {
	            if (property === 'id' || property === 'type')
	                continue;
	            const prop_type = property_type(schema, node.type, property);
	            if (prop_type === 'node_array') {
	                if (value.nodes.some((id) => target_ids.has(id))) {
	                    referencing_node_ids.add(node.id);
	                }
	            }
	            else if (prop_type === 'node' && target_ids.has(value)) {
	                referencing_node_ids.add(node.id);
	            }
	            if ((prop_type === 'text' || prop_type === 'node_array') &&
	                value &&
	                [...value.marks, ...value.annotations].some((range) => target_ids.has(range.node_id))) {
	                referencing_node_ids.add(node.id);
	            }
	        }
	    }
	    return [...referencing_node_ids];
	}
	function validate_selection(selection, session_or_transaction) {
	    if (!selection)
	        return;
	    const selection_type = selection.type;
	    if (!['node', 'text', 'property'].includes(selection_type)) {
	        throw new Error(`Invalid selection type: ${selection_type}`);
	    }
	    if (selection_type === 'node') {
	        const node_array_prop = session_or_transaction.get(selection.path);
	        if (!node_array_prop || !Array.isArray(node_array_prop.nodes)) {
	            throw new Error('Node selection path must point to a node_array');
	        }
	        const max_offset = node_array_prop.nodes.length;
	        if (selection.anchor_offset < 0 || selection.anchor_offset > max_offset) {
	            throw new Error(`Node selection anchor_offset (${selection.anchor_offset}) is out of bounds. Max is ${max_offset}.`);
	        }
	        if (selection.focus_offset < 0 || selection.focus_offset > max_offset) {
	            throw new Error(`Node selection focus_offset (${selection.focus_offset}) is out of bounds. Max is ${max_offset}.`);
	        }
	    }
	    else if (selection_type === 'text') {
	        const text = session_or_transaction.get(selection.path);
	        if (!text || typeof text.content !== 'string') {
	            throw new Error('Text selection path must point to text');
	        }
	        const char_length = get_char_length(text.content);
	        if (selection.anchor_offset < 0 || selection.anchor_offset > char_length) {
	            throw new Error(`Text selection anchor_offset (${selection.anchor_offset}) is out of bounds. Max is ${char_length}.`);
	        }
	        if (selection.focus_offset < 0 || selection.focus_offset > char_length) {
	            throw new Error(`Text selection focus_offset (${selection.focus_offset}) is out of bounds. Max is ${char_length}.`);
	        }
	    }
	    else if (selection_type === 'property') {
	        if (!session_or_transaction.inspect(selection.path)) {
	            throw new Error(`Property selection path not found: ${serialize_path(selection.path)}`);
	        }
	    }
	}

	function break_text_node(tr) {
		const selection = tr.selection;
		if (selection.type !== 'text') return false;
		const node = tr.get(selection.path.slice(0, -1));
		if (tr.kind(node) !== 'text') return false;
		const is_inside_node_array = tr.inspect(selection.path.slice(0, -2))?.type === 'node_array';
		if (!is_inside_node_array) return false;
		const node_array_prop = String(selection.path.at(-3));
		const node_array_node = tr.get(selection.path.slice(0, -3));
		if (selection.anchor_offset !== selection.focus_offset) {
			tr.delete_selection();
		}
		const split_at_position = tr.selection.anchor_offset;
		const content = tr.get(selection.path);
		const [left_text, right_text] = split_text(content, split_at_position);
		tr.set([node.id, 'content'], left_text);
		const node_insert_position = {
			type: 'node',
			path: tr.selection.path.slice(0, -2),
			anchor_offset: tr.selection.path.at(-2) + 1,
			focus_offset: tr.selection.path.at(-2) + 1
		};
		const node_array_property_definition = tr.schema[node_array_node.type].properties[node_array_prop];
		const target_node_type = get_default_node_type(node_array_property_definition);
		if (!target_node_type) {
			console.warn('Cannot determine target node type for break_text_node - no default_ref_type and multiple node_types');
			return false;
		}
		tr.set_selection(node_insert_position);
		tr.config.inserters[target_node_type](tr, right_text);
		return true;
	}
	function join_text_node(tr) {
		const selection = tr.selection;
		if (selection.type !== 'text') return false;
		const node = tr.get(selection.path.slice(0, -1));
		if (tr.kind(node) !== 'text') return false;
		const is_inside_node_array = tr.inspect(selection.path.slice(0, -2))?.type === 'node_array';
		if (!is_inside_node_array) return false;
		const node_index = tr.selection.path.at(-2);
		let can_join = false;
		let predecessor_node = null;
		if (node_index > 0) {
			const previous_text_path = [...tr.selection.path.slice(0, -2), node_index - 1];
			predecessor_node = tr.get(previous_text_path);
			can_join = predecessor_node !== null && tr.kind(predecessor_node) === 'text';
		}
		if (!can_join && node.content.content === '') {
			tr.set_selection({
				type: 'node',
				path: tr.selection.path.slice(0, -2),
				anchor_offset: node_index,
				focus_offset: node_index + 1
			});
			tr.delete_selection();
			return true;
		}
		if (!can_join || !predecessor_node) {
			return false;
		}
		const previous_text_path = [...tr.selection.path.slice(0, -2), node_index - 1];
		const joined_text = join_text(predecessor_node.content, node.content);
		const caret_position = get_char_length(predecessor_node.content.content);
		tr.set([predecessor_node.id, 'content'], joined_text);
		tr.set_selection({
			type: 'node',
			path: tr.selection.path.slice(0, -2),
			anchor_offset: node_index,
			focus_offset: node_index + 1
		});
		tr.delete_selection();
		tr.set_selection({
			type: 'text',
			path: [...previous_text_path, 'content'],
			anchor_offset: caret_position,
			focus_offset: caret_position
		});
		return true;
	}
	function insert_default_node(tr) {
		const selection = tr.selection;
		if (selection?.type !== 'node' || selection.anchor_offset !== selection.focus_offset) {
			return false;
		}
		const path = selection.path;
		const node_array_node = tr.get(path.slice(0, -1));
		const property_name = String(path.at(-1));
		const property_definition = tr.schema[node_array_node.type].properties[property_name];
		const default_type = get_default_node_type(property_definition);
		if (tr.config?.inserters?.[default_type]) {
			tr.config.inserters[default_type](tr);
			return true;
		} else {
			throw new Error(`No inserter function available for default node type '${default_type}'`);
		}
	}

	function is_range_within_bounds(range, length) {
		return Number.isInteger(range.start_offset) && Number.isInteger(range.end_offset) && range.start_offset >= 0 && range.start_offset < range.end_offset && range.end_offset <= length;
	}
	class Transaction {
		schema;
		doc;
		selection;
		config;
		ops;
		inverse_ops;
		selection_before;
		created_node_ids;
		modified_node_ids;
		deleted_node_ids;
		changed_node_types;
		constructor(schema, doc, selection, config) {
			this.schema = schema;
			this.doc = create_document_draft(doc);
			this.selection = selection;
			this.config = config;
			this.ops = [];
			this.inverse_ops = [];
			this.selection_before = selection;
			this.created_node_ids = [];
			this.modified_node_ids = [];
			this.deleted_node_ids = [];
			this.changed_node_types = false;
		}
		get(path) {
			return get(this.schema, this.doc, path);
		}
		property_type(type, property) {
			return property_type(this.schema, type, property);
		}
		kind(node) {
			return kind(this.schema, node);
		}
		inspect(path) {
			return inspect(this.schema, this.doc, path);
		}
		generate_id() {
			const id = this.config?.generate_id
				? this.config.generate_id()
				: `node_${crypto.randomUUID()}`;
			if (!is_id_valid(id)) {
				throw new Error(`Generated node id ${JSON.stringify(id)} is invalid. Node ids must be non-empty strings that start with a letter or underscore, contain only letters, numbers, underscores, or dashes, and must not contain "__".`);
			}
			return id;
		}
		validate_node(node) {
			validate_node(node, this.schema, this.doc.nodes, { require_references: false });
		}
		get_referenced_nodes(node_id) {
			return traverse_ids(node_id, this.schema, this.doc.nodes).slice(0, -1);
		}
		get available_mark_types() {
			if (this.selection?.type !== 'text' && this.selection?.type !== 'node') return [];
			const property_definition = this.inspect(this.selection.path);
			return property_definition.mark_types || [];
		}
		get available_annotation_types() {
			if (this.selection?.type !== 'text' && this.selection?.type !== 'node') return [];
			const property_definition = this.inspect(this.selection.path);
			return property_definition.annotation_types || [];
		}
		get selected_marks() {
			return get_selected_marks(this.schema, this.doc, this.selection);
		}
		get active_mark() {
			return this.selected_marks.length === 1 ? this.selected_marks[0] : null;
		}
		get selected_annotations() {
			return get_selected_annotations(this.schema, this.doc, this.selection);
		}
		get active_annotation() {
			return this.selected_annotations.length === 1 ? this.selected_annotations[0] : null;
		}
		_apply_op(op) {
			apply_op_to_draft(this.doc, op);
		}
		_track_node_id(node_ids, node_id) {
			if (!node_ids.includes(node_id)) node_ids.push(node_id);
		}
		set(path, value) {
			const path_info = this.inspect(path);
			if (path_info?.kind !== 'property') {
				throw new Error(`Transaction.set requires a path that points to a property, got ${JSON.stringify(path)}`);
			}
			const node = this.get(path.slice(0, -1));
			const normalized_path = [node.id, path.at(-1)];
			const property_key = path.at(-1);
			const property_key_str = String(property_key);
			const previous_value = structuredClone(snapshot(node[property_key_str]));
			const prop_type = this.property_type(node.type, property_key_str);
			let removed_node_ids = [];
			if (prop_type === 'node' && typeof previous_value === 'string' && previous_value !== value) {
				removed_node_ids = [previous_value];
			} else if (prop_type === 'node_array') {
				const previous_node_ids = previous_value.nodes;
				const next_node_ids = new Set(value.nodes);
				removed_node_ids = previous_node_ids.filter((id) => !next_node_ids.has(id));
			}
			const op = ['set', normalized_path, value];
			this.ops.push(op);
			this.inverse_ops.push(['set', normalized_path, previous_value]);
			this._apply_op(op);
			this._track_node_id(this.modified_node_ids, node.id);
			if (property_key_str === 'type') this.changed_node_types = true;
			if (removed_node_ids.length > 0) {
				this._cascade_delete_unreferenced_nodes(removed_node_ids);
			}
			return this;
		}
		build(node_id, nodes) {
			const depth_first_nodes = traverse(node_id, this.schema, nodes);
			const id_map = {};
			for (const node of depth_first_nodes) {
				const new_id = this.generate_id();
				id_map[node.id] = new_id;
				let new_node = { ...node, id: new_id };
				const node_schema = this.schema[node.type];
				for (const [property_name, property_definition] of Object.entries(node_schema.properties)) {
					const prop_type = property_definition.type;
					const value = new_node[property_name];
					const remap_ranges = (ranges) => (ranges ?? []).map(({ start_offset, end_offset, node_id }) => {
						return {
							start_offset,
							end_offset,
							node_id: id_map[node_id] || node_id
						};
					});
					if (prop_type === 'node_array' && value && typeof value === 'object') {
						new_node[property_name] = {
							nodes: value.nodes.map((ref_id) => id_map[ref_id]),
							marks: remap_ranges(value.marks),
							annotations: remap_ranges(value.annotations)
						};
					} else if (prop_type === 'node' && typeof value === 'string') {
						new_node[property_name] = id_map[value];
					} else if (prop_type === 'text' && value) {
						new_node[property_name] = {
							content: value.content,
							marks: remap_ranges(value.marks),
							annotations: remap_ranges(value.annotations)
						};
					}
				}
				new_node = fill_node_defaults(new_node, this.schema);
				this.create(new_node);
			}
			return id_map[depth_first_nodes.at(-1).id];
		}
		create(node) {
			const node_with_defaults = fill_node_defaults(node, this.schema);
			this.validate_node(node_with_defaults);
			if (this.get(node_with_defaults.id)) {
				throw new Error('Node with id ' + node_with_defaults.id + ' already exists');
			}
			const op = ['create', node_with_defaults];
			this.ops.push(op);
			this.inverse_ops.push(['delete', node_with_defaults.id]);
			this._apply_op(op);
			this._track_node_id(this.created_node_ids, node_with_defaults.id);
			return this;
		}
		delete(id) {
			const previous_value = this.get(id);
			if (!previous_value) {
				console.warn(`Deletion of node ${id} skipped, as it does not exist.`);
				return this;
			}
			const referenced_nodes = this.get_referenced_nodes(id);
			const op = ['delete', id];
			this.ops.push(op);
			this.inverse_ops.push(['create', previous_value]);
			this._apply_op(op);
			this._track_node_id(this.deleted_node_ids, id);
			this._cascade_delete_unreferenced_nodes(referenced_nodes);
			return this;
		}
		set_selection(selection) {
			this._validate_selection(selection);
			this.selection = selection;
			return this;
		}
		_validate_selection(selection) {
			validate_selection(selection, this);
		}
		toggle_mark(mark_type, mark_properties) {
			if (this.selection.type !== 'text' && this.selection.type !== 'node') return this;
			if (this.selection.type === 'node' && is_selection_collapsed(this.selection)) return this;
			if (!this.available_mark_types.includes(mark_type)) {
				console.warn(`Mark type ${mark_type} is not allowed here.`);
				return this;
			}
			const range = get_selection_range(this.selection);
			if (!range) return this;
			const annotated_value = structuredClone(snapshot(this.get(this.selection.path)));
			const selected_marks = this.selected_marks;
			const selected_mark_types = get_selected_range_types(selected_marks);
			if (selected_mark_types.size > 1) return this;
			if (selected_marks.length === 0) {
				if (is_selection_collapsed(this.selection)) {
					return this;
				}
				const new_mark_node = { id: this.generate_id(), type: mark_type, ...mark_properties };
				this.create(new_mark_node);
				annotated_value.marks.push({
					start_offset: range.start_offset,
					end_offset: range.end_offset,
					node_id: new_mark_node.id
				});
				this.set(this.selection.path, annotated_value);
				return this;
			}
			const first_selected_mark = selected_marks[0];
			const selected_mark_type = first_selected_mark.node.type;
			if (selected_mark_type === mark_type) {
				const selected_indices = new Set(selected_marks.map(({ index }) => index));
				const removed_node_ids = selected_marks.map(({ node_id }) => node_id);
				annotated_value.marks = annotated_value.marks.filter((_, index) => !selected_indices.has(index));
				this.set(this.selection.path, annotated_value);
				this._cascade_delete_unreferenced_nodes(removed_node_ids);
				return this;
			}
			if (selected_marks.length === 1 && can_switch_mark_type(this.schema, selected_mark_type, mark_type)) {
				const selected_mark = first_selected_mark;
				this.set([selected_mark.node_id, 'type'], mark_type);
				this.set_selection({
					type: this.selection.type,
					path: this.selection.path,
					anchor_offset: selected_mark.start_offset,
					focus_offset: selected_mark.end_offset
				});
				return this;
			}
			return this;
		}
		toggle_annotation(annotation_type, annotation_properties) {
			if (this.selection.type !== 'text' && this.selection.type !== 'node') return this;
			if (this.selection.type === 'node' && is_selection_collapsed(this.selection)) return this;
			if (!this.available_annotation_types.includes(annotation_type)) {
				console.warn(`Annotation type ${annotation_type} is not allowed here.`);
				return this;
			}
			const range = get_selection_range(this.selection);
			if (!range) return this;
			const annotated_value = structuredClone(snapshot(this.get(this.selection.path)));
			const selected_annotations = this.selected_annotations.filter(({ node }) => node?.type === annotation_type);
			if (selected_annotations.length === 0) {
				if (is_selection_collapsed(this.selection)) {
					return this;
				}
				const new_annotation_node = {
					id: this.generate_id(),
					type: annotation_type,
					...annotation_properties
				};
				this.create(new_annotation_node);
				annotated_value.annotations.push({
					start_offset: range.start_offset,
					end_offset: range.end_offset,
					node_id: new_annotation_node.id
				});
				this.set(this.selection.path, annotated_value);
				return this;
			}
			const selected_indices = new Set(selected_annotations.map(({ index }) => index));
			const removed_node_ids = selected_annotations.map(({ node_id }) => node_id);
			annotated_value.annotations = annotated_value.annotations.filter((_, index) => !selected_indices.has(index));
			this.set(this.selection.path, annotated_value);
			this._cascade_delete_unreferenced_nodes(removed_node_ids);
			return this;
		}
		delete_selection(direction = 'backward') {
			if (!this.selection) return this;
			if (this.selection.type === 'property') {
				this.config.handle_property_deletion?.(this, this.selection.path);
				return this;
			}
			const path = this.selection.path;
			let start = Math.min(this.selection.anchor_offset, this.selection.focus_offset);
			let end = Math.max(this.selection.anchor_offset, this.selection.focus_offset);
			let length = 0;
			if (this.selection?.type === 'text') {
				const text_content = this.get(this.selection.path).content;
				length = get_char_length(text_content);
			} else if (this.selection?.type === 'node') {
				const node_array = this.get(this.selection.path);
				length = node_array.nodes.length;
			}
			if (start === end) {
				if (direction === 'backward' && start > 0) {
					start = start - 1;
				} else if (direction === 'forward' && end < length) {
					end = end + 1;
				} else if (direction === 'backward' && start === 0) {
					join_text_node(this);
					return this;
				} else if (direction === 'forward' && end === length) {
					const node_index = this.selection.path.at(-2);
					const successor_node = this.get([...this.selection.path.slice(0, -2), node_index + 1]);
					if (successor_node && this.kind(successor_node) === 'text') {
						this.set_selection({
							type: 'text',
							path: [
								...this.selection.path.slice(0, -2),
								node_index + 1,
								'content'
							],
							anchor_offset: 0,
							focus_offset: 0
						});
						join_text_node(this);
					}
					return this;
				}
			}
			if (this.selection.type === 'node') {
				const current_value = structuredClone(snapshot(this.get(path)));
				const node_array = [...current_value.nodes];
				const deletion_length = end - start;
				node_array.splice(start, deletion_length);
				const marks_result = adjust_ranges_for_deletion(current_value.marks, start, end);
				const annotations_result = adjust_ranges_for_deletion(current_value.annotations, start, end);
				this.set(path, {
					nodes: node_array,
					marks: marks_result.ranges,
					annotations: annotations_result.ranges
				});
				this._cascade_delete_unreferenced_nodes([
					...marks_result.removed_node_ids,
					...annotations_result.removed_node_ids
				]);
				this.selection = {
					type: 'node',
					path,
					anchor_offset: start,
					focus_offset: start
				};
			} else if (this.selection.type === 'text') {
				const path = this.selection.path;
				const text = structuredClone(snapshot(this.get(path)));
				const original_text = text.content;
				text.content = char_slice(original_text, 0, start) + char_slice(original_text, end, get_char_length(original_text));
				const marks_result = adjust_ranges_for_deletion(text.marks, start, end);
				const annotations_result = adjust_ranges_for_deletion(text.annotations, start, end);
				text.marks = marks_result.ranges;
				text.annotations = annotations_result.ranges;
				this.set(path, text);
				this._cascade_delete_unreferenced_nodes([
					...marks_result.removed_node_ids,
					...annotations_result.removed_node_ids
				]);
				this.selection = {
					type: 'text',
					path,
					anchor_offset: start,
					focus_offset: start
				};
			}
			return this;
		}
		insert_nodes(node_ids, marks = [], annotations = [], nodes = {}) {
			if (this.selection.type !== 'node') return this;
			if (this.selection.anchor_offset !== this.selection.focus_offset) {
				this.delete_selection();
			}
			const path = this.selection.path;
			const current_value = structuredClone(snapshot(this.get(path)));
			const node_array = [...current_value.nodes];
			const start = Math.min(this.selection.anchor_offset, this.selection.focus_offset);
			let next_marks = adjust_ranges_for_insertion(current_value.marks, start, node_ids.length);
			let next_annotations = adjust_ranges_for_insertion(current_value.annotations, start, node_ids.length);
			node_array.splice(start, 0, ...node_ids);
			this.selection = {
				type: 'node',
				path: [...this.selection.path],
				anchor_offset: start,
				focus_offset: start + node_ids.length
			};
			const property_definition = this.inspect(path);
			if (!this.active_mark && marks.length > 0 && are_ranges_exclusive(marks, node_ids.length)) {
				const restored_marks = marks.map((mark) => {
					const mark_node = nodes[mark.node_id];
					if (!property_definition.mark_types?.includes(mark_node?.type)) return null;
					const new_mark_node_id = this.build(mark.node_id, nodes);
					return {
						start_offset: start + mark.start_offset,
						end_offset: start + mark.end_offset,
						node_id: new_mark_node_id
					};
				}).filter((mark) => mark !== null);
				const combined_marks = next_marks.concat(restored_marks);
				if (are_ranges_exclusive(combined_marks)) {
					next_marks = combined_marks;
				} else {
					for (const mark of restored_marks) {
						this.delete(mark.node_id);
					}
				}
			}
			const restored_annotations = annotations.map((annotation) => {
				if (!is_range_within_bounds(annotation, node_ids.length)) return null;
				const annotation_node = nodes[annotation.node_id];
				if (!property_definition.annotation_types?.includes(annotation_node?.type)) return null;
				const new_annotation_node_id = this.build(annotation.node_id, nodes);
				return {
					start_offset: start + annotation.start_offset,
					end_offset: start + annotation.end_offset,
					node_id: new_annotation_node_id
				};
			}).filter((annotation) => annotation !== null);
			next_annotations = next_annotations.concat(restored_annotations);
			this.set(path, {
				nodes: node_array,
				marks: next_marks,
				annotations: next_annotations
			});
			return this;
		}
		insert_text(replaced_text, marks = [], annotations = [], nodes = {}) {
			if (this.selection?.type !== 'text') return this;
			if (!is_selection_collapsed(this.selection)) {
				this.delete_selection();
			}
			const text_value = structuredClone(snapshot(this.get(this.selection.path)));
			const range = get_selection_range(this.selection);
			const current_text = text_value.content;
			text_value.content = char_slice(current_text, 0, range.start_offset) + replaced_text + char_slice(current_text, range.end_offset);
			const delta = get_char_length(replaced_text);
			text_value.marks = adjust_ranges_for_insertion(text_value.marks, range.start_offset, delta);
			text_value.annotations = adjust_ranges_for_insertion(text_value.annotations, range.start_offset, delta);
			this.set(this.selection.path, text_value);
			const new_selection = {
				type: 'text',
				path: this.selection.path,
				anchor_offset: range.start_offset + get_char_length(replaced_text),
				focus_offset: range.start_offset + get_char_length(replaced_text)
			};
			this.selection = new_selection;
			const text_property_definition = this.inspect(this.selection.path);
			const next_text = structuredClone(text_value);
			let text_changed = false;
			if (!this.active_mark && marks.length > 0 && are_ranges_exclusive(marks, delta)) {
				const restored_marks = marks.map((mark) => {
					const original_mark_node = nodes[mark.node_id];
					if (text_property_definition.mark_types?.includes(original_mark_node?.type)) {
						const new_mark_node_id = this.build(mark.node_id, nodes);
						return {
							start_offset: range.start_offset + mark.start_offset,
							end_offset: range.start_offset + mark.end_offset,
							node_id: new_mark_node_id
						};
					}
					return null;
				}).filter((mark) => mark !== null);
				const combined_marks = text_value.marks.concat(restored_marks);
				if (are_ranges_exclusive(combined_marks)) {
					next_text.marks = combined_marks;
					text_changed = true;
				} else {
					for (const mark of restored_marks) {
						this.delete(mark.node_id);
					}
				}
			}
			if (annotations.length > 0) {
				const restored_annotations = annotations.map((annotation) => {
					if (!is_range_within_bounds(annotation, delta)) return null;
					const original_annotation_node = nodes[annotation.node_id];
					if (text_property_definition.annotation_types?.includes(original_annotation_node?.type)) {
						const new_annotation_node_id = this.build(annotation.node_id, nodes);
						return {
							start_offset: range.start_offset + annotation.start_offset,
							end_offset: range.start_offset + annotation.end_offset,
							node_id: new_annotation_node_id
						};
					}
					return null;
				}).filter((annotation) => annotation !== null);
				if (restored_annotations.length > 0) {
					next_text.annotations = text_value.annotations.concat(restored_annotations);
					text_changed = true;
				}
			}
			if (text_changed) {
				this.set(this.selection.path, next_text);
			}
			return this;
		}
		_cascade_delete_unreferenced_nodes(potentially_orphaned_nodes) {
			if (potentially_orphaned_nodes.length === 0) return;
			const ref_counts = build_reference_counts(this.schema, this.doc);
			const nodes_to_delete = {};
			const to_check = [...potentially_orphaned_nodes];
			while (to_check.length > 0) {
				const node_id = to_check.pop();
				if (!node_id || nodes_to_delete[node_id]) continue;
				if ((ref_counts.get(node_id) || 0) === 0) {
					nodes_to_delete[node_id] = true;
					const node = this.doc.nodes[node_id];
					if (node) {
						visit_node_references(this.schema, node, (referenced_id) => {
							const count = ref_counts.get(referenced_id);
							if (count !== undefined) ref_counts.set(referenced_id, count - 1);
							to_check.push(referenced_id);
						});
					}
				}
			}
			for (const node_id of Object.keys(nodes_to_delete)) {
				const previous_value = this.get([node_id]);
				if (previous_value) {
					const op = ['delete', node_id];
					this.ops.push(op);
					this.inverse_ops.push(['create', previous_value]);
					this._apply_op(op);
					this._track_node_id(this.deleted_node_ids, node_id);
				}
			}
		}
	}

	const BATCH_WINDOW_MS = 1000;
	class Session {
		#selection = state(null);
		#schema = state();
		get schema() {
			return get$1(this.#schema);
		}
		set schema(value) {
			set$1(this.#schema, value);
		}
		#doc = state();
		get doc() {
			return get$1(this.#doc);
		}
		set doc(value) {
			set$1(this.#doc, value);
		}
		#config = state({});
		get config() {
			return get$1(this.#config);
		}
		set config(value) {
			set$1(this.#config, value);
		}
		#history = state([]);
		get history() {
			return get$1(this.#history);
		}
		set history(value) {
			set$1(this.#history, value);
		}
		#history_index = state(-1);
		get history_index() {
			return get$1(this.#history_index);
		}
		set history_index(value) {
			set$1(this.#history_index, value);
		}
		#last_batch_started = state(undefined);
		get last_batch_started() {
			return get$1(this.#last_batch_started);
		}
		set last_batch_started(value) {
			set$1(this.#last_batch_started, value);
		}
		#commands = state({});
		get commands() {
			return get$1(this.#commands);
		}
		set commands(value) {
			set$1(this.#commands, value);
		}
		#keymap = state({});
		get keymap() {
			return get$1(this.#keymap);
		}
		set keymap(value) {
			set$1(this.#keymap, value);
		}
		#can_undo = user_derived(() => this.history_index >= 0);
		get can_undo() {
			return get$1(this.#can_undo);
		}
		set can_undo(value) {
			set$1(this.#can_undo, value);
		}
		#can_redo = user_derived(() => this.history_index < this.history.length - 1);
		get can_redo() {
			return get$1(this.#can_redo);
		}
		set can_redo(value) {
			set$1(this.#can_redo, value);
		}
		#selected_node = user_derived(() => this.get_selected_node());
		get selected_node() {
			return get$1(this.#selected_node);
		}
		set selected_node(value) {
			set$1(this.#selected_node, value);
		}
		#available_mark_types = user_derived(() => this.get_available_mark_types());
		get available_mark_types() {
			return get$1(this.#available_mark_types);
		}
		set available_mark_types(value) {
			set$1(this.#available_mark_types, value);
		}
		#available_annotation_types = user_derived(() => this.get_available_annotation_types());
		get available_annotation_types() {
			return get$1(this.#available_annotation_types);
		}
		set available_annotation_types(value) {
			set$1(this.#available_annotation_types, value);
		}
		#selected_marks = user_derived(() => get_selected_marks(this.schema, this.doc, this.selection));
		get selected_marks() {
			return get$1(this.#selected_marks);
		}
		set selected_marks(value) {
			set$1(this.#selected_marks, value);
		}
		#active_mark = user_derived(() => this.selected_marks.length === 1 ? this.selected_marks[0] : null);
		get active_mark() {
			return get$1(this.#active_mark);
		}
		set active_mark(value) {
			set$1(this.#active_mark, value);
		}
		#selected_annotations = user_derived(() => get_selected_annotations(this.schema, this.doc, this.selection));
		get selected_annotations() {
			return get$1(this.#selected_annotations);
		}
		set selected_annotations(value) {
			set$1(this.#selected_annotations, value);
		}
		#active_annotation = user_derived(() => this.selected_annotations.length === 1 ? this.selected_annotations[0] : null);
		get active_annotation() {
			return get$1(this.#active_annotation);
		}
		set active_annotation(value) {
			set$1(this.#active_annotation, value);
		}
		constructor(schema, doc, config, options = {}) {
			validate_document_schema(schema);
			this.schema = schema;
			this.doc = doc;
			this.config = config;
			validate_document(this.doc, this.schema);
			validate_config_components(this.schema, this.config);
			this.selection = options.selection ?? null;
		}
		get selection() {
			return get$1(this.#selection);
		}
		set selection(value) {
			this._validate_selection(value);
			set$1(this.#selection, value);
		}
		_validate_selection(selection) {
			validate_selection(selection, this);
		}
		get document_id() {
			return this.doc.document_id;
		}
		validate_transaction_result(transaction) {
			const doc = transaction.doc;
			const affected_node_ids = new Set([
				...transaction.created_node_ids,
				...transaction.modified_node_ids
			]);
			if (transaction.deleted_node_ids.length > 0 || transaction.changed_node_types) {
				const scan_targets = new Set([
					...transaction.created_node_ids,
					...transaction.modified_node_ids,
					...transaction.deleted_node_ids
				]);
				for (const node_id of get_referencing_node_ids(this.schema, doc, scan_targets)) {
					affected_node_ids.add(node_id);
				}
			}
			for (const node_id of affected_node_ids) {
				const node = doc.nodes[node_id];
				if (node) validate_node(node, this.schema, doc.nodes);
			}
		}
		generate_id() {
			const id = this.config?.generate_id
				? this.config.generate_id()
				: `node_${crypto.randomUUID()}`;
			if (!is_id_valid(id)) {
				throw new Error(`Generated node id ${JSON.stringify(id)} is invalid. Node ids must be non-empty strings that start with a letter or underscore, contain only letters, numbers, underscores, or dashes, and must not contain "__".`);
			}
			return id;
		}
		initialize_commands(context) {
			if (this.config?.create_commands_and_keymap) {
				const { commands, keymap } = this.config.create_commands_and_keymap(context);
				this.commands = commands;
				this.keymap = keymap;
			}
		}
		get_available_mark_types() {
			if (this.selection?.type !== 'text' && this.selection?.type !== 'node') return [];
			const property_definition = this.inspect(this.selection.path);
			return property_definition.mark_types || [];
		}
		get_available_annotation_types() {
			if (this.selection?.type !== 'text' && this.selection?.type !== 'node') return [];
			const property_definition = this.inspect(this.selection.path);
			return property_definition.annotation_types || [];
		}
		get_selected_node() {
			if (!this.selection) return null;
			if (this.selection.type === 'node') {
				const start = Math.min(this.selection.anchor_offset, this.selection.focus_offset);
				const end = Math.max(this.selection.anchor_offset, this.selection.focus_offset);
				if (end - start !== 1) return null;
				const node_array = this.get(this.selection.path);
				const node_id = node_array.nodes[start];
				return node_id ? this.get(node_id) : null;
			} else {
				const owner_node_path = this.selection?.path?.slice(0, -1);
				if (!owner_node_path) return null;
				const owner_node = this.get(owner_node_path);
				return owner_node;
			}
		}
		get tr() {
			return new Transaction(this.schema, this.doc, this.selection, this.config);
		}
		apply(transaction, { batch = false } = {}) {
			this.validate_transaction_result(transaction);
			if (transaction.ops.length > 0) {
				this.doc = transaction.doc;
			}
			this.selection = structuredClone(transaction.selection);
			if (this.history_index < this.history.length - 1) {
				this.history = this.history.slice(0, this.history_index + 1);
			}
			const now = Date.now();
			const should_batch = batch && this.last_batch_started !== undefined && now - this.last_batch_started < BATCH_WINDOW_MS;
			if (should_batch) {
				const last_entry = this.history[this.history_index];
				last_entry.ops.push(...transaction.ops);
				last_entry.inverse_ops.push(...transaction.inverse_ops);
				last_entry.selection_after = this.selection;
				this.history = [...this.history];
			} else {
				this.history = [
					...this.history,
					{
						ops: transaction.ops,
						inverse_ops: transaction.inverse_ops,
						selection_before: transaction.selection_before,
						selection_after: this.selection
					}
				];
				this.history_index = this.history_index + 1;
				if (batch) {
					this.last_batch_started = now;
				} else {
					this.last_batch_started = undefined;
				}
			}
			return this;
		}
		undo() {
			if (this.history_index < 0) {
				return;
			}
			const change = this.history[this.history_index];
			const doc = create_document_draft(this.doc);
			change.inverse_ops.slice().reverse().forEach((op) => {
				apply_op_to_draft(doc, op);
			});
			this.doc = doc;
			this.selection = change.selection_before;
			this.history_index = this.history_index - 1;
			this.last_batch_started = undefined;
			return this;
		}
		redo() {
			if (this.history_index >= this.history.length - 1) {
				return;
			}
			this.history_index = this.history_index + 1;
			const change = this.history[this.history_index];
			const doc = create_document_draft(this.doc);
			change.ops.forEach((op) => {
				apply_op_to_draft(doc, op);
			});
			this.doc = doc;
			this.selection = change.selection_after;
			this.last_batch_started = undefined;
			return this;
		}
		get(path) {
			return get(this.schema, this.doc, path);
		}
		inspect(path) {
			return inspect(this.schema, this.doc, path);
		}
		kind(node) {
			return kind(this.schema, node);
		}
		can_insert(node_type, selection = this.selection) {
			if (selection?.type === 'node') {
				const property_definition = this.inspect(selection.path);
				if (property_definition.node_types.includes(node_type)) {
					return true;
				}
			}
			let next_node_insert_caret = this.get_next_node_insert_caret(selection);
			if (!next_node_insert_caret) return false;
			return this.can_insert(node_type, next_node_insert_caret);
		}
		get_next_node_insert_caret(selection = this.selection) {
			if (!selection || selection.path.length <= 2) {
				return null;
			}
			const node_offset = selection.path.at(-2) + 1;
			return {
				type: 'node',
				path: selection.path.slice(0, -2),
				anchor_offset: node_offset,
				focus_offset: node_offset
			};
		}
		get_selected_text() {
			if (this.selection?.type !== 'text') return null;
			const selection_start = Math.min(this.selection.anchor_offset, this.selection.focus_offset);
			const selection_end = Math.max(this.selection.anchor_offset, this.selection.focus_offset);
			const text_value = this.get(this.selection.path);
			const selected_text = char_slice(text_value.content, selection_start, selection_end);
			const nodes = {};
			const clip_ranges = (ranges) => ranges.map((range) => {
				if (selection_start < range.end_offset && selection_end > range.start_offset) {
					const sub_graph = this.traverse(range.node_id);
					for (const node of sub_graph) {
						if (!nodes[node.id]) {
							nodes[node.id] = node;
						}
					}
					return {
						start_offset: Math.max(range.start_offset - selection_start, 0),
						end_offset: Math.min(range.end_offset - selection_start, selection_end - selection_start),
						node_id: range.node_id
					};
				} else {
					return null;
				}
			}).filter((range) => range !== null);
			const marks = clip_ranges(text_value.marks);
			const annotations = clip_ranges(text_value.annotations);
			return { content: selected_text, marks, annotations, nodes };
		}
		get_selected_annotated_nodes() {
			if (this.selection?.type !== 'node') return null;
			const selection_start = Math.min(this.selection.anchor_offset, this.selection.focus_offset);
			const selection_end = Math.max(this.selection.anchor_offset, this.selection.focus_offset);
			const node_array = this.get(this.selection.path);
			const main_nodes = node_array.nodes.slice(selection_start, selection_end);
			const nodes = {};
			const add_subgraph = (node_id) => {
				for (const node of this.traverse(node_id)) {
					if (!nodes[node.id]) nodes[node.id] = node;
				}
			};
			for (const node_id of main_nodes) add_subgraph(node_id);
			const clip_ranges = (ranges) => ranges.map((range) => {
				if (selection_start >= range.end_offset || selection_end <= range.start_offset) {
					return null;
				}
				add_subgraph(range.node_id);
				return {
					start_offset: Math.max(range.start_offset - selection_start, 0),
					end_offset: Math.min(range.end_offset - selection_start, selection_end - selection_start),
					node_id: range.node_id
				};
			}).filter((range) => range !== null);
			const marks = clip_ranges(node_array.marks);
			const annotations = clip_ranges(node_array.annotations);
			return { nodes, main_nodes, marks, annotations };
		}
		get_selected_plain_text() {
			if (this.selection?.type !== 'text') return null;
			const start = Math.min(this.selection.anchor_offset, this.selection.focus_offset);
			const end = Math.max(this.selection.anchor_offset, this.selection.focus_offset);
			const text = this.get(this.selection.path);
			return char_slice(text.content, start, end);
		}
		get_selected_nodes() {
			if (this.selection?.type !== 'node') return null;
			const start = Math.min(this.selection.anchor_offset, this.selection.focus_offset);
			const end = Math.max(this.selection.anchor_offset, this.selection.focus_offset);
			const node_array = this.get(this.selection.path);
			return node_array.nodes.slice(start, end);
		}
		select_parent() {
			if (!this.selection) return;
			if (['text', 'property'].includes(this.selection.type)) {
				if (this.selection.path.length > 3) {
					const parent_path = this.selection.path.slice(0, -2);
					const current_index = this.selection.path[this.selection.path.length - 2];
					this.selection = {
						type: 'node',
						path: parent_path,
						anchor_offset: current_index,
						focus_offset: current_index + 1
					};
				} else {
					this.selection = null;
				}
			} else if (this.selection.type === 'node') {
				if (this.selection.path.length > 3) {
					const parent_path = this.selection.path.slice(0, -2);
					const current_index = this.selection.path[this.selection.path.length - 2];
					this.selection = {
						type: 'node',
						path: parent_path,
						anchor_offset: current_index,
						focus_offset: current_index + 1
					};
				} else {
					this.selection = null;
				}
			} else {
				this.selection = null;
			}
		}
		traverse(node_id) {
			return traverse(node_id, this.schema, this.doc.nodes);
		}
		to_json() {
			const nodes_array = this.traverse(this.document_id);
			const nodes = Object.fromEntries(nodes_array.map((node) => [node.id, node]));
			return { document_id: this.document_id, nodes };
		}
		property_type(type, property) {
			return property_type(this.schema, type, property);
		}
		count_references(node_id) {
			return count_references(this.schema, this.doc, node_id);
		}
		get_referenced_nodes(node_id) {
			return traverse_ids(node_id, this.schema, this.doc.nodes).slice(0, -1);
		}
	}

	class Command {
		context;
		#disabled = user_derived((
		) => !this.is_enabled());
		get disabled() {
			return get$1(this.#disabled);
		}
		set disabled(value) {
			set$1(this.#disabled, value);
		}
		constructor(context) {
			this.context = context;
		}
		is_enabled() {
			return true;
		}
		execute() {
			throw new Error('Not implemented');
		}
	}class UndoCommand extends Command {
		is_enabled() {
			return this.context.editable && this.context.session.can_undo;
		}
		execute() {
			this.context.session.undo();
		}
	}
	class RedoCommand extends Command {
		is_enabled() {
			return this.context.editable && this.context.session.can_redo;
		}
		execute() {
			this.context.session.redo();
		}
	}
	class SelectParentCommand extends Command {
		is_enabled() {
			return Boolean(this.context.editable && this.context.session.selection && this.context.session.selection.path.length > 3);
		}
		execute() {
			this.context.session.select_parent();
		}
	}
	class ToggleMarkCommand extends Command {
		node_type;
		constructor(node_type, context) {
			super(context);
			this.node_type = node_type;
		}
		#active = user_derived(() => this.is_active());
		get active() {
			return get$1(this.#active);
		}
		set active(value) {
			set$1(this.#active, value);
		}
		is_active() {
			const selected_marks = this.context.session.selected_marks;
			return selected_marks.length > 0 && selected_marks.every(({ node }) => node?.type === this.node_type);
		}
		is_enabled() {
			const { session, editable } = this.context;
			const selection = session.selection;
			const is_valid_selection = selection?.type === 'text' || selection?.type === 'node' && !is_selection_collapsed(selection);
			const mark_type_is_allowed = session.available_mark_types.includes(this.node_type);
			const selected_marks = session.selected_marks;
			const selected_mark_types = get_selected_range_types(selected_marks);
			if (!editable || !is_valid_selection || !mark_type_is_allowed) return false;
			if (selected_mark_types.size > 1) return false;
			if (selected_marks.length === 0) {
				return Boolean(selection && !is_selection_collapsed(selection));
			}
			const first_selected_mark = selected_marks[0];
			const selected_mark_type = first_selected_mark.node.type;
			if (selected_mark_type === this.node_type) return true;
			if (selected_marks.length !== 1) return false;
			return can_switch_mark_type(session.schema, selected_mark_type, this.node_type);
		}
		execute() {
			this.context.session.apply(this.context.session.tr.toggle_mark(this.node_type));
		}
	}
	class AddNewLineCommand extends Command {
		is_enabled() {
			const session = this.context.session;
			const selection = session.selection;
			return this.context.editable && selection?.type === 'text' && session.inspect(selection.path).allow_newlines;
		}
		execute() {
			const session = this.context.session;
			const selection = session.selection;
			if (!selection || selection.type !== 'text') return;
			if (!session.inspect(selection.path).allow_newlines) return;
			const tr = session.tr;
			if (selection.anchor_offset !== selection.focus_offset) {
				tr.delete_selection();
			}
			if (tr.selection.type !== 'text') return;
			const collapsed_offset = tr.selection.anchor_offset;
			const content = tr.get(tr.selection.path);
			const text_before_caret = char_slice(content.content, 0, collapsed_offset);
			const line_start_index = text_before_caret.lastIndexOf('\n') + 1;
			const current_line_prefix = text_before_caret.slice(line_start_index);
			const indentation_match = current_line_prefix.match(/^[\t ]*/);
			const indentation = indentation_match ? indentation_match[0] : '';
			tr.insert_text(`\n${indentation}`);
			session.apply(tr);
		}
	}
	class BreakTextNodeCommand extends Command {
		is_enabled() {
			const session = this.context.session;
			const selection = session.selection;
			if (!this.context.editable || selection?.type !== 'text') return false;
			const owner_node = session.get(selection.path.slice(0, -1));
			const owner_node_schema = owner_node ? session.schema[owner_node.type] : null;
			if (!owner_node_schema || owner_node_schema.kind !== 'text') return false;
			return session.inspect(selection.path.slice(0, -2))?.type === 'node_array';
		}
		execute() {
			const tr = this.context.session.tr;
			if (break_text_node(tr)) {
				this.context.session.apply(tr);
			}
		}
	}
	class SelectAllCommand extends Command {
		is_enabled() {
			return Boolean(this.context.editable && this.context.session.selection);
		}
		execute() {
			const session = this.context.session;
			const selection = session.selection;
			if (!selection) {
				return;
			}
			if (selection.type === 'text') {
				const text_content = session.get(selection.path);
				const text_length = get_char_length(text_content.content);
				const is_all_text_selected = Math.min(selection.anchor_offset, selection.focus_offset) === 0 && Math.max(selection.anchor_offset, selection.focus_offset) === text_length;
				if (!is_all_text_selected) {
					session.selection = {
						type: 'text',
						path: selection.path,
						anchor_offset: 0,
						focus_offset: text_length
					};
				} else {
					const node_path = selection.path.slice(0, -1);
					if (node_path.length >= 2) {
						const is_inside_node_array = session.inspect(node_path.slice(0, -1))?.type === 'node_array';
						if (is_inside_node_array) {
							const node_index = node_path.at(-1);
							session.selection = {
								type: 'node',
								path: node_path.slice(0, -1),
								anchor_offset: node_index,
								focus_offset: node_index + 1
							};
						}
					}
				}
			} else if (selection.type === 'node') {
				const node_array_path = selection.path;
				const node_array = session.get(node_array_path);
				const is_entire_node_array_selected = Math.min(selection.anchor_offset, selection.focus_offset) === 0 && Math.max(selection.anchor_offset, selection.focus_offset) === node_array.nodes.length;
				if (!is_entire_node_array_selected) {
					session.selection = {
						type: 'node',
						path: node_array_path,
						anchor_offset: 0,
						focus_offset: node_array.nodes.length
					};
				} else {
					const parent_path = node_array_path.slice(0, -1);
					if (parent_path.length >= 2) {
						const is_parent_node_array = session.inspect(parent_path.slice(0, -1))?.type === 'node_array';
						if (is_parent_node_array) {
							const parent_node_index = parent_path.at(-1);
							session.selection = {
								type: 'node',
								path: parent_path.slice(0, -1),
								anchor_offset: parent_node_index,
								focus_offset: parent_node_index + 1
							};
						}
					}
				}
			} else if (selection.type === 'property') {
				const node_path = selection.path.slice(0, -1);
				if (node_path.length >= 2) {
					const is_inside_node_array = session.inspect(node_path.slice(0, -1))?.type === 'node_array';
					if (is_inside_node_array) {
						const node_index = node_path.at(-1);
						session.selection = {
							type: 'node',
							path: node_path.slice(0, -1),
							anchor_offset: node_index,
							focus_offset: node_index + 1
						};
					}
				}
			}
		}
	}
	class InsertDefaultNodeCommand extends Command {
		is_enabled() {
			const selection = this.context.session.selection;
			return this.context.editable && selection?.type === 'node' && selection.anchor_offset === selection.focus_offset;
		}
		execute() {
			const tr = this.context.session.tr;
			insert_default_node(tr);
			this.context.session.apply(tr);
		}
	}

	const MODIFIER_KEYS = ['meta', 'ctrl', 'alt', 'shift'];
	const MODIFIER_EVENT_KEYS = {
		meta: 'metaKey',
		ctrl: 'ctrlKey',
		alt: 'altKey',
		shift: 'shiftKey'
	};
	function define_keymap(keymap) {
		for (const [key_combo] of Object.entries(keymap)) {
			const alternatives = key_combo.split(',');
			for (const alternative of alternatives) {
				const parts = alternative.trim().toLowerCase().split('+');
				const non_modifiers = parts.filter((part) => !MODIFIER_KEYS.includes(part));
				if (non_modifiers.length !== 1) {
					throw new Error(`Invalid key combo: "${alternative}". Must have exactly one non-modifier key. Found: ${non_modifiers.length}`);
				}
			}
		}
		return keymap;
	}
	function matches_key_combo(key_combo, event, virtual_keyboard_active = false) {
		const alternatives = key_combo.split(',');
		return alternatives.some((alternative) => {
			const parts = alternative.trim().toLowerCase().split('+');
			const modifiers = parts.filter((part) => MODIFIER_KEYS.includes(part));
			const non_modifier = parts.find((part) => !MODIFIER_KEYS.includes(part));
			if (virtual_keyboard_active && modifiers.length > 0) {
				return false;
			}
			const modifiers_match = modifiers.every((mod) => event[MODIFIER_EVENT_KEYS[mod]]);
			const no_extra_modifiers = virtual_keyboard_active
				? true
				: MODIFIER_KEYS.every((mod) => {
					if (modifiers.includes(mod)) return true;
					return !event[MODIFIER_EVENT_KEYS[mod]];
				});
			const key_matches = event.key.toLowerCase() === non_modifier;
			return modifiers_match && no_extra_modifiers && key_matches;
		});
	}
	function handle_key_map(key_map, event) {
		const virtual_keyboard_active = is_virtual_keyboard_active();
		for (const [key_combo, commands] of Object.entries(key_map)) {
			if (matches_key_combo(key_combo, event, virtual_keyboard_active)) {
				const enabled_command = commands.find((cmd) => cmd.is_enabled());
				if (enabled_command) {
					event.preventDefault();
					const result = enabled_command.execute();
					if (result instanceof Promise) {
						result.catch((err) => {
							console.error('Command execution failed:', err);
						});
					}
					return true;
				}
			}
		}
		return false;
	}
	class KeyMapper {
		scope_stack;
		skip_onkeydown;
		constructor() {
			this.scope_stack = [];
			this.skip_onkeydown = false;
		}
		push_scope(keymap) {
			this.scope_stack.push(keymap);
		}
		pop_scope() {
			const keymap = this.scope_stack.pop();
			return keymap;
		}
		handle_keydown(event) {
			if (this.skip_onkeydown) return;
			for (let i = this.scope_stack.length - 1; i >= 0; i--) {
				if (handle_key_map(this.scope_stack[i], event)) {
					return;
				}
			}
		}
	}

	const own$1 = {}.hasOwnProperty;
	function zwitch(key, options) {
	  const settings = options || {};
	  function one(value, ...parameters) {
	    let fn = one.invalid;
	    const handlers = one.handlers;
	    if (value && own$1.call(value, key)) {
	      const id = String(value[key]);
	      fn = own$1.call(handlers, id) ? handlers[id] : one.unknown;
	    }
	    if (fn) {
	      return fn.call(this, value, ...parameters)
	    }
	  }
	  one.handlers = settings.handlers || {};
	  one.invalid = settings.invalid;
	  one.unknown = settings.unknown;
	  return one
	}

	const own = {}.hasOwnProperty;
	function configure(base, extension) {
	  let index = -1;
	  let key;
	  if (extension.extensions) {
	    while (++index < extension.extensions.length) {
	      configure(base, extension.extensions[index]);
	    }
	  }
	  for (key in extension) {
	    if (own.call(extension, key)) {
	      switch (key) {
	        case 'extensions': {
	          break
	        }
	        case 'unsafe': {
	          list$1(base[key], extension[key]);
	          break
	        }
	        case 'join': {
	          list$1(base[key], extension[key]);
	          break
	        }
	        case 'handlers': {
	          map$3(base[key], extension[key]);
	          break
	        }
	        default: {
	          base.options[key] = extension[key];
	        }
	      }
	    }
	  }
	  return base
	}
	function list$1(left, right) {
	  if (right) {
	    left.push(...right);
	  }
	}
	function map$3(left, right) {
	  if (right) {
	    Object.assign(left, right);
	  }
	}

	function blockquote(node, _, state, info) {
	  const exit = state.enter('blockquote');
	  const tracker = state.createTracker(info);
	  tracker.move('> ');
	  tracker.shift(2);
	  const value = state.indentLines(
	    state.containerFlow(node, tracker.current()),
	    map$2
	  );
	  exit();
	  return value
	}
	function map$2(line, _, blank) {
	  return '>' + (blank ? '' : ' ') + line
	}

	function patternInScope(stack, pattern) {
	  return (
	    listInScope(stack, pattern.inConstruct, true) &&
	    !listInScope(stack, pattern.notInConstruct, false)
	  )
	}
	function listInScope(stack, list, none) {
	  if (typeof list === 'string') {
	    list = [list];
	  }
	  if (!list || list.length === 0) {
	    return none
	  }
	  let index = -1;
	  while (++index < list.length) {
	    if (stack.includes(list[index])) {
	      return true
	    }
	  }
	  return false
	}

	function hardBreak(_, _1, state, info) {
	  let index = -1;
	  while (++index < state.unsafe.length) {
	    if (
	      state.unsafe[index].character === '\n' &&
	      patternInScope(state.stack, state.unsafe[index])
	    ) {
	      return /[ \t]/.test(info.before) ? '' : ' '
	    }
	  }
	  return '\\\n'
	}

	function longestStreak(value, substring) {
	  const source = String(value);
	  let index = source.indexOf(substring);
	  let expected = index;
	  let count = 0;
	  let max = 0;
	  if (typeof substring !== 'string') {
	    throw new TypeError('Expected substring')
	  }
	  while (index !== -1) {
	    if (index === expected) {
	      if (++count > max) {
	        max = count;
	      }
	    } else {
	      count = 1;
	    }
	    expected = index + substring.length;
	    index = source.indexOf(substring, expected);
	  }
	  return max
	}

	function formatCodeAsIndented(node, state) {
	  return Boolean(
	    state.options.fences === false &&
	      node.value &&
	      !node.lang &&
	      /[^ \r\n]/.test(node.value) &&
	      !/^[\t ]*(?:[\r\n]|$)|(?:^|[\r\n])[\t ]*$/.test(node.value)
	  )
	}

	function checkFence(state) {
	  const marker = state.options.fence || '`';
	  if (marker !== '`' && marker !== '~') {
	    throw new Error(
	      'Cannot serialize code with `' +
	        marker +
	        '` for `options.fence`, expected `` ` `` or `~`'
	    )
	  }
	  return marker
	}

	function code(node, _, state, info) {
	  const marker = checkFence(state);
	  const raw = node.value || '';
	  const suffix = marker === '`' ? 'GraveAccent' : 'Tilde';
	  if (formatCodeAsIndented(node, state)) {
	    const exit = state.enter('codeIndented');
	    const value = state.indentLines(raw, map$1);
	    exit();
	    return value
	  }
	  const tracker = state.createTracker(info);
	  const sequence = marker.repeat(Math.max(longestStreak(raw, marker) + 1, 3));
	  const exit = state.enter('codeFenced');
	  let value = tracker.move(sequence);
	  if (node.lang) {
	    const subexit = state.enter(`codeFencedLang${suffix}`);
	    value += tracker.move(
	      state.safe(node.lang, {
	        before: value,
	        after: ' ',
	        encode: ['`'],
	        ...tracker.current()
	      })
	    );
	    subexit();
	  }
	  if (node.lang && node.meta) {
	    const subexit = state.enter(`codeFencedMeta${suffix}`);
	    value += tracker.move(' ');
	    value += tracker.move(
	      state.safe(node.meta, {
	        before: value,
	        after: '\n',
	        encode: ['`'],
	        ...tracker.current()
	      })
	    );
	    subexit();
	  }
	  value += tracker.move('\n');
	  if (raw) {
	    value += tracker.move(raw + '\n');
	  }
	  value += tracker.move(sequence);
	  exit();
	  return value
	}
	function map$1(line, _, blank) {
	  return (blank ? '' : '    ') + line
	}

	function checkQuote(state) {
	  const marker = state.options.quote || '"';
	  if (marker !== '"' && marker !== "'") {
	    throw new Error(
	      'Cannot serialize title with `' +
	        marker +
	        '` for `options.quote`, expected `"`, or `\'`'
	    )
	  }
	  return marker
	}

	function definition(node, _, state, info) {
	  const quote = checkQuote(state);
	  const suffix = quote === '"' ? 'Quote' : 'Apostrophe';
	  const exit = state.enter('definition');
	  let subexit = state.enter('label');
	  const tracker = state.createTracker(info);
	  let value = tracker.move('[');
	  value += tracker.move(
	    state.safe(state.associationId(node), {
	      before: value,
	      after: ']',
	      ...tracker.current()
	    })
	  );
	  value += tracker.move(']: ');
	  subexit();
	  if (
	    !node.url ||
	    /[\0- \u007F]/.test(node.url)
	  ) {
	    subexit = state.enter('destinationLiteral');
	    value += tracker.move('<');
	    value += tracker.move(
	      state.safe(node.url, {before: value, after: '>', ...tracker.current()})
	    );
	    value += tracker.move('>');
	  } else {
	    subexit = state.enter('destinationRaw');
	    value += tracker.move(
	      state.safe(node.url, {
	        before: value,
	        after: node.title ? ' ' : '\n',
	        ...tracker.current()
	      })
	    );
	  }
	  subexit();
	  if (node.title) {
	    subexit = state.enter(`title${suffix}`);
	    value += tracker.move(' ' + quote);
	    value += tracker.move(
	      state.safe(node.title, {
	        before: value,
	        after: quote,
	        ...tracker.current()
	      })
	    );
	    value += tracker.move(quote);
	    subexit();
	  }
	  exit();
	  return value
	}

	function checkEmphasis(state) {
	  const marker = state.options.emphasis || '*';
	  if (marker !== '*' && marker !== '_') {
	    throw new Error(
	      'Cannot serialize emphasis with `' +
	        marker +
	        '` for `options.emphasis`, expected `*`, or `_`'
	    )
	  }
	  return marker
	}

	function encodeCharacterReference(code) {
	  return '&#x' + code.toString(16).toUpperCase() + ';'
	}

	function markdownLineEndingOrSpace(code) {
	  return code !== null && (code < 0 || code === 32);
	}
	const unicodePunctuation = regexCheck(/\p{P}|\p{S}/u);
	const unicodeWhitespace = regexCheck(/\s/);
	function regexCheck(regex) {
	  return check;
	  function check(code) {
	    return code !== null && code > -1 && regex.test(String.fromCharCode(code));
	  }
	}

	function classifyCharacter(code) {
	  if (code === null || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) {
	    return 1;
	  }
	  if (unicodePunctuation(code)) {
	    return 2;
	  }
	}

	function encodeInfo(outside, inside, marker) {
	  const outsideKind = classifyCharacter(outside);
	  const insideKind = classifyCharacter(inside);
	  if (outsideKind === undefined) {
	    return insideKind === undefined
	      ?
	        marker === '_'
	        ? {inside: true, outside: true}
	        : {inside: false, outside: false}
	      : insideKind === 1
	        ?
	          {inside: true, outside: true}
	        :
	          {inside: false, outside: true}
	  }
	  if (outsideKind === 1) {
	    return insideKind === undefined
	      ?
	        {inside: false, outside: false}
	      : insideKind === 1
	        ?
	          {inside: true, outside: true}
	        :
	          {inside: false, outside: false}
	  }
	  return insideKind === undefined
	    ?
	      {inside: false, outside: false}
	    : insideKind === 1
	      ?
	        {inside: true, outside: false}
	      :
	        {inside: false, outside: false}
	}

	emphasis.peek = emphasisPeek;
	function emphasis(node, _, state, info) {
	  const marker = checkEmphasis(state);
	  const exit = state.enter('emphasis');
	  const tracker = state.createTracker(info);
	  const before = tracker.move(marker);
	  let between = tracker.move(
	    state.containerPhrasing(node, {
	      after: marker,
	      before,
	      ...tracker.current()
	    })
	  );
	  const betweenHead = between.charCodeAt(0);
	  const open = encodeInfo(
	    info.before.charCodeAt(info.before.length - 1),
	    betweenHead,
	    marker
	  );
	  if (open.inside) {
	    between = encodeCharacterReference(betweenHead) + between.slice(1);
	  }
	  const betweenTail = between.charCodeAt(between.length - 1);
	  const close = encodeInfo(info.after.charCodeAt(0), betweenTail, marker);
	  if (close.inside) {
	    between = between.slice(0, -1) + encodeCharacterReference(betweenTail);
	  }
	  const after = tracker.move(marker);
	  exit();
	  state.attentionEncodeSurroundingInfo = {
	    after: close.outside,
	    before: open.outside
	  };
	  return before + between + after
	}
	function emphasisPeek(_, _1, state) {
	  return state.options.emphasis || '*'
	}

	const convert =
	  (
	    function (test) {
	      if (test === null || test === undefined) {
	        return ok
	      }
	      if (typeof test === 'function') {
	        return castFactory(test)
	      }
	      if (typeof test === 'object') {
	        return Array.isArray(test)
	          ? anyFactory(test)
	          :
	            propertiesFactory( (test))
	      }
	      if (typeof test === 'string') {
	        return typeFactory(test)
	      }
	      throw new Error('Expected function, string, or object as test')
	    }
	  );
	function anyFactory(tests) {
	  const checks = [];
	  let index = -1;
	  while (++index < tests.length) {
	    checks[index] = convert(tests[index]);
	  }
	  return castFactory(any)
	  function any(...parameters) {
	    let index = -1;
	    while (++index < checks.length) {
	      if (checks[index].apply(this, parameters)) return true
	    }
	    return false
	  }
	}
	function propertiesFactory(check) {
	  const checkAsRecord =  (check);
	  return castFactory(all)
	  function all(node) {
	    const nodeAsRecord =  (
	       (node)
	    );
	    let key;
	    for (key in check) {
	      if (nodeAsRecord[key] !== checkAsRecord[key]) return false
	    }
	    return true
	  }
	}
	function typeFactory(check) {
	  return castFactory(type)
	  function type(node) {
	    return node && node.type === check
	  }
	}
	function castFactory(testFunction) {
	  return check
	  function check(value, index, parent) {
	    return Boolean(
	      looksLikeANode(value) &&
	        testFunction.call(
	          this,
	          value,
	          typeof index === 'number' ? index : undefined,
	          parent || undefined
	        )
	    )
	  }
	}
	function ok() {
	  return true
	}
	function looksLikeANode(value) {
	  return value !== null && typeof value === 'object' && 'type' in value
	}

	function color(d) {
	  return d
	}

	const empty$1 = [];
	const CONTINUE = true;
	const EXIT = false;
	const SKIP$1 = 'skip';
	function visitParents(tree, test, visitor, reverse) {
	  let check;
	  if (typeof test === 'function' && typeof visitor !== 'function') {
	    reverse = visitor;
	    visitor = test;
	  } else {
	    check = test;
	  }
	  const is = convert(check);
	  const step = reverse ? -1 : 1;
	  factory(tree, undefined, [])();
	  function factory(node, index, parents) {
	    const value =  (
	      node && typeof node === 'object' ? node : {}
	    );
	    if (typeof value.type === 'string') {
	      const name =
	        typeof value.tagName === 'string'
	          ? value.tagName
	          :
	            typeof value.name === 'string'
	            ? value.name
	            : undefined;
	      Object.defineProperty(visit, 'name', {
	        value:
	          'node (' + color(node.type + (name ? '<' + name + '>' : '')) + ')'
	      });
	    }
	    return visit
	    function visit() {
	      let result = empty$1;
	      let subresult;
	      let offset;
	      let grandparents;
	      if (!test || is(node, index, parents[parents.length - 1] || undefined)) {
	        result = toResult(visitor(node, parents));
	        if (result[0] === EXIT) {
	          return result
	        }
	      }
	      if ('children' in node && node.children) {
	        const nodeAsParent =  (node);
	        if (nodeAsParent.children && result[0] !== SKIP$1) {
	          offset = (reverse ? nodeAsParent.children.length : -1) + step;
	          grandparents = parents.concat(nodeAsParent);
	          while (offset > -1 && offset < nodeAsParent.children.length) {
	            const child = nodeAsParent.children[offset];
	            subresult = factory(child, offset, grandparents)();
	            if (subresult[0] === EXIT) {
	              return subresult
	            }
	            offset =
	              typeof subresult[1] === 'number' ? subresult[1] : offset + step;
	          }
	        }
	      }
	      return result
	    }
	  }
	}
	function toResult(value) {
	  if (Array.isArray(value)) {
	    return value
	  }
	  if (typeof value === 'number') {
	    return [CONTINUE, value]
	  }
	  return value === null || value === undefined ? empty$1 : [value]
	}

	function visit$1(tree, testOrVisitor, visitorOrReverse, maybeReverse) {
	  let reverse;
	  let test;
	  let visitor;
	  if (
	    typeof testOrVisitor === 'function' &&
	    typeof visitorOrReverse !== 'function'
	  ) {
	    test = undefined;
	    visitor = testOrVisitor;
	    reverse = visitorOrReverse;
	  } else {
	    test = testOrVisitor;
	    visitor = visitorOrReverse;
	    reverse = maybeReverse;
	  }
	  visitParents(tree, test, overload, reverse);
	  function overload(node, parents) {
	    const parent = parents[parents.length - 1];
	    const index = parent ? parent.children.indexOf(node) : undefined;
	    return visitor(node, index, parent)
	  }
	}

	const emptyOptions = {};
	function toString(value, options) {
	  const settings = emptyOptions;
	  const includeImageAlt =
	    typeof settings.includeImageAlt === 'boolean'
	      ? settings.includeImageAlt
	      : true;
	  const includeHtml =
	    typeof settings.includeHtml === 'boolean' ? settings.includeHtml : true;
	  return one(value, includeImageAlt, includeHtml)
	}
	function one(value, includeImageAlt, includeHtml) {
	  if (node(value)) {
	    if ('value' in value) {
	      return value.type === 'html' && !includeHtml ? '' : value.value
	    }
	    if (includeImageAlt && 'alt' in value && value.alt) {
	      return value.alt
	    }
	    if ('children' in value) {
	      return all(value.children, includeImageAlt, includeHtml)
	    }
	  }
	  if (Array.isArray(value)) {
	    return all(value, includeImageAlt, includeHtml)
	  }
	  return ''
	}
	function all(values, includeImageAlt, includeHtml) {
	  const result = [];
	  let index = -1;
	  while (++index < values.length) {
	    result[index] = one(values[index], includeImageAlt, includeHtml);
	  }
	  return result.join('')
	}
	function node(value) {
	  return Boolean(value && typeof value === 'object')
	}

	function formatHeadingAsSetext(node, state) {
	  let literalWithBreak = false;
	  visit$1(node, function (node) {
	    if (
	      ('value' in node && /\r?\n|\r/.test(node.value)) ||
	      node.type === 'break'
	    ) {
	      literalWithBreak = true;
	      return EXIT
	    }
	  });
	  return Boolean(
	    (!node.depth || node.depth < 3) &&
	      toString(node) &&
	      (state.options.setext || literalWithBreak)
	  )
	}

	function heading(node, _, state, info) {
	  const rank = Math.max(Math.min(6, node.depth || 1), 1);
	  const tracker = state.createTracker(info);
	  if (formatHeadingAsSetext(node, state)) {
	    const exit = state.enter('headingSetext');
	    const subexit = state.enter('phrasing');
	    const value = state.containerPhrasing(node, {
	      ...tracker.current(),
	      before: '\n',
	      after: '\n'
	    });
	    subexit();
	    exit();
	    return (
	      value +
	      '\n' +
	      (rank === 1 ? '=' : '-').repeat(
	        value.length -
	          (Math.max(value.lastIndexOf('\r'), value.lastIndexOf('\n')) + 1)
	      )
	    )
	  }
	  const sequence = '#'.repeat(rank);
	  const exit = state.enter('headingAtx');
	  const subexit = state.enter('phrasing');
	  tracker.move(sequence + ' ');
	  let value = state.containerPhrasing(node, {
	    before: '# ',
	    after: '\n',
	    ...tracker.current()
	  });
	  if (/^[\t ]/.test(value)) {
	    value = encodeCharacterReference(value.charCodeAt(0)) + value.slice(1);
	  }
	  value = value ? sequence + ' ' + value : sequence;
	  if (state.options.closeAtx) {
	    value += ' ' + sequence;
	  }
	  subexit();
	  exit();
	  return value
	}

	html.peek = htmlPeek;
	function html(node) {
	  return node.value || ''
	}
	function htmlPeek() {
	  return '<'
	}

	image.peek = imagePeek;
	function image(node, _, state, info) {
	  const quote = checkQuote(state);
	  const suffix = quote === '"' ? 'Quote' : 'Apostrophe';
	  const exit = state.enter('image');
	  let subexit = state.enter('label');
	  const tracker = state.createTracker(info);
	  let value = tracker.move('![');
	  value += tracker.move(
	    state.safe(node.alt, {before: value, after: ']', ...tracker.current()})
	  );
	  value += tracker.move('](');
	  subexit();
	  if (
	    (!node.url && node.title) ||
	    /[\0- \u007F]/.test(node.url)
	  ) {
	    subexit = state.enter('destinationLiteral');
	    value += tracker.move('<');
	    value += tracker.move(
	      state.safe(node.url, {before: value, after: '>', ...tracker.current()})
	    );
	    value += tracker.move('>');
	  } else {
	    subexit = state.enter('destinationRaw');
	    value += tracker.move(
	      state.safe(node.url, {
	        before: value,
	        after: node.title ? ' ' : ')',
	        ...tracker.current()
	      })
	    );
	  }
	  subexit();
	  if (node.title) {
	    subexit = state.enter(`title${suffix}`);
	    value += tracker.move(' ' + quote);
	    value += tracker.move(
	      state.safe(node.title, {
	        before: value,
	        after: quote,
	        ...tracker.current()
	      })
	    );
	    value += tracker.move(quote);
	    subexit();
	  }
	  value += tracker.move(')');
	  exit();
	  return value
	}
	function imagePeek() {
	  return '!'
	}

	imageReference.peek = imageReferencePeek;
	function imageReference(node, _, state, info) {
	  const type = node.referenceType;
	  const exit = state.enter('imageReference');
	  let subexit = state.enter('label');
	  const tracker = state.createTracker(info);
	  let value = tracker.move('![');
	  const alt = state.safe(node.alt, {
	    before: value,
	    after: ']',
	    ...tracker.current()
	  });
	  value += tracker.move(alt + '][');
	  subexit();
	  const stack = state.stack;
	  state.stack = [];
	  subexit = state.enter('reference');
	  const reference = state.safe(state.associationId(node), {
	    before: value,
	    after: ']',
	    ...tracker.current()
	  });
	  subexit();
	  state.stack = stack;
	  exit();
	  if (type === 'full' || !alt || alt !== reference) {
	    value += tracker.move(reference + ']');
	  } else if (type === 'shortcut') {
	    value = value.slice(0, -1);
	  } else {
	    value += tracker.move(']');
	  }
	  return value
	}
	function imageReferencePeek() {
	  return '!'
	}

	inlineCode.peek = inlineCodePeek;
	function inlineCode(node, _, state) {
	  let value = node.value || '';
	  let sequence = '`';
	  let index = -1;
	  while (new RegExp('(^|[^`])' + sequence + '([^`]|$)').test(value)) {
	    sequence += '`';
	  }
	  if (
	    /[^ \r\n]/.test(value) &&
	    ((/^[ \r\n]/.test(value) && /[ \r\n]$/.test(value)) || /^`|`$/.test(value))
	  ) {
	    value = ' ' + value + ' ';
	  }
	  while (++index < state.unsafe.length) {
	    const pattern = state.unsafe[index];
	    const expression = state.compilePattern(pattern);
	    let match;
	    if (!pattern.atBreak) continue
	    while ((match = expression.exec(value))) {
	      let position = match.index;
	      if (
	        value.charCodeAt(position) === 10  &&
	        value.charCodeAt(position - 1) === 13
	      ) {
	        position--;
	      }
	      value = value.slice(0, position) + ' ' + value.slice(match.index + 1);
	    }
	  }
	  return sequence + value + sequence
	}
	function inlineCodePeek() {
	  return '`'
	}

	function formatLinkAsAutolink(node, state) {
	  const raw = toString(node);
	  return Boolean(
	    !state.options.resourceLink &&
	      node.url &&
	      !node.title &&
	      node.children &&
	      node.children.length === 1 &&
	      node.children[0].type === 'text' &&
	      (raw === node.url || 'mailto:' + raw === node.url) &&
	      /^[a-z][a-z+.-]+:/i.test(node.url) &&
	      !/[\0- <>\u007F]/.test(node.url)
	  )
	}

	link.peek = linkPeek;
	function link(node, _, state, info) {
	  const quote = checkQuote(state);
	  const suffix = quote === '"' ? 'Quote' : 'Apostrophe';
	  const tracker = state.createTracker(info);
	  let exit;
	  let subexit;
	  if (formatLinkAsAutolink(node, state)) {
	    const stack = state.stack;
	    state.stack = [];
	    exit = state.enter('autolink');
	    let value = tracker.move('<');
	    value += tracker.move(
	      state.containerPhrasing(node, {
	        before: value,
	        after: '>',
	        ...tracker.current()
	      })
	    );
	    value += tracker.move('>');
	    exit();
	    state.stack = stack;
	    return value
	  }
	  exit = state.enter('link');
	  subexit = state.enter('label');
	  let value = tracker.move('[');
	  value += tracker.move(
	    state.containerPhrasing(node, {
	      before: value,
	      after: '](',
	      ...tracker.current()
	    })
	  );
	  value += tracker.move('](');
	  subexit();
	  if (
	    (!node.url && node.title) ||
	    /[\0- \u007F]/.test(node.url)
	  ) {
	    subexit = state.enter('destinationLiteral');
	    value += tracker.move('<');
	    value += tracker.move(
	      state.safe(node.url, {before: value, after: '>', ...tracker.current()})
	    );
	    value += tracker.move('>');
	  } else {
	    subexit = state.enter('destinationRaw');
	    value += tracker.move(
	      state.safe(node.url, {
	        before: value,
	        after: node.title ? ' ' : ')',
	        ...tracker.current()
	      })
	    );
	  }
	  subexit();
	  if (node.title) {
	    subexit = state.enter(`title${suffix}`);
	    value += tracker.move(' ' + quote);
	    value += tracker.move(
	      state.safe(node.title, {
	        before: value,
	        after: quote,
	        ...tracker.current()
	      })
	    );
	    value += tracker.move(quote);
	    subexit();
	  }
	  value += tracker.move(')');
	  exit();
	  return value
	}
	function linkPeek(node, _, state) {
	  return formatLinkAsAutolink(node, state) ? '<' : '['
	}

	linkReference.peek = linkReferencePeek;
	function linkReference(node, _, state, info) {
	  const type = node.referenceType;
	  const exit = state.enter('linkReference');
	  let subexit = state.enter('label');
	  const tracker = state.createTracker(info);
	  let value = tracker.move('[');
	  const text = state.containerPhrasing(node, {
	    before: value,
	    after: ']',
	    ...tracker.current()
	  });
	  value += tracker.move(text + '][');
	  subexit();
	  const stack = state.stack;
	  state.stack = [];
	  subexit = state.enter('reference');
	  const reference = state.safe(state.associationId(node), {
	    before: value,
	    after: ']',
	    ...tracker.current()
	  });
	  subexit();
	  state.stack = stack;
	  exit();
	  if (type === 'full' || !text || text !== reference) {
	    value += tracker.move(reference + ']');
	  } else if (type === 'shortcut') {
	    value = value.slice(0, -1);
	  } else {
	    value += tracker.move(']');
	  }
	  return value
	}
	function linkReferencePeek() {
	  return '['
	}

	function checkBullet(state) {
	  const marker = state.options.bullet || '*';
	  if (marker !== '*' && marker !== '+' && marker !== '-') {
	    throw new Error(
	      'Cannot serialize items with `' +
	        marker +
	        '` for `options.bullet`, expected `*`, `+`, or `-`'
	    )
	  }
	  return marker
	}

	function checkBulletOther(state) {
	  const bullet = checkBullet(state);
	  const bulletOther = state.options.bulletOther;
	  if (!bulletOther) {
	    return bullet === '*' ? '-' : '*'
	  }
	  if (bulletOther !== '*' && bulletOther !== '+' && bulletOther !== '-') {
	    throw new Error(
	      'Cannot serialize items with `' +
	        bulletOther +
	        '` for `options.bulletOther`, expected `*`, `+`, or `-`'
	    )
	  }
	  if (bulletOther === bullet) {
	    throw new Error(
	      'Expected `bullet` (`' +
	        bullet +
	        '`) and `bulletOther` (`' +
	        bulletOther +
	        '`) to be different'
	    )
	  }
	  return bulletOther
	}

	function checkBulletOrdered(state) {
	  const marker = state.options.bulletOrdered || '.';
	  if (marker !== '.' && marker !== ')') {
	    throw new Error(
	      'Cannot serialize items with `' +
	        marker +
	        '` for `options.bulletOrdered`, expected `.` or `)`'
	    )
	  }
	  return marker
	}

	function checkRule(state) {
	  const marker = state.options.rule || '*';
	  if (marker !== '*' && marker !== '-' && marker !== '_') {
	    throw new Error(
	      'Cannot serialize rules with `' +
	        marker +
	        '` for `options.rule`, expected `*`, `-`, or `_`'
	    )
	  }
	  return marker
	}

	function list(node, parent, state, info) {
	  const exit = state.enter('list');
	  const bulletCurrent = state.bulletCurrent;
	  let bullet = node.ordered ? checkBulletOrdered(state) : checkBullet(state);
	  const bulletOther = node.ordered
	    ? bullet === '.'
	      ? ')'
	      : '.'
	    : checkBulletOther(state);
	  let useDifferentMarker =
	    parent && state.bulletLastUsed ? bullet === state.bulletLastUsed : false;
	  if (!node.ordered) {
	    const firstListItem = node.children ? node.children[0] : undefined;
	    if (
	      (bullet === '*' || bullet === '-') &&
	      firstListItem &&
	      (!firstListItem.children || !firstListItem.children[0]) &&
	      state.stack[state.stack.length - 1] === 'list' &&
	      state.stack[state.stack.length - 2] === 'listItem' &&
	      state.stack[state.stack.length - 3] === 'list' &&
	      state.stack[state.stack.length - 4] === 'listItem' &&
	      state.indexStack[state.indexStack.length - 1] === 0 &&
	      state.indexStack[state.indexStack.length - 2] === 0 &&
	      state.indexStack[state.indexStack.length - 3] === 0
	    ) {
	      useDifferentMarker = true;
	    }
	    if (checkRule(state) === bullet && firstListItem) {
	      let index = -1;
	      while (++index < node.children.length) {
	        const item = node.children[index];
	        if (
	          item &&
	          item.type === 'listItem' &&
	          item.children &&
	          item.children[0] &&
	          item.children[0].type === 'thematicBreak'
	        ) {
	          useDifferentMarker = true;
	          break
	        }
	      }
	    }
	  }
	  if (useDifferentMarker) {
	    bullet = bulletOther;
	  }
	  state.bulletCurrent = bullet;
	  const value = state.containerFlow(node, info);
	  state.bulletLastUsed = bullet;
	  state.bulletCurrent = bulletCurrent;
	  exit();
	  return value
	}

	function checkListItemIndent(state) {
	  const style = state.options.listItemIndent || 'one';
	  if (style !== 'tab' && style !== 'one' && style !== 'mixed') {
	    throw new Error(
	      'Cannot serialize items with `' +
	        style +
	        '` for `options.listItemIndent`, expected `tab`, `one`, or `mixed`'
	    )
	  }
	  return style
	}

	function listItem(node, parent, state, info) {
	  const listItemIndent = checkListItemIndent(state);
	  let bullet = state.bulletCurrent || checkBullet(state);
	  if (parent && parent.type === 'list' && parent.ordered) {
	    bullet =
	      (typeof parent.start === 'number' && parent.start > -1
	        ? parent.start
	        : 1) +
	      (state.options.incrementListMarker === false
	        ? 0
	        : parent.children.indexOf(node)) +
	      bullet;
	  }
	  let size = bullet.length + 1;
	  if (
	    listItemIndent === 'tab' ||
	    (listItemIndent === 'mixed' &&
	      ((parent && parent.type === 'list' && parent.spread) || node.spread))
	  ) {
	    size = Math.ceil(size / 4) * 4;
	  }
	  const tracker = state.createTracker(info);
	  tracker.move(bullet + ' '.repeat(size - bullet.length));
	  tracker.shift(size);
	  const exit = state.enter('listItem');
	  const value = state.indentLines(
	    state.containerFlow(node, tracker.current()),
	    map
	  );
	  exit();
	  return value
	  function map(line, index, blank) {
	    if (index) {
	      return (blank ? '' : ' '.repeat(size)) + line
	    }
	    return (blank ? bullet : bullet + ' '.repeat(size - bullet.length)) + line
	  }
	}

	function paragraph(node, _, state, info) {
	  const exit = state.enter('paragraph');
	  const subexit = state.enter('phrasing');
	  const value = state.containerPhrasing(node, info);
	  subexit();
	  exit();
	  return value
	}

	const phrasing =
	  (
	    convert([
	      'break',
	      'delete',
	      'emphasis',
	      'footnote',
	      'footnoteReference',
	      'image',
	      'imageReference',
	      'inlineCode',
	      'inlineMath',
	      'link',
	      'linkReference',
	      'mdxJsxTextElement',
	      'mdxTextExpression',
	      'strong',
	      'text',
	      'textDirective'
	    ])
	  );

	function root$f(node, _, state, info) {
	  const hasPhrasing = node.children.some(function (d) {
	    return phrasing(d)
	  });
	  const container = hasPhrasing ? state.containerPhrasing : state.containerFlow;
	  return container.call(state, node, info)
	}

	function checkStrong(state) {
	  const marker = state.options.strong || '*';
	  if (marker !== '*' && marker !== '_') {
	    throw new Error(
	      'Cannot serialize strong with `' +
	        marker +
	        '` for `options.strong`, expected `*`, or `_`'
	    )
	  }
	  return marker
	}

	strong.peek = strongPeek;
	function strong(node, _, state, info) {
	  const marker = checkStrong(state);
	  const exit = state.enter('strong');
	  const tracker = state.createTracker(info);
	  const before = tracker.move(marker + marker);
	  let between = tracker.move(
	    state.containerPhrasing(node, {
	      after: marker,
	      before,
	      ...tracker.current()
	    })
	  );
	  const betweenHead = between.charCodeAt(0);
	  const open = encodeInfo(
	    info.before.charCodeAt(info.before.length - 1),
	    betweenHead,
	    marker
	  );
	  if (open.inside) {
	    between = encodeCharacterReference(betweenHead) + between.slice(1);
	  }
	  const betweenTail = between.charCodeAt(between.length - 1);
	  const close = encodeInfo(info.after.charCodeAt(0), betweenTail, marker);
	  if (close.inside) {
	    between = between.slice(0, -1) + encodeCharacterReference(betweenTail);
	  }
	  const after = tracker.move(marker + marker);
	  exit();
	  state.attentionEncodeSurroundingInfo = {
	    after: close.outside,
	    before: open.outside
	  };
	  return before + between + after
	}
	function strongPeek(_, _1, state) {
	  return state.options.strong || '*'
	}

	function text(node, _, state, info) {
	  return state.safe(node.value, info)
	}

	function checkRuleRepetition(state) {
	  const repetition = state.options.ruleRepetition || 3;
	  if (repetition < 3) {
	    throw new Error(
	      'Cannot serialize rules with repetition `' +
	        repetition +
	        '` for `options.ruleRepetition`, expected `3` or more'
	    )
	  }
	  return repetition
	}

	function thematicBreak(_, _1, state) {
	  const value = (
	    checkRule(state) + (state.options.ruleSpaces ? ' ' : '')
	  ).repeat(checkRuleRepetition(state));
	  return state.options.ruleSpaces ? value.slice(0, -1) : value
	}

	const handle = {
	  blockquote,
	  break: hardBreak,
	  code,
	  definition,
	  emphasis,
	  hardBreak,
	  heading,
	  html,
	  image,
	  imageReference,
	  inlineCode,
	  link,
	  linkReference,
	  list,
	  listItem,
	  paragraph,
	  root: root$f,
	  strong,
	  text,
	  thematicBreak
	};

	const join = [joinDefaults];
	function joinDefaults(left, right, parent, state) {
	  if (
	    right.type === 'code' &&
	    formatCodeAsIndented(right, state) &&
	    (left.type === 'list' ||
	      (left.type === right.type && formatCodeAsIndented(left, state)))
	  ) {
	    return false
	  }
	  if ('spread' in parent && typeof parent.spread === 'boolean') {
	    if (
	      left.type === 'paragraph' &&
	      (left.type === right.type ||
	        right.type === 'definition' ||
	        (right.type === 'heading' && formatHeadingAsSetext(right, state)))
	    ) {
	      return
	    }
	    return parent.spread ? 1 : 0
	  }
	}

	const fullPhrasingSpans = [
	  'autolink',
	  'destinationLiteral',
	  'destinationRaw',
	  'reference',
	  'titleQuote',
	  'titleApostrophe'
	];
	const unsafe = [
	  {character: '\t', after: '[\\r\\n]', inConstruct: 'phrasing'},
	  {character: '\t', before: '[\\r\\n]', inConstruct: 'phrasing'},
	  {
	    character: '\t',
	    inConstruct: ['codeFencedLangGraveAccent', 'codeFencedLangTilde']
	  },
	  {
	    character: '\r',
	    inConstruct: [
	      'codeFencedLangGraveAccent',
	      'codeFencedLangTilde',
	      'codeFencedMetaGraveAccent',
	      'codeFencedMetaTilde',
	      'destinationLiteral',
	      'headingAtx'
	    ]
	  },
	  {
	    character: '\n',
	    inConstruct: [
	      'codeFencedLangGraveAccent',
	      'codeFencedLangTilde',
	      'codeFencedMetaGraveAccent',
	      'codeFencedMetaTilde',
	      'destinationLiteral',
	      'headingAtx'
	    ]
	  },
	  {character: ' ', after: '[\\r\\n]', inConstruct: 'phrasing'},
	  {character: ' ', before: '[\\r\\n]', inConstruct: 'phrasing'},
	  {
	    character: ' ',
	    inConstruct: ['codeFencedLangGraveAccent', 'codeFencedLangTilde']
	  },
	  {
	    character: '!',
	    after: '\\[',
	    inConstruct: 'phrasing',
	    notInConstruct: fullPhrasingSpans
	  },
	  {character: '"', inConstruct: 'titleQuote'},
	  {atBreak: true, character: '#'},
	  {character: '#', inConstruct: 'headingAtx', after: '(?:[\r\n]|$)'},
	  {character: '&', after: '[#A-Za-z]', inConstruct: 'phrasing'},
	  {character: "'", inConstruct: 'titleApostrophe'},
	  {character: '(', inConstruct: 'destinationRaw'},
	  {
	    before: '\\]',
	    character: '(',
	    inConstruct: 'phrasing',
	    notInConstruct: fullPhrasingSpans
	  },
	  {atBreak: true, before: '\\d+', character: ')'},
	  {character: ')', inConstruct: 'destinationRaw'},
	  {atBreak: true, character: '*', after: '(?:[ \t\r\n*])'},
	  {character: '*', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans},
	  {atBreak: true, character: '+', after: '(?:[ \t\r\n])'},
	  {atBreak: true, character: '-', after: '(?:[ \t\r\n-])'},
	  {atBreak: true, before: '\\d+', character: '.', after: '(?:[ \t\r\n]|$)'},
	  {atBreak: true, character: '<', after: '[!/?A-Za-z]'},
	  {
	    character: '<',
	    after: '[!/?A-Za-z]',
	    inConstruct: 'phrasing',
	    notInConstruct: fullPhrasingSpans
	  },
	  {character: '<', inConstruct: 'destinationLiteral'},
	  {atBreak: true, character: '='},
	  {atBreak: true, character: '>'},
	  {character: '>', inConstruct: 'destinationLiteral'},
	  {atBreak: true, character: '['},
	  {character: '[', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans},
	  {character: '[', inConstruct: ['label', 'reference']},
	  {character: '\\', after: '[\\r\\n]', inConstruct: 'phrasing'},
	  {character: ']', inConstruct: ['label', 'reference']},
	  {atBreak: true, character: '_'},
	  {character: '_', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans},
	  {atBreak: true, character: '`'},
	  {
	    character: '`',
	    inConstruct: ['codeFencedLangGraveAccent', 'codeFencedMetaGraveAccent']
	  },
	  {character: '`', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans},
	  {atBreak: true, character: '~'}
	];

	const element = document.createElement('i');
	function decodeNamedCharacterReference(value) {
	  const characterReference = '&' + value + ';';
	  element.innerHTML = characterReference;
	  const character = element.textContent;
	  if (
	    character.charCodeAt(character.length - 1) === 59  &&
	    value !== 'semi'
	  ) {
	    return false
	  }
	  return character === characterReference ? false : character
	}

	function decodeNumericCharacterReference(value, base) {
	  const code = Number.parseInt(value, base);
	  if (
	  code < 9 || code === 11 || code > 13 && code < 32 ||
	  code > 126 && code < 160 ||
	  code > 55_295 && code < 57_344 ||
	  code > 64_975 && code < 65_008 ||
	  (code & 65_535) === 65_535 || (code & 65_535) === 65_534 ||
	  code > 1_114_111) {
	    return "\uFFFD";
	  }
	  return String.fromCodePoint(code);
	}

	const characterEscapeOrReference = /\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;
	function decodeString(value) {
	  return value.replace(characterEscapeOrReference, decode);
	}
	function decode($0, $1, $2) {
	  if ($1) {
	    return $1;
	  }
	  const head = $2.charCodeAt(0);
	  if (head === 35) {
	    const head = $2.charCodeAt(1);
	    const hex = head === 120 || head === 88;
	    return decodeNumericCharacterReference($2.slice(hex ? 2 : 1), hex ? 16 : 10);
	  }
	  return decodeNamedCharacterReference($2) || $0;
	}

	function association(node) {
	  if (node.label || !node.identifier) {
	    return node.label || ''
	  }
	  return decodeString(node.identifier)
	}

	function compilePattern(pattern) {
	  if (!pattern._compiled) {
	    const before =
	      (pattern.atBreak ? '[\\r\\n][\\t ]*' : '') +
	      (pattern.before ? '(?:' + pattern.before + ')' : '');
	    pattern._compiled = new RegExp(
	      (before ? '(' + before + ')' : '') +
	        (/[|\\{}()[\]^$+*?.-]/.test(pattern.character) ? '\\' : '') +
	        pattern.character +
	        (pattern.after ? '(?:' + pattern.after + ')' : ''),
	      'g'
	    );
	  }
	  return pattern._compiled
	}

	function containerPhrasing(parent, state, info) {
	  const indexStack = state.indexStack;
	  const children = parent.children || [];
	  const results = [];
	  let index = -1;
	  let before = info.before;
	  let encodeAfter;
	  indexStack.push(-1);
	  let tracker = state.createTracker(info);
	  while (++index < children.length) {
	    const child = children[index];
	    let after;
	    indexStack[indexStack.length - 1] = index;
	    if (index + 1 < children.length) {
	      let handle = state.handle.handlers[children[index + 1].type];
	      if (handle && handle.peek) handle = handle.peek;
	      after = handle
	        ? handle(children[index + 1], parent, state, {
	            before: '',
	            after: '',
	            ...tracker.current()
	          }).charAt(0)
	        : '';
	    } else {
	      after = info.after;
	    }
	    if (
	      results.length > 0 &&
	      (before === '\r' || before === '\n') &&
	      child.type === 'html'
	    ) {
	      results[results.length - 1] = results[results.length - 1].replace(
	        /(\r?\n|\r)$/,
	        ' '
	      );
	      before = ' ';
	      tracker = state.createTracker(info);
	      tracker.move(results.join(''));
	    }
	    let value = state.handle(child, parent, state, {
	      ...tracker.current(),
	      after,
	      before
	    });
	    if (encodeAfter && encodeAfter === value.slice(0, 1)) {
	      value =
	        encodeCharacterReference(encodeAfter.charCodeAt(0)) + value.slice(1);
	    }
	    const encodingInfo = state.attentionEncodeSurroundingInfo;
	    state.attentionEncodeSurroundingInfo = undefined;
	    encodeAfter = undefined;
	    if (encodingInfo) {
	      if (
	        results.length > 0 &&
	        encodingInfo.before &&
	        before === results[results.length - 1].slice(-1)
	      ) {
	        results[results.length - 1] =
	          results[results.length - 1].slice(0, -1) +
	          encodeCharacterReference(before.charCodeAt(0));
	      }
	      if (encodingInfo.after) encodeAfter = after;
	    }
	    tracker.move(value);
	    results.push(value);
	    before = value.slice(-1);
	  }
	  indexStack.pop();
	  return results.join('')
	}

	function containerFlow(parent, state, info) {
	  const indexStack = state.indexStack;
	  const children = parent.children || [];
	  const tracker = state.createTracker(info);
	  const results = [];
	  let index = -1;
	  indexStack.push(-1);
	  while (++index < children.length) {
	    const child = children[index];
	    indexStack[indexStack.length - 1] = index;
	    results.push(
	      tracker.move(
	        state.handle(child, parent, state, {
	          before: '\n',
	          after: '\n',
	          ...tracker.current()
	        })
	      )
	    );
	    if (child.type !== 'list') {
	      state.bulletLastUsed = undefined;
	    }
	    if (index < children.length - 1) {
	      results.push(
	        tracker.move(between(child, children[index + 1], parent, state))
	      );
	    }
	  }
	  indexStack.pop();
	  return results.join('')
	}
	function between(left, right, parent, state) {
	  let index = state.join.length;
	  while (index--) {
	    const result = state.join[index](left, right, parent, state);
	    if (result === true || result === 1) {
	      break
	    }
	    if (typeof result === 'number') {
	      return '\n'.repeat(1 + result)
	    }
	    if (result === false) {
	      return '\n\n<!---->\n\n'
	    }
	  }
	  return '\n\n'
	}

	const eol = /\r?\n|\r/g;
	function indentLines(value, map) {
	  const result = [];
	  let start = 0;
	  let line = 0;
	  let match;
	  while ((match = eol.exec(value))) {
	    one(value.slice(start, match.index));
	    result.push(match[0]);
	    start = match.index + match[0].length;
	    line++;
	  }
	  one(value.slice(start));
	  return result.join('')
	  function one(value) {
	    result.push(map(value, line, !value));
	  }
	}

	function safe(state, input, config) {
	  const value = (config.before || '') + (input || '') + (config.after || '');
	  const positions = [];
	  const result = [];
	  const infos = {};
	  let index = -1;
	  while (++index < state.unsafe.length) {
	    const pattern = state.unsafe[index];
	    if (!patternInScope(state.stack, pattern)) {
	      continue
	    }
	    const expression = state.compilePattern(pattern);
	    let match;
	    while ((match = expression.exec(value))) {
	      const before = 'before' in pattern || Boolean(pattern.atBreak);
	      const after = 'after' in pattern;
	      const position = match.index + (before ? match[1].length : 0);
	      if (positions.includes(position)) {
	        if (infos[position].before && !before) {
	          infos[position].before = false;
	        }
	        if (infos[position].after && !after) {
	          infos[position].after = false;
	        }
	      } else {
	        positions.push(position);
	        infos[position] = {before, after};
	      }
	    }
	  }
	  positions.sort(numerical);
	  let start = config.before ? config.before.length : 0;
	  const end = value.length - (config.after ? config.after.length : 0);
	  index = -1;
	  while (++index < positions.length) {
	    const position = positions[index];
	    if (position < start || position >= end) {
	      continue
	    }
	    if (
	      (position + 1 < end &&
	        positions[index + 1] === position + 1 &&
	        infos[position].after &&
	        !infos[position + 1].before &&
	        !infos[position + 1].after) ||
	      (positions[index - 1] === position - 1 &&
	        infos[position].before &&
	        !infos[position - 1].before &&
	        !infos[position - 1].after)
	    ) {
	      continue
	    }
	    if (start !== position) {
	      result.push(escapeBackslashes(value.slice(start, position), '\\'));
	    }
	    start = position;
	    if (
	      /[!-/:-@[-`{-~]/.test(value.charAt(position)) &&
	      (!config.encode || !config.encode.includes(value.charAt(position)))
	    ) {
	      result.push('\\');
	    } else {
	      result.push(encodeCharacterReference(value.charCodeAt(position)));
	      start++;
	    }
	  }
	  result.push(escapeBackslashes(value.slice(start, end), config.after));
	  return result.join('')
	}
	function numerical(a, b) {
	  return a - b
	}
	function escapeBackslashes(value, after) {
	  const expression = /\\(?=[!-/:-@[-`{-~])/g;
	  const positions = [];
	  const results = [];
	  const whole = value + after;
	  let index = -1;
	  let start = 0;
	  let match;
	  while ((match = expression.exec(whole))) {
	    positions.push(match.index);
	  }
	  while (++index < positions.length) {
	    if (start !== positions[index]) {
	      results.push(value.slice(start, positions[index]));
	    }
	    results.push('\\');
	    start = positions[index];
	  }
	  results.push(value.slice(start));
	  return results.join('')
	}

	function track(config) {
	  const options = config || {};
	  const now = options.now || {};
	  let lineShift = options.lineShift || 0;
	  let line = now.line || 1;
	  let column = now.column || 1;
	  return {move, current, shift}
	  function current() {
	    return {now: {line, column}, lineShift}
	  }
	  function shift(value) {
	    lineShift += value;
	  }
	  function move(input) {
	    const value = input || '';
	    const chunks = value.split(/\r?\n|\r/g);
	    const tail = chunks[chunks.length - 1];
	    line += chunks.length - 1;
	    column =
	      chunks.length === 1 ? column + tail.length : 1 + tail.length + lineShift;
	    return value
	  }
	}

	function toMarkdown(tree, options) {
	  const settings = options || {};
	  const state = {
	    associationId: association,
	    containerPhrasing: containerPhrasingBound,
	    containerFlow: containerFlowBound,
	    createTracker: track,
	    compilePattern,
	    enter,
	    handlers: {...handle},
	    handle: undefined,
	    indentLines,
	    indexStack: [],
	    join: [...join],
	    options: {},
	    safe: safeBound,
	    stack: [],
	    unsafe: [...unsafe]
	  };
	  configure(state, settings);
	  if (state.options.tightDefinitions) {
	    state.join.push(joinDefinition);
	  }
	  state.handle = zwitch('type', {
	    invalid,
	    unknown,
	    handlers: state.handlers
	  });
	  let result = state.handle(tree, undefined, state, {
	    before: '\n',
	    after: '\n',
	    now: {line: 1, column: 1},
	    lineShift: 0
	  });
	  if (
	    result &&
	    result.charCodeAt(result.length - 1) !== 10 &&
	    result.charCodeAt(result.length - 1) !== 13
	  ) {
	    result += '\n';
	  }
	  return result
	  function enter(name) {
	    state.stack.push(name);
	    return exit
	    function exit() {
	      state.stack.pop();
	    }
	  }
	}
	function invalid(value) {
	  throw new Error('Cannot handle value `' + value + '`, expected node')
	}
	function unknown(value) {
	  const node =  (value);
	  throw new Error('Cannot handle unknown node `' + node.type + '`')
	}
	function joinDefinition(left, right) {
	  if (left.type === 'definition' && left.type === right.type) {
	    return 0
	  }
	}
	function containerPhrasingBound(parent, info) {
	  return containerPhrasing(parent, this, info)
	}
	function containerFlowBound(parent, info) {
	  return containerFlow(parent, this, info)
	}
	function safeBound(value, config) {
	  return safe(this, value, config)
	}

	const ALIAS = Symbol.for('yaml.alias');
	const DOC = Symbol.for('yaml.document');
	const MAP = Symbol.for('yaml.map');
	const PAIR = Symbol.for('yaml.pair');
	const SCALAR$1 = Symbol.for('yaml.scalar');
	const SEQ = Symbol.for('yaml.seq');
	const NODE_TYPE = Symbol.for('yaml.node.type');
	const isAlias = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === ALIAS;
	const isDocument = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === DOC;
	const isMap = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === MAP;
	const isPair = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === PAIR;
	const isScalar = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === SCALAR$1;
	const isSeq = (node) => !!node && typeof node === 'object' && node[NODE_TYPE] === SEQ;
	function isCollection(node) {
	    if (node && typeof node === 'object')
	        switch (node[NODE_TYPE]) {
	            case MAP:
	            case SEQ:
	                return true;
	        }
	    return false;
	}
	function isNode(node) {
	    if (node && typeof node === 'object')
	        switch (node[NODE_TYPE]) {
	            case ALIAS:
	            case MAP:
	            case SCALAR$1:
	            case SEQ:
	                return true;
	        }
	    return false;
	}
	const hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;

	const BREAK = Symbol('break visit');
	const SKIP = Symbol('skip children');
	const REMOVE = Symbol('remove node');
	function visit(node, visitor) {
	    const visitor_ = initVisitor(visitor);
	    if (isDocument(node)) {
	        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
	        if (cd === REMOVE)
	            node.contents = null;
	    }
	    else
	        visit_(null, node, visitor_, Object.freeze([]));
	}
	visit.BREAK = BREAK;
	visit.SKIP = SKIP;
	visit.REMOVE = REMOVE;
	function visit_(key, node, visitor, path) {
	    const ctrl = callVisitor(key, node, visitor, path);
	    if (isNode(ctrl) || isPair(ctrl)) {
	        replaceNode(key, path, ctrl);
	        return visit_(key, ctrl, visitor, path);
	    }
	    if (typeof ctrl !== 'symbol') {
	        if (isCollection(node)) {
	            path = Object.freeze(path.concat(node));
	            for (let i = 0; i < node.items.length; ++i) {
	                const ci = visit_(i, node.items[i], visitor, path);
	                if (typeof ci === 'number')
	                    i = ci - 1;
	                else if (ci === BREAK)
	                    return BREAK;
	                else if (ci === REMOVE) {
	                    node.items.splice(i, 1);
	                    i -= 1;
	                }
	            }
	        }
	        else if (isPair(node)) {
	            path = Object.freeze(path.concat(node));
	            const ck = visit_('key', node.key, visitor, path);
	            if (ck === BREAK)
	                return BREAK;
	            else if (ck === REMOVE)
	                node.key = null;
	            const cv = visit_('value', node.value, visitor, path);
	            if (cv === BREAK)
	                return BREAK;
	            else if (cv === REMOVE)
	                node.value = null;
	        }
	    }
	    return ctrl;
	}
	function initVisitor(visitor) {
	    if (typeof visitor === 'object' &&
	        (visitor.Collection || visitor.Node || visitor.Value)) {
	        return Object.assign({
	            Alias: visitor.Node,
	            Map: visitor.Node,
	            Scalar: visitor.Node,
	            Seq: visitor.Node
	        }, visitor.Value && {
	            Map: visitor.Value,
	            Scalar: visitor.Value,
	            Seq: visitor.Value
	        }, visitor.Collection && {
	            Map: visitor.Collection,
	            Seq: visitor.Collection
	        }, visitor);
	    }
	    return visitor;
	}
	function callVisitor(key, node, visitor, path) {
	    if (typeof visitor === 'function')
	        return visitor(key, node, path);
	    if (isMap(node))
	        return visitor.Map?.(key, node, path);
	    if (isSeq(node))
	        return visitor.Seq?.(key, node, path);
	    if (isPair(node))
	        return visitor.Pair?.(key, node, path);
	    if (isScalar(node))
	        return visitor.Scalar?.(key, node, path);
	    if (isAlias(node))
	        return visitor.Alias?.(key, node, path);
	    return undefined;
	}
	function replaceNode(key, path, node) {
	    const parent = path[path.length - 1];
	    if (isCollection(parent)) {
	        parent.items[key] = node;
	    }
	    else if (isPair(parent)) {
	        if (key === 'key')
	            parent.key = node;
	        else
	            parent.value = node;
	    }
	    else if (isDocument(parent)) {
	        parent.contents = node;
	    }
	    else {
	        const pt = isAlias(parent) ? 'alias' : 'scalar';
	        throw new Error(`Cannot replace node with ${pt} parent`);
	    }
	}

	const escapeChars = {
	    '!': '%21',
	    ',': '%2C',
	    '[': '%5B',
	    ']': '%5D',
	    '{': '%7B',
	    '}': '%7D'
	};
	const escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, ch => escapeChars[ch]);
	class Directives {
	    constructor(yaml, tags) {
	        this.docStart = null;
	        this.docEnd = false;
	        this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
	        this.tags = Object.assign({}, Directives.defaultTags, tags);
	    }
	    clone() {
	        const copy = new Directives(this.yaml, this.tags);
	        copy.docStart = this.docStart;
	        return copy;
	    }
	    atDocument() {
	        const res = new Directives(this.yaml, this.tags);
	        switch (this.yaml.version) {
	            case '1.1':
	                this.atNextDocument = true;
	                break;
	            case '1.2':
	                this.atNextDocument = false;
	                this.yaml = {
	                    explicit: Directives.defaultYaml.explicit,
	                    version: '1.2'
	                };
	                this.tags = Object.assign({}, Directives.defaultTags);
	                break;
	        }
	        return res;
	    }
	    add(line, onError) {
	        if (this.atNextDocument) {
	            this.yaml = { explicit: Directives.defaultYaml.explicit, version: '1.1' };
	            this.tags = Object.assign({}, Directives.defaultTags);
	            this.atNextDocument = false;
	        }
	        const parts = line.trim().split(/[ \t]+/);
	        const name = parts.shift();
	        switch (name) {
	            case '%TAG': {
	                if (parts.length !== 2) {
	                    onError(0, '%TAG directive should contain exactly two parts');
	                    if (parts.length < 2)
	                        return false;
	                }
	                const [handle, prefix] = parts;
	                this.tags[handle] = prefix;
	                return true;
	            }
	            case '%YAML': {
	                this.yaml.explicit = true;
	                if (parts.length !== 1) {
	                    onError(0, '%YAML directive should contain exactly one part');
	                    return false;
	                }
	                const [version] = parts;
	                if (version === '1.1' || version === '1.2') {
	                    this.yaml.version = version;
	                    return true;
	                }
	                else {
	                    const isValid = /^\d+\.\d+$/.test(version);
	                    onError(6, `Unsupported YAML version ${version}`, isValid);
	                    return false;
	                }
	            }
	            default:
	                onError(0, `Unknown directive ${name}`, true);
	                return false;
	        }
	    }
	    tagName(source, onError) {
	        if (source === '!')
	            return '!';
	        if (source[0] !== '!') {
	            onError(`Not a valid tag: ${source}`);
	            return null;
	        }
	        if (source[1] === '<') {
	            const verbatim = source.slice(2, -1);
	            if (verbatim === '!' || verbatim === '!!') {
	                onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
	                return null;
	            }
	            if (source[source.length - 1] !== '>')
	                onError('Verbatim tags must end with a >');
	            return verbatim;
	        }
	        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
	        if (!suffix)
	            onError(`The ${source} tag has no suffix`);
	        const prefix = this.tags[handle];
	        if (prefix) {
	            try {
	                return prefix + decodeURIComponent(suffix);
	            }
	            catch (error) {
	                onError(String(error));
	                return null;
	            }
	        }
	        if (handle === '!')
	            return source;
	        onError(`Could not resolve tag: ${source}`);
	        return null;
	    }
	    tagString(tag) {
	        for (const [handle, prefix] of Object.entries(this.tags)) {
	            if (tag.startsWith(prefix))
	                return handle + escapeTagName(tag.substring(prefix.length));
	        }
	        return tag[0] === '!' ? tag : `!<${tag}>`;
	    }
	    toString(doc) {
	        const lines = this.yaml.explicit
	            ? [`%YAML ${this.yaml.version || '1.2'}`]
	            : [];
	        const tagEntries = Object.entries(this.tags);
	        let tagNames;
	        if (doc && tagEntries.length > 0 && isNode(doc.contents)) {
	            const tags = {};
	            visit(doc.contents, (_key, node) => {
	                if (isNode(node) && node.tag)
	                    tags[node.tag] = true;
	            });
	            tagNames = Object.keys(tags);
	        }
	        else
	            tagNames = [];
	        for (const [handle, prefix] of tagEntries) {
	            if (handle === '!!' && prefix === 'tag:yaml.org,2002:')
	                continue;
	            if (!doc || tagNames.some(tn => tn.startsWith(prefix)))
	                lines.push(`%TAG ${handle} ${prefix}`);
	        }
	        return lines.join('\n');
	    }
	}
	Directives.defaultYaml = { explicit: false, version: '1.2' };
	Directives.defaultTags = { '!!': 'tag:yaml.org,2002:' };

	function anchorIsValid(anchor) {
	    if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
	        const sa = JSON.stringify(anchor);
	        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
	        throw new Error(msg);
	    }
	    return true;
	}
	function anchorNames(root) {
	    const anchors = new Set();
	    visit(root, {
	        Value(_key, node) {
	            if (node.anchor)
	                anchors.add(node.anchor);
	        }
	    });
	    return anchors;
	}
	function findNewAnchor(prefix, exclude) {
	    for (let i = 1; true; ++i) {
	        const name = `${prefix}${i}`;
	        if (!exclude.has(name))
	            return name;
	    }
	}
	function createNodeAnchors(doc, prefix) {
	    const aliasObjects = [];
	    const sourceObjects = new Map();
	    let prevAnchors = null;
	    return {
	        onAnchor: (source) => {
	            aliasObjects.push(source);
	            prevAnchors ?? (prevAnchors = anchorNames(doc));
	            const anchor = findNewAnchor(prefix, prevAnchors);
	            prevAnchors.add(anchor);
	            return anchor;
	        },
	        setAnchors: () => {
	            for (const source of aliasObjects) {
	                const ref = sourceObjects.get(source);
	                if (typeof ref === 'object' &&
	                    ref.anchor &&
	                    (isScalar(ref.node) || isCollection(ref.node))) {
	                    ref.node.anchor = ref.anchor;
	                }
	                else {
	                    const error = new Error('Failed to resolve repeated object (this should not happen)');
	                    error.source = source;
	                    throw error;
	                }
	            }
	        },
	        sourceObjects
	    };
	}

	function applyReviver(reviver, obj, key, val) {
	    if (val && typeof val === 'object') {
	        if (Array.isArray(val)) {
	            for (let i = 0, len = val.length; i < len; ++i) {
	                const v0 = val[i];
	                const v1 = applyReviver(reviver, val, String(i), v0);
	                if (v1 === undefined)
	                    delete val[i];
	                else if (v1 !== v0)
	                    val[i] = v1;
	            }
	        }
	        else if (val instanceof Map) {
	            for (const k of Array.from(val.keys())) {
	                const v0 = val.get(k);
	                const v1 = applyReviver(reviver, val, k, v0);
	                if (v1 === undefined)
	                    val.delete(k);
	                else if (v1 !== v0)
	                    val.set(k, v1);
	            }
	        }
	        else if (val instanceof Set) {
	            for (const v0 of Array.from(val)) {
	                const v1 = applyReviver(reviver, val, v0, v0);
	                if (v1 === undefined)
	                    val.delete(v0);
	                else if (v1 !== v0) {
	                    val.delete(v0);
	                    val.add(v1);
	                }
	            }
	        }
	        else {
	            for (const [k, v0] of Object.entries(val)) {
	                const v1 = applyReviver(reviver, val, k, v0);
	                if (v1 === undefined)
	                    delete val[k];
	                else if (v1 !== v0)
	                    val[k] = v1;
	            }
	        }
	    }
	    return reviver.call(obj, key, val);
	}

	function toJS(value, arg, ctx) {
	    if (Array.isArray(value))
	        return value.map((v, i) => toJS(v, String(i), ctx));
	    if (value && typeof value.toJSON === 'function') {
	        if (!ctx || !hasAnchor(value))
	            return value.toJSON(arg, ctx);
	        const data = { aliasCount: 0, count: 1, res: undefined };
	        ctx.anchors.set(value, data);
	        ctx.onCreate = res => {
	            data.res = res;
	            delete ctx.onCreate;
	        };
	        const res = value.toJSON(arg, ctx);
	        if (ctx.onCreate)
	            ctx.onCreate(res);
	        return res;
	    }
	    if (typeof value === 'bigint' && !ctx?.keep)
	        return Number(value);
	    return value;
	}

	class NodeBase {
	    constructor(type) {
	        Object.defineProperty(this, NODE_TYPE, { value: type });
	    }
	    clone() {
	        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
	        if (this.range)
	            copy.range = this.range.slice();
	        return copy;
	    }
	    toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
	        if (!isDocument(doc))
	            throw new TypeError('A document argument is required');
	        const ctx = {
	            anchors: new Map(),
	            doc,
	            keep: true,
	            mapAsMap: mapAsMap === true,
	            mapKeyWarned: false,
	            maxAliasCount: typeof maxAliasCount === 'number' ? maxAliasCount : 100
	        };
	        const res = toJS(this, '', ctx);
	        if (typeof onAnchor === 'function')
	            for (const { count, res } of ctx.anchors.values())
	                onAnchor(res, count);
	        return typeof reviver === 'function'
	            ? applyReviver(reviver, { '': res }, '', res)
	            : res;
	    }
	}

	class Alias extends NodeBase {
	    constructor(source) {
	        super(ALIAS);
	        this.source = source;
	        Object.defineProperty(this, 'tag', {
	            set() {
	                throw new Error('Alias nodes cannot have tags');
	            }
	        });
	    }
	    resolve(doc, ctx) {
	        if (ctx?.maxAliasCount === 0)
	            throw new ReferenceError('Alias resolution is disabled');
	        let nodes;
	        if (ctx?.aliasResolveCache) {
	            nodes = ctx.aliasResolveCache;
	        }
	        else {
	            nodes = [];
	            visit(doc, {
	                Node: (_key, node) => {
	                    if (isAlias(node) || hasAnchor(node))
	                        nodes.push(node);
	                }
	            });
	            if (ctx)
	                ctx.aliasResolveCache = nodes;
	        }
	        let found = undefined;
	        for (const node of nodes) {
	            if (node === this)
	                break;
	            if (node.anchor === this.source)
	                found = node;
	        }
	        return found;
	    }
	    toJSON(_arg, ctx) {
	        if (!ctx)
	            return { source: this.source };
	        const { anchors, doc, maxAliasCount } = ctx;
	        const source = this.resolve(doc, ctx);
	        if (!source) {
	            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
	            throw new ReferenceError(msg);
	        }
	        let data = anchors.get(source);
	        if (!data) {
	            toJS(source, null, ctx);
	            data = anchors.get(source);
	        }
	        if (data?.res === undefined) {
	            const msg = 'This should not happen: Alias anchor was not resolved?';
	            throw new ReferenceError(msg);
	        }
	        if (maxAliasCount >= 0) {
	            data.count += 1;
	            if (data.aliasCount === 0)
	                data.aliasCount = getAliasCount(doc, source, anchors);
	            if (data.count * data.aliasCount > maxAliasCount) {
	                const msg = 'Excessive alias count indicates a resource exhaustion attack';
	                throw new ReferenceError(msg);
	            }
	        }
	        return data.res;
	    }
	    toString(ctx, _onComment, _onChompKeep) {
	        const src = `*${this.source}`;
	        if (ctx) {
	            anchorIsValid(this.source);
	            if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
	                const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
	                throw new Error(msg);
	            }
	            if (ctx.implicitKey)
	                return `${src} `;
	        }
	        return src;
	    }
	}
	function getAliasCount(doc, node, anchors) {
	    if (isAlias(node)) {
	        const source = node.resolve(doc);
	        const anchor = anchors && source && anchors.get(source);
	        return anchor ? anchor.count * anchor.aliasCount : 0;
	    }
	    else if (isCollection(node)) {
	        let count = 0;
	        for (const item of node.items) {
	            const c = getAliasCount(doc, item, anchors);
	            if (c > count)
	                count = c;
	        }
	        return count;
	    }
	    else if (isPair(node)) {
	        const kc = getAliasCount(doc, node.key, anchors);
	        const vc = getAliasCount(doc, node.value, anchors);
	        return Math.max(kc, vc);
	    }
	    return 1;
	}

	const isScalarValue = (value) => !value || (typeof value !== 'function' && typeof value !== 'object');
	class Scalar extends NodeBase {
	    constructor(value) {
	        super(SCALAR$1);
	        this.value = value;
	    }
	    toJSON(arg, ctx) {
	        return ctx?.keep ? this.value : toJS(this.value, arg, ctx);
	    }
	    toString() {
	        return String(this.value);
	    }
	}
	Scalar.BLOCK_FOLDED = 'BLOCK_FOLDED';
	Scalar.BLOCK_LITERAL = 'BLOCK_LITERAL';
	Scalar.PLAIN = 'PLAIN';
	Scalar.QUOTE_DOUBLE = 'QUOTE_DOUBLE';
	Scalar.QUOTE_SINGLE = 'QUOTE_SINGLE';

	const defaultTagPrefix = 'tag:yaml.org,2002:';
	function findTagObject(value, tagName, tags) {
	    if (tagName) {
	        const match = tags.filter(t => t.tag === tagName);
	        const tagObj = match.find(t => !t.format) ?? match[0];
	        if (!tagObj)
	            throw new Error(`Tag ${tagName} not found`);
	        return tagObj;
	    }
	    return tags.find(t => t.identify?.(value) && !t.format);
	}
	function createNode(value, tagName, ctx) {
	    if (isDocument(value))
	        value = value.contents;
	    if (isNode(value))
	        return value;
	    if (isPair(value)) {
	        const map = ctx.schema[MAP].createNode?.(ctx.schema, null, ctx);
	        map.items.push(value);
	        return map;
	    }
	    if (value instanceof String ||
	        value instanceof Number ||
	        value instanceof Boolean ||
	        (typeof BigInt !== 'undefined' && value instanceof BigInt)
	    ) {
	        value = value.valueOf();
	    }
	    const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
	    let ref = undefined;
	    if (aliasDuplicateObjects && value && typeof value === 'object') {
	        ref = sourceObjects.get(value);
	        if (ref) {
	            ref.anchor ?? (ref.anchor = onAnchor(value));
	            return new Alias(ref.anchor);
	        }
	        else {
	            ref = { anchor: null, node: null };
	            sourceObjects.set(value, ref);
	        }
	    }
	    if (tagName?.startsWith('!!'))
	        tagName = defaultTagPrefix + tagName.slice(2);
	    let tagObj = findTagObject(value, tagName, schema.tags);
	    if (!tagObj) {
	        if (value && typeof value.toJSON === 'function') {
	            value = value.toJSON();
	        }
	        if (!value || typeof value !== 'object') {
	            const node = new Scalar(value);
	            if (ref)
	                ref.node = node;
	            return node;
	        }
	        tagObj =
	            value instanceof Map
	                ? schema[MAP]
	                : Symbol.iterator in Object(value)
	                    ? schema[SEQ]
	                    : schema[MAP];
	    }
	    if (onTagObj) {
	        onTagObj(tagObj);
	        delete ctx.onTagObj;
	    }
	    const node = tagObj?.createNode
	        ? tagObj.createNode(ctx.schema, value, ctx)
	        : typeof tagObj?.nodeClass?.from === 'function'
	            ? tagObj.nodeClass.from(ctx.schema, value, ctx)
	            : new Scalar(value);
	    if (tagName)
	        node.tag = tagName;
	    else if (!tagObj.default)
	        node.tag = tagObj.tag;
	    if (ref)
	        ref.node = node;
	    return node;
	}

	function collectionFromPath(schema, path, value) {
	    let v = value;
	    for (let i = path.length - 1; i >= 0; --i) {
	        const k = path[i];
	        if (typeof k === 'number' && Number.isInteger(k) && k >= 0) {
	            const a = [];
	            a[k] = v;
	            v = a;
	        }
	        else {
	            v = new Map([[k, v]]);
	        }
	    }
	    return createNode(v, undefined, {
	        aliasDuplicateObjects: false,
	        keepUndefined: false,
	        onAnchor: () => {
	            throw new Error('This should not happen, please report a bug.');
	        },
	        schema,
	        sourceObjects: new Map()
	    });
	}
	const isEmptyPath = (path) => path == null ||
	    (typeof path === 'object' && !!path[Symbol.iterator]().next().done);
	class Collection extends NodeBase {
	    constructor(type, schema) {
	        super(type);
	        Object.defineProperty(this, 'schema', {
	            value: schema,
	            configurable: true,
	            enumerable: false,
	            writable: true
	        });
	    }
	    clone(schema) {
	        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
	        if (schema)
	            copy.schema = schema;
	        copy.items = copy.items.map(it => isNode(it) || isPair(it) ? it.clone(schema) : it);
	        if (this.range)
	            copy.range = this.range.slice();
	        return copy;
	    }
	    addIn(path, value) {
	        if (isEmptyPath(path))
	            this.add(value);
	        else {
	            const [key, ...rest] = path;
	            const node = this.get(key, true);
	            if (isCollection(node))
	                node.addIn(rest, value);
	            else if (node === undefined && this.schema)
	                this.set(key, collectionFromPath(this.schema, rest, value));
	            else
	                throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
	        }
	    }
	    deleteIn(path) {
	        const [key, ...rest] = path;
	        if (rest.length === 0)
	            return this.delete(key);
	        const node = this.get(key, true);
	        if (isCollection(node))
	            return node.deleteIn(rest);
	        else
	            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
	    }
	    getIn(path, keepScalar) {
	        const [key, ...rest] = path;
	        const node = this.get(key, true);
	        if (rest.length === 0)
	            return !keepScalar && isScalar(node) ? node.value : node;
	        else
	            return isCollection(node) ? node.getIn(rest, keepScalar) : undefined;
	    }
	    hasAllNullValues(allowScalar) {
	        return this.items.every(node => {
	            if (!isPair(node))
	                return false;
	            const n = node.value;
	            return (n == null ||
	                (allowScalar &&
	                    isScalar(n) &&
	                    n.value == null &&
	                    !n.commentBefore &&
	                    !n.comment &&
	                    !n.tag));
	        });
	    }
	    hasIn(path) {
	        const [key, ...rest] = path;
	        if (rest.length === 0)
	            return this.has(key);
	        const node = this.get(key, true);
	        return isCollection(node) ? node.hasIn(rest) : false;
	    }
	    setIn(path, value) {
	        const [key, ...rest] = path;
	        if (rest.length === 0) {
	            this.set(key, value);
	        }
	        else {
	            const node = this.get(key, true);
	            if (isCollection(node))
	                node.setIn(rest, value);
	            else if (node === undefined && this.schema)
	                this.set(key, collectionFromPath(this.schema, rest, value));
	            else
	                throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
	        }
	    }
	}

	const stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, '#');
	function indentComment(comment, indent) {
	    if (/^\n+$/.test(comment))
	        return comment.substring(1);
	    return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
	}
	const lineComment = (str, indent, comment) => str.endsWith('\n')
	    ? indentComment(comment, indent)
	    : comment.includes('\n')
	        ? '\n' + indentComment(comment, indent)
	        : (str.endsWith(' ') ? '' : ' ') + comment;

	const FOLD_FLOW = 'flow';
	const FOLD_BLOCK = 'block';
	const FOLD_QUOTED = 'quoted';
	function foldFlowLines(text, indent, mode = 'flow', { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
	    if (!lineWidth || lineWidth < 0)
	        return text;
	    if (lineWidth < minContentWidth)
	        minContentWidth = 0;
	    const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
	    if (text.length <= endStep)
	        return text;
	    const folds = [];
	    const escapedFolds = {};
	    let end = lineWidth - indent.length;
	    if (typeof indentAtStart === 'number') {
	        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
	            folds.push(0);
	        else
	            end = lineWidth - indentAtStart;
	    }
	    let split = undefined;
	    let prev = undefined;
	    let overflow = false;
	    let i = -1;
	    let escStart = -1;
	    let escEnd = -1;
	    if (mode === FOLD_BLOCK) {
	        i = consumeMoreIndentedLines(text, i, indent.length);
	        if (i !== -1)
	            end = i + endStep;
	    }
	    for (let ch; (ch = text[(i += 1)]);) {
	        if (mode === FOLD_QUOTED && ch === '\\') {
	            escStart = i;
	            switch (text[i + 1]) {
	                case 'x':
	                    i += 3;
	                    break;
	                case 'u':
	                    i += 5;
	                    break;
	                case 'U':
	                    i += 9;
	                    break;
	                default:
	                    i += 1;
	            }
	            escEnd = i;
	        }
	        if (ch === '\n') {
	            if (mode === FOLD_BLOCK)
	                i = consumeMoreIndentedLines(text, i, indent.length);
	            end = i + indent.length + endStep;
	            split = undefined;
	        }
	        else {
	            if (ch === ' ' &&
	                prev &&
	                prev !== ' ' &&
	                prev !== '\n' &&
	                prev !== '\t') {
	                const next = text[i + 1];
	                if (next && next !== ' ' && next !== '\n' && next !== '\t')
	                    split = i;
	            }
	            if (i >= end) {
	                if (split) {
	                    folds.push(split);
	                    end = split + endStep;
	                    split = undefined;
	                }
	                else if (mode === FOLD_QUOTED) {
	                    while (prev === ' ' || prev === '\t') {
	                        prev = ch;
	                        ch = text[(i += 1)];
	                        overflow = true;
	                    }
	                    const j = i > escEnd + 1 ? i - 2 : escStart - 1;
	                    if (escapedFolds[j])
	                        return text;
	                    folds.push(j);
	                    escapedFolds[j] = true;
	                    end = j + endStep;
	                    split = undefined;
	                }
	                else {
	                    overflow = true;
	                }
	            }
	        }
	        prev = ch;
	    }
	    if (overflow && onOverflow)
	        onOverflow();
	    if (folds.length === 0)
	        return text;
	    if (onFold)
	        onFold();
	    let res = text.slice(0, folds[0]);
	    for (let i = 0; i < folds.length; ++i) {
	        const fold = folds[i];
	        const end = folds[i + 1] || text.length;
	        if (fold === 0)
	            res = `\n${indent}${text.slice(0, end)}`;
	        else {
	            if (mode === FOLD_QUOTED && escapedFolds[fold])
	                res += `${text[fold]}\\`;
	            res += `\n${indent}${text.slice(fold + 1, end)}`;
	        }
	    }
	    return res;
	}
	function consumeMoreIndentedLines(text, i, indent) {
	    let end = i;
	    let start = i + 1;
	    let ch = text[start];
	    while (ch === ' ' || ch === '\t') {
	        if (i < start + indent) {
	            ch = text[++i];
	        }
	        else {
	            do {
	                ch = text[++i];
	            } while (ch && ch !== '\n');
	            end = i;
	            start = i + 1;
	            ch = text[start];
	        }
	    }
	    return end;
	}

	const getFoldOptions = (ctx, isBlock) => ({
	    indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
	    lineWidth: ctx.options.lineWidth,
	    minContentWidth: ctx.options.minContentWidth
	});
	const containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
	function lineLengthOverLimit(str, lineWidth, indentLength) {
	    if (!lineWidth || lineWidth < 0)
	        return false;
	    const limit = lineWidth - indentLength;
	    const strLen = str.length;
	    if (strLen <= limit)
	        return false;
	    for (let i = 0, start = 0; i < strLen; ++i) {
	        if (str[i] === '\n') {
	            if (i - start > limit)
	                return true;
	            start = i + 1;
	            if (strLen - start <= limit)
	                return false;
	        }
	    }
	    return true;
	}
	function doubleQuotedString(value, ctx) {
	    const json = JSON.stringify(value);
	    if (ctx.options.doubleQuotedAsJSON)
	        return json;
	    const { implicitKey } = ctx;
	    const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
	    const indent = ctx.indent || (containsDocumentMarker(value) ? '  ' : '');
	    let str = '';
	    let start = 0;
	    for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
	        if (ch === ' ' && json[i + 1] === '\\' && json[i + 2] === 'n') {
	            str += json.slice(start, i) + '\\ ';
	            i += 1;
	            start = i;
	            ch = '\\';
	        }
	        if (ch === '\\')
	            switch (json[i + 1]) {
	                case 'u':
	                    {
	                        str += json.slice(start, i);
	                        const code = json.substr(i + 2, 4);
	                        switch (code) {
	                            case '0000':
	                                str += '\\0';
	                                break;
	                            case '0007':
	                                str += '\\a';
	                                break;
	                            case '000b':
	                                str += '\\v';
	                                break;
	                            case '001b':
	                                str += '\\e';
	                                break;
	                            case '0085':
	                                str += '\\N';
	                                break;
	                            case '00a0':
	                                str += '\\_';
	                                break;
	                            case '2028':
	                                str += '\\L';
	                                break;
	                            case '2029':
	                                str += '\\P';
	                                break;
	                            default:
	                                if (code.substr(0, 2) === '00')
	                                    str += '\\x' + code.substr(2);
	                                else
	                                    str += json.substr(i, 6);
	                        }
	                        i += 5;
	                        start = i + 1;
	                    }
	                    break;
	                case 'n':
	                    if (implicitKey ||
	                        json[i + 2] === '"' ||
	                        json.length < minMultiLineLength) {
	                        i += 1;
	                    }
	                    else {
	                        str += json.slice(start, i) + '\n\n';
	                        while (json[i + 2] === '\\' &&
	                            json[i + 3] === 'n' &&
	                            json[i + 4] !== '"') {
	                            str += '\n';
	                            i += 2;
	                        }
	                        str += indent;
	                        if (json[i + 2] === ' ')
	                            str += '\\';
	                        i += 1;
	                        start = i + 1;
	                    }
	                    break;
	                default:
	                    i += 1;
	            }
	    }
	    str = start ? str + json.slice(start) : json;
	    return implicitKey
	        ? str
	        : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx, false));
	}
	function singleQuotedString(value, ctx) {
	    if (ctx.options.singleQuote === false ||
	        (ctx.implicitKey && value.includes('\n')) ||
	        /[ \t]\n|\n[ \t]/.test(value)
	    )
	        return doubleQuotedString(value, ctx);
	    const indent = ctx.indent || (containsDocumentMarker(value) ? '  ' : '');
	    const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&\n${indent}`) + "'";
	    return ctx.implicitKey
	        ? res
	        : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx, false));
	}
	function quotedString(value, ctx) {
	    const { singleQuote } = ctx.options;
	    let qs;
	    if (singleQuote === false)
	        qs = doubleQuotedString;
	    else {
	        const hasDouble = value.includes('"');
	        const hasSingle = value.includes("'");
	        if (hasDouble && !hasSingle)
	            qs = singleQuotedString;
	        else if (hasSingle && !hasDouble)
	            qs = doubleQuotedString;
	        else
	            qs = singleQuote ? singleQuotedString : doubleQuotedString;
	    }
	    return qs(value, ctx);
	}
	let blockEndNewlines;
	try {
	    blockEndNewlines = new RegExp('(^|(?<!\n))\n+(?!\n|$)', 'g');
	}
	catch {
	    blockEndNewlines = /\n+(?!\n|$)/g;
	}
	function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
	    const { blockQuote, commentString, lineWidth } = ctx.options;
	    if (!blockQuote || /\n[\t ]+$/.test(value)) {
	        return quotedString(value, ctx);
	    }
	    const indent = ctx.indent ||
	        (ctx.forceBlockIndent || containsDocumentMarker(value) ? '  ' : '');
	    const literal = blockQuote === 'literal'
	        ? true
	        : blockQuote === 'folded' || type === Scalar.BLOCK_FOLDED
	            ? false
	            : type === Scalar.BLOCK_LITERAL
	                ? true
	                : !lineLengthOverLimit(value, lineWidth, indent.length);
	    if (!value)
	        return literal ? '|\n' : '>\n';
	    let chomp;
	    let endStart;
	    for (endStart = value.length; endStart > 0; --endStart) {
	        const ch = value[endStart - 1];
	        if (ch !== '\n' && ch !== '\t' && ch !== ' ')
	            break;
	    }
	    let end = value.substring(endStart);
	    const endNlPos = end.indexOf('\n');
	    if (endNlPos === -1) {
	        chomp = '-';
	    }
	    else if (value === end || endNlPos !== end.length - 1) {
	        chomp = '+';
	        if (onChompKeep)
	            onChompKeep();
	    }
	    else {
	        chomp = '';
	    }
	    if (end) {
	        value = value.slice(0, -end.length);
	        if (end[end.length - 1] === '\n')
	            end = end.slice(0, -1);
	        end = end.replace(blockEndNewlines, `$&${indent}`);
	    }
	    let startWithSpace = false;
	    let startEnd;
	    let startNlPos = -1;
	    for (startEnd = 0; startEnd < value.length; ++startEnd) {
	        const ch = value[startEnd];
	        if (ch === ' ')
	            startWithSpace = true;
	        else if (ch === '\n')
	            startNlPos = startEnd;
	        else
	            break;
	    }
	    let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
	    if (start) {
	        value = value.substring(start.length);
	        start = start.replace(/\n+/g, `$&${indent}`);
	    }
	    const indentSize = indent ? '2' : '1';
	    let header = (startWithSpace ? indentSize : '') + chomp;
	    if (comment) {
	        header += ' ' + commentString(comment.replace(/ ?[\r\n]+/g, ' '));
	        if (onComment)
	            onComment();
	    }
	    if (!literal) {
	        const foldedValue = value
	            .replace(/\n+/g, '\n$&')
	            .replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, '$1$2')
	            .replace(/\n+/g, `$&${indent}`);
	        let literalFallback = false;
	        const foldOptions = getFoldOptions(ctx, true);
	        if (blockQuote !== 'folded' && type !== Scalar.BLOCK_FOLDED) {
	            foldOptions.onOverflow = () => {
	                literalFallback = true;
	            };
	        }
	        const body = foldFlowLines(`${start}${foldedValue}${end}`, indent, FOLD_BLOCK, foldOptions);
	        if (!literalFallback)
	            return `>${header}\n${indent}${body}`;
	    }
	    value = value.replace(/\n+/g, `$&${indent}`);
	    return `|${header}\n${indent}${start}${value}${end}`;
	}
	function plainString(item, ctx, onComment, onChompKeep) {
	    const { type, value } = item;
	    const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
	    if ((implicitKey && value.includes('\n')) ||
	        (inFlow && /[[\]{},]/.test(value))) {
	        return quotedString(value, ctx);
	    }
	    if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
	        return implicitKey || inFlow || !value.includes('\n')
	            ? quotedString(value, ctx)
	            : blockString(item, ctx, onComment, onChompKeep);
	    }
	    if (!implicitKey &&
	        !inFlow &&
	        type !== Scalar.PLAIN &&
	        value.includes('\n')) {
	        return blockString(item, ctx, onComment, onChompKeep);
	    }
	    if (containsDocumentMarker(value)) {
	        if (indent === '') {
	            ctx.forceBlockIndent = true;
	            return blockString(item, ctx, onComment, onChompKeep);
	        }
	        else if (implicitKey && indent === indentStep) {
	            return quotedString(value, ctx);
	        }
	    }
	    const str = value.replace(/\n+/g, `$&\n${indent}`);
	    if (actualString) {
	        const test = (tag) => tag.default && tag.tag !== 'tag:yaml.org,2002:str' && tag.test?.test(str);
	        const { compat, tags } = ctx.doc.schema;
	        if (tags.some(test) || compat?.some(test))
	            return quotedString(value, ctx);
	    }
	    return implicitKey
	        ? str
	        : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx, false));
	}
	function stringifyString(item, ctx, onComment, onChompKeep) {
	    const { implicitKey, inFlow } = ctx;
	    const ss = typeof item.value === 'string'
	        ? item
	        : Object.assign({}, item, { value: String(item.value) });
	    let { type } = item;
	    if (type !== Scalar.QUOTE_DOUBLE) {
	        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
	            type = Scalar.QUOTE_DOUBLE;
	    }
	    const _stringify = (_type) => {
	        switch (_type) {
	            case Scalar.BLOCK_FOLDED:
	            case Scalar.BLOCK_LITERAL:
	                return implicitKey || inFlow
	                    ? quotedString(ss.value, ctx)
	                    : blockString(ss, ctx, onComment, onChompKeep);
	            case Scalar.QUOTE_DOUBLE:
	                return doubleQuotedString(ss.value, ctx);
	            case Scalar.QUOTE_SINGLE:
	                return singleQuotedString(ss.value, ctx);
	            case Scalar.PLAIN:
	                return plainString(ss, ctx, onComment, onChompKeep);
	            default:
	                return null;
	        }
	    };
	    let res = _stringify(type);
	    if (res === null) {
	        const { defaultKeyType, defaultStringType } = ctx.options;
	        const t = (implicitKey && defaultKeyType) || defaultStringType;
	        res = _stringify(t);
	        if (res === null)
	            throw new Error(`Unsupported default string type ${t}`);
	    }
	    return res;
	}

	function createStringifyContext(doc, options) {
	    const opt = Object.assign({
	        blockQuote: true,
	        commentString: stringifyComment,
	        defaultKeyType: null,
	        defaultStringType: 'PLAIN',
	        directives: null,
	        doubleQuotedAsJSON: false,
	        doubleQuotedMinMultiLineLength: 40,
	        falseStr: 'false',
	        flowCollectionPadding: true,
	        indentSeq: true,
	        lineWidth: 80,
	        minContentWidth: 20,
	        nullStr: 'null',
	        simpleKeys: false,
	        singleQuote: null,
	        trailingComma: false,
	        trueStr: 'true',
	        verifyAliasOrder: true
	    }, doc.schema.toStringOptions, options);
	    let inFlow;
	    switch (opt.collectionStyle) {
	        case 'block':
	            inFlow = false;
	            break;
	        case 'flow':
	            inFlow = true;
	            break;
	        default:
	            inFlow = null;
	    }
	    return {
	        anchors: new Set(),
	        doc,
	        flowCollectionPadding: opt.flowCollectionPadding ? ' ' : '',
	        indent: '',
	        indentStep: typeof opt.indent === 'number' ? ' '.repeat(opt.indent) : '  ',
	        inFlow,
	        options: opt
	    };
	}
	function getTagObject(tags, item) {
	    if (item.tag) {
	        const match = tags.filter(t => t.tag === item.tag);
	        if (match.length > 0)
	            return match.find(t => t.format === item.format) ?? match[0];
	    }
	    let tagObj = undefined;
	    let obj;
	    if (isScalar(item)) {
	        obj = item.value;
	        let match = tags.filter(t => t.identify?.(obj));
	        if (match.length > 1) {
	            const testMatch = match.filter(t => t.test);
	            if (testMatch.length > 0)
	                match = testMatch;
	        }
	        tagObj =
	            match.find(t => t.format === item.format) ?? match.find(t => !t.format);
	    }
	    else {
	        obj = item;
	        tagObj = tags.find(t => t.nodeClass && obj instanceof t.nodeClass);
	    }
	    if (!tagObj) {
	        const name = obj?.constructor?.name ?? (obj === null ? 'null' : typeof obj);
	        throw new Error(`Tag not resolved for ${name} value`);
	    }
	    return tagObj;
	}
	function stringifyProps(node, tagObj, { anchors, doc }) {
	    if (!doc.directives)
	        return '';
	    const props = [];
	    const anchor = (isScalar(node) || isCollection(node)) && node.anchor;
	    if (anchor && anchorIsValid(anchor)) {
	        anchors.add(anchor);
	        props.push(`&${anchor}`);
	    }
	    const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
	    if (tag)
	        props.push(doc.directives.tagString(tag));
	    return props.join(' ');
	}
	function stringify$1(item, ctx, onComment, onChompKeep) {
	    if (isPair(item))
	        return item.toString(ctx, onComment, onChompKeep);
	    if (isAlias(item)) {
	        if (ctx.doc.directives)
	            return item.toString(ctx);
	        if (ctx.resolvedAliases?.has(item)) {
	            throw new TypeError(`Cannot stringify circular structure without alias nodes`);
	        }
	        else {
	            if (ctx.resolvedAliases)
	                ctx.resolvedAliases.add(item);
	            else
	                ctx.resolvedAliases = new Set([item]);
	            item = item.resolve(ctx.doc);
	        }
	    }
	    let tagObj = undefined;
	    const node = isNode(item)
	        ? item
	        : ctx.doc.createNode(item, { onTagObj: o => (tagObj = o) });
	    tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
	    const props = stringifyProps(node, tagObj, ctx);
	    if (props.length > 0)
	        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
	    const str = typeof tagObj.stringify === 'function'
	        ? tagObj.stringify(node, ctx, onComment, onChompKeep)
	        : isScalar(node)
	            ? stringifyString(node, ctx, onComment, onChompKeep)
	            : node.toString(ctx, onComment, onChompKeep);
	    if (!props)
	        return str;
	    return isScalar(node) || str[0] === '{' || str[0] === '['
	        ? `${props} ${str}`
	        : `${props}\n${ctx.indent}${str}`;
	}

	function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
	    const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
	    let keyComment = (isNode(key) && key.comment) || null;
	    if (simpleKeys) {
	        if (keyComment) {
	            throw new Error('With simple keys, key nodes cannot have comments');
	        }
	        if (isCollection(key) || (!isNode(key) && typeof key === 'object')) {
	            const msg = 'With simple keys, collection cannot be used as a key value';
	            throw new Error(msg);
	        }
	    }
	    let explicitKey = !simpleKeys &&
	        (!key ||
	            (keyComment && value == null && !ctx.inFlow) ||
	            isCollection(key) ||
	            (isScalar(key)
	                ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL
	                : typeof key === 'object'));
	    ctx = Object.assign({}, ctx, {
	        allNullValues: false,
	        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
	        indent: indent + indentStep
	    });
	    let keyCommentDone = false;
	    let chompKeep = false;
	    let str = stringify$1(key, ctx, () => (keyCommentDone = true), () => (chompKeep = true));
	    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
	        if (simpleKeys)
	            throw new Error('With simple keys, single line scalar must not span more than 1024 characters');
	        explicitKey = true;
	    }
	    if (ctx.inFlow) {
	        if (allNullValues || value == null) {
	            if (keyCommentDone && onComment)
	                onComment();
	            return str === '' ? '?' : explicitKey ? `? ${str}` : str;
	        }
	    }
	    else if ((allNullValues && !simpleKeys) || (value == null && explicitKey)) {
	        str = `? ${str}`;
	        if (keyComment && !keyCommentDone) {
	            str += lineComment(str, ctx.indent, commentString(keyComment));
	        }
	        else if (chompKeep && onChompKeep)
	            onChompKeep();
	        return str;
	    }
	    if (keyCommentDone)
	        keyComment = null;
	    if (explicitKey) {
	        if (keyComment)
	            str += lineComment(str, ctx.indent, commentString(keyComment));
	        str = `? ${str}\n${indent}:`;
	    }
	    else {
	        str = `${str}:`;
	        if (keyComment)
	            str += lineComment(str, ctx.indent, commentString(keyComment));
	    }
	    let vsb, vcb, valueComment;
	    if (isNode(value)) {
	        vsb = !!value.spaceBefore;
	        vcb = value.commentBefore;
	        valueComment = value.comment;
	    }
	    else {
	        vsb = false;
	        vcb = null;
	        valueComment = null;
	        if (value && typeof value === 'object')
	            value = doc.createNode(value);
	    }
	    ctx.implicitKey = false;
	    if (!explicitKey && !keyComment && isScalar(value))
	        ctx.indentAtStart = str.length + 1;
	    chompKeep = false;
	    if (!indentSeq &&
	        indentStep.length >= 2 &&
	        !ctx.inFlow &&
	        !explicitKey &&
	        isSeq(value) &&
	        !value.flow &&
	        !value.tag &&
	        !value.anchor) {
	        ctx.indent = ctx.indent.substring(2);
	    }
	    let valueCommentDone = false;
	    const valueStr = stringify$1(value, ctx, () => (valueCommentDone = true), () => (chompKeep = true));
	    let ws = ' ';
	    if (keyComment || vsb || vcb) {
	        ws = vsb ? '\n' : '';
	        if (vcb) {
	            const cs = commentString(vcb);
	            ws += `\n${indentComment(cs, ctx.indent)}`;
	        }
	        if (valueStr === '' && !ctx.inFlow) {
	            if (ws === '\n' && valueComment)
	                ws = '\n\n';
	        }
	        else {
	            ws += `\n${ctx.indent}`;
	        }
	    }
	    else if (!explicitKey && isCollection(value)) {
	        const vs0 = valueStr[0];
	        const nl0 = valueStr.indexOf('\n');
	        const hasNewline = nl0 !== -1;
	        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
	        if (hasNewline || !flow) {
	            let hasPropsLine = false;
	            if (hasNewline && (vs0 === '&' || vs0 === '!')) {
	                let sp0 = valueStr.indexOf(' ');
	                if (vs0 === '&' &&
	                    sp0 !== -1 &&
	                    sp0 < nl0 &&
	                    valueStr[sp0 + 1] === '!') {
	                    sp0 = valueStr.indexOf(' ', sp0 + 1);
	                }
	                if (sp0 === -1 || nl0 < sp0)
	                    hasPropsLine = true;
	            }
	            if (!hasPropsLine)
	                ws = `\n${ctx.indent}`;
	        }
	    }
	    else if (valueStr === '' || valueStr[0] === '\n') {
	        ws = '';
	    }
	    str += ws + valueStr;
	    if (ctx.inFlow) {
	        if (valueCommentDone && onComment)
	            onComment();
	    }
	    else if (valueComment && !valueCommentDone) {
	        str += lineComment(str, ctx.indent, commentString(valueComment));
	    }
	    else if (chompKeep && onChompKeep) {
	        onChompKeep();
	    }
	    return str;
	}

	function warn(logLevel, warning) {
	    if (logLevel === 'debug' || logLevel === 'warn') {
	        console.warn(warning);
	    }
	}

	const MERGE_KEY = '<<';
	const merge = {
	    identify: value => value === MERGE_KEY ||
	        (typeof value === 'symbol' && value.description === MERGE_KEY),
	    default: 'key',
	    tag: 'tag:yaml.org,2002:merge',
	    test: /^<<$/,
	    resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), {
	        addToJSMap: addMergeToJSMap
	    }),
	    stringify: () => MERGE_KEY
	};
	const isMergeKey = (ctx, key) => (merge.identify(key) ||
	    (isScalar(key) &&
	        (!key.type || key.type === Scalar.PLAIN) &&
	        merge.identify(key.value))) &&
	    ctx?.doc.schema.tags.some(tag => tag.tag === merge.tag && tag.default);
	function addMergeToJSMap(ctx, map, value) {
	    const source = resolveAliasValue(ctx, value);
	    if (isSeq(source))
	        for (const it of source.items)
	            mergeValue(ctx, map, it);
	    else if (Array.isArray(source))
	        for (const it of source)
	            mergeValue(ctx, map, it);
	    else
	        mergeValue(ctx, map, source);
	}
	function mergeValue(ctx, map, value) {
	    const source = resolveAliasValue(ctx, value);
	    if (!isMap(source))
	        throw new Error('Merge sources must be maps or map aliases');
	    const srcMap = source.toJSON(null, ctx, Map);
	    for (const [key, value] of srcMap) {
	        if (map instanceof Map) {
	            if (!map.has(key))
	                map.set(key, value);
	        }
	        else if (map instanceof Set) {
	            map.add(key);
	        }
	        else if (!Object.prototype.hasOwnProperty.call(map, key)) {
	            Object.defineProperty(map, key, {
	                value,
	                writable: true,
	                enumerable: true,
	                configurable: true
	            });
	        }
	    }
	    return map;
	}
	function resolveAliasValue(ctx, value) {
	    return ctx && isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
	}

	function addPairToJSMap(ctx, map, { key, value }) {
	    if (isNode(key) && key.addToJSMap)
	        key.addToJSMap(ctx, map, value);
	    else if (isMergeKey(ctx, key))
	        addMergeToJSMap(ctx, map, value);
	    else {
	        const jsKey = toJS(key, '', ctx);
	        if (map instanceof Map) {
	            map.set(jsKey, toJS(value, jsKey, ctx));
	        }
	        else if (map instanceof Set) {
	            map.add(jsKey);
	        }
	        else {
	            const stringKey = stringifyKey(key, jsKey, ctx);
	            const jsValue = toJS(value, stringKey, ctx);
	            if (stringKey in map)
	                Object.defineProperty(map, stringKey, {
	                    value: jsValue,
	                    writable: true,
	                    enumerable: true,
	                    configurable: true
	                });
	            else
	                map[stringKey] = jsValue;
	        }
	    }
	    return map;
	}
	function stringifyKey(key, jsKey, ctx) {
	    if (jsKey === null)
	        return '';
	    if (typeof jsKey !== 'object')
	        return String(jsKey);
	    if (isNode(key) && ctx?.doc) {
	        const strCtx = createStringifyContext(ctx.doc, {});
	        strCtx.anchors = new Set();
	        for (const node of ctx.anchors.keys())
	            strCtx.anchors.add(node.anchor);
	        strCtx.inFlow = true;
	        strCtx.inStringifyKey = true;
	        const strKey = key.toString(strCtx);
	        if (!ctx.mapKeyWarned) {
	            let jsonStr = JSON.stringify(strKey);
	            if (jsonStr.length > 40)
	                jsonStr = jsonStr.substring(0, 36) + '..."';
	            warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
	            ctx.mapKeyWarned = true;
	        }
	        return strKey;
	    }
	    return JSON.stringify(jsKey);
	}

	function createPair(key, value, ctx) {
	    const k = createNode(key, undefined, ctx);
	    const v = createNode(value, undefined, ctx);
	    return new Pair(k, v);
	}
	class Pair {
	    constructor(key, value = null) {
	        Object.defineProperty(this, NODE_TYPE, { value: PAIR });
	        this.key = key;
	        this.value = value;
	    }
	    clone(schema) {
	        let { key, value } = this;
	        if (isNode(key))
	            key = key.clone(schema);
	        if (isNode(value))
	            value = value.clone(schema);
	        return new Pair(key, value);
	    }
	    toJSON(_, ctx) {
	        const pair = ctx?.mapAsMap ? new Map() : {};
	        return addPairToJSMap(ctx, pair, this);
	    }
	    toString(ctx, onComment, onChompKeep) {
	        return ctx?.doc
	            ? stringifyPair(this, ctx, onComment, onChompKeep)
	            : JSON.stringify(this);
	    }
	}

	function stringifyCollection(collection, ctx, options) {
	    const flow = ctx.inFlow ?? collection.flow;
	    const stringify = flow ? stringifyFlowCollection : stringifyBlockCollection;
	    return stringify(collection, ctx, options);
	}
	function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
	    const { indent, options: { commentString } } = ctx;
	    const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
	    let chompKeep = false;
	    const lines = [];
	    for (let i = 0; i < items.length; ++i) {
	        const item = items[i];
	        let comment = null;
	        if (isNode(item)) {
	            if (!chompKeep && item.spaceBefore)
	                lines.push('');
	            addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
	            if (item.comment)
	                comment = item.comment;
	        }
	        else if (isPair(item)) {
	            const ik = isNode(item.key) ? item.key : null;
	            if (ik) {
	                if (!chompKeep && ik.spaceBefore)
	                    lines.push('');
	                addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
	            }
	        }
	        chompKeep = false;
	        let str = stringify$1(item, itemCtx, () => (comment = null), () => (chompKeep = true));
	        if (comment)
	            str += lineComment(str, itemIndent, commentString(comment));
	        if (chompKeep && comment)
	            chompKeep = false;
	        lines.push(blockItemPrefix + str);
	    }
	    let str;
	    if (lines.length === 0) {
	        str = flowChars.start + flowChars.end;
	    }
	    else {
	        str = lines[0];
	        for (let i = 1; i < lines.length; ++i) {
	            const line = lines[i];
	            str += line ? `\n${indent}${line}` : '\n';
	        }
	    }
	    if (comment) {
	        str += '\n' + indentComment(commentString(comment), indent);
	        if (onComment)
	            onComment();
	    }
	    else if (chompKeep && onChompKeep)
	        onChompKeep();
	    return str;
	}
	function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
	    const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
	    itemIndent += indentStep;
	    const itemCtx = Object.assign({}, ctx, {
	        indent: itemIndent,
	        inFlow: true,
	        type: null
	    });
	    let reqNewline = false;
	    let linesAtValue = 0;
	    const lines = [];
	    for (let i = 0; i < items.length; ++i) {
	        const item = items[i];
	        let comment = null;
	        if (isNode(item)) {
	            if (item.spaceBefore)
	                lines.push('');
	            addCommentBefore(ctx, lines, item.commentBefore, false);
	            if (item.comment)
	                comment = item.comment;
	        }
	        else if (isPair(item)) {
	            const ik = isNode(item.key) ? item.key : null;
	            if (ik) {
	                if (ik.spaceBefore)
	                    lines.push('');
	                addCommentBefore(ctx, lines, ik.commentBefore, false);
	                if (ik.comment)
	                    reqNewline = true;
	            }
	            const iv = isNode(item.value) ? item.value : null;
	            if (iv) {
	                if (iv.comment)
	                    comment = iv.comment;
	                if (iv.commentBefore)
	                    reqNewline = true;
	            }
	            else if (item.value == null && ik?.comment) {
	                comment = ik.comment;
	            }
	        }
	        if (comment)
	            reqNewline = true;
	        let str = stringify$1(item, itemCtx, () => (comment = null));
	        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes('\n'));
	        if (i < items.length - 1) {
	            str += ',';
	        }
	        else if (ctx.options.trailingComma) {
	            if (ctx.options.lineWidth > 0) {
	                reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) +
	                    (str.length + 2) >
	                    ctx.options.lineWidth);
	            }
	            if (reqNewline) {
	                str += ',';
	            }
	        }
	        if (comment)
	            str += lineComment(str, itemIndent, commentString(comment));
	        lines.push(str);
	        linesAtValue = lines.length;
	    }
	    const { start, end } = flowChars;
	    if (lines.length === 0) {
	        return start + end;
	    }
	    else {
	        if (!reqNewline) {
	            const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
	            reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
	        }
	        if (reqNewline) {
	            let str = start;
	            for (const line of lines)
	                str += line ? `\n${indentStep}${indent}${line}` : '\n';
	            return `${str}\n${indent}${end}`;
	        }
	        else {
	            return `${start}${fcPadding}${lines.join(' ')}${fcPadding}${end}`;
	        }
	    }
	}
	function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
	    if (comment && chompKeep)
	        comment = comment.replace(/^\n+/, '');
	    if (comment) {
	        const ic = indentComment(commentString(comment), indent);
	        lines.push(ic.trimStart());
	    }
	}

	function findPair(items, key) {
	    const k = isScalar(key) ? key.value : key;
	    for (const it of items) {
	        if (isPair(it)) {
	            if (it.key === key || it.key === k)
	                return it;
	            if (isScalar(it.key) && it.key.value === k)
	                return it;
	        }
	    }
	    return undefined;
	}
	class YAMLMap extends Collection {
	    static get tagName() {
	        return 'tag:yaml.org,2002:map';
	    }
	    constructor(schema) {
	        super(MAP, schema);
	        this.items = [];
	    }
	    static from(schema, obj, ctx) {
	        const { keepUndefined, replacer } = ctx;
	        const map = new this(schema);
	        const add = (key, value) => {
	            if (typeof replacer === 'function')
	                value = replacer.call(obj, key, value);
	            else if (Array.isArray(replacer) && !replacer.includes(key))
	                return;
	            if (value !== undefined || keepUndefined)
	                map.items.push(createPair(key, value, ctx));
	        };
	        if (obj instanceof Map) {
	            for (const [key, value] of obj)
	                add(key, value);
	        }
	        else if (obj && typeof obj === 'object') {
	            for (const key of Object.keys(obj))
	                add(key, obj[key]);
	        }
	        if (typeof schema.sortMapEntries === 'function') {
	            map.items.sort(schema.sortMapEntries);
	        }
	        return map;
	    }
	    add(pair, overwrite) {
	        let _pair;
	        if (isPair(pair))
	            _pair = pair;
	        else if (!pair || typeof pair !== 'object' || !('key' in pair)) {
	            _pair = new Pair(pair, pair?.value);
	        }
	        else
	            _pair = new Pair(pair.key, pair.value);
	        const prev = findPair(this.items, _pair.key);
	        const sortEntries = this.schema?.sortMapEntries;
	        if (prev) {
	            if (!overwrite)
	                throw new Error(`Key ${_pair.key} already set`);
	            if (isScalar(prev.value) && isScalarValue(_pair.value))
	                prev.value.value = _pair.value;
	            else
	                prev.value = _pair.value;
	        }
	        else if (sortEntries) {
	            const i = this.items.findIndex(item => sortEntries(_pair, item) < 0);
	            if (i === -1)
	                this.items.push(_pair);
	            else
	                this.items.splice(i, 0, _pair);
	        }
	        else {
	            this.items.push(_pair);
	        }
	    }
	    delete(key) {
	        const it = findPair(this.items, key);
	        if (!it)
	            return false;
	        const del = this.items.splice(this.items.indexOf(it), 1);
	        return del.length > 0;
	    }
	    get(key, keepScalar) {
	        const it = findPair(this.items, key);
	        const node = it?.value;
	        return (!keepScalar && isScalar(node) ? node.value : node) ?? undefined;
	    }
	    has(key) {
	        return !!findPair(this.items, key);
	    }
	    set(key, value) {
	        this.add(new Pair(key, value), true);
	    }
	    toJSON(_, ctx, Type) {
	        const map = Type ? new Type() : ctx?.mapAsMap ? new Map() : {};
	        if (ctx?.onCreate)
	            ctx.onCreate(map);
	        for (const item of this.items)
	            addPairToJSMap(ctx, map, item);
	        return map;
	    }
	    toString(ctx, onComment, onChompKeep) {
	        if (!ctx)
	            return JSON.stringify(this);
	        for (const item of this.items) {
	            if (!isPair(item))
	                throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
	        }
	        if (!ctx.allNullValues && this.hasAllNullValues(false))
	            ctx = Object.assign({}, ctx, { allNullValues: true });
	        return stringifyCollection(this, ctx, {
	            blockItemPrefix: '',
	            flowChars: { start: '{', end: '}' },
	            itemIndent: ctx.indent || '',
	            onChompKeep,
	            onComment
	        });
	    }
	}

	const map = {
	    collection: 'map',
	    default: true,
	    nodeClass: YAMLMap,
	    tag: 'tag:yaml.org,2002:map',
	    resolve(map, onError) {
	        if (!isMap(map))
	            onError('Expected a mapping for this tag');
	        return map;
	    },
	    createNode: (schema, obj, ctx) => YAMLMap.from(schema, obj, ctx)
	};

	class YAMLSeq extends Collection {
	    static get tagName() {
	        return 'tag:yaml.org,2002:seq';
	    }
	    constructor(schema) {
	        super(SEQ, schema);
	        this.items = [];
	    }
	    add(value) {
	        this.items.push(value);
	    }
	    delete(key) {
	        const idx = asItemIndex(key);
	        if (typeof idx !== 'number')
	            return false;
	        const del = this.items.splice(idx, 1);
	        return del.length > 0;
	    }
	    get(key, keepScalar) {
	        const idx = asItemIndex(key);
	        if (typeof idx !== 'number')
	            return undefined;
	        const it = this.items[idx];
	        return !keepScalar && isScalar(it) ? it.value : it;
	    }
	    has(key) {
	        const idx = asItemIndex(key);
	        return typeof idx === 'number' && idx < this.items.length;
	    }
	    set(key, value) {
	        const idx = asItemIndex(key);
	        if (typeof idx !== 'number')
	            throw new Error(`Expected a valid index, not ${key}.`);
	        const prev = this.items[idx];
	        if (isScalar(prev) && isScalarValue(value))
	            prev.value = value;
	        else
	            this.items[idx] = value;
	    }
	    toJSON(_, ctx) {
	        const seq = [];
	        if (ctx?.onCreate)
	            ctx.onCreate(seq);
	        let i = 0;
	        for (const item of this.items)
	            seq.push(toJS(item, String(i++), ctx));
	        return seq;
	    }
	    toString(ctx, onComment, onChompKeep) {
	        if (!ctx)
	            return JSON.stringify(this);
	        return stringifyCollection(this, ctx, {
	            blockItemPrefix: '- ',
	            flowChars: { start: '[', end: ']' },
	            itemIndent: (ctx.indent || '') + '  ',
	            onChompKeep,
	            onComment
	        });
	    }
	    static from(schema, obj, ctx) {
	        const { replacer } = ctx;
	        const seq = new this(schema);
	        if (obj && Symbol.iterator in Object(obj)) {
	            let i = 0;
	            for (let it of obj) {
	                if (typeof replacer === 'function') {
	                    const key = obj instanceof Set ? it : String(i++);
	                    it = replacer.call(obj, key, it);
	                }
	                seq.items.push(createNode(it, undefined, ctx));
	            }
	        }
	        return seq;
	    }
	}
	function asItemIndex(key) {
	    let idx = isScalar(key) ? key.value : key;
	    if (idx && typeof idx === 'string')
	        idx = Number(idx);
	    return typeof idx === 'number' && Number.isInteger(idx) && idx >= 0
	        ? idx
	        : null;
	}

	const seq = {
	    collection: 'seq',
	    default: true,
	    nodeClass: YAMLSeq,
	    tag: 'tag:yaml.org,2002:seq',
	    resolve(seq, onError) {
	        if (!isSeq(seq))
	            onError('Expected a sequence for this tag');
	        return seq;
	    },
	    createNode: (schema, obj, ctx) => YAMLSeq.from(schema, obj, ctx)
	};

	const string = {
	    identify: value => typeof value === 'string',
	    default: true,
	    tag: 'tag:yaml.org,2002:str',
	    resolve: str => str,
	    stringify(item, ctx, onComment, onChompKeep) {
	        ctx = Object.assign({ actualString: true }, ctx);
	        return stringifyString(item, ctx, onComment, onChompKeep);
	    }
	};

	const nullTag = {
	    identify: value => value == null,
	    createNode: () => new Scalar(null),
	    default: true,
	    tag: 'tag:yaml.org,2002:null',
	    test: /^(?:~|[Nn]ull|NULL)?$/,
	    resolve: () => new Scalar(null),
	    stringify: ({ source }, ctx) => typeof source === 'string' && nullTag.test.test(source)
	        ? source
	        : ctx.options.nullStr
	};

	const boolTag = {
	    identify: value => typeof value === 'boolean',
	    default: true,
	    tag: 'tag:yaml.org,2002:bool',
	    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
	    resolve: str => new Scalar(str[0] === 't' || str[0] === 'T'),
	    stringify({ source, value }, ctx) {
	        if (source && boolTag.test.test(source)) {
	            const sv = source[0] === 't' || source[0] === 'T';
	            if (value === sv)
	                return source;
	        }
	        return value ? ctx.options.trueStr : ctx.options.falseStr;
	    }
	};

	function stringifyNumber({ format, minFractionDigits, tag, value }) {
	    if (typeof value === 'bigint')
	        return String(value);
	    const num = typeof value === 'number' ? value : Number(value);
	    if (!isFinite(num))
	        return isNaN(num) ? '.nan' : num < 0 ? '-.inf' : '.inf';
	    let n = Object.is(value, -0) ? '-0' : JSON.stringify(value);
	    if (!format &&
	        minFractionDigits &&
	        (!tag || tag === 'tag:yaml.org,2002:float') &&
	        /^-?\d/.test(n) &&
	        !n.includes('e')) {
	        let i = n.indexOf('.');
	        if (i < 0) {
	            i = n.length;
	            n += '.';
	        }
	        let d = minFractionDigits - (n.length - i - 1);
	        while (d-- > 0)
	            n += '0';
	    }
	    return n;
	}

	const floatNaN$1 = {
	    identify: value => typeof value === 'number',
	    default: true,
	    tag: 'tag:yaml.org,2002:float',
	    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
	    resolve: str => str.slice(-3).toLowerCase() === 'nan'
	        ? NaN
	        : str[0] === '-'
	            ? Number.NEGATIVE_INFINITY
	            : Number.POSITIVE_INFINITY,
	    stringify: stringifyNumber
	};
	const floatExp$1 = {
	    identify: value => typeof value === 'number',
	    default: true,
	    tag: 'tag:yaml.org,2002:float',
	    format: 'EXP',
	    test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
	    resolve: str => parseFloat(str),
	    stringify(node) {
	        const num = Number(node.value);
	        return isFinite(num) ? num.toExponential() : stringifyNumber(node);
	    }
	};
	const float$1 = {
	    identify: value => typeof value === 'number',
	    default: true,
	    tag: 'tag:yaml.org,2002:float',
	    test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
	    resolve(str) {
	        const node = new Scalar(parseFloat(str));
	        const dot = str.indexOf('.');
	        if (dot !== -1 && str[str.length - 1] === '0')
	            node.minFractionDigits = str.length - dot - 1;
	        return node;
	    },
	    stringify: stringifyNumber
	};

	const intIdentify$2 = (value) => typeof value === 'bigint' || Number.isInteger(value);
	const intResolve$1 = (str, offset, radix, { intAsBigInt }) => (intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix));
	function intStringify$1(node, radix, prefix) {
	    const { value } = node;
	    if (intIdentify$2(value) && value >= 0)
	        return prefix + value.toString(radix);
	    return stringifyNumber(node);
	}
	const intOct$1 = {
	    identify: value => intIdentify$2(value) && value >= 0,
	    default: true,
	    tag: 'tag:yaml.org,2002:int',
	    format: 'OCT',
	    test: /^0o[0-7]+$/,
	    resolve: (str, _onError, opt) => intResolve$1(str, 2, 8, opt),
	    stringify: node => intStringify$1(node, 8, '0o')
	};
	const int$1 = {
	    identify: intIdentify$2,
	    default: true,
	    tag: 'tag:yaml.org,2002:int',
	    test: /^[-+]?[0-9]+$/,
	    resolve: (str, _onError, opt) => intResolve$1(str, 0, 10, opt),
	    stringify: stringifyNumber
	};
	const intHex$1 = {
	    identify: value => intIdentify$2(value) && value >= 0,
	    default: true,
	    tag: 'tag:yaml.org,2002:int',
	    format: 'HEX',
	    test: /^0x[0-9a-fA-F]+$/,
	    resolve: (str, _onError, opt) => intResolve$1(str, 2, 16, opt),
	    stringify: node => intStringify$1(node, 16, '0x')
	};

	const schema$2 = [
	    map,
	    seq,
	    string,
	    nullTag,
	    boolTag,
	    intOct$1,
	    int$1,
	    intHex$1,
	    floatNaN$1,
	    floatExp$1,
	    float$1
	];

	function intIdentify$1(value) {
	    return typeof value === 'bigint' || Number.isInteger(value);
	}
	const stringifyJSON = ({ value }) => JSON.stringify(value);
	const jsonScalars = [
	    {
	        identify: value => typeof value === 'string',
	        default: true,
	        tag: 'tag:yaml.org,2002:str',
	        resolve: str => str,
	        stringify: stringifyJSON
	    },
	    {
	        identify: value => value == null,
	        createNode: () => new Scalar(null),
	        default: true,
	        tag: 'tag:yaml.org,2002:null',
	        test: /^null$/,
	        resolve: () => null,
	        stringify: stringifyJSON
	    },
	    {
	        identify: value => typeof value === 'boolean',
	        default: true,
	        tag: 'tag:yaml.org,2002:bool',
	        test: /^true$|^false$/,
	        resolve: str => str === 'true',
	        stringify: stringifyJSON
	    },
	    {
	        identify: intIdentify$1,
	        default: true,
	        tag: 'tag:yaml.org,2002:int',
	        test: /^-?(?:0|[1-9][0-9]*)$/,
	        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
	        stringify: ({ value }) => intIdentify$1(value) ? value.toString() : JSON.stringify(value)
	    },
	    {
	        identify: value => typeof value === 'number',
	        default: true,
	        tag: 'tag:yaml.org,2002:float',
	        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
	        resolve: str => parseFloat(str),
	        stringify: stringifyJSON
	    }
	];
	const jsonError = {
	    default: true,
	    tag: '',
	    test: /^/,
	    resolve(str, onError) {
	        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
	        return str;
	    }
	};
	const schema$1 = [map, seq].concat(jsonScalars, jsonError);

	const binary = {
	    identify: value => value instanceof Uint8Array,
	    default: false,
	    tag: 'tag:yaml.org,2002:binary',
	    resolve(src, onError) {
	        if (typeof atob === 'function') {
	            const str = atob(src.replace(/[\n\r]/g, ''));
	            const buffer = new Uint8Array(str.length);
	            for (let i = 0; i < str.length; ++i)
	                buffer[i] = str.charCodeAt(i);
	            return buffer;
	        }
	        else {
	            onError('This environment does not support reading binary tags; either Buffer or atob is required');
	            return src;
	        }
	    },
	    stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
	        if (!value)
	            return '';
	        const buf = value;
	        let str;
	        if (typeof btoa === 'function') {
	            let s = '';
	            for (let i = 0; i < buf.length; ++i)
	                s += String.fromCharCode(buf[i]);
	            str = btoa(s);
	        }
	        else {
	            throw new Error('This environment does not support writing binary tags; either Buffer or btoa is required');
	        }
	        type ?? (type = Scalar.BLOCK_LITERAL);
	        if (type !== Scalar.QUOTE_DOUBLE) {
	            const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
	            const n = Math.ceil(str.length / lineWidth);
	            const lines = new Array(n);
	            for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
	                lines[i] = str.substr(o, lineWidth);
	            }
	            str = lines.join(type === Scalar.BLOCK_LITERAL ? '\n' : ' ');
	        }
	        return stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
	    }
	};

	function resolvePairs(seq, onError) {
	    if (isSeq(seq)) {
	        for (let i = 0; i < seq.items.length; ++i) {
	            let item = seq.items[i];
	            if (isPair(item))
	                continue;
	            else if (isMap(item)) {
	                if (item.items.length > 1)
	                    onError('Each pair must have its own sequence indicator');
	                const pair = item.items[0] || new Pair(new Scalar(null));
	                if (item.commentBefore)
	                    pair.key.commentBefore = pair.key.commentBefore
	                        ? `${item.commentBefore}\n${pair.key.commentBefore}`
	                        : item.commentBefore;
	                if (item.comment) {
	                    const cn = pair.value ?? pair.key;
	                    cn.comment = cn.comment
	                        ? `${item.comment}\n${cn.comment}`
	                        : item.comment;
	                }
	                item = pair;
	            }
	            seq.items[i] = isPair(item) ? item : new Pair(item);
	        }
	    }
	    else
	        onError('Expected a sequence for this tag');
	    return seq;
	}
	function createPairs(schema, iterable, ctx) {
	    const { replacer } = ctx;
	    const pairs = new YAMLSeq(schema);
	    pairs.tag = 'tag:yaml.org,2002:pairs';
	    let i = 0;
	    if (iterable && Symbol.iterator in Object(iterable))
	        for (let it of iterable) {
	            if (typeof replacer === 'function')
	                it = replacer.call(iterable, String(i++), it);
	            let key, value;
	            if (Array.isArray(it)) {
	                if (it.length === 2) {
	                    key = it[0];
	                    value = it[1];
	                }
	                else
	                    throw new TypeError(`Expected [key, value] tuple: ${it}`);
	            }
	            else if (it && it instanceof Object) {
	                const keys = Object.keys(it);
	                if (keys.length === 1) {
	                    key = keys[0];
	                    value = it[key];
	                }
	                else {
	                    throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
	                }
	            }
	            else {
	                key = it;
	            }
	            pairs.items.push(createPair(key, value, ctx));
	        }
	    return pairs;
	}
	const pairs = {
	    collection: 'seq',
	    default: false,
	    tag: 'tag:yaml.org,2002:pairs',
	    resolve: resolvePairs,
	    createNode: createPairs
	};

	class YAMLOMap extends YAMLSeq {
	    constructor() {
	        super();
	        this.add = YAMLMap.prototype.add.bind(this);
	        this.delete = YAMLMap.prototype.delete.bind(this);
	        this.get = YAMLMap.prototype.get.bind(this);
	        this.has = YAMLMap.prototype.has.bind(this);
	        this.set = YAMLMap.prototype.set.bind(this);
	        this.tag = YAMLOMap.tag;
	    }
	    toJSON(_, ctx) {
	        if (!ctx)
	            return super.toJSON(_);
	        const map = new Map();
	        if (ctx?.onCreate)
	            ctx.onCreate(map);
	        for (const pair of this.items) {
	            let key, value;
	            if (isPair(pair)) {
	                key = toJS(pair.key, '', ctx);
	                value = toJS(pair.value, key, ctx);
	            }
	            else {
	                key = toJS(pair, '', ctx);
	            }
	            if (map.has(key))
	                throw new Error('Ordered maps must not include duplicate keys');
	            map.set(key, value);
	        }
	        return map;
	    }
	    static from(schema, iterable, ctx) {
	        const pairs = createPairs(schema, iterable, ctx);
	        const omap = new this();
	        omap.items = pairs.items;
	        return omap;
	    }
	}
	YAMLOMap.tag = 'tag:yaml.org,2002:omap';
	const omap = {
	    collection: 'seq',
	    identify: value => value instanceof Map,
	    nodeClass: YAMLOMap,
	    default: false,
	    tag: 'tag:yaml.org,2002:omap',
	    resolve(seq, onError) {
	        const pairs = resolvePairs(seq, onError);
	        const seenKeys = [];
	        for (const { key } of pairs.items) {
	            if (isScalar(key)) {
	                if (seenKeys.includes(key.value)) {
	                    onError(`Ordered maps must not include duplicate keys: ${key.value}`);
	                }
	                else {
	                    seenKeys.push(key.value);
	                }
	            }
	        }
	        return Object.assign(new YAMLOMap(), pairs);
	    },
	    createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
	};

	function boolStringify({ value, source }, ctx) {
	    const boolObj = value ? trueTag : falseTag;
	    if (source && boolObj.test.test(source))
	        return source;
	    return value ? ctx.options.trueStr : ctx.options.falseStr;
	}
	const trueTag = {
	    identify: value => value === true,
	    default: true,
	    tag: 'tag:yaml.org,2002:bool',
	    test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
	    resolve: () => new Scalar(true),
	    stringify: boolStringify
	};
	const falseTag = {
	    identify: value => value === false,
	    default: true,
	    tag: 'tag:yaml.org,2002:bool',
	    test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
	    resolve: () => new Scalar(false),
	    stringify: boolStringify
	};

	const floatNaN = {
	    identify: value => typeof value === 'number',
	    default: true,
	    tag: 'tag:yaml.org,2002:float',
	    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
	    resolve: (str) => str.slice(-3).toLowerCase() === 'nan'
	        ? NaN
	        : str[0] === '-'
	            ? Number.NEGATIVE_INFINITY
	            : Number.POSITIVE_INFINITY,
	    stringify: stringifyNumber
	};
	const floatExp = {
	    identify: value => typeof value === 'number',
	    default: true,
	    tag: 'tag:yaml.org,2002:float',
	    format: 'EXP',
	    test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
	    resolve: (str) => parseFloat(str.replace(/_/g, '')),
	    stringify(node) {
	        const num = Number(node.value);
	        return isFinite(num) ? num.toExponential() : stringifyNumber(node);
	    }
	};
	const float = {
	    identify: value => typeof value === 'number',
	    default: true,
	    tag: 'tag:yaml.org,2002:float',
	    test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
	    resolve(str) {
	        const node = new Scalar(parseFloat(str.replace(/_/g, '')));
	        const dot = str.indexOf('.');
	        if (dot !== -1) {
	            const f = str.substring(dot + 1).replace(/_/g, '');
	            if (f[f.length - 1] === '0')
	                node.minFractionDigits = f.length;
	        }
	        return node;
	    },
	    stringify: stringifyNumber
	};

	const intIdentify = (value) => typeof value === 'bigint' || Number.isInteger(value);
	function intResolve(str, offset, radix, { intAsBigInt }) {
	    const sign = str[0];
	    if (sign === '-' || sign === '+')
	        offset += 1;
	    str = str.substring(offset).replace(/_/g, '');
	    if (intAsBigInt) {
	        switch (radix) {
	            case 2:
	                str = `0b${str}`;
	                break;
	            case 8:
	                str = `0o${str}`;
	                break;
	            case 16:
	                str = `0x${str}`;
	                break;
	        }
	        const n = BigInt(str);
	        return sign === '-' ? BigInt(-1) * n : n;
	    }
	    const n = parseInt(str, radix);
	    return sign === '-' ? -1 * n : n;
	}
	function intStringify(node, radix, prefix) {
	    const { value } = node;
	    if (intIdentify(value)) {
	        const str = value.toString(radix);
	        return value < 0 ? '-' + prefix + str.substr(1) : prefix + str;
	    }
	    return stringifyNumber(node);
	}
	const intBin = {
	    identify: intIdentify,
	    default: true,
	    tag: 'tag:yaml.org,2002:int',
	    format: 'BIN',
	    test: /^[-+]?0b[0-1_]+$/,
	    resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
	    stringify: node => intStringify(node, 2, '0b')
	};
	const intOct = {
	    identify: intIdentify,
	    default: true,
	    tag: 'tag:yaml.org,2002:int',
	    format: 'OCT',
	    test: /^[-+]?0[0-7_]+$/,
	    resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
	    stringify: node => intStringify(node, 8, '0')
	};
	const int = {
	    identify: intIdentify,
	    default: true,
	    tag: 'tag:yaml.org,2002:int',
	    test: /^[-+]?[0-9][0-9_]*$/,
	    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
	    stringify: stringifyNumber
	};
	const intHex = {
	    identify: intIdentify,
	    default: true,
	    tag: 'tag:yaml.org,2002:int',
	    format: 'HEX',
	    test: /^[-+]?0x[0-9a-fA-F_]+$/,
	    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
	    stringify: node => intStringify(node, 16, '0x')
	};

	class YAMLSet extends YAMLMap {
	    constructor(schema) {
	        super(schema);
	        this.tag = YAMLSet.tag;
	    }
	    add(key) {
	        let pair;
	        if (isPair(key))
	            pair = key;
	        else if (key &&
	            typeof key === 'object' &&
	            'key' in key &&
	            'value' in key &&
	            key.value === null)
	            pair = new Pair(key.key, null);
	        else
	            pair = new Pair(key, null);
	        const prev = findPair(this.items, pair.key);
	        if (!prev)
	            this.items.push(pair);
	    }
	    get(key, keepPair) {
	        const pair = findPair(this.items, key);
	        return !keepPair && isPair(pair)
	            ? isScalar(pair.key)
	                ? pair.key.value
	                : pair.key
	            : pair;
	    }
	    set(key, value) {
	        if (typeof value !== 'boolean')
	            throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
	        const prev = findPair(this.items, key);
	        if (prev && !value) {
	            this.items.splice(this.items.indexOf(prev), 1);
	        }
	        else if (!prev && value) {
	            this.items.push(new Pair(key));
	        }
	    }
	    toJSON(_, ctx) {
	        return super.toJSON(_, ctx, Set);
	    }
	    toString(ctx, onComment, onChompKeep) {
	        if (!ctx)
	            return JSON.stringify(this);
	        if (this.hasAllNullValues(true))
	            return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
	        else
	            throw new Error('Set items must all have null values');
	    }
	    static from(schema, iterable, ctx) {
	        const { replacer } = ctx;
	        const set = new this(schema);
	        if (iterable && Symbol.iterator in Object(iterable))
	            for (let value of iterable) {
	                if (typeof replacer === 'function')
	                    value = replacer.call(iterable, value, value);
	                set.items.push(createPair(value, null, ctx));
	            }
	        return set;
	    }
	}
	YAMLSet.tag = 'tag:yaml.org,2002:set';
	const set = {
	    collection: 'map',
	    identify: value => value instanceof Set,
	    nodeClass: YAMLSet,
	    default: false,
	    tag: 'tag:yaml.org,2002:set',
	    createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
	    resolve(map, onError) {
	        if (isMap(map)) {
	            if (map.hasAllNullValues(true))
	                return Object.assign(new YAMLSet(), map);
	            else
	                onError('Set items must all have null values');
	        }
	        else
	            onError('Expected a mapping for this tag');
	        return map;
	    }
	};

	function parseSexagesimal(str, asBigInt) {
	    const sign = str[0];
	    const parts = sign === '-' || sign === '+' ? str.substring(1) : str;
	    const num = (n) => asBigInt ? BigInt(n) : Number(n);
	    const res = parts
	        .replace(/_/g, '')
	        .split(':')
	        .reduce((res, p) => res * num(60) + num(p), num(0));
	    return (sign === '-' ? num(-1) * res : res);
	}
	function stringifySexagesimal(node) {
	    let { value } = node;
	    let num = (n) => n;
	    if (typeof value === 'bigint')
	        num = n => BigInt(n);
	    else if (isNaN(value) || !isFinite(value))
	        return stringifyNumber(node);
	    let sign = '';
	    if (value < 0) {
	        sign = '-';
	        value *= num(-1);
	    }
	    const _60 = num(60);
	    const parts = [value % _60];
	    if (value < 60) {
	        parts.unshift(0);
	    }
	    else {
	        value = (value - parts[0]) / _60;
	        parts.unshift(value % _60);
	        if (value >= 60) {
	            value = (value - parts[0]) / _60;
	            parts.unshift(value);
	        }
	    }
	    return (sign +
	        parts
	            .map(n => String(n).padStart(2, '0'))
	            .join(':')
	            .replace(/000000\d*$/, '')
	    );
	}
	const intTime = {
	    identify: value => typeof value === 'bigint' || Number.isInteger(value),
	    default: true,
	    tag: 'tag:yaml.org,2002:int',
	    format: 'TIME',
	    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
	    resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
	    stringify: stringifySexagesimal
	};
	const floatTime = {
	    identify: value => typeof value === 'number',
	    default: true,
	    tag: 'tag:yaml.org,2002:float',
	    format: 'TIME',
	    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
	    resolve: str => parseSexagesimal(str, false),
	    stringify: stringifySexagesimal
	};
	const timestamp = {
	    identify: value => value instanceof Date,
	    default: true,
	    tag: 'tag:yaml.org,2002:timestamp',
	    test: RegExp('^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})' +
	        '(?:' +
	        '(?:t|T|[ \\t]+)' +
	        '([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)' +
	        '(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?' +
	        ')?$'),
	    resolve(str) {
	        const match = str.match(timestamp.test);
	        if (!match)
	            throw new Error('!!timestamp expects a date, starting with yyyy-mm-dd');
	        const [, year, month, day, hour, minute, second] = match.map(Number);
	        const millisec = match[7] ? Number((match[7] + '00').substr(1, 3)) : 0;
	        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
	        const tz = match[8];
	        if (tz && tz !== 'Z') {
	            let d = parseSexagesimal(tz, false);
	            if (Math.abs(d) < 30)
	                d *= 60;
	            date -= 60000 * d;
	        }
	        return new Date(date);
	    },
	    stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, '') ?? ''
	};

	const schema = [
	    map,
	    seq,
	    string,
	    nullTag,
	    trueTag,
	    falseTag,
	    intBin,
	    intOct,
	    int,
	    intHex,
	    floatNaN,
	    floatExp,
	    float,
	    binary,
	    merge,
	    omap,
	    pairs,
	    set,
	    intTime,
	    floatTime,
	    timestamp
	];

	const schemas = new Map([
	    ['core', schema$2],
	    ['failsafe', [map, seq, string]],
	    ['json', schema$1],
	    ['yaml11', schema],
	    ['yaml-1.1', schema]
	]);
	const tagsByName = {
	    binary,
	    bool: boolTag,
	    float: float$1,
	    floatExp: floatExp$1,
	    floatNaN: floatNaN$1,
	    floatTime,
	    int: int$1,
	    intHex: intHex$1,
	    intOct: intOct$1,
	    intTime,
	    map,
	    merge,
	    null: nullTag,
	    omap,
	    pairs,
	    seq,
	    set,
	    timestamp
	};
	const coreKnownTags = {
	    'tag:yaml.org,2002:binary': binary,
	    'tag:yaml.org,2002:merge': merge,
	    'tag:yaml.org,2002:omap': omap,
	    'tag:yaml.org,2002:pairs': pairs,
	    'tag:yaml.org,2002:set': set,
	    'tag:yaml.org,2002:timestamp': timestamp
	};
	function getTags(customTags, schemaName, addMergeTag) {
	    const schemaTags = schemas.get(schemaName);
	    if (schemaTags && !customTags) {
	        return addMergeTag && !schemaTags.includes(merge)
	            ? schemaTags.concat(merge)
	            : schemaTags.slice();
	    }
	    let tags = schemaTags;
	    if (!tags) {
	        if (Array.isArray(customTags))
	            tags = [];
	        else {
	            const keys = Array.from(schemas.keys())
	                .filter(key => key !== 'yaml11')
	                .map(key => JSON.stringify(key))
	                .join(', ');
	            throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
	        }
	    }
	    if (Array.isArray(customTags)) {
	        for (const tag of customTags)
	            tags = tags.concat(tag);
	    }
	    else if (typeof customTags === 'function') {
	        tags = customTags(tags.slice());
	    }
	    if (addMergeTag)
	        tags = tags.concat(merge);
	    return tags.reduce((tags, tag) => {
	        const tagObj = typeof tag === 'string' ? tagsByName[tag] : tag;
	        if (!tagObj) {
	            const tagName = JSON.stringify(tag);
	            const keys = Object.keys(tagsByName)
	                .map(key => JSON.stringify(key))
	                .join(', ');
	            throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
	        }
	        if (!tags.includes(tagObj))
	            tags.push(tagObj);
	        return tags;
	    }, []);
	}

	const sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
	class Schema {
	    constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
	        this.compat = Array.isArray(compat)
	            ? getTags(compat, 'compat')
	            : compat
	                ? getTags(null, compat)
	                : null;
	        this.name = (typeof schema === 'string' && schema) || 'core';
	        this.knownTags = resolveKnownTags ? coreKnownTags : {};
	        this.tags = getTags(customTags, this.name, merge);
	        this.toStringOptions = toStringDefaults ?? null;
	        Object.defineProperty(this, MAP, { value: map });
	        Object.defineProperty(this, SCALAR$1, { value: string });
	        Object.defineProperty(this, SEQ, { value: seq });
	        this.sortMapEntries =
	            typeof sortMapEntries === 'function'
	                ? sortMapEntries
	                : sortMapEntries === true
	                    ? sortMapEntriesByKey
	                    : null;
	    }
	    clone() {
	        const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
	        copy.tags = this.tags.slice();
	        return copy;
	    }
	}

	function stringifyDocument(doc, options) {
	    const lines = [];
	    let hasDirectives = options.directives === true;
	    if (options.directives !== false && doc.directives) {
	        const dir = doc.directives.toString(doc);
	        if (dir) {
	            lines.push(dir);
	            hasDirectives = true;
	        }
	        else if (doc.directives.docStart)
	            hasDirectives = true;
	    }
	    if (hasDirectives)
	        lines.push('---');
	    const ctx = createStringifyContext(doc, options);
	    const { commentString } = ctx.options;
	    if (doc.commentBefore) {
	        if (lines.length !== 1)
	            lines.unshift('');
	        const cs = commentString(doc.commentBefore);
	        lines.unshift(indentComment(cs, ''));
	    }
	    let chompKeep = false;
	    let contentComment = null;
	    if (doc.contents) {
	        if (isNode(doc.contents)) {
	            if (doc.contents.spaceBefore && hasDirectives)
	                lines.push('');
	            if (doc.contents.commentBefore) {
	                const cs = commentString(doc.contents.commentBefore);
	                lines.push(indentComment(cs, ''));
	            }
	            ctx.forceBlockIndent = !!doc.comment;
	            contentComment = doc.contents.comment;
	        }
	        const onChompKeep = contentComment ? undefined : () => (chompKeep = true);
	        let body = stringify$1(doc.contents, ctx, () => (contentComment = null), onChompKeep);
	        if (contentComment)
	            body += lineComment(body, '', commentString(contentComment));
	        if ((body[0] === '|' || body[0] === '>') &&
	            lines[lines.length - 1] === '---') {
	            lines[lines.length - 1] = `--- ${body}`;
	        }
	        else
	            lines.push(body);
	    }
	    else {
	        lines.push(stringify$1(doc.contents, ctx));
	    }
	    if (doc.directives?.docEnd) {
	        if (doc.comment) {
	            const cs = commentString(doc.comment);
	            if (cs.includes('\n')) {
	                lines.push('...');
	                lines.push(indentComment(cs, ''));
	            }
	            else {
	                lines.push(`... ${cs}`);
	            }
	        }
	        else {
	            lines.push('...');
	        }
	    }
	    else {
	        let dc = doc.comment;
	        if (dc && chompKeep)
	            dc = dc.replace(/^\n+/, '');
	        if (dc) {
	            if ((!chompKeep || contentComment) && lines[lines.length - 1] !== '')
	                lines.push('');
	            lines.push(indentComment(commentString(dc), ''));
	        }
	    }
	    return lines.join('\n') + '\n';
	}

	class Document {
	    constructor(value, replacer, options) {
	        this.commentBefore = null;
	        this.comment = null;
	        this.errors = [];
	        this.warnings = [];
	        Object.defineProperty(this, NODE_TYPE, { value: DOC });
	        let _replacer = null;
	        if (typeof replacer === 'function' || Array.isArray(replacer)) {
	            _replacer = replacer;
	        }
	        else if (options === undefined && replacer) {
	            options = replacer;
	            replacer = undefined;
	        }
	        const opt = Object.assign({
	            intAsBigInt: false,
	            keepSourceTokens: false,
	            logLevel: 'warn',
	            prettyErrors: true,
	            strict: true,
	            stringKeys: false,
	            uniqueKeys: true,
	            version: '1.2'
	        }, options);
	        this.options = opt;
	        let { version } = opt;
	        if (options?._directives) {
	            this.directives = options._directives.atDocument();
	            if (this.directives.yaml.explicit)
	                version = this.directives.yaml.version;
	        }
	        else
	            this.directives = new Directives({ version });
	        this.setSchema(version, options);
	        this.contents =
	            value === undefined ? null : this.createNode(value, _replacer, options);
	    }
	    clone() {
	        const copy = Object.create(Document.prototype, {
	            [NODE_TYPE]: { value: DOC }
	        });
	        copy.commentBefore = this.commentBefore;
	        copy.comment = this.comment;
	        copy.errors = this.errors.slice();
	        copy.warnings = this.warnings.slice();
	        copy.options = Object.assign({}, this.options);
	        if (this.directives)
	            copy.directives = this.directives.clone();
	        copy.schema = this.schema.clone();
	        copy.contents = isNode(this.contents)
	            ? this.contents.clone(copy.schema)
	            : this.contents;
	        if (this.range)
	            copy.range = this.range.slice();
	        return copy;
	    }
	    add(value) {
	        if (assertCollection(this.contents))
	            this.contents.add(value);
	    }
	    addIn(path, value) {
	        if (assertCollection(this.contents))
	            this.contents.addIn(path, value);
	    }
	    createAlias(node, name) {
	        if (!node.anchor) {
	            const prev = anchorNames(this);
	            node.anchor =
	                !name || prev.has(name) ? findNewAnchor(name || 'a', prev) : name;
	        }
	        return new Alias(node.anchor);
	    }
	    createNode(value, replacer, options) {
	        let _replacer = undefined;
	        if (typeof replacer === 'function') {
	            value = replacer.call({ '': value }, '', value);
	            _replacer = replacer;
	        }
	        else if (Array.isArray(replacer)) {
	            const keyToStr = (v) => typeof v === 'number' || v instanceof String || v instanceof Number;
	            const asStr = replacer.filter(keyToStr).map(String);
	            if (asStr.length > 0)
	                replacer = replacer.concat(asStr);
	            _replacer = replacer;
	        }
	        else if (options === undefined && replacer) {
	            options = replacer;
	            replacer = undefined;
	        }
	        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
	        const { onAnchor, setAnchors, sourceObjects } = createNodeAnchors(this,
	        anchorPrefix || 'a');
	        const ctx = {
	            aliasDuplicateObjects: aliasDuplicateObjects ?? true,
	            keepUndefined: keepUndefined ?? false,
	            onAnchor,
	            onTagObj,
	            replacer: _replacer,
	            schema: this.schema,
	            sourceObjects
	        };
	        const node = createNode(value, tag, ctx);
	        if (flow && isCollection(node))
	            node.flow = true;
	        setAnchors();
	        return node;
	    }
	    createPair(key, value, options = {}) {
	        const k = this.createNode(key, null, options);
	        const v = this.createNode(value, null, options);
	        return new Pair(k, v);
	    }
	    delete(key) {
	        return assertCollection(this.contents) ? this.contents.delete(key) : false;
	    }
	    deleteIn(path) {
	        if (isEmptyPath(path)) {
	            if (this.contents == null)
	                return false;
	            this.contents = null;
	            return true;
	        }
	        return assertCollection(this.contents)
	            ? this.contents.deleteIn(path)
	            : false;
	    }
	    get(key, keepScalar) {
	        return isCollection(this.contents)
	            ? this.contents.get(key, keepScalar)
	            : undefined;
	    }
	    getIn(path, keepScalar) {
	        if (isEmptyPath(path))
	            return !keepScalar && isScalar(this.contents)
	                ? this.contents.value
	                : this.contents;
	        return isCollection(this.contents)
	            ? this.contents.getIn(path, keepScalar)
	            : undefined;
	    }
	    has(key) {
	        return isCollection(this.contents) ? this.contents.has(key) : false;
	    }
	    hasIn(path) {
	        if (isEmptyPath(path))
	            return this.contents !== undefined;
	        return isCollection(this.contents) ? this.contents.hasIn(path) : false;
	    }
	    set(key, value) {
	        if (this.contents == null) {
	            this.contents = collectionFromPath(this.schema, [key], value);
	        }
	        else if (assertCollection(this.contents)) {
	            this.contents.set(key, value);
	        }
	    }
	    setIn(path, value) {
	        if (isEmptyPath(path)) {
	            this.contents = value;
	        }
	        else if (this.contents == null) {
	            this.contents = collectionFromPath(this.schema, Array.from(path), value);
	        }
	        else if (assertCollection(this.contents)) {
	            this.contents.setIn(path, value);
	        }
	    }
	    setSchema(version, options = {}) {
	        if (typeof version === 'number')
	            version = String(version);
	        let opt;
	        switch (version) {
	            case '1.1':
	                if (this.directives)
	                    this.directives.yaml.version = '1.1';
	                else
	                    this.directives = new Directives({ version: '1.1' });
	                opt = { resolveKnownTags: false, schema: 'yaml-1.1' };
	                break;
	            case '1.2':
	            case 'next':
	                if (this.directives)
	                    this.directives.yaml.version = version;
	                else
	                    this.directives = new Directives({ version });
	                opt = { resolveKnownTags: true, schema: 'core' };
	                break;
	            case null:
	                if (this.directives)
	                    delete this.directives;
	                opt = null;
	                break;
	            default: {
	                const sv = JSON.stringify(version);
	                throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
	            }
	        }
	        if (options.schema instanceof Object)
	            this.schema = options.schema;
	        else if (opt)
	            this.schema = new Schema(Object.assign(opt, options));
	        else
	            throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
	    }
	    toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
	        const ctx = {
	            anchors: new Map(),
	            doc: this,
	            keep: !json,
	            mapAsMap: mapAsMap === true,
	            mapKeyWarned: false,
	            maxAliasCount: typeof maxAliasCount === 'number' ? maxAliasCount : 100
	        };
	        const res = toJS(this.contents, jsonArg ?? '', ctx);
	        if (typeof onAnchor === 'function')
	            for (const { count, res } of ctx.anchors.values())
	                onAnchor(res, count);
	        return typeof reviver === 'function'
	            ? applyReviver(reviver, { '': res }, '', res)
	            : res;
	    }
	    toJSON(jsonArg, onAnchor) {
	        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
	    }
	    toString(options = {}) {
	        if (this.errors.length > 0)
	            throw new Error('Document with errors cannot be stringified');
	        if ('indent' in options &&
	            (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
	            const s = JSON.stringify(options.indent);
	            throw new Error(`"indent" option must be a positive integer, not ${s}`);
	        }
	        return stringifyDocument(this, options);
	    }
	}
	function assertCollection(contents) {
	    if (isCollection(contents))
	        return true;
	    throw new Error('Expected a YAML collection as document contents');
	}

	class YAMLError extends Error {
	    constructor(name, pos, code, message) {
	        super();
	        this.name = name;
	        this.code = code;
	        this.message = message;
	        this.pos = pos;
	    }
	}
	class YAMLParseError extends YAMLError {
	    constructor(pos, code, message) {
	        super('YAMLParseError', pos, code, message);
	    }
	}
	class YAMLWarning extends YAMLError {
	    constructor(pos, code, message) {
	        super('YAMLWarning', pos, code, message);
	    }
	}
	const prettifyError = (src, lc) => (error) => {
	    if (error.pos[0] === -1)
	        return;
	    error.linePos = error.pos.map(pos => lc.linePos(pos));
	    const { line, col } = error.linePos[0];
	    error.message += ` at line ${line}, column ${col}`;
	    let ci = col - 1;
	    let lineStr = src
	        .substring(lc.lineStarts[line - 1], lc.lineStarts[line])
	        .replace(/[\n\r]+$/, '');
	    if (ci >= 60 && lineStr.length > 80) {
	        const trimStart = Math.min(ci - 39, lineStr.length - 79);
	        lineStr = '…' + lineStr.substring(trimStart);
	        ci -= trimStart - 1;
	    }
	    if (lineStr.length > 80)
	        lineStr = lineStr.substring(0, 79) + '…';
	    if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
	        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
	        if (prev.length > 80)
	            prev = prev.substring(0, 79) + '…\n';
	        lineStr = prev + lineStr;
	    }
	    if (/[^ ]/.test(lineStr)) {
	        let count = 1;
	        const end = error.linePos[1];
	        if (end?.line === line && end.col > col) {
	            count = Math.max(1, Math.min(end.col - col, 80 - ci));
	        }
	        const pointer = ' '.repeat(ci) + '^'.repeat(count);
	        error.message += `:\n\n${lineStr}\n${pointer}\n`;
	    }
	};

	function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
	    let spaceBefore = false;
	    let atNewline = startOnNewline;
	    let hasSpace = startOnNewline;
	    let comment = '';
	    let commentSep = '';
	    let hasNewline = false;
	    let reqSpace = false;
	    let tab = null;
	    let anchor = null;
	    let tag = null;
	    let newlineAfterProp = null;
	    let comma = null;
	    let found = null;
	    let start = null;
	    for (const token of tokens) {
	        if (reqSpace) {
	            if (token.type !== 'space' &&
	                token.type !== 'newline' &&
	                token.type !== 'comma')
	                onError(token.offset, 'MISSING_CHAR', 'Tags and anchors must be separated from the next token by white space');
	            reqSpace = false;
	        }
	        if (tab) {
	            if (atNewline && token.type !== 'comment' && token.type !== 'newline') {
	                onError(tab, 'TAB_AS_INDENT', 'Tabs are not allowed as indentation');
	            }
	            tab = null;
	        }
	        switch (token.type) {
	            case 'space':
	                if (!flow &&
	                    (indicator !== 'doc-start' || next?.type !== 'flow-collection') &&
	                    token.source.includes('\t')) {
	                    tab = token;
	                }
	                hasSpace = true;
	                break;
	            case 'comment': {
	                if (!hasSpace)
	                    onError(token, 'MISSING_CHAR', 'Comments must be separated from other tokens by white space characters');
	                const cb = token.source.substring(1) || ' ';
	                if (!comment)
	                    comment = cb;
	                else
	                    comment += commentSep + cb;
	                commentSep = '';
	                atNewline = false;
	                break;
	            }
	            case 'newline':
	                if (atNewline) {
	                    if (comment)
	                        comment += token.source;
	                    else if (!found || indicator !== 'seq-item-ind')
	                        spaceBefore = true;
	                }
	                else
	                    commentSep += token.source;
	                atNewline = true;
	                hasNewline = true;
	                if (anchor || tag)
	                    newlineAfterProp = token;
	                hasSpace = true;
	                break;
	            case 'anchor':
	                if (anchor)
	                    onError(token, 'MULTIPLE_ANCHORS', 'A node can have at most one anchor');
	                if (token.source.endsWith(':'))
	                    onError(token.offset + token.source.length - 1, 'BAD_ALIAS', 'Anchor ending in : is ambiguous', true);
	                anchor = token;
	                start ?? (start = token.offset);
	                atNewline = false;
	                hasSpace = false;
	                reqSpace = true;
	                break;
	            case 'tag': {
	                if (tag)
	                    onError(token, 'MULTIPLE_TAGS', 'A node can have at most one tag');
	                tag = token;
	                start ?? (start = token.offset);
	                atNewline = false;
	                hasSpace = false;
	                reqSpace = true;
	                break;
	            }
	            case indicator:
	                if (anchor || tag)
	                    onError(token, 'BAD_PROP_ORDER', `Anchors and tags must be after the ${token.source} indicator`);
	                if (found)
	                    onError(token, 'UNEXPECTED_TOKEN', `Unexpected ${token.source} in ${flow ?? 'collection'}`);
	                found = token;
	                atNewline =
	                    indicator === 'seq-item-ind' || indicator === 'explicit-key-ind';
	                hasSpace = false;
	                break;
	            case 'comma':
	                if (flow) {
	                    if (comma)
	                        onError(token, 'UNEXPECTED_TOKEN', `Unexpected , in ${flow}`);
	                    comma = token;
	                    atNewline = false;
	                    hasSpace = false;
	                    break;
	                }
	            default:
	                onError(token, 'UNEXPECTED_TOKEN', `Unexpected ${token.type} token`);
	                atNewline = false;
	                hasSpace = false;
	        }
	    }
	    const last = tokens[tokens.length - 1];
	    const end = last ? last.offset + last.source.length : offset;
	    if (reqSpace &&
	        next &&
	        next.type !== 'space' &&
	        next.type !== 'newline' &&
	        next.type !== 'comma' &&
	        (next.type !== 'scalar' || next.source !== '')) {
	        onError(next.offset, 'MISSING_CHAR', 'Tags and anchors must be separated from the next token by white space');
	    }
	    if (tab &&
	        ((atNewline && tab.indent <= parentIndent) ||
	            next?.type === 'block-map' ||
	            next?.type === 'block-seq'))
	        onError(tab, 'TAB_AS_INDENT', 'Tabs are not allowed as indentation');
	    return {
	        comma,
	        found,
	        spaceBefore,
	        comment,
	        hasNewline,
	        anchor,
	        tag,
	        newlineAfterProp,
	        end,
	        start: start ?? end
	    };
	}

	function containsNewline(key) {
	    if (!key)
	        return null;
	    switch (key.type) {
	        case 'alias':
	        case 'scalar':
	        case 'double-quoted-scalar':
	        case 'single-quoted-scalar':
	            if (key.source.includes('\n'))
	                return true;
	            if (key.end)
	                for (const st of key.end)
	                    if (st.type === 'newline')
	                        return true;
	            return false;
	        case 'flow-collection':
	            for (const it of key.items) {
	                for (const st of it.start)
	                    if (st.type === 'newline')
	                        return true;
	                if (it.sep)
	                    for (const st of it.sep)
	                        if (st.type === 'newline')
	                            return true;
	                if (containsNewline(it.key) || containsNewline(it.value))
	                    return true;
	            }
	            return false;
	        default:
	            return true;
	    }
	}

	function flowIndentCheck(indent, fc, onError) {
	    if (fc?.type === 'flow-collection') {
	        const end = fc.end[0];
	        if (end.indent === indent &&
	            (end.source === ']' || end.source === '}') &&
	            containsNewline(fc)) {
	            const msg = 'Flow end indicator should be more indented than parent';
	            onError(end, 'BAD_INDENT', msg, true);
	        }
	    }
	}

	function mapIncludes(ctx, items, search) {
	    const { uniqueKeys } = ctx.options;
	    if (uniqueKeys === false)
	        return false;
	    const isEqual = typeof uniqueKeys === 'function'
	        ? uniqueKeys
	        : (a, b) => a === b || (isScalar(a) && isScalar(b) && a.value === b.value);
	    return items.some(pair => isEqual(pair.key, search));
	}

	const startColMsg = 'All mapping items must start at the same column';
	function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
	    const NodeClass = tag?.nodeClass ?? YAMLMap;
	    const map = new NodeClass(ctx.schema);
	    if (ctx.atRoot)
	        ctx.atRoot = false;
	    let offset = bm.offset;
	    let commentEnd = null;
	    for (const collItem of bm.items) {
	        const { start, key, sep, value } = collItem;
	        const keyProps = resolveProps(start, {
	            indicator: 'explicit-key-ind',
	            next: key ?? sep?.[0],
	            offset,
	            onError,
	            parentIndent: bm.indent,
	            startOnNewline: true
	        });
	        const implicitKey = !keyProps.found;
	        if (implicitKey) {
	            if (key) {
	                if (key.type === 'block-seq')
	                    onError(offset, 'BLOCK_AS_IMPLICIT_KEY', 'A block sequence may not be used as an implicit map key');
	                else if ('indent' in key && key.indent !== bm.indent)
	                    onError(offset, 'BAD_INDENT', startColMsg);
	            }
	            if (!keyProps.anchor && !keyProps.tag && !sep) {
	                commentEnd = keyProps.end;
	                if (keyProps.comment) {
	                    if (map.comment)
	                        map.comment += '\n' + keyProps.comment;
	                    else
	                        map.comment = keyProps.comment;
	                }
	                continue;
	            }
	            if (keyProps.newlineAfterProp || containsNewline(key)) {
	                onError(key ?? start[start.length - 1], 'MULTILINE_IMPLICIT_KEY', 'Implicit keys need to be on a single line');
	            }
	        }
	        else if (keyProps.found?.indent !== bm.indent) {
	            onError(offset, 'BAD_INDENT', startColMsg);
	        }
	        ctx.atKey = true;
	        const keyStart = keyProps.end;
	        const keyNode = key
	            ? composeNode(ctx, key, keyProps, onError)
	            : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
	        if (ctx.schema.compat)
	            flowIndentCheck(bm.indent, key, onError);
	        ctx.atKey = false;
	        if (mapIncludes(ctx, map.items, keyNode))
	            onError(keyStart, 'DUPLICATE_KEY', 'Map keys must be unique');
	        const valueProps = resolveProps(sep ?? [], {
	            indicator: 'map-value-ind',
	            next: value,
	            offset: keyNode.range[2],
	            onError,
	            parentIndent: bm.indent,
	            startOnNewline: !key || key.type === 'block-scalar'
	        });
	        offset = valueProps.end;
	        if (valueProps.found) {
	            if (implicitKey) {
	                if (value?.type === 'block-map' && !valueProps.hasNewline)
	                    onError(offset, 'BLOCK_AS_IMPLICIT_KEY', 'Nested mappings are not allowed in compact mappings');
	                if (ctx.options.strict &&
	                    keyProps.start < valueProps.found.offset - 1024)
	                    onError(keyNode.range, 'KEY_OVER_1024_CHARS', 'The : indicator must be at most 1024 chars after the start of an implicit block mapping key');
	            }
	            const valueNode = value
	                ? composeNode(ctx, value, valueProps, onError)
	                : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
	            if (ctx.schema.compat)
	                flowIndentCheck(bm.indent, value, onError);
	            offset = valueNode.range[2];
	            const pair = new Pair(keyNode, valueNode);
	            if (ctx.options.keepSourceTokens)
	                pair.srcToken = collItem;
	            map.items.push(pair);
	        }
	        else {
	            if (implicitKey)
	                onError(keyNode.range, 'MISSING_CHAR', 'Implicit map keys need to be followed by map values');
	            if (valueProps.comment) {
	                if (keyNode.comment)
	                    keyNode.comment += '\n' + valueProps.comment;
	                else
	                    keyNode.comment = valueProps.comment;
	            }
	            const pair = new Pair(keyNode);
	            if (ctx.options.keepSourceTokens)
	                pair.srcToken = collItem;
	            map.items.push(pair);
	        }
	    }
	    if (commentEnd && commentEnd < offset)
	        onError(commentEnd, 'IMPOSSIBLE', 'Map comment with trailing content');
	    map.range = [bm.offset, offset, commentEnd ?? offset];
	    return map;
	}

	function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
	    const NodeClass = tag?.nodeClass ?? YAMLSeq;
	    const seq = new NodeClass(ctx.schema);
	    if (ctx.atRoot)
	        ctx.atRoot = false;
	    if (ctx.atKey)
	        ctx.atKey = false;
	    let offset = bs.offset;
	    let commentEnd = null;
	    for (const { start, value } of bs.items) {
	        const props = resolveProps(start, {
	            indicator: 'seq-item-ind',
	            next: value,
	            offset,
	            onError,
	            parentIndent: bs.indent,
	            startOnNewline: true
	        });
	        if (!props.found) {
	            if (props.anchor || props.tag || value) {
	                if (value?.type === 'block-seq')
	                    onError(props.end, 'BAD_INDENT', 'All sequence items must start at the same column');
	                else
	                    onError(offset, 'MISSING_CHAR', 'Sequence item without - indicator');
	            }
	            else {
	                commentEnd = props.end;
	                if (props.comment)
	                    seq.comment = props.comment;
	                continue;
	            }
	        }
	        const node = value
	            ? composeNode(ctx, value, props, onError)
	            : composeEmptyNode(ctx, props.end, start, null, props, onError);
	        if (ctx.schema.compat)
	            flowIndentCheck(bs.indent, value, onError);
	        offset = node.range[2];
	        seq.items.push(node);
	    }
	    seq.range = [bs.offset, offset, commentEnd ?? offset];
	    return seq;
	}

	function resolveEnd(end, offset, reqSpace, onError) {
	    let comment = '';
	    if (end) {
	        let hasSpace = false;
	        let sep = '';
	        for (const token of end) {
	            const { source, type } = token;
	            switch (type) {
	                case 'space':
	                    hasSpace = true;
	                    break;
	                case 'comment': {
	                    if (reqSpace && !hasSpace)
	                        onError(token, 'MISSING_CHAR', 'Comments must be separated from other tokens by white space characters');
	                    const cb = source.substring(1) || ' ';
	                    if (!comment)
	                        comment = cb;
	                    else
	                        comment += sep + cb;
	                    sep = '';
	                    break;
	                }
	                case 'newline':
	                    if (comment)
	                        sep += source;
	                    hasSpace = true;
	                    break;
	                default:
	                    onError(token, 'UNEXPECTED_TOKEN', `Unexpected ${type} at node end`);
	            }
	            offset += source.length;
	        }
	    }
	    return { comment, offset };
	}

	const blockMsg = 'Block collections are not allowed within flow collections';
	const isBlock = (token) => token && (token.type === 'block-map' || token.type === 'block-seq');
	function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
	    const isMap = fc.start.source === '{';
	    const fcName = isMap ? 'flow map' : 'flow sequence';
	    const NodeClass = (tag?.nodeClass ?? (isMap ? YAMLMap : YAMLSeq));
	    const coll = new NodeClass(ctx.schema);
	    coll.flow = true;
	    const atRoot = ctx.atRoot;
	    if (atRoot)
	        ctx.atRoot = false;
	    if (ctx.atKey)
	        ctx.atKey = false;
	    let offset = fc.offset + fc.start.source.length;
	    for (let i = 0; i < fc.items.length; ++i) {
	        const collItem = fc.items[i];
	        const { start, key, sep, value } = collItem;
	        const props = resolveProps(start, {
	            flow: fcName,
	            indicator: 'explicit-key-ind',
	            next: key ?? sep?.[0],
	            offset,
	            onError,
	            parentIndent: fc.indent,
	            startOnNewline: false
	        });
	        if (!props.found) {
	            if (!props.anchor && !props.tag && !sep && !value) {
	                if (i === 0 && props.comma)
	                    onError(props.comma, 'UNEXPECTED_TOKEN', `Unexpected , in ${fcName}`);
	                else if (i < fc.items.length - 1)
	                    onError(props.start, 'UNEXPECTED_TOKEN', `Unexpected empty item in ${fcName}`);
	                if (props.comment) {
	                    if (coll.comment)
	                        coll.comment += '\n' + props.comment;
	                    else
	                        coll.comment = props.comment;
	                }
	                offset = props.end;
	                continue;
	            }
	            if (!isMap && ctx.options.strict && containsNewline(key))
	                onError(key,
	                'MULTILINE_IMPLICIT_KEY', 'Implicit keys of flow sequence pairs need to be on a single line');
	        }
	        if (i === 0) {
	            if (props.comma)
	                onError(props.comma, 'UNEXPECTED_TOKEN', `Unexpected , in ${fcName}`);
	        }
	        else {
	            if (!props.comma)
	                onError(props.start, 'MISSING_CHAR', `Missing , between ${fcName} items`);
	            if (props.comment) {
	                let prevItemComment = '';
	                loop: for (const st of start) {
	                    switch (st.type) {
	                        case 'comma':
	                        case 'space':
	                            break;
	                        case 'comment':
	                            prevItemComment = st.source.substring(1);
	                            break loop;
	                        default:
	                            break loop;
	                    }
	                }
	                if (prevItemComment) {
	                    let prev = coll.items[coll.items.length - 1];
	                    if (isPair(prev))
	                        prev = prev.value ?? prev.key;
	                    if (prev.comment)
	                        prev.comment += '\n' + prevItemComment;
	                    else
	                        prev.comment = prevItemComment;
	                    props.comment = props.comment.substring(prevItemComment.length + 1);
	                }
	            }
	        }
	        if (!isMap && !sep && !props.found) {
	            const valueNode = value
	                ? composeNode(ctx, value, props, onError)
	                : composeEmptyNode(ctx, props.end, sep, null, props, onError);
	            coll.items.push(valueNode);
	            offset = valueNode.range[2];
	            if (isBlock(value))
	                onError(valueNode.range, 'BLOCK_IN_FLOW', blockMsg);
	        }
	        else {
	            ctx.atKey = true;
	            const keyStart = props.end;
	            const keyNode = key
	                ? composeNode(ctx, key, props, onError)
	                : composeEmptyNode(ctx, keyStart, start, null, props, onError);
	            if (isBlock(key))
	                onError(keyNode.range, 'BLOCK_IN_FLOW', blockMsg);
	            ctx.atKey = false;
	            const valueProps = resolveProps(sep ?? [], {
	                flow: fcName,
	                indicator: 'map-value-ind',
	                next: value,
	                offset: keyNode.range[2],
	                onError,
	                parentIndent: fc.indent,
	                startOnNewline: false
	            });
	            if (valueProps.found) {
	                if (!isMap && !props.found && ctx.options.strict) {
	                    if (sep)
	                        for (const st of sep) {
	                            if (st === valueProps.found)
	                                break;
	                            if (st.type === 'newline') {
	                                onError(st, 'MULTILINE_IMPLICIT_KEY', 'Implicit keys of flow sequence pairs need to be on a single line');
	                                break;
	                            }
	                        }
	                    if (props.start < valueProps.found.offset - 1024)
	                        onError(valueProps.found, 'KEY_OVER_1024_CHARS', 'The : indicator must be at most 1024 chars after the start of an implicit flow sequence key');
	                }
	            }
	            else if (value) {
	                if ('source' in value && value.source?.[0] === ':')
	                    onError(value, 'MISSING_CHAR', `Missing space after : in ${fcName}`);
	                else
	                    onError(valueProps.start, 'MISSING_CHAR', `Missing , or : between ${fcName} items`);
	            }
	            const valueNode = value
	                ? composeNode(ctx, value, valueProps, onError)
	                : valueProps.found
	                    ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError)
	                    : null;
	            if (valueNode) {
	                if (isBlock(value))
	                    onError(valueNode.range, 'BLOCK_IN_FLOW', blockMsg);
	            }
	            else if (valueProps.comment) {
	                if (keyNode.comment)
	                    keyNode.comment += '\n' + valueProps.comment;
	                else
	                    keyNode.comment = valueProps.comment;
	            }
	            const pair = new Pair(keyNode, valueNode);
	            if (ctx.options.keepSourceTokens)
	                pair.srcToken = collItem;
	            if (isMap) {
	                const map = coll;
	                if (mapIncludes(ctx, map.items, keyNode))
	                    onError(keyStart, 'DUPLICATE_KEY', 'Map keys must be unique');
	                map.items.push(pair);
	            }
	            else {
	                const map = new YAMLMap(ctx.schema);
	                map.flow = true;
	                map.items.push(pair);
	                const endRange = (valueNode ?? keyNode).range;
	                map.range = [keyNode.range[0], endRange[1], endRange[2]];
	                coll.items.push(map);
	            }
	            offset = valueNode ? valueNode.range[2] : valueProps.end;
	        }
	    }
	    const expectedEnd = isMap ? '}' : ']';
	    const [ce, ...ee] = fc.end;
	    let cePos = offset;
	    if (ce?.source === expectedEnd)
	        cePos = ce.offset + ce.source.length;
	    else {
	        const name = fcName[0].toUpperCase() + fcName.substring(1);
	        const msg = atRoot
	            ? `${name} must end with a ${expectedEnd}`
	            : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
	        onError(offset, atRoot ? 'MISSING_CHAR' : 'BAD_INDENT', msg);
	        if (ce && ce.source.length !== 1)
	            ee.unshift(ce);
	    }
	    if (ee.length > 0) {
	        const end = resolveEnd(ee, cePos, ctx.options.strict, onError);
	        if (end.comment) {
	            if (coll.comment)
	                coll.comment += '\n' + end.comment;
	            else
	                coll.comment = end.comment;
	        }
	        coll.range = [fc.offset, cePos, end.offset];
	    }
	    else {
	        coll.range = [fc.offset, cePos, cePos];
	    }
	    return coll;
	}

	function resolveCollection(CN, ctx, token, onError, tagName, tag) {
	    const coll = token.type === 'block-map'
	        ? resolveBlockMap(CN, ctx, token, onError, tag)
	        : token.type === 'block-seq'
	            ? resolveBlockSeq(CN, ctx, token, onError, tag)
	            : resolveFlowCollection(CN, ctx, token, onError, tag);
	    const Coll = coll.constructor;
	    if (tagName === '!' || tagName === Coll.tagName) {
	        coll.tag = Coll.tagName;
	        return coll;
	    }
	    if (tagName)
	        coll.tag = tagName;
	    return coll;
	}
	function composeCollection(CN, ctx, token, props, onError) {
	    const tagToken = props.tag;
	    const tagName = !tagToken
	        ? null
	        : ctx.directives.tagName(tagToken.source, msg => onError(tagToken, 'TAG_RESOLVE_FAILED', msg));
	    if (token.type === 'block-seq') {
	        const { anchor, newlineAfterProp: nl } = props;
	        const lastProp = anchor && tagToken
	            ? anchor.offset > tagToken.offset
	                ? anchor
	                : tagToken
	            : (anchor ?? tagToken);
	        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
	            const message = 'Missing newline after block sequence props';
	            onError(lastProp, 'MISSING_CHAR', message);
	        }
	    }
	    const expType = token.type === 'block-map'
	        ? 'map'
	        : token.type === 'block-seq'
	            ? 'seq'
	            : token.start.source === '{'
	                ? 'map'
	                : 'seq';
	    if (!tagToken ||
	        !tagName ||
	        tagName === '!' ||
	        (tagName === YAMLMap.tagName && expType === 'map') ||
	        (tagName === YAMLSeq.tagName && expType === 'seq')) {
	        return resolveCollection(CN, ctx, token, onError, tagName);
	    }
	    let tag = ctx.schema.tags.find(t => t.tag === tagName && t.collection === expType);
	    if (!tag) {
	        const kt = ctx.schema.knownTags[tagName];
	        if (kt?.collection === expType) {
	            ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
	            tag = kt;
	        }
	        else {
	            if (kt) {
	                onError(tagToken, 'BAD_COLLECTION_TYPE', `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? 'scalar'}`, true);
	            }
	            else {
	                onError(tagToken, 'TAG_RESOLVE_FAILED', `Unresolved tag: ${tagName}`, true);
	            }
	            return resolveCollection(CN, ctx, token, onError, tagName);
	        }
	    }
	    const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
	    const res = tag.resolve?.(coll, msg => onError(tagToken, 'TAG_RESOLVE_FAILED', msg), ctx.options) ?? coll;
	    const node = isNode(res)
	        ? res
	        : new Scalar(res);
	    node.range = coll.range;
	    node.tag = tagName;
	    if (tag?.format)
	        node.format = tag.format;
	    return node;
	}

	function resolveBlockScalar(ctx, scalar, onError) {
	    const start = scalar.offset;
	    const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
	    if (!header)
	        return { value: '', type: null, comment: '', range: [start, start, start] };
	    const type = header.mode === '>' ? Scalar.BLOCK_FOLDED : Scalar.BLOCK_LITERAL;
	    const lines = scalar.source ? splitLines(scalar.source) : [];
	    let chompStart = lines.length;
	    for (let i = lines.length - 1; i >= 0; --i) {
	        const content = lines[i][1];
	        if (content === '' || content === '\r')
	            chompStart = i;
	        else
	            break;
	    }
	    if (chompStart === 0) {
	        const value = header.chomp === '+' && lines.length > 0
	            ? '\n'.repeat(Math.max(1, lines.length - 1))
	            : '';
	        let end = start + header.length;
	        if (scalar.source)
	            end += scalar.source.length;
	        return { value, type, comment: header.comment, range: [start, end, end] };
	    }
	    let trimIndent = scalar.indent + header.indent;
	    let offset = scalar.offset + header.length;
	    let contentStart = 0;
	    for (let i = 0; i < chompStart; ++i) {
	        const [indent, content] = lines[i];
	        if (content === '' || content === '\r') {
	            if (header.indent === 0 && indent.length > trimIndent)
	                trimIndent = indent.length;
	        }
	        else {
	            if (indent.length < trimIndent) {
	                const message = 'Block scalars with more-indented leading empty lines must use an explicit indentation indicator';
	                onError(offset + indent.length, 'MISSING_CHAR', message);
	            }
	            if (header.indent === 0)
	                trimIndent = indent.length;
	            contentStart = i;
	            if (trimIndent === 0 && !ctx.atRoot) {
	                const message = 'Block scalar values in collections must be indented';
	                onError(offset, 'BAD_INDENT', message);
	            }
	            break;
	        }
	        offset += indent.length + content.length + 1;
	    }
	    for (let i = lines.length - 1; i >= chompStart; --i) {
	        if (lines[i][0].length > trimIndent)
	            chompStart = i + 1;
	    }
	    let value = '';
	    let sep = '';
	    let prevMoreIndented = false;
	    for (let i = 0; i < contentStart; ++i)
	        value += lines[i][0].slice(trimIndent) + '\n';
	    for (let i = contentStart; i < chompStart; ++i) {
	        let [indent, content] = lines[i];
	        offset += indent.length + content.length + 1;
	        const crlf = content[content.length - 1] === '\r';
	        if (crlf)
	            content = content.slice(0, -1);
	        if (content && indent.length < trimIndent) {
	            const src = header.indent
	                ? 'explicit indentation indicator'
	                : 'first line';
	            const message = `Block scalar lines must not be less indented than their ${src}`;
	            onError(offset - content.length - (crlf ? 2 : 1), 'BAD_INDENT', message);
	            indent = '';
	        }
	        if (type === Scalar.BLOCK_LITERAL) {
	            value += sep + indent.slice(trimIndent) + content;
	            sep = '\n';
	        }
	        else if (indent.length > trimIndent || content[0] === '\t') {
	            if (sep === ' ')
	                sep = '\n';
	            else if (!prevMoreIndented && sep === '\n')
	                sep = '\n\n';
	            value += sep + indent.slice(trimIndent) + content;
	            sep = '\n';
	            prevMoreIndented = true;
	        }
	        else if (content === '') {
	            if (sep === '\n')
	                value += '\n';
	            else
	                sep = '\n';
	        }
	        else {
	            value += sep + content;
	            sep = ' ';
	            prevMoreIndented = false;
	        }
	    }
	    switch (header.chomp) {
	        case '-':
	            break;
	        case '+':
	            for (let i = chompStart; i < lines.length; ++i)
	                value += '\n' + lines[i][0].slice(trimIndent);
	            if (value[value.length - 1] !== '\n')
	                value += '\n';
	            break;
	        default:
	            value += '\n';
	    }
	    const end = start + header.length + scalar.source.length;
	    return { value, type, comment: header.comment, range: [start, end, end] };
	}
	function parseBlockScalarHeader({ offset, props }, strict, onError) {
	    if (props[0].type !== 'block-scalar-header') {
	        onError(props[0], 'IMPOSSIBLE', 'Block scalar header not found');
	        return null;
	    }
	    const { source } = props[0];
	    const mode = source[0];
	    let indent = 0;
	    let chomp = '';
	    let error = -1;
	    for (let i = 1; i < source.length; ++i) {
	        const ch = source[i];
	        if (!chomp && (ch === '-' || ch === '+'))
	            chomp = ch;
	        else {
	            const n = Number(ch);
	            if (!indent && n)
	                indent = n;
	            else if (error === -1)
	                error = offset + i;
	        }
	    }
	    if (error !== -1)
	        onError(error, 'UNEXPECTED_TOKEN', `Block scalar header includes extra characters: ${source}`);
	    let hasSpace = false;
	    let comment = '';
	    let length = source.length;
	    for (let i = 1; i < props.length; ++i) {
	        const token = props[i];
	        switch (token.type) {
	            case 'space':
	                hasSpace = true;
	            case 'newline':
	                length += token.source.length;
	                break;
	            case 'comment':
	                if (strict && !hasSpace) {
	                    const message = 'Comments must be separated from other tokens by white space characters';
	                    onError(token, 'MISSING_CHAR', message);
	                }
	                length += token.source.length;
	                comment = token.source.substring(1);
	                break;
	            case 'error':
	                onError(token, 'UNEXPECTED_TOKEN', token.message);
	                length += token.source.length;
	                break;
	            default: {
	                const message = `Unexpected token in block scalar header: ${token.type}`;
	                onError(token, 'UNEXPECTED_TOKEN', message);
	                const ts = token.source;
	                if (ts && typeof ts === 'string')
	                    length += ts.length;
	            }
	        }
	    }
	    return { mode, indent, chomp, comment, length };
	}
	function splitLines(source) {
	    const split = source.split(/\n( *)/);
	    const first = split[0];
	    const m = first.match(/^( *)/);
	    const line0 = m?.[1]
	        ? [m[1], first.slice(m[1].length)]
	        : ['', first];
	    const lines = [line0];
	    for (let i = 1; i < split.length; i += 2)
	        lines.push([split[i], split[i + 1]]);
	    return lines;
	}

	function resolveFlowScalar(scalar, strict, onError) {
	    const { offset, type, source, end } = scalar;
	    let _type;
	    let value;
	    const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
	    switch (type) {
	        case 'scalar':
	            _type = Scalar.PLAIN;
	            value = plainValue(source, _onError);
	            break;
	        case 'single-quoted-scalar':
	            _type = Scalar.QUOTE_SINGLE;
	            value = singleQuotedValue(source, _onError);
	            break;
	        case 'double-quoted-scalar':
	            _type = Scalar.QUOTE_DOUBLE;
	            value = doubleQuotedValue(source, _onError);
	            break;
	        default:
	            onError(scalar, 'UNEXPECTED_TOKEN', `Expected a flow scalar value, but found: ${type}`);
	            return {
	                value: '',
	                type: null,
	                comment: '',
	                range: [offset, offset + source.length, offset + source.length]
	            };
	    }
	    const valueEnd = offset + source.length;
	    const re = resolveEnd(end, valueEnd, strict, onError);
	    return {
	        value,
	        type: _type,
	        comment: re.comment,
	        range: [offset, valueEnd, re.offset]
	    };
	}
	function plainValue(source, onError) {
	    let badChar = '';
	    switch (source[0]) {
	        case '\t':
	            badChar = 'a tab character';
	            break;
	        case ',':
	            badChar = 'flow indicator character ,';
	            break;
	        case '%':
	            badChar = 'directive indicator character %';
	            break;
	        case '|':
	        case '>': {
	            badChar = `block scalar indicator ${source[0]}`;
	            break;
	        }
	        case '@':
	        case '`': {
	            badChar = `reserved character ${source[0]}`;
	            break;
	        }
	    }
	    if (badChar)
	        onError(0, 'BAD_SCALAR_START', `Plain value cannot start with ${badChar}`);
	    return foldLines(source);
	}
	function singleQuotedValue(source, onError) {
	    if (source[source.length - 1] !== "'" || source.length === 1)
	        onError(source.length, 'MISSING_CHAR', "Missing closing 'quote");
	    return foldLines(source.slice(1, -1)).replace(/''/g, "'");
	}
	function foldLines(source) {
	    let first, line;
	    try {
	        first = new RegExp('(.*?)(?<![ \t])[ \t]*\r?\n', 'sy');
	        line = new RegExp('[ \t]*(.*?)(?:(?<![ \t])[ \t]*)?\r?\n', 'sy');
	    }
	    catch {
	        first = /(.*?)[ \t]*\r?\n/sy;
	        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
	    }
	    let match = first.exec(source);
	    if (!match)
	        return source;
	    let res = match[1];
	    let sep = ' ';
	    let pos = first.lastIndex;
	    line.lastIndex = pos;
	    while ((match = line.exec(source))) {
	        if (match[1] === '') {
	            if (sep === '\n')
	                res += sep;
	            else
	                sep = '\n';
	        }
	        else {
	            res += sep + match[1];
	            sep = ' ';
	        }
	        pos = line.lastIndex;
	    }
	    const last = /[ \t]*(.*)/sy;
	    last.lastIndex = pos;
	    match = last.exec(source);
	    return res + sep + (match?.[1] ?? '');
	}
	function doubleQuotedValue(source, onError) {
	    let res = '';
	    for (let i = 1; i < source.length - 1; ++i) {
	        const ch = source[i];
	        if (ch === '\r' && source[i + 1] === '\n')
	            continue;
	        if (ch === '\n') {
	            const { fold, offset } = foldNewline(source, i);
	            res += fold;
	            i = offset;
	        }
	        else if (ch === '\\') {
	            let next = source[++i];
	            const cc = escapeCodes[next];
	            if (cc)
	                res += cc;
	            else if (next === '\n') {
	                next = source[i + 1];
	                while (next === ' ' || next === '\t')
	                    next = source[++i + 1];
	            }
	            else if (next === '\r' && source[i + 1] === '\n') {
	                next = source[++i + 1];
	                while (next === ' ' || next === '\t')
	                    next = source[++i + 1];
	            }
	            else if (next === 'x' || next === 'u' || next === 'U') {
	                const length = next === 'x' ? 2 : next === 'u' ? 4 : 8;
	                res += parseCharCode(source, i + 1, length, onError);
	                i += length;
	            }
	            else {
	                const raw = source.substr(i - 1, 2);
	                onError(i - 1, 'BAD_DQ_ESCAPE', `Invalid escape sequence ${raw}`);
	                res += raw;
	            }
	        }
	        else if (ch === ' ' || ch === '\t') {
	            const wsStart = i;
	            let next = source[i + 1];
	            while (next === ' ' || next === '\t')
	                next = source[++i + 1];
	            if (next !== '\n' && !(next === '\r' && source[i + 2] === '\n'))
	                res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
	        }
	        else {
	            res += ch;
	        }
	    }
	    if (source[source.length - 1] !== '"' || source.length === 1)
	        onError(source.length, 'MISSING_CHAR', 'Missing closing "quote');
	    return res;
	}
	function foldNewline(source, offset) {
	    let fold = '';
	    let ch = source[offset + 1];
	    while (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
	        if (ch === '\r' && source[offset + 2] !== '\n')
	            break;
	        if (ch === '\n')
	            fold += '\n';
	        offset += 1;
	        ch = source[offset + 1];
	    }
	    if (!fold)
	        fold = ' ';
	    return { fold, offset };
	}
	const escapeCodes = {
	    '0': '\0',
	    a: '\x07',
	    b: '\b',
	    e: '\x1b',
	    f: '\f',
	    n: '\n',
	    r: '\r',
	    t: '\t',
	    v: '\v',
	    N: '\u0085',
	    _: '\u00a0',
	    L: '\u2028',
	    P: '\u2029',
	    ' ': ' ',
	    '"': '"',
	    '/': '/',
	    '\\': '\\',
	    '\t': '\t'
	};
	function parseCharCode(source, offset, length, onError) {
	    const cc = source.substr(offset, length);
	    const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
	    const code = ok ? parseInt(cc, 16) : NaN;
	    try {
	        return String.fromCodePoint(code);
	    }
	    catch {
	        const raw = source.substr(offset - 2, length + 2);
	        onError(offset - 2, 'BAD_DQ_ESCAPE', `Invalid escape sequence ${raw}`);
	        return raw;
	    }
	}

	function composeScalar(ctx, token, tagToken, onError) {
	    const { value, type, comment, range } = token.type === 'block-scalar'
	        ? resolveBlockScalar(ctx, token, onError)
	        : resolveFlowScalar(token, ctx.options.strict, onError);
	    const tagName = tagToken
	        ? ctx.directives.tagName(tagToken.source, msg => onError(tagToken, 'TAG_RESOLVE_FAILED', msg))
	        : null;
	    let tag;
	    if (ctx.options.stringKeys && ctx.atKey) {
	        tag = ctx.schema[SCALAR$1];
	    }
	    else if (tagName)
	        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
	    else if (token.type === 'scalar')
	        tag = findScalarTagByTest(ctx, value, token, onError);
	    else
	        tag = ctx.schema[SCALAR$1];
	    let scalar;
	    try {
	        const res = tag.resolve(value, msg => onError(tagToken ?? token, 'TAG_RESOLVE_FAILED', msg), ctx.options);
	        scalar = isScalar(res) ? res : new Scalar(res);
	    }
	    catch (error) {
	        const msg = error instanceof Error ? error.message : String(error);
	        onError(tagToken ?? token, 'TAG_RESOLVE_FAILED', msg);
	        scalar = new Scalar(value);
	    }
	    scalar.range = range;
	    scalar.source = value;
	    if (type)
	        scalar.type = type;
	    if (tagName)
	        scalar.tag = tagName;
	    if (tag.format)
	        scalar.format = tag.format;
	    if (comment)
	        scalar.comment = comment;
	    return scalar;
	}
	function findScalarTagByName(schema, value, tagName, tagToken, onError) {
	    if (tagName === '!')
	        return schema[SCALAR$1];
	    const matchWithTest = [];
	    for (const tag of schema.tags) {
	        if (!tag.collection && tag.tag === tagName) {
	            if (tag.default && tag.test)
	                matchWithTest.push(tag);
	            else
	                return tag;
	        }
	    }
	    for (const tag of matchWithTest)
	        if (tag.test?.test(value))
	            return tag;
	    const kt = schema.knownTags[tagName];
	    if (kt && !kt.collection) {
	        schema.tags.push(Object.assign({}, kt, { default: false, test: undefined }));
	        return kt;
	    }
	    onError(tagToken, 'TAG_RESOLVE_FAILED', `Unresolved tag: ${tagName}`, tagName !== 'tag:yaml.org,2002:str');
	    return schema[SCALAR$1];
	}
	function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
	    const tag = schema.tags.find(tag => (tag.default === true || (atKey && tag.default === 'key')) &&
	        tag.test?.test(value)) || schema[SCALAR$1];
	    if (schema.compat) {
	        const compat = schema.compat.find(tag => tag.default && tag.test?.test(value)) ??
	            schema[SCALAR$1];
	        if (tag.tag !== compat.tag) {
	            const ts = directives.tagString(tag.tag);
	            const cs = directives.tagString(compat.tag);
	            const msg = `Value may be parsed as either ${ts} or ${cs}`;
	            onError(token, 'TAG_RESOLVE_FAILED', msg, true);
	        }
	    }
	    return tag;
	}

	function emptyScalarPosition(offset, before, pos) {
	    if (before) {
	        pos ?? (pos = before.length);
	        for (let i = pos - 1; i >= 0; --i) {
	            let st = before[i];
	            switch (st.type) {
	                case 'space':
	                case 'comment':
	                case 'newline':
	                    offset -= st.source.length;
	                    continue;
	            }
	            st = before[++i];
	            while (st?.type === 'space') {
	                offset += st.source.length;
	                st = before[++i];
	            }
	            break;
	        }
	    }
	    return offset;
	}

	const CN = { composeNode, composeEmptyNode };
	function composeNode(ctx, token, props, onError) {
	    const atKey = ctx.atKey;
	    const { spaceBefore, comment, anchor, tag } = props;
	    let node;
	    let isSrcToken = true;
	    switch (token.type) {
	        case 'alias':
	            node = composeAlias(ctx, token, onError);
	            if (anchor || tag)
	                onError(token, 'ALIAS_PROPS', 'An alias node must not specify any properties');
	            break;
	        case 'scalar':
	        case 'single-quoted-scalar':
	        case 'double-quoted-scalar':
	        case 'block-scalar':
	            node = composeScalar(ctx, token, tag, onError);
	            if (anchor)
	                node.anchor = anchor.source.substring(1);
	            break;
	        case 'block-map':
	        case 'block-seq':
	        case 'flow-collection':
	            try {
	                node = composeCollection(CN, ctx, token, props, onError);
	                if (anchor)
	                    node.anchor = anchor.source.substring(1);
	            }
	            catch (error) {
	                const message = error instanceof Error ? error.message : String(error);
	                onError(token, 'RESOURCE_EXHAUSTION', message);
	            }
	            break;
	        default: {
	            const message = token.type === 'error'
	                ? token.message
	                : `Unsupported token (type: ${token.type})`;
	            onError(token, 'UNEXPECTED_TOKEN', message);
	            isSrcToken = false;
	        }
	    }
	    node ?? (node = composeEmptyNode(ctx, token.offset, undefined, null, props, onError));
	    if (anchor && node.anchor === '')
	        onError(anchor, 'BAD_ALIAS', 'Anchor cannot be an empty string');
	    if (atKey &&
	        ctx.options.stringKeys &&
	        (!isScalar(node) ||
	            typeof node.value !== 'string' ||
	            (node.tag && node.tag !== 'tag:yaml.org,2002:str'))) {
	        const msg = 'With stringKeys, all keys must be strings';
	        onError(tag ?? token, 'NON_STRING_KEY', msg);
	    }
	    if (spaceBefore)
	        node.spaceBefore = true;
	    if (comment) {
	        if (token.type === 'scalar' && token.source === '')
	            node.comment = comment;
	        else
	            node.commentBefore = comment;
	    }
	    if (ctx.options.keepSourceTokens && isSrcToken)
	        node.srcToken = token;
	    return node;
	}
	function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
	    const token = {
	        type: 'scalar',
	        offset: emptyScalarPosition(offset, before, pos),
	        indent: -1,
	        source: ''
	    };
	    const node = composeScalar(ctx, token, tag, onError);
	    if (anchor) {
	        node.anchor = anchor.source.substring(1);
	        if (node.anchor === '')
	            onError(anchor, 'BAD_ALIAS', 'Anchor cannot be an empty string');
	    }
	    if (spaceBefore)
	        node.spaceBefore = true;
	    if (comment) {
	        node.comment = comment;
	        node.range[2] = end;
	    }
	    return node;
	}
	function composeAlias({ options }, { offset, source, end }, onError) {
	    const alias = new Alias(source.substring(1));
	    if (alias.source === '')
	        onError(offset, 'BAD_ALIAS', 'Alias cannot be an empty string');
	    if (alias.source.endsWith(':'))
	        onError(offset + source.length - 1, 'BAD_ALIAS', 'Alias ending in : is ambiguous', true);
	    const valueEnd = offset + source.length;
	    const re = resolveEnd(end, valueEnd, options.strict, onError);
	    alias.range = [offset, valueEnd, re.offset];
	    if (re.comment)
	        alias.comment = re.comment;
	    return alias;
	}

	function composeDoc(options, directives, { offset, start, value, end }, onError) {
	    const opts = Object.assign({ _directives: directives }, options);
	    const doc = new Document(undefined, opts);
	    const ctx = {
	        atKey: false,
	        atRoot: true,
	        directives: doc.directives,
	        options: doc.options,
	        schema: doc.schema
	    };
	    const props = resolveProps(start, {
	        indicator: 'doc-start',
	        next: value ?? end?.[0],
	        offset,
	        onError,
	        parentIndent: 0,
	        startOnNewline: true
	    });
	    if (props.found) {
	        doc.directives.docStart = true;
	        if (value &&
	            (value.type === 'block-map' || value.type === 'block-seq') &&
	            !props.hasNewline)
	            onError(props.end, 'MISSING_CHAR', 'Block collection cannot start on same line with directives-end marker');
	    }
	    doc.contents = value
	        ? composeNode(ctx, value, props, onError)
	        : composeEmptyNode(ctx, props.end, start, null, props, onError);
	    const contentEnd = doc.contents.range[2];
	    const re = resolveEnd(end, contentEnd, false, onError);
	    if (re.comment)
	        doc.comment = re.comment;
	    doc.range = [offset, contentEnd, re.offset];
	    return doc;
	}

	function getErrorPos(src) {
	    if (typeof src === 'number')
	        return [src, src + 1];
	    if (Array.isArray(src))
	        return src.length === 2 ? src : [src[0], src[1]];
	    const { offset, source } = src;
	    return [offset, offset + (typeof source === 'string' ? source.length : 1)];
	}
	function parsePrelude(prelude) {
	    let comment = '';
	    let atComment = false;
	    let afterEmptyLine = false;
	    for (let i = 0; i < prelude.length; ++i) {
	        const source = prelude[i];
	        switch (source[0]) {
	            case '#':
	                comment +=
	                    (comment === '' ? '' : afterEmptyLine ? '\n\n' : '\n') +
	                        (source.substring(1) || ' ');
	                atComment = true;
	                afterEmptyLine = false;
	                break;
	            case '%':
	                if (prelude[i + 1]?.[0] !== '#')
	                    i += 1;
	                atComment = false;
	                break;
	            default:
	                if (!atComment)
	                    afterEmptyLine = true;
	                atComment = false;
	        }
	    }
	    return { comment, afterEmptyLine };
	}
	class Composer {
	    constructor(options = {}) {
	        this.doc = null;
	        this.atDirectives = false;
	        this.prelude = [];
	        this.errors = [];
	        this.warnings = [];
	        this.onError = (source, code, message, warning) => {
	            const pos = getErrorPos(source);
	            if (warning)
	                this.warnings.push(new YAMLWarning(pos, code, message));
	            else
	                this.errors.push(new YAMLParseError(pos, code, message));
	        };
	        this.directives = new Directives({ version: options.version || '1.2' });
	        this.options = options;
	    }
	    decorate(doc, afterDoc) {
	        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
	        if (comment) {
	            const dc = doc.contents;
	            if (afterDoc) {
	                doc.comment = doc.comment ? `${doc.comment}\n${comment}` : comment;
	            }
	            else if (afterEmptyLine || doc.directives.docStart || !dc) {
	                doc.commentBefore = comment;
	            }
	            else if (isCollection(dc) && !dc.flow && dc.items.length > 0) {
	                let it = dc.items[0];
	                if (isPair(it))
	                    it = it.key;
	                const cb = it.commentBefore;
	                it.commentBefore = cb ? `${comment}\n${cb}` : comment;
	            }
	            else {
	                const cb = dc.commentBefore;
	                dc.commentBefore = cb ? `${comment}\n${cb}` : comment;
	            }
	        }
	        if (afterDoc) {
	            for (let i = 0; i < this.errors.length; ++i)
	                doc.errors.push(this.errors[i]);
	            for (let i = 0; i < this.warnings.length; ++i)
	                doc.warnings.push(this.warnings[i]);
	        }
	        else {
	            doc.errors = this.errors;
	            doc.warnings = this.warnings;
	        }
	        this.prelude = [];
	        this.errors = [];
	        this.warnings = [];
	    }
	    streamInfo() {
	        return {
	            comment: parsePrelude(this.prelude).comment,
	            directives: this.directives,
	            errors: this.errors,
	            warnings: this.warnings
	        };
	    }
	    *compose(tokens, forceDoc = false, endOffset = -1) {
	        for (const token of tokens)
	            yield* this.next(token);
	        yield* this.end(forceDoc, endOffset);
	    }
	    *next(token) {
	        switch (token.type) {
	            case 'directive':
	                this.directives.add(token.source, (offset, message, warning) => {
	                    const pos = getErrorPos(token);
	                    pos[0] += offset;
	                    this.onError(pos, 'BAD_DIRECTIVE', message, warning);
	                });
	                this.prelude.push(token.source);
	                this.atDirectives = true;
	                break;
	            case 'document': {
	                const doc = composeDoc(this.options, this.directives, token, this.onError);
	                if (this.atDirectives && !doc.directives.docStart)
	                    this.onError(token, 'MISSING_CHAR', 'Missing directives-end/doc-start indicator line');
	                this.decorate(doc, false);
	                if (this.doc)
	                    yield this.doc;
	                this.doc = doc;
	                this.atDirectives = false;
	                break;
	            }
	            case 'byte-order-mark':
	            case 'space':
	                break;
	            case 'comment':
	            case 'newline':
	                this.prelude.push(token.source);
	                break;
	            case 'error': {
	                const msg = token.source
	                    ? `${token.message}: ${JSON.stringify(token.source)}`
	                    : token.message;
	                const error = new YAMLParseError(getErrorPos(token), 'UNEXPECTED_TOKEN', msg);
	                if (this.atDirectives || !this.doc)
	                    this.errors.push(error);
	                else
	                    this.doc.errors.push(error);
	                break;
	            }
	            case 'doc-end': {
	                if (!this.doc) {
	                    const msg = 'Unexpected doc-end without preceding document';
	                    this.errors.push(new YAMLParseError(getErrorPos(token), 'UNEXPECTED_TOKEN', msg));
	                    break;
	                }
	                this.doc.directives.docEnd = true;
	                const end = resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
	                this.decorate(this.doc, true);
	                if (end.comment) {
	                    const dc = this.doc.comment;
	                    this.doc.comment = dc ? `${dc}\n${end.comment}` : end.comment;
	                }
	                this.doc.range[2] = end.offset;
	                break;
	            }
	            default:
	                this.errors.push(new YAMLParseError(getErrorPos(token), 'UNEXPECTED_TOKEN', `Unsupported token ${token.type}`));
	        }
	    }
	    *end(forceDoc = false, endOffset = -1) {
	        if (this.doc) {
	            this.decorate(this.doc, true);
	            yield this.doc;
	            this.doc = null;
	        }
	        else if (forceDoc) {
	            const opts = Object.assign({ _directives: this.directives }, this.options);
	            const doc = new Document(undefined, opts);
	            if (this.atDirectives)
	                this.onError(endOffset, 'MISSING_CHAR', 'Missing directives-end indicator line');
	            doc.range = [0, endOffset, endOffset];
	            this.decorate(doc, false);
	            yield doc;
	        }
	    }
	}

	const BOM = '\u{FEFF}';
	const DOCUMENT = '\x02';
	const FLOW_END = '\x18';
	const SCALAR = '\x1f';
	function tokenType(source) {
	    switch (source) {
	        case BOM:
	            return 'byte-order-mark';
	        case DOCUMENT:
	            return 'doc-mode';
	        case FLOW_END:
	            return 'flow-error-end';
	        case SCALAR:
	            return 'scalar';
	        case '---':
	            return 'doc-start';
	        case '...':
	            return 'doc-end';
	        case '':
	        case '\n':
	        case '\r\n':
	            return 'newline';
	        case '-':
	            return 'seq-item-ind';
	        case '?':
	            return 'explicit-key-ind';
	        case ':':
	            return 'map-value-ind';
	        case '{':
	            return 'flow-map-start';
	        case '}':
	            return 'flow-map-end';
	        case '[':
	            return 'flow-seq-start';
	        case ']':
	            return 'flow-seq-end';
	        case ',':
	            return 'comma';
	    }
	    switch (source[0]) {
	        case ' ':
	        case '\t':
	            return 'space';
	        case '#':
	            return 'comment';
	        case '%':
	            return 'directive-line';
	        case '*':
	            return 'alias';
	        case '&':
	            return 'anchor';
	        case '!':
	            return 'tag';
	        case "'":
	            return 'single-quoted-scalar';
	        case '"':
	            return 'double-quoted-scalar';
	        case '|':
	        case '>':
	            return 'block-scalar-header';
	    }
	    return null;
	}

	function isEmpty(ch) {
	    switch (ch) {
	        case undefined:
	        case ' ':
	        case '\n':
	        case '\r':
	        case '\t':
	            return true;
	        default:
	            return false;
	    }
	}
	const hexDigits = new Set('0123456789ABCDEFabcdef');
	const tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
	const flowIndicatorChars = new Set(',[]{}');
	const invalidAnchorChars = new Set(' ,[]{}\n\r\t');
	const isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
	class Lexer {
	    constructor() {
	        this.atEnd = false;
	        this.blockScalarIndent = -1;
	        this.blockScalarKeep = false;
	        this.buffer = '';
	        this.flowKey = false;
	        this.flowLevel = 0;
	        this.indentNext = 0;
	        this.indentValue = 0;
	        this.lineEndPos = null;
	        this.next = null;
	        this.pos = 0;
	    }
	    *lex(source, incomplete = false) {
	        if (source) {
	            if (typeof source !== 'string')
	                throw TypeError('source is not a string');
	            this.buffer = this.buffer ? this.buffer + source : source;
	            this.lineEndPos = null;
	        }
	        this.atEnd = !incomplete;
	        let next = this.next ?? 'stream';
	        while (next && (incomplete || this.hasChars(1)))
	            next = yield* this.parseNext(next);
	    }
	    atLineEnd() {
	        let i = this.pos;
	        let ch = this.buffer[i];
	        while (ch === ' ' || ch === '\t')
	            ch = this.buffer[++i];
	        if (!ch || ch === '#' || ch === '\n')
	            return true;
	        if (ch === '\r')
	            return this.buffer[i + 1] === '\n';
	        return false;
	    }
	    charAt(n) {
	        return this.buffer[this.pos + n];
	    }
	    continueScalar(offset) {
	        let ch = this.buffer[offset];
	        if (this.indentNext > 0) {
	            let indent = 0;
	            while (ch === ' ')
	                ch = this.buffer[++indent + offset];
	            if (ch === '\r') {
	                const next = this.buffer[indent + offset + 1];
	                if (next === '\n' || (!next && !this.atEnd))
	                    return offset + indent + 1;
	            }
	            return ch === '\n' || indent >= this.indentNext || (!ch && !this.atEnd)
	                ? offset + indent
	                : -1;
	        }
	        if (ch === '-' || ch === '.') {
	            const dt = this.buffer.substr(offset, 3);
	            if ((dt === '---' || dt === '...') && isEmpty(this.buffer[offset + 3]))
	                return -1;
	        }
	        return offset;
	    }
	    getLine() {
	        let end = this.lineEndPos;
	        if (typeof end !== 'number' || (end !== -1 && end < this.pos)) {
	            end = this.buffer.indexOf('\n', this.pos);
	            this.lineEndPos = end;
	        }
	        if (end === -1)
	            return this.atEnd ? this.buffer.substring(this.pos) : null;
	        if (this.buffer[end - 1] === '\r')
	            end -= 1;
	        return this.buffer.substring(this.pos, end);
	    }
	    hasChars(n) {
	        return this.pos + n <= this.buffer.length;
	    }
	    setNext(state) {
	        this.buffer = this.buffer.substring(this.pos);
	        this.pos = 0;
	        this.lineEndPos = null;
	        this.next = state;
	        return null;
	    }
	    peek(n) {
	        return this.buffer.substr(this.pos, n);
	    }
	    *parseNext(next) {
	        switch (next) {
	            case 'stream':
	                return yield* this.parseStream();
	            case 'line-start':
	                return yield* this.parseLineStart();
	            case 'block-start':
	                return yield* this.parseBlockStart();
	            case 'doc':
	                return yield* this.parseDocument();
	            case 'flow':
	                return yield* this.parseFlowCollection();
	            case 'quoted-scalar':
	                return yield* this.parseQuotedScalar();
	            case 'block-scalar':
	                return yield* this.parseBlockScalar();
	            case 'plain-scalar':
	                return yield* this.parsePlainScalar();
	        }
	    }
	    *parseStream() {
	        let line = this.getLine();
	        if (line === null)
	            return this.setNext('stream');
	        if (line[0] === BOM) {
	            yield* this.pushCount(1);
	            line = line.substring(1);
	        }
	        if (line[0] === '%') {
	            let dirEnd = line.length;
	            let cs = line.indexOf('#');
	            while (cs !== -1) {
	                const ch = line[cs - 1];
	                if (ch === ' ' || ch === '\t') {
	                    dirEnd = cs - 1;
	                    break;
	                }
	                else {
	                    cs = line.indexOf('#', cs + 1);
	                }
	            }
	            while (true) {
	                const ch = line[dirEnd - 1];
	                if (ch === ' ' || ch === '\t')
	                    dirEnd -= 1;
	                else
	                    break;
	            }
	            const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
	            yield* this.pushCount(line.length - n);
	            this.pushNewline();
	            return 'stream';
	        }
	        if (this.atLineEnd()) {
	            const sp = yield* this.pushSpaces(true);
	            yield* this.pushCount(line.length - sp);
	            yield* this.pushNewline();
	            return 'stream';
	        }
	        yield DOCUMENT;
	        return yield* this.parseLineStart();
	    }
	    *parseLineStart() {
	        const ch = this.charAt(0);
	        if (!ch && !this.atEnd)
	            return this.setNext('line-start');
	        if (ch === '-' || ch === '.') {
	            if (!this.atEnd && !this.hasChars(4))
	                return this.setNext('line-start');
	            const s = this.peek(3);
	            if ((s === '---' || s === '...') && isEmpty(this.charAt(3))) {
	                yield* this.pushCount(3);
	                this.indentValue = 0;
	                this.indentNext = 0;
	                return s === '---' ? 'doc' : 'stream';
	            }
	        }
	        this.indentValue = yield* this.pushSpaces(false);
	        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
	            this.indentNext = this.indentValue;
	        return yield* this.parseBlockStart();
	    }
	    *parseBlockStart() {
	        const [ch0, ch1] = this.peek(2);
	        if (!ch1 && !this.atEnd)
	            return this.setNext('block-start');
	        if ((ch0 === '-' || ch0 === '?' || ch0 === ':') && isEmpty(ch1)) {
	            const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
	            this.indentNext = this.indentValue + 1;
	            this.indentValue += n;
	            return 'block-start';
	        }
	        return 'doc';
	    }
	    *parseDocument() {
	        yield* this.pushSpaces(true);
	        const line = this.getLine();
	        if (line === null)
	            return this.setNext('doc');
	        let n = yield* this.pushIndicators();
	        switch (line[n]) {
	            case '#':
	                yield* this.pushCount(line.length - n);
	            case undefined:
	                yield* this.pushNewline();
	                return yield* this.parseLineStart();
	            case '{':
	            case '[':
	                yield* this.pushCount(1);
	                this.flowKey = false;
	                this.flowLevel = 1;
	                return 'flow';
	            case '}':
	            case ']':
	                yield* this.pushCount(1);
	                return 'doc';
	            case '*':
	                yield* this.pushUntil(isNotAnchorChar);
	                return 'doc';
	            case '"':
	            case "'":
	                return yield* this.parseQuotedScalar();
	            case '|':
	            case '>':
	                n += yield* this.parseBlockScalarHeader();
	                n += yield* this.pushSpaces(true);
	                yield* this.pushCount(line.length - n);
	                yield* this.pushNewline();
	                return yield* this.parseBlockScalar();
	            default:
	                return yield* this.parsePlainScalar();
	        }
	    }
	    *parseFlowCollection() {
	        let nl, sp;
	        let indent = -1;
	        do {
	            nl = yield* this.pushNewline();
	            if (nl > 0) {
	                sp = yield* this.pushSpaces(false);
	                this.indentValue = indent = sp;
	            }
	            else {
	                sp = 0;
	            }
	            sp += yield* this.pushSpaces(true);
	        } while (nl + sp > 0);
	        const line = this.getLine();
	        if (line === null)
	            return this.setNext('flow');
	        if ((indent !== -1 && indent < this.indentNext && line[0] !== '#') ||
	            (indent === 0 &&
	                (line.startsWith('---') || line.startsWith('...')) &&
	                isEmpty(line[3]))) {
	            const atFlowEndMarker = indent === this.indentNext - 1 &&
	                this.flowLevel === 1 &&
	                (line[0] === ']' || line[0] === '}');
	            if (!atFlowEndMarker) {
	                this.flowLevel = 0;
	                yield FLOW_END;
	                return yield* this.parseLineStart();
	            }
	        }
	        let n = 0;
	        while (line[n] === ',') {
	            n += yield* this.pushCount(1);
	            n += yield* this.pushSpaces(true);
	            this.flowKey = false;
	        }
	        n += yield* this.pushIndicators();
	        switch (line[n]) {
	            case undefined:
	                return 'flow';
	            case '#':
	                yield* this.pushCount(line.length - n);
	                return 'flow';
	            case '{':
	            case '[':
	                yield* this.pushCount(1);
	                this.flowKey = false;
	                this.flowLevel += 1;
	                return 'flow';
	            case '}':
	            case ']':
	                yield* this.pushCount(1);
	                this.flowKey = true;
	                this.flowLevel -= 1;
	                return this.flowLevel ? 'flow' : 'doc';
	            case '*':
	                yield* this.pushUntil(isNotAnchorChar);
	                return 'flow';
	            case '"':
	            case "'":
	                this.flowKey = true;
	                return yield* this.parseQuotedScalar();
	            case ':': {
	                const next = this.charAt(1);
	                if (this.flowKey || isEmpty(next) || next === ',') {
	                    this.flowKey = false;
	                    yield* this.pushCount(1);
	                    yield* this.pushSpaces(true);
	                    return 'flow';
	                }
	            }
	            default:
	                this.flowKey = false;
	                return yield* this.parsePlainScalar();
	        }
	    }
	    *parseQuotedScalar() {
	        const quote = this.charAt(0);
	        let end = this.buffer.indexOf(quote, this.pos + 1);
	        if (quote === "'") {
	            while (end !== -1 && this.buffer[end + 1] === "'")
	                end = this.buffer.indexOf("'", end + 2);
	        }
	        else {
	            while (end !== -1) {
	                let n = 0;
	                while (this.buffer[end - 1 - n] === '\\')
	                    n += 1;
	                if (n % 2 === 0)
	                    break;
	                end = this.buffer.indexOf('"', end + 1);
	            }
	        }
	        const qb = this.buffer.substring(0, end);
	        let nl = qb.indexOf('\n', this.pos);
	        if (nl !== -1) {
	            while (nl !== -1) {
	                const cs = this.continueScalar(nl + 1);
	                if (cs === -1)
	                    break;
	                nl = qb.indexOf('\n', cs);
	            }
	            if (nl !== -1) {
	                end = nl - (qb[nl - 1] === '\r' ? 2 : 1);
	            }
	        }
	        if (end === -1) {
	            if (!this.atEnd)
	                return this.setNext('quoted-scalar');
	            end = this.buffer.length;
	        }
	        yield* this.pushToIndex(end + 1, false);
	        return this.flowLevel ? 'flow' : 'doc';
	    }
	    *parseBlockScalarHeader() {
	        this.blockScalarIndent = -1;
	        this.blockScalarKeep = false;
	        let i = this.pos;
	        while (true) {
	            const ch = this.buffer[++i];
	            if (ch === '+')
	                this.blockScalarKeep = true;
	            else if (ch > '0' && ch <= '9')
	                this.blockScalarIndent = Number(ch) - 1;
	            else if (ch !== '-')
	                break;
	        }
	        return yield* this.pushUntil(ch => isEmpty(ch) || ch === '#');
	    }
	    *parseBlockScalar() {
	        let nl = this.pos - 1;
	        let indent = 0;
	        let ch;
	        loop: for (let i = this.pos; (ch = this.buffer[i]); ++i) {
	            switch (ch) {
	                case ' ':
	                    indent += 1;
	                    break;
	                case '\n':
	                    nl = i;
	                    indent = 0;
	                    break;
	                case '\r': {
	                    const next = this.buffer[i + 1];
	                    if (!next && !this.atEnd)
	                        return this.setNext('block-scalar');
	                    if (next === '\n')
	                        break;
	                }
	                default:
	                    break loop;
	            }
	        }
	        if (!ch && !this.atEnd)
	            return this.setNext('block-scalar');
	        if (indent >= this.indentNext) {
	            if (this.blockScalarIndent === -1)
	                this.indentNext = indent;
	            else {
	                this.indentNext =
	                    this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
	            }
	            do {
	                const cs = this.continueScalar(nl + 1);
	                if (cs === -1)
	                    break;
	                nl = this.buffer.indexOf('\n', cs);
	            } while (nl !== -1);
	            if (nl === -1) {
	                if (!this.atEnd)
	                    return this.setNext('block-scalar');
	                nl = this.buffer.length;
	            }
	        }
	        let i = nl + 1;
	        ch = this.buffer[i];
	        while (ch === ' ')
	            ch = this.buffer[++i];
	        if (ch === '\t') {
	            while (ch === '\t' || ch === ' ' || ch === '\r' || ch === '\n')
	                ch = this.buffer[++i];
	            nl = i - 1;
	        }
	        else if (!this.blockScalarKeep) {
	            do {
	                let i = nl - 1;
	                let ch = this.buffer[i];
	                if (ch === '\r')
	                    ch = this.buffer[--i];
	                const lastChar = i;
	                while (ch === ' ')
	                    ch = this.buffer[--i];
	                if (ch === '\n' && i >= this.pos && i + 1 + indent > lastChar)
	                    nl = i;
	                else
	                    break;
	            } while (true);
	        }
	        yield SCALAR;
	        yield* this.pushToIndex(nl + 1, true);
	        return yield* this.parseLineStart();
	    }
	    *parsePlainScalar() {
	        const inFlow = this.flowLevel > 0;
	        let end = this.pos - 1;
	        let i = this.pos - 1;
	        let ch;
	        while ((ch = this.buffer[++i])) {
	            if (ch === ':') {
	                const next = this.buffer[i + 1];
	                if (isEmpty(next) || (inFlow && flowIndicatorChars.has(next)))
	                    break;
	                end = i;
	            }
	            else if (isEmpty(ch)) {
	                let next = this.buffer[i + 1];
	                if (ch === '\r') {
	                    if (next === '\n') {
	                        i += 1;
	                        ch = '\n';
	                        next = this.buffer[i + 1];
	                    }
	                    else
	                        end = i;
	                }
	                if (next === '#' || (inFlow && flowIndicatorChars.has(next)))
	                    break;
	                if (ch === '\n') {
	                    const cs = this.continueScalar(i + 1);
	                    if (cs === -1)
	                        break;
	                    i = Math.max(i, cs - 2);
	                }
	            }
	            else {
	                if (inFlow && flowIndicatorChars.has(ch))
	                    break;
	                end = i;
	            }
	        }
	        if (!ch && !this.atEnd)
	            return this.setNext('plain-scalar');
	        yield SCALAR;
	        yield* this.pushToIndex(end + 1, true);
	        return inFlow ? 'flow' : 'doc';
	    }
	    *pushCount(n) {
	        if (n > 0) {
	            yield this.buffer.substr(this.pos, n);
	            this.pos += n;
	            return n;
	        }
	        return 0;
	    }
	    *pushToIndex(i, allowEmpty) {
	        const s = this.buffer.slice(this.pos, i);
	        if (s) {
	            yield s;
	            this.pos += s.length;
	            return s.length;
	        }
	        else if (allowEmpty)
	            yield '';
	        return 0;
	    }
	    *pushIndicators() {
	        let n = 0;
	        loop: while (true) {
	            switch (this.charAt(0)) {
	                case '!':
	                    n += yield* this.pushTag();
	                    n += yield* this.pushSpaces(true);
	                    continue loop;
	                case '&':
	                    n += yield* this.pushUntil(isNotAnchorChar);
	                    n += yield* this.pushSpaces(true);
	                    continue loop;
	                case '-':
	                case '?':
	                case ':': {
	                    const inFlow = this.flowLevel > 0;
	                    const ch1 = this.charAt(1);
	                    if (isEmpty(ch1) || (inFlow && flowIndicatorChars.has(ch1))) {
	                        if (!inFlow)
	                            this.indentNext = this.indentValue + 1;
	                        else if (this.flowKey)
	                            this.flowKey = false;
	                        n += yield* this.pushCount(1);
	                        n += yield* this.pushSpaces(true);
	                        continue loop;
	                    }
	                }
	            }
	            break loop;
	        }
	        return n;
	    }
	    *pushTag() {
	        if (this.charAt(1) === '<') {
	            let i = this.pos + 2;
	            let ch = this.buffer[i];
	            while (!isEmpty(ch) && ch !== '>')
	                ch = this.buffer[++i];
	            return yield* this.pushToIndex(ch === '>' ? i + 1 : i, false);
	        }
	        else {
	            let i = this.pos + 1;
	            let ch = this.buffer[i];
	            while (ch) {
	                if (tagChars.has(ch))
	                    ch = this.buffer[++i];
	                else if (ch === '%' &&
	                    hexDigits.has(this.buffer[i + 1]) &&
	                    hexDigits.has(this.buffer[i + 2])) {
	                    ch = this.buffer[(i += 3)];
	                }
	                else
	                    break;
	            }
	            return yield* this.pushToIndex(i, false);
	        }
	    }
	    *pushNewline() {
	        const ch = this.buffer[this.pos];
	        if (ch === '\n')
	            return yield* this.pushCount(1);
	        else if (ch === '\r' && this.charAt(1) === '\n')
	            return yield* this.pushCount(2);
	        else
	            return 0;
	    }
	    *pushSpaces(allowTabs) {
	        let i = this.pos - 1;
	        let ch;
	        do {
	            ch = this.buffer[++i];
	        } while (ch === ' ' || (allowTabs && ch === '\t'));
	        const n = i - this.pos;
	        if (n > 0) {
	            yield this.buffer.substr(this.pos, n);
	            this.pos = i;
	        }
	        return n;
	    }
	    *pushUntil(test) {
	        let i = this.pos;
	        let ch = this.buffer[i];
	        while (!test(ch))
	            ch = this.buffer[++i];
	        return yield* this.pushToIndex(i, false);
	    }
	}

	class LineCounter {
	    constructor() {
	        this.lineStarts = [];
	        this.addNewLine = (offset) => this.lineStarts.push(offset);
	        this.linePos = (offset) => {
	            let low = 0;
	            let high = this.lineStarts.length;
	            while (low < high) {
	                const mid = (low + high) >> 1;
	                if (this.lineStarts[mid] < offset)
	                    low = mid + 1;
	                else
	                    high = mid;
	            }
	            if (this.lineStarts[low] === offset)
	                return { line: low + 1, col: 1 };
	            if (low === 0)
	                return { line: 0, col: offset };
	            const start = this.lineStarts[low - 1];
	            return { line: low, col: offset - start + 1 };
	        };
	    }
	}

	function includesToken(list, type) {
	    for (let i = 0; i < list.length; ++i)
	        if (list[i].type === type)
	            return true;
	    return false;
	}
	function findNonEmptyIndex(list) {
	    for (let i = 0; i < list.length; ++i) {
	        switch (list[i].type) {
	            case 'space':
	            case 'comment':
	            case 'newline':
	                break;
	            default:
	                return i;
	        }
	    }
	    return -1;
	}
	function isFlowToken(token) {
	    switch (token?.type) {
	        case 'alias':
	        case 'scalar':
	        case 'single-quoted-scalar':
	        case 'double-quoted-scalar':
	        case 'flow-collection':
	            return true;
	        default:
	            return false;
	    }
	}
	function getPrevProps(parent) {
	    switch (parent.type) {
	        case 'document':
	            return parent.start;
	        case 'block-map': {
	            const it = parent.items[parent.items.length - 1];
	            return it.sep ?? it.start;
	        }
	        case 'block-seq':
	            return parent.items[parent.items.length - 1].start;
	        default:
	            return [];
	    }
	}
	function getFirstKeyStartProps(prev) {
	    if (prev.length === 0)
	        return [];
	    let i = prev.length;
	    loop: while (--i >= 0) {
	        switch (prev[i].type) {
	            case 'doc-start':
	            case 'explicit-key-ind':
	            case 'map-value-ind':
	            case 'seq-item-ind':
	            case 'newline':
	                break loop;
	        }
	    }
	    while (prev[++i]?.type === 'space') {
	    }
	    return prev.splice(i, prev.length);
	}
	function arrayPushArray(target, source) {
	    if (source.length < 1e5)
	        Array.prototype.push.apply(target, source);
	    else
	        for (let i = 0; i < source.length; ++i)
	            target.push(source[i]);
	}
	function fixFlowSeqItems(fc) {
	    if (fc.start.type === 'flow-seq-start') {
	        for (const it of fc.items) {
	            if (it.sep &&
	                !it.value &&
	                !includesToken(it.start, 'explicit-key-ind') &&
	                !includesToken(it.sep, 'map-value-ind')) {
	                if (it.key)
	                    it.value = it.key;
	                delete it.key;
	                if (isFlowToken(it.value)) {
	                    if (it.value.end)
	                        arrayPushArray(it.value.end, it.sep);
	                    else
	                        it.value.end = it.sep;
	                }
	                else
	                    arrayPushArray(it.start, it.sep);
	                delete it.sep;
	            }
	        }
	    }
	}
	class Parser {
	    constructor(onNewLine) {
	        this.atNewLine = true;
	        this.atScalar = false;
	        this.indent = 0;
	        this.offset = 0;
	        this.onKeyLine = false;
	        this.stack = [];
	        this.source = '';
	        this.type = '';
	        this.lexer = new Lexer();
	        this.onNewLine = onNewLine;
	    }
	    *parse(source, incomplete = false) {
	        if (this.onNewLine && this.offset === 0)
	            this.onNewLine(0);
	        for (const lexeme of this.lexer.lex(source, incomplete))
	            yield* this.next(lexeme);
	        if (!incomplete)
	            yield* this.end();
	    }
	    *next(source) {
	        this.source = source;
	        if (this.atScalar) {
	            this.atScalar = false;
	            yield* this.step();
	            this.offset += source.length;
	            return;
	        }
	        const type = tokenType(source);
	        if (!type) {
	            const message = `Not a YAML token: ${source}`;
	            yield* this.pop({ type: 'error', offset: this.offset, message, source });
	            this.offset += source.length;
	        }
	        else if (type === 'scalar') {
	            this.atNewLine = false;
	            this.atScalar = true;
	            this.type = 'scalar';
	        }
	        else {
	            this.type = type;
	            yield* this.step();
	            switch (type) {
	                case 'newline':
	                    this.atNewLine = true;
	                    this.indent = 0;
	                    if (this.onNewLine)
	                        this.onNewLine(this.offset + source.length);
	                    break;
	                case 'space':
	                    if (this.atNewLine && source[0] === ' ')
	                        this.indent += source.length;
	                    break;
	                case 'explicit-key-ind':
	                case 'map-value-ind':
	                case 'seq-item-ind':
	                    if (this.atNewLine)
	                        this.indent += source.length;
	                    break;
	                case 'doc-mode':
	                case 'flow-error-end':
	                    return;
	                default:
	                    this.atNewLine = false;
	            }
	            this.offset += source.length;
	        }
	    }
	    *end() {
	        while (this.stack.length > 0)
	            yield* this.pop();
	    }
	    get sourceToken() {
	        const st = {
	            type: this.type,
	            offset: this.offset,
	            indent: this.indent,
	            source: this.source
	        };
	        return st;
	    }
	    *step() {
	        const top = this.peek(1);
	        if (this.type === 'doc-end' && top?.type !== 'doc-end') {
	            while (this.stack.length > 0)
	                yield* this.pop();
	            this.stack.push({
	                type: 'doc-end',
	                offset: this.offset,
	                source: this.source
	            });
	            return;
	        }
	        if (!top)
	            return yield* this.stream();
	        switch (top.type) {
	            case 'document':
	                return yield* this.document(top);
	            case 'alias':
	            case 'scalar':
	            case 'single-quoted-scalar':
	            case 'double-quoted-scalar':
	                return yield* this.scalar(top);
	            case 'block-scalar':
	                return yield* this.blockScalar(top);
	            case 'block-map':
	                return yield* this.blockMap(top);
	            case 'block-seq':
	                return yield* this.blockSequence(top);
	            case 'flow-collection':
	                return yield* this.flowCollection(top);
	            case 'doc-end':
	                return yield* this.documentEnd(top);
	        }
	        yield* this.pop();
	    }
	    peek(n) {
	        return this.stack[this.stack.length - n];
	    }
	    *pop(error) {
	        const token = error ?? this.stack.pop();
	        if (!token) {
	            const message = 'Tried to pop an empty stack';
	            yield { type: 'error', offset: this.offset, source: '', message };
	        }
	        else if (this.stack.length === 0) {
	            yield token;
	        }
	        else {
	            const top = this.peek(1);
	            if (token.type === 'block-scalar') {
	                token.indent = 'indent' in top ? top.indent : 0;
	            }
	            else if (token.type === 'flow-collection' && top.type === 'document') {
	                token.indent = 0;
	            }
	            if (token.type === 'flow-collection')
	                fixFlowSeqItems(token);
	            switch (top.type) {
	                case 'document':
	                    top.value = token;
	                    break;
	                case 'block-scalar':
	                    top.props.push(token);
	                    break;
	                case 'block-map': {
	                    const it = top.items[top.items.length - 1];
	                    if (it.value) {
	                        top.items.push({ start: [], key: token, sep: [] });
	                        this.onKeyLine = true;
	                        return;
	                    }
	                    else if (it.sep) {
	                        it.value = token;
	                    }
	                    else {
	                        Object.assign(it, { key: token, sep: [] });
	                        this.onKeyLine = !it.explicitKey;
	                        return;
	                    }
	                    break;
	                }
	                case 'block-seq': {
	                    const it = top.items[top.items.length - 1];
	                    if (it.value)
	                        top.items.push({ start: [], value: token });
	                    else
	                        it.value = token;
	                    break;
	                }
	                case 'flow-collection': {
	                    const it = top.items[top.items.length - 1];
	                    if (!it || it.value)
	                        top.items.push({ start: [], key: token, sep: [] });
	                    else if (it.sep)
	                        it.value = token;
	                    else
	                        Object.assign(it, { key: token, sep: [] });
	                    return;
	                }
	                default:
	                    yield* this.pop();
	                    yield* this.pop(token);
	            }
	            if ((top.type === 'document' ||
	                top.type === 'block-map' ||
	                top.type === 'block-seq') &&
	                (token.type === 'block-map' || token.type === 'block-seq')) {
	                const last = token.items[token.items.length - 1];
	                if (last &&
	                    !last.sep &&
	                    !last.value &&
	                    last.start.length > 0 &&
	                    findNonEmptyIndex(last.start) === -1 &&
	                    (token.indent === 0 ||
	                        last.start.every(st => st.type !== 'comment' || st.indent < token.indent))) {
	                    if (top.type === 'document')
	                        top.end = last.start;
	                    else
	                        top.items.push({ start: last.start });
	                    token.items.splice(-1, 1);
	                }
	            }
	        }
	    }
	    *stream() {
	        switch (this.type) {
	            case 'directive-line':
	                yield { type: 'directive', offset: this.offset, source: this.source };
	                return;
	            case 'byte-order-mark':
	            case 'space':
	            case 'comment':
	            case 'newline':
	                yield this.sourceToken;
	                return;
	            case 'doc-mode':
	            case 'doc-start': {
	                const doc = {
	                    type: 'document',
	                    offset: this.offset,
	                    start: []
	                };
	                if (this.type === 'doc-start')
	                    doc.start.push(this.sourceToken);
	                this.stack.push(doc);
	                return;
	            }
	        }
	        yield {
	            type: 'error',
	            offset: this.offset,
	            message: `Unexpected ${this.type} token in YAML stream`,
	            source: this.source
	        };
	    }
	    *document(doc) {
	        if (doc.value)
	            return yield* this.lineEnd(doc);
	        switch (this.type) {
	            case 'doc-start': {
	                if (findNonEmptyIndex(doc.start) !== -1) {
	                    yield* this.pop();
	                    yield* this.step();
	                }
	                else
	                    doc.start.push(this.sourceToken);
	                return;
	            }
	            case 'anchor':
	            case 'tag':
	            case 'space':
	            case 'comment':
	            case 'newline':
	                doc.start.push(this.sourceToken);
	                return;
	        }
	        const bv = this.startBlockValue(doc);
	        if (bv)
	            this.stack.push(bv);
	        else {
	            yield {
	                type: 'error',
	                offset: this.offset,
	                message: `Unexpected ${this.type} token in YAML document`,
	                source: this.source
	            };
	        }
	    }
	    *scalar(scalar) {
	        if (this.type === 'map-value-ind') {
	            const prev = getPrevProps(this.peek(2));
	            const start = getFirstKeyStartProps(prev);
	            let sep;
	            if (scalar.end) {
	                sep = scalar.end;
	                sep.push(this.sourceToken);
	                delete scalar.end;
	            }
	            else
	                sep = [this.sourceToken];
	            const map = {
	                type: 'block-map',
	                offset: scalar.offset,
	                indent: scalar.indent,
	                items: [{ start, key: scalar, sep }]
	            };
	            this.onKeyLine = true;
	            this.stack[this.stack.length - 1] = map;
	        }
	        else
	            yield* this.lineEnd(scalar);
	    }
	    *blockScalar(scalar) {
	        switch (this.type) {
	            case 'space':
	            case 'comment':
	            case 'newline':
	                scalar.props.push(this.sourceToken);
	                return;
	            case 'scalar':
	                scalar.source = this.source;
	                this.atNewLine = true;
	                this.indent = 0;
	                if (this.onNewLine) {
	                    let nl = this.source.indexOf('\n') + 1;
	                    while (nl !== 0) {
	                        this.onNewLine(this.offset + nl);
	                        nl = this.source.indexOf('\n', nl) + 1;
	                    }
	                }
	                yield* this.pop();
	                break;
	            default:
	                yield* this.pop();
	                yield* this.step();
	        }
	    }
	    *blockMap(map) {
	        const it = map.items[map.items.length - 1];
	        switch (this.type) {
	            case 'newline':
	                this.onKeyLine = false;
	                if (it.value) {
	                    const end = 'end' in it.value ? it.value.end : undefined;
	                    const last = Array.isArray(end) ? end[end.length - 1] : undefined;
	                    if (last?.type === 'comment')
	                        end?.push(this.sourceToken);
	                    else
	                        map.items.push({ start: [this.sourceToken] });
	                }
	                else if (it.sep) {
	                    it.sep.push(this.sourceToken);
	                }
	                else {
	                    it.start.push(this.sourceToken);
	                }
	                return;
	            case 'space':
	            case 'comment':
	                if (it.value) {
	                    map.items.push({ start: [this.sourceToken] });
	                }
	                else if (it.sep) {
	                    it.sep.push(this.sourceToken);
	                }
	                else {
	                    if (this.atIndentedComment(it.start, map.indent)) {
	                        const prev = map.items[map.items.length - 2];
	                        const end = prev?.value?.end;
	                        if (Array.isArray(end)) {
	                            arrayPushArray(end, it.start);
	                            end.push(this.sourceToken);
	                            map.items.pop();
	                            return;
	                        }
	                    }
	                    it.start.push(this.sourceToken);
	                }
	                return;
	        }
	        if (this.indent >= map.indent) {
	            const atMapIndent = !this.onKeyLine && this.indent === map.indent;
	            const atNextItem = atMapIndent &&
	                (it.sep || it.explicitKey) &&
	                this.type !== 'seq-item-ind';
	            let start = [];
	            if (atNextItem && it.sep && !it.value) {
	                const nl = [];
	                for (let i = 0; i < it.sep.length; ++i) {
	                    const st = it.sep[i];
	                    switch (st.type) {
	                        case 'newline':
	                            nl.push(i);
	                            break;
	                        case 'space':
	                            break;
	                        case 'comment':
	                            if (st.indent > map.indent)
	                                nl.length = 0;
	                            break;
	                        default:
	                            nl.length = 0;
	                    }
	                }
	                if (nl.length >= 2)
	                    start = it.sep.splice(nl[1]);
	            }
	            switch (this.type) {
	                case 'anchor':
	                case 'tag':
	                    if (atNextItem || it.value) {
	                        start.push(this.sourceToken);
	                        map.items.push({ start });
	                        this.onKeyLine = true;
	                    }
	                    else if (it.sep) {
	                        it.sep.push(this.sourceToken);
	                    }
	                    else {
	                        it.start.push(this.sourceToken);
	                    }
	                    return;
	                case 'explicit-key-ind':
	                    if (!it.sep && !it.explicitKey) {
	                        it.start.push(this.sourceToken);
	                        it.explicitKey = true;
	                    }
	                    else if (atNextItem || it.value) {
	                        start.push(this.sourceToken);
	                        map.items.push({ start, explicitKey: true });
	                    }
	                    else {
	                        this.stack.push({
	                            type: 'block-map',
	                            offset: this.offset,
	                            indent: this.indent,
	                            items: [{ start: [this.sourceToken], explicitKey: true }]
	                        });
	                    }
	                    this.onKeyLine = true;
	                    return;
	                case 'map-value-ind':
	                    if (it.explicitKey) {
	                        if (!it.sep) {
	                            if (includesToken(it.start, 'newline')) {
	                                Object.assign(it, { key: null, sep: [this.sourceToken] });
	                            }
	                            else {
	                                const start = getFirstKeyStartProps(it.start);
	                                this.stack.push({
	                                    type: 'block-map',
	                                    offset: this.offset,
	                                    indent: this.indent,
	                                    items: [{ start, key: null, sep: [this.sourceToken] }]
	                                });
	                            }
	                        }
	                        else if (it.value) {
	                            map.items.push({ start: [], key: null, sep: [this.sourceToken] });
	                        }
	                        else if (includesToken(it.sep, 'map-value-ind')) {
	                            this.stack.push({
	                                type: 'block-map',
	                                offset: this.offset,
	                                indent: this.indent,
	                                items: [{ start, key: null, sep: [this.sourceToken] }]
	                            });
	                        }
	                        else if (isFlowToken(it.key) &&
	                            !includesToken(it.sep, 'newline')) {
	                            const start = getFirstKeyStartProps(it.start);
	                            const key = it.key;
	                            const sep = it.sep;
	                            sep.push(this.sourceToken);
	                            delete it.key;
	                            delete it.sep;
	                            this.stack.push({
	                                type: 'block-map',
	                                offset: this.offset,
	                                indent: this.indent,
	                                items: [{ start, key, sep }]
	                            });
	                        }
	                        else if (start.length > 0) {
	                            it.sep = it.sep.concat(start, this.sourceToken);
	                        }
	                        else {
	                            it.sep.push(this.sourceToken);
	                        }
	                    }
	                    else {
	                        if (!it.sep) {
	                            Object.assign(it, { key: null, sep: [this.sourceToken] });
	                        }
	                        else if (it.value || atNextItem) {
	                            map.items.push({ start, key: null, sep: [this.sourceToken] });
	                        }
	                        else if (includesToken(it.sep, 'map-value-ind')) {
	                            this.stack.push({
	                                type: 'block-map',
	                                offset: this.offset,
	                                indent: this.indent,
	                                items: [{ start: [], key: null, sep: [this.sourceToken] }]
	                            });
	                        }
	                        else {
	                            it.sep.push(this.sourceToken);
	                        }
	                    }
	                    this.onKeyLine = true;
	                    return;
	                case 'alias':
	                case 'scalar':
	                case 'single-quoted-scalar':
	                case 'double-quoted-scalar': {
	                    const fs = this.flowScalar(this.type);
	                    if (atNextItem || it.value) {
	                        map.items.push({ start, key: fs, sep: [] });
	                        this.onKeyLine = true;
	                    }
	                    else if (it.sep) {
	                        this.stack.push(fs);
	                    }
	                    else {
	                        Object.assign(it, { key: fs, sep: [] });
	                        this.onKeyLine = true;
	                    }
	                    return;
	                }
	                default: {
	                    const bv = this.startBlockValue(map);
	                    if (bv) {
	                        if (bv.type === 'block-seq') {
	                            if (!it.explicitKey &&
	                                it.sep &&
	                                !includesToken(it.sep, 'newline')) {
	                                yield* this.pop({
	                                    type: 'error',
	                                    offset: this.offset,
	                                    message: 'Unexpected block-seq-ind on same line with key',
	                                    source: this.source
	                                });
	                                return;
	                            }
	                        }
	                        else if (atMapIndent) {
	                            map.items.push({ start });
	                        }
	                        this.stack.push(bv);
	                        return;
	                    }
	                }
	            }
	        }
	        yield* this.pop();
	        yield* this.step();
	    }
	    *blockSequence(seq) {
	        const it = seq.items[seq.items.length - 1];
	        switch (this.type) {
	            case 'newline':
	                if (it.value) {
	                    const end = 'end' in it.value ? it.value.end : undefined;
	                    const last = Array.isArray(end) ? end[end.length - 1] : undefined;
	                    if (last?.type === 'comment')
	                        end?.push(this.sourceToken);
	                    else
	                        seq.items.push({ start: [this.sourceToken] });
	                }
	                else
	                    it.start.push(this.sourceToken);
	                return;
	            case 'space':
	            case 'comment':
	                if (it.value)
	                    seq.items.push({ start: [this.sourceToken] });
	                else {
	                    if (this.atIndentedComment(it.start, seq.indent)) {
	                        const prev = seq.items[seq.items.length - 2];
	                        const end = prev?.value?.end;
	                        if (Array.isArray(end)) {
	                            arrayPushArray(end, it.start);
	                            end.push(this.sourceToken);
	                            seq.items.pop();
	                            return;
	                        }
	                    }
	                    it.start.push(this.sourceToken);
	                }
	                return;
	            case 'anchor':
	            case 'tag':
	                if (it.value || this.indent <= seq.indent)
	                    break;
	                it.start.push(this.sourceToken);
	                return;
	            case 'seq-item-ind':
	                if (this.indent !== seq.indent)
	                    break;
	                if (it.value || includesToken(it.start, 'seq-item-ind'))
	                    seq.items.push({ start: [this.sourceToken] });
	                else
	                    it.start.push(this.sourceToken);
	                return;
	        }
	        if (this.indent > seq.indent) {
	            const bv = this.startBlockValue(seq);
	            if (bv) {
	                this.stack.push(bv);
	                return;
	            }
	        }
	        yield* this.pop();
	        yield* this.step();
	    }
	    *flowCollection(fc) {
	        const it = fc.items[fc.items.length - 1];
	        if (this.type === 'flow-error-end') {
	            let top;
	            do {
	                yield* this.pop();
	                top = this.peek(1);
	            } while (top?.type === 'flow-collection');
	        }
	        else if (fc.end.length === 0) {
	            switch (this.type) {
	                case 'comma':
	                case 'explicit-key-ind':
	                    if (!it || it.sep)
	                        fc.items.push({ start: [this.sourceToken] });
	                    else
	                        it.start.push(this.sourceToken);
	                    return;
	                case 'map-value-ind':
	                    if (!it || it.value)
	                        fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
	                    else if (it.sep)
	                        it.sep.push(this.sourceToken);
	                    else
	                        Object.assign(it, { key: null, sep: [this.sourceToken] });
	                    return;
	                case 'space':
	                case 'comment':
	                case 'newline':
	                case 'anchor':
	                case 'tag':
	                    if (!it || it.value)
	                        fc.items.push({ start: [this.sourceToken] });
	                    else if (it.sep)
	                        it.sep.push(this.sourceToken);
	                    else
	                        it.start.push(this.sourceToken);
	                    return;
	                case 'alias':
	                case 'scalar':
	                case 'single-quoted-scalar':
	                case 'double-quoted-scalar': {
	                    const fs = this.flowScalar(this.type);
	                    if (!it || it.value)
	                        fc.items.push({ start: [], key: fs, sep: [] });
	                    else if (it.sep)
	                        this.stack.push(fs);
	                    else
	                        Object.assign(it, { key: fs, sep: [] });
	                    return;
	                }
	                case 'flow-map-end':
	                case 'flow-seq-end':
	                    fc.end.push(this.sourceToken);
	                    return;
	            }
	            const bv = this.startBlockValue(fc);
	            if (bv)
	                this.stack.push(bv);
	            else {
	                yield* this.pop();
	                yield* this.step();
	            }
	        }
	        else {
	            const parent = this.peek(2);
	            if (parent.type === 'block-map' &&
	                ((this.type === 'map-value-ind' && parent.indent === fc.indent) ||
	                    (this.type === 'newline' &&
	                        !parent.items[parent.items.length - 1].sep))) {
	                yield* this.pop();
	                yield* this.step();
	            }
	            else if (this.type === 'map-value-ind' &&
	                parent.type !== 'flow-collection') {
	                const prev = getPrevProps(parent);
	                const start = getFirstKeyStartProps(prev);
	                fixFlowSeqItems(fc);
	                const sep = fc.end.splice(1, fc.end.length);
	                sep.push(this.sourceToken);
	                const map = {
	                    type: 'block-map',
	                    offset: fc.offset,
	                    indent: fc.indent,
	                    items: [{ start, key: fc, sep }]
	                };
	                this.onKeyLine = true;
	                this.stack[this.stack.length - 1] = map;
	            }
	            else {
	                yield* this.lineEnd(fc);
	            }
	        }
	    }
	    flowScalar(type) {
	        if (this.onNewLine) {
	            let nl = this.source.indexOf('\n') + 1;
	            while (nl !== 0) {
	                this.onNewLine(this.offset + nl);
	                nl = this.source.indexOf('\n', nl) + 1;
	            }
	        }
	        return {
	            type,
	            offset: this.offset,
	            indent: this.indent,
	            source: this.source
	        };
	    }
	    startBlockValue(parent) {
	        switch (this.type) {
	            case 'alias':
	            case 'scalar':
	            case 'single-quoted-scalar':
	            case 'double-quoted-scalar':
	                return this.flowScalar(this.type);
	            case 'block-scalar-header':
	                return {
	                    type: 'block-scalar',
	                    offset: this.offset,
	                    indent: this.indent,
	                    props: [this.sourceToken],
	                    source: ''
	                };
	            case 'flow-map-start':
	            case 'flow-seq-start':
	                return {
	                    type: 'flow-collection',
	                    offset: this.offset,
	                    indent: this.indent,
	                    start: this.sourceToken,
	                    items: [],
	                    end: []
	                };
	            case 'seq-item-ind':
	                return {
	                    type: 'block-seq',
	                    offset: this.offset,
	                    indent: this.indent,
	                    items: [{ start: [this.sourceToken] }]
	                };
	            case 'explicit-key-ind': {
	                this.onKeyLine = true;
	                const prev = getPrevProps(parent);
	                const start = getFirstKeyStartProps(prev);
	                start.push(this.sourceToken);
	                return {
	                    type: 'block-map',
	                    offset: this.offset,
	                    indent: this.indent,
	                    items: [{ start, explicitKey: true }]
	                };
	            }
	            case 'map-value-ind': {
	                this.onKeyLine = true;
	                const prev = getPrevProps(parent);
	                const start = getFirstKeyStartProps(prev);
	                return {
	                    type: 'block-map',
	                    offset: this.offset,
	                    indent: this.indent,
	                    items: [{ start, key: null, sep: [this.sourceToken] }]
	                };
	            }
	        }
	        return null;
	    }
	    atIndentedComment(start, indent) {
	        if (this.type !== 'comment')
	            return false;
	        if (this.indent <= indent)
	            return false;
	        return start.every(st => st.type === 'newline' || st.type === 'space');
	    }
	    *documentEnd(docEnd) {
	        if (this.type !== 'doc-mode') {
	            if (docEnd.end)
	                docEnd.end.push(this.sourceToken);
	            else
	                docEnd.end = [this.sourceToken];
	            if (this.type === 'newline')
	                yield* this.pop();
	        }
	    }
	    *lineEnd(token) {
	        switch (this.type) {
	            case 'comma':
	            case 'doc-start':
	            case 'doc-end':
	            case 'flow-seq-end':
	            case 'flow-map-end':
	            case 'map-value-ind':
	                yield* this.pop();
	                yield* this.step();
	                break;
	            case 'newline':
	                this.onKeyLine = false;
	            case 'space':
	            case 'comment':
	            default:
	                if (token.end)
	                    token.end.push(this.sourceToken);
	                else
	                    token.end = [this.sourceToken];
	                if (this.type === 'newline')
	                    yield* this.pop();
	        }
	    }
	}

	function parseOptions(options) {
	    const prettyErrors = options.prettyErrors !== false;
	    const lineCounter = options.lineCounter || (prettyErrors && new LineCounter()) || null;
	    return { lineCounter, prettyErrors };
	}
	function parseDocument(source, options = {}) {
	    const { lineCounter, prettyErrors } = parseOptions(options);
	    const parser = new Parser(lineCounter?.addNewLine);
	    const composer = new Composer(options);
	    let doc = null;
	    for (const _doc of composer.compose(parser.parse(source), true, source.length)) {
	        if (!doc)
	            doc = _doc;
	        else if (doc.options.logLevel !== 'silent') {
	            doc.errors.push(new YAMLParseError(_doc.range.slice(0, 2), 'MULTIPLE_DOCS', 'Source contains multiple documents; please use YAML.parseAllDocuments()'));
	            break;
	        }
	    }
	    if (prettyErrors && lineCounter) {
	        doc.errors.forEach(prettifyError(source, lineCounter));
	        doc.warnings.forEach(prettifyError(source, lineCounter));
	    }
	    return doc;
	}
	function parse(src, reviver, options) {
	    let _reviver = undefined;
	    const doc = parseDocument(src, options);
	    if (!doc)
	        return null;
	    doc.warnings.forEach(warning => warn(doc.options.logLevel, warning));
	    if (doc.errors.length > 0) {
	        if (doc.options.logLevel !== 'silent')
	            throw doc.errors[0];
	        else
	            doc.errors = [];
	    }
	    return doc.toJS(Object.assign({ reviver: _reviver }, options));
	}
	function stringify(value, replacer, options) {
	    let _replacer = null;
	    if (Array.isArray(replacer)) {
	        _replacer = replacer;
	    }
	    if (value === undefined) {
	        const { keepUndefined } = {};
	        if (!keepUndefined)
	            return undefined;
	    }
	    if (isDocument(value) && !_replacer)
	        return value.toString(options);
	    return new Document(value, _replacer, options).toString(options);
	}

	const constructsWithoutStrikethrough = [
	  'autolink',
	  'destinationLiteral',
	  'destinationRaw',
	  'reference',
	  'titleQuote',
	  'titleApostrophe'
	];
	handleDelete.peek = peekDelete;
	function gfmStrikethroughToMarkdown() {
	  return {
	    unsafe: [
	      {
	        character: '~',
	        inConstruct: 'phrasing',
	        notInConstruct: constructsWithoutStrikethrough
	      }
	    ],
	    handlers: {delete: handleDelete}
	  }
	}
	function handleDelete(node, _, state, info) {
	  const tracker = state.createTracker(info);
	  const exit = state.enter('strikethrough');
	  let value = tracker.move('~~');
	  value += state.containerPhrasing(node, {
	    ...tracker.current(),
	    before: value,
	    after: '~'
	  });
	  value += tracker.move('~~');
	  exit();
	  return value
	}
	function peekDelete() {
	  return '~'
	}

	handleMark.peek = peekMark;
	var constructsWithoutHighlightMark = [
	  "autolink",
	  "destinationLiteral",
	  "destinationRaw",
	  "reference",
	  "titleQuote",
	  "titleApostrophe"
	];
	var highlightMarkToMarkdown = {
	  unsafe: [
	    {
	      character: "=",
	      inConstruct: "phrasing",
	      notInConstruct: constructsWithoutHighlightMark
	    }
	  ],
	  handlers: { highlight: handleMark }
	};
	function handleMark(node, _, state, info) {
	  const marker = "=";
	  const tracker = state.createTracker(info);
	  const exit = state.enter("highlight");
	  let value = tracker.move(marker + marker);
	  value += tracker.move(
	    state.containerPhrasing(node, {
	      before: value,
	      after: marker,
	      ...tracker.current()
	    })
	  );
	  value += tracker.move(marker + marker);
	  exit();
	  return value;
	}
	function peekMark() {
	  return "=";
	}

	const MARK_BUILDERS = {
	  strong: (children) => ({ type: "strong", children }),
	  emphasis: (children) => ({ type: "emphasis", children }),
	  highlight: (children) => ({ type: "highlight", children }),
	  strikethrough: (children) => ({ type: "delete", children }),
	  link: (children, node) => ({ type: "link", url: node.href || "", children }),
	  inline_code: (children) => ({ type: "inlineCode", value: plainText(children) })
	};
	function plainText(children) {
	  return children.map(child => child.value ?? plainText(child.children || [])).join("")
	}
	function inlineFrom$1(value, nodes) {
	  const content = value.content || "";
	  const marks = [...(value.marks || [])].sort((left, right) => {
	    return left.start_offset - right.start_offset
	  });
	  const { children, cursor } = marks.reduce((accumulated, mark) => {
	    const markNode = nodes[mark.node_id];
	    const builder = markNode && MARK_BUILDERS[markNode.type];
	    if (!builder) return accumulated
	    const before = content.slice(accumulated.cursor, mark.start_offset);
	    const inner = content.slice(mark.start_offset, mark.end_offset);
	    const leading = before ? [{ type: "text", value: before }] : [];
	    return {
	      cursor: mark.end_offset,
	      children: [
	        ...accumulated.children,
	        ...leading,
	        builder([{ type: "text", value: inner }], markNode)
	      ]
	    }
	  }, { children: [], cursor: 0 });
	  const trailing = content.slice(cursor);
	  return trailing ? [...children, { type: "text", value: trailing }] : children
	}
	function blockFrom$1(id, nodes) {
	  const node = nodes[id];
	  if (!node) return null
	  if (node.type === "paragraph") {
	    return { type: "paragraph", children: inlineFrom$1(node.content, nodes) }
	  }
	  if (node.type === "heading") {
	    return { type: "heading", depth: node.level || 2, children: inlineFrom$1(node.content, nodes) }
	  }
	  if (node.type === "list") {
	    const children = node.items.nodes.map(itemId => ({
	      type: "listItem",
	      spread: false,
	      children: [{ type: "paragraph", children: inlineFrom$1(nodes[itemId].content, nodes) }]
	    }));
	    return { type: "list", ordered: Boolean(node.ordered), spread: false, children }
	  }
	  if (node.type === "blockquote") {
	    return { type: "blockquote", children: node.body.nodes.map(child => blockFrom$1(child, nodes)) }
	  }
	  if (node.type === "alert") {
	    const marker = {
	      type: "html",
	      value: `[!${(node.variant || "note").toUpperCase()}]`
	    };
	    const body = node.body.nodes.map(child => blockFrom$1(child, nodes));
	    return { type: "blockquote", children: [marker, ...body] }
	  }
	  if (node.type === "code_block") {
	    return { type: "code", lang: node.language || null, value: node.code || "" }
	  }
	  if (node.type === "thematic_break") {
	    return { type: "thematicBreak" }
	  }
	  if (node.type === "image") {
	    const image = { type: "image", url: node.source, alt: node.alt || "" };
	    const caption = node.caption ? [{ type: "text", value: ` ${node.caption}` }] : [];
	    return { type: "paragraph", children: [image, ...caption] }
	  }
	  if (node.type === "embed") {
	    return { type: "html", value: node.directive }
	  }
	  return null
	}
	function serialize(doc, frontmatter = { title: null, properties: {} }) {
	  const page = doc.nodes[doc.document_id];
	  const children = page.body.nodes
	    .map(id => blockFrom$1(id, doc.nodes))
	    .filter(Boolean);
	  const body = toMarkdown({ type: "root", children }, {
	    extensions: [gfmStrikethroughToMarkdown(), highlightMarkToMarkdown],
	    bullet: "-",
	    emphasis: "_",
	    strong: "*",
	    fences: true,
	    rule: "-"
	  });
	  const heading = frontmatter.title ? `# ${frontmatter.title}\n\n` : "";
	  const properties = frontmatter.properties || {};
	  const yaml = Object.keys(properties).length
	    ? `---\n${stringify(properties)}---\n\n`
	    : "";
	  return yaml + heading + body
	}

	const divider = ($$anchor) => {
		var span = root$e();

		append($$anchor, span);
	};

	var root$e = from_html(`<span class="divider svelte-zh32e5" aria-hidden="true"></span>`);
	var root_1$2 = from_html(`<span class="select-parent-group svelte-zh32e5"><button title="Select parent (Esc)" class="svelte-zh32e5">&#8598;</button> <!></span>`);
	var root_2$1 = from_html(`<button title="Bold">B</button>`);
	var root_3$1 = from_html(`<button title="Italic">I</button>`);
	var root_4$1 = from_html(`<button title="Code">&lt;&gt;</button>`);
	var root_5$1 = from_html(`<button title="Highlight">H</button>`);
	var root_6$1 = from_html(`<button title="Strikethrough">S</button>`);
	var root_7$1 = from_html(`<!> <!> <!> <!> <!>`, 1);
	var root_8$1 = from_html(`<button title="Insert (↵)" class="svelte-zh32e5"><svg class="toolbar-icon svelte-zh32e5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M7.5 3V12M3 7.5H12" stroke="currentColor" stroke-linecap="square"></path></svg></button>`);
	var root_9$1 = from_html(`<button title="Delete backwards (⌫)" class="svelte-zh32e5">&#9003;</button>`);
	var root_10$1 = from_html(`<button title="Undo" class="svelte-zh32e5">&#8630;</button> <button title="Redo" class="svelte-zh32e5">&#8631;</button>`, 1);
	var root_11$1 = from_html(`<!> <!>`, 1);
	var root_12$1 = from_html(`<div><div class="toolbar-scroller svelte-zh32e5"><!></div></div>`);
	var root_13$1 = from_html(`<!> <!> <!>`, 1);
	var root_14$1 = from_html(`<div class="contextual-tools svelte-zh32e5"><!> <!></div>`);
	var root_15 = from_html(`<div class="contextual-tools svelte-zh32e5"><!></div> <!> <!>`, 1);
	var root_16 = from_html(`<!> <div class="editor-toolbar bottom-toolbar svelte-zh32e5"><div class="toolbar-scroller svelte-zh32e5"><!> <div><!> <button class="toggle-editable svelte-zh32e5"> </button></div></div></div>`, 1);

	const $$css$3 = {
		hash: 'svelte-zh32e5',
		code: '\n	/* Both toolbars share one unified pill container: a single surface,\n	   border and shadow instead of per-button bubbles. The pill itself does\n	   not scroll — scrolling lives in the unpadded inner scroller below, so\n	   pinned (sticky) tools sit at the exact scrollport edge and scrolled\n	   content can never leak into the pill\'s padding or rounded corners. */.editor-toolbar.svelte-zh32e5 {display:flex;align-items:center;width:fit-content;padding:4px;color:var(--foreground, #111);background:var(--background, #fff);border:1px solid oklch(from var(--foreground, #111) l c h / 0.12);border-radius:9999px;box-shadow:0 1px 2px oklch(0% 0 0 / 0.12),\n			0 4px 16px oklch(0% 0 0 / 0.08);z-index:50;pointer-events:auto;max-width:calc(100vw - 2 * var(--s-4, 16px));}.toolbar-scroller.svelte-zh32e5 {display:flex;flex-direction:row;align-items:center;\n		/* No gap between buttons: adjacent hitboxes tile the toolbar without\n		   dead zones, the visual spacing comes from the icon padding inside\n		   each 36px button. */gap:0;min-width:0;overflow-x:auto;scrollbar-width:none;border-radius:9999px;}.bottom-toolbar.svelte-zh32e5 {position:fixed;bottom:max(var(--s-4, 16px), env(safe-area-inset-bottom, 0px));right:var(--s-4, 16px);}\n\n	@position-try --stay-in-viewport {position-area:none;position-anchor:none;top:calc(var(--top-toolbar-safe-area, 0px) + var(--s-2, 8px));right:auto;bottom:auto;left:auto;\n	}\n\n	/* Multi-node selection: when above the first node overflows, sit below\n	   the last selected node instead (--last-selected-node-anchor). */\n	@position-try --below-last-node {position-anchor:var(--last-selected-node-anchor);bottom:auto;top:anchor(bottom);margin-bottom:0;margin-top:var(--s-2, 8px);\n	}.floating-toolbar.svelte-zh32e5 {position:fixed;bottom:anchor(top);justify-self:anchor-center;margin-bottom:var(--s-2, 8px);position-visibility:always;position-try-fallbacks:--stay-in-viewport, flip-block;z-index:60;}.floating-toolbar.has-last-node-anchor.svelte-zh32e5 {position-try-fallbacks:--below-last-node, --stay-in-viewport, flip-block;}\n\n	/* The floating toolbar targets precise mouse interactions. On touch\n	   devices all tools live in the single bottom toolbar instead, so the\n	   virtual keyboard handling only has one element to care about. */\n	@media (hover: none), (pointer: coarse) {.floating-toolbar.svelte-zh32e5 {display:none;}.bottom-toolbar.svelte-zh32e5 {right:auto;left:50%;transform:translateX(-50%) translateY(calc(-1 * var(--keyboard-inset, 0px)));}\n	}.contextual-tools.svelte-zh32e5 {display:contents;}\n\n	@media (hover: hover) and (pointer: fine) {.bottom-toolbar.svelte-zh32e5 .contextual-tools:where(.svelte-zh32e5) {display:none;}\n	}.editor-toolbar.svelte-zh32e5 .save-group:where(.svelte-zh32e5) {position:sticky;right:0;z-index:1;display:flex;align-items:center;flex:none;background:var(--background, #fff);}.editor-toolbar.svelte-zh32e5 .save-group.has-leading-tools:where(.svelte-zh32e5) {margin-inline-start:4px;}.editor-toolbar.svelte-zh32e5 .save-group:where(.svelte-zh32e5) .divider:where(.svelte-zh32e5) {margin-inline-start:0;}.editor-toolbar.svelte-zh32e5 .divider:where(.svelte-zh32e5) {flex:none;width:1px;height:20px;margin-inline:4px;background:oklch(from var(--foreground, #111) l c h / 0.15);}.editor-toolbar.svelte-zh32e5 button:where(.svelte-zh32e5):not(.toggle-editable) {display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:36px;height:36px;min-width:36px;min-height:36px;aspect-ratio:1 / 1;padding:0;flex:0 0 36px;border:none;border-radius:50%;background:transparent;color:var(--foreground, #111);font-size:15px;font-weight:600;text-wrap:nowrap;cursor:pointer;pointer-events:auto;transition:background 150ms,\n			transform 150ms;outline:1px solid transparent;position:relative;}\n\n	@media (hover: hover) {.editor-toolbar.svelte-zh32e5 button:where(.svelte-zh32e5):not(.toggle-editable):hover:not(:disabled) {background:oklch(from var(--foreground, #111) l c h / 0.06);}\n	}.editor-toolbar.svelte-zh32e5 button:where(.svelte-zh32e5):not(.toggle-editable):active:not(:disabled) {background:oklch(from var(--foreground, #111) l c h / 0.09);transform:translateY(1px) scale(0.95);}.editor-toolbar.svelte-zh32e5 button:where(.svelte-zh32e5):not(.toggle-editable):focus-visible {outline:none;box-shadow:inset 0 0 0 1px var(--editing, #2563eb);}.editor-toolbar.svelte-zh32e5 button:where(.svelte-zh32e5):not(.toggle-editable):disabled {background:transparent;cursor:not-allowed;color:oklch(from var(--foreground, #111) l c h / 0.3);}.editor-toolbar.svelte-zh32e5 button:not(.toggle-editable).active:where(.svelte-zh32e5) {color:var(--editing, #2563eb);background:var(--editing-muted, oklch(0.6 0.15 250 / 0.12));}\n\n	/* Select-parent pinned to the left edge of the scroller, mirroring the\n	   keyboard tools on the right. */.editor-toolbar.svelte-zh32e5 .select-parent-group:where(.svelte-zh32e5) {position:sticky;left:0;z-index:1;display:flex;align-items:center;flex:none;background:var(--background, #fff);margin-inline-end:4px;}.editor-toolbar.svelte-zh32e5 .select-parent-group:where(.svelte-zh32e5) .divider:where(.svelte-zh32e5) {margin-inline-end:0;}.toggle-editable.svelte-zh32e5 {display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;height:36px;min-height:36px;flex:none;padding:0 1rem;border:none;border-radius:9999px;background:transparent;color:var(--editing, #2563eb);font-size:0.875rem;font-weight:600;line-height:1;text-decoration:none;cursor:pointer;pointer-events:auto;transition:background 150ms,\n			transform 150ms;outline:1px solid transparent;}\n\n	@media (hover: hover) {.toggle-editable.svelte-zh32e5:hover {background:oklch(from var(--editing, #2563eb) l c h / 0.08);}\n	}.toggle-editable.svelte-zh32e5:active {background:oklch(from var(--editing, #2563eb) l c h / 0.12);transform:translateY(1px) scale(0.97);}.toggle-editable.svelte-zh32e5:focus-visible {outline:none;box-shadow:inset 0 0 0 1px var(--editing, #2563eb);}.editor-toolbar.svelte-zh32e5 .toolbar-icon:where(.svelte-zh32e5) {width:var(--icon-size, 18px);height:var(--icon-size, 18px);color:currentColor;}'
	};

	function Toolbar($$anchor, $$props) {
		push($$props, true);
		append_styles$1($$anchor, $$css$3);

		const // Trimmed down from Svedit's demo Toolbar: no Icon/NodeNavigator components
		// (this project doesn't have them), and only the commands this project's
		// create-session.js actually registers (bold, highlight, undo/redo,
		// select-parent, delete). Buttons use plain-text glyphs instead of icons.
		// Check if we have a collapsed node selection (node caret)
		// Get default node_type for current node_array
		// Get the parent node
		// Get the property name
		// While a pointer drags a selection the floating toolbar stays hidden,
		// otherwise it flickers along the growing selection. It appears
		// instantly on pointer up.
		// Presses on the toolbars themselves must not hide them
		// Anchor for the floating toolbar. Every selectable element exposes
		// anchor-name: --{serialized_path}, so the toolbar attaches to the element
		// owning the current selection with pure CSS anchor positioning.
		// last_node_anchor (multi-node only) is the last selected node's path,
		// exposed as --last-selected-node-anchor for a position-try fallback.
		// No toolbar at a collapsed text caret: it would hover over the
		// line above while the user is typing.
		// Node caret: nothing to offer here yet (this project has no
		// gap-insert tool configured), the bottom toolbar's insert
		// button covers it instead.
		// Distance the visual viewport bottom sits above the layout viewport
		// bottom. Chromium and Firefox resize the layout viewport when the
		// virtual keyboard opens (interactive-widget=resizes-content), so this
		// stays 0 there. iOS Safari only shrinks and pans the visual viewport,
		// so the bottom toolbar must be translated up by this inset to stay
		// visible above the keyboard, also while scrolling.
		// Exponential follower: large distances (keyboard opening) are covered
		// within a few frames while the small stale-position corrections that
		// Safari reports during touch pans get smoothed instead of rendering
		// as jitter. Speed adapts to the remaining distance by construction.
		select_parent_button = ($$anchor) => {
			var fragment = comment();
			var node = first_child(fragment);

			{
				var consequent = ($$anchor) => {
					var span_1 = root_1$2();
					var button = child(span_1);
					var node_1 = sibling(button, 2);

					divider(node_1);
					delegated('mousedown', button, select_parent);
					append($$anchor, span_1);
				};

				if_block(node, ($$render) => {
					if (session().commands.select_parent && !session().commands.select_parent.disabled) $$render(consequent);
				});
			}

			append($$anchor, fragment);
		};

		const mark_buttons = ($$anchor) => {
			var fragment_1 = root_7$1();
			var node_2 = first_child(fragment_1);

			{
				var consequent_1 = ($$anchor) => {
					var button_1 = root_2$1();
					let classes;

					template_effect(() => {
						classes = set_class(button_1, 1, 'bold svelte-zh32e5', null, classes, { active: session().commands.toggle_strong.active });
						button_1.disabled = session().commands.toggle_strong.disabled;
					});

					delegated('mousedown', button_1, (event) => {
						event.preventDefault();
						session().commands.toggle_strong.execute();
					});

					append($$anchor, button_1);
				};

				if_block(node_2, ($$render) => {
					if (session().commands.toggle_strong) $$render(consequent_1);
				});
			}

			var node_3 = sibling(node_2, 2);

			{
				var consequent_2 = ($$anchor) => {
					var button_2 = root_3$1();
					let classes_1;

					template_effect(() => {
						classes_1 = set_class(button_2, 1, 'italic svelte-zh32e5', null, classes_1, { active: session().commands.toggle_emphasis.active });
						button_2.disabled = session().commands.toggle_emphasis.disabled;
					});

					delegated('mousedown', button_2, (event) => {
						event.preventDefault();
						session().commands.toggle_emphasis.execute();
					});

					append($$anchor, button_2);
				};

				if_block(node_3, ($$render) => {
					if (session().commands.toggle_emphasis) $$render(consequent_2);
				});
			}

			var node_4 = sibling(node_3, 2);

			{
				var consequent_3 = ($$anchor) => {
					var button_3 = root_4$1();
					let classes_2;

					template_effect(() => {
						classes_2 = set_class(button_3, 1, 'code svelte-zh32e5', null, classes_2, { active: session().commands.toggle_inline_code.active });
						button_3.disabled = session().commands.toggle_inline_code.disabled;
					});

					delegated('mousedown', button_3, (event) => {
						event.preventDefault();
						session().commands.toggle_inline_code.execute();
					});

					append($$anchor, button_3);
				};

				if_block(node_4, ($$render) => {
					if (session().commands.toggle_inline_code) $$render(consequent_3);
				});
			}

			var node_5 = sibling(node_4, 2);

			{
				var consequent_4 = ($$anchor) => {
					var button_4 = root_5$1();
					let classes_3;

					template_effect(() => {
						classes_3 = set_class(button_4, 1, 'highlight svelte-zh32e5', null, classes_3, { active: session().commands.toggle_highlight.active });
						button_4.disabled = session().commands.toggle_highlight.disabled;
					});

					delegated('mousedown', button_4, (event) => {
						event.preventDefault();
						session().commands.toggle_highlight.execute();
					});

					append($$anchor, button_4);
				};

				if_block(node_5, ($$render) => {
					if (session().commands.toggle_highlight) $$render(consequent_4);
				});
			}

			var node_6 = sibling(node_5, 2);

			{
				var consequent_5 = ($$anchor) => {
					var button_5 = root_6$1();
					let classes_4;

					template_effect(() => {
						classes_4 = set_class(button_5, 1, 'strikethrough svelte-zh32e5', null, classes_4, { active: session().commands.toggle_strikethrough.active });
						button_5.disabled = session().commands.toggle_strikethrough.disabled;
					});

					delegated('mousedown', button_5, (event) => {
						event.preventDefault();
						session().commands.toggle_strikethrough.execute();
					});

					append($$anchor, button_5);
				};

				if_block(node_6, ($$render) => {
					if (session().commands.toggle_strikethrough) $$render(consequent_5);
				});
			}

			append($$anchor, fragment_1);
		};

		const insert_button = ($$anchor) => {
			var button_6 = root_8$1();

			template_effect(() => button_6.disabled = !get$1(can_insert_default));
			delegated('mousedown', button_6, insert_default_node);
			append($$anchor, button_6);
		};

		const delete_button = ($$anchor) => {
			var button_7 = root_9$1();

			template_effect(() => button_7.disabled = !get$1(can_delete));
			delegated('mousedown', button_7, delete_node_selection);
			append($$anchor, button_7);
		};

		const history_buttons = ($$anchor) => {
			var fragment_2 = root_10$1();
			var button_8 = first_child(fragment_2);
			var button_9 = sibling(button_8, 2);

			template_effect(() => {
				button_8.disabled = session().commands.undo?.disabled ?? true;
				button_9.disabled = session().commands.redo?.disabled ?? true;
			});

			delegated('mousedown', button_8, (event) => {
				event.preventDefault();
				session().commands.undo?.execute();
			});

			delegated('mousedown', button_9, (event) => {
				event.preventDefault();
				session().commands.redo?.execute();
			});

			append($$anchor, fragment_2);
		};

		let session = prop($$props, 'session', 7),
			editable = prop($$props, 'editable', 15, false);

		function toggle_editable() {
			if (editable()) {
				$$props.save();
				session().selection = null;
			}

			editable(!editable());
		}

		let selection_type = user_derived(() => session().selection?.type ?? null);

		// Check if we have a collapsed node selection (node caret)
		let is_node_caret = user_derived(() => session().selection?.type === 'node' && session().selection.anchor_offset === session().selection.focus_offset);

		// Get default node_type for current node_array
		let default_node_type = user_derived(() => {
			if (!get$1(is_node_caret)) return null;

			const node_array_path = session().selection.path;
			const node_array_node = session().get(node_array_path.slice(0, -1)); // Get the parent node
			const node_array_property = node_array_path.at(-1); // Get the property name
			const node_schema = session().schema[node_array_node?.type];

			if (!node_schema) return null;

			const property_definition = node_schema.properties[node_array_property];

			if (property_definition?.type !== 'node_array') return null;

			return property_definition.default_node_type || (property_definition.node_types?.length === 1 ? property_definition.node_types[0] : null);
		});

		let can_insert_default = user_derived(() => Boolean(get$1(is_node_caret) && get$1(default_node_type) && session().config.inserters?.[get$1(default_node_type)]));
		let can_delete = user_derived(() => get$1(selection_type) === 'node' || get$1(selection_type) === 'property');

		function insert_default_node(event) {
			event.preventDefault();

			const inserter = get$1(default_node_type)
				? session().config.inserters?.[get$1(default_node_type)]
				: null;

			if (!get$1(is_node_caret) || !inserter) return;

			const tr = session().tr;

			inserter(tr);
			session().apply(tr);
		}

		function delete_node_selection(event) {
			event.preventDefault();

			if (!get$1(can_delete)) return;

			session().apply(session().tr.delete_selection('backward'));
		}

		function select_parent(event) {
			event.preventDefault();

			if (session().commands.select_parent?.disabled) return;

			session().commands.select_parent?.execute();
		}

		// While a pointer drags a selection the floating toolbar stays hidden,
		// otherwise it flickers along the growing selection. It appears
		// instantly on pointer up.
		let is_dragging = state(false);

		function handle_window_pointerdown(event) {
			// Presses on the toolbars themselves must not hide them
			if (event.target instanceof Element && event.target.closest('.editor-toolbar')) return;

			set$1(is_dragging, true);
		}

		function handle_window_pointerup() {
			set$1(is_dragging, false);
		}

		// Anchor for the floating toolbar. Every selectable element exposes
		// anchor-name: --{serialized_path}, so the toolbar attaches to the element
		// owning the current selection with pure CSS anchor positioning.
		// last_node_anchor (multi-node only) is the last selected node's path,
		// exposed as --last-selected-node-anchor for a position-try fallback.
		let floating_anchor = user_derived(() => {
			if (!editable()) return null;

			const sel = session().selection;

			if (!sel) return null;

			if (sel.type === 'text') {
				// No toolbar at a collapsed text caret: it would hover over the
				// line above while the user is typing.
				if (sel.anchor_offset === sel.focus_offset) return null;

				return { name: serialize_path(sel.path) };
			}

			if (sel.type === 'property') {
				return { name: serialize_path(sel.path) };
			}

			if (sel.type === 'node') {
				const start = Math.min(sel.anchor_offset, sel.focus_offset);
				const end = Math.max(sel.anchor_offset, sel.focus_offset);

				if (start !== end) {
					return {
						name: serialize_path([...sel.path, start]),
						...end - start > 1
							? { last_node_anchor: serialize_path([...sel.path, end - 1]) }
							: {}
					};
				}

				// Node caret: nothing to offer here yet (this project has no
				// gap-insert tool configured), the bottom toolbar's insert
				// button covers it instead.
				return null;
			}

			return null;
		});

		// Distance the visual viewport bottom sits above the layout viewport
		// bottom. Chromium and Firefox resize the layout viewport when the
		// virtual keyboard opens (interactive-widget=resizes-content), so this
		// stays 0 there. iOS Safari only shrinks and pans the visual viewport,
		// so the bottom toolbar must be translated up by this inset to stay
		// visible above the keyboard, also while scrolling.
		let keyboard_inset = state(0);

		user_effect(() => {
			const visual_viewport = window.visualViewport;

			if (!visual_viewport) return;

			let current = untrack(() => get$1(keyboard_inset));
			let target = current;
			let raf = 0;

			function measure() {
				target = Math.max(0, Math.round(window.innerHeight - visual_viewport.height - visual_viewport.offsetTop));

				if (!raf) raf = requestAnimationFrame(follow);
			}

			// Exponential follower: large distances (keyboard opening) are covered
			// within a few frames while the small stale-position corrections that
			// Safari reports during touch pans get smoothed instead of rendering
			// as jitter. Speed adapts to the remaining distance by construction.
			function follow() {
				raf = 0;

				const delta = target - current;

				if (Math.abs(delta) <= 1) {
					current = target;
				} else {
					current += delta * 0.35;
					raf = requestAnimationFrame(follow);
				}

				set$1(keyboard_inset, current, true);
			}

			measure();
			visual_viewport.addEventListener('resize', measure);
			visual_viewport.addEventListener('scroll', measure);

			return () => {
				cancelAnimationFrame(raf);
				visual_viewport.removeEventListener('resize', measure);
				visual_viewport.removeEventListener('scroll', measure);
			};
		});

		var fragment_3 = root_16();

		event('pointerdown', $window, handle_window_pointerdown);
		event('pointerup', $window, handle_window_pointerup);
		event('pointercancel', $window, handle_window_pointerup);

		var node_7 = first_child(fragment_3);

		{
			var consequent_8 = ($$anchor) => {
				var fragment_4 = comment();
				var node_8 = first_child(fragment_4);

				key(node_8, () => get$1(floating_anchor).name, ($$anchor) => {
					var div = root_12$1();
					let classes_5;
					var div_1 = child(div);
					var node_9 = child(div_1);

					{
						var consequent_6 = ($$anchor) => {
							var fragment_5 = root_11$1();
							var node_10 = first_child(fragment_5);

							select_parent_button(node_10);

							var node_11 = sibling(node_10, 2);

							mark_buttons(node_11);
							append($$anchor, fragment_5);
						};

						var consequent_7 = ($$anchor) => {
							var fragment_6 = root_11$1();
							var node_12 = first_child(fragment_6);

							select_parent_button(node_12);

							var node_13 = sibling(node_12, 2);

							delete_button(node_13);
							append($$anchor, fragment_6);
						};

						if_block(node_9, ($$render) => {
							if (get$1(selection_type) === 'text') $$render(consequent_6); else if (get$1(selection_type) === 'node' || get$1(selection_type) === 'property') $$render(consequent_7, 1);
						});
					}

					template_effect(
						($0) => {
							classes_5 = set_class(div, 1, 'editor-toolbar floating-toolbar svelte-zh32e5', null, classes_5, { 'has-last-node-anchor': $0 });

							set_style(div, `position-anchor: --${get$1(floating_anchor).name ?? ''};${get$1(floating_anchor).last_node_anchor
							? ` --last-selected-node-anchor: --${get$1(floating_anchor).last_node_anchor};`
							: ''}`);
						},
						[() => Boolean(get$1(floating_anchor).last_node_anchor)]
					);

					append($$anchor, div);
				});

				append($$anchor, fragment_4);
			};

			if_block(node_7, ($$render) => {
				if (get$1(floating_anchor) && !get$1(is_dragging)) $$render(consequent_8);
			});
		}

		var div_2 = sibling(node_7, 2);
		let styles;
		var div_3 = child(div_2);
		var node_14 = child(div_3);

		{
			var consequent_14 = ($$anchor) => {
				var fragment_7 = root_15();
				var div_4 = first_child(fragment_7);
				var node_15 = child(div_4);

				{
					var consequent_9 = ($$anchor) => {
						var fragment_8 = root_13$1();
						var node_16 = first_child(fragment_8);

						select_parent_button(node_16);

						var node_17 = sibling(node_16, 2);

						mark_buttons(node_17);

						var node_18 = sibling(node_17, 2);

						divider(node_18);
						append($$anchor, fragment_8);
					};

					var consequent_11 = ($$anchor) => {
						var fragment_9 = comment();
						var node_19 = first_child(fragment_9);

						{
							var consequent_10 = ($$anchor) => {
								var fragment_10 = root_11$1();
								var node_20 = first_child(fragment_10);

								insert_button(node_20);

								var node_21 = sibling(node_20, 2);

								divider(node_21);
								append($$anchor, fragment_10);
							};

							if_block(node_19, ($$render) => {
								if (get$1(can_insert_default)) $$render(consequent_10);
							});
						}

						append($$anchor, fragment_9);
					};

					var consequent_12 = ($$anchor) => {
						var fragment_11 = root_11$1();
						var node_22 = first_child(fragment_11);

						select_parent_button(node_22);

						var node_23 = sibling(node_22, 2);

						divider(node_23);
						append($$anchor, fragment_11);
					};

					if_block(node_15, ($$render) => {
						if (get$1(selection_type) === 'text') $$render(consequent_9); else if (get$1(is_node_caret)) $$render(consequent_11, 1); else if (get$1(selection_type) === 'node' || get$1(selection_type) === 'property') $$render(consequent_12, 2);
					});
				}

				var node_24 = sibling(div_4, 2);

				history_buttons(node_24);

				var node_25 = sibling(node_24, 2);

				{
					var consequent_13 = ($$anchor) => {
						var div_5 = root_14$1();
						var node_26 = child(div_5);

						divider(node_26);

						var node_27 = sibling(node_26, 2);

						delete_button(node_27);
						append($$anchor, div_5);
					};

					if_block(node_25, ($$render) => {
						if (get$1(can_delete)) $$render(consequent_13);
					});
				}

				append($$anchor, fragment_7);
			};

			if_block(node_14, ($$render) => {
				if (editable()) $$render(consequent_14);
			});
		}

		var div_6 = sibling(node_14, 2);
		let classes_6;
		var node_28 = child(div_6);

		{
			var consequent_15 = ($$anchor) => {
				divider($$anchor);
			};

			if_block(node_28, ($$render) => {
				if (editable()) $$render(consequent_15);
			});
		}

		var button_10 = sibling(node_28, 2);
		var text = only_child(button_10, true);

		template_effect(() => {
			styles = set_style(div_2, '', styles, { '--keyboard-inset': `${get$1(keyboard_inset) ?? ''}px` });
			classes_6 = set_class(div_6, 1, 'save-group svelte-zh32e5', null, classes_6, { 'has-leading-tools': editable() });
			set_text(text, editable() ? 'Save' : 'Edit');
		});

		delegated('click', button_10, toggle_editable);
		append($$anchor, fragment_3);
		pop();
	}

	delegate(['mousedown', 'click']);

	const empty = { path: null, markdown: null, settings: { path: "settings.md", markdown: null } };
	let current = null;
	function seed() {
	  if (current) return current
	  const element = document.getElementById("vowel-source");
	  try {
	    current = element ? { ...empty, ...JSON.parse(element.textContent) } : { ...empty };
	  } catch {
	    current = { ...empty };
	  }
	  return current
	}
	function getSource() {
	  return seed()
	}
	function updateFromTarget(target) {
	  const source = seed();
	  if (typeof target.source === "string") source.path = target.source;
	  if (typeof target.metadata?.markdown === "string") source.markdown = target.metadata.markdown;
	}
	function updateSettings(markdown) {
	  seed().settings.markdown = markdown;
	}

	const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/;
	function splitFrontmatter(text) {
	  const match = text.match(FRONTMATTER);
	  if (!match) return { data: {}, body: text, had: false }
	  const data = parse(match[1]) || {};
	  return { data, body: text.slice(match[0].length), had: true }
	}
	function joinFrontmatter(data, body) {
	  return `---\n${stringify(data)}---\n${body.replace(/^\r?\n/, "")}`
	}
	function themeObject(theme) {
	  if (theme && typeof theme === "object" && !Array.isArray(theme)) return { ...theme }
	  if (typeof theme === "string") return { name: theme }
	  return {}
	}
	async function readSettings() {
	  const { settings } = getSource();
	  return splitFrontmatter(settings.markdown ?? "")
	}
	async function writeSettings(filePath, data) {
	  const response = await fetch("/", {
	    method: "POST",
	    headers: { "Content-Type": "application/json" },
	    body: JSON.stringify({ type: "file", filePath, data })
	  });
	  if (!response.ok) {
	    const detail = await response.json().catch(() => ({}));
	    throw new Error(detail.error || `write failed (${response.status})`)
	  }
	  updateSettings(data);
	  return response.json()
	}

	var root$d = from_html(`<!> <!>`, 1);

	function Editor($$anchor, $$props) {
		push($$props, true);

		// Both props are read off the rendered page before this mounts, by
		// main.js's startEditing: the session from section#content, the title
		// and frontmatter from the <main> around it. Ingesting has to happen
		// while the server output is still there, and section#content has to be
		// emptied before this component is mounted into it - which is why
		// neither belongs here.
		//
		// The frontmatter round trips unchanged for now; carrying it is what
		// lets a save reproduce the whole file rather than just the body.
		// The button that mounted this said Edit, so editing is already on and
		// the toolbar's own toggle reads Save.
		let editable = state(true);

		const key_mapper = new KeyMapper();

		setContext("key_mapper", key_mapper);

		// Frontmatter from the source, body from the editor. The source comes
		// with the page (see source.js) and is refreshed by every rebuild the
		// socket pushes, so it is read at save time rather than when the
		// editor opened. Taking the frontmatter from the source rather than
		// the rendered page is what lets a key that never renders survive a
		// save. The title is the one key that isn't kept: it is written back
		// as a `#` heading, never as `title:`, so a file whose title lived
		// only in frontmatter gains a heading and loses the key.
		async function save() {
			const { path, markdown: text } = getSource();

			if (!path || typeof text !== "string") {
				console.error("[vowel] not saved: this page has no source to save to");

				return;
			}

			const { title: ignoredTitle, ...properties } = splitFrontmatter(text).data;
			const markdown = serialize($$props.session.doc, { title: $$props.frontmatter.title, properties });

			await writeSettings(path, markdown);
			console.info("[vowel] saved %s", path);
		}

		var fragment = root$d();
		var event_handler = user_derived(() => key_mapper.handle_keydown.bind(key_mapper));

		event('keydown', $window, function (...$$args) {
			get$1(event_handler)?.apply(this, $$args);
		});

		var node = first_child(fragment);

		{
			let $0 = user_derived(() => [$$props.session.doc.document_id]);

			Svedit(node, {
				get session() {
					return $$props.session;
				},

				get path() {
					return get$1($0);
				},

				get editable() {
					return get$1(editable);
				},

				set editable($$value) {
					set$1(editable, $$value, true);
				}
			});
		}

		var node_1 = sibling(node, 2);

		Toolbar(node_1, {
			get session() {
				return $$props.session;
			},
			save,
			get editable() {
				return get$1(editable);
			},

			set editable($$value) {
				set$1(editable, $$value, true);
			}
		});

		append($$anchor, fragment);
		pop();
	}

	var root$c = from_html(`<div class="edit-launcher svelte-1g2xck" data-vowel-client=""><button class="edit settings svelte-1g2xck" title="Typography and theme settings">Settings</button> <span class="divider svelte-1g2xck" aria-hidden="true"></span> <button class="edit svelte-1g2xck"> </button></div>`);

	const $$css$2 = {
		hash: 'svelte-1g2xck',
		code: '\n	/* Same surface as .editor-toolbar in Toolbar.svelte. Duplicated rather\n	   than shared: scoped styles don\'t cross components, and a global\n	   stylesheet injected into someone else\'s page is a collision waiting\n	   to happen. */.edit-launcher.svelte-1g2xck {position:fixed;bottom:max(var(--s-4, 16px), env(safe-area-inset-bottom, 0px));right:var(--s-4, 16px);z-index:50;display:flex;align-items:center;width:fit-content;padding:4px;color:var(--foreground, #111);background:var(--background, #fff);border:1px solid oklch(from var(--foreground, #111) l c h / 0.12);border-radius:9999px;box-shadow:0 1px 2px oklch(0% 0 0 / 0.12),\n			0 4px 16px oklch(0% 0 0 / 0.08);pointer-events:auto;}\n\n	/* Matches .toggle-editable, down to leaving font-family alone: the\n	   toolbar\'s Save button inherits the UA button font too, and the two\n	   sit in the same corner one after the other. */.edit.svelte-1g2xck {display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;height:36px;min-height:36px;flex:none;padding:0 1rem;border:none;border-radius:9999px;background:transparent;color:var(--editing, #2563eb);font-size:0.875rem;font-weight:600;line-height:1;cursor:pointer;pointer-events:auto;transition:background 150ms,\n			transform 150ms;outline:1px solid transparent;}\n\n	@media (hover: hover) {.edit.svelte-1g2xck:hover:not(:disabled) {background:oklch(from var(--editing, #2563eb) l c h / 0.08);}\n	}.edit.svelte-1g2xck:active:not(:disabled) {background:oklch(from var(--editing, #2563eb) l c h / 0.12);transform:translateY(1px) scale(0.97);}.edit.svelte-1g2xck:focus-visible {outline:none;box-shadow:inset 0 0 0 1px var(--editing, #2563eb);}\n\n	/* Separates the two actions inside the one pill, the same hairline\n	   Toolbar.svelte uses between tool groups. */.divider.svelte-1g2xck {flex:none;width:1px;height:20px;margin-inline:2px;background:oklch(from var(--foreground, #111) l c h / 0.15);}\n\n	/* Secondary next to Edit: the same pill, in the text colour rather\n	   than the accent, so Edit stays the one obvious action. */.settings.svelte-1g2xck {color:var(--foreground, #111);font-weight:500;}\n\n	@media (hover: hover) {.settings.svelte-1g2xck:hover:not(:disabled) {background:oklch(from var(--foreground, #111) l c h / 0.06);}\n	}.settings.svelte-1g2xck:active:not(:disabled) {background:oklch(from var(--foreground, #111) l c h / 0.09);}.edit.svelte-1g2xck:disabled {color:oklch(from var(--foreground, #111) l c h / 0.4);cursor:not-allowed;}'
	};

	function EditButton($$anchor, $$props) {
		push($$props, true);
		append_styles$1($$anchor, $$css$2);

		// The editor's entry point, and the only thing a previewed page carries
		// until it is pressed: everything Svedit needs is reached through
		// onedit (see main.js's startEditing), not from here.
		//
		// Styled as the same pill as Toolbar.svelte's bottom bar, which takes
		// this corner over once editing starts - so pressing Edit reads as the
		// button becoming the toolbar rather than as one widget replacing
		// another.
		let editing = state(false);

		// Non-empty once a press found elements ingest could not read. The page
		// can't be edited at all in that case (ingest fails whole-document),
		// so the button stays put and says so instead of disappearing.
		let unrecognised = state(proxy([]));

		function start() {
			const failed = $$props.onedit();

			if (failed.length) {
				set$1(unrecognised, failed, true);

				return;
			}

			set$1(editing, true);
		}

		var fragment = comment();
		var node = first_child(fragment);

		{
			var consequent = ($$anchor) => {
				var div = root$c();
				var button = child(div);
				var button_1 = sibling(button, 4);
				var text = only_child(button_1, true);

				template_effect(
					($0) => {
						button_1.disabled = get$1(unrecognised).length > 0;
						set_attribute(button_1, 'title', $0);
						set_text(text, get$1(unrecognised).length ? "Can't edit" : 'Edit');
					},
					[
						() => get$1(unrecognised).length
							? `This page can't be edited yet: ${get$1(unrecognised).join(', ')}`
							: 'Edit this page'
					]
				);

				delegated('click', button, function (...$$args) {
					$$props.onsettings?.apply(this, $$args);
				});

				delegated('click', button_1, start);
				append($$anchor, div);
			};

			if_block(node, ($$render) => {
				if (!get$1(editing)) $$render(consequent);
			});
		}

		append($$anchor, fragment);
		pop();
	}

	delegate(['click']);

	const RAMP = "ramp";
	const CHOICE = "choice";
	const FLAG = "flag";
	const sizeAxis = {
	  id: "size",
	  label: "Size",
	  kind: RAMP,
	  property: "font-size",
	  variable: "fs",
	  unit: "x",
	  h1: { min: 1.75, max: 2.7, step: 0.05, default: 2.4 },
	  h6: { min: 1, max: 1.5, step: 0.05, default: 1.05 },
	  power: { min: 0.5, max: 4, step: 0.1, default: 2.3 }
	};
	const letterSpacingAxis = {
	  id: "letter-spacing",
	  label: "Letter spacing",
	  kind: RAMP,
	  property: "letter-spacing",
	  variable: "ls",
	  unit: "ch",
	  h1: { min: -0.1, max: 0.1, step: 0.005, default: -0.06 },
	  h6: { min: -0.1, max: 0.1, step: 0.005, default: 0.05 },
	  power: { min: 0.5, max: 4, step: 0.1, default: 2 }
	};
	function weightAxis(min, max) {
	  const clamp = value => Math.min(max, Math.max(min, value));
	  return {
	    id: "weight",
	    label: "Weight",
	    kind: RAMP,
	    property: "font-weight",
	    variable: "fw",
	    unit: "",
	    h1: { min, max, step: 1, default: clamp(900) },
	    h6: { min, max, step: 1, default: clamp(700) },
	    power: { min: 0.5, max: 4, step: 0.1, default: 2 }
	  }
	}
	function widthAxis(min, max) {
	  const clamp = value => Math.min(max, Math.max(min, value));
	  return {
	    id: "width",
	    label: "Width",
	    kind: RAMP,
	    tag: "wdth",
	    variable: "wdth",
	    unit: "",
	    h1: { min, max, step: 1, default: clamp(125) },
	    h6: { min, max, step: 1, default: clamp(75) },
	    power: { min: 0.5, max: 4, step: 0.1, default: 4 }
	  }
	}
	function variationAxis(id, label, tag, min, max, step) {
	  return {
	    id,
	    label,
	    kind: RAMP,
	    tag,
	    variable: tag.toLowerCase(),
	    unit: "",
	    h1: { min, max, step, default: min },
	    h6: { min, max, step, default: min },
	    power: { min: 0.5, max: 4, step: 0.1, default: 2 }
	  }
	}
	const families = [
	  {
	    name: "Bricolage",
	    cssName: "Bricolage Grotesque",
	    stack: "serif",
	    faces: [{ file: "bricolage.ttf", style: "normal" }],
	    axes: [sizeAxis, letterSpacingAxis, weightAxis(200, 800), widthAxis(75, 100)]
	  },
	  {
	    name: "Pliant",
	    cssName: "Pliant",
	    stack: "sans-serif",
	    text: true,
	    faces: [
	      { file: "pliant-regular.ttf", style: "normal" },
	      { file: "pliant-italic.ttf", style: "italic" }
	    ],
	    axes: [sizeAxis, letterSpacingAxis, weightAxis(100, 900), widthAxis(100, 125)]
	  },
	  {
	    name: "Emberly",
	    cssName: "Emberly",
	    stack: "serif",
	    faces: [{ file: "emberly-regular.woff2", style: "normal" }],
	    axes: [sizeAxis, letterSpacingAxis, weightAxis(100, 900), widthAxis(75, 100)]
	  },
	  {
	    name: "Agrandir",
	    cssName: "Agrandir Variable",
	    stack: "sans-serif",
	    faces: [{ file: "agrandir.woff2", style: "normal" }],
	    axes: [sizeAxis, letterSpacingAxis, weightAxis(100, 900), widthAxis(50, 200)]
	  },
	  {
	    name: "Bandeins Strange",
	    cssName: "Bandeins Strange Variable",
	    stack: "sans-serif",
	    faces: [{ file: "bandeins-strange.woff2", style: "normal" }],
	    axes: [sizeAxis, letterSpacingAxis, weightAxis(200, 800), widthAxis(100, 800)]
	  },
	  {
	    name: "Recursive",
	    cssName: "Recursive",
	    stack: "sans-serif",
	    text: true,
	    faces: [{ file: "recursive.ttf", style: "normal" }],
	    axes: [
	      sizeAxis,
	      letterSpacingAxis,
	      weightAxis(300, 1000),
	      variationAxis("casual", "Casual", "CASL", 0, 1, 0.05),
	      variationAxis("monospace", "Monospace", "MONO", 0, 1, 0.05),
	      {
	        id: "forms",
	        label: "Forms",
	        kind: CHOICE,
	        tag: "CRSV",
	        options: [
	          { label: "Roman", value: 0 },
	          { label: "Auto", value: 0.5 },
	          { label: "Cursive", value: 1 }
	        ],
	        default: 0.5
	      }
	    ]
	  },
	  {
	    name: "Mona Sans",
	    cssName: "Mona Sans",
	    stack: "sans-serif",
	    text: true,
	    faces: [
	      { file: "mona-sans-regular.ttf", style: "normal" },
	      { file: "mona-sans-italic.ttf", style: "italic" }
	    ],
	    axes: [sizeAxis, letterSpacingAxis, weightAxis(200, 900), widthAxis(75, 125)]
	  },
	  {
	    name: "Fraunces",
	    cssName: "Fraunces",
	    stack: "serif",
	    faces: [
	      { file: "fraunces-regular.ttf", style: "normal" },
	      { file: "fraunces-italic.ttf", style: "italic" }
	    ],
	    axes: [
	      sizeAxis,
	      letterSpacingAxis,
	      weightAxis(100, 900),
	      variationAxis("softness", "Softness", "SOFT", 0, 100, 1),
	      { id: "wonky", label: "Wonky", kind: FLAG, tag: "WONK", default: true }
	    ]
	  }
	];
	function findFamily(name) {
	  if (typeof name !== "string") return null
	  const wanted = name.trim().toLowerCase();
	  return families.find(family => family.name.toLowerCase() === wanted) || null
	}
	const textFamilies = families.filter(family => family.text);
	function axisKeys(axis) {
	  if (axis.kind !== RAMP) return { value: axis.id }
	  return { h1: `h1-${axis.id}`, h6: `h6-${axis.id}`, power: `heading-${axis.id}` }
	}
	function numericValue(settings, key, range) {
	  const raw = settings[key];
	  const value = typeof raw === "number" ? raw : Number(raw);
	  if (!Number.isFinite(value)) return range.default
	  return Math.min(range.max, Math.max(range.min, value))
	}
	function rampValues(axis, settings) {
	  const keys = axisKeys(axis);
	  return {
	    h1: numericValue(settings, keys.h1, axis.h1),
	    h6: numericValue(settings, keys.h6, axis.h6),
	    power: numericValue(settings, keys.power, axis.power)
	  }
	}
	function fixedValue(axis, settings) {
	  const raw = settings[axisKeys(axis).value];
	  if (axis.kind === FLAG) return (raw === undefined ? axis.default : Boolean(raw)) ? 1 : 0
	  const match = axis.options.find(option => (
	    String(option.label).toLowerCase() === String(raw).toLowerCase() || option.value === raw
	  ));
	  return match ? match.value : axis.default
	}

	const fallbackColors = ["#5119ff", "#00edc6"];

	var root_1$1 = from_html(`<p class="note svelte-14cc0vj">Reading settings.md…</p>`);
	var root_2 = from_html(`<label class="field svelte-14cc0vj"><span class="svelte-14cc0vj"> </span> <input type="text" class="svelte-14cc0vj"/></label>`);
	var root_3 = from_html(`<label class="field color svelte-14cc0vj"><span class="svelte-14cc0vj"> </span> <input type="color" class="svelte-14cc0vj"/> <input type="text" class="hex svelte-14cc0vj" spellcheck="false"/></label>`);
	var root_4 = from_html(`<option> </option>`);
	var root_5 = from_html(`<label class="field svelte-14cc0vj"><span class="svelte-14cc0vj">Body weight</span> <input type="number" min="100" max="900" step="10"/></label>`);
	var root_6 = from_html(`<p class="note svelte-14cc0vj">Pick a font to set a heading scale.</p>`);
	var root_7 = from_html(`<label class="slider svelte-14cc0vj"><span class="svelte-14cc0vj"> </span> <input type="range" class="svelte-14cc0vj"/> <output class="svelte-14cc0vj"> </output></label>`);
	var root_8 = from_html(`<fieldset class="svelte-14cc0vj"><legend class="svelte-14cc0vj"> </legend> <!></fieldset>`);
	var root_9 = from_html(`<label class="field svelte-14cc0vj"><span class="svelte-14cc0vj"> </span> <select class="svelte-14cc0vj"></select></label>`);
	var root_10 = from_html(`<label class="field check svelte-14cc0vj"><span class="svelte-14cc0vj"> </span> <input type="checkbox"/></label>`);
	var root_11 = from_html(`<p class="note svelte-14cc0vj">Sizes and spacing preview as you drag. The font and colors apply on save.</p> <!>`, 1);
	var root_12 = from_html(`<section class="svelte-14cc0vj"><h3 class="svelte-14cc0vj">Site</h3> <!></section> <section class="svelte-14cc0vj"><h3 class="svelte-14cc0vj">Colors</h3> <p class="note svelte-14cc0vj">Two seeds; every shade on the site is generated from them.</p> <!></section> <section class="svelte-14cc0vj"><h3 class="svelte-14cc0vj">Typography</h3> <label class="field svelte-14cc0vj"><span class="svelte-14cc0vj">Font</span> <select class="svelte-14cc0vj"><option>None</option><!></select></label> <label class="field svelte-14cc0vj"><span class="svelte-14cc0vj">Body font</span> <select class="svelte-14cc0vj"><option>System</option><!></select></label> <!> <!></section>`, 1);
	var root_13 = from_html(`<p class="error svelte-14cc0vj"> </p>`);
	var root_14 = from_html(`<aside class="settings-drawer svelte-14cc0vj" aria-label="Site settings" data-vowel-client=""><header class="svelte-14cc0vj"><h2 class="svelte-14cc0vj">Settings</h2> <button class="close svelte-14cc0vj" title="Close settings">&#10005;</button></header> <!> <!> <footer class="svelte-14cc0vj"><button class="save svelte-14cc0vj"> </button></footer></aside>`);

	const $$css$1 = {
		hash: 'svelte-14cc0vj',
		code: '\n	/* Full height down the left edge. No backdrop and nothing fixed over\n	   the page: the site stays usable while you edit, which is what makes\n	   the live preview worth having. The page is not pushed aside either -\n	   that would mean writing to the host document\'s own layout. */.settings-drawer.svelte-14cc0vj {\n		/* Physical, not logical: the drawer is injected into someone\n		   else\'s document and would flip to the right edge on an RTL\n		   page, which is not what "left" means here. */position:fixed;top:0;bottom:0;left:0;z-index:70;box-sizing:border-box;display:flex;flex-direction:column;width:min(340px, 100vw);padding:16px;overflow-y:auto;overscroll-behavior:contain;color:var(--foreground, #111);background:var(--background, #fff);border-right:1px solid oklch(from var(--foreground, #111) l c h / 0.12);box-shadow:0 0 24px oklch(0% 0 0 / 0.12);font-size:0.8125rem;line-height:1.4;}header.svelte-14cc0vj {display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;}h2.svelte-14cc0vj {margin:0;font-size:1rem;font-weight:600;letter-spacing:0;}h3.svelte-14cc0vj {margin:0 0 8px;font-size:0.6875rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:oklch(from var(--foreground, #111) l c h / 0.55);}section.svelte-14cc0vj {padding-block:14px;border-top:1px solid oklch(from var(--foreground, #111) l c h / 0.1);}.close.svelte-14cc0vj {flex:none;width:28px;height:28px;padding:0;border:none;border-radius:50%;background:transparent;color:inherit;font-size:0.75rem;cursor:pointer;}\n\n	@media (hover: hover) {.close.svelte-14cc0vj:hover {background:oklch(from var(--foreground, #111) l c h / 0.06);}\n	}.note.svelte-14cc0vj {margin:0 0 10px;color:oklch(from var(--foreground, #111) l c h / 0.6);}.error.svelte-14cc0vj {margin:10px 0 0;color:oklch(0.55 0.2 25);}.field.svelte-14cc0vj {display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;}.field.svelte-14cc0vj > span:where(.svelte-14cc0vj) {flex:none;width:5.5rem;color:oklch(from var(--foreground, #111) l c h / 0.6);}.field.check.svelte-14cc0vj {justify-content:flex-start;}input[type=\'text\'].svelte-14cc0vj,\n	select.svelte-14cc0vj {flex:1;min-width:0;box-sizing:border-box;height:30px;padding:0 6px;color:inherit;background:transparent;border:1px solid oklch(from var(--foreground, #111) l c h / 0.2);border-radius:8px;font:inherit;}input[type=\'text\'].svelte-14cc0vj:focus-visible,\n	select.svelte-14cc0vj:focus-visible {outline:none;border-color:var(--editing, #2563eb);box-shadow:inset 0 0 0 1px var(--editing, #2563eb);}\n\n	/* The swatch and its hex edit the same value; the swatch is for\n	   choosing, the field is for pasting one you already have. */.field.color.svelte-14cc0vj input[type=\'color\']:where(.svelte-14cc0vj) {flex:none;width:34px;height:30px;padding:2px;background:transparent;border:1px solid oklch(from var(--foreground, #111) l c h / 0.2);border-radius:8px;cursor:pointer;}.hex.svelte-14cc0vj {font-family:ui-monospace, SFMono-Regular, Menlo, monospace;text-transform:lowercase;}fieldset.svelte-14cc0vj {margin:0 0 10px;padding:8px 10px;border:1px solid oklch(from var(--foreground, #111) l c h / 0.12);border-radius:10px;}legend.svelte-14cc0vj {padding:0 4px;font-weight:600;}.slider.svelte-14cc0vj {display:grid;grid-template-columns:2.25rem 1fr 3.25rem;align-items:center;gap:6px;}.slider.svelte-14cc0vj span:where(.svelte-14cc0vj) {color:oklch(from var(--foreground, #111) l c h / 0.6);}.slider.svelte-14cc0vj input:where(.svelte-14cc0vj) {width:100%;min-width:0;}output.svelte-14cc0vj {font-variant-numeric:tabular-nums;text-align:right;color:oklch(from var(--foreground, #111) l c h / 0.6);}\n\n	/* Sticks to the bottom of the drawer, above the scrolling content. */footer.svelte-14cc0vj {position:sticky;bottom:0;display:flex;justify-content:flex-end;margin-top:auto;padding-top:12px;padding-bottom:4px;background:var(--background, #fff);}.save.svelte-14cc0vj {height:32px;padding:0 1rem;border:none;border-radius:9999px;background:var(--editing, #2563eb);color:var(--background, #fff);font-size:0.8125rem;font-weight:600;cursor:pointer;}.save.svelte-14cc0vj:disabled {opacity:0.5;cursor:not-allowed;}'
	};

	function SettingsPanel($$anchor, $$props) {
		push($$props, true);
		append_styles$1($$anchor, $$css$1);

		// The settings drawer.
		//
		// Full height down the left edge, and deliberately **not** modal: no
		// backdrop, the page behind stays scrollable and clickable. Live
		// preview is the whole point - you drag a slider and watch the
		// headings resize - so anything that blocks the page would defeat it.
		//
		// Every control is derived from data rather than hardcoded: the site
		// fields from `siteFields` below, the typography controls from the
		// font catalogue, so a family only ever offers axes it actually has.
		let loading = state(true);

		let error = state(null);
		let saving = state(false);

		// The whole file, so a save rewrites only what changed and leaves
		// every other key - and the body - alone.
		let file = state(proxy({ data: {}, body: '' }));

		// Held apart from `data` until a theme field is actually edited, so a
		// site that wrote `theme: default` keeps that spelling unless it has a
		// reason not to. Editing only the title must not silently rewrite the
		// theme into its object form.
		let editedTheme = state(null);

		const theme = user_derived(() => get$1(editedTheme) ?? themeObject(get$1(file).data.theme));
		const family = user_derived(() => findFamily(get$1(theme).font));
		const colors = user_derived(() => [0, 1].map((index) => get$1(theme).colors?.[index] ?? fallbackColors[index]));

		// Top-level frontmatter keys, in the order they read as a form. Only
		// settings vowel actually consumes are here - `author` is in both demo
		// settings.md files and is read by nothing, so it isn't offered.
		const siteFields = [
			{
				key: 'title',
				label: 'Title',
				hint: 'The site name, shown in the header'
			},

			{
				key: 'tagline',
				label: 'Tagline',
				hint: 'Shown as the homepage hero'
			},

			{
				key: 'breadcrumb',
				label: 'Breadcrumb',
				hint: 'Label for the site root in navigation'
			},

			{
				key: 'domain',
				label: 'Domain',
				hint: 'Needed for the sitemap and feed'
			},

			{
				key: 'icon',
				label: 'Icon',
				hint: 'An emoji, or a path to an image'
			},
			{ key: 'logo', label: 'Logo', hint: 'Path to an SVG or image' },
			{
				key: 'wordmark',
				label: 'Wordmark',
				hint: 'Path to an SVG or image'
			}
		];

		// Setting a ramp variable on the document is the whole of live
		// preview: --*-delta is a calc() over these, so all six heading levels
		// and the header recompute themselves.
		const preview = user_derived(() => {
			if (!get$1(family)) return [];

			return get$1(family).axes.filter((axis) => axis.kind === RAMP).flatMap((axis) => {
				const { h1, h6, power } = rampValues(axis, get$1(theme));

				const value = (amount) => axis.unit === 'x'
					? `calc(var(--base-font-size) * ${amount})`
					: `${amount}${axis.unit}`;

				return [
					[`--${axis.variable}-start`, value(h6)],
					[`--${axis.variable}-end`, value(h1)],
					[`--${axis.variable}-power`, String(power)]
				];
			});
		});

		user_effect(() => {
			const root = document.documentElement;

			for (const [name, value] of get$1(preview)) root.style.setProperty(name, value);

			// The font family, the colour scheme and the non-ramped axes all
			// need a rebuild to see: the other seven fonts aren't served, and
			// the colour ramps are generated by colorhorse on the server.
		});

		user_effect(() => {
			readSettings().then((result) => set$1(file, result, true)).catch((e) => set$1(error, e.message, true)).finally(() => set$1(loading, false));
		});

		function setField(key, value) {
			const data = { ...get$1(file).data };

			if (value === '') delete data[key]; else data[key] = value;

			set$1(file, { ...get$1(file), data }, true);
		}

		function setTheme(key, value) {
			set$1(editedTheme, { ...get$1(theme), [key]: value }, true);
		}

		/** Both seeds are written together - colorhorse takes a pair. */
		function setColor(index, value) {
			setTheme('colors', get$1(colors).map((current, position) => position === index ? value : current));
		}

		async function save() {
			set$1(saving, true);
			set$1(error, null);

			const data = get$1(editedTheme)
				? { ...get$1(file).data, theme: get$1(editedTheme) }
				: get$1(file).data;

			try {
				await writeSettings('settings.md', joinFrontmatter(data, get$1(file).body));

				// No reload: the write lands in sourceFolder, the watcher
				// rebuilds and votive's live-reload client patches the page - the
				// same path a hand edit takes.
				$$props.onclose();
			} catch(e) {
				set$1(error, e.message, true);
			} finally {
				set$1(saving, false);
			}
		}

		var aside = root_14();
		var header = child(aside);
		var button = sibling(child(header), 2);

		var node = sibling(header, 2);

		{
			var consequent = ($$anchor) => {
				var p = root_1$1();

				append($$anchor, p);
			};

			var alternate_1 = ($$anchor) => {
				var fragment = root_12();
				var section = first_child(fragment);
				var node_1 = sibling(child(section), 2);

				each(node_1, 17, () => siteFields, (field) => field.key, ($$anchor, field) => {
					var label_1 = root_2();
					var span = child(label_1);
					var text = only_child(span, true);
					var input = sibling(span, 2);

					template_effect(() => {
						set_text(text, get$1(field).label);
						set_value(input, get$1(file).data[get$1(field).key] ?? '');
						set_attribute(input, 'placeholder', get$1(field).hint);
						set_attribute(input, 'title', get$1(field).hint);
					});

					delegated('input', input, (event) => setField(get$1(field).key, event.currentTarget.value));
					append($$anchor, label_1);
				});

				var section_1 = sibling(section, 2);
				var node_2 = sibling(child(section_1), 4);

				each(node_2, 18, () => ['One', 'Two'], (label) => label, ($$anchor, label, index) => {
					var label_2 = root_3();
					var span_1 = child(label_2);
					var text_1 = only_child(span_1, true);
					var input_1 = sibling(span_1, 2);

					var input_2 = sibling(input_1, 2);

					template_effect(() => {
						set_text(text_1, label);
						set_value(input_1, get$1(colors)[get$1(index)]);
						set_value(input_2, get$1(colors)[get$1(index)]);
					});

					delegated('input', input_1, (event) => setColor(get$1(index), event.currentTarget.value));
					delegated('input', input_2, (event) => setColor(get$1(index), event.currentTarget.value));
					append($$anchor, label_2);
				});

				var section_2 = sibling(section_1, 2);
				var label_3 = sibling(child(section_2), 2);
				var select = sibling(child(label_3), 2);
				var option_1 = child(select);

				option_1.value = option_1.__value = '';

				var node_3 = sibling(option_1);

				each(node_3, 17, () => families, (option) => option.name, ($$anchor, option) => {
					var option_2 = root_4();
					var text_2 = only_child(option_2, true);
					var option_2_value = {};

					template_effect(() => {
						set_text(text_2, get$1(option).name);

						if (option_2_value !== (option_2_value = get$1(option).name)) {
							option_2.value = (option_2.__value = option_2_value) ?? '';
						}
					});

					append($$anchor, option_2);
				});

				var select_value;

				init_select(select);

				var label_4 = sibling(label_3, 2);
				var select_1 = sibling(child(label_4), 2);
				var option_3 = child(select_1);

				option_3.value = option_3.__value = '';

				var node_4 = sibling(option_3);

				each(node_4, 17, () => textFamilies, (option) => option.name, ($$anchor, option) => {
					var option_4 = root_4();
					var text_3 = only_child(option_4, true);
					var option_4_value = {};

					template_effect(() => {
						set_text(text_3, get$1(option).name);

						if (option_4_value !== (option_4_value = get$1(option).name)) {
							option_4.value = (option_4.__value = option_4_value) ?? '';
						}
					});

					append($$anchor, option_4);
				});

				var select_1_value;

				init_select(select_1);

				var node_5 = sibling(label_4, 2);

				{
					var consequent_1 = ($$anchor) => {
						var label_5 = root_5();
						var input_3 = sibling(child(label_5), 2);
						template_effect(() => set_value(input_3, get$1(theme)['body-weight'] ?? 400));
						delegated('change', input_3, (event) => setTheme('body-weight', Number(event.currentTarget.value)));
						append($$anchor, label_5);
					};

					if_block(node_5, ($$render) => {
						if (get$1(theme)['body-font']) $$render(consequent_1);
					});
				}

				var node_6 = sibling(node_5, 2);

				{
					var consequent_2 = ($$anchor) => {
						var p_1 = root_6();

						append($$anchor, p_1);
					};

					var alternate = ($$anchor) => {
						var fragment_1 = root_11();
						var node_7 = sibling(first_child(fragment_1), 2);

						each(node_7, 17, () => get$1(family).axes, (axis) => axis.id, ($$anchor, axis) => {
							const keys = user_derived(() => axisKeys(get$1(axis)));
							var fragment_2 = comment();
							var node_8 = first_child(fragment_2);

							{
								var consequent_3 = ($$anchor) => {
									const current = user_derived(() => rampValues(get$1(axis), get$1(theme)));
									var fieldset = root_8();
									var legend = child(fieldset);
									var text_4 = only_child(legend, true);
									var node_9 = sibling(legend, 2);

									each(
										node_9,
										17,
										() => [
											['h1', 'h1', get$1(axis).h1],
											['h6', 'h6', get$1(axis).h6],
											['power', 'Scale', get$1(axis).power]
										],
										([part, label, range]) => part,
										($$anchor, $$item) => {
											var $$array = user_derived(() => to_array(get$1($$item), 3));
											let part = () => get$1($$array)[0];
											let label = () => get$1($$array)[1];
											let range = () => get$1($$array)[2];
											var label_6 = root_7();
											var span_2 = child(label_6);
											var text_5 = only_child(span_2, true);
											var input_4 = sibling(span_2, 2);

											var output = sibling(input_4, 2);
											var text_6 = only_child(output);

											template_effect(() => {
												set_text(text_5, label());
												set_attribute(input_4, 'min', range().min);
												set_attribute(input_4, 'max', range().max);
												set_attribute(input_4, 'step', range().step);
												set_value(input_4, get$1(current)[part()]);
												set_text(text_6, `${get$1(current)[part()] ?? ''}${get$1(axis).unit ?? ''}`);
											});

											delegated('input', input_4, (event) => setTheme(get$1(keys)[part()], Number(event.currentTarget.value)));
											append($$anchor, label_6);
										}
									);
									template_effect(() => set_text(text_4, get$1(axis).label));
									append($$anchor, fieldset);
								};

								var consequent_4 = ($$anchor) => {
									const current = user_derived(() => fixedValue(get$1(axis), get$1(theme)));
									var label_7 = root_9();
									var span_3 = child(label_7);
									var text_7 = only_child(span_3, true);
									var select_2 = sibling(span_3, 2);

									each(select_2, 21, () => get$1(axis).options, (option) => option.value, ($$anchor, option) => {
										var option_5 = root_4();
										var text_8 = only_child(option_5, true);
										var option_5_value = {};

										template_effect(
											($0) => {
												set_text(text_8, get$1(option).label);

												if (option_5_value !== (option_5_value = $0)) {
													option_5.value = (option_5.__value = option_5_value) ?? '';
												}
											},
											[() => String(get$1(option).value)]
										);

										append($$anchor, option_5);
									});

									var select_2_value;

									init_select(select_2);

									template_effect(
										($0) => {
											set_text(text_7, get$1(axis).label);

											if (select_2_value !== (select_2_value = $0)) {
												(
													select_2.value = (select_2.__value = select_2_value) ?? '',
													select_option(select_2, select_2_value)
												);
											}
										},
										[() => String(get$1(current))]
									);

									delegated('change', select_2, (event) => setTheme(get$1(keys).value, get$1(axis).options.find((option) => String(option.value) === event.currentTarget.value)?.label));
									append($$anchor, label_7);
								};

								var consequent_5 = ($$anchor) => {
									var label_8 = root_10();
									var span_4 = child(label_8);
									var text_9 = only_child(span_4, true);
									var input_5 = sibling(span_4, 2);

									template_effect(
										($0) => {
											set_text(text_9, get$1(axis).label);
											set_checked(input_5, $0);
										},
										[() => fixedValue(get$1(axis), get$1(theme)) === 1]
									);

									delegated('change', input_5, (event) => setTheme(get$1(keys).value, event.currentTarget.checked));
									append($$anchor, label_8);
								};

								if_block(node_8, ($$render) => {
									if (get$1(axis).kind === RAMP) $$render(consequent_3); else if (get$1(axis).kind === CHOICE) $$render(consequent_4, 1); else if (get$1(axis).kind === FLAG) $$render(consequent_5, 2);
								});
							}

							append($$anchor, fragment_2);
						});

						append($$anchor, fragment_1);
					};

					if_block(node_6, ($$render) => {
						if (!get$1(family)) $$render(consequent_2); else $$render(alternate, -1);
					});
				}

				template_effect(() => {
					if (select_value !== (select_value = get$1(theme).font ?? '')) {
						(
							select.value = (select.__value = select_value) ?? '',
							select_option(select, select_value)
						);
					}

					if (select_1_value !== (select_1_value = get$1(theme)['body-font'] ?? '')) {
						(
							select_1.value = (select_1.__value = select_1_value) ?? '',
							select_option(select_1, select_1_value)
						);
					}
				});

				delegated('change', select, (event) => setTheme('font', event.currentTarget.value));
				delegated('change', select_1, (event) => setTheme('body-font', event.currentTarget.value));
				append($$anchor, fragment);
			};

			if_block(node, ($$render) => {
				if (get$1(loading)) $$render(consequent); else $$render(alternate_1, -1);
			});
		}

		var node_10 = sibling(node, 2);

		{
			var consequent_6 = ($$anchor) => {
				var p_2 = root_13();
				var text_10 = only_child(p_2, true);

				template_effect(() => set_text(text_10, get$1(error)));
				append($$anchor, p_2);
			};

			if_block(node_10, ($$render) => {
				if (get$1(error)) $$render(consequent_6);
			});
		}

		var footer = sibling(node_10, 2);
		var button_1 = child(footer);
		var text_11 = only_child(button_1, true);

		template_effect(() => {
			button_1.disabled = get$1(saving) || get$1(loading);
			set_text(text_11, get$1(saving) ? 'Saving…' : 'Save');
		});

		delegated('click', button, function (...$$args) {
			$$props.onclose?.apply(this, $$args);
		});

		delegated('click', button_1, save);
		append($$anchor, aside);
		pop();
	}

	delegate(['click', 'input', 'change']);

	function Overlays($$anchor) {
		// Overlays component for custom UI only (link previews, image editors, etc.)
		// Node selection rendering is now handled by the library's NodeSelectionMarkers.
	}

	const SEGMENT_SEPARATOR = "_";
	const ESCAPED_UNDERSCORE = "--";
	function unescapeSegment(segment) {
	  return segment.replaceAll(ESCAPED_UNDERSCORE, SEGMENT_SEPARATOR)
	}
	function folderFromClasses(classList) {
	  const dirClassList = classList.filter(name => name.startsWith(SEGMENT_SEPARATOR));
	  if (!dirClassList.length) return null
	  const deepest = dirClassList.reduce((longest, name) => {
	    return name.length > longest.length ? name : longest
	  }, "");
	  const segments = deepest.slice(1).split(SEGMENT_SEPARATOR).filter(Boolean);
	  return segments.map(unescapeSegment).join("/")
	}
	function globParams(classList) {
	  const folder = folderFromClasses(classList);
	  if (folder === null) return null
	  const limitClass = classList.find(name => name.startsWith("limit-"));
	  const tagClass = classList.find(name => name.startsWith("tag-"));
	  const viewClass = classList.find(name => name.startsWith("view-"));
	  const properties = classList
	    .filter(name => name.startsWith("property-"))
	    .map(name => name.slice("property-".length));
	  return {
	    folder,
	    recursive: classList.includes("recursive"),
	    limit: limitClass ? limitClass.slice("limit-".length) : null,
	    tag: tagClass ? tagClass.slice("tag-".length) : null,
	    view: viewClass ? viewClass.slice("view-".length) : null,
	    properties
	  }
	}
	function globDirective({ folder, recursive, limit, tag, view = null, properties = [] }) {
	  const url = new URL("/" + [folder, recursive ? "**" : "*"].filter(Boolean).join("/"), "thismessage://");
	  if (limit) url.searchParams.set("count", limit);
	  if (tag) url.searchParams.set("tag", tag);
	  if (view) url.searchParams.set("view", view);
	  if (properties.length) url.searchParams.set("properties", properties.join(","));
	  return decodeURIComponent(url.pathname + url.search)
	}

	const TEXT_NODE = 3;
	const ELEMENT_NODE = 1;
	const MARK_TYPES = {
	  STRONG: "strong",
	  B: "strong",
	  EM: "emphasis",
	  I: "emphasis",
	  CODE: "inline_code",
	  MARK: "highlight",
	  DEL: "strikethrough",
	  S: "strikethrough",
	  A: "link"
	};
	const HEADING_LEVELS = {
	  H1: 1,
	  H2: 2,
	  H3: 3,
	  H4: 4,
	  H5: 5,
	  H6: 6
	};
	function classList(element) {
	  return [...element.classList]
	}
	function expansionDirective(element) {
	  const classes = classList(element);
	  if ((element.tagName === "UL" || element.tagName === "TABLE") && classes.some(name => name.startsWith("_"))) {
	    const params = globParams(classes);
	    return params && globDirective(params)
	  }
	  if (element.tagName === "ARTICLE" && classes.includes("reference")) {
	    const link = element.querySelector("a[href]");
	    return link && link.getAttribute("href")
	  }
	  if (element.tagName === "A" && classes.includes("link-preview")) {
	    return element.getAttribute("href")
	  }
	  if (element.tagName === "ARTICLE" && classes.includes("link-preview")) {
	    const link = element.querySelector("a[href]");
	    return link && link.getAttribute("href")
	  }
	  return null
	}
	function inlineFrom(domNode, context, insideMark) {
	  if (domNode.nodeType === TEXT_NODE) {
	    return { content: domNode.nodeValue, marks: [] }
	  }
	  if (domNode.nodeType !== ELEMENT_NODE) {
	    return { content: "", marks: [] }
	  }
	  if (domNode.tagName === "BR") {
	    return { content: "\n", marks: [] }
	  }
	  const markType = insideMark ? null : MARK_TYPES[domNode.tagName];
	  const children = [...domNode.childNodes].map(child => {
	    return inlineFrom(child, context, insideMark || Boolean(markType))
	  });
	  const combined = children.reduce((accumulated, result) => {
	    const shifted = result.marks.map(mark => ({
	      ...mark,
	      start_offset: mark.start_offset + accumulated.content.length,
	      end_offset: mark.end_offset + accumulated.content.length
	    }));
	    return {
	      content: accumulated.content + result.content,
	      marks: [...accumulated.marks, ...shifted]
	    }
	  }, { content: "", marks: [] });
	  if (!markType) return combined
	  const markId = context.createMark(markType, domNode);
	  return {
	    content: combined.content,
	    marks: [{ start_offset: 0, end_offset: combined.content.length, node_id: markId }]
	  }
	}
	function trimValue({ content, marks }) {
	  const leading = content.length - content.trimStart().length;
	  const trimmed = content.trim();
	  const clamped = marks
	    .map(mark => ({
	      ...mark,
	      start_offset: Math.max(0, Math.min(mark.start_offset - leading, trimmed.length)),
	      end_offset: Math.max(0, Math.min(mark.end_offset - leading, trimmed.length))
	    }))
	    .filter(mark => mark.end_offset > mark.start_offset);
	  return { content: trimmed, marks: clamped, annotations: [] }
	}
	function textValue(element, context) {
	  return trimValue(inlineFrom(element, context, false))
	}
	function pictureIn(element) {
	  if (element.tagName === "PICTURE") return element
	  return element.querySelector("picture")
	}
	function blockFrom(element, context) {
	  const directive = expansionDirective(element);
	  if (directive) {
	    return context.create({
	      type: "embed",
	      directive,
	      html: element.outerHTML
	    })
	  }
	  const tag = element.tagName;
	  if (tag === "P") {
	    const picture = pictureIn(element);
	    if (picture && !element.textContent.trim()) return imageFrom(picture, null, element, context)
	    return context.create({
	      type: "paragraph",
	      content: textValue(element, context)
	    })
	  }
	  if (HEADING_LEVELS[tag]) {
	    return context.create({
	      type: "heading",
	      level: HEADING_LEVELS[tag],
	      content: textValue(element, context)
	    })
	  }
	  if (tag === "UL" || tag === "OL") {
	    const items = [...element.children].map(child => {
	      if (child.tagName !== "LI") return null
	      return context.create({
	        type: "list_item",
	        content: textValue(child, context)
	      })
	    });
	    if (items.some(id => !id)) return null
	    return context.create({
	      type: "list",
	      ordered: tag === "OL",
	      items: { nodes: items, marks: [], annotations: [] }
	    })
	  }
	  if (tag === "ASIDE" && classList(element).includes("alert")) {
	    const variant = classList(element).find(name => name !== "alert");
	    const body = [...element.children]
	      .filter(child => child.tagName !== "H2")
	      .map(child => blockFrom(child, context));
	    if (body.some(id => !id)) return null
	    return context.create({
	      type: "alert",
	      variant: variant || "note",
	      body: { nodes: body, marks: [], annotations: [] }
	    })
	  }
	  if (tag === "BLOCKQUOTE") {
	    const body = [...element.children].map(child => blockFrom(child, context));
	    if (body.some(id => !id)) return null
	    return context.create({
	      type: "blockquote",
	      body: { nodes: body, marks: [], annotations: [] }
	    })
	  }
	  if (tag === "PRE") {
	    const code = element.querySelector("code");
	    const language = code
	      ? (classList(code).find(name => name.startsWith("language-")) || "").slice("language-".length)
	      : "";
	    return context.create({
	      type: "code_block",
	      language,
	      code: (code || element).textContent.replace(/\n+$/, "")
	    })
	  }
	  if (tag === "HR") {
	    return context.create({ type: "thematic_break" })
	  }
	  if (tag === "FIGURE") {
	    const picture = pictureIn(element);
	    const caption = element.querySelector("figcaption");
	    if (picture) return imageFrom(picture, caption, element, context)
	  }
	  if (tag === "PICTURE") {
	    return imageFrom(element, null, element, context)
	  }
	  context.unrecognised.push(tag.toLowerCase() + (element.className ? `.${element.className}` : ""));
	  return null
	}
	function imageFrom(picture, caption, outer, context) {
	  const img = picture.querySelector("img");
	  const source = picture.getAttribute("data-original");
	  if (!source) {
	    context.unrecognised.push("picture (no data-original)");
	    return null
	  }
	  return context.create({
	    type: "image",
	    source,
	    alt: img ? (img.getAttribute("alt") || "") : "",
	    caption: caption ? caption.textContent : "",
	    html: outer.outerHTML
	  })
	}
	function ingest(contentElement, generateId) {
	  const nodes = {};
	  const unrecognised = [];
	  const context = {
	    unrecognised,
	    create(node) {
	      const id = generateId();
	      nodes[id] = { ...node, id };
	      return id
	    },
	    createMark(type, element) {
	      const properties = type === "link"
	        ? { href: element.getAttribute("href") || "" }
	        : {};
	      return context.create({ type, ...properties })
	    }
	  };
	  const body = [...contentElement.children].map(child => blockFrom(child, context));
	  if (unrecognised.length) return { doc: null, unrecognised }
	  const pageId = generateId();
	  nodes[pageId] = {
	    id: pageId,
	    type: "page",
	    body: { nodes: body.filter(Boolean), marks: [], annotations: [] }
	  };
	  return { doc: { document_id: pageId, nodes }, unrecognised: [] }
	}

	var root$b = from_html(`<div class="page"><!></div>`);

	const $$css = {
		hash: 'svelte-xibch9',
		code: '.body-node-array {display:grid;grid-template-columns:1fr;--row: 0;}'
	};

	function Page($$anchor, $$props) {
		append_styles$1($$anchor, $$css);

		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {
				var div = root$b();
				var node = child(div);

				{
					let $0 = user_derived(() => [...$$props.path, 'body']);

					NodeArrayProperty(node, {
						class: 'body-node-array',
						get path() {
							return get$1($0);
						}
					});
				}
				append($$anchor, div);
			},
			$$slots: { default: true }
		});
	}

	function Paragraph($$anchor, $$props) {
		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {
				{
					let $0 = user_derived(() => [...$$props.path, "content"]);

					TextProperty($$anchor, {
						tag: 'p',
						get path() {
							return get$1($0);
						},
						placeholder: 'Paragraph'
					});
				}
			},
			$$slots: { default: true }
		});
	}

	function Heading($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));
		const tag = user_derived(() => `h${get$1(node).level || 2}`);

		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {
				{
					let $0 = user_derived(() => [...$$props.path, "content"]);

					TextProperty($$anchor, {
						get tag() {
							return get$1(tag);
						},

						get path() {
							return get$1($0);
						},
						placeholder: 'Heading'
					});
				}
			},
			$$slots: { default: true }
		});

		pop();
	}

	function List($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));
		const tag = user_derived(() => get$1(node).ordered ? "ol" : "ul");

		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {
				{
					let $0 = user_derived(() => [...$$props.path, "items"]);

					NodeArrayProperty($$anchor, {
						get tag() {
							return get$1(tag);
						},

						get path() {
							return get$1($0);
						}
					});
				}
			},
			$$slots: { default: true }
		});

		pop();
	}

	function ListItem($$anchor, $$props) {
		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {
				{
					let $0 = user_derived(() => [...$$props.path, "content"]);

					TextProperty($$anchor, {
						tag: 'li',
						get path() {
							return get$1($0);
						},
						placeholder: 'List item'
					});
				}
			},
			$$slots: { default: true }
		});
	}

	function Blockquote($$anchor, $$props) {
		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {
				{
					let $0 = user_derived(() => [...$$props.path, "body"]);

					NodeArrayProperty($$anchor, {
						tag: 'blockquote',
						get path() {
							return get$1($0);
						}
					});
				}
			},
			$$slots: { default: true }
		});
	}

	var root$a = from_html(`<aside><h2 contenteditable="false"> </h2> <!></aside>`);

	function Alert($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));
		const variant = user_derived(() => get$1(node).variant || "note");
		const label = user_derived(() => get$1(variant).charAt(0).toUpperCase() + get$1(variant).slice(1));

		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {
				var aside = root$a();
				var h2 = child(aside);
				var text = only_child(h2, true);
				var node_1 = sibling(h2, 2);

				{
					let $0 = user_derived(() => [...$$props.path, "body"]);

					NodeArrayProperty(node_1, {
						get path() {
							return get$1($0);
						}
					});
				}

				template_effect(() => {
					set_class(aside, 1, `alert ${get$1(variant) ?? ''}`);
					set_text(text, get$1(label));
				});

				append($$anchor, aside);
			},
			$$slots: { default: true }
		});

		pop();
	}

	var root$9 = from_html(`<code contenteditable="false"> </code>`);

	function CodeBlock($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));

		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {
				{
					let $0 = user_derived(() => [...$$props.path, "code"]);

					CustomProperty($$anchor, {
						tag: 'pre',
						get path() {
							return get$1($0);
						},

						children: ($$anchor, $$slotProps) => {
							var code = root$9();
							var text = only_child(code, true);

							template_effect(() => {
								set_class(code, 1, clsx(get$1(node).language ? `language-${get$1(node).language}` : ""));
								set_text(text, get$1(node).code);
							});

							append($$anchor, code);
						},
						$$slots: { default: true }
					});
				}
			},
			$$slots: { default: true }
		});

		pop();
	}

	var root$8 = from_html(`<hr contenteditable="false"/>`);

	function ThematicBreak($$anchor, $$props) {
		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {
				var hr = root$8();

				append($$anchor, hr);
			},
			$$slots: { default: true }
		});
	}

	var root$7 = from_html(`<div contenteditable="false"></div>`);

	function Image($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));

		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {
				{
					let $0 = user_derived(() => [...$$props.path, "source"]);

					CustomProperty($$anchor, {
						get path() {
							return get$1($0);
						},

						children: ($$anchor, $$slotProps) => {
							var div = root$7();

							html$1(div, () => get$1(node).html, true);
							append($$anchor, div);
						},
						$$slots: { default: true }
					});
				}
			},
			$$slots: { default: true }
		});

		pop();
	}

	var root$6 = from_html(`<div contenteditable="false" class="embed"></div>`);

	function Embed($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));

		Node$1($$anchor, {
			get path() {
				return $$props.path;
			},

			children: ($$anchor, $$slotProps) => {
				{
					let $0 = user_derived(() => [...$$props.path, "directive"]);

					CustomProperty($$anchor, {
						get path() {
							return get$1($0);
						},

						children: ($$anchor, $$slotProps) => {
							var div = root$6();

							html$1(div, () => get$1(node).html, true);
							template_effect(() => set_attribute(div, 'title', get$1(node).directive));
							append($$anchor, div);
						},
						$$slots: { default: true }
					});
				}
			},
			$$slots: { default: true }
		});

		pop();
	}

	var root$5 = from_html(`<strong> </strong>`);

	function Strong($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));
		var strong = root$5();
		var text = only_child(strong, true);

		template_effect(() => {
			set_attribute(strong, 'id', get$1(node).id);
			set_attribute(strong, 'data-node-id', get$1(node).id);
			set_text(text, $$props.content);
		});

		append($$anchor, strong);
		pop();
	}

	var root$4 = from_html(`<em> </em>`);

	function Emphasis($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));
		var em = root$4();
		var text = only_child(em, true);

		template_effect(() => {
			set_attribute(em, 'id', get$1(node).id);
			set_attribute(em, 'data-node-id', get$1(node).id);
			set_text(text, $$props.content);
		});

		append($$anchor, em);
		pop();
	}

	var root$3 = from_html(`<code> </code>`);

	function InlineCode($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));
		var code = root$3();
		var text = only_child(code, true);

		template_effect(() => {
			set_attribute(code, 'id', get$1(node).id);
			set_attribute(code, 'data-node-id', get$1(node).id);
			set_text(text, $$props.content);
		});

		append($$anchor, code);
		pop();
	}

	var root$2 = from_html(`<mark> </mark>`);

	function Highlight($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));
		var mark = root$2();
		var text = only_child(mark, true);

		template_effect(() => {
			set_attribute(mark, 'id', get$1(node).id);
			set_attribute(mark, 'data-node-id', get$1(node).id);
			set_text(text, $$props.content);
		});

		append($$anchor, mark);
		pop();
	}

	var root$1 = from_html(`<del> </del>`);

	function Strikethrough($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));
		var del = root$1();
		var text = only_child(del, true);

		template_effect(() => {
			set_attribute(del, 'id', get$1(node).id);
			set_attribute(del, 'data-node-id', get$1(node).id);
			set_text(text, $$props.content);
		});

		append($$anchor, del);
		pop();
	}

	var root = from_html(`<div class="link"> </div>`);
	var root_1 = from_html(`<a> </a>`);

	function Link($$anchor, $$props) {
		push($$props, true);

		const svedit = getContext("svedit");
		const node = user_derived(() => svedit.session.get($$props.path));
		var fragment = comment();
		var node_1 = first_child(fragment);

		{
			var consequent = ($$anchor) => {
				var div = root();
				var text = only_child(div, true);

				template_effect(() => {
					set_attribute(div, 'data-node-id', get$1(node).id);
					set_attribute(div, 'data-href', get$1(node).href);
					set_text(text, $$props.content);
				});

				append($$anchor, div);
			};

			var alternate = ($$anchor) => {
				var a = root_1();
				var text_1 = only_child(a, true);

				template_effect(() => {
					set_attribute(a, 'id', get$1(node).id);
					set_attribute(a, 'data-node-id', get$1(node).id);
					set_attribute(a, 'href', get$1(node).href);
					set_text(text_1, $$props.content);
				});

				append($$anchor, a);
			};

			if_block(node_1, ($$render) => {
				if (svedit.editable) $$render(consequent); else $$render(alternate, -1);
			});
		}

		append($$anchor, fragment);
		pop();
	}

	const INLINE_MARKS = ["strong", "emphasis", "inline_code", "highlight", "strikethrough", "link"];
	const BLOCK_TYPES = [
	  "paragraph",
	  "heading",
	  "list",
	  "blockquote",
	  "alert",
	  "code_block",
	  "thematic_break",
	  "image",
	  "embed"
	];
	const document_schema = define_document_schema({
	  page: {
	    kind: "document",
	    properties: {
	      body: {
	        type: "node_array",
	        node_types: BLOCK_TYPES,
	        default_node_type: "paragraph"
	      }
	    }
	  },
	  paragraph: {
	    kind: "text",
	    properties: {
	      content: { type: "text", mark_types: INLINE_MARKS, allow_newlines: true }
	    }
	  },
	  heading: {
	    kind: "text",
	    properties: {
	      content: { type: "text", mark_types: INLINE_MARKS, allow_newlines: false },
	      level: { type: "integer", min: 1, max: 6, default: 2 }
	    }
	  },
	  list: {
	    kind: "block",
	    properties: {
	      items: { type: "node_array", node_types: ["list_item"], default_node_type: "list_item" },
	      ordered: { type: "boolean", default: false }
	    }
	  },
	  list_item: {
	    kind: "text",
	    properties: {
	      content: { type: "text", mark_types: INLINE_MARKS, allow_newlines: false }
	    }
	  },
	  blockquote: {
	    kind: "block",
	    properties: {
	      body: { type: "node_array", node_types: BLOCK_TYPES, default_node_type: "paragraph" }
	    }
	  },
	  alert: {
	    kind: "block",
	    properties: {
	      variant: { type: "string", default: "note" },
	      body: { type: "node_array", node_types: BLOCK_TYPES, default_node_type: "paragraph" }
	    }
	  },
	  code_block: {
	    kind: "block",
	    properties: {
	      code: { type: "string", default: "" },
	      language: { type: "string", default: "" }
	    }
	  },
	  thematic_break: {
	    kind: "block",
	    properties: {}
	  },
	  image: {
	    kind: "block",
	    properties: {
	      source: { type: "string", default: "" },
	      alt: { type: "string", default: "" },
	      caption: { type: "string", default: "" },
	      html: { type: "string", default: "" }
	    }
	  },
	  embed: {
	    kind: "block",
	    properties: {
	      directive: { type: "string", default: "" },
	      html: { type: "string", default: "" }
	    }
	  },
	  strong: { kind: "mark", properties: {} },
	  emphasis: { kind: "mark", properties: {} },
	  inline_code: { kind: "mark", properties: {} },
	  highlight: { kind: "mark", properties: {} },
	  strikethrough: { kind: "mark", properties: {} },
	  link: { kind: "mark", properties: { href: { type: "string", default: "" } } }
	});
	function generate_id(length = 16) {
	  const id_alphabet = "abcdefghijklmnopqrstuvwxyz";
	  const random_values = crypto.getRandomValues(new Uint8Array(length));
	  return [...random_values].map(value => id_alphabet[value % id_alphabet.length]).join("")
	}
	const session_config = {
	  generate_id,
	  system_components: {
	    overlays: Overlays
	  },
	  node_components: {
	    page: Page,
	    paragraph: Paragraph,
	    heading: Heading,
	    list: List,
	    list_item: ListItem,
	    blockquote: Blockquote,
	    alert: Alert,
	    code_block: CodeBlock,
	    thematic_break: ThematicBreak,
	    image: Image,
	    embed: Embed,
	    strong: Strong,
	    emphasis: Emphasis,
	    inline_code: InlineCode,
	    highlight: Highlight,
	    strikethrough: Strikethrough,
	    link: Link
	  },
	  create_commands_and_keymap: (context) => {
	    const commands = {
	      select_all: new SelectAllCommand(context),
	      insert_default_node: new InsertDefaultNodeCommand(context),
	      add_new_line: new AddNewLineCommand(context),
	      break_text_node: new BreakTextNodeCommand(context),
	      undo: new UndoCommand(context),
	      redo: new RedoCommand(context),
	      select_parent: new SelectParentCommand(context),
	      toggle_strong: new ToggleMarkCommand("strong", context),
	      toggle_emphasis: new ToggleMarkCommand("emphasis", context),
	      toggle_inline_code: new ToggleMarkCommand("inline_code", context),
	      toggle_highlight: new ToggleMarkCommand("highlight", context),
	      toggle_strikethrough: new ToggleMarkCommand("strikethrough", context)
	    };
	    const keymap = define_keymap({
	      "meta+a,ctrl+a": [commands.select_all],
	      enter: [commands.break_text_node, commands.insert_default_node],
	      "shift+enter": [commands.add_new_line, commands.insert_default_node],
	      "meta+z,ctrl+z": [commands.undo],
	      "meta+shift+z,ctrl+shift+z": [commands.redo],
	      escape: [commands.select_parent],
	      "meta+b,ctrl+b": [commands.toggle_strong],
	      "meta+i,ctrl+i": [commands.toggle_emphasis]
	    });
	    return { commands, keymap }
	  },
	  inserters: {
	    paragraph: function (tr, content = { content: "", marks: [], annotations: [] }) {
	      const new_paragraph = {
	        id: session_config.generate_id(),
	        type: "paragraph",
	        content
	      };
	      tr.create(new_paragraph);
	      tr.insert_nodes([new_paragraph.id]);
	      tr.set_selection({
	        type: "text",
	        path: [...tr.selection.path, tr.selection.focus_offset - 1, "content"],
	        anchor_offset: 0,
	        focus_offset: 0
	      });
	    }
	  }
	};
	function create_session(element) {
	  const { doc, unrecognised } = ingest(element, generate_id);
	  if (!doc) return { session: null, unrecognised }
	  const filled = fill_document_defaults(doc, document_schema);
	  return { session: new Session(document_schema, filled, session_config), unrecognised: [] }
	}

	function scalarFrom(element) {
	  const text = element.textContent.trim();
	  if (text === "true") return true
	  if (text === "false") return false
	  if (text === "null") return null
	  if (text && !Number.isNaN(Number(text))) return Number(text)
	  return text
	}
	function dateFrom(element) {
	  const datetime = element.getAttribute("datetime");
	  if (!datetime) return element.textContent.trim()
	  if (datetime.endsWith("T00:00:00.000Z")) return datetime.slice(0, "0000-00-00".length)
	  return datetime
	}
	function valueFrom(element) {
	  const list = element.querySelector(":scope > ul");
	  if (list) return [...list.children].map(item => valueFrom(item))
	  const nested = element.querySelector(":scope > dl");
	  if (nested) return objectFrom(nested)
	  const time = element.querySelector(":scope > time");
	  if (time) return dateFrom(time)
	  const link = element.querySelector(":scope > a[href]");
	  if (link) return link.getAttribute("href")
	  return scalarFrom(element)
	}
	function objectFrom(list) {
	  const terms = [...list.children];
	  return terms.reduce((accumulated, node, index) => {
	    if (node.tagName !== "DT") return accumulated
	    const value = terms[index + 1];
	    if (!value || value.tagName !== "DD") return accumulated
	    return { ...accumulated, [node.textContent.trim()]: valueFrom(value) }
	  }, {})
	}
	function readFrontmatter(main) {
	  const children = [...main.children];
	  const heading = children.find(child => child.tagName === "H1");
	  const date = children.find(child => child.matches('time[itemprop="date"]'));
	  const image = children.find(child => child.matches('picture[itemprop="image"]'));
	  const description = children.find(child => child.matches('p[itemprop="description"]'));
	  const known = {
	    ...(date ? { date: dateFrom(date) } : {}),
	    ...(image ? { image: image.getAttribute("data-original") } : {}),
	    ...(description ? { description: description.textContent.trim() } : {})
	  };
	  const generic = children
	    .filter(child => child.tagName === "DL")
	    .reduce((accumulated, list) => ({ ...accumulated, ...objectFrom(list) }), {});
	  return {
	    title: heading ? heading.textContent.trim() : null,
	    properties: { ...known, ...generic }
	  }
	}

	function openSocket() {
	  console.info("Socket opened");
	  const socket = new WebSocket(`ws://${window.location.host}`);
	  socket.addEventListener('open', () => {
	    socket.send('opened');
	  });
	  socket.addEventListener("close", () => {
	    console.info("Socket closed");
	    socket.close();
	    setTimeout(() => {
	      console.info("socket closed refresh");
	      location.reload();
	    }, 1000);
	  });
	  function isOpen() {
	    return socket.readyState === 1
	  }
	  socket.addEventListener('message', e => {
	    if (!isOpen()) return
	    const target = JSON.parse(e.data);
	    if (target.extension !== ".html") return
	    const regex = new RegExp(window.location.pathname + "(index)?(\\.html)");
	    if (!("/" + target.path).match(regex)) return
	    updateFromTarget(target);
	    if (!target.data) {
	      location.reload();
	      return
	    }
	    const next = new DOMParser().parseFromString(target.data, "text/html");
	    patchHead(document.head, next.head);
	    patchBody(document.body, next.body);
	  });
	}
	function patchHead(head, nextHead) {
	  const nextTitle = nextHead.querySelector("title");
	  if (nextTitle && document.title !== nextTitle.textContent) document.title = nextTitle.textContent;
	  const isTitle = element => element.tagName === "TITLE";
	  const remaining = new Map();
	  for (const element of head.children) {
	    if (isTitle(element)) continue
	    const key = element.outerHTML;
	    if (!remaining.has(key)) remaining.set(key, []);
	    remaining.get(key).push(element);
	  }
	  const keep = new Set();
	  const pending = [];
	  const place = (clone, before) => {
	    before ? head.insertBefore(clone, before) : head.appendChild(clone);
	    keep.add(clone);
	  };
	  for (const element of nextHead.children) {
	    if (isTitle(element)) continue
	    const matches = remaining.get(element.outerHTML);
	    const existing = matches && matches.shift();
	    if (existing) {
	      pending.forEach(clone => place(clone, existing));
	      pending.length = 0;
	      keep.add(existing);
	      continue
	    }
	    pending.push(document.importNode(element, true));
	  }
	  pending.forEach(clone => place(clone, null));
	  for (const element of [...head.children]) {
	    if (isTitle(element) || keep.has(element)) continue
	    element.remove();
	  }
	}
	function patchBody(body, nextBody) {
	  const editing = document.documentElement.dataset.vowelEditing === "true";
	  const keyOf = element => element.id ? `${element.tagName}#${element.id}` : element.tagName;
	  const incoming = [...nextBody.children].filter(wasProduced);
	  const produced = new Set(incoming.map(keyOf));
	  const current = new Map();
	  for (const element of body.children) {
	    if (!wasProduced(element)) continue
	    const key = keyOf(element);
	    if (produced.has(key) && !current.has(key)) current.set(key, element);
	  }
	  const placed = new Set();
	  let cursor = null;
	  for (const element of incoming) {
	    const key = keyOf(element);
	    const existing = current.get(key);
	    if (existing && editing && existing.tagName === "MAIN") {
	      placed.add(existing);
	      cursor = existing;
	      continue
	    }
	    const fresh = document.importNode(element, true);
	    if (existing) {
	      existing.replaceWith(fresh);
	    } else if (cursor) {
	      cursor.after(fresh);
	    } else {
	      body.prepend(fresh);
	    }
	    placed.add(fresh);
	    cursor = fresh;
	  }
	  for (const [, element] of current) {
	    if (!placed.has(element) && element.isConnected) element.remove();
	  }
	  for (const element of [...body.children]) {
	    if (!produced.has(keyOf(element)) && wasProduced(element)) element.remove();
	  }
	}
	function wasProduced(element) {
	  if (element.tagName === "SCRIPT") return false
	  if (element.hasAttribute("data-vowel-client")) return false
	  return ["HEADER", "MAIN", "ASIDE", "FOOTER", "NAV"].includes(element.tagName) || Boolean(element.id)
	}

	openSocket();
	const content = document.getElementById("content");
	const noFrontmatter = { title: null, properties: {} };
	function startEditing() {
	  const { session, unrecognised } = create_session(content);
	  if (!session) {
	    console.warn(
	      "[vowel] editor stayed read-only: #content holds elements the ingest allowlist " +
	      "does not recognise:", unrecognised
	    );
	    return unrecognised
	  }
	  const main = content.closest("main");
	  const frontmatter = main ? readFrontmatter(main) : noFrontmatter;
	  content.replaceChildren();
	  mount(Editor, { target: content, props: { session, frontmatter } });
	  document.documentElement.dataset.vowelEditing = "true";
	  return []
	}
	const settings = { panel: null };
	function closeSettings() {
	  if (!settings.panel) return
	  unmount(settings.panel);
	  settings.panel = null;
	}
	function toggleSettings() {
	  if (settings.panel) return closeSettings()
	  settings.panel = mount(SettingsPanel, {
	    target: document.body,
	    props: { onclose: closeSettings }
	  });
	}
	if (content) {
	  mount(EditButton, {
	    target: document.body,
	    props: { onedit: startEditing, onsettings: toggleSettings }
	  });
	}

})();
