

import { str, bool, num, $NT } from "../../../../../../defs_client.js"
import { TransactionT } from '../../../../../finance_defs.js'

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var $N: $NT;




type Model = {
	prop: str,
	cats: any[],
	transaction:TransactionT|null,
}

type State = {
	prop: str,
}




class VPTransactionEdit extends HTMLElement {

    s:State
    m:Model
    shadow:ShadowRoot




	constructor() {   

		super(); 


		this.m = {
			prop: "",
			transaction: null,
			cats: [],
		}

		this.s = {
			prop: "",
		} 

		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {   

		const transaction = await $N.Firestore.Retrieve(`transactions/${this.getAttribute("transaction")}`)
		const idata = await $N.IndexedDB.GetAll(["cats"])
		this.m.cats = idata.get("cats")!.sort((a:any, b:any) => a.name.localeCompare(b.name))

		this.m.transaction = transaction[0];
		this.sc()

		this.dispatchEvent(new Event('hydrated'))
	}




	async prop_changed(e:any) {

		let saveobj:any = {}

		if (e.detail.name === "merchant") {
			saveobj.merchant = e.detail.newval
		}

		else if (e.detail.name === "amount") {
			saveobj.amount = parseFloat(e.detail.newval)
		}

		else if (e.detail.name === "notes") {
			saveobj.notes = e.detail.newval
		}

		const r = await $N.Firestore.Patch(`transactions/${this.m.transaction!.id}`, saveobj);
		if (r.err) {
			e.detail.set_save_fail(r.err)
		} else {
			e.detail.set_save_success(e.detail.newval)
		}
	}



	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		Lit_Render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:State, _m:Model) => { return Lit_Html`{--css--}{--html--}`; } 

}


customElements.define('vp-transaction-edit', VPTransactionEdit);



