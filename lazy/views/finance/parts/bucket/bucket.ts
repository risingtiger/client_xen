

import { $NT } from "../../../../../defs_client_symlink.js"
import { TransactionT, AreaT, CatT } from '../../../../../defs.js'
import { cat_bucket_remainders, cat_bucket_remainder_single } from '../../../../libs/financefuncs/bucket.js'

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var $N: $NT;



type Model = {
	prop1: string,
}

type State = {
    twostepclicks: {
		from_is: 'cat' | 'hldrbucket' | 'none',
		to_is:   'cat' | 'hldrbucket' | 'none',
		from_cat_id: string | null,
		to_cat_id:   string | null,
	},
    amtXfer: number,
    fromCat: CatT|null,
    toCat: CatT|null,
    from: {
        bucketAvail: number,
        newamount: number,
		catid: string|null,
        name: string,
    },
    to: {
        bucketAvail: number,
        newamount: number,
		catid: string|null,
        name: string,
    },
	mode: 'movebetween' | 'manage'
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
			twostepclicks: {
				from_is: 'none', 
				to_is: 'none',
				from_cat_id: null,
				to_cat_id: null
			},
            amtXfer: 0,
            fromCat: null,
            toCat: null,
            from: { bucketAvail: 0, newamount: 0, catid:null, name: "" },
            to: { bucketAvail: 0, newamount: 0, catid:null, name: "" },
            active: false,
			mode: 'movebetween'
        };
        
        this.shadow = this.attachShadow({mode: 'open'});
    }




	async connectedCallback() {   
		this.sc()
		this.dispatchEvent(new Event('hydrated'))
	}



	twoStepClicks(e: MouseEvent, area:AreaT, cats:CatT[], transactions:TransactionT[], cattags:number[], cat_bucket_hldr_amount:number) {

		if (this.s.twostepclicks.to_is !== 'none') {
			this.s.twostepclicks.from_is = 'none'
			this.s.twostepclicks.from_cat_id = null
			this.s.twostepclicks.to_is = 'none'
			this.s.twostepclicks.to_cat_id = null
		}

		const flatcats         = cats.flatMap(c => c.subs ? c.subs : [])
		const el               = e.currentTarget as HTMLElement;
		const cat_id           = el.dataset.cat_id as string;
		const cat              = cat_id ? flatcats.find(c => c.id === cat_id) : null
		const is_el_hldrbucket = el.id === "hldrbucket" ? true : false

		if (!cat && !is_el_hldrbucket) return;
		if (cattags[0] < 3 || cattags[0] > 4) return;
		if (!cat_bucket_hldr_amount) return;
		if (this.s.twostepclicks.from_cat_id === cat_id) return;
		if (this.s.twostepclicks.from_is === 'hldrbucket' && is_el_hldrbucket) return;


		if (this.s.twostepclicks.from_is === 'none') {
			this.s.twostepclicks.from_is = is_el_hldrbucket ? 'hldrbucket' : 'cat'
			this.s.twostepclicks.from_cat_id = cat ? cat.id : null

		} else if (this.s.twostepclicks.to_is === 'none') {
			this.s.twostepclicks.to_is = is_el_hldrbucket ? 'hldrbucket' : 'cat'
			this.s.twostepclicks.to_cat_id = cat ? cat.id : null

			if (this.s.twostepclicks.from_is === 'cat' && this.s.twostepclicks.from_cat_id) {
				this.s.from.bucketAvail = cat_bucket_remainder_single(area, flatcats.find(c=>c.id === this.s.twostepclicks.from_cat_id)!, transactions)
				this.s.from.name = flatcats.find(c=>c.id === this.s.twostepclicks.from_cat_id)!.name
				this.s.from.catid = this.s.twostepclicks.from_cat_id

			} else if (this.s.twostepclicks.from_is === 'hldrbucket') {
				this.s.from.bucketAvail = cat_bucket_hldr_amount
				this.s.from.name = "Hldr Bucket"
				this.s.from.catid = null
			}


			if (this.s.twostepclicks.to_is === 'cat' && this.s.twostepclicks.to_cat_id) {
				this.s.to.bucketAvail = cat_bucket_remainder_single(area, flatcats.find(c=>c.id === this.s.twostepclicks.to_cat_id)!, transactions)
				this.s.to.name = flatcats.find(c=>c.id === this.s.twostepclicks.to_cat_id)!.name
				this.s.to.catid = this.s.twostepclicks.to_cat_id

			} else if (this.s.twostepclicks.to_is === 'hldrbucket') {
				this.s.to.bucketAvail = cat_bucket_hldr_amount
				this.s.to.name = "Hldr Bucket"
				this.s.to.catid = null
			}

			this.s.amtXfer = 0
			this.s.from.newamount = this.s.from.bucketAvail
			this.s.to.newamount = this.s.to.bucketAvail

			this.s.active = true
		}

		this.sc();
	}  



	/*
    add_more(area:AreaT, quad:number, transactions:TransactionT[]) {

		if (fromCat.tags[0] !== toCat.tags[0]) {
			alert ("categories gotta be in same quadrant")
			return false
		}



        this.s.fromCat = fromCat;
        this.s.toCat   = toCat;

        this.s.from.bucketAvail = cat_bucket_remainder_single(area, fromCat, transactions);
        this.s.to.bucketAvail   = cat_bucket_remainder_single(area, toCat, transactions);
        
        this.s.amtXfer        = 0;
        this.s.from.newamount = this.s.from.bucketAvail;
        this.s.to.newamount   = this.s.to.bucketAvail;

        this.s.active = true;
        this.sc();
    }
	*/




	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		Lit_Render(this.template(this.s, this.m), this.shadow);   
	}




    onTransferChange(event: Event) {
        const newTransfer = parseFloat((event.target as HTMLInputElement).value);
        this.sc({
            amtXfer: newTransfer,
            from: { ...this.s.from, newamount: this.s.from.bucketAvail - newTransfer },
            to:   { ...this.s.to, newamount: this.s.to.bucketAvail + newTransfer }
        });
    }

    async onMoveBetweenCatsOrHldrBucketSubmit() {

        const fromBucketNew = (this.s.fromCat as any).bucket - this.s.amtXfer;
        const toBucketNew   = (this.s.toCat as any).bucket + this.s.amtXfer;
        
		if (this.s.mode === 'movebetweencats') {
			const fromUpdate = { id: this.s.fromCat!.id, bucket: Math.round(fromBucketNew) };
			const toUpdate   = { id: this.s.toCat!.id, bucket: Math.round(toBucketNew) };
			
			await $N.FetchLassie("/api/xen/finance/patch_cat_buckets", {
				method: "PATCH",
				body: JSON.stringify({ from: fromUpdate, to: toUpdate })
			});
		}
        
		this.s.amtXfer = 0;
        this.s.toCat   = null;
        this.s.fromCat = null;
		this.s.from    = { bucketAvail: 0, newamount: 0, name: "" };
		this.s.to      = { bucketAvail: 0, newamount: 0, name: "" };
        this.s.active  = false;

		this.sc();

    }




	template = (_s:State, _m:Model) => { return Lit_Html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-bucket', VPFinanceBucket);



