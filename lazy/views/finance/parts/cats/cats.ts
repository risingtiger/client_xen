

import { $NT, CMechLoadedDataT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { AreaT, CatT, FilterT } from '../../../../../defs.js'
import { knit_cats  } from '../../../../libs/financefuncs_knit.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;



type AttributesT = {
	area_id: string
}

type ModelT = {
	areas: AreaT[],
	cats: CatT[],
	all_parent_cats_options_str: string,
}

type StateT = {
    filter: FilterT,
	editing_cat: CatT | null,
	mode: 'view' | 'edit',
}


const ATTRIBUTES:AttributesT = { area_id:"" }


class VPCats extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES };
    s:StateT = {
		filter: { arearef: null, parentcatref: null, catref: null, sourceref: null, tagsref: null, daterange: null, merchant: null, note: null, amountrange: null, cattags: [] },
		editing_cat: null,
		mode: 'view',
	}
    m:ModelT = {
		areas: [],
		cats: [],
		all_parent_cats_options_str: "",
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




	kd = (loadeddata: CMechLoadedDataT, loadstate:string) => {

		if (loadstate === 'initial' || loadstate === 'datachanged') {
			this.m.areas          = loadeddata.get("1:areas")! as AreaT[]
			this.m.cats           = knit_cats(this.m.areas, loadeddata.get('1:cats')!) as CatT[]

			this.s.filter.arearef = this.m.areas.find((a:AreaT) => a.id === this.a.area_id)!
			
			// Build parent cats options string for the current area
			const parent_cats_in_area = this.m.cats.filter(c => c.arearef === this.s.filter.arearef);
			this.m.all_parent_cats_options_str = parent_cats_in_area.map(cat => `${cat.name}:${cat.id}`).join(',');
		}
	}




	editCategory(subcatid: string) {
		let found_subcat: CatT | null = null;
		
		for (const parent_cat of this.m.cats) {
			if (parent_cat.subsref) {
				const subcat = parent_cat.subsref.find(sub => sub.id === subcatid);
				if (subcat) {
					found_subcat = subcat;
					break;
				}
			}
		}
		
		if (found_subcat) {
			this.s.editing_cat = found_subcat;
			this.s.mode = 'edit';
			this.sc();
		}
		else {
			alert (`Category with ID ${subcatid} not found.`);
		}
	}

	cancelEdit() {
		this.s.editing_cat = null;
		this.s.mode = 'view';
		this.sc();
	}

	async prop_updated(e:any) {

		let changed:any = {}
		
		if (!this.s.editing_cat) return;

		if (e.detail.name === "name") {
			changed.name = e.detail.newval;
		}

		else if (e.detail.name === "budget") {
			changed.budget = parseFloat(e.detail.newval);
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
			if (new_parent_cat) {
				changed.parentref = new_parent_cat;
			}
		}

		if (Object.keys(changed).length) {
			try   { await $N.LocalDBSync.Patch("cats/"+this.s.editing_cat!.id, changed); }
			catch {}
		}

		e.detail.done()
	}



	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 

}


customElements.define('vp-cats', VPCats);



