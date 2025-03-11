

import { str } from "../../../defs_server_symlink.js"
import { $NT, FetchResultT } from "../../../defs_client_symlink.js"
import { CatT, SourceT } from '../../../defs.js'
import { knit_areas, knit_cats, knit_sources } from '../../libs/financefuncs_knit.js'
import { NewTransactionT, InputModeE, AttributesT, ModelT, StateT, RawNewTransactionT } from "../../libs/addtr_defs.js"
import { HandleKeyup as ItemHandleKeyup, HandleReset as ItemHandleReset, Set_Cat_From_Click, Set_Tag_From_Click } from "../../libs/addtr_item.js"


declare var render: any;
declare var html: any;
declare var $N: $NT;



const ATTRIBUTES:AttributesT = { propa: "" }




class VAddTr extends HTMLElement {
	a:AttributesT
	m:ModelT
	s:StateT
	keycatcherel:HTMLInputElement
	shadow:ShadowRoot

	secondaryload:Promise<FetchResultT>|null = null


	static get observedAttributes() { return Object.keys(ATTRIBUTES); }


	constructor() {   

		super(); 

		this.a = { ...ATTRIBUTES }
		this.m = { raw_areas: [], raw_cats: [], raw_sources: [],  raw_newtransactions: [], areas: [], cats: [], sources: [], quick_notes: [], newtransactions:[], tags: [] }
		this.s = {
			newcount: 0,
			activetransaction: {} as NewTransactionT,
			inputmode: InputModeE.cat,
			highlightcat: null,
			highlighttag: null,
			filteredcats: [],
			filteredtags: []
		}

		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {
		await $N.CMech.ViewConnectedCallback(this)
		this.dispatchEvent(new Event('hydrated'));

		this.secondaryload = $N.FetchLassie('/api/xen/finance/get_ynab_raw_transactions', {})
	}




	async attributeChangedCallback(name:string, oldval:string|boolean|number, newval:string|boolean|number) {
		$N.CMech.AttributeChangedCallback(this, name, oldval, newval);
	}




	disconnectedCallback() {   $N.CMech.ViewDisconnectedCallback(this);   }




	loadother = () => new Promise<number|null>(async (res) => { 
		const r = await $N.FetchLassie('/api/xen/finance/get_ynab_raw_transactions', {}) as any
		const trs:RawNewTransactionT[] = (localStorage.getItem("user_email") === 'accounts@risingtiger.com') ? r.raw_transactions : r.raw_transactions.filter((tr:any) => tr.source === "17c0d30d-4e6f-496e-a8e4-91dae1de8b4a")
		this.m.raw_newtransactions = trs
		res(1)
	})




	visibled = () => new Promise<void>(async (res) => { 
		// Wait for secondaryload to complete if it exists and hasn't resolved yet
		if (this.secondaryload) {
			try {
				await this.secondaryload;
				// After secondaryload completes, process the data
				await this.loadother();
			} catch (error) {
				console.error("Error loading secondary data:", error);
			}
		}
		
		setTimeout(()=> {
			this.s.inputmode = InputModeE.cat
			this.focus_inputmode()
			res()
		},100)
	})



	kd() {

		THERE IS A MAJOR PROBLEM IN CORE NIFTY CLIENT DATASYNC. SOMETING LIKE CATS IS REFERENCING AREA AND THAT OBJECT IS GONNA BE BJORKED OR GONE OR SOMETHING IF IT GETS REPLACED BY A SSE DOC OR COLLECTION UPDATE
		
		MAYBE SET UP A NEW LIB THAT HANDLES ALL THIS STUFF? I NEED RELATIONAL DATA LINKS.

		I THINK WHAT I NEED TO DO IS JUST KEEP ALL THE DATA OF ALL FIRESTORE COLLECTIONS BACK IN FIRESTORE.TS. THOSE DOCS GET UPDATED ON SSE. EVERYTHING CMECH TO INDIVIDUAL COMPONENTS IS JUST DOWNSTREAM REFERENCES

		this.m.areas = knit_areas(this.m.raw_areas)
		this.m.cats = knit_cats(this.m.areas, this.m.raw_cats)
		this.m.sources = knit_sources(this.m.raw_sources)
		this.m.tags.sort((a, b) => b.ts - a.ts)
		this.m.quick_notes = this.m.quick_notes

		this.s.filteredcats = this.m.cats
		this.s.filteredtags = this.m.tags

		if (localStorage.getItem("user_email") !== 'accounts@risingtiger.com') {
			this.m.cats = this.m.cats.filter(cat => cat.area.name === "fam")
		}

		this.m.newtransactions = this.m.raw_newtransactions.map((tr) => {

			const quick_note = this.m.quick_notes.find(qn=> {
				let fourdays = 518400 // 6 days in seconds
				if ((qn.ts > tr.ts - fourdays && qn.ts < tr.ts + fourdays) && (qn.amount === tr.amount)) {
					return true
				}
				return false;
			})

			return {
				ynab_id: tr.ynab_id,
				cat: this.m.cats.find(cat => cat.name === tr.preset_cat_name) || null,
				notes: (tr.notes || quick_note?.note || ""),
				amount: tr.amount,
				merchant: tr.merchant,
				tags: [],
				source: this.m.sources.find(s => s.id === tr.source_id) as SourceT,
				ts: tr.ts
			}
		}).sort((a, b) => a.ts - b.ts)

		this.s.newcount = this.m.newtransactions.length

		this.s.activetransaction = this.m.newtransactions[0]
	}




	async handle_input_keyup(e: KeyboardEvent) {

		if (this.s.inputmode === InputModeE.saving) return;

		const inputel = e.target as HTMLInputElement;
		const newval = inputel.value;

		if (e.key === "Tab") {
			e.preventDefault();
			this.save_step(newval, e.shiftKey ? 'back' : 'forward')
			this.sc();

		} 
		else if (e.key === "Backspace") {
			ItemHandleReset(this.m, this.s);
			this.sc();
		}
		else if (e.key === "Enter") {
			if (inputel.value.length < 2) return;

			this.save_step(newval, 'neutral')
			this.sc()
			await this.save_active_transaction()

			if (!this.set_next_active_transaction()) this.set_to_all_done()

			this.sc();
		}
		else {
			if (inputel.value.length < 2) return;
			ItemHandleKeyup(this.m, this.s, newval)
			this.sc();
		} 
	}




	save_step = (newval:string, direction:'neutral'|'back'|'forward' = 'neutral') => {

		const s = this.s
		
		if (s.inputmode === InputModeE.cat) {
			s.activetransaction.cat = s.highlightcat

			if      (direction === 'forward') s.inputmode = InputModeE.note
		}
		else if (s.inputmode === InputModeE.note) {
			s.activetransaction.notes = newval

			if      (direction === 'forward') s.inputmode = InputModeE.tag
			else if (direction === 'back') s.inputmode    = InputModeE.cat
		}
		else if (s.inputmode === InputModeE.tag) {
			s.activetransaction.tags = [s.highlighttag!]

			if      (direction === 'forward') s.inputmode = InputModeE.amount
			else if (direction === 'back') s.inputmode    = InputModeE.note
		}
		else if (s.inputmode === InputModeE.amount) {
			s.activetransaction.amount = Number(newval)

			if      (direction === 'forward') s.inputmode = InputModeE.merchant
			else if (direction === 'back') s.inputmode    = InputModeE.tag
		}
		else if (s.inputmode === InputModeE.merchant) {
			s.activetransaction.merchant = newval

			if      (direction === 'back') s.inputmode    = InputModeE.amount
		}
	}




	save_active_transaction = () => new Promise<null|number>(async (res) => {

		if (this.s.inputmode === InputModeE.saving) return

		this.s.inputmode = InputModeE.saving

		if (this.s.activetransaction.cat === null) {
			alert("No category selected")
			this.s.inputmode = InputModeE.cat
			res(null)
			return
		}

		const transaction_to_server = {
			amount: this.s.activetransaction.amount,
			cat: this.s.activetransaction.cat.id,
			date: this.s.activetransaction.ts, 
			merchant: this.s.activetransaction.merchant,
			notes: this.s.activetransaction.notes,
			source: this.s.activetransaction.source?.id || "",
			tags: this.s.activetransaction.tags.map(tag => tag.id),
			ynab_id: this.s.activetransaction.ynab_id,
			ts: Math.floor(new Date().getTime() / 1000)
		}

		debugger
		await $N.FetchLassie( `/api/xen/finance/save_transaction`, { 
			method:"POST", 
			body:JSON.stringify(transaction_to_server) 
		})

		this.s.inputmode = InputModeE.saved
		res(1)
	})




	set_next_active_transaction = () => {

		if (this.s.inputmode !== InputModeE.saved && this.s.inputmode !== InputModeE.skipped && this.s.inputmode !== InputModeE.deleted) return false

		const index = this.m.newtransactions.findIndex(tr => tr === this.s.activetransaction)

		if (!this.m.newtransactions[index+1]) return false

		this.s.activetransaction = this.m.newtransactions[index+1]

		this.s.inputmode = InputModeE.cat

		this.focus_inputmode()

		ItemHandleReset(this.m, this.s)

		this.reset_all_inputs()

		return true
	}




	set_to_all_done = () => {
		alert("All transactions are done")
		return true
	}




	skip(e:any) {
		this.s.inputmode = InputModeE.skipped
		if (!this.set_next_active_transaction()) this.set_to_all_done()
		this.sc()

		e.detail.resolved()
	}




	delete = (e:any) => new Promise<void>(async (_res) => {
		this.s.inputmode = InputModeE.deleted

		await $N.FetchLassie( `/api/xen/finance/ignore_transaction`, { 
			method:"POST", 
			body:JSON.stringify({ ynab_id: this.s.activetransaction.ynab_id }) 
		})

		if (!this.set_next_active_transaction()) this.set_to_all_done()
		this.sc()

		e.detail.resolved()
	})




	reset_all_inputs = () => {
		const names = ['cat', 'note', 'tag', 'amount', 'merchant']

		for (const name of names) {
			const inputel = this.shadow.querySelector("#input-" + name) as HTMLInputElement
			inputel.value = ""
		}
	}




	focus_inputmode = () => {
		const inputel = this.shadow.querySelector("#input-" + this.s.inputmode) as HTMLInputElement
		inputel.focus()
	}




	setcat_from_click = (e:MouseEvent) => { 
		Set_Cat_From_Click(this.m, this.s, e); 
		this.save_step('', 'forward'); 
		this.sc(); 
		this.focus_inputmode(); 
	}
	settag_from_click = (e:MouseEvent) => { 
		Set_Tag_From_Click(this.m, this.s, e); 
		this.save_step('', 'forward'); 
		this.sc(); 
		this.focus_inputmode(); 
	}






	sc() {
		render(this.template(this.s, this.m), this.shadow);
	}




	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; };

}




customElements.define('v-addtr', VAddTr);







export {  }

