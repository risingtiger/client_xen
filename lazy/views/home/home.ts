

import { $NT, LoggerTypeE } from "../../../defs_client.js";


type str = string;   //type int = number;   //type bool = boolean;

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var $N: $NT;


type State = {
    admin_return_str:str
}




class VHome extends HTMLElement {

	$:any
	s:State
	shadow:ShadowRoot



	constructor() {   

		super(); 

		this.$ = this.querySelector

		this.s = {
			admin_return_str: "",
		}

		this.shadow = this.attachShadow( { mode: 'open' } );
	}




	connectedCallback() {
		const x:LoggerTypeE = LoggerTypeE.debug

		console.log(x)

		this.sc()
		setTimeout(()=> {   this.dispatchEvent(new Event('hydrated'))   }, 100)

		$N.DataSync.Subscribe(["transactions"], this)
	}




	async DataSync_Updated() {
		console.log("DataSync_Updated")
	}




	sc() {
		Lit_Render(this.template(this.s), this.shadow);
	}




	async adminetc(api:str, method: "POST" | "GET" = "GET") {

		if (confirm("Are you sure you want to run admin: " + api)) {

			const returndata = await $N.FetchLassie("/api/xen/admin/" + api, { method } )
			if (returndata.return_str) {
				this.s.admin_return_str = returndata.return_str.includes("--") ? returndata.return_str.split("--") : returndata.return_str
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




	async trigger_firestore_sse() {

		const randomFloat = Number((Math.random() * 9 + 1).toFixed(2));

		const saveobj = { amount: randomFloat }

		const r = await $N.Firestore.Patch(`transactions/2JU8wDmssP2Jfg19J9bO`, saveobj);

		if (r.err) {
			console.log("Trigger Firestore SSE Error saving")
		} else {
			console.log("Trigger Firestore SSE Saved")
		}
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




	template = (_s:any) => { return Lit_Html`{--css--}{--html--}`; };
}




customElements.define('v-home', VHome);




export {  }


