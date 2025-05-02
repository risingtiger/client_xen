

import { $NT, CMechLoadedDataT, CMechLoadStateE } from "../../../../../defs_client_symlink.js"
import { TransactionT, AreaT, CatT, AreaQuadBucketTotalsT, CatBucketsInfoT } from '../../../../../defs.js'
import { cat_bucket_remainder } from '../../../../libs/financefuncs_bucket.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;


type MoveBetweenCatsOrUnassignedItemT = {
	available: number,
	newAmt: number,
	cat: CatT|null,
	name: string,
}

type MoveBetweenSavingsAndCheckingT = {
	newBucket: number,
	newUnassigned: number,
	newSpentCovered: number,
	newRemainder: number,
	newDrawnAwayFromCats: number,
	newInAmount: number,
	transfer_statement: string,
	newCatBucketAmounts: {catId:string, catName:string, bucket:number}[]
}

type ManageT = {
	ref_ts_as_date_str:string, 
	cat_buckets: CatBucketsInfoT[],
	area_quad_bucket_totals: AreaQuadBucketTotalsT
}


type AttributesT = {
	prop1: string,
}

type ModelT = {
	prop1: string,
}

type StateT = {
    clicks: {
        fromType: 'cat' | 'unassigned' | 'none',
        toType: 'cat' | 'unassigned' | 'none',
        fromCatId: string | null,
        toCatId: string | null,
    },
	error: string,
	manage: ManageT,
	quad: number,
    amount: number,
	area: AreaT|null,
    from: MoveBetweenCatsOrUnassignedItemT,
    to:   MoveBetweenCatsOrUnassignedItemT,
	bigmoveit: MoveBetweenSavingsAndCheckingT,
    mode: 'inactive' | 'error' | 'movebetween_cats_or_unassigned' | 'manage'
}


const ATTRIBUTES:AttributesT = { prop1:"" }


class VPFinanceBucket extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES }
	s:StateT = {
		clicks: {
			fromType: 'none',
			toType: 'none',
			fromCatId: null,
			toCatId: null
		},
		error: "",
		manage: {
			ref_ts_as_date_str: "",
			cat_buckets: [],
			area_quad_bucket_totals: {remainder: 0, spent: 0, assigned:0, unassigned: 0}
		},
		quad: 0,
		amount: 0,
		area: null,
		from: { available: 0, newAmt: 0, cat: null, name: "" },
		to: { available: 0, newAmt: 0, cat: null, name: "" },
		bigmoveit: { newBucket: 0, newUnassigned:0, newSpentCovered:0, newRemainder:0, newDrawnAwayFromCats:0, newCatBucketAmounts:[], newInAmount:0, transfer_statement: "" },
		mode: 'inactive'
	}
    m:ModelT = { prop1: "prop1" }
    shadow:ShadowRoot




    constructor() {   
        super();
        this.shadow = this.attachShadow({mode: 'open'});
    }




	async connectedCallback() {   
		await $N.CMech.ViewPartConnectedCallback(this)
		this.dispatchEvent(new Event('hydrated'));
	}




	async attributeChangedCallback(name:string, oldval:string|boolean|number, newval:string|boolean|number) {
		$N.CMech.AttributeChangedCallback(this,name,oldval,newval);
	}




	disconnectedCallback() { $N.CMech.ViewPartDisconnectedCallback(this); }




	kd = (_loadeddata: CMechLoadedDataT, _loadstate:CMechLoadStateE) => {
	}




	showManageUI(
		area: AreaT, 
		catTags: number[],
		cat_buckets: CatBucketsInfoT[],
		area_quad_bucket_totals:AreaQuadBucketTotalsT
	) {
        if (catTags[0] < 3 || catTags[0] > 4 || this.s.error != "") {
			this.s.error = "must be quad 3 or 4 -- or close window first";
			this.s.mode = 'error';
			this.sc();
			return;
		}


		this.s.area = area;
		this.s.quad = catTags[0];
		this.s.mode = 'manage';
		this.s.area = area;
		this.s.manage.ref_ts_as_date_str = new Date(area[`bucketquad${catTags[0]}_ref_ts`]*1000).toLocaleDateString();
		this.s.manage.cat_buckets = cat_buckets;
		this.s.manage.area_quad_bucket_totals = area_quad_bucket_totals;

		this.sc();
	}




    twoStepClicks(catId:string, elId:string, area: AreaT, cats: CatT[], transactions: TransactionT[], catTags: number[], area_quad_bucket_totals:AreaQuadBucketTotalsT) {

        const flatCats           = cats.flatMap(c => c.subsref || []);
        const cat                = catId ? flatCats.find(c => c.id === catId) : null;
        const isUnassignedBucket = elId === "unassigned";

		let error = ""

		if      (this.s.error)												   error = "Please close before continuing";
		else if (!cat && !isUnassignedBucket)                                   error = "No cat or bucket found";
		else if (catTags[0] < 3 || catTags[0] > 4)                              error = "Not a quad 3 or 4 category";
		else if (this.s.clicks.fromCatId === catId)                             error = "Cannot move to same category";
		else if (this.s.clicks.fromType === 'unassigned' && isUnassignedBucket) error = "Cannot move from unassigned to unassigned";

		if (error) {
			this.s.error = error;
			this.s.mode = 'error';
			this.sc();
			return;
		}


        if (this.s.clicks.fromType === 'none') {
            this.s.clicks.fromType = isUnassignedBucket ? 'unassigned' : 'cat';
            this.s.clicks.fromCatId = cat ? cat.id : null;

        } else if (this.s.clicks.toType === 'none') {
            this.s.clicks.toType = isUnassignedBucket ? 'unassigned' : 'cat';
            this.s.clicks.toCatId = cat ? cat.id : null;

            initializeTransferData('from', [this.s.from, this.s.to], this.s.clicks.fromType, this.s.clicks.fromCatId);
            initializeTransferData('to',   [this.s.from, this.s.to], this.s.clicks.toType,   this.s.clicks.toCatId);

            this.s.amount = 0;
            this.s.from.newAmt = this.s.from.available;
            this.s.to.newAmt = this.s.to.available;

			this.s.area = area;
			this.s.quad = catTags[0];
        }

		this.s.mode = 'movebetween_cats_or_unassigned';
		this.sc();



		function initializeTransferData(type: 'from' | 'to', fromtoarray: any[], bucketType: 'cat' | 'unassigned' | 'none', catId: string | null ) {
			const typeindex = type === 'from' ? 0 : 1;
			if (bucketType === 'cat' && catId) {
				const cat = flatCats.find(c => c.id === catId) as CatT;
				fromtoarray[typeindex].available = cat_bucket_remainder(area, cat, transactions);
				fromtoarray[typeindex].name = cat.name;
				fromtoarray[typeindex].cat = cat;
			} else if (bucketType === 'unassigned') {
				fromtoarray[typeindex].available = area_quad_bucket_totals.unassigned
				fromtoarray[typeindex].name = "Unassigned Bucket";
				fromtoarray[typeindex].cat = null;
			}
		}
	}  




	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m), this.shadow);   
	}




    onMoveBetweenCatsOrUnassignedBucketsChange(event: Event) {
        const newAmount = parseFloat((event.target as HTMLInputElement).value);
		const obj = {
            amount: newAmount,
            from: { ...this.s.from, newAmt: this.s.from.available - newAmount },
            to: { ...this.s.to, newAmt: this.s.to.available + newAmount }
		}

		/*
		const input = this.shadow.querySelector("input[name='move-between-savings-and-checking-input']")
		const range = this.shadow.querySelector("input[name='move-between-savings-and-checking-range']")

		if ((event.target as HTMLInputElement).type === "range") {
			(input as HTMLInputElement).value = newAmount.toString();

		} else if ((event.target as HTMLInputElement).type === "input") {
			(range as HTMLInputElement).value = newAmount.toString();
		}
		*/

        this.sc(obj);
    }

    async onMoveBetweenCatsOrUnassignedBucketsSubmit() {

		const catupdates:any        = []

		if (this.s.from.cat) {
			const newBucketAmnt = (this.s.from.cat?.bucket??0) - this.s.amount;
			catupdates.push({ id: this.s.from.cat.id, bucket: Math.round(newBucketAmnt) });
		} // if from is unassigned bin , just do nothing. calculations of unassigned are soley based on totals of all cat buckets

		if (this.s.to.cat) {
			const newBucketAmnt = (this.s.to.cat?.bucket??0) + this.s.amount;
			catupdates.push({ id: this.s.to.cat.id, bucket: Math.round(newBucketAmnt) });
		} // if from is unassigned bin , just do nothing. calculations of unassigned are soley based on totals of all cat buckets

		const sendobj:any = { catupdates }

		// if between holder bin, there is NO holder bin in the database. just add to or subtract cat's bucket and the 'hldr' is deduced as difference from area's bucket

		await $N.FetchLassie("/api/xen/finance/patch_buckets", { method: "PATCH", body: JSON.stringify(sendobj) });

		this.sc();

		this.dispatchEvent(new Event('close'))
    }




	async onMoveBetweenSavingsAndCheckingChange(amount:any) {
		amount        = parseInt(amount);

		if (amount < 0) {
			this.s.amount = Math.abs(amount);
			this.s.bigmoveit.transfer_statement = "transfer " + this.s.amount + " out of savings to checking";
			this.s.bigmoveit.newBucket = this.s.area!['bucketquad'+this.s.quad] - this.s.amount;

			this.s.bigmoveit.newSpentCovered = this.s.manage.area_quad_bucket_totals.spent - this.s.amount;
			this.s.bigmoveit.newSpentCovered = this.s.bigmoveit.newSpentCovered < 0 ? 0 : this.s.bigmoveit.newSpentCovered;

			if (this.s.bigmoveit.newSpentCovered === 0) {
				const minusamount = this.s.amount - this.s.manage.area_quad_bucket_totals.spent;
				this.s.bigmoveit.newRemainder = this.s.manage.area_quad_bucket_totals.remainder - minusamount;
				this.s.bigmoveit.newUnassigned = this.s.manage.area_quad_bucket_totals.unassigned - minusamount;
				this.s.bigmoveit.newUnassigned = this.s.bigmoveit.newUnassigned < 0 ? 0 : this.s.bigmoveit.newUnassigned;

			} else {
				this.s.bigmoveit.newRemainder  = this.s.manage.area_quad_bucket_totals.remainder;
				this.s.bigmoveit.newUnassigned = this.s.manage.area_quad_bucket_totals.unassigned;
			}

			if (this.s.bigmoveit.newUnassigned === 0) {
				const minusamount = this.s.amount - this.s.manage.area_quad_bucket_totals.spent - this.s.manage.area_quad_bucket_totals.unassigned;
				this.s.bigmoveit.newDrawnAwayFromCats = minusamount;
			} else {
				this.s.bigmoveit.newDrawnAwayFromCats = 0;
			}

			this.s.bigmoveit.newCatBucketAmounts = []

			for (const catbucket of this.s.manage.cat_buckets) {
				if (catbucket.catref.tags[0] === this.s.quad && catbucket.catref.bucket) {

					const robj = {catId: catbucket.catref.id, catName: catbucket.catref.name, bucket: 0};

					if (this.s.amount < this.s.manage.area_quad_bucket_totals.spent) {
						const percent = this.s.amount / this.s.manage.area_quad_bucket_totals.spent;
						const amountToReduceBucket = catbucket.spent * percent; // spent will be 0 if nothing has been 0 and thus nothing will be reduced from this cat
						const bucket = Math.round(catbucket.catref.bucket - amountToReduceBucket);
						robj.bucket = bucket;

					} else {
						robj.bucket = catbucket.remainder;

						if (this.s.bigmoveit.newDrawnAwayFromCats > 0) {
							const percent = this.s.bigmoveit.newDrawnAwayFromCats / (this.s.manage.area_quad_bucket_totals.remainder - this.s.manage.area_quad_bucket_totals.unassigned);
							robj.bucket = Math.round(robj.bucket - (robj.bucket * percent));
						}
					}

					this.s.bigmoveit.newCatBucketAmounts.push(robj);
				}
			}

		} else if (amount > 0) {
			this.s.amount = amount;

			const s = this.s.manage.area_quad_bucket_totals.spent - this.s.amount

			this.s.bigmoveit.newBucket = this.s.manage.area_quad_bucket_totals.remainder + this.s.amount;
			this.s.bigmoveit.newRemainder = this.s.manage.area_quad_bucket_totals.remainder + this.s.amount;
			this.s.bigmoveit.newUnassigned = this.s.manage.area_quad_bucket_totals.unassigned + this.s.amount;
			this.s.bigmoveit.newSpentCovered = this.s.manage.area_quad_bucket_totals.spent;

			if (s > 0) {
				this.s.bigmoveit.transfer_statement = "transfer " + (s) + " from savings to checking to cover spent"
			} else {
				this.s.bigmoveit.transfer_statement = "transfer " + (Math.abs(s)) + " from checking to savings to cover spent"
			}
		}

		this.sc();
	}




    async onMoveBetweenSavingsAndCheckingSubmit() {

		if (confirm("Make Sure to ACTUALLY transfer money from bank")) {

			const now = Math.round(new Date().getTime() / 1000);
			const area_buckets_changed:any = {}

			area_buckets_changed['bucketquad'+this.s.quad] = this.s.bigmoveit.newBucket
			area_buckets_changed['bucketquad'+this.s.quad+"_ref_ts"] = now

			const catupdates = this.s.bigmoveit.newCatBucketAmounts.map((c:any) => { return { id: c.catId, bucket: c.bucket }; });

			const payload = { catupdates, area_id: this.s.area!.id, area_buckets_changed }

			await $N.FetchLassie("/api/xen/finance/patch_buckets", { method: "PATCH", body: JSON.stringify(payload) });

			this.sc();

			this.dispatchEvent(new Event('close'))
		}
    }



	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-bucket', VPFinanceBucket);



