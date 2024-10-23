

import { $NT } from "../../../../defs_client.js";


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
		this.sc()
		setTimeout(()=> {   this.dispatchEvent(new Event('hydrated'))   }, 100)
	}



	sc() {
		Lit_Render(this.template(this.s), this.shadow);
	}




	async adminetc(api:str, method: "POST" | "GET" = "GET") {

		if (confirm("Are you sure you want to run admin: " + api)) {

			const returndata = await $N.FetchLassie("/api/xen/admin/" + api, { method })
			if (returndata.return_str) {
				this.s.admin_return_str = returndata.return_str.includes("--") ? returndata.return_str.split("--") : returndata.return_str
			}

			this.sc()
		}
	}




	template = (_s:any) => { return Lit_Html`{--css--}{--html--}`; };

}




customElements.define('v-home', VHome);




export {  }


