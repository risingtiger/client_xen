

import { $NT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
//import { TransactionT, AreaT, CatT, SnapShotsT, MonthSnapShotT } from '../../../../../defs.js'
//import { snapshots, snapshots_for_ui, monthsnapshot } from '../../../../libs/financefuncs/snapshot.js'

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var $N: $NT;




type Model = {
	prop:string
}


type State = {
    propa: str;
}




class VPFinanceBucket extends HTMLElement {

    s:State
    m:Model
    shadow:ShadowRoot




	constructor() {   
		super(); 

		this.m = {
			prop: "",
		}

		this.s = {
			propa: "",
		} 

		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {   
		this.sc()
		this.dispatchEvent(new Event('hydrated'))
	}




	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		Lit_Render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:State, _m:Model) => { return Lit_Html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-bucket', VPFinanceBucket);



