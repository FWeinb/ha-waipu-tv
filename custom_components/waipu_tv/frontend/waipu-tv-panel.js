import { n as e } from "./rolldown-runtime-CYdcPHCu.js";
// node_modules/@lit/reactive-element/css-tag.js
var t = globalThis, n = t.ShadowRoot && (t.ShadyCSS === void 0 || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, r = Symbol(), i = /* @__PURE__ */ new WeakMap(), a = class {
	constructor(e, t, n) {
		if (this._$cssResult$ = !0, n !== r) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, t = this.t;
		if (n && e === void 0) {
			let n = t !== void 0 && t.length === 1;
			n && (e = i.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), n && i.set(t, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, o = (e) => new a(typeof e == "string" ? e : e + "", void 0, r), s = (e, ...t) => new a(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, r), c = (e, r) => {
	if (n) e.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let n of r) {
		let r = document.createElement("style"), i = t.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = n.cssText, e.appendChild(r);
	}
}, l = n ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return o(t);
})(e) : e, { is: u, defineProperty: d, getOwnPropertyDescriptor: f, getOwnPropertyNames: p, getOwnPropertySymbols: ee, getPrototypeOf: te } = Object, m = globalThis, ne = m.trustedTypes, re = ne ? ne.emptyScript : "", ie = m.reactiveElementPolyfillSupport, h = (e, t) => e, g = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? re : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, ae = (e, t) => !u(e, t), oe = {
	attribute: !0,
	type: String,
	converter: g,
	reflect: !1,
	useDefault: !1,
	hasChanged: ae
};
Symbol.metadata ??= Symbol("metadata"), m.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var _ = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = oe) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && d(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = f(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? oe;
	}
	static _$Ei() {
		if (this.hasOwnProperty(h("elementProperties"))) return;
		let e = te(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(h("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(h("properties"))) {
			let e = this.properties, t = [...p(e), ...ee(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(l(e));
		} else e !== void 0 && t.push(l(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return c(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? g : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? g : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? ae)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
_.elementStyles = [], _.shadowRootOptions = { mode: "open" }, _[h("elementProperties")] = /* @__PURE__ */ new Map(), _[h("finalized")] = /* @__PURE__ */ new Map(), ie?.({ ReactiveElement: _ }), (m.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var v = globalThis, se = (e) => e, y = v.trustedTypes, ce = y ? y.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, le = "$lit$", b = `lit$${Math.random().toFixed(9).slice(2)}$`, ue = "?" + b, de = `<${ue}>`, x = document, S = () => x.createComment(""), C = (e) => e === null || typeof e != "object" && typeof e != "function", w = Array.isArray, fe = (e) => w(e) || typeof e?.[Symbol.iterator] == "function", pe = "[ 	\n\f\r]", T = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, me = /-->/g, he = />/g, E = RegExp(`>|${pe}(?:([^\\s"'>=/]+)(${pe}*=${pe}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ge = /'/g, _e = /"/g, ve = /^(?:script|style|textarea|title)$/i, ye = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), D = ye(1), O = ye(2), k = Symbol.for("lit-noChange"), A = Symbol.for("lit-nothing"), be = /* @__PURE__ */ new WeakMap(), j = x.createTreeWalker(x, 129);
function xe(e, t) {
	if (!w(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return ce === void 0 ? t : ce.createHTML(t);
}
var Se = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = T;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === T ? c[1] === "!--" ? o = me : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = E) : (ve.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = E) : o = he : o === E ? c[0] === ">" ? (o = i ?? T, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? E : c[3] === "\"" ? _e : ge) : o === _e || o === ge ? o = E : o === me || o === he ? o = T : (o = E, i = void 0);
		let d = o === E && e[t + 1].startsWith("/>") ? " " : "";
		a += o === T ? n + de : l >= 0 ? (r.push(s), n.slice(0, l) + le + n.slice(l) + b + d) : n + b + (l === -2 ? t : d);
	}
	return [xe(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, Ce = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = Se(t, n);
		if (this.el = e.createElement(l, r), j.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = j.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(le)) {
					let t = u[o++], n = i.getAttribute(e).split(b), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Ee : r[1] === "?" ? De : r[1] === "@" ? Oe : N
					}), i.removeAttribute(e);
				} else e.startsWith(b) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (ve.test(i.tagName)) {
					let e = i.textContent.split(b), t = e.length - 1;
					if (t > 0) {
						i.textContent = y ? y.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], S()), j.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], S());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === ue) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(b, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += b.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = x.createElement("template");
		return n.innerHTML = e, n;
	}
};
function M(e, t, n = e, r) {
	if (t === k) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = C(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = M(e, i._$AS(e, t.values), i, r)), t;
}
var we = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? x).importNode(t, !0);
		j.currentNode = r;
		let i = j.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Te(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new ke(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = j.nextNode(), a++);
		}
		return j.currentNode = x, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, Te = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = M(this, e, t), C(e) ? e === A || e == null || e === "" ? (this._$AH !== A && this._$AR(), this._$AH = A) : e !== this._$AH && e !== k && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? fe(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== A && C(this._$AH) ? this._$AA.nextSibling.data = e : this.T(x.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = Ce.createElement(xe(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new we(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = be.get(e.strings);
		return t === void 0 && be.set(e.strings, t = new Ce(e)), t;
	}
	k(t) {
		w(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(S()), this.O(S()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = se(e).nextSibling;
			se(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, N = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = A, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = A;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = M(this, e, t, 0), a = !C(e) || e !== this._$AH && e !== k, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = M(this, r[n + o], t, o), s === k && (s = this._$AH[o]), a ||= !C(s) || s !== this._$AH[o], s === A ? e = A : e !== A && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Ee = class extends N {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === A ? void 0 : e;
	}
}, De = class extends N {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== A);
	}
}, Oe = class extends N {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = M(this, e, t, 0) ?? A) === k) return;
		let n = this._$AH, r = e === A && n !== A || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== A && (n === A || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, ke = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		M(this, e);
	}
}, Ae = v.litHtmlPolyfillSupport;
Ae?.(Ce, Te), (v.litHtmlVersions ??= []).push("3.3.3");
var je = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Te(t.insertBefore(S(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Me = globalThis, P = class extends _ {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = je(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return k;
	}
};
P._$litElement$ = !0, P.finalized = !0, Me.litElementHydrateSupport?.({ LitElement: P });
var Ne = Me.litElementPolyfillSupport;
Ne?.({ LitElement: P }), (Me.litElementVersions ??= []).push("4.2.2");
// src/api.ts
var F = (e, t, n = {}) => e.callWS({
	type: `waipu_tv/${t}`,
	...n
}), Pe = (e) => F(e, "channels"), I = (e, t, n, r) => F(e, "guide", {
	start: t.toISOString(),
	end: n.toISOString(),
	...r ? { channels: r } : {}
}), Fe = (e, t) => F(e, "program", { program_id: t }), Ie = (e) => F(e, "recordings"), Le = (e) => F(e, "playlists"), L = (e, t, n = !1) => F(e, "record", {
	program_id: t,
	series: n
}), Re = (e, t) => F(e, "cancel_series", { program_id: t }), R = (e, t) => F(e, "delete_recordings", { recording_ids: t }), ze = (e, t, n) => F(e, "set_favorite", {
	channel: t,
	favorite: n
}), Be = (e, t, n, r, i) => e.connection.subscribeMessage((e) => e.url ? r(e.url) : i(), {
	type: "waipu_tv/stream",
	protocol: n,
	...t
}), Ve = (e, t, n) => F(e, "license", {
	system: t,
	challenge: n
}), He = (e) => F(e, "fairplay_certificate"), Ue = "waipu_tv", We = (e) => e.callWS({
	type: "frontend/get_user_data",
	key: Ue
}).then((e) => e.value ?? {}), Ge = (e, t) => e.callWS({
	type: "frontend/set_user_data",
	key: Ue,
	value: t
}), Ke = {
	guide: "Guide",
	favorites: "Favorites",
	recordings: "Recordings",
	playlists: "Playlists",
	refresh: "Refresh channels, guide and recordings",
	refreshing: "Reloading from waipu.tv…",
	today: "Today",
	tv_guide: "TV guide",
	all_channels: "All channels",
	now: "Now",
	search_programs: "Search programs",
	live: "Live",
	rec: "REC",
	scheduled: "Scheduled",
	legend_live: "running now",
	legend_rec: "recording",
	legend_sched: "will be recorded",
	legend_hint: "Select a program for details, recording and series recording.",
	no_favorites: "No favorites yet: star channels in the Watch tab.",
	loading: "Loading…",
	record: "Record",
	record_series: "Record series",
	cancel_recording: "Cancel recording",
	delete: "Delete",
	close: "Close",
	add_favorite: "Add channel to favorites",
	remove_favorite: "Remove channel from favorites",
	not_recordable: "This program can't be recorded.",
	ended: "Ended",
	recorded: "Recorded",
	recording_now: "Recording now",
	recording_started: "Recording scheduled: {title}",
	series_started: "Series recording set up: {title}",
	recording_cancelled: "Recording cancelled",
	favorites_note: "Synced with your waipu.tv account, so changes show up in the waipu.tv apps too. Sorted by channel number.",
	all: "All",
	on_demand: "On demand",
	hidden: "Hidden",
	filter_channels: "Filter channels",
	favorite_added: "{name} added to favorites",
	favorite_removed: "{name} removed from favorites",
	storage_used: "Storage used",
	of_hours: "of {hours} h",
	search_recordings: "Search recordings",
	selected: "{count} selected",
	delete_selected: "Delete selected",
	clear_selection: "Clear selection",
	confirm_delete: "Delete {count} recordings? Scheduled ones are cancelled.",
	deleted: "{count} recordings deleted",
	stop_series: "Stop series",
	confirm_stop_series: "Stop recording {title}? Scheduled episodes are cancelled, recorded ones are kept.",
	series_stopped: "{title}: series recording stopped",
	title: "Title",
	channel: "Channel",
	date: "Date",
	length: "Length",
	status: "Status",
	episodes: "{count} episodes",
	no_recordings: "No recordings.",
	playlist_server: "Playlist server",
	admins_only: "Admins only",
	running: "Running",
	off: "Off",
	playlists_off: "The playlist server is off. Turn it on in the integration options.",
	open_options: "Open integration options",
	copy: "Copy",
	copied: "Copied",
	copy_failed: "Copy not available here: select the URL instead",
	playlists_note: "For IPTV players like Kodi or TiviMate. The URLs contain your access key: anyone with them can watch on your waipu.tv account. A new key (in the options) locks out old links.",
	url_all: "All channels",
	url_favorites: "Favorites",
	url_live: "Live TV only",
	url_vod: "On-demand channels",
	url_recordings: "Recordings",
	url_epg: "XMLTV guide",
	options_title: "Playlist options",
	options_intro: "Add these to a playlist URL to change what it contains, e.g. …/favorites.m3u?key=…&drm=0. Each playlist's guide link (url-tvg) follows the same channel selection.",
	parameter: "Parameter",
	values: "Values",
	default: "Default",
	applies_to: "Applies to",
	meaning: "Meaning",
	m3u_playlists: "Channel playlists",
	on: "on",
	off_value: "off",
	from_options: "{value} (options)",
	param_hidden: "Include channels hidden in your waipu.tv channel list.",
	param_drm: "0: only channels without DRM (HLS), for players without Widevine.",
	param_protocol: "auto: HLS for channels pvr.waipu plays without DRM, DASH + Widevine for all others. Recordings: dash or hls.",
	param_timeshift: "Live channels open at the start of the running program so you can rewind.",
	param_hls_proxy: "Serve HLS playlists through Home Assistant, for ffmpeg-based players (VLC, Jellyfin).",
	param_filter: "Channel selection of the guide: all, favorites, live or vod.",
	needs_restart: "Needs instant restart, which your waipu.tv package doesn't include.",
	error: "waipu.tv: {message}",
	watch: "Watch",
	watch_name: "Watch {name}",
	play_recording: "Play recording",
	from_start: "From start",
	back: "Back",
	prev_channel: "Previous channel",
	next_channel: "Next channel",
	no_guide: "No guide data",
	recording_from: "Recording from {date}",
	drm_https_title: "{name} is protected by DRM, which browsers only play over HTTPS",
	drm_https_text: "Open Home Assistant over HTTPS, for example through Home Assistant Cloud, to watch it here. Channels without DRM, such as Das Erste or ZDF, also play over HTTP. IPTV players are not affected.",
	drm_unsupported_title: "This browser can't play {name}",
	drm_unsupported_text: "It supports neither Widevine nor FairPlay. Channels without DRM, such as Das Erste or ZDF, play here.",
	playback_error: "Playback failed: {message}",
	pip: "Picture in picture",
	fullscreen: "Full screen",
	position: "Position",
	play: "Play",
	pause: "Pause",
	mute: "Mute",
	unmute: "Unmute",
	volume: "Volume",
	subtitles: "Subtitles",
	audio_track: "Audio track",
	behind_live: "{minutes} min behind live",
	program_details: "Program details",
	delete_recording: "Delete recording",
	list_vod: "VOD",
	needs_https: "Needs HTTPS",
	no_favorites_watch: "No favorites yet: star channels under All or VOD, or the one you're watching.",
	no_channels_match: "No channels match."
}, qe = {
	guide: "Programm",
	favorites: "Favoriten",
	recordings: "Aufnahmen",
	playlists: "Playlists",
	refresh: "Sender, Programm und Aufnahmen neu laden",
	refreshing: "Wird von waipu.tv neu geladen…",
	today: "Heute",
	tv_guide: "TV-Programm",
	all_channels: "Alle Sender",
	now: "Jetzt",
	search_programs: "Sendungen suchen",
	live: "Live",
	rec: "REC",
	scheduled: "Geplant",
	legend_live: "läuft gerade",
	legend_rec: "wird aufgenommen",
	legend_sched: "Aufnahme geplant",
	legend_hint: "Wähle eine Sendung für Details, Aufnahme und Serienaufnahme.",
	no_favorites: "Noch keine Favoriten: markiere Sender im Tab Ansehen mit dem Stern.",
	loading: "Wird geladen…",
	record: "Aufnehmen",
	record_series: "Serie aufnehmen",
	cancel_recording: "Aufnahme abbrechen",
	delete: "Löschen",
	close: "Schließen",
	add_favorite: "Sender zu Favoriten hinzufügen",
	remove_favorite: "Sender aus Favoriten entfernen",
	not_recordable: "Diese Sendung kann nicht aufgenommen werden.",
	ended: "Beendet",
	recorded: "Aufgenommen",
	recording_now: "Nimmt gerade auf",
	recording_started: "Aufnahme geplant: {title}",
	series_started: "Serienaufnahme eingerichtet: {title}",
	recording_cancelled: "Aufnahme abgebrochen",
	favorites_note: "Mit deinem waipu.tv-Konto synchronisiert, Änderungen erscheinen auch in den waipu.tv-Apps. Nach Sendernummer sortiert.",
	all: "Alle",
	on_demand: "On-Demand",
	hidden: "Ausgeblendet",
	filter_channels: "Sender filtern",
	favorite_added: "{name} zu Favoriten hinzugefügt",
	favorite_removed: "{name} aus Favoriten entfernt",
	storage_used: "Speicher belegt",
	of_hours: "von {hours} h",
	search_recordings: "Aufnahmen suchen",
	selected: "{count} ausgewählt",
	delete_selected: "Auswahl löschen",
	clear_selection: "Auswahl aufheben",
	confirm_delete: "{count} Aufnahmen löschen? Geplante werden abgebrochen.",
	deleted: "{count} Aufnahmen gelöscht",
	stop_series: "Serie beenden",
	confirm_stop_series: "Aufnahme von {title} beenden? Geplante Folgen werden abgebrochen, aufgenommene bleiben erhalten.",
	series_stopped: "{title}: Serienaufnahme beendet",
	title: "Titel",
	channel: "Sender",
	date: "Datum",
	length: "Länge",
	status: "Status",
	episodes: "{count} Folgen",
	no_recordings: "Keine Aufnahmen.",
	playlist_server: "Playlist-Server",
	admins_only: "Nur Admins",
	running: "Aktiv",
	off: "Aus",
	playlists_off: "Der Playlist-Server ist aus. Schalte ihn in den Optionen der Integration ein.",
	open_options: "Optionen der Integration öffnen",
	copy: "Kopieren",
	copied: "Kopiert",
	copy_failed: "Kopieren nicht möglich: markiere die URL stattdessen",
	playlists_note: "Für IPTV-Player wie Kodi oder TiviMate. Die URLs enthalten deinen Zugangsschlüssel: Jeder damit kann über dein waipu.tv-Konto schauen. Ein neuer Schlüssel (in den Optionen) sperrt alte Links.",
	url_all: "Alle Sender",
	url_favorites: "Favoriten",
	url_live: "Nur Live-TV",
	url_vod: "On-Demand-Sender",
	url_recordings: "Aufnahmen",
	url_epg: "XMLTV-Programm",
	options_title: "Playlist-Optionen",
	options_intro: "Hänge sie an eine Playlist-URL an, um den Inhalt zu ändern, z. B. …/favorites.m3u?key=…&drm=0. Der Programm-Link jeder Playlist (url-tvg) folgt derselben Senderauswahl.",
	parameter: "Parameter",
	values: "Werte",
	default: "Standard",
	applies_to: "Gilt für",
	meaning: "Bedeutung",
	m3u_playlists: "Sender-Playlists",
	on: "an",
	off_value: "aus",
	from_options: "{value} (Optionen)",
	param_hidden: "Auch Sender, die in deiner waipu.tv-Senderliste ausgeblendet sind.",
	param_drm: "0: nur Sender ohne DRM (HLS), für Player ohne Widevine.",
	param_protocol: "auto: HLS für Sender, die pvr.waipu ohne DRM abspielt, DASH + Widevine für alle anderen. Aufnahmen: dash oder hls.",
	param_timeshift: "Live-Sender starten am Beginn der laufenden Sendung, sodass du zurückspulen kannst.",
	param_hls_proxy: "HLS-Playlists über Home Assistant ausliefern, für ffmpeg-basierte Player (VLC, Jellyfin).",
	param_filter: "Senderauswahl des Programms: all, favorites, live oder vod.",
	needs_restart: "Benötigt Instant Restart, das dein waipu.tv-Paket nicht enthält.",
	error: "waipu.tv: {message}",
	watch: "Ansehen",
	watch_name: "{name} ansehen",
	play_recording: "Aufnahme abspielen",
	from_start: "Von Anfang",
	back: "Zurück",
	prev_channel: "Vorheriger Sender",
	next_channel: "Nächster Sender",
	no_guide: "Keine Programmdaten",
	recording_from: "Aufnahme vom {date}",
	drm_https_title: "{name} ist mit DRM geschützt; Browser spielen das nur über HTTPS ab",
	drm_https_text: "Öffne Home Assistant über HTTPS, zum Beispiel über Home Assistant Cloud, um den Sender hier zu sehen. Sender ohne DRM wie Das Erste oder ZDF laufen auch über HTTP. IPTV-Player sind nicht betroffen.",
	drm_unsupported_title: "Dieser Browser kann {name} nicht abspielen",
	drm_unsupported_text: "Er unterstützt weder Widevine noch FairPlay. Sender ohne DRM wie Das Erste oder ZDF laufen hier.",
	playback_error: "Wiedergabe fehlgeschlagen: {message}",
	pip: "Bild-in-Bild",
	fullscreen: "Vollbild",
	position: "Position",
	play: "Abspielen",
	pause: "Pause",
	mute: "Ton aus",
	unmute: "Ton an",
	volume: "Lautstärke",
	subtitles: "Untertitel",
	audio_track: "Tonspur",
	behind_live: "{minutes} Min. hinter live",
	program_details: "Sendungsdetails",
	delete_recording: "Aufnahme löschen",
	list_vod: "VOD",
	needs_https: "Braucht HTTPS",
	no_favorites_watch: "Noch keine Favoriten: markiere Sender unter Alle oder VOD mit dem Stern, oder den, den du gerade siehst.",
	no_channels_match: "Keine passenden Sender."
};
function z(e, t, n = {}) {
	return (e.language?.startsWith("de") ? qe : Ke)[t].replace(/\{(\w+)\}/g, (e, t) => String(n[t] ?? ""));
}
function B(e, t) {
	return new Intl.DateTimeFormat(e.language, {
		timeZone: e.config.time_zone,
		...t
	});
}
// src/icons.ts
var V = (e, t = 20) => O`<svg class="i" viewBox="0 0 24 24" style="width:${t}px;height:${t}px" aria-hidden="true">${e}</svg>`, Je = () => V(O`<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>`), H = (e = 20) => V(O`<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>`, e), U = () => V(O`<circle cx="11" cy="11" r="6"/><path d="m20 20-4.3-4.3"/>`), Ye = () => V(O`<path d="M6 6l12 12M18 6 6 18"/>`), W = () => V(O`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>`), Xe = () => V(O`<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>`), Ze = () => V(O`<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>`), Qe = () => O`<svg class="i" viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor;stroke:none" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>`, $e = () => V(O`<path d="M15 6l-6 6 6 6"/>`), et = () => V(O`<path d="M6 15l6-6 6 6"/>`), tt = () => V(O`<path d="M6 9l6 6 6-6"/>`), nt = (e = 16) => V(O`<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v5h5"/>`, e), rt = () => O`<svg class="i" viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor;stroke:none" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>`, it = () => V(O`<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="11" width="7" height="6" rx="1" fill="currentColor"/>`), at = () => V(O`<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>`), ot = () => V(O`<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 10.5a2 2 0 1 0 0 3M16 10.5a2 2 0 1 0 0 3"/>`), st = () => V(O`<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>`), ct = () => V(O`<path d="M4 10v4h4l5 4V6L8 10z"/><path d="m17 10 4 4M21 10l-4 4"/>`), lt = () => V(O`<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`, 14), G = (e = 14) => O`<svg class="i" viewBox="0 0 24 24" style="width:${e}px;height:${e}px;fill:currentColor;stroke:none" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>`, K = s`
  :host {
    --wt-card: var(--card-background-color, #fff);
    --wt-fg: var(--primary-text-color, #212121);
    --wt-muted: var(--secondary-text-color, #616161);
    --wt-line: var(--divider-color, #e0e0e0);
    --wt-chip: var(--secondary-background-color, #f1f3f4);
    --wt-primary: var(--primary-color, #0277bd);
    --wt-on-primary: var(--text-primary-color, #fff);
    --wt-primary-soft: rgba(var(--rgb-primary-color, 2, 119, 189), 0.14);
    --wt-rec: var(--error-color, #c62828);
    --wt-rec-soft: rgba(var(--rgb-error-color, 198, 40, 40), 0.14);
    --wt-sched: var(--warning-color, #b45309);
    --wt-sched-soft: rgba(var(--rgb-warning-color, 180, 83, 9), 0.14);
    --wt-fav: var(--state-icon-active-color, #b7791f);
    color: var(--wt-fg);
  }
  * {
    box-sizing: border-box;
  }
  [hidden] {
    display: none !important;
  }
  button,
  input {
    font: inherit;
    color: inherit;
  }
  svg.i {
    width: 20px;
    height: 20px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .muted {
    color: var(--wt-muted);
  }
  .mono {
    font-family: var(--code-font-family, ui-monospace, monospace);
    font-size: 12.5px;
  }
  .content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1600px;
  }
  .card {
    background: var(--wt-card);
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, none);
    border: 1px solid var(--wt-line);
  }
  .card-h {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 16px 8px;
    flex-wrap: wrap;
  }
  .card-h h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    flex: 1;
    min-width: 12em;
  }
  .card-b {
    padding: 8px 16px 16px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--wt-line);
    border-radius: 999px;
    overflow: hidden;
  }
  .seg button {
    border: 0;
    background: none;
    padding: 0 14px;
    height: 36px;
    cursor: pointer;
  }
  .seg button + button {
    border-left: 1px solid var(--wt-line);
  }
  .seg button[aria-pressed="true"] {
    background: var(--wt-primary-soft);
    color: var(--wt-primary);
    font-weight: 500;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 16px;
    border-radius: 18px;
    border: 1px solid var(--wt-line);
    background: var(--wt-card);
    cursor: pointer;
    font-weight: 500;
    text-decoration: none;
    color: var(--wt-fg);
  }
  .btn:hover {
    background: var(--wt-chip);
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .btn.primary {
    background: var(--wt-primary);
    color: var(--wt-on-primary);
    border-color: var(--wt-primary);
  }
  .btn.danger {
    color: var(--wt-rec);
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
    border-radius: 18px;
    border: 1px solid var(--wt-line);
    background: var(--wt-card);
    min-width: 0;
    flex: 0 1 260px;
  }
  .search input {
    border: 0;
    outline: 0;
    background: none;
    min-width: 0;
    flex: 1;
  }
  .search:focus-within {
    border-color: var(--wt-primary);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    border-radius: 14px;
    background: var(--wt-chip);
    font-size: 12.5px;
    white-space: nowrap;
  }
  .chip.rec {
    background: var(--wt-rec-soft);
    color: var(--wt-rec);
    font-weight: 500;
  }
  .chip.sched {
    background: var(--wt-sched-soft);
    color: var(--wt-sched);
    font-weight: 500;
  }
  .chip.live {
    background: var(--wt-primary-soft);
    color: var(--wt-primary);
    font-weight: 500;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    display: inline-block;
  }
  .star-btn {
    width: 36px;
    height: 36px;
    border: 0;
    background: none;
    border-radius: 50%;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--wt-muted);
    flex: none;
  }
  .star-btn:hover {
    background: var(--wt-chip);
  }
  .star-btn[aria-pressed="true"] {
    color: var(--wt-fav);
  }
  .star-btn[aria-pressed="true"] svg {
    fill: currentColor;
  }
  .play-btn {
    width: 36px;
    height: 36px;
    border: 0;
    background: none;
    border-radius: 50%;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--wt-primary);
    flex: none;
  }
  .play-btn:hover {
    background: var(--wt-primary-soft);
  }
  .logo {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    flex: none;
    object-fit: contain;
    /* waipu.tv's logos are white on transparent, so the tile stays dark in both themes */
    background: #2b2f36;
  }
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--wt-primary);
  }
  @media (max-width: 640px) {
    .content {
      padding: 12px;
    }
  }
`;
// src/util.ts
function q(e, t) {
	e.dispatchEvent(new CustomEvent("waipu-changed", {
		detail: { what: t },
		bubbles: !0,
		composed: !0
	}));
}
function J(e, t) {
	e.dispatchEvent(new CustomEvent("waipu-toast", {
		detail: { message: t },
		bubbles: !0,
		composed: !0
	}));
}
async function Y(e, t, n) {
	try {
		return await n(), !0;
	} catch (n) {
		return J(e, z(t, "error", { message: n?.message ?? String(n) })), !1;
	}
}
function X(e, t) {
	e.dispatchEvent(new CustomEvent("waipu-watch", {
		detail: { target: t },
		bubbles: !0,
		composed: !0
	}));
}
// src/program-dialog.ts
var ut = class extends P {
	static {
		this.properties = {
			hass: { attribute: !1 },
			program: { attribute: !1 },
			channel: { attribute: !1 },
			recording: { attribute: !1 },
			_description: { state: !0 },
			_busy: { state: !0 }
		};
	}
	constructor() {
		super(), this._busy = !1;
	}
	firstUpdated() {
		this.renderRoot.querySelector("dialog").showModal(), Fe(this.hass, this.program.id).then((e) => this._description = e.textContent?.descLong || e.textContent?.descShort || "").catch(() => this._description = "");
	}
	_backdropClick(e) {
		e.target === e.currentTarget && this._close();
	}
	_close() {
		this.renderRoot.querySelector("dialog")?.close();
	}
	async _run(e, t, n) {
		this._busy = !0;
		let r = await Y(this, this.hass, e);
		this._busy = !1, r && (q(this, n), J(this, t), n === "recordings" && this._close());
	}
	render() {
		let e = this.program, t = new Date(e.start).getTime(), n = new Date(e.stop).getTime(), r = Date.now(), i = B(this.hass, {
			hour: "2-digit",
			minute: "2-digit"
		}), a = B(this.hass, {
			weekday: "long",
			day: "numeric",
			month: "long"
		}), o = t <= r && r < n, s = n <= r, c = this.recording, l = this.channel?.favorite ?? !1;
		return D`<dialog
      @close=${() => this.dispatchEvent(new CustomEvent("closed"))}
      @click=${this._backdropClick}
    >
      <div class="dlg-h">
        ${this.channel ? D`<img class="logo" src=${this.channel.logo} alt="" />` : A}
        <div class="meta">
          <div class="muted small">${this.channel?.name ?? e.channel_id}</div>
          <h3>${e.title}</h3>
          <div class="muted small">
            ${a.format(t)}, ${i.format(t)}–${i.format(n)}
            ${e.episode_title ? D` · ${e.episode_title}` : A}
          </div>
        </div>
        ${this.channel ? D`<button
              class="star-btn"
              aria-pressed=${l}
              title=${z(this.hass, l ? "remove_favorite" : "add_favorite")}
              aria-label=${z(this.hass, l ? "remove_favorite" : "add_favorite")}
              ?disabled=${this._busy}
              @click=${() => this._run(() => ze(this.hass, this.channel.id, !l), z(this.hass, l ? "favorite_removed" : "favorite_added", { name: this.channel.name }), "channels")}
            >
              ${Ze()}
            </button>` : A}
        <button class="icon-btn" aria-label=${z(this.hass, "close")} @click=${this._close}>${Ye()}</button>
      </div>
      <div class="dlg-b">
        <div class="toolbar">
          ${o ? D`<span class="chip live"><span class="dot"></span>${z(this.hass, "live")}</span>` : A}
          ${s ? D`<span class="chip">${z(this.hass, "ended")}</span>` : A}
          ${c?.status === "RECORDING" ? D`<span class="chip rec">${G()}${z(this.hass, "rec")}</span>` : A}
          ${c?.status === "SCHEDULED" ? D`<span class="chip sched">${H(14)}${z(this.hass, "scheduled")}</span>` : A}
          ${e.genre ? D`<span class="chip">${e.genre}</span>` : A}
        </div>
        ${o ? D`<div class="progress"><div style="width:${(r - t) / (n - t) * 100}%"></div></div>` : A}
        ${e.image ? D`<img class="still" src=${e.image} alt="" />` : A}
        <p>${this._description ?? z(this.hass, "loading")}</p>
        ${e.recordable ? A : D`<p class="muted small">${z(this.hass, "not_recordable")}</p>`}
      </div>
      <div class="dlg-a">
        ${o && this.channel ? D`<button
              class="btn"
              @click=${() => {
			this._close(), X(this, { channel: this.channel.id });
		}}
            >
              ${Qe()}${z(this.hass, "watch")}
            </button>` : A}
        ${c ? D`<button
              class="btn danger"
              ?disabled=${this._busy}
              @click=${() => this._run(() => R(this.hass, [c.id]), z(this.hass, "recording_cancelled"), "recordings")}
            >
              ${z(this.hass, "cancel_recording")}
            </button>` : A}
        ${!c && !s && e.recordable && e.series_id ? D`<button
              class="btn"
              ?disabled=${this._busy}
              @click=${() => this._run(() => L(this.hass, e.id, !0), z(this.hass, "series_started", { title: e.title }), "recordings")}
            >
              ${z(this.hass, "record_series")}
            </button>` : A}
        ${!c && !s && e.recordable ? D`<button
              class="btn primary"
              ?disabled=${this._busy}
              @click=${() => this._run(() => L(this.hass, e.id), z(this.hass, "recording_started", { title: e.title }), "recordings")}
            >
              ${G()}${z(this.hass, "record")}
            </button>` : A}
      </div>
    </dialog>`;
	}
	static {
		this.styles = [K, s`
      dialog {
        border: 0;
        border-radius: 20px;
        padding: 0;
        width: min(560px, calc(100vw - 32px));
        background: var(--wt-card);
        color: var(--wt-fg);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
      }
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.45);
      }
      .small {
        font-size: 13px;
      }
      .dlg-h {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 20px 12px 8px 24px;
      }
      .dlg-h .meta {
        flex: 1;
        min-width: 0;
      }
      h3 {
        margin: 0;
        font-size: 22px;
        font-weight: 400;
      }
      .icon-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 0;
        background: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .icon-btn:hover {
        background: var(--wt-chip);
      }
      .dlg-b {
        padding: 4px 24px 8px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .dlg-b p {
        margin: 0;
      }
      .still {
        width: 100%;
        border-radius: 12px;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        background: var(--wt-chip);
      }
      .progress {
        height: 4px;
        border-radius: 2px;
        background: var(--wt-chip);
        overflow: hidden;
      }
      .progress > div {
        height: 100%;
        background: var(--wt-primary);
      }
      .dlg-a {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
        padding: 12px 16px 20px;
      }
    `];
	}
};
customElements.define("waipu-program-dialog", ut);
// src/guide-tab.ts
var dt = 68, ft = 36, pt = 4, Z = 6e4, mt = class extends P {
	static {
		this.properties = {
			hass: { attribute: !1 },
			channels: { attribute: !1 },
			recordings: { attribute: !1 },
			_guide: { state: !0 },
			_day: { state: !0 },
			_all: { state: !0 },
			_search: { state: !0 },
			_selected: { state: !0 },
			_now: { state: !0 }
		};
	}
	_onScroll() {
		cancelAnimationFrame(this._scrollFrame), this._scrollFrame = requestAnimationFrame(() => this._pinTitles());
	}
	_pinTitles() {
		let e = this.renderRoot.querySelector(".epg-box");
		if (!e) return;
		let t = e.scrollLeft, n = e.querySelectorAll(".epg-row"), r = Math.max(0, Math.floor((e.scrollTop - ft) / dt)), i = Math.min(n.length, r + Math.ceil(e.clientHeight / dt) + 1), a = /* @__PURE__ */ new Set();
		for (let e = r; e < i; e++) for (let r of n[e].querySelectorAll(".prog")) {
			let e = Number(r.dataset.left), n = Number(r.dataset.end);
			if (!(e >= t || n <= t + 40)) {
				for (let i of r.querySelectorAll(".t, .s")) i.style.transform = `translateX(${t - e}px)`, i.style.maxWidth = `${n - t - 24}px`, a.add(i);
				break;
			}
		}
		for (let e of this._pinned) a.has(e) || (e.style.transform = e.style.maxWidth = "");
		this._pinned = a;
	}
	constructor() {
		super(), this._days = [], this._scrollToNow = !0, this._scrollFrame = 0, this._pinned = /* @__PURE__ */ new Set(), this._day = 0, this._all = !1, this._search = "", this._now = Date.now();
	}
	connectedCallback() {
		super.connectedCallback(), this._clock = window.setInterval(() => this._now = Date.now(), Z);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearInterval(this._clock);
	}
	get _favoriteIds() {
		return this.channels.filter((e) => e.visible && e.favorite).map((e) => e.id);
	}
	willUpdate() {
		if (!this.hass || !this.channels?.length) return;
		let e = `${this._day}|${this._all}|${this._all ? "" : this._favoriteIds.join()}`;
		e !== this._loadedKey && (this._loadedKey = e, this._load());
	}
	async _load() {
		try {
			if (!this._days.length) {
				let e = /* @__PURE__ */ new Date();
				this._days = (await I(this.hass, e, e)).days;
			}
			let e = new Date(this._days[this._day]), t = this._day + 1 < this._days.length ? new Date(this._days[this._day + 1]) : null;
			this._guide = await I(this.hass, e, t ?? new Date(e.getTime() + 1440 * Z), this._all ? void 0 : this._favoriteIds);
		} catch (e) {
			J(this, z(this.hass, "error", { message: e.message ?? String(e) }));
		}
	}
	updated() {
		this._scrollToNow && this._guide && (this._scrollToNow = !1, this._jumpToNow()), this._pinTitles();
	}
	_dayRange() {
		let e = new Date(this._days[this._day]).getTime(), t = this._days[this._day + 1];
		return [e, t ? new Date(t).getTime() : e + 1440 * Z];
	}
	_x(e, t) {
		return (e - t) / Z * pt;
	}
	_jumpToNow() {
		let e = this.renderRoot.querySelector(".epg-box");
		if (!e || !this._days.length) return;
		let [t, n] = this._dayRange(), r = Math.min(Math.max(this._now, t), n);
		e.scrollLeft = Math.max(0, this._x(r, t) - 120);
	}
	_recordingsByProgram() {
		let e = /* @__PURE__ */ new Map();
		for (let t of this.recordings ?? []) t.program_id && (t.status === "SCHEDULED" || t.status === "RECORDING") && e.set(t.program_id, t);
		return e;
	}
	render() {
		let e = B(this.hass, {
			weekday: "short",
			day: "numeric"
		});
		return D`
      <div class="content">
        <div class="card">
          <div class="card-h">
            <h2>${z(this.hass, "tv_guide")}</h2>
            <div class="toolbar">
              <div class="seg" role="group">
                ${this._days.map((t, n) => D`<button aria-pressed=${n === this._day} @click=${() => this._selectDay(n)}>
                    ${n === 0 ? z(this.hass, "today") : e.format(new Date(t))}
                  </button>`)}
              </div>
              <div class="seg" role="group">
                <button aria-pressed=${!this._all} @click=${() => this._all = !1}>
                  ${z(this.hass, "favorites")}
                </button>
                <button aria-pressed=${this._all} @click=${() => this._all = !0}>
                  ${z(this.hass, "all_channels")}
                </button>
              </div>
              <button class="btn" @click=${this._now_clicked}>${H()}${z(this.hass, "now")}</button>
              <label class="search">
                ${U()}
                <input
                  type="search"
                  placeholder=${z(this.hass, "search_programs")}
                  .value=${this._search}
                  @input=${(e) => this._search = e.target.value}
                />
              </label>
            </div>
          </div>
          ${this._renderGrid()}
          <div class="legend">
            <span><span class="chip live"><span class="dot"></span>${z(this.hass, "live")}</span>${z(this.hass, "legend_live")}</span>
            <span><span class="chip rec">${G()}${z(this.hass, "rec")}</span>${z(this.hass, "legend_rec")}</span>
            <span><span class="chip sched">${H(14)}${z(this.hass, "scheduled")}</span>${z(this.hass, "legend_sched")}</span>
            <span>${z(this.hass, "legend_hint")}</span>
          </div>
        </div>
      </div>
      ${this._selected ? D`<waipu-program-dialog
            .hass=${this.hass}
            .program=${this._selected}
            .channel=${this.channels.find((e) => e.id === this._selected.channel_id)}
            .recording=${this._recordingsByProgram().get(this._selected.id)}
            @closed=${() => this._selected = void 0}
          ></waipu-program-dialog>` : A}
    `;
	}
	_selectDay(e) {
		this._day = e, this._scrollToNow = !0;
	}
	_now_clicked() {
		this._day === 0 ? this._jumpToNow() : this._selectDay(0);
	}
	_renderGrid() {
		if (!this._guide || !this._days.length) return D`<p class="card-b muted">${z(this.hass, "loading")}</p>`;
		let e = this._all ? Object.keys(this._guide.programs) : this._favoriteIds, t = this.channels.filter((t) => e.includes(t.id));
		if (!t.length) return D`<p class="card-b muted">${z(this.hass, "no_favorites")}</p>`;
		let [n, r] = this._dayRange(), i = this._x(r, n), a = B(this.hass, {
			hour: "2-digit",
			minute: "2-digit"
		}), o = [];
		for (let e = n; e < r; e += 30 * Z) o.push(e);
		let s = this._now >= n && this._now < r, c = this._recordingsByProgram(), l = this._search.trim().toLowerCase();
		return D`
      <div class="epg-box" @scroll=${this._onScroll}>
        <div class="epg" style="--track:${i}px">
          <div class="epg-head">
            <div class="epg-corner">${z(this.hass, "channel")}</div>
            <div class="epg-ticks" style="width:${i}px">
              ${o.map((e) => D`<span style="left:${this._x(e, n)}px">${a.format(e)}</span>`)}
              ${s ? D`<div class="now-badge" style="left:${this._x(this._now, n)}px">${a.format(this._now)}</div>` : A}
            </div>
          </div>
          ${t.map((e) => D`<div class="epg-row">
              <div class="epg-ch">
                <span class="num">${e.number}</span>
                <img class="logo" src=${e.logo} alt="" loading="lazy" />
                <span class="name">${e.name}</span>
              </div>
              <div class="epg-track" style="width:${i}px">
                ${(this._guide.programs[e.id] ?? []).map((e) => this._renderProgram(e, n, r, a, c.get(e.id), l))}
              </div>
            </div>`)}
          ${s ? D`<div class="now-line" style="left:calc(var(--ch) + ${this._x(this._now, n)}px)"></div>` : A}
        </div>
      </div>
    `;
	}
	_renderProgram(e, t, n, r, i, a) {
		let o = new Date(e.start).getTime(), s = new Date(e.stop).getTime(), c = this._x(Math.max(o, t), t), l = this._x(Math.min(s, n), t), u = o <= this._now && this._now < s;
		return D`<button
      class=${[
			"prog",
			s <= this._now ? "past" : "",
			u ? "live" : "",
			i?.status === "RECORDING" ? "rec" : i ? "sched" : "",
			a && !`${e.title} ${e.episode_title ?? ""}`.toLowerCase().includes(a) ? "dim" : ""
		].join(" ")}
      style="left:${c}px;width:${Math.max(l - c - 2, 2)}px"
      data-left=${c}
      data-end=${l}
      title="${r.format(o)}–${r.format(s)} ${e.title}"
      @click=${() => this._selected = e}
    >
      <span class="t">
        ${i?.status === "RECORDING" ? D`<span class="flag">${G()}</span>` : A}
        ${i?.status === "SCHEDULED" ? D`<span class="flag">${H(14)}</span>` : A}
        <span>${e.title}</span>
      </span>
      <span class="s">${r.format(o)}${e.episode_title ? ` · ${e.episode_title}` : ""}</span>
      ${u ? D`<span class="bar" style="width:${(this._now - o) / (s - o) * 100}%"></span>` : A}
    </button>`;
	}
	static {
		this.styles = [K, s`
      .epg-box {
        overflow: auto;
        max-height: calc(100vh - 260px);
        border-top: 1px solid var(--wt-line);
        position: relative;
      }
      /* rows as wide as their content, so the sticky channel column stays put while scrolling */
      .epg {
        position: relative;
        --ch: 196px;
        width: max-content;
        min-width: 100%;
      }
      .epg-head {
        display: flex;
        position: sticky;
        top: 0;
        z-index: 3;
        background: var(--wt-card);
        border-bottom: 1px solid var(--wt-line);
        height: 36px;
      }
      .epg-corner {
        position: sticky;
        left: 0;
        z-index: 4;
        width: var(--ch);
        flex: none;
        background: var(--wt-card);
        border-right: 1px solid var(--wt-line);
        display: flex;
        align-items: center;
        padding: 0 12px;
        font-size: 12px;
        color: var(--wt-muted);
      }
      .epg-ticks {
        position: relative;
        flex: none;
      }
      .epg-ticks span {
        position: absolute;
        top: 0;
        height: 36px;
        display: flex;
        align-items: center;
        padding-left: 6px;
        font-size: 12px;
        color: var(--wt-muted);
        border-left: 1px solid var(--wt-line);
      }
      .epg-row {
        display: flex;
        height: 68px;
        border-bottom: 1px solid var(--wt-line);
      }
      .epg-ch {
        position: sticky;
        left: 0;
        z-index: 2;
        width: var(--ch);
        flex: none;
        background: var(--wt-card);
        border-right: 1px solid var(--wt-line);
        /* covers the row's border too: the divider color can be translucent, which let the now-line
           show through between channels */
        border-bottom: 1px solid var(--wt-line);
        margin-bottom: -1px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 4px 0 12px;
      }
      .epg-ch .name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
      }
      .epg-ch .num {
        font-size: 12px;
        color: var(--wt-muted);
        width: 22px;
        text-align: right;
      }
      .epg-track {
        position: relative;
        flex: none;
      }
      .prog {
        position: absolute;
        top: 6px;
        bottom: 6px;
        border-radius: 8px;
        border: 1px solid var(--wt-line);
        background: var(--wt-chip);
        padding: 6px 10px;
        text-align: left;
        cursor: pointer;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2px;
        min-width: 0;
      }
      .prog:hover {
        border-color: var(--wt-primary);
      }
      .prog:focus-visible {
        outline: 2px solid var(--wt-primary);
        outline-offset: 1px;
      }
      .prog .t {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .prog .t span:last-child {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .prog .s {
        font-size: 12px;
        color: var(--wt-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .prog.past {
        opacity: 0.62;
      }
      .prog.dim {
        opacity: 0.25;
      }
      .prog.live {
        background: var(--wt-primary-soft);
        border-color: var(--wt-primary);
      }
      .prog .bar {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 3px;
        background: var(--wt-primary);
      }
      .prog .flag {
        flex: none;
        display: inline-flex;
      }
      .prog.rec .flag {
        color: var(--wt-rec);
      }
      .prog.sched .flag {
        color: var(--wt-sched);
      }
      /* above the programs, below the channel column (z-index 2) and the header (3); the time badge
         sits in the header, where the corner covers it the same way */
      .now-line {
        position: absolute;
        top: 36px;
        bottom: 0;
        width: 2px;
        background: var(--wt-rec);
        z-index: 1;
        pointer-events: none;
      }
      .now-badge {
        position: absolute;
        top: 8px;
        margin-left: 1px;
        transform: translateX(-50%);
        pointer-events: none;
        padding: 0 4px;
        white-space: nowrap;
        font-size: 11px;
        font-weight: 700;
        color: #fff;
        background: var(--wt-rec);
        border-radius: 4px;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        padding: 10px 16px;
        font-size: 12.5px;
        color: var(--wt-muted);
      }
      .legend > span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      @media (max-width: 640px) {
        .epg {
          --ch: 132px;
        }
        .epg-ch .logo {
          display: none;
        }
      }
    `];
	}
};
customElements.define("waipu-guide-tab", mt);
// src/playlists-tab.ts
var ht = [
	"favorites",
	"all",
	"live",
	"vod",
	"recordings",
	"epg"
], gt = class extends P {
	static {
		this.properties = {
			hass: { attribute: !1 },
			_data: { state: !0 }
		};
	}
	firstUpdated() {
		Le(this.hass).then((e) => this._data = e).catch((e) => J(this, z(this.hass, "error", { message: e.message ?? String(e) })));
	}
	async _copy(e) {
		try {
			await navigator.clipboard.writeText(e), J(this, z(this.hass, "copied"));
		} catch {
			J(this, z(this.hass, "copy_failed"));
		}
	}
	render() {
		let e = this._data;
		return D`<div class="content">
      <div class="card">
        <div class="card-h">
          <h2>${z(this.hass, "playlist_server")}</h2>
          <span class="chip">${z(this.hass, "admins_only")}</span>
          ${e ? e.enabled ? D`<span class="chip live"><span class="dot"></span>${z(this.hass, "running")}</span>` : D`<span class="chip">${z(this.hass, "off")}</span>` : A}
        </div>
        <div class="card-b">
          ${e ? e.enabled ? D`<ul class="urls">
                  ${ht.map((t) => {
			let n = location.origin + e.urls[t];
			return D`<li>
                      <div class="meta">
                        <div>${z(this.hass, `url_${t}`)}</div>
                        <div class="mono">${n}</div>
                      </div>
                      <button class="btn" @click=${() => this._copy(n)}>
                        ${Xe()}${z(this.hass, "copy")}
                      </button>
                    </li>`;
		})}
                </ul>` : D`<p>${z(this.hass, "playlists_off")}</p>` : D`<p class="muted">${z(this.hass, "loading")}</p>`}
        </div>
        ${e ? D`<div class="card-b actions">
              <a class="btn" href="/config/integrations/integration/waipu_tv">${z(this.hass, "open_options")}</a>
            </div>` : A}
      </div>
      ${e?.enabled ? this._renderOptions(e) : A}
      <p class="muted note">${z(this.hass, "playlists_note")}</p>
    </div>`;
	}
	_renderOptions(e) {
		let t = (e) => z(this.hass, e ? "on" : "off_value"), n = (e) => z(this.hass, "from_options", { value: t(e) }), r = z(this.hass, "m3u_playlists"), i = e.instant_restart ? "" : ` ${z(this.hass, "needs_restart")}`, a = [
			[
				"hidden",
				"0 | 1",
				t(!1),
				`${r}, epg.xml`,
				z(this.hass, "param_hidden")
			],
			[
				"drm",
				"0 | 1",
				t(!0),
				`${r}, epg.xml`,
				z(this.hass, "param_drm")
			],
			[
				"protocol",
				"auto | hls | dash",
				"auto",
				`${r}, recordings.m3u`,
				z(this.hass, "param_protocol")
			],
			[
				"timeshift",
				"0 | 1",
				n(e.defaults.timeshift),
				r,
				z(this.hass, "param_timeshift") + i
			],
			[
				"hls_proxy",
				"0 | 1",
				n(e.defaults.hls_proxy),
				r,
				z(this.hass, "param_hls_proxy")
			],
			[
				"filter",
				"all | favorites | live | vod",
				"all",
				"epg.xml",
				z(this.hass, "param_filter")
			]
		];
		return D`<div class="card">
      <div class="card-h"><h2>${z(this.hass, "options_title")}</h2></div>
      <div class="card-b">
        <p class="intro">${z(this.hass, "options_intro")}</p>
        <div class="table-box">
          <table>
            <thead>
              <tr>
                <th>${z(this.hass, "parameter")}</th>
                <th>${z(this.hass, "values")}</th>
                <th>${z(this.hass, "default")}</th>
                <th>${z(this.hass, "applies_to")}</th>
                <th>${z(this.hass, "meaning")}</th>
              </tr>
            </thead>
            <tbody>
              ${a.map(([e, t, n, r, i]) => D`<tr>
                  <td class="mono">${e}</td>
                  <td class="mono">${t}</td>
                  <td>${n}</td>
                  <td>${r}</td>
                  <td>${i}</td>
                </tr>`)}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
	}
	static {
		this.styles = [K, s`
      .card,
      .note {
        max-width: 1000px;
      }
      .note {
        margin: 0;
        font-size: 12.5px;
      }
      .urls {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .urls li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--wt-line);
      }
      .urls li:last-child {
        border-bottom: 0;
      }
      .meta {
        flex: 1;
        min-width: 0;
      }
      .meta div:first-child {
        font-weight: 500;
      }
      .meta div:last-child {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--wt-muted);
      }
      .actions {
        padding-top: 0;
      }
      .intro {
        margin: 0 0 12px;
        color: var(--wt-muted);
        font-size: 13px;
      }
      .table-box {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 640px;
      }
      th {
        text-align: left;
        font-size: 12px;
        font-weight: 500;
        color: var(--wt-muted);
        padding: 8px;
        border-bottom: 1px solid var(--wt-line);
      }
      td {
        padding: 8px;
        border-bottom: 1px solid var(--wt-line);
        vertical-align: top;
        font-size: 13px;
      }
      td.mono {
        white-space: nowrap;
      }
    `];
	}
};
customElements.define("waipu-playlists-tab", gt);
// src/player-view.ts
var Q = "waipu-license", $ = 3e4, _t = "waipu-tv.volume", vt = 2e3, yt = 15, bt = (() => {
	let e = document.createElement("video");
	return e.volume = .5, e.volume === .5;
})(), xt, St, Ct = (e) => {
	let t = e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength), n = "";
	for (let e of t) n += String.fromCharCode(e);
	return btoa(n);
}, wt = (e) => Uint8Array.from(atob(e), (e) => e.charCodeAt(0));
function Tt() {
	return xt ??= import("./shaka-player.compiled-es2021-BzI3yHKF.js").then((t) => /* @__PURE__ */ e(t.default, 1)).then(({ default: e }) => (e.polyfill.installAll(), e.net.NetworkingEngine.registerScheme(Q, (t, n) => {
		let r = t.slice(14), i = Ve(St, r, Ct(n.body)).then(({ license: e }) => ({
			uri: t,
			originalUri: t,
			originalRequest: n,
			data: wt(e),
			headers: {}
		}), (n) => {
			throw new e.util.Error(e.util.Error.Severity.CRITICAL, e.util.Error.Category.NETWORK, e.util.Error.Code.HTTP_ERROR, t, n?.message ?? String(n));
		});
		return e.util.AbortableOperation.notAbortable(i);
	}), e)), xt;
}
var Et;
function Dt() {
	return Et ??= (async () => {
		if (!navigator.requestMediaKeySystemAccess) return null;
		for (let [e, t, n] of [[
			"widevine",
			"com.widevine.alpha",
			["cenc"]
		], [
			"fairplay",
			"com.apple.fps",
			["sinf", "skd"]
		]]) try {
			return await navigator.requestMediaKeySystemAccess(t, [{
				initDataTypes: [...n],
				videoCapabilities: [{ contentType: "video/mp4; codecs=\"avc1.640028\"" }]
			}]), e;
		} catch {}
		return null;
	})(), Et;
}
var Ot = [
	["mp4a", "AAC"],
	["ec-3", "Dolby Digital Plus"],
	["ac-3", "Dolby Digital"]
];
function kt(e) {
	let t = Ot.find(([t]) => e.codecs?.startsWith(t))?.[1] ?? e.codecs ?? "", n = !e.channelsCount || e.channelsCount <= 2 ? "Stereo" : e.channelsCount === 6 ? "5.1" : `${e.channelsCount} ch`;
	return [e.label || e.language, `${n}${t ? ` (${t})` : ""}`].filter(Boolean).join(" · ");
}
function At(e, t) {
	let n = e.getAudioTracks(), r = n.find((e) => e.active);
	if (!r) return;
	let i = t && n.some((e) => e.language === t) ? t : r.language, a = n.filter((e) => e.language === i).sort((e, t) => (t.channelsCount ?? 0) - (e.channelsCount ?? 0))[0];
	a && a !== r && e.selectAudioTrack(a);
}
var jt = (e) => {
	let t = Math.max(0, Math.floor(e)), n = Math.floor(t / 3600), r = String(Math.floor(t % 3600 / 60)).padStart(n ? 2 : 1, "0");
	return `${n ? `${n}:` : ""}${r}:${String(t % 60).padStart(2, "0")}`;
}, Mt = class extends P {
	static {
		this.properties = {
			hass: { attribute: !1 },
			channels: { attribute: !1 },
			recordings: { attribute: !1 },
			instantRestart: { type: Boolean },
			audioLanguage: { attribute: !1 },
			target: { attribute: !1 },
			_blocked: { state: !0 },
			_error: { state: !0 },
			_badge: { state: !0 },
			_now: { state: !0 },
			_description: { state: !0 },
			_list: { state: !0 },
			_search: { state: !0 },
			_playing: { state: !0 },
			_muted: { state: !0 },
			_volume: { state: !0 },
			_audio: { state: !0 },
			_text: { state: !0 },
			_tick: { state: !0 },
			_dialog: { state: !0 },
			_busy: { state: !0 }
		};
	}
	constructor() {
		super(), this._playId = 0, this._timers = [], this._onKey = (e) => {
			let t = e.composedPath();
			t.some((e) => e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLDialogElement) || (e.key === " " && !t.some((e) => e instanceof HTMLButtonElement) ? (e.preventDefault(), this._togglePlay()) : (e.key === "ArrowUp" || e.key === "ArrowDown") && "channel" in this.target && (e.preventDefault(), this._zap(e.key === "ArrowUp" ? -1 : 1)));
		}, this._now = {}, this._list = "fav", this._search = "", this._playing = !1, this._muted = !1, this._volume = 1, this._audio = [], this._text = [], this._tick = 0, this._busy = !1;
	}
	connectedCallback() {
		super.connectedCallback(), this._timers = [window.setInterval(() => this._loadGuide(), 6e4), window.setInterval(() => this._tick++, 1e3)], document.addEventListener("keydown", this._onKey);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._timers.forEach((e) => window.clearInterval(e)), document.removeEventListener("keydown", this._onKey), this._playId++, this._player?.destroy(), this._player = void 0, this._release();
	}
	_release() {
		let e = this._lease;
		return this._lease = void 0, e?.then((e) => e()).catch(() => void 0);
	}
	firstUpdated() {
		try {
			let e = Number(localStorage.getItem(_t));
			bt && e > 0 && e <= 1 && (this._video.volume = e);
		} catch {}
	}
	_volumeChanged(e) {
		this._muted = e.muted, this._volume = e.volume;
		try {
			e.volume > 0 && localStorage.setItem(_t, String(e.volume));
		} catch {}
	}
	updated(e) {
		e.has("target") && ("recording" in this.target && (this._list = "rec"), this._play(), this._loadGuide());
	}
	get _video() {
		return this.renderRoot.querySelector("video");
	}
	get _channel() {
		let e = "channel" in this.target ? this.target.channel : this.target.recording.channel_id;
		return this.channels.find((t) => t.id === e);
	}
	_listChannels() {
		let e = this.channels.filter((e) => e.visible);
		if (this._list === "fav" || this._list === "rec") return this.channels.filter((e) => e.favorite);
		let t = this._list === "vod" ? e.filter((e) => e.vod) : e, n = this._search.trim().toLowerCase();
		return n ? t.filter((e) => e.name.toLowerCase().includes(n)) : t;
	}
	async _loadGuide() {
		let e = new Set(this.channels.filter((e) => e.visible || e.favorite).map((e) => e.id));
		this._channel && e.add(this._channel.id);
		let t = /* @__PURE__ */ new Date();
		try {
			let n = await I(this.hass, t, new Date(t.getTime() + 6e4), [...e]), r = {};
			for (let [e, i] of Object.entries(n.programs)) {
				let n = i.find((e) => new Date(e.start) <= t && t < new Date(e.stop));
				n && (r[e] = n);
			}
			this._now = r;
		} catch {}
		let n = "recording" in this.target ? this.target.recording.program_id : this._now[this._channel?.id ?? ""]?.id;
		n && n !== this._describedId && (this._describedId = n, this._description = void 0, Fe(this.hass, n).then((e) => this._description = e.textContent?.descLong || e.textContent?.descShort || "").catch(() => this._description = ""));
	}
	async _play(e = 0) {
		let t = ++this._playId;
		this._error = this._blocked = void 0, this._audio = this._text = [];
		let n = this._player;
		this._player = void 0, await n?.destroy(), await this._release();
		let r = this.target, i = this._channel, a = i?.name ?? "", o = "recording" in r || !i?.hls, s = o ? await Dt() : null;
		if (o && !s) {
			this._badge = void 0, this._blocked = window.isSecureContext ? {
				title: z(this.hass, "drm_unsupported_title", { name: a }),
				text: z(this.hass, "drm_unsupported_text")
			} : {
				title: z(this.hass, "drm_https_title", { name: a }),
				text: z(this.hass, "drm_https_text")
			};
			return;
		}
		let c = s === "widevine" ? "dash" : "hls";
		this._badge = o ? s === "widevine" ? "DASH · Widevine" : "HLS · FairPlay" : "HLS";
		try {
			let e = await Tt();
			St = this.hass, this._settings ??= We(this.hass).catch(() => ({}));
			let n = await this._settings, i = "recording" in r ? { recording_id: r.recording.id } : {
				channel: r.channel,
				from_start: !!r.fromStart
			};
			if (t !== this._playId) return;
			let a, o = new Promise((e) => a = e), l = !1;
			this._lease = Be(this.hass, i, c, (e) => {
				l ? t === this._playId && this._player?.load(e).catch((e) => this._fail(e)) : (l = !0, a(e));
			}, () => {
				t === this._playId && window.setTimeout(() => t === this._playId && this._play(1), vt);
			}), await this._lease;
			let u = await o, d = s === "fairplay" ? wt((await He(this.hass)).certificate) : void 0;
			if (t !== this._playId) return;
			let f = new e.Player();
			this._player = f, await f.attach(this._video), f.configure({ drm: {
				servers: {
					"com.widevine.alpha": `${Q}:widevine`,
					"com.apple.fps": `${Q}:fairplay`
				},
				...d ? { advanced: { "com.apple.fps": { serverCertificate: d } } } : {}
			} }), f.addEventListener("error", (e) => this._fail(e.detail));
			let p = () => {
				this._audio = f.getAudioTracks(), this._text = f.getTextTracks();
			};
			for (let e of [
				"trackschanged",
				"variantchanged",
				"textchanged",
				"adaptation"
			]) f.addEventListener(e, p);
			await f.load(u), At(f, n.audio_language ?? this.audioLanguage), p();
		} catch (n) {
			if (t !== this._playId) return;
			e && e < yt ? window.setTimeout(() => t === this._playId && this._play(e + 1), vt) : this._fail(n);
		}
	}
	_fail(e) {
		let t = e, n = t?.data?.find((e) => typeof e == "string" && !e.startsWith(Q)), r = [t?.code ? `#${t.code}` : "", n ?? t?.message ?? String(e)].filter(Boolean).join(" ");
		this._error = z(this.hass, "playback_error", { message: r });
	}
	_togglePlay() {
		let e = this._video;
		e.paused ? e.play().catch(() => void 0) : e.pause();
	}
	_zap(e) {
		let t = this._listChannels(), n = t[(t.findIndex((e) => e.id === this._channel?.id) + e + t.length) % t.length];
		n && X(this, { channel: n.id });
	}
	_goLive() {
		"channel" in this.target && this.target.fromStart ? X(this, { channel: this.target.channel }) : this._player?.goToLive();
	}
	_fullscreen() {
		let e = this.renderRoot.querySelector(".player");
		document.fullscreenElement ? document.exitFullscreen() : e.requestFullscreen ? e.requestFullscreen() : this._video.webkitEnterFullscreen?.();
	}
	_pip() {
		document.pictureInPictureElement ? document.exitPictureInPicture() : this._video.requestPictureInPicture().catch(() => void 0);
	}
	_toggleText() {
		let e = this._text.find((e) => e.active);
		this._player?.selectTextTrack(e ? null : this._text[0]), this._text = this._player?.getTextTracks() ?? [];
	}
	async _chooseAudio(e) {
		this._player?.selectAudioTrack(e);
		let t = {
			...await this._settings,
			audio_language: e.language
		};
		this._settings = Promise.resolve(t), Ge(this.hass, t).catch(() => void 0);
	}
	async _toggleFavorite(e) {
		this._busy = !0;
		let t = await Y(this, this.hass, () => ze(this.hass, e.id, !e.favorite));
		this._busy = !1, t && (q(this, "channels"), J(this, z(this.hass, e.favorite ? "favorite_removed" : "favorite_added", { name: e.name })));
	}
	async _record(e) {
		this._busy = !0;
		let t = await Y(this, this.hass, () => L(this.hass, e.id));
		this._busy = !1, t && (q(this, "recordings"), J(this, z(this.hass, "recording_started", { title: e.title })));
	}
	async _deleteRecording(e) {
		if (!confirm(z(this.hass, "confirm_delete", { count: 1 }))) return;
		this._busy = !0;
		let t = await Y(this, this.hass, () => R(this.hass, [e.id]));
		this._busy = !1, t && (q(this, "recordings"), J(this, z(this.hass, "deleted", { count: 1 })), X(this, null));
	}
	_timeline(e) {
		let t = this._player, n = this.renderRoot.querySelector("video");
		if (!t || !n || this._blocked) return;
		let r = t.seekRange();
		if ("recording" in this.target) {
			let e = Number.isFinite(n.duration) ? n.duration : r.end;
			return e ? {
				start: 0,
				end: e,
				avail: [r.start, r.end],
				pos: n.currentTime,
				label: ["0:00", jt(e)],
				seek: (e) => n.currentTime = e
			} : void 0;
		}
		let i = t.getPlayheadTimeAsDate()?.getTime() ?? Date.now() - (r.end - n.currentTime) * 1e3, a = (e) => i + (e - n.currentTime) * 1e3, o = [a(r.start), a(r.end)], [s, c] = e ? [new Date(e.start).getTime(), new Date(e.stop).getTime()] : o;
		if (c <= s) return;
		let l = B(this.hass, {
			hour: "2-digit",
			minute: "2-digit"
		});
		return {
			start: s,
			end: c,
			avail: o,
			pos: i,
			live: o[1],
			label: [l.format(s), l.format(c)],
			seek: (e) => {
				e >= o[1] - $ / 3 ? t.goToLive() : n.currentTime = r.start + (Math.max(e, o[0]) - o[0]) / 1e3;
			}
		};
	}
	_scrub(e, t) {
		let n = e.currentTarget.getBoundingClientRect();
		t.seek(t.start + (e.clientX - n.left) / n.width * (t.end - t.start));
	}
	render() {
		this._tick;
		let e = this.target, t = this._channel, n = "recording" in e ? e.recording : void 0, r = n ? void 0 : this._now[t?.id ?? ""], i = B(this.hass, {
			hour: "2-digit",
			minute: "2-digit"
		}), a = B(this.hass, {
			weekday: "short",
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit"
		}), o = (e) => `${i.format(new Date(e.start))}–${i.format(new Date(e.stop))}`, s = "channel" in e && !!e.fromStart, c = this._timeline(r), l = (e) => c ? `${Math.max(0, Math.min(100, (e - c.start) / (c.end - c.start) * 100))}%` : "0", u = c?.live === void 0 ? 0 : c.live - c.pos, d = this.channels.find((e) => e.favorite && e.hls && e.id !== t?.id), f = this._text.find((e) => e.active);
		return D`<div class="content">
      <div class="layout">
        <div class="main">
          <div class="player">
            <div class="video">
              <video
                autoplay
                playsinline
                @click=${this._togglePlay}
                @play=${() => this._playing = !0}
                @pause=${() => this._playing = !1}
                @volumechange=${(e) => this._volumeChanged(e.target)}
              ></video>
              <div class="top">
                <button class="icon-btn" title=${z(this.hass, "back")} aria-label=${z(this.hass, "back")} @click=${() => X(this, null)}>
                  ${$e()}
                </button>
                ${t ? D`<img class="logo" src=${t.logo} alt="" />` : A}
                <div class="meta">
                  <div>${t ? `${t.number} · ${t.name}` : n?.channel_id}</div>
                  <div>
                    ${n ? z(this.hass, "recording_from", { date: n.start ? a.format(new Date(n.start)) : "" }) : r ? `${o(r)} · ${r.title}` : z(this.hass, "no_guide")}
                  </div>
                </div>
                ${t ? this._star(t, !0) : A}
                ${this._badge ? D`<span class="badge">${this._badge}</span>` : A}
                ${document.pictureInPictureEnabled ? D`<button class="icon-btn pip" title=${z(this.hass, "pip")} aria-label=${z(this.hass, "pip")} @click=${this._pip}>
                      ${it()}
                    </button>` : A}
                <button class="icon-btn" title=${z(this.hass, "fullscreen")} aria-label=${z(this.hass, "fullscreen")} @click=${this._fullscreen}>
                  ${at()}
                </button>
              </div>
              ${this._blocked ? D`<div class="msg">
                    <div>
                      <h3>${this._blocked.title}</h3>
                      <p>${this._blocked.text}</p>
                      ${d ? D`<button class="btn primary" @click=${() => X(this, { channel: d.id })}>
                            ${z(this.hass, "watch_name", { name: d.name })}
                          </button>` : A}
                    </div>
                  </div>` : A}
            </div>
            ${c ? D`<div
                    class="scrub"
                    role="slider"
                    aria-label=${z(this.hass, "position")}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow=${Math.round(parseFloat(l(c.pos)))}
                    @click=${(e) => this._scrub(e, c)}
                  >
                    <div class="track"></div>
                    <div class="avail" style="left:${l(c.avail[0])};width:calc(${l(c.avail[1])} - ${l(c.avail[0])})"></div>
                    <div class="played" style="width:${l(c.pos)}"></div>
                    ${c.live === void 0 ? A : D`<div class="edge" style="left:${l(c.live)}"></div>`}
                    <div class="knob" style="left:${l(c.pos)}"></div>
                  </div>
                  <div class="scrub-times"><span>${c.label[0]}</span><span>${c.label[1]}</span></div>` : A}
            <div class="controls">
              <button
                class="icon-btn"
                title=${z(this.hass, this._playing ? "pause" : "play")}
                aria-label=${z(this.hass, this._playing ? "pause" : "play")}
                @click=${this._togglePlay}
              >
                ${this._playing ? rt() : Qe()}
              </button>
              ${n ? A : D`<button class="icon-btn" title=${z(this.hass, "prev_channel")} aria-label=${z(this.hass, "prev_channel")} @click=${() => this._zap(-1)}>
                      ${et()}
                    </button>
                    <button class="icon-btn" title=${z(this.hass, "next_channel")} aria-label=${z(this.hass, "next_channel")} @click=${() => this._zap(1)}>
                      ${tt()}
                    </button>`}
              ${t?.vod && !n ? D`<button
                    class="pill"
                    aria-pressed=${s}
                    ?disabled=${!this.instantRestart}
                    @click=${() => X(this, {
			channel: t.id,
			fromStart: !0
		})}
                  >
                    ${nt()}${z(this.hass, "from_start")}
                  </button>` : A}
              ${!n && (t?.vod || u > $ || s) ? D`<button class="pill live" aria-pressed=${!s && u <= $} @click=${this._goLive}>
                    ${z(this.hass, "live")}
                  </button>` : A}
              <span class="time">
                ${n && c ? `${jt(c.pos)} / ${jt(c.end)}` : u > $ ? z(this.hass, "behind_live", { minutes: Math.max(1, Math.round(u / 6e4)) }) : A}
              </span>
              <span class="grow"></span>
              ${this._audio.length > 1 ? D`<select
                    aria-label=${z(this.hass, "audio_track")}
                    @change=${(e) => {
			let t = this._audio[Number(e.target.value)];
			t && this._chooseAudio(t);
		}}
                  >
                    ${this._audio.map((e, t) => D`<option value=${t} ?selected=${e.active}>${kt(e)}</option>`)}
                  </select>` : A}
              ${this._text.length ? D`<button
                    class="icon-btn"
                    aria-pressed=${!!f}
                    title=${z(this.hass, "subtitles")}
                    aria-label=${z(this.hass, "subtitles")}
                    @click=${this._toggleText}
                  >
                    ${ot()}
                  </button>` : A}
              <div class="volume">
                ${bt ? D`<div class="volume-pop">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        aria-label=${z(this.hass, "volume")}
                        .value=${String(this._muted ? 0 : this._volume)}
                        @input=${(e) => {
			let t = Number(e.target.value);
			this._video.volume = t, this._video.muted = t === 0;
		}}
                      />
                    </div>` : A}
                <button
                  class="icon-btn"
                  title=${z(this.hass, this._muted ? "unmute" : "mute")}
                  aria-label=${z(this.hass, this._muted ? "unmute" : "mute")}
                  @click=${() => this._video.muted = !this._video.muted}
                >
                  ${this._muted || this._volume === 0 ? ct() : st()}
                </button>
              </div>
            </div>
          </div>
          ${this._error ? D`<div class="card error">${this._error}</div>` : A}
          ${this._renderInfo(t, r, n, o, a)}
        </div>
        ${this._renderSidebar(t, n, i, a)}
      </div>
      ${this._dialog ? D`<waipu-program-dialog
            .hass=${this.hass}
            .program=${this._dialog}
            .channel=${this.channels.find((e) => e.id === this._dialog.channel_id)}
            .recording=${this.recordings.find((e) => e.program_id === this._dialog.id && e.status !== "FINISHED")}
            @closed=${() => this._dialog = void 0}
          ></waipu-program-dialog>` : A}
    </div>`;
	}
	_renderInfo(e, t, n, r, i) {
		let a = t && this.recordings.find((e) => e.program_id === t.id && e.status !== "FINISHED");
		return D`<div class="card info">
      <h2>${n?.title ?? t?.title ?? e?.name ?? ""}</h2>
      <div class="muted sub">
        ${n ? [
			n.episode_title,
			e?.name,
			n.start ? i.format(new Date(n.start)) : ""
		].filter(Boolean).join(" · ") : t ? [
			r(t),
			t.genre,
			t.episode_title
		].filter(Boolean).join(" · ") : A}
      </div>
      ${this._description ? D`<p>${this._description}</p>` : A}
      <div class="toolbar">
        ${n ? D`<button class="btn danger" ?disabled=${this._busy} @click=${() => this._deleteRecording(n)}>
              ${W()}${z(this.hass, "delete_recording")}
            </button>` : t ? D`${a ? a.status === "RECORDING" ? D`<span class="chip rec">${G()}${z(this.hass, "rec")}</span>` : D`<span class="chip sched">${H(14)}${z(this.hass, "scheduled")}</span>` : t.recordable ? D`<button class="btn primary" ?disabled=${this._busy} @click=${() => this._record(t)}>
                        ${G()}${z(this.hass, "record")}
                      </button>` : A}
                <button class="btn" @click=${() => this._dialog = t}>${z(this.hass, "program_details")}</button>` : A}
      </div>
    </div>`;
	}
	_renderSidebar(e, t, n, r) {
		let i = [
			["fav", "favorites"],
			["all", "all"],
			["vod", "list_vod"],
			["rec", "recordings"]
		], a = Date.now(), o;
		if (this._list === "rec") {
			let e = this.recordings.filter((e) => e.status === "FINISHED").sort((e, t) => (t.start ?? "").localeCompare(e.start ?? ""));
			o = e.length ? e.map((e) => {
				let n = this.channels.find((t) => t.id === e.channel_id);
				return D`<li>
              <button class="zap-main" aria-current=${t?.id === e.id} @click=${() => X(this, { recording: e })}>
                ${e.image ? D`<img class="thumb" src=${e.image} alt="" loading="lazy" />` : D`<img class="logo" src=${n?.logo ?? ""} alt="" />`}
                <div class="meta">
                  <div>${e.title}</div>
                  <div>${e.episode_title ?? n?.name ?? ""}</div>
                  <div>${e.start ? r.format(new Date(e.start)) : ""} · ${Math.round(e.duration / 60)} min</div>
                </div>
              </button>
            </li>`;
			}) : [D`<li class="note">${z(this.hass, "no_recordings")}</li>`];
		} else {
			let r = this._listChannels();
			o = r.map((r) => {
				let i = this._now[r.id], o = i ? (a - new Date(i.start).getTime()) / (new Date(i.stop).getTime() - new Date(i.start).getTime()) * 100 : 0;
				return D`<li>
          <button class="zap-main" aria-current=${!t && r.id === e?.id} @click=${() => X(this, { channel: r.id })}>
            <img class="logo" src=${r.logo} alt="" loading="lazy" />
            <div class="meta">
              <div>${r.number} · ${r.name}</div>
              <div>${i ? `${n.format(new Date(i.start))} ${i.title}` : z(this.hass, r.vod ? "on_demand" : "no_guide")}</div>
              ${i ? D`<div class="progress"><div style="width:${o}%"></div></div>` : A}
            </div>
            ${!r.hls && !window.isSecureContext ? D`<span class="lock" title=${z(this.hass, "needs_https")}>${lt()}</span>` : A}
          </button>
          ${this._star(r, !1)}
        </li>`;
			}), this._list === "fav" ? o.push(D`<li class="note">${z(this.hass, r.length ? "favorites_note" : "no_favorites_watch")}</li>`) : r.length || o.push(D`<li class="note">${z(this.hass, "no_channels_match")}</li>`);
		}
		return D`<aside class="card">
      <div class="zap-head">
        <div class="seg" role="group">
          ${i.map(([e, t]) => D`<button aria-pressed=${this._list === e} @click=${() => this._list = e}>
              ${z(this.hass, t)}
            </button>`)}
        </div>
        ${this._list === "all" || this._list === "vod" ? D`<label class="search">
              ${U()}
              <input
                type="search"
                placeholder=${z(this.hass, "filter_channels")}
                .value=${this._search}
                @input=${(e) => this._search = e.target.value}
              />
            </label>` : A}
      </div>
      <ul class="zap">
        ${o}
      </ul>
    </aside>`;
	}
	_star(e, t) {
		let n = z(this.hass, e.favorite ? "remove_favorite" : "add_favorite");
		return D`<button
      class="star-btn ${t ? "on-video" : ""}"
      aria-pressed=${e.favorite}
      title=${n}
      aria-label="${n}: ${e.name}"
      ?disabled=${this._busy}
      @click=${() => this._toggleFavorite(e)}
    >
      ${Ze()}
    </button>`;
	}
	static {
		this.styles = [K, s`
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: 16px;
        align-items: start;
      }
      .main {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
      }
      .player {
        background: #000;
        color: #fff;
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .player:fullscreen {
        border-radius: 0;
      }
      .video {
        position: relative;
        aspect-ratio: 16 / 9;
        background: #000;
      }
      .player:fullscreen .video {
        flex: 1;
        aspect-ratio: auto;
        min-height: 0;
      }
      video {
        width: 100%;
        height: 100%;
        display: block;
        cursor: pointer;
      }
      .top {
        position: absolute;
        inset: 0 0 auto 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 8px 28px 4px;
        background: linear-gradient(rgba(0, 0, 0, 0.7), transparent);
      }
      .top .meta {
        flex: 1;
        min-width: 0;
      }
      .top .meta div,
      .zap .meta div {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .top .meta div:first-child {
        font-weight: 500;
      }
      .top .meta div:last-child {
        font-size: 12.5px;
        opacity: 0.8;
      }
      .top .logo {
        width: 36px;
        height: 36px;
      }
      .icon-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 0;
        background: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: inherit;
        flex: none;
      }
      .icon-btn:hover {
        background: rgba(255, 255, 255, 0.14);
      }
      .icon-btn[aria-pressed="true"] {
        color: #4fc3f7;
      }
      .star-btn.on-video {
        color: #fff;
      }
      .star-btn.on-video:hover {
        background: rgba(255, 255, 255, 0.14);
      }
      .star-btn.on-video[aria-pressed="true"] {
        color: var(--wt-fav);
      }
      .badge {
        height: 24px;
        padding: 0 8px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.16);
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
      }
      .msg {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(10, 12, 16, 0.94);
      }
      .msg > div {
        max-width: 460px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }
      .msg h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
      }
      .msg p {
        margin: 0;
        opacity: 0.85;
      }
      .scrub {
        position: relative;
        height: 22px;
        margin: 4px 12px 0;
        cursor: pointer;
      }
      .scrub > div {
        position: absolute;
        top: 9px;
        height: 4px;
        border-radius: 2px;
      }
      .scrub .track {
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.22);
      }
      .scrub .avail {
        background: rgba(255, 255, 255, 0.45);
      }
      .scrub .played {
        left: 0;
        background: #4fc3f7;
      }
      .scrub .knob {
        top: 4px;
        width: 14px;
        height: 14px;
        margin-left: -7px;
        border-radius: 50%;
        background: #fff;
      }
      .scrub .edge {
        top: 5px;
        width: 2px;
        height: 12px;
        margin-left: -1px;
        background: var(--wt-rec);
      }
      .scrub-times {
        display: flex;
        justify-content: space-between;
        padding: 0 12px;
        font-size: 11.5px;
        opacity: 0.7;
        font-variant-numeric: tabular-nums;
      }
      .controls {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        flex-wrap: wrap;
      }
      .time {
        font-size: 12.5px;
        opacity: 0.85;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .grow {
        flex: 1;
      }
      /* vertical slider above the speaker, shown on hover or keyboard focus */
      .volume {
        position: relative;
        display: inline-flex;
      }
      .volume-pop {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 128px;
        border-radius: 20px;
        background: rgba(20, 20, 20, 0.92);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 3;
      }
      .volume:hover .volume-pop,
      .volume:focus-within .volume-pop {
        display: flex;
      }
      .volume-pop input {
        width: 104px;
        margin: 0;
        transform: rotate(-90deg);
        accent-color: #4fc3f7;
        cursor: pointer;
      }
      .pill {
        height: 32px;
        padding: 0 12px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: none;
        color: #fff;
        cursor: pointer;
        font-weight: 500;
        font-size: 13px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .pill:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .pill[aria-pressed="true"] {
        background: rgba(255, 255, 255, 0.22);
      }
      .pill.live[aria-pressed="true"] {
        background: var(--wt-rec);
        border-color: var(--wt-rec);
      }
      .pill:disabled {
        opacity: 0.4;
        cursor: default;
      }
      select {
        height: 32px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: #111;
        color: #fff;
        padding: 0 10px;
        font: inherit;
        font-size: 13px;
        max-width: 220px;
      }
      .info {
        padding: 16px;
      }
      .info h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }
      .info .sub {
        font-size: 13px;
        margin-top: 2px;
      }
      .info p {
        margin: 10px 0 0;
      }
      .info .toolbar {
        margin-top: 14px;
      }
      .error {
        padding: 12px 16px;
        color: var(--wt-rec);
      }
      .zap-head {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 12px 8px;
      }
      .zap-head .seg {
        display: flex;
        width: 100%;
      }
      .zap-head .seg button {
        flex: 1;
        padding: 0 6px;
        font-size: 13px;
      }
      .zap-head .search {
        flex: none;
        width: 100%;
      }
      .zap {
        list-style: none;
        margin: 0;
        padding: 0 0 8px;
        max-height: 640px;
        overflow-y: auto;
      }
      .zap li {
        display: flex;
        align-items: center;
        padding-right: 6px;
        border-left: 3px solid transparent;
      }
      .zap li:hover {
        background: var(--wt-chip);
      }
      .zap li:has(> .zap-main[aria-current="true"]) {
        background: var(--wt-primary-soft);
        border-left-color: var(--wt-primary);
      }
      .zap-main {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 6px 8px 9px;
        border: 0;
        background: none;
        cursor: pointer;
        text-align: left;
      }
      .zap .logo {
        width: 32px;
        height: 32px;
      }
      .zap .thumb {
        width: 56px;
        height: 32px;
        border-radius: 4px;
        object-fit: cover;
        flex: none;
      }
      .zap .meta {
        flex: 1;
        min-width: 0;
      }
      .zap .meta div:first-child {
        font-weight: 500;
      }
      .zap .meta div:not(:first-child) {
        font-size: 12.5px;
        color: var(--wt-muted);
      }
      .zap .lock {
        color: var(--wt-muted);
        display: inline-flex;
      }
      .zap li.note {
        display: block;
        padding: 10px 12px 4px 15px;
        font-size: 12.5px;
        color: var(--wt-muted);
        background: none;
      }
      .progress {
        height: 4px;
        border-radius: 2px;
        background: var(--wt-chip);
        overflow: hidden;
        margin-top: 4px;
      }
      .progress > div {
        height: 100%;
        background: var(--wt-primary);
      }
      @media (max-width: 1100px) {
        .layout {
          grid-template-columns: minmax(0, 1fr);
        }
        .zap {
          max-height: none;
        }
      }
      @media (max-width: 640px) {
        .top .badge,
        .top .pip {
          display: none;
        }
        select {
          max-width: 130px;
        }
        .content {
          padding: 12px 0;
        }
        .player {
          border-radius: 0;
        }
      }
    `];
	}
};
customElements.define("waipu-player", Mt);
// src/recordings-tab.ts
var Nt = {
	RECORDING: 0,
	SCHEDULED: 1,
	FINISHED: 2,
	FAILED: 3
};
function Pt(e, t) {
	let n = (Nt[e.status] ?? 9) - (Nt[t.status] ?? 9);
	if (n) return n;
	let r = (e.start ?? "").localeCompare(t.start ?? "");
	return e.status === "SCHEDULED" ? r : -r;
}
var Ft = class extends P {
	static {
		this.properties = {
			hass: { attribute: !1 },
			channels: { attribute: !1 },
			data: { attribute: !1 },
			_filter: { state: !0 },
			_search: { state: !0 },
			_selected: { state: !0 },
			_busy: { state: !0 }
		};
	}
	constructor() {
		super(), this._filter = "all", this._search = "", this._selected = /* @__PURE__ */ new Set(), this._busy = !1;
	}
	_shown() {
		let e = this._search.trim().toLowerCase();
		return (this.data?.recordings ?? []).filter((t) => (this._filter === "all" || t.status === this._filter) && (!e || `${t.title} ${t.episode_title ?? ""}`.toLowerCase().includes(e))).sort(Pt);
	}
	_rows(e) {
		let t = [], n = /* @__PURE__ */ new Map();
		for (let r of e) if (r.group === null) t.push(r);
		else if (n.has(r.group)) n.get(r.group).push(r);
		else {
			let e = [r];
			n.set(r.group, e), t.push(e);
		}
		return t;
	}
	_toggle(e, t) {
		let n = new Set(this._selected);
		for (let r of e) t ? n.add(r) : n.delete(r);
		this._selected = n;
	}
	async _delete(e) {
		if (!e.length || !confirm(z(this.hass, "confirm_delete", { count: e.length }))) return;
		this._busy = !0;
		let t = await Y(this, this.hass, () => R(this.hass, e));
		this._busy = !1, t && (this._toggle(e, !1), q(this, "recordings"), J(this, z(this.hass, "deleted", { count: e.length })));
	}
	async _stopSeries(e, t) {
		if (!confirm(z(this.hass, "confirm_stop_series", { title: t }))) return;
		this._busy = !0;
		let n = await Y(this, this.hass, () => Re(this.hass, e));
		this._busy = !1, n && (q(this, "recordings"), J(this, z(this.hass, "series_stopped", { title: t })));
	}
	render() {
		let e = this.data?.recordings ?? [], t = (t) => e.filter((e) => e.status === t).length, n = this.data?.recorded_hours ?? 0, r = this.data?.booked_hours ?? 0, i = this._shown(), a = i.map((e) => e.id), o = [
			"all",
			"FINISHED",
			"RECORDING",
			"SCHEDULED"
		], s = {
			all: "all",
			FINISHED: "recorded",
			RECORDING: "recording_now",
			SCHEDULED: "scheduled",
			FAILED: "all"
		};
		return D`<div class="content">
      <div class="stats">
        <div class="card stat">
          <div class="k">${z(this.hass, "storage_used")}</div>
          <div class="v">
            ${n.toFixed(1)} h
            ${r ? D`<span class="muted of">${z(this.hass, "of_hours", { hours: r })}</span>` : A}
          </div>
          ${r ? D`<div class="meter" role="meter" aria-valuemin="0" aria-valuemax=${r} aria-valuenow=${n}>
                <div style="width:${Math.min(100, n / r * 100)}%"></div>
              </div>` : A}
        </div>
        <div class="card stat"><div class="k">${z(this.hass, "recorded")}</div><div class="v">${t("FINISHED")}</div></div>
        <div class="card stat">
          <div class="k">${z(this.hass, "recording_now")}</div>
          <div class="v rec">${t("RECORDING")}</div>
        </div>
        <div class="card stat">
          <div class="k">${z(this.hass, "scheduled")}</div>
          <div class="v sched">${t("SCHEDULED")}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-h">
          <h2>${z(this.hass, "recordings")}</h2>
          <div class="toolbar">
            <div class="seg" role="group">
              ${o.map((e) => D`<button aria-pressed=${e === this._filter} @click=${() => this._filter = e}>
                  ${z(this.hass, s[e])}
                </button>`)}
            </div>
            <label class="search">
              ${U()}
              <input
                type="search"
                placeholder=${z(this.hass, "search_recordings")}
                .value=${this._search}
                @input=${(e) => this._search = e.target.value}
              />
            </label>
          </div>
        </div>
        ${this._selected.size ? D`<div class="bulk">
              <span>${z(this.hass, "selected", { count: this._selected.size })}</span>
              <button class="btn danger" ?disabled=${this._busy} @click=${() => this._delete([...this._selected])}>
                ${W()}${z(this.hass, "delete_selected")}
              </button>
              <button class="btn" @click=${() => this._selected = /* @__PURE__ */ new Set()}>${z(this.hass, "clear_selection")}</button>
            </div>` : A}
        <div class="table-box">
          ${i.length ? D`<table>
                <thead>
                  <tr>
                    <th class="check">
                      <input
                        type="checkbox"
                        .checked=${a.every((e) => this._selected.has(e))}
                        @change=${(e) => this._toggle(a, e.target.checked)}
                      />
                    </th>
                    <th class="thumb-col"></th>
                    <th>${z(this.hass, "title")}</th>
                    <th>${z(this.hass, "channel")}</th>
                    <th>${z(this.hass, "date")}</th>
                    <th>${z(this.hass, "length")}</th>
                    <th>${z(this.hass, "status")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${this._rows(i).map((e) => Array.isArray(e) ? this._renderGroup(e) : this._renderRecording(e, !1))}
                </tbody>
              </table>` : D`<p class="card-b muted">${this.data ? z(this.hass, "no_recordings") : z(this.hass, "loading")}</p>`}
        </div>
      </div>
    </div>`;
	}
	_renderGroup(e) {
		let t = e.map((e) => e.id), n = e.find((e) => e.program_id)?.program_id;
		return D`<tr class="group">
        <td class="check">
          <input
            type="checkbox"
            .checked=${t.every((e) => this._selected.has(e))}
            @change=${(e) => this._toggle(t, e.target.checked)}
          />
        </td>
        <td></td>
        <td colspan="5">${e[0].title} <span class="muted">· ${z(this.hass, "episodes", { count: e.length })}</span></td>
        <td>
          ${n ? D`<button class="btn" ?disabled=${this._busy} @click=${() => this._stopSeries(n, e[0].title)}>
                ${z(this.hass, "stop_series")}
              </button>` : A}
        </td>
      </tr>
      ${e.map((e) => this._renderRecording(e, !0))}`;
	}
	_renderRecording(e, t) {
		let n = B(this.hass, {
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit"
		}), r = this.channels.find((t) => t.id === e.channel_id), i = [e.season && e.episode ? `S${e.season}E${e.episode}` : "", e.episode_title ?? ""].filter(Boolean).join(" · ");
		return D`<tr class=${t ? "child" : ""}>
      <td class="check">
        <input
          type="checkbox"
          .checked=${this._selected.has(e.id)}
          @change=${(t) => this._toggle([e.id], t.target.checked)}
        />
      </td>
      <td>${e.image ? D`<img class="thumb" src=${e.image} alt="" loading="lazy" />` : D`<div class="thumb"></div>`}</td>
      <td class="title">
        <div>${t && i ? i : e.title}</div>
        ${!t && i ? D`<div>${i}</div>` : A}
      </td>
      <td>${r?.name ?? e.channel_id}</td>
      <td>${e.start ? n.format(new Date(e.start)) : ""}</td>
      <td>${Math.round(e.duration / 60)} min</td>
      <td>${this._status(e.status)}</td>
      <td class="actions">
        ${e.status === "FINISHED" ? D`<button
              class="play-btn"
              aria-label=${z(this.hass, "play_recording")}
              title=${z(this.hass, "play_recording")}
              @click=${() => X(this, { recording: e })}
            >
              ${Qe()}
            </button>` : A}
        <button class="icon-btn" aria-label=${z(this.hass, "delete")} title=${z(this.hass, "delete")} ?disabled=${this._busy} @click=${() => this._delete([e.id])}>
          ${W()}
        </button>
      </td>
    </tr>`;
	}
	_status(e) {
		switch (e) {
			case "RECORDING": return D`<span class="chip rec">${G()}${z(this.hass, "rec")}</span>`;
			case "SCHEDULED": return D`<span class="chip sched">${H(14)}${z(this.hass, "scheduled")}</span>`;
			case "FINISHED": return D`<span class="chip">${z(this.hass, "recorded")}</span>`;
			default: return D`<span class="chip">${e}</span>`;
		}
	}
	static {
		this.styles = [K, s`
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }
      .stat {
        padding: 16px;
      }
      .stat .k {
        font-size: 12.5px;
        color: var(--wt-muted);
      }
      .stat .v {
        font-size: 26px;
        font-weight: 500;
        margin-top: 2px;
      }
      .stat .v.rec {
        color: var(--wt-rec);
      }
      .stat .v.sched {
        color: var(--wt-sched);
      }
      .of {
        font-size: 15px;
        font-weight: 400;
      }
      .meter {
        height: 8px;
        border-radius: 4px;
        background: var(--wt-chip);
        overflow: hidden;
        margin-top: 10px;
      }
      .meter > div {
        height: 100%;
        background: var(--wt-primary);
      }
      .bulk {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        background: var(--wt-primary-soft);
        color: var(--wt-primary);
        font-weight: 500;
        flex-wrap: wrap;
      }
      .table-box {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 720px;
      }
      th {
        text-align: left;
        font-size: 12px;
        font-weight: 500;
        color: var(--wt-muted);
        padding: 8px;
        border-bottom: 1px solid var(--wt-line);
      }
      td {
        padding: 8px;
        border-bottom: 1px solid var(--wt-line);
        vertical-align: middle;
      }
      .check {
        width: 36px;
      }
      .thumb-col {
        width: 88px;
      }
      td.actions {
        white-space: nowrap;
      }
      tr.group td {
        background: var(--wt-chip);
        font-weight: 500;
      }
      tr.child td.title {
        padding-left: 28px;
      }
      .thumb {
        width: 72px;
        height: 40px;
        border-radius: 6px;
        object-fit: cover;
        background: var(--wt-chip);
        display: block;
      }
      .title div:first-child {
        font-weight: 500;
      }
      .title div:nth-child(2) {
        font-size: 12.5px;
        color: var(--wt-muted);
      }
      .icon-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 0;
        background: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--wt-muted);
      }
      .icon-btn:hover {
        background: var(--wt-chip);
        color: var(--wt-rec);
      }
    `];
	}
};
customElements.define("waipu-recordings-tab", Ft);
// src/waipu-tv-panel.ts
var It = "waipu-tv.last-watched", Lt = class extends P {
	static {
		this.properties = {
			hass: { attribute: !1 },
			narrow: { type: Boolean },
			route: { attribute: !1 },
			_tab: { state: !0 },
			_channels: { state: !0 },
			_recordings: { state: !0 },
			_watch: { state: !0 },
			_toast: { state: !0 }
		};
	}
	constructor() {
		super(), this._loaded = !1, this._tab = "guide", this.addEventListener("waipu-changed", (e) => this._reload(e.detail.what)), this.addEventListener("waipu-toast", (e) => this._showToast(e.detail.message)), this.addEventListener("waipu-watch", (e) => {
			let t = e.detail.target, n = t ? "recording" in t ? `/recording/${encodeURIComponent(t.recording.id)}` : `/watch/${encodeURIComponent(t.channel)}${t.fromStart ? "/from-start" : ""}` : "";
			this._navigate(n, !!t && !!this._watch), window.scrollTo(0, 0);
		});
	}
	willUpdate() {
		this.hass && !this._loaded && (this._loaded = !0, this._reload("channels"), this._reload("recordings")), this._followRoute();
	}
	_followRoute() {
		let e = this.route?.path ?? "";
		if (e === "/watch") {
			if (!this._channels) return;
			let e = null;
			try {
				e = localStorage.getItem(It);
			} catch {}
			let t = this._channels.channels.find((e) => e.favorite) ?? this._channels.channels[0];
			this._navigate(e ?? (t ? `/watch/${encodeURIComponent(t.id)}` : ""), !0);
			return;
		}
		let t = e.match(/^\/(watch|recording)\/([^/]+)(\/from-start)?$/);
		if (!t) {
			this._watch = this._watchPath = void 0;
			return;
		}
		let [, n, r, i] = t;
		if (e !== this._watchPath && (n === "watch" ? this._channels : this._recordings)) {
			this._watchPath = e;
			try {
				localStorage.setItem(It, e);
			} catch {}
			if (n === "watch") this._watch = {
				channel: decodeURIComponent(r),
				fromStart: !!i
			};
			else {
				let e = this._recordings.recordings.find((e) => e.id === decodeURIComponent(r));
				this._watch = e ? { recording: e } : void 0;
			}
		}
	}
	_linkPending() {
		let e = this.route?.path ?? "";
		return (e === "/watch" || /^\/(watch|recording)\//.test(e)) && e !== this._watchPath;
	}
	_navigate(e, t = !1) {
		let n = `${this.route?.prefix ?? "/waipu-tv"}${e}`;
		t ? history.replaceState(history.state, "", n) : history.pushState(null, "", n), window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: t } }));
	}
	async _reload(e) {
		try {
			e === "channels" ? this._channels = await Pe(this.hass) : this._recordings = await Ie(this.hass);
		} catch (e) {
			this._showToast(z(this.hass, "error", { message: e.message ?? String(e) }));
		}
	}
	_showToast(e) {
		this._toast = e, window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = void 0, 4e3);
	}
	async _refresh() {
		this._showToast(z(this.hass, "refreshing")), await this.hass.callService("button", "press", { entity_id: "button.waipu_tv_refresh" }), await Promise.all([this._reload("channels"), this._reload("recordings")]);
	}
	render() {
		if (!this.hass) return A;
		let e = [
			"guide",
			"watch",
			"recordings"
		];
		return this.hass.user?.is_admin && e.push("playlists"), D`
      <header>
        <div class="row">
          <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
          <h1>waipu.tv</h1>
          ${this._channels?.subscription ? D`<span class="pill">${this._channels.subscription}</span>` : A}
          <button class="icon-btn" title=${z(this.hass, "refresh")} aria-label=${z(this.hass, "refresh")} @click=${this._refresh}>
            ${Je()}
          </button>
        </div>
        <div class="tabs" role="tablist">
          ${e.map((e) => D`<button
              role="tab"
              aria-selected=${e === "watch" ? !!this._watch : !this._watch && e === this._tab}
              @click=${() => {
			e === "watch" ? this._watch || this._navigate("/watch") : (this._tab = e, this._watch && this._navigate(""));
		}}
            >
              ${z(this.hass, e)}
            </button>`)}
        </div>
      </header>
      ${this._watch ? D`<waipu-player
            .hass=${this.hass}
            .channels=${this._channels?.channels ?? []}
            .recordings=${this._recordings?.recordings ?? []}
            .instantRestart=${this._channels?.instant_restart ?? !1}
            .audioLanguage=${this._channels?.audio_language ?? null}
            .target=${this._watch}
          ></waipu-player>` : this._linkPending() ? D`<p class="pending">${z(this.hass, "loading")}</p>` : this._renderTab()}
      ${this._toast ? D`<div class="toast" role="status">${this._toast}</div>` : A}
    `;
	}
	_renderTab() {
		let e = this._channels?.channels ?? [], t = this._recordings?.recordings ?? [];
		switch (this._tab) {
			case "guide": return D`<waipu-guide-tab .hass=${this.hass} .channels=${e} .recordings=${t}></waipu-guide-tab>`;
			case "recordings": return D`<waipu-recordings-tab .hass=${this.hass} .channels=${e} .data=${this._recordings}></waipu-recordings-tab>`;
			case "playlists": return D`<waipu-playlists-tab .hass=${this.hass}></waipu-playlists-tab>`;
		}
	}
	static {
		this.styles = [K, s`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--primary-background-color);
      }
      header {
        background: var(--app-header-background-color, var(--primary-color));
        color: var(--app-header-text-color, #fff);
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .row {
        height: var(--header-height, 56px);
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 8px 0 4px;
      }
      h1 {
        font-size: 20px;
        font-weight: 400;
        margin: 0 0 0 12px;
        flex: 1;
      }
      .pill {
        padding: 2px 10px;
        border-radius: 999px;
        background: var(--wt-chip);
        font-size: 12px;
        font-weight: 500;
      }
      .icon-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 0;
        background: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: inherit;
      }
      .icon-btn:hover {
        background: rgba(127, 127, 127, 0.16);
      }
      .tabs {
        display: flex;
        padding: 0 8px;
        overflow-x: auto;
      }
      .tabs button {
        height: 48px;
        padding: 0 20px;
        border: 0;
        background: none;
        cursor: pointer;
        color: inherit;
        opacity: 0.8;
        border-bottom: 2px solid transparent;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
      }
      .tabs button[aria-selected="true"] {
        opacity: 1;
        border-bottom-color: currentColor;
      }
      .pending {
        padding: 16px;
        color: var(--secondary-text-color);
      }
      .toast {
        position: fixed;
        left: 50%;
        bottom: 24px;
        transform: translateX(-50%);
        background: #323232;
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 20;
        max-width: calc(100vw - 32px);
      }
    `];
	}
};
customElements.define("waipu-tv-panel", Lt);
