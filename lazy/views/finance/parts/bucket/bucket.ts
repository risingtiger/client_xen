

import { $NT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
//import { TransactionT, AreaT, CatT, SnapShotsT, MonthSnapShotT } from '../../../../../defs.js'
//import { snapshots, snapshots_for_ui, monthsnapshot } from '../../../../libs/financefuncs/snapshot.js'

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var $N: $NT;




type Model = {
    cat_from_id: string,
    cat_from_name: string,
    cat_from_bucket_available: number,
    cat_to_id: string,
    cat_to_name: string,
    cat_to_bucket_available: number
}

type State = {
    amount_transfer: number,
    cat_from_remaining: number,
    cat_to_new_total: number
}




class VPFinanceBucket extends HTMLElement {

    s:State
    m:Model
    shadow:ShadowRoot




    constructor() {   
        super();
        this.m = {
            cat_from_id: this.getAttribute('cat_from_id') || '',
            cat_from_name: this.getAttribute('cat_from_name') || '',
            cat_from_bucket_available: parseFloat(this.getAttribute('cat_from_bucket_available') || '0'),
            cat_to_id: this.getAttribute('cat_to_id') || '',
            cat_to_name: this.getAttribute('cat_to_name') || '',
            cat_to_bucket_available: parseFloat(this.getAttribute('cat_to_bucket_available') || '0')
        };
        
        const defaultTransfer = this.m.cat_from_bucket_available * 0.25;
        this.s = {
            amount_transfer: defaultTransfer,
            cat_from_remaining: this.m.cat_from_bucket_available - defaultTransfer,
            cat_to_new_total: this.m.cat_to_bucket_available + defaultTransfer
        };
        
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




    onTransferChange(event: Event) {
        const newTransfer = parseFloat((event.target as HTMLInputElement).value);
        this.sc({
            amount_transfer: newTransfer,
            cat_from_remaining: this.m.cat_from_bucket_available - newTransfer,
            cat_to_new_total: this.m.cat_to_bucket_available + newTransfer
        });
    }

    onSubmit() {
        const eventDetail = {
            detail: {
                amount_transferred: this.s.amount_transfer
            }
        };
        this.dispatchEvent(new CustomEvent('buckets_changed', eventDetail));
    }

	template = (_s:State, _m:Model) => { return Lit_Html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-bucket', VPFinanceBucket);



