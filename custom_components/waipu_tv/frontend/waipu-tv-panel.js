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
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: ee, getOwnPropertySymbols: te, getPrototypeOf: ne } = Object, f = globalThis, re = f.trustedTypes, ie = re ? re.emptyScript : "", ae = f.reactiveElementPolyfillSupport, p = (e, t) => e, m = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? ie : null;
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
}, oe = (e, t) => !l(e, t), se = {
	attribute: !0,
	type: String,
	converter: m,
	reflect: !1,
	useDefault: !1,
	hasChanged: oe
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var h = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = se) {
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
		return this.elementProperties.get(e) ?? se;
	}
	static _$Ei() {
		if (this.hasOwnProperty(p("elementProperties"))) return;
		let e = ne(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(p("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(p("properties"))) {
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
			let i = (n.converter?.toAttribute === void 0 ? m : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? m : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? oe)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
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
h.elementStyles = [], h.shadowRootOptions = { mode: "open" }, h[p("elementProperties")] = /* @__PURE__ */ new Map(), h[p("finalized")] = /* @__PURE__ */ new Map(), ae?.({ ReactiveElement: h }), (f.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var g = globalThis, ce = (e) => e, _ = g.trustedTypes, le = _ ? _.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, v = "$lit$", y = `lit$${Math.random().toFixed(9).slice(2)}$`, b = "?" + y, ue = `<${b}>`, x = document, S = () => x.createComment(""), C = (e) => e === null || typeof e != "object" && typeof e != "function", w = Array.isArray, de = (e) => w(e) || typeof e?.[Symbol.iterator] == "function", T = "[ 	\n\f\r]", E = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, D = /-->/g, fe = />/g, O = RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), pe = /'/g, me = /"/g, he = /^(?:script|style|textarea|title)$/i, ge = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), k = ge(1), A = ge(2), j = Symbol.for("lit-noChange"), M = Symbol.for("lit-nothing"), _e = /* @__PURE__ */ new WeakMap(), N = x.createTreeWalker(x, 129);
function P(e, t) {
	if (!w(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return le === void 0 ? t : le.createHTML(t);
}
var ve = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = E;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === E ? c[1] === "!--" ? o = D : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = O) : (he.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = O) : o = fe : o === O ? c[0] === ">" ? (o = i ?? E, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? O : c[3] === "\"" ? me : pe) : o === me || o === pe ? o = O : o === D || o === fe ? o = E : (o = O, i = void 0);
		let d = o === O && e[t + 1].startsWith("/>") ? " " : "";
		a += o === E ? n + ue : l >= 0 ? (r.push(s), n.slice(0, l) + v + n.slice(l) + y + d) : n + y + (l === -2 ? t : d);
	}
	return [P(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, F = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = ve(t, n);
		if (this.el = e.createElement(l, r), N.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = N.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(v)) {
					let t = u[o++], n = i.getAttribute(e).split(y), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? be : r[1] === "?" ? xe : r[1] === "@" ? Se : R
					}), i.removeAttribute(e);
				} else e.startsWith(y) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (he.test(i.tagName)) {
					let e = i.textContent.split(y), t = e.length - 1;
					if (t > 0) {
						i.textContent = _ ? _.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], S()), N.nextNode(), c.push({
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
function I(e, t, n = e, r) {
	if (t === j) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = C(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = I(e, i._$AS(e, t.values), i, r)), t;
}
var ye = class {
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
		N.currentNode = r;
		let i = N.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new L(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Ce(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = N.nextNode(), a++);
		}
		return N.currentNode = x, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, L = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = M, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = I(this, e, t), C(e) ? e === M || e == null || e === "" ? (this._$AH !== M && this._$AR(), this._$AH = M) : e !== this._$AH && e !== j && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? de(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== M && C(this._$AH) ? this._$AA.nextSibling.data = e : this.T(x.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = F.createElement(P(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new ye(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = _e.get(e.strings);
		return t === void 0 && _e.set(e.strings, t = new F(e)), t;
	}
	k(t) {
		w(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(S()), this.O(S()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ce(e).nextSibling;
			ce(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, R = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = M, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = M;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = I(this, e, t, 0), a = !C(e) || e !== this._$AH && e !== j, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = I(this, r[n + o], t, o), s === j && (s = this._$AH[o]), a ||= !C(s) || s !== this._$AH[o], s === M ? e = M : e !== M && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === M ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, be = class extends R {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === M ? void 0 : e;
	}
}, xe = class extends R {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== M);
	}
}, Se = class extends R {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = I(this, e, t, 0) ?? M) === j) return;
		let n = this._$AH, r = e === M && n !== M || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== M && (n === M || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Ce = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		I(this, e);
	}
}, we = g.litHtmlPolyfillSupport;
we?.(F, L), (g.litHtmlVersions ??= []).push("3.3.3");
var Te = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new L(t.insertBefore(S(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, z = globalThis, B = class extends h {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Te(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return j;
	}
};
B._$litElement$ = !0, B.finalized = !0, z.litElementHydrateSupport?.({ LitElement: B });
var Ee = z.litElementPolyfillSupport;
Ee?.({ LitElement: B }), (z.litElementVersions ??= []).push("4.2.2");
// src/api.ts
var V = (e, t, n = {}) => e.callWS({
	type: `waipu_tv/${t}`,
	...n
}), De = (e) => V(e, "channels"), Oe = (e, t, n, r) => V(e, "guide", {
	start: t.toISOString(),
	end: n.toISOString(),
	...r ? { channels: r } : {}
}), ke = (e, t) => V(e, "program", { program_id: t }), Ae = (e) => V(e, "recordings"), je = (e) => V(e, "playlists"), Me = (e, t, n = !1) => V(e, "record", {
	program_id: t,
	series: n
}), Ne = (e, t) => V(e, "cancel_series", { program_id: t }), Pe = (e, t) => V(e, "delete_recordings", { recording_ids: t }), Fe = (e, t, n) => V(e, "set_favorite", {
	channel: t,
	favorite: n
}), Ie = {
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
	param_catchup: "Catch-up: players can restart running and recently started programs from the guide.",
	param_timeshift: "Live channels open at the start of the running program so you can rewind.",
	param_hls_proxy: "Serve HLS playlists through Home Assistant, for ffmpeg-based players (VLC, Jellyfin).",
	param_filter: "Channel selection of the guide: all, favorites, live or vod.",
	needs_restart: "Needs instant restart, which your waipu.tv package doesn't include.",
	error: "waipu.tv: {message}"
}, Le = {
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
	param_catchup: "Catch-up: Player können laufende und kürzlich begonnene Sendungen aus dem Programm neu starten.",
	param_timeshift: "Live-Sender starten am Beginn der laufenden Sendung, sodass du zurückspulen kannst.",
	param_hls_proxy: "HLS-Playlists über Home Assistant ausliefern, für ffmpeg-basierte Player (VLC, Jellyfin).",
	param_filter: "Senderauswahl des Programms: all, favorites, live oder vod.",
	needs_restart: "Benötigt Instant Restart, das dein waipu.tv-Paket nicht enthält.",
	error: "waipu.tv: {message}"
};
function H(e, t, n = {}) {
	return (e.language?.startsWith("de") ? Le : Ie)[t].replace(/\{(\w+)\}/g, (e, t) => String(n[t] ?? ""));
}
function U(e, t) {
	return new Intl.DateTimeFormat(e.language, {
		timeZone: e.config.time_zone,
		...t
	});
}
// src/icons.ts
var W = (e, t = 20) => A`<svg class="i" viewBox="0 0 24 24" style="width:${t}px;height:${t}px" aria-hidden="true">${e}</svg>`, Re = () => W(A`<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>`), G = (e = 20) => W(A`<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>`, e), K = () => W(A`<circle cx="11" cy="11" r="6"/><path d="m20 20-4.3-4.3"/>`), ze = () => W(A`<path d="M6 6l12 12M18 6 6 18"/>`), Be = () => W(A`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>`), Ve = () => W(A`<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>`), He = () => W(A`<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>`), q = (e = 14) => A`<svg class="i" viewBox="0 0 24 24" style="width:${e}px;height:${e}px;fill:currentColor;stroke:none" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>`, J = o`
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
function Y(e, t) {
	e.dispatchEvent(new CustomEvent("waipu-changed", {
		detail: { what: t },
		bubbles: !0,
		composed: !0
	}));
}
function X(e, t) {
	e.dispatchEvent(new CustomEvent("waipu-toast", {
		detail: { message: t },
		bubbles: !0,
		composed: !0
	}));
}
async function Z(e, t, n) {
	try {
		return await n(), !0;
	} catch (n) {
		return X(e, H(t, "error", { message: n?.message ?? String(n) })), !1;
	}
}
// src/favorites-tab.ts
var Ue = class extends B {
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
		let t = await Z(this, this.hass, () => Fe(this.hass, e.id, !e.favorite));
		this._busy = void 0, t && (Y(this, "channels"), X(this, H(this.hass, e.favorite ? "favorite_removed" : "favorite_added", { name: e.name })));
	}
	_star(e) {
		let t = H(this.hass, e.favorite ? "remove_favorite" : "add_favorite");
		return k`<button
      class="star-btn"
      aria-pressed=${e.favorite}
      title=${t}
      aria-label="${t}: ${e.name}"
      ?disabled=${this._busy === e.id}
      @click=${() => this._toggle(e)}
    >
      ${He()}
    </button>`;
	}
	_kind(e) {
		return [
			`${e.number}`,
			H(this.hass, e.vod ? "on_demand" : "live_tv"),
			...e.visible ? [] : [H(this.hass, "hidden")]
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
		return k`<div class="content">
      <div class="layout">
        <div class="card">
          <div class="card-h">
            <h2>${H(this.hass, "your_favorites")}</h2>
            <span class="chip">${t.length}</span>
          </div>
          <div class="note">${Re()}${H(this.hass, "favorites_note")}</div>
          <div class="card-b">
            <ul class="list">
              ${t.map((e) => k`<li>
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
            <h2>${H(this.hass, "all_channels")}</h2>
            <div class="toolbar">
              <div class="seg" role="group">
                ${i.map((e) => k`<button aria-pressed=${e === this._filter} @click=${() => this._filter = e}>
                    ${H(this.hass, a[e])}
                  </button>`)}
              </div>
              <label class="search">
                ${K()}
                <input
                  type="search"
                  placeholder=${H(this.hass, "filter_channels")}
                  .value=${this._search}
                  @input=${(e) => this._search = e.target.value}
                />
              </label>
            </div>
          </div>
          <div class="card-b">
            <div class="grid">
              ${r.map((e) => k`<div class="tile">
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
		this.styles = [J, o`
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
customElements.define("waipu-favorites-tab", Ue);
// src/program-dialog.ts
var We = class extends B {
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
		let r = await Z(this, this.hass, e);
		this._busy = !1, r && (Y(this, n), X(this, t), n === "recordings" && this._close());
	}
	render() {
		let e = this.program, t = new Date(e.start).getTime(), n = new Date(e.stop).getTime(), r = Date.now(), i = U(this.hass, {
			hour: "2-digit",
			minute: "2-digit"
		}), a = U(this.hass, {
			weekday: "long",
			day: "numeric",
			month: "long"
		}), o = t <= r && r < n, s = n <= r, c = this.recording, l = this.channel?.favorite ?? !1;
		return k`<dialog
      @close=${() => this.dispatchEvent(new CustomEvent("closed"))}
      @click=${this._backdropClick}
    >
      <div class="dlg-h">
        ${this.channel ? k`<img class="logo" src=${this.channel.logo} alt="" />` : M}
        <div class="meta">
          <div class="muted small">${this.channel?.name ?? e.channel_id}</div>
          <h3>${e.title}</h3>
          <div class="muted small">
            ${a.format(t)}, ${i.format(t)}–${i.format(n)}
            ${e.episode_title ? k` · ${e.episode_title}` : M}
          </div>
        </div>
        ${this.channel ? k`<button
              class="star-btn"
              aria-pressed=${l}
              title=${H(this.hass, l ? "remove_favorite" : "add_favorite")}
              aria-label=${H(this.hass, l ? "remove_favorite" : "add_favorite")}
              ?disabled=${this._busy}
              @click=${() => this._run(() => Fe(this.hass, this.channel.id, !l), H(this.hass, l ? "favorite_removed" : "favorite_added", { name: this.channel.name }), "channels")}
            >
              ${He()}
            </button>` : M}
        <button class="icon-btn" aria-label=${H(this.hass, "close")} @click=${this._close}>${ze()}</button>
      </div>
      <div class="dlg-b">
        <div class="toolbar">
          ${o ? k`<span class="chip live"><span class="dot"></span>${H(this.hass, "live")}</span>` : M}
          ${s ? k`<span class="chip">${H(this.hass, "ended")}</span>` : M}
          ${c?.status === "RECORDING" ? k`<span class="chip rec">${q()}${H(this.hass, "rec")}</span>` : M}
          ${c?.status === "SCHEDULED" ? k`<span class="chip sched">${G(14)}${H(this.hass, "scheduled")}</span>` : M}
          ${e.genre ? k`<span class="chip">${e.genre}</span>` : M}
        </div>
        ${o ? k`<div class="progress"><div style="width:${(r - t) / (n - t) * 100}%"></div></div>` : M}
        ${e.image ? k`<img class="still" src=${e.image} alt="" />` : M}
        <p>${this._description ?? H(this.hass, "loading")}</p>
        ${e.recordable ? M : k`<p class="muted small">${H(this.hass, "not_recordable")}</p>`}
      </div>
      <div class="dlg-a">
        ${c ? k`<button
              class="btn danger"
              ?disabled=${this._busy}
              @click=${() => this._run(() => Pe(this.hass, [c.id]), H(this.hass, "recording_cancelled"), "recordings")}
            >
              ${H(this.hass, "cancel_recording")}
            </button>` : M}
        ${!c && !s && e.recordable && e.series_id ? k`<button
              class="btn"
              ?disabled=${this._busy}
              @click=${() => this._run(() => Me(this.hass, e.id, !0), H(this.hass, "series_started", { title: e.title }), "recordings")}
            >
              ${H(this.hass, "record_series")}
            </button>` : M}
        ${!c && !s && e.recordable ? k`<button
              class="btn primary"
              ?disabled=${this._busy}
              @click=${() => this._run(() => Me(this.hass, e.id), H(this.hass, "recording_started", { title: e.title }), "recordings")}
            >
              ${q()}${H(this.hass, "record")}
            </button>` : M}
      </div>
    </dialog>`;
	}
	static {
		this.styles = [J, o`
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
customElements.define("waipu-program-dialog", We);
// src/guide-tab.ts
var Ge = 4, Q = 6e4, Ke = class extends B {
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
		super.connectedCallback(), this._clock = window.setInterval(() => this._now = Date.now(), Q);
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
				this._days = (await Oe(this.hass, e, e)).days;
			}
			let e = new Date(this._days[this._day]), t = this._day + 1 < this._days.length ? new Date(this._days[this._day + 1]) : null;
			this._guide = await Oe(this.hass, e, t ?? new Date(e.getTime() + 1440 * Q), this._all ? void 0 : this._favoriteIds);
		} catch (e) {
			X(this, H(this.hass, "error", { message: e.message ?? String(e) }));
		}
	}
	updated() {
		this._scrollToNow && this._guide && (this._scrollToNow = !1, this._jumpToNow());
	}
	_dayRange() {
		let e = new Date(this._days[this._day]).getTime(), t = this._days[this._day + 1];
		return [e, t ? new Date(t).getTime() : e + 1440 * Q];
	}
	_x(e, t) {
		return (e - t) / Q * Ge;
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
		let e = U(this.hass, {
			weekday: "short",
			day: "numeric"
		});
		return k`
      <div class="content">
        <div class="card">
          <div class="card-h">
            <h2>${H(this.hass, "tv_guide")}</h2>
            <div class="toolbar">
              <div class="seg" role="group">
                ${this._days.map((t, n) => k`<button aria-pressed=${n === this._day} @click=${() => this._selectDay(n)}>
                    ${n === 0 ? H(this.hass, "today") : e.format(new Date(t))}
                  </button>`)}
              </div>
              <div class="seg" role="group">
                <button aria-pressed=${!this._all} @click=${() => this._all = !1}>
                  ${H(this.hass, "favorites")}
                </button>
                <button aria-pressed=${this._all} @click=${() => this._all = !0}>
                  ${H(this.hass, "all_channels")}
                </button>
              </div>
              <button class="btn" @click=${this._now_clicked}>${G()}${H(this.hass, "now")}</button>
              <label class="search">
                ${K()}
                <input
                  type="search"
                  placeholder=${H(this.hass, "search_programs")}
                  .value=${this._search}
                  @input=${(e) => this._search = e.target.value}
                />
              </label>
            </div>
          </div>
          ${this._renderGrid()}
          <div class="legend">
            <span><span class="chip live"><span class="dot"></span>${H(this.hass, "live")}</span>${H(this.hass, "legend_live")}</span>
            <span><span class="chip rec">${q()}${H(this.hass, "rec")}</span>${H(this.hass, "legend_rec")}</span>
            <span><span class="chip sched">${G(14)}${H(this.hass, "scheduled")}</span>${H(this.hass, "legend_sched")}</span>
            <span>${H(this.hass, "legend_hint")}</span>
          </div>
        </div>
      </div>
      ${this._selected ? k`<waipu-program-dialog
            .hass=${this.hass}
            .program=${this._selected}
            .channel=${this.channels.find((e) => e.id === this._selected.channel_id)}
            .recording=${this._recordingsByProgram().get(this._selected.id)}
            @closed=${() => this._selected = void 0}
          ></waipu-program-dialog>` : M}
    `;
	}
	_selectDay(e) {
		this._day = e, this._scrollToNow = !0;
	}
	_now_clicked() {
		this._day === 0 ? this._jumpToNow() : this._selectDay(0);
	}
	_renderGrid() {
		if (!this._guide || !this._days.length) return k`<p class="card-b muted">${H(this.hass, "loading")}</p>`;
		let e = this._all ? Object.keys(this._guide.programs) : this._favoriteIds, t = this.channels.filter((t) => e.includes(t.id));
		if (!t.length) return k`<p class="card-b muted">${H(this.hass, "no_favorites")}</p>`;
		let [n, r] = this._dayRange(), i = this._x(r, n), a = U(this.hass, {
			hour: "2-digit",
			minute: "2-digit"
		}), o = [];
		for (let e = n; e < r; e += 30 * Q) o.push(e);
		let s = this._now >= n && this._now < r, c = this._recordingsByProgram(), l = this._search.trim().toLowerCase();
		return k`
      <div class="epg-box">
        <div class="epg" style="--track:${i}px">
          <div class="epg-head">
            <div class="epg-corner">${H(this.hass, "channel")}</div>
            <div class="epg-ticks" style="width:${i}px">
              ${o.map((e) => k`<span style="left:${this._x(e, n)}px">${a.format(e)}</span>`)}
            </div>
          </div>
          ${t.map((e) => k`<div class="epg-row">
              <div class="epg-ch">
                <span class="num">${e.number}</span>
                <img class="logo" src=${e.logo} alt="" loading="lazy" />
                <span class="name">${e.name}</span>
              </div>
              <div class="epg-track" style="width:${i}px">
                ${(this._guide.programs[e.id] ?? []).map((e) => this._renderProgram(e, n, r, a, c.get(e.id), l))}
              </div>
            </div>`)}
          ${s ? k`<div class="now-line" style="left:calc(var(--ch) + ${this._x(this._now, n)}px)">
                <span>${a.format(this._now)}</span>
              </div>` : M}
        </div>
      </div>
    `;
	}
	_renderProgram(e, t, n, r, i, a) {
		let o = new Date(e.start).getTime(), s = new Date(e.stop).getTime(), c = this._x(Math.max(o, t), t), l = this._x(Math.min(s, n), t), u = o <= this._now && this._now < s;
		return k`<button
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
        ${i?.status === "RECORDING" ? k`<span class="flag">${q()}</span>` : M}
        ${i?.status === "SCHEDULED" ? k`<span class="flag">${G(14)}</span>` : M}
        <span>${e.title}</span>
      </span>
      <span class="s">${r.format(o)}${e.episode_title ? ` · ${e.episode_title}` : ""}</span>
      ${u ? k`<span class="bar" style="width:${(this._now - o) / (s - o) * 100}%"></span>` : M}
    </button>`;
	}
	static {
		this.styles = [J, o`
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
        left: 1px;
        transform: translateX(-50%);
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
customElements.define("waipu-guide-tab", Ke);
// src/playlists-tab.ts
var qe = [
	"favorites",
	"all",
	"live",
	"vod",
	"recordings",
	"epg"
], Je = class extends B {
	static {
		this.properties = {
			hass: { attribute: !1 },
			_data: { state: !0 }
		};
	}
	firstUpdated() {
		je(this.hass).then((e) => this._data = e).catch((e) => X(this, H(this.hass, "error", { message: e.message ?? String(e) })));
	}
	async _copy(e) {
		try {
			await navigator.clipboard.writeText(e), X(this, H(this.hass, "copied"));
		} catch {
			X(this, H(this.hass, "copy_failed"));
		}
	}
	render() {
		let e = this._data;
		return k`<div class="content">
      <div class="card">
        <div class="card-h">
          <h2>${H(this.hass, "playlist_server")}</h2>
          <span class="chip">${H(this.hass, "admins_only")}</span>
          ${e ? e.enabled ? k`<span class="chip live"><span class="dot"></span>${H(this.hass, "running")}</span>` : k`<span class="chip">${H(this.hass, "off")}</span>` : M}
        </div>
        <div class="card-b">
          ${e ? e.enabled ? k`<ul class="urls">
                  ${qe.map((t) => {
			let n = location.origin + e.urls[t];
			return k`<li>
                      <div class="meta">
                        <div>${H(this.hass, `url_${t}`)}</div>
                        <div class="mono">${n}</div>
                      </div>
                      <button class="btn" @click=${() => this._copy(n)}>
                        ${Ve()}${H(this.hass, "copy")}
                      </button>
                    </li>`;
		})}
                </ul>` : k`<p>${H(this.hass, "playlists_off")}</p>` : k`<p class="muted">${H(this.hass, "loading")}</p>`}
        </div>
        ${e ? k`<div class="card-b actions">
              <a class="btn" href="/config/integrations/integration/waipu_tv">${H(this.hass, "open_options")}</a>
            </div>` : M}
      </div>
      ${e?.enabled ? this._renderOptions(e) : M}
      <p class="muted note">${H(this.hass, "playlists_note")}</p>
    </div>`;
	}
	_renderOptions(e) {
		let t = (e) => H(this.hass, e ? "on" : "off_value"), n = (e) => H(this.hass, "from_options", { value: t(e) }), r = H(this.hass, "m3u_playlists"), i = e.instant_restart ? "" : ` ${H(this.hass, "needs_restart")}`, a = [
			[
				"hidden",
				"0 | 1",
				t(!1),
				`${r}, epg.xml`,
				H(this.hass, "param_hidden")
			],
			[
				"drm",
				"0 | 1",
				t(!0),
				`${r}, epg.xml`,
				H(this.hass, "param_drm")
			],
			[
				"protocol",
				"auto | hls | dash",
				"auto",
				`${r}, recordings.m3u`,
				H(this.hass, "param_protocol")
			],
			[
				"catchup",
				"0 | 1",
				n(e.defaults.catchup),
				r,
				H(this.hass, "param_catchup") + i
			],
			[
				"timeshift",
				"0 | 1",
				n(e.defaults.timeshift),
				r,
				H(this.hass, "param_timeshift") + i
			],
			[
				"hls_proxy",
				"0 | 1",
				n(e.defaults.hls_proxy),
				r,
				H(this.hass, "param_hls_proxy")
			],
			[
				"filter",
				"all | favorites | live | vod",
				"all",
				"epg.xml",
				H(this.hass, "param_filter")
			]
		];
		return k`<div class="card">
      <div class="card-h"><h2>${H(this.hass, "options_title")}</h2></div>
      <div class="card-b">
        <p class="intro">${H(this.hass, "options_intro")}</p>
        <div class="table-box">
          <table>
            <thead>
              <tr>
                <th>${H(this.hass, "parameter")}</th>
                <th>${H(this.hass, "values")}</th>
                <th>${H(this.hass, "default")}</th>
                <th>${H(this.hass, "applies_to")}</th>
                <th>${H(this.hass, "meaning")}</th>
              </tr>
            </thead>
            <tbody>
              ${a.map(([e, t, n, r, i]) => k`<tr>
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
		this.styles = [J, o`
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
customElements.define("waipu-playlists-tab", Je);
// src/recordings-tab.ts
var $ = {
	RECORDING: 0,
	SCHEDULED: 1,
	FINISHED: 2,
	FAILED: 3
};
function Ye(e, t) {
	let n = ($[e.status] ?? 9) - ($[t.status] ?? 9);
	if (n) return n;
	let r = (e.start ?? "").localeCompare(t.start ?? "");
	return e.status === "SCHEDULED" ? r : -r;
}
var Xe = class extends B {
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
		return (this.data?.recordings ?? []).filter((t) => (this._filter === "all" || t.status === this._filter) && (!e || `${t.title} ${t.episode_title ?? ""}`.toLowerCase().includes(e))).sort(Ye);
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
		if (!e.length || !confirm(H(this.hass, "confirm_delete", { count: e.length }))) return;
		this._busy = !0;
		let t = await Z(this, this.hass, () => Pe(this.hass, e));
		this._busy = !1, t && (this._toggle(e, !1), Y(this, "recordings"), X(this, H(this.hass, "deleted", { count: e.length })));
	}
	async _stopSeries(e, t) {
		if (!confirm(H(this.hass, "confirm_stop_series", { title: t }))) return;
		this._busy = !0;
		let n = await Z(this, this.hass, () => Ne(this.hass, e));
		this._busy = !1, n && (Y(this, "recordings"), X(this, H(this.hass, "series_stopped", { title: t })));
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
		return k`<div class="content">
      <div class="stats">
        <div class="card stat">
          <div class="k">${H(this.hass, "storage_used")}</div>
          <div class="v">
            ${n.toFixed(1)} h
            ${r ? k`<span class="muted of">${H(this.hass, "of_hours", { hours: r })}</span>` : M}
          </div>
          ${r ? k`<div class="meter" role="meter" aria-valuemin="0" aria-valuemax=${r} aria-valuenow=${n}>
                <div style="width:${Math.min(100, n / r * 100)}%"></div>
              </div>` : M}
        </div>
        <div class="card stat"><div class="k">${H(this.hass, "recorded")}</div><div class="v">${t("FINISHED")}</div></div>
        <div class="card stat">
          <div class="k">${H(this.hass, "recording_now")}</div>
          <div class="v rec">${t("RECORDING")}</div>
        </div>
        <div class="card stat">
          <div class="k">${H(this.hass, "scheduled")}</div>
          <div class="v sched">${t("SCHEDULED")}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-h">
          <h2>${H(this.hass, "recordings")}</h2>
          <div class="toolbar">
            <div class="seg" role="group">
              ${o.map((e) => k`<button aria-pressed=${e === this._filter} @click=${() => this._filter = e}>
                  ${H(this.hass, s[e])}
                </button>`)}
            </div>
            <label class="search">
              ${K()}
              <input
                type="search"
                placeholder=${H(this.hass, "search_recordings")}
                .value=${this._search}
                @input=${(e) => this._search = e.target.value}
              />
            </label>
          </div>
        </div>
        ${this._selected.size ? k`<div class="bulk">
              <span>${H(this.hass, "selected", { count: this._selected.size })}</span>
              <button class="btn danger" ?disabled=${this._busy} @click=${() => this._delete([...this._selected])}>
                ${Be()}${H(this.hass, "delete_selected")}
              </button>
              <button class="btn" @click=${() => this._selected = /* @__PURE__ */ new Set()}>${H(this.hass, "clear_selection")}</button>
            </div>` : M}
        <div class="table-box">
          ${i.length ? k`<table>
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
                    <th>${H(this.hass, "title")}</th>
                    <th>${H(this.hass, "channel")}</th>
                    <th>${H(this.hass, "date")}</th>
                    <th>${H(this.hass, "length")}</th>
                    <th>${H(this.hass, "status")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${this._rows(i).map((e) => Array.isArray(e) ? this._renderGroup(e) : this._renderRecording(e, !1))}
                </tbody>
              </table>` : k`<p class="card-b muted">${this.data ? H(this.hass, "no_recordings") : H(this.hass, "loading")}</p>`}
        </div>
      </div>
    </div>`;
	}
	_renderGroup(e) {
		let t = e.map((e) => e.id), n = e.find((e) => e.program_id)?.program_id;
		return k`<tr class="group">
        <td class="check">
          <input
            type="checkbox"
            .checked=${t.every((e) => this._selected.has(e))}
            @change=${(e) => this._toggle(t, e.target.checked)}
          />
        </td>
        <td></td>
        <td colspan="5">${e[0].title} <span class="muted">· ${H(this.hass, "episodes", { count: e.length })}</span></td>
        <td>
          ${n ? k`<button class="btn" ?disabled=${this._busy} @click=${() => this._stopSeries(n, e[0].title)}>
                ${H(this.hass, "stop_series")}
              </button>` : M}
        </td>
      </tr>
      ${e.map((e) => this._renderRecording(e, !0))}`;
	}
	_renderRecording(e, t) {
		let n = U(this.hass, {
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit"
		}), r = this.channels.find((t) => t.id === e.channel_id), i = [e.season && e.episode ? `S${e.season}E${e.episode}` : "", e.episode_title ?? ""].filter(Boolean).join(" · ");
		return k`<tr class=${t ? "child" : ""}>
      <td class="check">
        <input
          type="checkbox"
          .checked=${this._selected.has(e.id)}
          @change=${(t) => this._toggle([e.id], t.target.checked)}
        />
      </td>
      <td>${e.image ? k`<img class="thumb" src=${e.image} alt="" loading="lazy" />` : k`<div class="thumb"></div>`}</td>
      <td class="title">
        <div>${t && i ? i : e.title}</div>
        ${!t && i ? k`<div>${i}</div>` : M}
      </td>
      <td>${r?.name ?? e.channel_id}</td>
      <td>${e.start ? n.format(new Date(e.start)) : ""}</td>
      <td>${Math.round(e.duration / 60)} min</td>
      <td>${this._status(e.status)}</td>
      <td>
        <button class="icon-btn" aria-label=${H(this.hass, "delete")} title=${H(this.hass, "delete")} ?disabled=${this._busy} @click=${() => this._delete([e.id])}>
          ${Be()}
        </button>
      </td>
    </tr>`;
	}
	_status(e) {
		switch (e) {
			case "RECORDING": return k`<span class="chip rec">${q()}${H(this.hass, "rec")}</span>`;
			case "SCHEDULED": return k`<span class="chip sched">${G(14)}${H(this.hass, "scheduled")}</span>`;
			case "FINISHED": return k`<span class="chip">${H(this.hass, "recorded")}</span>`;
			default: return k`<span class="chip">${e}</span>`;
		}
	}
	static {
		this.styles = [J, o`
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
customElements.define("waipu-recordings-tab", Xe);
// src/waipu-tv-panel.ts
var Ze = class extends B {
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
			e === "channels" ? this._channels = await De(this.hass) : this._recordings = await Ae(this.hass);
		} catch (e) {
			this._showToast(H(this.hass, "error", { message: e.message ?? String(e) }));
		}
	}
	_showToast(e) {
		this._toast = e, window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = void 0, 4e3);
	}
	async _refresh() {
		this._showToast(H(this.hass, "refreshing")), await this.hass.callService("button", "press", { entity_id: "button.waipu_tv_refresh" }), await Promise.all([this._reload("channels"), this._reload("recordings")]);
	}
	render() {
		if (!this.hass) return M;
		let e = [
			"guide",
			"favorites",
			"recordings"
		];
		return this.hass.user?.is_admin && e.push("playlists"), k`
      <header>
        <div class="row">
          <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
          <h1>waipu.tv</h1>
          ${this._channels?.subscription ? k`<span class="pill">${this._channels.subscription}</span>` : M}
          <button class="icon-btn" title=${H(this.hass, "refresh")} aria-label=${H(this.hass, "refresh")} @click=${this._refresh}>
            ${Re()}
          </button>
        </div>
        <div class="tabs" role="tablist">
          ${e.map((e) => k`<button role="tab" aria-selected=${e === this._tab} @click=${() => this._tab = e}>
              ${H(this.hass, e)}
            </button>`)}
        </div>
      </header>
      ${this._renderTab()}
      ${this._toast ? k`<div class="toast" role="status">${this._toast}</div>` : M}
    `;
	}
	_renderTab() {
		let e = this._channels?.channels ?? [], t = this._recordings?.recordings ?? [];
		switch (this._tab) {
			case "guide": return k`<waipu-guide-tab .hass=${this.hass} .channels=${e} .recordings=${t}></waipu-guide-tab>`;
			case "favorites": return k`<waipu-favorites-tab .hass=${this.hass} .channels=${e}></waipu-favorites-tab>`;
			case "recordings": return k`<waipu-recordings-tab .hass=${this.hass} .channels=${e} .data=${this._recordings}></waipu-recordings-tab>`;
			case "playlists": return k`<waipu-playlists-tab .hass=${this.hass}></waipu-playlists-tab>`;
		}
	}
	static {
		this.styles = [J, o`
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
customElements.define("waipu-tv-panel", Ze);
