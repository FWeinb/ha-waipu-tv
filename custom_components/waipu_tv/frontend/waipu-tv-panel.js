// node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: ee, getOwnPropertySymbols: te, getPrototypeOf: ne } = Object, f = globalThis, p = f.trustedTypes, re = p ? p.emptyScript : "", ie = f.reactiveElementPolyfillSupport, m = (e, t) => e, h = {
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
}, ae = (e, t) => !l(e, t), oe = {
	attribute: !0,
	type: String,
	converter: h,
	reflect: !1,
	useDefault: !1,
	hasChanged: ae
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var g = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = oe) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
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
		if (this.hasOwnProperty(m("elementProperties"))) return;
		let e = ne(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(m("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(m("properties"))) {
			let e = this.properties, t = [...ee(e), ...te(e)];
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
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
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
		return s(e, this.constructor.elementStyles), e;
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
			let i = (n.converter?.toAttribute === void 0 ? h : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? h : e.converter;
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
g.elementStyles = [], g.shadowRootOptions = { mode: "open" }, g[m("elementProperties")] = /* @__PURE__ */ new Map(), g[m("finalized")] = /* @__PURE__ */ new Map(), ie?.({ ReactiveElement: g }), (f.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var _ = globalThis, se = (e) => e, v = _.trustedTypes, ce = v ? v.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, le = "$lit$", y = `lit$${Math.random().toFixed(9).slice(2)}$`, b = "?" + y, ue = `<${b}>`, x = document, S = () => x.createComment(""), C = (e) => e === null || typeof e != "object" && typeof e != "function", w = Array.isArray, de = (e) => w(e) || typeof e?.[Symbol.iterator] == "function", T = "[ 	\n\f\r]", E = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, fe = /-->/g, pe = />/g, D = RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), me = /'/g, he = /"/g, ge = /^(?:script|style|textarea|title)$/i, _e = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), O = _e(1), k = _e(2), A = Symbol.for("lit-noChange"), j = Symbol.for("lit-nothing"), ve = /* @__PURE__ */ new WeakMap(), M = x.createTreeWalker(x, 129);
function N(e, t) {
	if (!w(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return ce === void 0 ? t : ce.createHTML(t);
}
var ye = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = E;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === E ? c[1] === "!--" ? o = fe : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = D) : (ge.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = D) : o = pe : o === D ? c[0] === ">" ? (o = i ?? E, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? D : c[3] === "\"" ? he : me) : o === he || o === me ? o = D : o === fe || o === pe ? o = E : (o = D, i = void 0);
		let d = o === D && e[t + 1].startsWith("/>") ? " " : "";
		a += o === E ? n + ue : l >= 0 ? (r.push(s), n.slice(0, l) + le + n.slice(l) + y + d) : n + y + (l === -2 ? t : d);
	}
	return [N(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, P = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = ye(t, n);
		if (this.el = e.createElement(l, r), M.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = M.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(le)) {
					let t = u[o++], n = i.getAttribute(e).split(y), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? xe : r[1] === "?" ? Se : r[1] === "@" ? Ce : L
					}), i.removeAttribute(e);
				} else e.startsWith(y) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (ge.test(i.tagName)) {
					let e = i.textContent.split(y), t = e.length - 1;
					if (t > 0) {
						i.textContent = v ? v.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], S()), M.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], S());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === b) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(y, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += y.length - 1;
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
function F(e, t, n = e, r) {
	if (t === A) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = C(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = F(e, i._$AS(e, t.values), i, r)), t;
}
var be = class {
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
		M.currentNode = r;
		let i = M.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new I(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new we(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = M.nextNode(), a++);
		}
		return M.currentNode = x, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, I = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = j, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = F(this, e, t), C(e) ? e === j || e == null || e === "" ? (this._$AH !== j && this._$AR(), this._$AH = j) : e !== this._$AH && e !== A && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? de(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== j && C(this._$AH) ? this._$AA.nextSibling.data = e : this.T(x.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = P.createElement(N(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new be(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = ve.get(e.strings);
		return t === void 0 && ve.set(e.strings, t = new P(e)), t;
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
}, L = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = j, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = j;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = F(this, e, t, 0), a = !C(e) || e !== this._$AH && e !== A, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = F(this, r[n + o], t, o), s === A && (s = this._$AH[o]), a ||= !C(s) || s !== this._$AH[o], s === j ? e = j : e !== j && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === j ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, xe = class extends L {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === j ? void 0 : e;
	}
}, Se = class extends L {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== j);
	}
}, Ce = class extends L {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = F(this, e, t, 0) ?? j) === A) return;
		let n = this._$AH, r = e === j && n !== j || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== j && (n === j || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, we = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		F(this, e);
	}
}, Te = _.litHtmlPolyfillSupport;
Te?.(P, I), (_.litHtmlVersions ??= []).push("3.3.3");
var Ee = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new I(t.insertBefore(S(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, R = globalThis, z = class extends g {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ee(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return A;
	}
};
z._$litElement$ = !0, z.finalized = !0, R.litElementHydrateSupport?.({ LitElement: z });
var De = R.litElementPolyfillSupport;
De?.({ LitElement: z }), (R.litElementVersions ??= []).push("4.2.2");
// src/api.ts
var B = (e, t, n = {}) => e.callWS({
	type: `waipu_tv/${t}`,
	...n
}), Oe = (e) => B(e, "channels"), V = (e, t, n, r) => B(e, "guide", {
	start: t.toISOString(),
	end: n.toISOString(),
	...r ? { channels: r } : {}
}), ke = (e, t) => B(e, "program", { program_id: t }), Ae = (e) => B(e, "recordings"), je = (e) => B(e, "playlists"), H = (e, t, n = !1) => B(e, "record", {
	program_id: t,
	series: n
}), Me = (e, t) => B(e, "delete_recordings", { recording_ids: t }), Ne = (e, t, n) => B(e, "set_favorite", {
	channel: t,
	favorite: n
}), Pe = {
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
	no_favorites: "No favorites yet: add channels on the Favorites tab.",
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
	your_favorites: "Your favorites",
	favorites_note: "Synced with your waipu.tv account, so changes show up in the waipu.tv apps too. Sorted by channel number.",
	all: "All",
	live_tv: "Live TV",
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
	param_catchup: "Catch-up: players can restart running and recently started programs from the guide.",
	param_timeshift: "Live channels open at the start of the running program so you can rewind.",
	param_hls_proxy: "Serve HLS playlists through Home Assistant, for ffmpeg-based players (VLC, Jellyfin).",
	param_filter: "Channel selection of the guide: all, favorites, live or vod.",
	needs_restart: "Needs instant restart, which your waipu.tv package doesn't include.",
	error: "waipu.tv: {message}"
}, Fe = {
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
	no_favorites: "Noch keine Favoriten: füge Sender im Tab Favoriten hinzu.",
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
	your_favorites: "Deine Favoriten",
	favorites_note: "Mit deinem waipu.tv-Konto synchronisiert, Änderungen erscheinen auch in den waipu.tv-Apps. Nach Sendernummer sortiert.",
	all: "Alle",
	live_tv: "Live-TV",
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
	param_catchup: "Catch-up: Player können laufende und kürzlich begonnene Sendungen aus dem Programm neu starten.",
	param_timeshift: "Live-Sender starten am Beginn der laufenden Sendung, sodass du zurückspulen kannst.",
	param_hls_proxy: "HLS-Playlists über Home Assistant ausliefern, für ffmpeg-basierte Player (VLC, Jellyfin).",
	param_filter: "Senderauswahl des Programms: all, favorites, live oder vod.",
	needs_restart: "Benötigt Instant Restart, das dein waipu.tv-Paket nicht enthält.",
	error: "waipu.tv: {message}"
};
function U(e, t, n = {}) {
	return (e.language?.startsWith("de") ? Fe : Pe)[t].replace(/\{(\w+)\}/g, (e, t) => String(n[t] ?? ""));
}
function W(e, t) {
	return new Intl.DateTimeFormat(e.language, {
		timeZone: e.config.time_zone,
		...t
	});
}
// src/icons.ts
var G = (e, t = 20) => k`<svg class="i" viewBox="0 0 24 24" style="width:${t}px;height:${t}px" aria-hidden="true">${e}</svg>`, Ie = () => G(k`<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>`), K = (e = 20) => G(k`<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>`, e), q = () => G(k`<circle cx="11" cy="11" r="6"/><path d="m20 20-4.3-4.3"/>`), Le = () => G(k`<path d="M6 6l12 12M18 6 6 18"/>`), Re = () => G(k`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>`), ze = () => G(k`<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>`), Be = () => G(k`<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>`), J = (e = 14) => k`<svg class="i" viewBox="0 0 24 24" style="width:${e}px;height:${e}px;fill:currentColor;stroke:none" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>`, Y = o`
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
  .logo {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    flex: none;
    object-fit: contain;
    background: var(--wt-chip);
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
function X(e, t) {
	e.dispatchEvent(new CustomEvent("waipu-changed", {
		detail: { what: t },
		bubbles: !0,
		composed: !0
	}));
}
function Z(e, t) {
	e.dispatchEvent(new CustomEvent("waipu-toast", {
		detail: { message: t },
		bubbles: !0,
		composed: !0
	}));
}
async function Q(e, t, n) {
	try {
		return await n(), !0;
	} catch (n) {
		return Z(e, U(t, "error", { message: n?.message ?? String(n) })), !1;
	}
}
// src/favorites-tab.ts
var Ve = class extends z {
	static {
		this.properties = {
			hass: { attribute: !1 },
			channels: { attribute: !1 },
			_filter: { state: !0 },
			_search: { state: !0 },
			_busy: { state: !0 }
		};
	}
	constructor() {
		super(), this._filter = "all", this._search = "";
	}
	async _toggle(e) {
		this._busy = e.id;
		let t = await Q(this, this.hass, () => Ne(this.hass, e.id, !e.favorite));
		this._busy = void 0, t && (X(this, "channels"), Z(this, U(this.hass, e.favorite ? "favorite_removed" : "favorite_added", { name: e.name })));
	}
	_star(e) {
		let t = U(this.hass, e.favorite ? "remove_favorite" : "add_favorite");
		return O`<button
      class="star-btn"
      aria-pressed=${e.favorite}
      title=${t}
      aria-label="${t}: ${e.name}"
      ?disabled=${this._busy === e.id}
      @click=${() => this._toggle(e)}
    >
      ${Be()}
    </button>`;
	}
	_kind(e) {
		return [
			`${e.number}`,
			U(this.hass, e.vod ? "on_demand" : "live_tv"),
			...e.visible ? [] : [U(this.hass, "hidden")]
		].join(" · ");
	}
	render() {
		let e = this.channels ?? [], t = e.filter((e) => e.favorite), n = this._search.trim().toLowerCase(), r = e.filter((e) => (this._filter === "hidden" ? !e.visible : e.visible) && (this._filter !== "live" || !e.vod) && (this._filter !== "vod" || e.vod) && (!n || e.name.toLowerCase().includes(n) || e.id.includes(n))), i = [
			"all",
			"live",
			"vod",
			"hidden"
		], a = {
			all: "all",
			live: "live_tv",
			vod: "on_demand",
			hidden: "hidden"
		};
		return O`<div class="content">
      <div class="layout">
        <div class="card">
          <div class="card-h">
            <h2>${U(this.hass, "your_favorites")}</h2>
            <span class="chip">${t.length}</span>
          </div>
          <div class="note">${Ie()}${U(this.hass, "favorites_note")}</div>
          <div class="card-b">
            <ul class="list">
              ${t.map((e) => O`<li>
                  <img class="logo" src=${e.logo} alt="" loading="lazy" />
                  <div class="meta">
                    <div>${e.name}</div>
                    <div>${this._kind(e)}</div>
                  </div>
                  ${this._star(e)}
                </li>`)}
            </ul>
          </div>
        </div>
        <div class="card">
          <div class="card-h">
            <h2>${U(this.hass, "all_channels")}</h2>
            <div class="toolbar">
              <div class="seg" role="group">
                ${i.map((e) => O`<button aria-pressed=${e === this._filter} @click=${() => this._filter = e}>
                    ${U(this.hass, a[e])}
                  </button>`)}
              </div>
              <label class="search">
                ${q()}
                <input
                  type="search"
                  placeholder=${U(this.hass, "filter_channels")}
                  .value=${this._search}
                  @input=${(e) => this._search = e.target.value}
                />
              </label>
            </div>
          </div>
          <div class="card-b">
            <div class="grid">
              ${r.map((e) => O`<div class="tile">
                  <img class="logo" src=${e.logo} alt="" loading="lazy" />
                  <div class="meta">
                    <div>${e.name}</div>
                    <div>${this._kind(e)}</div>
                  </div>
                  ${this._star(e)}
                </div>`)}
            </div>
          </div>
        </div>
      </div>
    </div>`;
	}
	static {
		this.styles = [Y, o`
      .layout {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: flex-start;
      }
      .layout > .card:first-child {
        flex: 1 1 340px;
      }
      .layout > .card:last-child {
        flex: 999 1 560px;
        min-width: 0;
      }
      .note {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12.5px;
        color: var(--wt-muted);
        padding: 0 16px 12px;
      }
      .note svg {
        width: 16px !important;
        height: 16px !important;
      }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .list li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 4px;
        border-bottom: 1px solid var(--wt-line);
      }
      .list li:last-child {
        border-bottom: 0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 8px;
      }
      .tile {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 4px 8px 10px;
        border: 1px solid var(--wt-line);
        border-radius: 10px;
        min-width: 0;
      }
      .meta {
        flex: 1;
        min-width: 0;
      }
      .meta div:first-child {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .meta div:last-child {
        font-size: 12px;
        color: var(--wt-muted);
      }
    `];
	}
};
customElements.define("waipu-favorites-tab", Ve);
// src/program-dialog.ts
var He = class extends z {
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
		this.renderRoot.querySelector("dialog").showModal(), ke(this.hass, this.program.id).then((e) => this._description = e.textContent?.descLong || e.textContent?.descShort || "").catch(() => this._description = "");
	}
	_backdropClick(e) {
		e.target === e.currentTarget && this._close();
	}
	_close() {
		this.renderRoot.querySelector("dialog")?.close();
	}
	async _run(e, t, n) {
		this._busy = !0;
		let r = await Q(this, this.hass, e);
		this._busy = !1, r && (X(this, n), Z(this, t), n === "recordings" && this._close());
	}
	render() {
		let e = this.program, t = new Date(e.start).getTime(), n = new Date(e.stop).getTime(), r = Date.now(), i = W(this.hass, {
			hour: "2-digit",
			minute: "2-digit"
		}), a = W(this.hass, {
			weekday: "long",
			day: "numeric",
			month: "long"
		}), o = t <= r && r < n, s = n <= r, c = this.recording, l = this.channel?.favorite ?? !1;
		return O`<dialog
      @close=${() => this.dispatchEvent(new CustomEvent("closed"))}
      @click=${this._backdropClick}
    >
      <div class="dlg-h">
        ${this.channel ? O`<img class="logo" src=${this.channel.logo} alt="" />` : j}
        <div class="meta">
          <div class="muted small">${this.channel?.name ?? e.channel_id}</div>
          <h3>${e.title}</h3>
          <div class="muted small">
            ${a.format(t)}, ${i.format(t)}–${i.format(n)}
            ${e.episode_title ? O` · ${e.episode_title}` : j}
          </div>
        </div>
        ${this.channel ? O`<button
              class="star-btn"
              aria-pressed=${l}
              title=${U(this.hass, l ? "remove_favorite" : "add_favorite")}
              aria-label=${U(this.hass, l ? "remove_favorite" : "add_favorite")}
              ?disabled=${this._busy}
              @click=${() => this._run(() => Ne(this.hass, this.channel.id, !l), U(this.hass, l ? "favorite_removed" : "favorite_added", { name: this.channel.name }), "channels")}
            >
              ${Be()}
            </button>` : j}
        <button class="icon-btn" aria-label=${U(this.hass, "close")} @click=${this._close}>${Le()}</button>
      </div>
      <div class="dlg-b">
        <div class="toolbar">
          ${o ? O`<span class="chip live"><span class="dot"></span>${U(this.hass, "live")}</span>` : j}
          ${s ? O`<span class="chip">${U(this.hass, "ended")}</span>` : j}
          ${c?.status === "RECORDING" ? O`<span class="chip rec">${J()}${U(this.hass, "rec")}</span>` : j}
          ${c?.status === "SCHEDULED" ? O`<span class="chip sched">${K(14)}${U(this.hass, "scheduled")}</span>` : j}
          ${e.genre ? O`<span class="chip">${e.genre}</span>` : j}
        </div>
        ${o ? O`<div class="progress"><div style="width:${(r - t) / (n - t) * 100}%"></div></div>` : j}
        ${e.image ? O`<img class="still" src=${e.image} alt="" />` : j}
        <p>${this._description ?? U(this.hass, "loading")}</p>
        ${e.recordable ? j : O`<p class="muted small">${U(this.hass, "not_recordable")}</p>`}
      </div>
      <div class="dlg-a">
        ${c ? O`<button
              class="btn danger"
              ?disabled=${this._busy}
              @click=${() => this._run(() => Me(this.hass, [c.id]), U(this.hass, "recording_cancelled"), "recordings")}
            >
              ${U(this.hass, "cancel_recording")}
            </button>` : j}
        ${!c && !s && e.recordable && e.series_id ? O`<button
              class="btn"
              ?disabled=${this._busy}
              @click=${() => this._run(() => H(this.hass, e.id, !0), U(this.hass, "series_started", { title: e.title }), "recordings")}
            >
              ${U(this.hass, "record_series")}
            </button>` : j}
        ${!c && !s && e.recordable ? O`<button
              class="btn primary"
              ?disabled=${this._busy}
              @click=${() => this._run(() => H(this.hass, e.id), U(this.hass, "recording_started", { title: e.title }), "recordings")}
            >
              ${J()}${U(this.hass, "record")}
            </button>` : j}
      </div>
    </dialog>`;
	}
	static {
		this.styles = [Y, o`
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
customElements.define("waipu-program-dialog", He);
// src/guide-tab.ts
var Ue = 4, $ = 6e4, We = class extends z {
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
	constructor() {
		super(), this._days = [], this._scrollToNow = !0, this._day = 0, this._all = !1, this._search = "", this._now = Date.now();
	}
	connectedCallback() {
		super.connectedCallback(), this._clock = window.setInterval(() => this._now = Date.now(), $);
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
				this._days = (await V(this.hass, e, e)).days;
			}
			let e = new Date(this._days[this._day]), t = this._day + 1 < this._days.length ? new Date(this._days[this._day + 1]) : null;
			this._guide = await V(this.hass, e, t ?? new Date(e.getTime() + 1440 * $), this._all ? void 0 : this._favoriteIds);
		} catch (e) {
			Z(this, U(this.hass, "error", { message: e.message ?? String(e) }));
		}
	}
	updated() {
		this._scrollToNow && this._guide && (this._scrollToNow = !1, this._jumpToNow());
	}
	_dayRange() {
		let e = new Date(this._days[this._day]).getTime(), t = this._days[this._day + 1];
		return [e, t ? new Date(t).getTime() : e + 1440 * $];
	}
	_x(e, t) {
		return (e - t) / $ * Ue;
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
		let e = W(this.hass, {
			weekday: "short",
			day: "numeric"
		});
		return O`
      <div class="content">
        <div class="card">
          <div class="card-h">
            <h2>${U(this.hass, "tv_guide")}</h2>
            <div class="toolbar">
              <div class="seg" role="group">
                ${this._days.map((t, n) => O`<button aria-pressed=${n === this._day} @click=${() => this._selectDay(n)}>
                    ${n === 0 ? U(this.hass, "today") : e.format(new Date(t))}
                  </button>`)}
              </div>
              <div class="seg" role="group">
                <button aria-pressed=${!this._all} @click=${() => this._all = !1}>
                  ${U(this.hass, "favorites")}
                </button>
                <button aria-pressed=${this._all} @click=${() => this._all = !0}>
                  ${U(this.hass, "all_channels")}
                </button>
              </div>
              <button class="btn" @click=${this._now_clicked}>${K()}${U(this.hass, "now")}</button>
              <label class="search">
                ${q()}
                <input
                  type="search"
                  placeholder=${U(this.hass, "search_programs")}
                  .value=${this._search}
                  @input=${(e) => this._search = e.target.value}
                />
              </label>
            </div>
          </div>
          ${this._renderGrid()}
          <div class="legend">
            <span><span class="chip live"><span class="dot"></span>${U(this.hass, "live")}</span>${U(this.hass, "legend_live")}</span>
            <span><span class="chip rec">${J()}${U(this.hass, "rec")}</span>${U(this.hass, "legend_rec")}</span>
            <span><span class="chip sched">${K(14)}${U(this.hass, "scheduled")}</span>${U(this.hass, "legend_sched")}</span>
            <span>${U(this.hass, "legend_hint")}</span>
          </div>
        </div>
      </div>
      ${this._selected ? O`<waipu-program-dialog
            .hass=${this.hass}
            .program=${this._selected}
            .channel=${this.channels.find((e) => e.id === this._selected.channel_id)}
            .recording=${this._recordingsByProgram().get(this._selected.id)}
            @closed=${() => this._selected = void 0}
          ></waipu-program-dialog>` : j}
    `;
	}
	_selectDay(e) {
		this._day = e, this._scrollToNow = !0;
	}
	_now_clicked() {
		this._day === 0 ? this._jumpToNow() : this._selectDay(0);
	}
	_renderGrid() {
		if (!this._guide || !this._days.length) return O`<p class="card-b muted">${U(this.hass, "loading")}</p>`;
		let e = this._all ? Object.keys(this._guide.programs) : this._favoriteIds, t = this.channels.filter((t) => e.includes(t.id));
		if (!t.length) return O`<p class="card-b muted">${U(this.hass, "no_favorites")}</p>`;
		let [n, r] = this._dayRange(), i = this._x(r, n), a = W(this.hass, {
			hour: "2-digit",
			minute: "2-digit"
		}), o = [];
		for (let e = n; e < r; e += 30 * $) o.push(e);
		let s = this._now >= n && this._now < r, c = this._recordingsByProgram(), l = this._search.trim().toLowerCase();
		return O`
      <div class="epg-box">
        <div class="epg" style="--track:${i}px">
          <div class="epg-head">
            <div class="epg-corner">${U(this.hass, "channel")}</div>
            <div class="epg-ticks" style="width:${i}px">
              ${o.map((e) => O`<span style="left:${this._x(e, n)}px">${a.format(e)}</span>`)}
            </div>
          </div>
          ${t.map((e) => O`<div class="epg-row">
              <div class="epg-ch">
                <span class="num">${e.number}</span>
                <img class="logo" src=${e.logo} alt="" loading="lazy" />
                <span class="name">${e.name}</span>
              </div>
              <div class="epg-track" style="width:${i}px">
                ${(this._guide.programs[e.id] ?? []).map((e) => this._renderProgram(e, n, r, a, c.get(e.id), l))}
              </div>
            </div>`)}
          ${s ? O`<div class="now-line" style="left:calc(var(--ch) + ${this._x(this._now, n)}px)">
                <span>${a.format(this._now)}</span>
              </div>` : j}
        </div>
      </div>
    `;
	}
	_renderProgram(e, t, n, r, i, a) {
		let o = new Date(e.start).getTime(), s = new Date(e.stop).getTime(), c = this._x(Math.max(o, t), t), l = this._x(Math.min(s, n), t), u = o <= this._now && this._now < s;
		return O`<button
      class=${[
			"prog",
			s <= this._now ? "past" : "",
			u ? "live" : "",
			i?.status === "RECORDING" ? "rec" : i ? "sched" : "",
			a && !`${e.title} ${e.episode_title ?? ""}`.toLowerCase().includes(a) ? "dim" : ""
		].join(" ")}
      style="left:${c}px;width:${Math.max(l - c - 2, 2)}px"
      title="${r.format(o)}–${r.format(s)} ${e.title}"
      @click=${() => this._selected = e}
    >
      <span class="t">
        ${i?.status === "RECORDING" ? O`<span class="flag">${J()}</span>` : j}
        ${i?.status === "SCHEDULED" ? O`<span class="flag">${K(14)}</span>` : j}
        <span>${e.title}</span>
      </span>
      <span class="s">${r.format(o)}${e.episode_title ? ` · ${e.episode_title}` : ""}</span>
      ${u ? O`<span class="bar" style="width:${(this._now - o) / (s - o) * 100}%"></span>` : j}
    </button>`;
	}
	static {
		this.styles = [Y, o`
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
      .now-line {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--wt-rec);
        z-index: 5;
        pointer-events: none;
      }
      .now-line span {
        position: absolute;
        top: 8px;
        left: -20px;
        width: 42px;
        text-align: center;
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
customElements.define("waipu-guide-tab", We);
// src/playlists-tab.ts
var Ge = [
	"favorites",
	"all",
	"live",
	"vod",
	"recordings",
	"epg"
], Ke = class extends z {
	static {
		this.properties = {
			hass: { attribute: !1 },
			_data: { state: !0 }
		};
	}
	firstUpdated() {
		je(this.hass).then((e) => this._data = e).catch((e) => Z(this, U(this.hass, "error", { message: e.message ?? String(e) })));
	}
	async _copy(e) {
		try {
			await navigator.clipboard.writeText(e), Z(this, U(this.hass, "copied"));
		} catch {
			Z(this, U(this.hass, "copy_failed"));
		}
	}
	render() {
		let e = this._data;
		return O`<div class="content">
      <div class="card">
        <div class="card-h">
          <h2>${U(this.hass, "playlist_server")}</h2>
          <span class="chip">${U(this.hass, "admins_only")}</span>
          ${e ? e.enabled ? O`<span class="chip live"><span class="dot"></span>${U(this.hass, "running")}</span>` : O`<span class="chip">${U(this.hass, "off")}</span>` : j}
        </div>
        <div class="card-b">
          ${e ? e.enabled ? O`<ul class="urls">
                  ${Ge.map((t) => {
			let n = location.origin + e.urls[t];
			return O`<li>
                      <div class="meta">
                        <div>${U(this.hass, `url_${t}`)}</div>
                        <div class="mono">${n}</div>
                      </div>
                      <button class="btn" @click=${() => this._copy(n)}>
                        ${ze()}${U(this.hass, "copy")}
                      </button>
                    </li>`;
		})}
                </ul>` : O`<p>${U(this.hass, "playlists_off")}</p>` : O`<p class="muted">${U(this.hass, "loading")}</p>`}
        </div>
        ${e ? O`<div class="card-b actions">
              <a class="btn" href="/config/integrations/integration/waipu_tv">${U(this.hass, "open_options")}</a>
            </div>` : j}
      </div>
      ${e?.enabled ? this._renderOptions(e) : j}
      <p class="muted note">${U(this.hass, "playlists_note")}</p>
    </div>`;
	}
	_renderOptions(e) {
		let t = (e) => U(this.hass, e ? "on" : "off_value"), n = (e) => U(this.hass, "from_options", { value: t(e) }), r = U(this.hass, "m3u_playlists"), i = e.instant_restart ? "" : ` ${U(this.hass, "needs_restart")}`, a = [
			[
				"hidden",
				"0 | 1",
				t(!1),
				`${r}, epg.xml`,
				U(this.hass, "param_hidden")
			],
			[
				"drm",
				"0 | 1",
				t(!0),
				`${r}, epg.xml`,
				U(this.hass, "param_drm")
			],
			[
				"protocol",
				"auto | hls | dash",
				"auto",
				`${r}, recordings.m3u`,
				U(this.hass, "param_protocol")
			],
			[
				"catchup",
				"0 | 1",
				n(e.defaults.catchup),
				r,
				U(this.hass, "param_catchup") + i
			],
			[
				"timeshift",
				"0 | 1",
				n(e.defaults.timeshift),
				r,
				U(this.hass, "param_timeshift") + i
			],
			[
				"hls_proxy",
				"0 | 1",
				n(e.defaults.hls_proxy),
				r,
				U(this.hass, "param_hls_proxy")
			],
			[
				"filter",
				"all | favorites | live | vod",
				"all",
				"epg.xml",
				U(this.hass, "param_filter")
			]
		];
		return O`<div class="card">
      <div class="card-h"><h2>${U(this.hass, "options_title")}</h2></div>
      <div class="card-b">
        <p class="intro">${U(this.hass, "options_intro")}</p>
        <div class="table-box">
          <table>
            <thead>
              <tr>
                <th>${U(this.hass, "parameter")}</th>
                <th>${U(this.hass, "values")}</th>
                <th>${U(this.hass, "default")}</th>
                <th>${U(this.hass, "applies_to")}</th>
                <th>${U(this.hass, "meaning")}</th>
              </tr>
            </thead>
            <tbody>
              ${a.map(([e, t, n, r, i]) => O`<tr>
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
		this.styles = [Y, o`
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
customElements.define("waipu-playlists-tab", Ke);
// src/recordings-tab.ts
var qe = {
	RECORDING: 0,
	SCHEDULED: 1,
	FINISHED: 2,
	FAILED: 3
};
function Je(e, t) {
	let n = (qe[e.status] ?? 9) - (qe[t.status] ?? 9);
	if (n) return n;
	let r = (e.start ?? "").localeCompare(t.start ?? "");
	return e.status === "SCHEDULED" ? r : -r;
}
var Ye = class extends z {
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
		return (this.data?.recordings ?? []).filter((t) => (this._filter === "all" || t.status === this._filter) && (!e || `${t.title} ${t.episode_title ?? ""}`.toLowerCase().includes(e))).sort(Je);
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
		if (!e.length || !confirm(U(this.hass, "confirm_delete", { count: e.length }))) return;
		this._busy = !0;
		let t = await Q(this, this.hass, () => Me(this.hass, e));
		this._busy = !1, t && (this._toggle(e, !1), X(this, "recordings"), Z(this, U(this.hass, "deleted", { count: e.length })));
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
		return O`<div class="content">
      <div class="stats">
        <div class="card stat">
          <div class="k">${U(this.hass, "storage_used")}</div>
          <div class="v">
            ${n.toFixed(1)} h
            ${r ? O`<span class="muted of">${U(this.hass, "of_hours", { hours: r })}</span>` : j}
          </div>
          ${r ? O`<div class="meter" role="meter" aria-valuemin="0" aria-valuemax=${r} aria-valuenow=${n}>
                <div style="width:${Math.min(100, n / r * 100)}%"></div>
              </div>` : j}
        </div>
        <div class="card stat"><div class="k">${U(this.hass, "recorded")}</div><div class="v">${t("FINISHED")}</div></div>
        <div class="card stat">
          <div class="k">${U(this.hass, "recording_now")}</div>
          <div class="v rec">${t("RECORDING")}</div>
        </div>
        <div class="card stat">
          <div class="k">${U(this.hass, "scheduled")}</div>
          <div class="v sched">${t("SCHEDULED")}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-h">
          <h2>${U(this.hass, "recordings")}</h2>
          <div class="toolbar">
            <div class="seg" role="group">
              ${o.map((e) => O`<button aria-pressed=${e === this._filter} @click=${() => this._filter = e}>
                  ${U(this.hass, s[e])}
                </button>`)}
            </div>
            <label class="search">
              ${q()}
              <input
                type="search"
                placeholder=${U(this.hass, "search_recordings")}
                .value=${this._search}
                @input=${(e) => this._search = e.target.value}
              />
            </label>
          </div>
        </div>
        ${this._selected.size ? O`<div class="bulk">
              <span>${U(this.hass, "selected", { count: this._selected.size })}</span>
              <button class="btn danger" ?disabled=${this._busy} @click=${() => this._delete([...this._selected])}>
                ${Re()}${U(this.hass, "delete_selected")}
              </button>
              <button class="btn" @click=${() => this._selected = /* @__PURE__ */ new Set()}>${U(this.hass, "clear_selection")}</button>
            </div>` : j}
        <div class="table-box">
          ${i.length ? O`<table>
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
                    <th>${U(this.hass, "title")}</th>
                    <th>${U(this.hass, "channel")}</th>
                    <th>${U(this.hass, "date")}</th>
                    <th>${U(this.hass, "length")}</th>
                    <th>${U(this.hass, "status")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${this._rows(i).map((e) => Array.isArray(e) ? this._renderGroup(e) : this._renderRecording(e, !1))}
                </tbody>
              </table>` : O`<p class="card-b muted">${this.data ? U(this.hass, "no_recordings") : U(this.hass, "loading")}</p>`}
        </div>
      </div>
    </div>`;
	}
	_renderGroup(e) {
		let t = e.map((e) => e.id);
		return O`<tr class="group">
        <td class="check">
          <input
            type="checkbox"
            .checked=${t.every((e) => this._selected.has(e))}
            @change=${(e) => this._toggle(t, e.target.checked)}
          />
        </td>
        <td></td>
        <td colspan="6">${e[0].title} <span class="muted">· ${U(this.hass, "episodes", { count: e.length })}</span></td>
      </tr>
      ${e.map((e) => this._renderRecording(e, !0))}`;
	}
	_renderRecording(e, t) {
		let n = W(this.hass, {
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit"
		}), r = this.channels.find((t) => t.id === e.channel_id), i = [e.season && e.episode ? `S${e.season}E${e.episode}` : "", e.episode_title ?? ""].filter(Boolean).join(" · ");
		return O`<tr class=${t ? "child" : ""}>
      <td class="check">
        <input
          type="checkbox"
          .checked=${this._selected.has(e.id)}
          @change=${(t) => this._toggle([e.id], t.target.checked)}
        />
      </td>
      <td>${e.image ? O`<img class="thumb" src=${e.image} alt="" loading="lazy" />` : O`<div class="thumb"></div>`}</td>
      <td class="title">
        <div>${t && i ? i : e.title}</div>
        ${!t && i ? O`<div>${i}</div>` : j}
      </td>
      <td>${r?.name ?? e.channel_id}</td>
      <td>${e.start ? n.format(new Date(e.start)) : ""}</td>
      <td>${Math.round(e.duration / 60)} min</td>
      <td>${this._status(e.status)}</td>
      <td>
        <button class="icon-btn" aria-label=${U(this.hass, "delete")} title=${U(this.hass, "delete")} ?disabled=${this._busy} @click=${() => this._delete([e.id])}>
          ${Re()}
        </button>
      </td>
    </tr>`;
	}
	_status(e) {
		switch (e) {
			case "RECORDING": return O`<span class="chip rec">${J()}${U(this.hass, "rec")}</span>`;
			case "SCHEDULED": return O`<span class="chip sched">${K(14)}${U(this.hass, "scheduled")}</span>`;
			case "FINISHED": return O`<span class="chip">${U(this.hass, "recorded")}</span>`;
			default: return O`<span class="chip">${e}</span>`;
		}
	}
	static {
		this.styles = [Y, o`
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
customElements.define("waipu-recordings-tab", Ye);
// src/waipu-tv-panel.ts
var Xe = class extends z {
	static {
		this.properties = {
			hass: { attribute: !1 },
			narrow: { type: Boolean },
			_tab: { state: !0 },
			_channels: { state: !0 },
			_recordings: { state: !0 },
			_toast: { state: !0 }
		};
	}
	constructor() {
		super(), this._loaded = !1, this._tab = "guide", this.addEventListener("waipu-changed", (e) => this._reload(e.detail.what)), this.addEventListener("waipu-toast", (e) => this._showToast(e.detail.message));
	}
	willUpdate() {
		this.hass && !this._loaded && (this._loaded = !0, this._reload("channels"), this._reload("recordings"));
	}
	async _reload(e) {
		try {
			e === "channels" ? this._channels = await Oe(this.hass) : this._recordings = await Ae(this.hass);
		} catch (e) {
			this._showToast(U(this.hass, "error", { message: e.message ?? String(e) }));
		}
	}
	_showToast(e) {
		this._toast = e, window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = void 0, 4e3);
	}
	async _refresh() {
		this._showToast(U(this.hass, "refreshing")), await this.hass.callService("button", "press", { entity_id: "button.waipu_tv_refresh" }), await Promise.all([this._reload("channels"), this._reload("recordings")]);
	}
	render() {
		if (!this.hass) return j;
		let e = [
			"guide",
			"favorites",
			"recordings"
		];
		return this.hass.user?.is_admin && e.push("playlists"), O`
      <header>
        <div class="row">
          <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
          <h1>waipu.tv</h1>
          ${this._channels?.subscription ? O`<span class="pill">${this._channels.subscription}</span>` : j}
          <button class="icon-btn" title=${U(this.hass, "refresh")} aria-label=${U(this.hass, "refresh")} @click=${this._refresh}>
            ${Ie()}
          </button>
        </div>
        <div class="tabs" role="tablist">
          ${e.map((e) => O`<button role="tab" aria-selected=${e === this._tab} @click=${() => this._tab = e}>
              ${U(this.hass, e)}
            </button>`)}
        </div>
      </header>
      ${this._renderTab()}
      ${this._toast ? O`<div class="toast" role="status">${this._toast}</div>` : j}
    `;
	}
	_renderTab() {
		let e = this._channels?.channels ?? [], t = this._recordings?.recordings ?? [];
		switch (this._tab) {
			case "guide": return O`<waipu-guide-tab .hass=${this.hass} .channels=${e} .recordings=${t}></waipu-guide-tab>`;
			case "favorites": return O`<waipu-favorites-tab .hass=${this.hass} .channels=${e}></waipu-favorites-tab>`;
			case "recordings": return O`<waipu-recordings-tab .hass=${this.hass} .channels=${e} .data=${this._recordings}></waipu-recordings-tab>`;
			case "playlists": return O`<waipu-playlists-tab .hass=${this.hass}></waipu-playlists-tab>`;
		}
	}
	static {
		this.styles = [Y, o`
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
        background: rgba(255, 255, 255, 0.18);
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
customElements.define("waipu-tv-panel", Xe);
