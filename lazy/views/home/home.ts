

type str = string;   //type int = number;   //type bool = boolean;

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var FetchLassie: any;
declare var DataSync: any;


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




	async DataSync_Updated() {

		const x = await (window as any).IndexedDB.GetAll(["transactions"])

		const el = this.shadow.querySelector("#hldr")
		el!.innerHTML = x.get("transactions").find((t:any) => t.id === "01zJLy97OeJTzO5XA9SV").amount

		this.sc()
		//setTimeout(()=> {   this.dispatchEvent(new Event('hydrated'))   }, 100)
	}



	ya1() {
		DataSync.Subscribe(["transactions"], this)

		setTimeout(()=> {   

			const el = this.shadow.querySelector("ct-temp");

			(el as any).DataSync_Updated = async () => { 

				const y = await (window as any).IndexedDB.GetAll(["transactions","cats"])
				const n = y.get("cats").find((c:any) => c.id === "013fe784-a92b-4333-bfeb-260afd3b8235")

				const ell = this.shadow.querySelector("ct-temp");
				ell!.innerHTML = n.name
			}

			DataSync.Subscribe(["transactions","cats"], el)   

		}, 100)
	}

	ya2() {
		DataSync.Subscribe(["transactions","cats"], this)
	}

	ya3() {
		DataSync.Subscribe(["transactions","cats", "areas"], this)
	}



	sc() {
		Lit_Render(this.template(this.s), this.shadow);
	}




	async adminetc(api:str, method: "POST" | "GET" = "GET") {

		if (confirm("Are you sure you want to run admin: " + api)) {

			const returndata = await FetchLassie("/api/xen/admin/" + api, { method })
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


