

import { $NT } from "../../../../../defs_client_symlink.js"
//import { str } from "../../../../../defs_server_symlink.js"
import { TransactionT, AreaT, CatT, SnapShotsT, MonthSnapShotT } from '../../../../../defs.js'
import { bucket_amount_remainder_single } from '../../../../libs/financefuncs/bucket.js'

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var $N: $NT;



type Model = {
	prop1: string,
}

type State = {
    amount_transfer: number,
	cat_from: CatT|null,
	cat_to: CatT|null,
    cat_from_bucket_available: number,
    cat_to_bucket_available: number
    cat_from_remaining: number,
    cat_to_new_total: number,
	cat_from_name: string,
	cat_to_name: string,
	is_active: boolean
}




class VPFinanceBucket extends HTMLElement {

    s:State
    m:Model
    shadow:ShadowRoot




    constructor() {   
        super();
        this.m = {
			prop1: "prop1"
        };
        
        this.s = {
            amount_transfer: 0,
			cat_from:null, 
			cat_to:null, 
            cat_from_bucket_available: 0,
            cat_to_bucket_available: 0,
            cat_from_remaining: 0,
            cat_to_new_total: 0,
			cat_from_name: "",
			cat_to_name: "",
			is_active: false
        };
        
        this.shadow = this.attachShadow({mode: 'open'});
    }




	async connectedCallback() {   
		this.sc()
		this.dispatchEvent(new Event('hydrated'))
	}




    show_selector(cat_from:CatT, cat_to:CatT, area:AreaT, transactions:TransactionT[]) {

		this.s.cat_from = cat_from;
		this.s.cat_to = cat_to;

		console.time("bucket_amount_remainder_single")
		this.s.cat_from_bucket_available = bucket_amount_remainder_single(area, cat_from, transactions);
		this.s.cat_to_bucket_available   = bucket_amount_remainder_single(area, cat_to, transactions);
		console.timeEnd("bucket_amount_remainder_single")

        this.s.amount_transfer = this.s.cat_from_bucket_available * 0.25;
        this.s.cat_from_remaining = this.s.cat_from_bucket_available - this.s.amount_transfer;
        this.s.cat_to_new_total = this.s.cat_to_bucket_available + this.s.amount_transfer;

		this.s.is_active = true;

        this.sc();
    }




	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		Lit_Render(this.template(this.s, this.m), this.shadow);   
	}




    onTransferChange(event: Event) {
        const newTransfer = parseFloat((event.target as HTMLInputElement).value);
        this.sc({
            amount_transfer: newTransfer,
            cat_from_remaining: this.s.cat_from_bucket_available - newTransfer,
            cat_to_new_total: this.s.cat_to_bucket_available + newTransfer
        });
    }

    async onSubmit() {

		const from_bucket_new_balance = (this.s.cat_from as any).bucket - this.s.amount_transfer;
		const to_bucket_new_balance = (this.s.cat_to as any).bucket + this.s.amount_transfer;

		const from = { id: this.s.cat_from!.id, bucket: Math.round(from_bucket_new_balance) };
		const to   = { id: this.s.cat_to!.id,   bucket: Math.round(to_bucket_new_balance) };

		await $N.FetchLassie("/api/xen/finance/patch_cat_buckets", { method: "PATCH", body: JSON.stringify({from, to}) })

		this.s.cat_to    = null;
		this.s.cat_from  = null;
		this.s.is_active = false;


		console.log("check it")
    }

	template = (_s:State, _m:Model) => { return Lit_Html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-bucket', VPFinanceBucket);



