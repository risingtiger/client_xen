

import { str } from "../../../defs_server_symlink.js"
import { $NT, CMechLoadedDataT, GenericRowT, LazyLoadFuncReturnT } from "../../../defs_client_symlink.js"
import { SaveNewTransactionServerT, SheetsTransactionT } from "../../../defs_instance_server_symlink.js"
import { AreaT, CatT, SourceT } from '../../../defs_instance_server_symlink.js'
import { NewTransactionT, InputModeE, AttributesT, ModelT, StateT } from "../../libs/addtr_defs.js"
import { HandleInputChange as ItemHandleInputChange, HandleFilteredCatsTagsReset as ItemHandleFilteredCatsTagsReset, Set_Cat_From_Click, Set_Tag_From_Click, HandleUpdateTransactionFromCurrentInputModeInput as ItemHandleUpdateTransactionFromCurrentInputModeInput } from "../../libs/addtr_item.js"
import KnitFuncs from "../../libs/knitfuncs.js"


declare var render: any;
declare var html: any;
declare var $N: $NT;



const ATTRIBUTES:AttributesT = { propa: "" }




class VAddTr extends HTMLElement {
	a:AttributesT = { ...ATTRIBUTES }
	m:ModelT = { areas: [], cats: [], sources: [], tags: [], sheet_transactions:[], newtransactions:[],  }
	s:StateT = {
		index: -1,
		activetransactions: [],
		infocus: {} as NewTransactionT,
		infocusindex: -1,
		inputmode: InputModeE.initial,
		highlightcat: null,
		highlighttag: null,
		filteredcats: [],
		filteredtags: [],
		original_amount: null
	}

	header:ViewHeaderT = { title: '', disable: true }
	keycatcherel:HTMLInputElement

	shadow:ShadowRoot


	static get observedAttributes() { return Object.keys(ATTRIBUTES); }


	constructor() {   
		super(); 
		this.shadow = this.attachShadow({mode: 'open'});
	}




    async connectedCallback() {$N.CMech.RegisterView(this);}




	async attributeChangedCallback(name:string, oldval:string|boolean|number, newval:string|boolean|number) {
		$N.CMech.AttributeChangedCallback(this, name, oldval, newval);
	}




	disconnectedCallback() {   $N.CMech.ViewDisconnectedCallback(this);   }




	static load = (_pathparams:GenericRowT, _searchparams:GenericRowT) => new Promise<LazyLoadFuncReturnT>(async (res, rej) => {

		const d = new Map<str,GenericRowT[]>()
		const promises:Promise<any>[] = []

		const user = localStorage.getItem('user_email')

		const ri:any  = $N.IDB.GetAll(["areas","cats","sources","tags"]);
		const rt:any = $N.FetchLassie('/api/xen/finance/sheets/get_transactions?user='+user, {}) 
		promises.push(ri, rt)
		let r:any = null
		try { 
			r = await Promise.all(promises); 
			if (!r[1].ok) {   throw new Error("Fetch error");   }
		}
		catch {   rej(); return;   }

		const areas   = KnitFuncs.knit_areas(r[0].get('areas'))
		const cats    = KnitFuncs.knit_cats(r[0].get('cats'), areas, [])
		const sources = KnitFuncs.knit_sources(r[0].get('sources'), areas)
		const tags    = KnitFuncs.knit_tags(r[0].get('tags'), areas)

		d.set( "areas", areas)
		d.set( "cats", cats)
		d.set( "sources", sources)
		d.set( "tags", tags)
		d.set( "sheet_transactions", r[1].data)

		res({ d, refreshon:[  ]})
	})




	ingest = (loadeddata: CMechLoadedDataT) => {

		this.m.areas   = loadeddata.get("areas") as AreaT[]
		this.m.cats    = loadeddata.get("cats") as CatT[]
		this.m.sources = loadeddata.get("sources") as SourceT[]
		this.m.tags    = loadeddata.get("tags") as any[]

		this.m.sheet_transactions = loadeddata.get("sheet_transactions") as SheetsTransactionT[]
		this.m.tags = this.m.tags.sort((a, b) => b.ts - a.ts)

		const x = this.m.sheet_transactions.filter(tr=>tr.notes)

		const all_new_transactions = this.m.sheet_transactions.map((tr) => {
			return {
				sheets_id: tr.id,
				catref: null,
				notes: tr.notes || "",
				amount: tr.amount,
				merchant: tr.merchant,
				merchant_long: tr.merchant_long,
				tags: [],
				source: this.m.sources.find(s => s.id === tr.source_id) as SourceT,
				date: tr.date,
			}
		}).sort((a, b) => a.date - b.date)


		/* ********* FILTER BASED ON USER EMAIL ********* */
		const source = this.m.sources.find(s=>s.name === "visafam")

		const user_email = localStorage.getItem("user_email") || "";

		if (user_email === "rfs@risingtiger.com") {
			this.m.newtransactions = all_new_transactions
		} else {
			this.m.newtransactions = all_new_transactions.filter(tr => tr.source === source);
		}


		if (localStorage.getItem("user_email") !== "rfs@risingtiger.com") {

			const filteredcats_being_areafam:CatT[] = []
			const areafam   = this.m.areas.find(a=>a.name === "fam")

			for (const cat of this.m.cats) {
				if (cat.arearef !== areafam) continue;
				filteredcats_being_areafam.push(cat);
			}
			this.m.cats = filteredcats_being_areafam;
			this.m.newtransactions.forEach(tr => tr.notes = '')
		}
		/* ********* ************************** ********* */


		return
	}




	async hydrated() {

		if (this.m.newtransactions.length === 0) {   alert("no new transactions"); return;   }

		( this.shadow.querySelector("#input-cat") as HTMLInputElement ).focus()

		await this.set_next_focus('standard')

		this.s.inputmode = InputModeE.cat;

		ItemHandleFilteredCatsTagsReset(this.m, this.s)

		this.render(true);

		this.dispatchEvent(new Event('hydrated'));


		/*
		let   linked_cat:CatT|null = null
		const misc_home_cat_id = "d779f0d7-3634-4210-a52a-9b93d9349f4e"
		for(const c of this.m.cats) {
			for(const cc of c.subsref!) {
				if (cc.id === misc_home_cat_id) {
					linked_cat = c
					break;
				}
			}
		}

		for(const tr of this.m.newtransactions) {
			tr.catref = linked_cat
			tr.merchant = simplify_merchant_name(tr.merchant)
			tr.notes = ""

			this.s.activetransactions = [this.copynewtr(tr)]

			await this.save_activetransactions()
		}
		*/
	}



	render(update_all_inputs:boolean = false) {

		render(this.template(this.a, this.s, this.m), this.shadow);

		if (update_all_inputs) {
			const catel = this.shadow.querySelector("#input-cat") as HTMLInputElement
			const notesel = this.shadow.querySelector("#input-note") as HTMLInputElement
			const tagel = this.shadow.querySelector("#input-tag") as HTMLInputElement
			const amountel = this.shadow.querySelector("#input-amount") as HTMLInputElement
			const merchantel = this.shadow.querySelector("#input-merchant") as HTMLInputElement
			const dateel = this.shadow.querySelector("#input-date") as HTMLInputElement

			catel.value = this.s.infocus.catref?.name ?? ""
			notesel.value = this.s.infocus.notes
			tagel.value = this.s.infocus.tags && this.s.infocus.tags.length ? this.s.infocus.tags[0].name : "" 
			amountel.value = this.s.infocus.amount.toString()
			merchantel.value = this.s.infocus.merchant

			const date = new Date(this.s.infocus.date * 1000)
			const datestring = date.getFullYear() + '-' + 
				String(date.getMonth() + 1).padStart(2, '0') + '-' + 
				String(date.getDate()).padStart(2, '0')
			dateel.value = datestring
		}
	}





	handle_focus = (e: FocusEvent) => {

		// we focus on cat on page load. We don't want to trigger anything at that point
		if (this.s.inputmode === InputModeE.initial) {
			this.s.inputmode = InputModeE.cat;
			return;
		}

		const target_id = (e.target as HTMLElement).id;
		const mode = target_id.split('-')[1] as InputModeE;
		this.s.inputmode = mode;

		if (this.s.inputmode === InputModeE.cat || this.s.inputmode === InputModeE.tag) {
			ItemHandleInputChange(this.m, this.s, ( e.target as HTMLInputElement ).value)
		}
		this.render(true);
	}




	handle_blur = (_e: FocusEvent) => {
		ItemHandleUpdateTransactionFromCurrentInputModeInput(
			this.s.inputmode, this.shadow, this.s.infocus, this.s.highlightcat, this.s.highlighttag
		)
	}




	handle_input_keyup = async (e: KeyboardEvent) => {

		if (this.s.inputmode === InputModeE.saving) return;

		if (e.key === "Enter") {
			this.save_infocus_transaction()
		}
		else if (e.ctrlKey && e.key === 's') {
			this.addsplit()
			e.preventDefault();
		}
		else if (e.ctrlKey && e.key === 'd') {
			this.delete(e)
			e.preventDefault();
		}
		else if (e.ctrlKey && e.key === 'l') {
			this.skip(e)
			e.preventDefault();
		}
	}




	save_infocus_transaction = async (e?:any) => {

		ItemHandleUpdateTransactionFromCurrentInputModeInput(
			this.s.inputmode, this.shadow, this.s.infocus, this.s.highlightcat, this.s.highlighttag
		)
		this.s.inputmode = InputModeE.saving
		if (!this.s.infocus.catref) { 
			alert("missing category"); 
			( this.shadow.querySelector("#input-cat") as HTMLInputElement ).focus()
			return; 
		}

		const cat = this.shadow.querySelector("#input-cat") as HTMLInputElement
		try { cat.focus({ preventScroll: true } as any); } catch { cat.focus(); }

		await this.set_next_focus('standard')

		this.render(true);
		if (e?.detail) e.detail.done()
	}




	 handleSaveDown = (e:Event) => {
		console.log("savedown")
		// Needed because iPhone dismisses the keyboard on hitting Save button. This keeps it active
		try { e.preventDefault(); } catch {}
		const cat = this.shadow.querySelector('#input-cat') as HTMLInputElement | null
		if (cat) { try { cat.focus({ preventScroll: true } as any); } catch { cat.focus(); } }
	 }




	handle_input_change = async (e: KeyboardEvent) => {

		const inputel = e.target as HTMLInputElement;
		const newval = inputel.value;

		console.log("input change")
		console.log("inputel: ", inputel)
		console.log("newval: ", newval)

		if (inputel.value.length < 1 && ( this.s.inputmode === InputModeE.cat || this.s.inputmode === InputModeE.tag )) {
			ItemHandleFilteredCatsTagsReset(this.m, this.s);

		} else {
			ItemHandleInputChange(this.m, this.s, newval)
		}
		this.render(false);
	}




	set_next_focus = (mode:'standard'|'skip'|'delete') => new Promise<void>(async res => {

		// infocusindex is -1 initially.
		// matches if either no split or at last split (and not -1 which is the first init)

		if (mode === 'standard' && this.s.infocusindex == -1) {  
			next_of_newtransactions.call(this, this.s, this.m)

		} else if (mode === 'standard' && this.s.infocusindex == this.s.activetransactions.length-1) {  
			await this.save_activetransactions() 
			next_of_newtransactions.call(this, this.s, this.m)
		} 
		else if (mode === 'standard') { // there is a split and not at last split
			this.s.infocusindex++
			ItemHandleFilteredCatsTagsReset(this.m, this.s);
			this.s.inputmode = InputModeE.cat
			this.s.infocus = this.s.activetransactions[this.s.infocusindex]
			this.s.infocus.merchant = simplify_merchant_name(this.s.infocus.merchant)
		} 
		else if (mode === 'skip' || mode === 'delete') {
			next_of_newtransactions.call(this, this.s, this.m)
		}

		res()


		function next_of_newtransactions(s:StateT, m:ModelT) {

			s.original_amount = 0

			if (s.index === m.newtransactions.length-1) { 
				alert ("all done")
				return
			}
			else {
				s.index++
				ItemHandleFilteredCatsTagsReset(this.m, this.s);
				this.s.inputmode = InputModeE.cat
				s.activetransactions = [this.copynewtr(m.newtransactions[s.index])]
				s.infocusindex = 0
				s.infocus = s.activetransactions[0]
				s.infocus.merchant = simplify_merchant_name(s.infocus.merchant)


			}
		}
	})




	save_activetransactions = () => new Promise<null|number>(async (res) => {

		const transactions_to_server:SaveNewTransactionServerT[] = this.s.activetransactions.map((tr) => { return {
			amount: tr.amount,
			cat: tr.catref?.id as str,
			date: tr.date, 
			merchant: tr?.merchant,
			notes: tr?.notes || "",
			source: tr?.source?.id || "",
			tags: tr?.tags.map(tag => tag.id),
			sheets_id: tr?.sheets_id,
		}; })

		const r = await $N.FetchLassie( `/api/xen/finance/save_transactions`, { 
			method:"POST", 
			body:JSON.stringify(transactions_to_server) 
		})
		if (!r.ok) { 
			$N.Unrecoverable("Error", "Unable to save transaction", "Reset", "sw4", "", null);
			return
		}

		res(1)
	})




	skip = (e:any) => new Promise<void>(async (_res) => {
		this.s.inputmode = InputModeE.skipped
		this.render()

		await this.set_next_focus('skip')

		this.render(true);

		( this.shadow.querySelector("#input-cat") as HTMLInputElement ).focus()

		if (e.detail) e.detail.done()
	})




	delete = (e:any) => new Promise<void>(async (_res) => {

		const r = await $N.FetchLassie( `/api/xen/finance/ignore_transaction`, { 
			method:"POST", 
			body:JSON.stringify({ sheets_id: this.s.infocus.sheets_id }) 
		})
		if (!r.ok) {
			$N.Unrecoverable("Error", "Unable to delete transaction", "Reset", "sw4", "", null);
			return; 
		}

		await this.set_next_focus('delete')
		if (e.detail) e.detail.done()
		this.render(true);

		( this.shadow.querySelector("#input-cat") as HTMLInputElement ).focus()
	})




	addnew = (isapple:boolean = false) => {

		const sourceid = isapple ? "7688adbc-13ef-469f-81d7-1e02098d2d06" : "61771fdb-4121-4442-bd4f-057290a64b2e"

		const newtr:NewTransactionT = {
			sheets_id: null,
			catref: null,
			date: Math.floor(Date.now() / 1000),
			notes: "",
			amount: 0,
			merchant: "",
			merchant_long: "",
			tags: [],
			source: this.m.sources.find(s => s.id === sourceid) as SourceT, //apple or cashpers
		}

		this.s.activetransactions = [newtr]

		this.s.infocus = this.s.activetransactions[0]
		this.s.infocus.merchant = simplify_merchant_name(this.s.infocus.merchant)
		this.s.infocusindex = 0
		this.s.index = 0

		this.render(true);

		( this.shadow.querySelector("#input-cat") as HTMLInputElement ).focus()
	}




	addsplit = () => {
		if (this.s.activetransactions.length === 1) {
			this.s.original_amount = this.s.activetransactions[0].amount
			this.s.infocus.amount  = 0
		}

		const nt = this.m.newtransactions[this.s.index]
		nt.amount = 0
		this.s.activetransactions.push(structuredClone(nt));
		this.render(true);

		( this.shadow.querySelector("#input-cat") as HTMLInputElement ).focus()
	}




	copynewtr = (nt:NewTransactionT) : NewTransactionT => {
		return {
			sheets_id: nt.sheets_id,
			catref: nt.catref,
			date: nt.date,
			notes: nt.notes,
			amount: nt.amount,
			merchant: nt.merchant,
			merchant_long: nt.merchant_long,
			tags: nt.tags.map(tag => tag),
			source: nt.source,
		} 
	}




	setcat_from_click = (e:MouseEvent) => { 
		Set_Cat_From_Click(this.m, this.s, e); 
		this.s.infocus!.catref = this.s.highlightcat;
		this.render(true); 
		const inputel = this.shadow.querySelector("#input-note") as HTMLInputElement
		inputel.focus()
	}
	settag_from_click = (e:MouseEvent) => { 
		Set_Tag_From_Click(this.m, this.s, e); 
		this.s.infocus!.tags = [this.s.highlighttag!];
		this.render(true); 
		const inputel = this.shadow.querySelector("#input-amount") as HTMLInputElement
		inputel.focus()
	}




	template = (_a:AttributesT, _s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; };

}




customElements.define('v-addtr', VAddTr);





function simplify_merchant_name(name:string) : string {

	let cname = name
	//name = "Withdrawal Debit Cash App*violet Oakland Ca Date 06/30/25 55 4829 Card 8038"

	if (name.startsWith("Loan Advance Cre")) {
		cname = name.slice(17).trim()
	}
	else if (name.includes("Cash App*")) {
		const cash_app_match = name.match(/Cash App\*([^\s]+)/);
		if (cash_app_match) {
			cname = cash_app_match[1] + " - cashapp";
		}
	}
	else if (name.startsWith("Pending ~ ")) {
		cname = name.slice(10).trim()
	}

	return cname
}



 
 
 
 export {  }


