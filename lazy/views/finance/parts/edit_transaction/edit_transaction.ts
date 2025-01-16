

import { $NT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { TransactionT, AreaT, CatT, TagT } from '../../../../../defs.js'
import { knit_cats, knit_tags  } from '../../../../libs/financefuncs_knit.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;




type Model = {
	prop: str,
	cats: CatT[],
	tags: TagT[],
	transaction:TransactionT|null,
	transaction_tag_id:string
}

type State = {
	prop: str,
	cat_options: str
	tag_options: str
}




class VPFinanceEditTransaction extends HTMLElement {

    s:State
    m:Model
    shadow:ShadowRoot




	constructor() {   

		super(); 


		this.m = {
			prop: "",
			transaction: null,
			cats: [],
			tags: [],
			transaction_tag_id: ""
		}

		this.s = {
			prop: "",
			cat_options: "",
			tag_options: ""
		} 

		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {   

		const get_cat_options = () => {
			let s = ""

			for (let cparent of this.m.cats) {
				for (let sub of cparent.subs!) {
					s += `${sub.name}:${sub.id},`
				}
			}

			return s.slice(0, -1)
		} 

		const get_tag_options = () => {
			let s = ""
			for (let tag of this.m.tags) {
				s += `${tag.name}:${tag.id},`
			}
			return s.slice(0, -1)
		} 

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
	}




	async prop_changed(e:any) {

		let changed:any = {}
		let changed_merchant_name = ""

		if (e.detail.name === "amount") {
			changed.amount = parseFloat(e.detail.newval)
		}

		else if (e.detail.name === "notes") {
			changed.notes = e.detail.newval
		}

		else if (e.detail.name === "cat") {
			changed.cat_id = e.detail.newval
		}

		else if (e.detail.name === "tag") {
			changed.tag_id = e.detail.newval
		}

		if (e.detail.name === "epoch_date") {
			changed.date = e.detail.newval
		}

		if (e.detail.name === "merchant") {
			changed_merchant_name = e.detail.newval
		}


		let r:any = null

		if (changed_merchant_name) {
			r = await $N.FetchLassie("/api/xen/finance/update_merchant_name", { method: "POST", body: JSON.stringify({ newname: changed_merchant_name, oldname: e.detail.oldval }) })

		} else {
			r = await $N.FetchLassie("/api/xen/finance/patch_transaction", { method: "PATCH", body: JSON.stringify({ id: this.m.transaction!.id, changed }) })
		}

		if (r.err) {
			e.detail.set_save_fail(r.err)
		} else {
			e.detail.set_save_success(e.detail.newval)
		}
	}



	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:State, _m:Model) => { return html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-edittransaction', VPFinanceEditTransaction);



