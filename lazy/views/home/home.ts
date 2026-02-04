


import { $NT, GenericRowT, LazyLoadFuncReturnT, ViewHeaderT } from "../../../defs_client_symlink.js";
import { AreaT, CatT, TransactionT, SourceT } from "../../../defs_instance_server_symlink.js";



type str = string;   //type int = number;   //type bool = boolean;

declare var render: any;
declare var html: any;
declare var $N: $NT;


type AttributesT = {
    propa: string,
}

type ModelT = {
	raw_sources:SourceT[],
	raw_transactions:TransactionT[],
    raw_areas:AreaT[],
	raw_cats:CatT[],
}

type StateT = {
    admin_return_str:str
}


const ATTRIBUTES:AttributesT = { propa:"" }



class VHome extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES }
	m:ModelT =      { raw_areas:[], raw_cats:[], raw_sources:[], raw_transactions:[] }
	s:StateT = {
		admin_return_str: "",
	}
	header:ViewHeaderT = { title: '', disable: true }

	shadow:ShadowRoot


	static get observedAttributes() { return Object.keys(ATTRIBUTES); }




	constructor() {   
		super(); 
		this.shadow = this.attachShadow( { mode: 'open' } );
	}




    async connectedCallback() {$N.CMech.RegisterView(this);}




	async attributeChangedCallback(name:str, oldval:str|boolean|number, newval:str|boolean|number) {
		$N.CMech.AttributeChangedCallback(this,name,oldval,newval);
	}




	disconnectedCallback() {   $N.CMech.ViewDisconnectedCallback(this);   }




	static load = (_pathparams:GenericRowT, _searchparams:GenericRowT) => new Promise<LazyLoadFuncReturnT>(async (res, _rej) => {
		const d = new Map<str,GenericRowT[]>()
		res({ d, refreshon:[]})	
	})




	ingest = () =>  {
	}




	render() {
		render(this.template(this.s), this.shadow);
	}




	async adminetc(api:str, method: "POST" | "GET" = "GET") {

		if (confirm("Are you sure you want to run admin: " + api)) {

			const returndata = await $N.FetchLassie("/api/xen/admin/" + api, { method } )
			if (!returndata.ok) {   alert ("Error: " + returndata.status + " " + returndata.statusText);   return;   }

			if ((returndata.data as any).return_str) {
				this.s.admin_return_str = (returndata.data as any).return_str.includes("--") ? (returndata.data as any).return_str.split("--") : (returndata.data as any).return_str
			}

			this.render()
		}
	}




	async plaidetc(api:str, method: "POST" | "GET" = "GET") {

		if (confirm("Are you sure you want to plaid: " + api)) {

			const returndata = await $N.FetchLassie("/api/xen/finance/plaid/" + api, { method } )
			if (!returndata.ok) {   alert ("Error: " + returndata.status + " " + returndata.statusText);   return;   }

			if (api === "create_link_token") {
				localStorage.setItem("plaid_link_token", (returndata.data as any).link_token)
				alert ("Link token created: " + (returndata.data as any).link_token)
			}

			this.render()
		}
	}




	reset_all() {

		localStorage.clear()

		this.reset_remove_database()
			.then(() => { alert ("Database deleted successfully"); window.location.href = "/"; })
			.catch(() => console.log("Error resetting database"))
	}




	reset_datasync() {

		localStorage.removeItem("localdbsync_collections_ts")

		this.reset_remove_database()
			.then(() => { alert ("Database deleted successfully"); window.location.href = "/"; })
			.catch(() => console.log("Error resetting database"))
	}



	reset_remove_database = () => new Promise((resolve, reject) => {

		try   {	$N.IDB.DeleteDatabase();	} 
		catch { reject(); return;	}

		resolve(1);
	})




	template = (_s:any) => { return html`{--css--}{--html--}`; };
}




customElements.define('v-home', VHome);


export {  }


