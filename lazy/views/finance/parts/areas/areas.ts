

import { $NT, CMechLoadedDataT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { AreaT } from '../../../../../defs_instance_server_symlink.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;


type AttributesT = {
	area_id: string,
	mode: 'view'|'edit',
	editing_area_id: string
}

type ModelT = {
		areas: AreaT[],
	}


type StateT = {
		editing_area: AreaT | null,
		mode: 'view' | 'edit',
}



const ATTRIBUTES:AttributesT = { area_id:"", mode: "view", editing_area_id: "" }


class VPFinanceAreas extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES };
    s:StateT = {
		editing_area: null,
		mode: 'view',
	}
    m:ModelT = {
		areas: [],
	}
    shadow:ShadowRoot


	static get observedAttributes() { return Object.keys(ATTRIBUTES); }


	constructor() {   
		super(); 
		this.shadow = this.attachShadow({mode: 'open'});
	}


	async connectedCallback() {   
		$N.CMech.RegisterViewPart(this)
	}


	async attributeChangedCallback(name:str, oldval:str|boolean|number, newval:str|boolean|number) {
		$N.CMech.AttributeChangedCallback(this,name,oldval,newval);
	}


	disconnectedCallback() { $N.CMech.ViewPartDisconnectedCallback(this); }


	ingest = (loadeddata: CMechLoadedDataT) => {
		this.m.areas = (loadeddata.get('1:areas') || []) as AreaT[]
	}




	hydrated = () => {
		if (this.a.mode === 'edit' && this.a.editing_area_id) {
			this.editArea(this.a.editing_area_id)
		}
	}


	editArea(areaid: string) {
		let area = this.m.areas.find(a => a.id === areaid)
		this.s.editing_area = area || null;
		this.s.mode = this.s.editing_area ? 'edit' : 'view';
		this.render()
	}

	doneEdit() {
		this.s.editing_area = null;
		this.s.mode = 'view';
		this.render();
	}


	async prop_updated(e:any) {
		let changed:any = {}
		if (!this.s.editing_area) return;

		if (e.detail.name === "name") {
			changed.name = e.detail.newval;
		}
		else if (e.detail.name === "longname") {
			changed.longname = e.detail.newval;
		}
		else if (e.detail.name === "unfixedcosts") {
			const n = parseFloat(e.detail.newval);
			if (!Number.isNaN(n)) changed.unfixedcosts = n;
		}

		if (Object.keys(changed).length) {
			try   { await $N.DataHodl.PatchLocalDB("areas/"+this.s.editing_area!.id, changed); }
			catch {}
		}

		e.detail.done()
	}


	render(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m), this.shadow);   
	}


	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 
}


customElements.define('vp-financeareas', VPFinanceAreas);




