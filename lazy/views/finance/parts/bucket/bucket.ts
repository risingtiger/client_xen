

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
    clicks: {
        fromType: 'cat' | 'hldrbucket' | 'none',
        toType: 'cat' | 'hldrbucket' | 'none',
        fromCatId: string | null,
        toCatId: string | null,
    },
    amount: number,
    fromCat: CatT|null,
    toCat: CatT|null,
    from: {
        available: number,
        newAmt: number,
        catId: string|null,
        name: string,
    },
    to: {
        available: number,
        newAmt: number,
        catId: string|null,
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
            clicks: {
                fromType: 'none',
                toType: 'none',
                fromCatId: null,
                toCatId: null
            },
            amount: 0,
            fromCat: null,
            toCat: null,
            from: { available: 0, newAmt: 0, catId: null, name: "" },
            to: { available: 0, newAmt: 0, catId: null, name: "" },
            active: false,
            mode: 'movebetween'
        };
        
        this.shadow = this.attachShadow({mode: 'open'});
    }




	async connectedCallback() {   
		this.sc()
		this.dispatchEvent(new Event('hydrated'))
	}



    private getCatById(catId: string, cats: CatT[]): CatT | undefined {
        const flatCats = cats.flatMap(c => c.subs || []);
        return flatCats.find(c => c.id === catId);
    }

    private initializeTransferData(
        type: 'from' | 'to',
        catType: string,
        catId: string | null,
        flatCats: CatT[],
        area: AreaT,
        transactions: TransactionT[],
        holderAmount: number
    ) {
        if (catType === 'cat' && catId) {
            const cat = this.getCatById(catId, flatCats)!;
            this.s[type].available = cat_bucket_remainder_single(area, cat, transactions);
            this.s[type].name = cat.name;
            this.s[type].catId = catId;
        } else if (catType === 'hldrbucket') {
            this.s[type].available = holderAmount;
            this.s[type].name = "Holder Bucket";
            this.s[type].catId = null;
        }
    }

    twoStepClicks(e: MouseEvent, area: AreaT, cats: CatT[], transactions: TransactionT[], catTags: number[], holderAmount: number) {

        if (this.s.clicks.toType !== 'none') {
            this.s.clicks.fromType = 'none';
            this.s.clicks.fromCatId = null;
            this.s.clicks.toType = 'none';
            this.s.clicks.toCatId = null;
        }

        const flatCats = cats.flatMap(c => c.subs || []);
        const el = e.currentTarget as HTMLElement;
        const catId = el.dataset.cat_id as string;
        const cat = catId ? flatCats.find(c => c.id === catId) : null;
        const isHolderBucket = el.id === "hldrbucket";

        // Early returns for invalid conditions
        if (!cat && !isHolderBucket) return;
        if (catTags[0] < 3 || catTags[0] > 4) return;
        if (!holderAmount) return;
        if (this.s.clicks.fromCatId === catId) return;
        if (this.s.clicks.fromType === 'hldrbucket' && isHolderBucket) return;


        if (this.s.clicks.fromType === 'none') {
            this.s.clicks.fromType = isHolderBucket ? 'hldrbucket' : 'cat';
            this.s.clicks.fromCatId = cat ? cat.id : null;
        } else if (this.s.clicks.toType === 'none') {
            this.s.clicks.toType = isHolderBucket ? 'hldrbucket' : 'cat';
            this.s.clicks.toCatId = cat ? cat.id : null;

            // Initialize transfer data
            this.initializeTransferData('from', this.s.clicks.fromType, this.s.clicks.fromCatId, flatCats, area, transactions, holderAmount);
            this.initializeTransferData('to', this.s.clicks.toType, this.s.clicks.toCatId, flatCats, area, transactions, holderAmount);

            // Reset amounts
            this.s.amount = 0;
            this.s.from.newAmt = this.s.from.available;
            this.s.to.newAmt = this.s.to.available;

            this.s.active = true;
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
        const newAmount = parseFloat((event.target as HTMLInputElement).value);
        this.sc({
            amount: newAmount,
            from: { ...this.s.from, newAmt: this.s.from.available - newAmount },
            to: { ...this.s.to, newAmt: this.s.to.available + newAmount }
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



