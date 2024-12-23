

import { $NT } from "../../../../../defs_client_symlink.js"
import { TransactionT, AreaT, CatT, SnapShotsT, MonthSnapShotT } from '../../../../../defs.js'
import { bucket_amount_remainder_single } from '../../../../libs/financefuncs/bucket.js'

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var $N: $NT;



type Model = {
	prop1: string,
}

type State = {
    amtXfer: number,
    fromCat: CatT|null,
    toCat: CatT|null,
    from: {
        bucketAvail: number,
        remain: number,
        name: string,
    },
    to: {
        bucketAvail: number,
        newTotal: number,
        name: string,
    },
    active: boolean
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
            amtXfer: 0,
            fromCat: null,
            toCat: null,
            from: { bucketAvail: 0, remain: 0, name: "" },
            to: { bucketAvail: 0, newTotal: 0, name: "" },
            active: false
        };
        
        this.shadow = this.attachShadow({mode: 'open'});
    }




	async connectedCallback() {   
		this.sc()
		this.dispatchEvent(new Event('hydrated'))
	}




    show_selector(fromCat:CatT, toCat:CatT, area:AreaT, transactions:TransactionT[]) {
        this.s.fromCat = fromCat;
        this.s.toCat = toCat;

        this.s.from.bucketAvail = bucket_amount_remainder_single(area, fromCat, transactions);
        this.s.to.bucketAvail = bucket_amount_remainder_single(area, toCat, transactions);
        
        this.s.amtXfer = this.s.from.bucketAvail * 0.25;
        this.s.from.remain = this.s.from.bucketAvail - this.s.amtXfer;
        this.s.to.newTotal = this.s.to.bucketAvail + this.s.amtXfer;

        this.s.active = true;
        this.sc();
    }




	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		Lit_Render(this.template(this.s, this.m), this.shadow);   
	}




    onTransferChange(event: Event) {
        const newTransfer = parseFloat((event.target as HTMLInputElement).value);
        this.sc({
            amtXfer: newTransfer,
            from: { ...this.s.from, remain: this.s.from.bucketAvail - newTransfer },
            to: { ...this.s.to, newTotal: this.s.to.bucketAvail + newTransfer }
        });
    }

    async onSubmit() {
        const fromBucketNew = (this.s.fromCat as any).bucket - this.s.amtXfer;
        const toBucketNew = (this.s.toCat as any).bucket + this.s.amtXfer;
        
        const fromUpdate = { id: this.s.fromCat!.id, bucket: Math.round(fromBucketNew) };
        const toUpdate = { id: this.s.toCat!.id, bucket: Math.round(toBucketNew) };
        
        await $N.FetchLassie("/api/xen/finance/patch_cat_buckets", {
            method: "PATCH",
            body: JSON.stringify({ from: fromUpdate, to: toUpdate })
        });
        
        this.s.toCat = null;
        this.s.fromCat = null;
        this.s.active = false;
    }

	template = (_s:State, _m:Model) => { return Lit_Html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-bucket', VPFinanceBucket);



