
import { $NT, CMechLoadedDataT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { PaymentT, SourceT, CatT } from '../../../../../defs.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;


type AttributesT = {
}

type ModelT = {
		payments: PaymentT[],
		sources: SourceT[],
		cats: CatT[],
		cats_options_str: string,
		sources_options_str: string,
	}

type StateT = {
		detailsview: boolean,
		editing_payment: PaymentT | null,
		mode: 'view' | 'edit',
	}


const ATTRIBUTES:AttributesT = { }


class VPFinancePayments extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES };
    s:StateT = {
		detailsview: false,
		editing_payment: null,
		mode: 'view',
	}
    m:ModelT = {
		payments: [],
		sources: [],
		cats: [],
		cats_options_str: "",
		sources_options_str: "",
	}
    shadow:ShadowRoot


	static get observedAttributes() { return Object.keys(ATTRIBUTES); }


	constructor() {   
		super(); 
		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {   
		$N.CMech.RegisterViewPart(this)
	}




	async attributeChangedCallback(name:str, oldval:str|boolean|number, newval:str|boolean|number) {
		$N.CMech.AttributeChangedCallback(this,name,oldval,newval);
	}




	disconnectedCallback() { $N.CMech.ViewPartDisconnectedCallback(this); }




	ingest = (loadeddata: CMechLoadedDataT) => {
		this.m.payments = loadeddata.get("payments") as PaymentT[]
		this.m.sources = loadeddata.get("sources") as SourceT[]
		this.m.cats = loadeddata.get("cats")! as CatT[]
		this.m.sources_options_str = this.m.sources.map(s => `${s.name}:${s.id}`).join(',')
		this.m.cats_options_str = this.m.cats.filter((c:any)=>c.parent !== null && c.tags && c.tags.length && c.tags[0]===1).sort((a:any, b:any)=> (a.name > b.name ? 1 : -1)).map(c=>`${c!.name}:${c!.id}`).join(',')
	}




	payments_render(p:PaymentT) {

		let daypostfix = p.day.toString().endsWith('0') ? 'th' : p.day.toString().endsWith('1') ? 'st' : p.day.toString().endsWith('2') ? 'nd' : 'th'

		let breakdown = p.breakdown.map((b:any)=> {
			let s = b.split(":")
			return {name:s[0], amount:s[1], date:s[2]}
		})

		return html`
			<div class="payment ${p.breakdown.length ? 'hasbreakdown' : ''}">
				<h4 @click="${()=> {this.s.detailsview=this.s.detailsview ? false : true; this.render(); } }">
					<span class="payee">${p.payee}</span>
					<span class="amount">${p.amount ? "$"+p.amount : ''}</span>
					<span class="day" @click="${()=>this.editPayment(p.id)}">${p.day}${daypostfix} &nbsp;</span>
					${ p.is_auto ? html`<span class="isauto">A</span>&nbsp;` : '' }</span>
					${ p.is_auto && p.payment_sourceref && p.payment_sourceref.name === 'checkpers' ? html`<span class="isauto_ischecking">B</span>&nbsp;` : '' }
					${ p.catref ? html`<span class="is_attached_to_cat">C</span>&nbsp;` : '' }
				</h4>
				<p class="notes ${this.s.detailsview ? 'active' : ''}">${p.notes || '-'}</p>
				${breakdown ? html`
					<div class="breakdown">
					   ${breakdown.map((b:any)=> html`
							<div class="item">
								<h6>${b.name}</h6>
								<p class="notes ${this.s.detailsview ? 'active' : ''}">$${b.amount} - ${b.date}</p>
							</div>
					   `)}
					</div>
				` : ''}
			</div>
		`
	}



	editPayment(id: string) {
		const p = this.m.payments.find(pp => pp.id === id) || null
		if (!p) { alert(`Payment ${id} not found`); return }
		this.s.editing_payment = p
		this.s.mode = 'edit'
		this.render()
	}

	doneEdit() {
		this.s.editing_payment = null
		this.s.mode = 'view'
		this.render()
	}

	async prop_updated(e:any) {
		if (!this.s.editing_payment) return
		const changed:any = {}
		const n = e.detail.name
		const v = e.detail.newval

		if (n === "payee") changed.payee = v
		else if (n === "amount") changed.amount = parseFloat(v)
		else if (n === "day") changed.day = parseInt(v,10)
		else if (n === "is_auto") changed.is_auto = (v === true || v === "true")
		else if (n === "varies") changed.varies = (v === true || v === "true")
		else if (n === "notes") changed.notes = v
		else if (n === "recurence") changed.recurence = v
		else if (n === "type") changed.type = v
		else if (n === "cat") {
			if (v === 'NONE') 
				changed.cat = null;
			else 
				changed.cat = { __path: ['cats', v] }
		}
		else if (n === "payment_source") {
			if (v === 'NONE') 
				changed.payment_source = null;
			else 
				changed.payment_source = { __path: ['sources', v] }
		}

		if (Object.keys(changed).length) {
			await $N.DataHodl.PatchLocalDB("payments/"+this.s.editing_payment.id, changed) 
		}

		e.detail.done()
	}

	render(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 

}


customElements.define('vp-financepayments', VPFinancePayments);



