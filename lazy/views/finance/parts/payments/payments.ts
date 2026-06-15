
import { $NT, CMechLoadedDataT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { PaymentT, SourceT, CatT } from '../../../../../defs_instance_server_symlink.js'

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
		mode: 'view' | 'edit' | 'add',
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
					${ p.is_auto && p.sourceref && p.sourceref.name === 'checkpers' ? html`<span class="isauto_ischecking">B</span>&nbsp;` : '' }
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



	ol2_actionclicked() {
		if (this.s.mode === 'view') {
			this.addPayment()
			return
		}

		this.savePayment()
	}

	set_ol2_actionterm(actionterm: string) {
		const ol2el = this.closest("c-ol2")
		if (!ol2el) return
		ol2el.setAttribute("actionterm", actionterm)
	}

	editPayment(id: string) {
		const p = this.m.payments.find(pp => pp.id === id) || null
		if (!p) { alert(`Payment ${id} not found`); return }
		this.s.editing_payment = p
		this.s.mode = 'edit'
		this.set_ol2_actionterm("save")
		this.render()
	}

	addPayment() {
		this.s.editing_payment = {
			payee: 'placeholder',
			type: 'debtaccount',
			catref: null,
			recurence: 'monthly',
			day: 1,
			amount: 1,
			varies: false,
			is_auto: false,
			sourceref: null,
			breakdown: [],
			notes: '',
			merchantstr: '',
		} as any
		this.s.mode = 'add'
		this.set_ol2_actionterm("save")
		this.render()
	}

	doneEdit() {
		this.s.editing_payment = null
		this.s.mode = 'view'
		this.set_ol2_actionterm("add")
		this.render()
	}

	async deletePayment() {
		if (!this.s.editing_payment) return
		if (this.s.mode !== 'edit') return
		const payment = this.s.editing_payment
		if (!confirm(`Delete payment "${payment.payee}"?`)) return
		await $N.DataHodl.DeleteLocalDB('payments/'+ payment.id)
		this.doneEdit()
	}

	async savePayment() {
		if (!this.s.editing_payment) return

		const paymentform = this.shadow.querySelector('c-form[name="paymentform"]') as HTMLElement
		const inputs = paymentform.querySelectorAll('c-in2')
		const values:Record<string, string> = {}

		for (const input of inputs) {
			const name = input.getAttribute('name')
			const val = input.getAttribute('val')
			if (name && val !== null) values[name] = val
		}

		const payment = this.s.editing_payment

		const paydata: Omit<PaymentT, 'catref' | 'sourceref'> & { cat: {__path:[string,string] }  | null, source: {__path:[string,string] } | null } = {
			id: "",
			payee: values['payee'] || '',
			type: values['type'] as any,
			cat: values['cat'] && values['cat'] !== 'NONE' ? { __path:[ 'cats', values['cat'] ] } : null,
			recurence: values['recurence'] as any,
			day: parseInt(values['day'], 10),
			amount: parseFloat(values['amount']),
			varies: values['varies'] === 'true',
			is_auto: values['is_auto'] === 'true',
			source: values['payment_source'] && values['payment_source'] !== 'NONE' ? { __path:[ 'sources', values['payment_source'] ] } : null,
			breakdown: [],
			notes: values['notes'] || '',
			merchantstr: values['merchantstr'] || '',
		}

		if (this.s.mode === 'add') {
			await $N.DataHodl.AddLocalDB('payments', paydata)
			this.doneEdit()
			return
		}

		const changed:any = {}

		if ((payment.payee || '') !== paydata.payee) changed.payee = paydata.payee
		if (String(payment.amount || 0) !== values['amount']) changed.amount = paydata.amount
		if (String(payment.day || 0) !== values['day']) changed.day = paydata.day
		if ((payment.is_auto ? 'true' : 'false') !== values['is_auto']) changed.is_auto = paydata.is_auto
		if ((payment.varies ? 'true' : 'false') !== values['varies']) changed.varies = paydata.varies
		if ((payment.notes || '') !== paydata.notes) changed.notes = paydata.notes
		if ((payment.merchantstr || '') !== paydata.merchantstr) changed.merchantstr = paydata.merchantstr
		if (payment.recurence !== paydata.recurence) changed.recurence = paydata.recurence
		if (payment.type !== paydata.type) changed.type = paydata.type
		if ( (payment.catref?.id ?? 'NONE') !== ( paydata.cat?.__path[1] || 'NONE' ) ) changed.cat = paydata.cat
		if ( (payment.sourceref?.id ?? 'NONE') !== ( paydata.source?.__path[1] || 'NONE' ) ) changed.source = paydata.source

		if (Object.keys(changed).length) {
			await $N.DataHodl.PatchLocalDB("payments/"+payment.id, changed) 
		}
	}


	render(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 

}


customElements.define('vp-financepayments', VPFinancePayments);



