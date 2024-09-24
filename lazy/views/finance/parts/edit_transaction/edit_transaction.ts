

import { str, bool, int } from "../../../../../../definitions.js"
import { TransactionT } from '../../../../../finance_defs.js'

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var Firestore: any;




type Model = {
	prop: str,
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
		}

		this.s = {
			prop: "",
		} 

		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {   

		const transaction = await Firestore.Retrieve(`transactions/${this.getAttribute("transaction")}`)

		this.m.transaction = transaction[0];
		this.sc()

		this.dispatchEvent(new Event('hydrated'))
	}




	async merchant_changed(e:any) {

		const el = this.shadow.querySelector("c-in[name='merchant']") as any

		if (!e.detail.newval) { 
			alert("Merchnat cannot be empty")
			return
		}

		await Firestore.Patch(`transactions/${this.m.transaction!.id}`, {"merchant": e.detail.newval});

		el.SaveResponse( e.detail.newval );

		(window as any).ToastShow("Merchant Updated")

		this.sc()
	}



	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		Lit_Render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:State, _m:Model) => { return Lit_Html`{--css--}{--html--}`; } 

}


customElements.define('vp-transaction-edit', VPTransactionEdit);



