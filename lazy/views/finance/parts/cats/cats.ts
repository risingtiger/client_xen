

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
			this.m.areas          = loadeddata.get("areas")! as AreaT[]
			this.m.cats           = knit_cats(this.m.areas, loadeddata.get('cats')!) as CatT[]

			this.s.filter.arearef = this.m.areas.find((a:AreaT) => a.id === this.a.area_id)!
		}
	}




	editCategory(subcatid: string) {
		// modity this. subcatid refers to a sub category nested within a parent category (one of this.m.cats). Find the sub categroy AI!
		const cat = this.m.cats.find(c => c.id === catId);
		if (cat) {
			this.s.editing_cat = cat;
			this.s.mode = 'edit';
			this.sc();
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
			this.s.editing_cat.budget = parseFloat(e.detail.newval);
		}

		if (Object.keys(changed).length) {
			try   { await $N.LocalDBSync.Patch("cats/"+this.s.editing_cat!.id, changed); }
			catch {}
		}
	}



	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 

}


customElements.define('vp-cats', VPCats);



