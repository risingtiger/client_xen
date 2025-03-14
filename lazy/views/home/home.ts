

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



	visibled = () => new Promise<void>(async (res) => { 
		const r = await testdb() as any[]
		console.log(r)
		res()
	})




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




const testdb_a = () => new Promise(async (resolve, reject) => {

	const db = await openindexeddb()

	let  transactions: any[]      = [];
	let  cats:any[]               = [];
        
	const transaction             = db.transaction(['transactions', 'cats'], 'readonly');
	const transaction_store       = transaction.objectStore('transactions');
	const cat_store               = transaction.objectStore('cats');

	const t1 = performance.now()

	transaction_store.openCursor().onsuccess = (event) => {
		const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
		
		if (cursor) {
			const transaction = cursor.value;
			transactions.push(transaction);
			cursor.continue();
		} else {
			const t2 = performance.now()
			console.log("cursor " + (t2 - t1));

			resolve({transactions, cats});
		}
	}
})




const testdb_b = () => new Promise(async (resolve, reject) => {

	const db = await openindexeddb()

	let  transactions: any[]      = [];
	let  cats:any[]               = [];
	let  cat_ids:Set<string>      = new Set<string>();
        
	const transaction             = db.transaction(['transactions', 'cats'], 'readonly');
	const transaction_store       = transaction.objectStore('transactions');
	const cat_store               = transaction.objectStore('cats');

	const t1 = performance.now()

	transaction_store.openCursor().onsuccess = (event) => {
		const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
		
		if (cursor) {
			const transaction = cursor.value;
			transactions.push(transaction);
			
			if (cat_ids.has(transaction.cat)) {
				cursor.continue();
				return;
			}
			const cat_request = cat_store.get(transaction.cat);
			
			cat_request.onsuccess = () => {
				cats.push(cat_request.result)	
				cat_ids.add(transaction.cat)
			};

			cursor.continue();
			
			cat_request.onerror = () => {
				console.error('Error retrieving cat:', cat_request.error);
				cursor.continue();
			};
		} else {
			const t2 = performance.now()
			console.log("cursor " + (t2 - t1));

			resolve({transactions, cats});
		}
	}
})




const openindexeddb = () => new Promise<IDBDatabase>(async (res,_rej)=> {

	let dbconnect = indexedDB.open('xenition', 4)

	dbconnect.onerror = (event:any) => { 
		console.log("IndexedDB Error - " + event.target.errorCode)
	}

	dbconnect.onsuccess = async (event: any) => {
		event.target.result.onerror = (event:any) => {
			console.log("IndexedDB Error - " + event.target.errorCode)
		}
		const db = event.target.result
		res(db)
	}
})


export {  }


