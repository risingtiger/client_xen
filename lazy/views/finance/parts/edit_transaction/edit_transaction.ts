

import { $NT, CMechLoadedDataT, CMechLoadStateE } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { TransactionT, AreaT, CatT, TagT, SourceT } from '../../../../../defs.js'
import { knit_cats, knit_transactions, knit_tags  } from '../../../../libs/financefuncs_knit.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;



type AttributesT = {
	transaction: string
}

type ModelT = {
	areas: AreaT[],
	cats: CatT[],
	tags: TagT[],
	transaction:TransactionT|null,
	transaction_tag_id:string
}

type StateT = {
	prop: str,
	cat_options: str
	tag_options: str
}


const ATTRIBUTES:AttributesT = { transaction:"" }


class VPFinanceEditTransaction extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES };
    s:StateT = {
		prop: "",
		cat_options: "",
		tag_options: ""
	}
    m:ModelT = {
		areas: [],
		transaction: null,
		cats: [],
		tags: [],
		transaction_tag_id: ""
	}
    shadow:ShadowRoot


	static get observedAttributes() { return Object.keys(ATTRIBUTES); }


	constructor() {   
		super(); 
		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {   
		await $N.CMech.ViewPartConnectedCallback(this)
		this.dispatchEvent(new Event('hydrated'));
	}




	async attributeChangedCallback(name:str, oldval:str|boolean|number, newval:str|boolean|number) {
		$N.CMech.AttributeChangedCallback(this,name,oldval,newval);
	}




	disconnectedCallback() { $N.CMech.ViewPartDisconnectedCallback(this); }




	kd = (loadeddata: CMechLoadedDataT, _loadstate:CMechLoadStateE) => {

		const trs             = loadeddata.get("transactions") as TransactionT[]

		this.m.areas          = loadeddata.get("areas")! as AreaT[]
		this.m.cats           = knit_cats(this.m.areas, loadeddata.get('cats')!) as CatT[]
		this.m.tags           = $N.Utils.resolve_object_references(loadeddata.get("tags")!, loadeddata) as TagT[]

		const sources         = loadeddata.get("sources") as SourceT[]
		const transaction     = trs.find(t=>t.id === this.a.transaction)! as any

		this.m.transaction    = ( knit_transactions(this.m.cats, sources, this.m.tags, [transaction]) as TransactionT[] )[0]

		const get_cat_options = () => {
			let s = ""

			for (let cparent of this.m.cats) {
				for (let sub of cparent.subsref!) {
					s += `${sub.name}:${sub.id},`
				}
			}

			return s.slice(0, -1)
		} 

		const get_tag_options = () => {
			let s = "None:none,"
			for (let tag of this.m.tags) {
				s += `${tag.name}:${tag.id},`
			}
			return s.slice(0, -1)
		} 

		let areas:AreaT[] = []
		if (localStorage.getItem("user_email") !== 'accounts@risingtiger.com') {
			areas = ( loadeddata.get("areas")! as AreaT[]).filter(a=>a.name === "fam")
		} else {
			areas = loadeddata.get("areas")! as AreaT[]
		}

		this.s.cat_options = get_cat_options()
		this.s.tag_options = get_tag_options()

		this.m.transaction_tag_id = this.m.transaction.tagsref.length ? (this.m.transaction.tagsref[0] as any).id : ""

		/*
		const transaction = await $N.Firestore.Retrieve(`transactions/${this.getAttribute("transaction")}`)

		this.m.transaction = transaction[0];
		this.m.transaction_tag_id = this.m.transaction!.tags.length ? (this.m.transaction!.tags[0] as any)._path.segments[1] : ""

		const idata = await $N.IndexedDB.GetAll(["areas","cats", "tags"])

		let areas:AreaT[] = []
		if (localStorage.getItem("user_email") !== 'accounts@risingtiger.com') {
			areas = idata.get("areas")!.filter(a=>a.name === "fam")
		} else {
			areas = idata.get("areas")!
		}

		this.m.cats = knit_cats(areas, idata.get("cats")!) as CatT[]
		this.m.tags = knit_tags(idata.get("tags")!) as TagT[]

		this.s.cat_options = get_cat_options()
		this.s.tag_options = get_tag_options()

		this.sc()

		this.dispatchEvent(new Event('hydrated'))
		*/
	}




	async prop_updated(e:any) {

		let changed:any = {}

		if (e.detail.name === "amount") {
			changed.amount = parseFloat(e.detail.newval)
		}

		else if (e.detail.name === "notes") {
			changed.notes = e.detail.newval
		}

		else if (e.detail.name === "cat") {
			changed.cat__ref = "cats/" + e.detail.newval
		}

		else if (e.detail.name === "date") {
			const dateObj = new Date(e.detail.newval);
			changed.date = Math.floor(dateObj.getTime() / 1000); // Convert to seconds
		}

		else if (e.detail.name === "tag") {
			await $N.FetchLassie("/api/xen/finance/update_transaction_tag", { method: "POST", body: JSON.stringify({ docid: this.m.transaction!.id, tagid: e.detail.newval }) })
		}

		else if (e.detail.name === "merchant") {
			await $N.FetchLassie("/api/xen/finance/update_merchant_name", { method: "POST", body: JSON.stringify({ newname: e.detail.newval, oldname: e.detail.oldval }) })
		}


		if (Object.keys(changed).length) {
			await $N.LocalDBSync.Patch("transactions/"+this.m.transaction!.id, changed);
		}
	}



	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-edittransaction', VPFinanceEditTransaction);



