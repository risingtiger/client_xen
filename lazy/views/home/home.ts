

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



linkplaid = async () => {
    try {
        // 1. Fetch Link Token
        const tokenResponse = await $N.FetchLassie("/api/xen/finance/plaid/create_link_token") as { link_token?: string, error?: string };
        if (!tokenResponse || !tokenResponse.link_token) {
            alert("Error creating link token: " + (tokenResponse?.error || "Unknown error"));
            console.error("Error fetching link token:", tokenResponse);
            return;
        }
        const linkToken = tokenResponse.link_token;

        // 2. Load Plaid Link Script (if not already loaded)
        // Use official Plaid CDN link
        const plaidScriptUrl = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
        if (!(window as any).Plaid) {
            const plaidScript = document.createElement('script');
            plaidScript.src = plaidScriptUrl;

            const scriptLoaded = await new Promise((resolve) => {
                plaidScript.onload = () => resolve(true);
                plaidScript.onerror = (err) => {
                    console.error('Failed to load Plaid Link script:', err);
                    resolve(false);
                };
                document.head.appendChild(plaidScript);
            });

            if (!scriptLoaded) {
                alert("Failed to load Plaid Link library.");
                return;
            }
        }

        // 3. Initialize and Open Plaid Link
        const linkHandler = (window as any).Plaid.create({
            token: linkToken,
            onSuccess: async (public_token: string, metadata: any) => {
                console.log('Plaid Link success:', public_token, metadata);
                // 4. Send public_token and metadata to backend
                try {
                    const exchangeResponse = await $N.FetchLassie("/api/xen/finance/plaid/exchange_public_token", {
                        method: "POST",
                        body: JSON.stringify({
                            public_token: public_token,
                            institution_id: metadata.institution?.institution_id,
                            institution_name: metadata.institution?.name,
                            accounts: metadata.accounts // Send account metadata if needed by backend
                        })
                    }) as any; // Adjust type based on expected response

                    // Check if the exchange was successful based on your API's response structure
                    if (exchangeResponse && (exchangeResponse.ok || exchangeResponse.success)) { // Example success check
                        alert("Plaid account linked successfully!");
                    } else {
                        alert("Failed to exchange public token with backend. Please try again.");
                        console.error("Exchange public token error response:", exchangeResponse);
                    }
                } catch (error) {
                    alert("An error occurred while sending Plaid data to the server.");
                    console.error("Error exchanging public token:", error);
                }
            },
            onLoad: () => {
                console.log('Plaid Link loaded');
                // Optional: Handler may be called multiple times.
            },
            onExit: (err: any, metadata: any) => {
                console.log('Plaid Link exited. Error:', err, 'Metadata:', metadata);
                if (err != null) {
                    // Log and display Plaid API errors or internal errors
                    const displayMessage = err.display_message || err.error_message || `Error code: ${err.error_code}`;
                    alert(`Plaid Link exited with error: ${displayMessage}`);
                    console.error('Plaid Link exit error details:', err);
                } else {
                    // User closed the modal without error
                    console.log('User exited Plaid Link.');
                    // Optionally provide feedback to the user that the process was cancelled.
                    // alert("Plaid linking cancelled.");
                }
            },
            onEvent: (eventName: string, metadata: any) => {
                // Log events or handle specific transitions
                console.log('Plaid Link event:', eventName, metadata);
                // Example: if (eventName === 'HANDOFF') { // User is navigating to institution }
            }
        });

        // Open the Plaid Link modal
        linkHandler.open();

    } catch (error) {
        console.error("Error during Plaid Link initialization:", error);
        alert("An unexpected error occurred setting up Plaid Link.");
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


