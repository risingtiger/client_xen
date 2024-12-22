

import { $NT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { TransactionT, AreaT, CatT, SnapShotsT, MonthSnapShotT } from '../../../../../defs.js'
import { snapshots, snapshots_for_ui, monthsnapshot } from '../../../../libs/financefuncs/snapshot.js'

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var $N: $NT;




type Model = {
	prop:string
}

type State = {
	propa: str,
	snapshots: SnapShotsT 
	snapshots_for_ui: {months: any[], synopsis: any[]}
}




class VPFinanceSnapShot extends HTMLElement {

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
			snapshots: { months: [], avgs: [] },
			snapshots_for_ui: {months: [], synopsis: []}
		} 

		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {   
		this.sc()
		this.dispatchEvent(new Event('hydrated'))
	}




	runit(areas:AreaT[], cats:CatT[], transactions:TransactionT[], previous_static_monthsnapshots:MonthSnapShotT[], months_to_process:Date[]) {

		this.s.snapshots = snapshots(areas, cats, transactions, previous_static_monthsnapshots, months_to_process)
	}




	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		Lit_Render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:State, _m:Model) => { return Lit_Html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-snapshot', VPFinanceSnapShot);



/*
in the snapshot web component I have a variable called this.s.snapshots. I want to create another variab
le that is better suited for rendering to the HTML. I want you to create a function within the component that does 
this. I want the new array to contain 3 elements, each corresponding to an area. I want the areas to be 'fam','pers
' and 'rtm'. I want each of these to contain the following. totals of this.s.snapshot's avgs for that area for quad
1, quad2, quad3 and quad4. I also want you to add two SUMs. First: quad1+quad2. Second: quad1+quad2+quad3. Then I w
ant you to also create sums of the areas's budget totals that correspond these these quad1, etc etc. Then I want yo
u to create a grand total of each quad1,2,3,4 and budget1,2,3,4 for all areas as a new row in the array. 
*/
