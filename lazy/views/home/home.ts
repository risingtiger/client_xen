

import { SSETriggersE } from "../../../defs_server_symlink.js";
import { $NT } from "../../../defs_client_symlink.js";
import { AreaT, CatT, TransactionT, SourceT } from "../../../defs.js";


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

	shadow:ShadowRoot


	static get observedAttributes() { return Object.keys(ATTRIBUTES); }


	constructor() {   
		super(); 
		this.shadow = this.attachShadow( { mode: 'open' } );
	}




	async connectedCallback() {
		await $N.CMech.ViewConnectedCallback(this)
		this.dispatchEvent(new Event('hydrated'));
	}




	async attributeChangedCallback(name:str, oldval:str|boolean|number, newval:str|boolean|number) {
		$N.CMech.AttributeChangedCallback(this,name,oldval,newval);
	}




	disconnectedCallback() {   $N.CMech.ViewDisconnectedCallback(this);   }




	kd = () =>  {
	}




	sc() {
		render(this.template(this.s), this.shadow);
	}




	async adminetc(api:str, method: "POST" | "GET" = "GET") {

		if (confirm("Are you sure you want to run admin: " + api)) {

			const returndata = await $N.FetchLassie("/api/xen/admin/" + api, { method } ) as any
			if (returndata.return_str) {
				this.s.admin_return_str = returndata.return_str.includes("--") ? returndata.return_str.split("--") : returndata.return_str
			}

			this.sc()
		}
	}




	async plaidetc(api:str, method: "POST" | "GET" = "GET") {

		if (confirm("Are you sure you want to plaid: " + api)) {

			const returndata = await $N.FetchLassie("/api/xen/finance/plaid/" + api, { method } ) as any

			if (api === "create_link_token") {
				localStorage.setItem("plaid_link_token", returndata.link_token)
				alert ("Link token created: " + returndata.link_token)
			}

			this.sc()
		}
	}




	reset_all() {

		localStorage.clear()

		this.reset_remove_database()
			.then(() => window.location.href = "/")
			.catch(() => alert("Error resetting database"))
	}




	reset_datasync() {

		localStorage.removeItem("datasync_store_metas")
		localStorage.removeItem("indexeddb_stores")

		this.reset_remove_database()
			.then(() => window.location.href = "/")
			.catch(() => alert("Error resetting database"))
	}




	save_logs() {
		$N.Logger.Save()
	}




	get_logs() {
		$N.Logger.Get()
	}



	reset_remove_database = () => new Promise((resolve, reject) => {

		var req = indexedDB.deleteDatabase("xenition");
		req.onsuccess = function () {
			console.log("Deleted database successfully");
			resolve(1)
		};
		req.onerror = function () {
			console.log("Couldn't delete database");
			reject()
		};
		req.onblocked = function () {
			console.log("Couldn't delete database due to the operation being blocked");
			reject()
		};
	})




	template = (_s:any) => { return html`{--css--}{--html--}`; };
}




customElements.define('v-home', VHome);


export {  }


