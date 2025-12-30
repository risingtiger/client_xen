

import { $NT, CMechLoadedDataT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { SourceT, AreaT } from '../../../../../defs_instance_server_symlink.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;


type AttributesT = {
	area_id: string,
	mode: 'view'|'edit',
	editing_source_id: string
}

type ModelT = {
		sources: SourceT[],
		areas: AreaT[],
		areas_options_str: string,
	}


type StateT = {
		editing_source: SourceT | null,
		mode: 'view' | 'edit',
}



const ATTRIBUTES:AttributesT = { area_id:"", mode: "view", editing_source_id: "" }


class VPFinanceSources extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES };
    s:StateT = {
		editing_source: null,
		mode: 'view',
	}
    m:ModelT = {
		sources: [],
		areas: [],
		areas_options_str: "",
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
		this.m.areas             = (loadeddata.get('areas')   || []) as AreaT[]
		this.m.sources           = loadeddata.get("sources") as SourceT[]
		this.m.areas_options_str = this.m.areas.map(a => `${a.name}:${a.id}`).join(',')

		this.m.sources.sort((a,b) => a.name.localeCompare(b.name))
	}




	hydrated () {
		if (this.a.mode === 'edit' && this.a.editing_source_id) {
			this.editSource(this.a.editing_source_id)
		}
	}


	editSource(sourceid: string) {
		let source = this.m.sources.find(s => s.id === sourceid)
		this.s.editing_source = source || null;
		this.s.mode = this.s.editing_source ? 'edit' : 'view';
		this.render()
	}

	doneEdit() {
		this.s.editing_source = null;
		this.s.mode = 'view';
		this.render();
	}


	async prop_updated(e:any) {
		let changed:any = {}
		if (!this.s.editing_source) return;

		if (e.detail.name === "name") {
			changed.name = e.detail.newval;
		}
		else if (e.detail.name === "longname") {
			changed.longname = e.detail.newval;
		}
		else if (e.detail.name === "description") {
			changed.description = e.detail.newval;
		}
		else if (e.detail.name === "balance") {
			changed.balance = parseFloat(e.detail.newval);
		}
		else if (e.detail.name === "type") {
			changed.type = e.detail.newval;
		}
		else if (e.detail.name === "area") {
			const new_area = this.m.areas.find(a => a.id === e.detail.newval);
			if (new_area) changed.area = { __path:['areas', new_area.id] };
		}

		if (Object.keys(changed).length) {
			try   { await $N.DataHodl.PatchLocalDB("sources/"+this.s.editing_source!.id, changed); }
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


customElements.define('vp-financesources', VPFinanceSources);



