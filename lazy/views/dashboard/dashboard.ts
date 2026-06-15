import { $NT, CMechLoadedDataT, GenericRowT, LazyLoadFuncReturnT, ViewHeaderT } from "../../../defs_client_symlink.js"

declare var render: any;
declare var html: any;
declare var $N: $NT;

type AttributesT = {}
type ModelT = {}
type StateT = {}

const ATTRIBUTES:AttributesT = {}

class VDashboard extends HTMLElement {
	a:AttributesT = { ...ATTRIBUTES }
	m:ModelT = {}
	s:StateT = {}
	header:ViewHeaderT = { title: "Dashboard" }

	shadow:ShadowRoot

	static get observedAttributes() { return Object.keys(ATTRIBUTES); }

	constructor() {
		super()
		this.shadow = this.attachShadow({ mode: "open" })
	}

	async connectedCallback() {
		$N.CMech.RegisterView(this)
	}

	async attributeChangedCallback(name:string, oldval:string|boolean|number, newval:string|boolean|number) {
		$N.CMech.AttributeChangedCallback(this, name, oldval, newval)
	}

	disconnectedCallback() {
		$N.CMech.ViewDisconnectedCallback(this)
	}

	static load = (_pathparams:GenericRowT, _searchparams:GenericRowT) => new Promise<LazyLoadFuncReturnT>((res, _rej) => {
		const d = new Map<string, GenericRowT[]>()
		res({ d, refreshon: [] })
	})

	ingest = (_loadeddata:CMechLoadedDataT, _pathparams:GenericRowT, _searchparams:GenericRowT) => {}

	render(state_changes:Partial<StateT> = {}) {
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m, this.a), this.shadow)
	}

	template = (_s:StateT, _m:ModelT, _a:AttributesT) => { return html`{--css--}{--html--}`; }
}

customElements.define("v-dashboard", VDashboard)

export { }
