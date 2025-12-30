

import { $NT, CMechLoadedDataT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { AreaT, CatT, FilterT } from '../../../../../defs_instance_server_symlink.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;



type AttributesT = {
	area_id: string,
	mode: 'view'|'edit',
	editing_cat_id: string
}

type ModelT = {
		areas: AreaT[],
		cats: CatT[],
		all_parent_cats_options_str: string,
		subcategories_options_str: string,
	}


type StateT = {
    filter: FilterT,
		editing_cat: CatT | null,
		mode: 'view' | 'edit',
		move_transactions_to_cat_id: string | null,
}



const ATTRIBUTES:AttributesT = { area_id:"", mode: "view", editing_cat_id: "" }


class VPFinanceCats extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES };
    s:StateT = {
		filter: { arearef: null, parentcatref: null, catref: null, sourceref: null, tagsref: null, daterange: null, merchant: null, note: null, amountrange: null, cattags: [] },
		editing_cat: null,
		mode: 'view',
		move_transactions_to_cat_id: null,
	}
    m:ModelT = {
		areas: [],
		cats: [],
		all_parent_cats_options_str: "",
		subcategories_options_str: "",
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

		this.m.areas                       = loadeddata.get("areas")! as AreaT[]
		this.m.cats                        = loadeddata.get("cats")! as CatT[]
		this.s.filter.arearef              = this.m.areas.find((a:AreaT)        => a.id        === this.a.area_id)!
		this.m.all_parent_cats_options_str = this.m.cats.map(cat                => `${cat.name}:${cat.id}`).join(',');
		this.m.subcategories_options_str   = this.m.cats.flatMap(c=>c.subsref).map(sc => `${sc!.name}:${sc!.id}`).join(',')
	}




	hydrated() {
		if (this.a.mode === 'edit' && this.a.editing_cat_id) {
			this.editCategory(this.a.editing_cat_id)
		}
	}




	editCategory(subcatid: string) {

		let subcat         = this.m.cats.flatMap(c => c.subsref).find(sub => sub!.id === subcatid)
		this.s.editing_cat = subcat!;
		this.s.mode        = 'edit';
		this.render()
	}

	doneEdit() {
		this.s.editing_cat = null;
		this.s.mode = 'view';
		this.s.move_transactions_to_cat_id = null;
		this.render();
	}




	async prop_updated(e:any) {

		let changed:any = {}
		
		if (!this.s.editing_cat) return;

		if (e.detail.name === "name") {
			changed.name = e.detail.newval;
		}

		else if (e.detail.name === "costs") {
			changed.costs = parseFloat(e.detail.newval);
		}

		else if (e.detail.name === "goal") {
			changed.goal = parseFloat(e.detail.newval);
		}

		else if (e.detail.name === "quadrant") {
			changed.tags = JSON.parse(JSON.stringify(this.s.editing_cat!.tags));

			changed.tags[0] = parseInt(e.detail.newval);
			/*
			const r = await $N.FetchLassie("/api/xen/finance/cats/"+this.s.editing_cat.id+"/update_quadrant", { method: "POST", body: JSON.stringify({ quadrant: e.detail.newval }) })
			if (!r.ok) {   alert ("Error: " + r.statusText); return;   }
			*/
		}

		else if (e.detail.name === "parent_category") {
			const new_parent_cat = this.m.cats.find(cat => cat.id === e.detail.newval);
			changed.parent = { __path:['cats',new_parent_cat!.id]  };
		}

		if (Object.keys(changed).length) {
			try   { await $N.DataHodl.PatchLocalDB("cats/"+this.s.editing_cat!.id, changed); }
			catch {}
		}

		e.detail.done()
	}




	async move_transactions(e:any) {

		if (!this.s.editing_cat || !this.s.move_transactions_to_cat_id)                 { alert('No category or move to in edit.'); return; }

		const from_cat_id = this.s.editing_cat.id;
		const to_cat_id   = this.s.move_transactions_to_cat_id; 

		let r = await $N.FetchLassie('/api/xen/finance/move_transactions', { method: 'POST', body: JSON.stringify({ from_cat_id, to_cat_id }) }); 
		if (!r!.ok) { alert('Error: ' + r!.statusText); return; }

		$N.ToastShow('transactions moved over')

		e.detail.done()
	}



	render(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 

}


customElements.define('vp-financecats', VPFinanceCats);



