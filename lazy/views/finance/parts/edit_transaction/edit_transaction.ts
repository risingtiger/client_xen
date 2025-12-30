

import { $NT, CMechLoadedDataT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { TransactionT, AreaT, CatT, TagT } from '../../../../../defs_instance_server_symlink.js'

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
	tag_options: str,
	testtog: boolean
}


const ATTRIBUTES:AttributesT = { transaction:"" }


class VPFinanceEditTransaction extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES };
    s:StateT = {
		prop: "",
		cat_options: "",
		tag_options: "",
		testtog: false
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




	async connectedCallback() {$N.CMech.RegisterViewPart(this);}   




	async attributeChangedCallback(name:str, oldval:str|boolean|number, newval:str|boolean|number) {
		$N.CMech.AttributeChangedCallback(this,name,oldval,newval);
	}




	disconnectedCallback() { $N.CMech.ViewPartDisconnectedCallback(this); }




	ingest = (loadeddata: CMechLoadedDataT) => {

		const trs             = loadeddata.get("transactions") as TransactionT[]
		this.m.areas          = loadeddata.get("areas")! as AreaT[]
		this.m.cats           = loadeddata.get("cats")! as CatT[]
		this.m.tags           = loadeddata.get("tags")! as TagT[]

		// const sources         = loadeddata.get("sources") as SourceT[]
		this.m.transaction     = trs.find(t=>t.id === this.a.transaction)! as TransactionT


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
		if (localStorage.getItem("user_email") !== 'rfs@risingtiger.com') {
			areas = ( loadeddata.get("1:areas")! as AreaT[]).filter(a=>a.name === "fam")
		} else {
			areas = loadeddata.get("1:areas")! as AreaT[]
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
		if (localStorage.getItem("user_email") !== 'rfs@risingtiger.com') {
			areas = idata.get("areas")!.filter(a=>a.name === "fam")
		} else {
			areas = idata.get("areas")!
		}

		this.m.cats = knit_cats(areas, idata.get("cats")!) as CatT[]
		this.m.tags = knit_tags(idata.get("tags")!) as TagT[]

		this.s.cat_options = get_cat_options()
		this.s.tag_options = get_tag_options()

		this.render()

		this.dispatchEvent(new Event('hydrated'))
		*/
	}




	async prop_updated(_e:any) {

		// const merchant = ( this.shadow.querySelector('c-in2[name="merchant"]') as HTMLFormElement ).getAttribute("val")
		// const promises:any[] = []
		//
		// promises.push($N.DataHodl.PatchLocalDB("transactions/"+this.m.transaction!.id, {merchant}));
		//
		// await Promise.all(promises)
		//
		// $N.ToastShow("Saved", 'saved');
	}




	async props_updated(_e?:any) {

		const mainform = this.shadow.querySelector('form[name="mainform"]') as HTMLFormElement
		const inputs = mainform.querySelectorAll('c-in2')
		const values:Record<string, string> = {}

		for (const input of inputs) {
			const name = input.getAttribute('name')
			const val = input.getAttribute('val')
			if (name && val !== null) values[name] = val
		}

		const amount   = parseFloat(values['amount']) || null
		const notes    = values['notes'] || ""
		const cat      = values['cat'] ? { __path: ['cats',values['cat']] } : null
		const merchant = values['merchant'] || ""
		let   date     = values['date'] || '' as number | string
		const dateObj  = new Date(date);
		dateObj.setUTCHours(12, 0, 0, 0);
		date           = Math.floor(dateObj.getTime() / 1000); 

		const promises:any[] = []

		const updateobj = {amount, notes, cat, merchant, date}

		promises.push($N.DataHodl.PatchLocalDB("transactions/"+this.m.transaction!.id, updateobj));

		const r = await Promise.all(promises)

		if (r[1] && !r[1].ok) {   $N.ToastShow("Error: " + r[1].statusText, 'error'); return;   }

		$N.ToastShow("Saved", 'saved');



		// else if (e.detail.name === "merchant") {
		// 	const r = await $N.FetchLassie("/api/xen/finance/update_merchant_name_in_all_transactions", { method: "POST", body: JSON.stringify({ newname: e.detail.newval, oldname: e.detail.oldval }) })
		// 	if (!r.ok) {   alert ("Error: " + r.statusText); return;   }
		// }
	}



	actiontermclicked () {
		this.props_updated()
	}



	render(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 

}


customElements.define('vp-financeedittransaction', VPFinanceEditTransaction);



