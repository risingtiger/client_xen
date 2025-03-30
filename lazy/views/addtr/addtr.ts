

import { str,num } from "../../../defs_server_symlink.js"
import { $NT, FetchResultT, CMechLoadStateE, CMechLoadedDataT } from "../../../defs_client_symlink.js"
import { SaveNewTransactionServerT, YnabTransactionT } from "../../../defs_instance_server_symlink.js"
import { AreaT, CatT, SourceT } from '../../../defs.js'
import { knit_areas, knit_cats, knit_sources } from '../../libs/financefuncs_knit.js'
import { NewTransactionT, InputModeE, AttributesT, ModelT, StateT, RawNewTransactionT } from "../../libs/addtr_defs.js"
import { HandleKeyup as ItemHandleKeyup, HandleReset as ItemHandleReset, Set_Cat_From_Click, Set_Tag_From_Click } from "../../libs/addtr_item.js"


declare var render: any;
declare var html: any;
declare var $N: $NT;



const ATTRIBUTES:AttributesT = { propa: "" }




class VAddTr extends HTMLElement {
	a:AttributesT = { ...ATTRIBUTES }
	m:ModelT = { areas: [], cats: [], sources: [], tags: [], quick_notes: [], ynab_transactions:[], newtransactions:[],  }
	s:StateT = {
		newcount: 0,
		index: 0,
		activetransactions: [],
		infocus: {} as NewTransactionT,
		infocusindex: 0,
		inputmode: InputModeE.cat,
		highlightcat: null,
		highlighttag: null,
		filteredcats: [],
		filteredtags: [],
		original_amount: null
	}

	keycatcherel:HTMLInputElement

	shadow:ShadowRoot


	static get observedAttributes() { return Object.keys(ATTRIBUTES); }


	constructor() {   
		super(); 
		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {
		await $N.CMech.ViewConnectedCallback(this, {kdonvisilbed:true, kdonlateloaded:true})
		this.dispatchEvent(new Event('hydrated'));

		const r = await $N.FetchLassie('/api/xen/finance/get_ynab_transactions', {}) as YnabTransactionT[]
		if (r === null) { alert("couldnt get transactions. throwing up"); throw new Error("timeout"); }
		this.m.ynab_transactions = r
		this.dispatchEvent(new Event('lateloaded'));
	}




	async attributeChangedCallback(name:string, oldval:string|boolean|number, newval:string|boolean|number) {
		$N.CMech.AttributeChangedCallback(this, name, oldval, newval);
	}




	disconnectedCallback() {   $N.CMech.ViewDisconnectedCallback(this);   }




	kd = (loadeddata: CMechLoadedDataT, loadstate:CMechLoadStateE) => {

		if (loadstate === CMechLoadStateE.INITIAL || loadstate === CMechLoadStateE.DATACHANGED) {
			this.m.areas   = $N.Utils.resolve_object_references(loadeddata.get("areas")!, loadeddata) as AreaT[]
			this.m.cats    = knit_cats(this.m.areas, loadeddata.get('cats')!) as CatT[]
			this.m.sources = $N.Utils.resolve_object_references(loadeddata.get("sources")!, loadeddata) as SourceT[]
			this.m.tags    = $N.Utils.resolve_object_references(loadeddata.get("tags")!, loadeddata) as any[]

			this.s.filteredcats = this.m.cats
			this.s.filteredtags = this.m.tags
		}


		else if (loadstate === CMechLoadStateE.LATELOADED) {

			this.m.newtransactions = this.m.ynab_transactions.map((tr) => {

				let foundcat:CatT|null = null;
				if (tr.preset_cat_name) {
					for (const parentcat of this.m.cats) {
						const subcat = parentcat.subsref?.find(sub => sub.name === tr.preset_cat_name) || null
						if (subcat) { foundcat = subcat; break; }
					}
				}

				return {
					ynab_id: tr.ynab_id,
					catref: foundcat,
					date: tr.date,
					notes: tr.notes,
					amount: tr.amount,
					merchant: tr.merchant,
					tags: [],
					source: this.m.sources.find(s => s.id === tr.source_id) as SourceT,
				}
			}).sort((a, b) => a.date - b.date)

			this.m.tags = this.m.tags.sort((a, b) => b.ts - a.ts)

			this.s.newcount = this.m.newtransactions.length

			this.focus_inputmode()

			if (this.m.newtransactions.length === 0) {   alert("no new transactions"); return;   }


			this.s.activetransactions = [this.copynewtr(this.m.newtransactions[0])]
			this.s.infocus = this.s.activetransactions[0]
			this.s.infocusindex = 0
			this.s.index = 0

			return
		}
	}




	sc() {
		render(this.template(this.a, this.s, this.m), this.shadow);
	}




	handle_input_keyup = async (e: KeyboardEvent) => {

		if (this.s.inputmode === InputModeE.saving) return;

		const inputel = e.target as HTMLInputElement;
		const newval = inputel.value;

		if (e.key === "Tab") {
			e.preventDefault();
			this.save_step(e.shiftKey ? 'back' : 'forward')
			this.sc();

		} 
		else if (e.key === "Backspace") {
			ItemHandleReset(this.m, this.s);
			this.sc();
		}
		else if (e.key === "Enter") {
			this.save_step('neutral')
			this.s.inputmode = InputModeE.saving
			this.sc()
			await this.set_next_focus('standard')
			this.sc();
		}
		else if (e.key === 'ArrowUp') {
			console.log("addsplit")
			this.addsplit()
			e.preventDefault();
		}
		else if (e.key === 'ArrowDown') {
			confirm("delete?")
			this.delete(e)
			e.preventDefault();
		}
		else if (e.key === 'ArrowRight') {
			this.skip(e)
			e.preventDefault();
		}
		else {
			if (inputel.value.length < 2) return;
			ItemHandleKeyup(this.m, this.s, newval)
			this.sc();
		} 
	}




	set_next_focus = (mode:'standard'|'skip'|'delete') => new Promise<void>(async res => {

		if (mode === 'standard' && !this.s.infocus.catref) { alert("missing category"); this.set_cleared(); res(); return; }


		if (mode === 'standard' && this.s.infocusindex == this.s.activetransactions.length-1) {  // either no split or at last split
			await this.save_activetransactions() 
			next_of_newtransactions.call(this, this.s, this.m)
		} 
		else if (mode === 'standard') { // there is a split and not at last split
			this.s.infocusindex++
			this.s.infocus = this.s.activetransactions[this.s.infocusindex]
		} 
		else if (mode === 'skip' || mode === 'delete') {
			next_of_newtransactions.call(this, this.s, this.m)
		}

		this.set_cleared()
		res()


		function next_of_newtransactions(s:StateT, m:ModelT) {

			s.original_amount = 0

			if (s.index === m.newtransactions.length-1) { 
				alert ("all done")
				return
			}
			else {
				s.index++
				s.activetransactions = [this.copynewtr(m.newtransactions[s.index])]
				s.infocusindex = 0
				s.infocus = s.activetransactions[0]
			}

		}
	})




	set_cleared = () => {
		this.s.inputmode = InputModeE.cat
		this.focus_inputmode()
		ItemHandleReset(this.m, this.s)
		//this.reset_all_inputs()
	}




	save_step = (direction:'neutral'|'back'|'forward' = 'neutral') => {

		const s = this.s
		
		if (s.inputmode === InputModeE.cat) {
			if (s.highlightcat) s.infocus!.catref = s.highlightcat

			if      (direction === 'forward') s.inputmode = InputModeE.note
		}
		else if (s.inputmode === InputModeE.note) {
			const newval = (this.shadow.querySelector("#input-note") as HTMLInputElement).value
			if (newval) s.infocus!.notes = newval

			if      (direction === 'forward') s.inputmode = InputModeE.tag
			else if (direction === 'back') s.inputmode    = InputModeE.cat
		}
		else if (s.inputmode === InputModeE.tag) {
			if ( s.highlighttag ) s.infocus!.tags = [s.highlighttag!]

			if      (direction === 'forward') s.inputmode = InputModeE.amount
			else if (direction === 'back') s.inputmode    = InputModeE.note
		}
		else if (s.inputmode === InputModeE.amount) {
			const newval = (this.shadow.querySelector("#input-amount") as HTMLInputElement).value
			if (newval) s.infocus!.amount = Number(newval)

			if      (direction === 'forward') s.inputmode = InputModeE.merchant
			else if (direction === 'back') s.inputmode    = InputModeE.tag
		}
		else if (s.inputmode === InputModeE.merchant) {
			const newval = (this.shadow.querySelector("#input-merchant") as HTMLInputElement).value
			if (newval) s.infocus!.merchant = newval

			if      (direction === 'back') s.inputmode    = InputModeE.amount
		}
	}




	save_activetransactions = () => new Promise<null|number>(async (res) => {

		const transactions_to_server:SaveNewTransactionServerT[] = this.s.activetransactions.map((tr) => { return {
			amount: tr.amount,
			cat: tr.catref?.id as str,
			date: tr.date, 
			merchant: tr?.merchant,
			notes: tr?.notes || "",
			source: tr?.source?.id || "",
			tags: tr?.tags.map(tag => tag.id),
			ynab_id: tr?.ynab_id,
		}; })

		const r = await $N.FetchLassie( `/api/xen/finance/save_transaction`, { 
			method:"POST", 
			body:JSON.stringify(transactions_to_server) 
		})
		if (r === null) { alert("couldnt save transaction. throwing up"); throw new Error("timeout"); }

		res(1)
	})




	skip = (e:any) => new Promise<void>(async (_res) => {
		this.s.inputmode = InputModeE.skipped
		this.sc()

		await this.set_next_focus('skip')

		this.sc()

		if (e.detail) e.detail.resolved()
	})




	delete = (e:any) => new Promise<void>(async (_res) => {

		const r = await $N.FetchLassie( `/api/xen/finance/ignore_transaction`, { 
			method:"POST", 
			body:JSON.stringify({ ynab_id: this.s.infocus.ynab_id }) 
		})
		if (r === null) { alert("couldnt delete transaction. throwing up"); throw new Error("timeout"); }

		await this.set_next_focus('delete')
		if (e.detail) e.detail.resolved()
		this.sc()
	})




	addnew = () => {

		const newtr:NewTransactionT = {
			ynab_id: null,
			catref: null,
			date: Math.floor(Date.now() / 1000),
			notes: "",
			amount: 0,
			merchant: "",
			tags: [],
			source: this.m.sources.find(s => s.id === "61771fdb-4121-4442-bd4f-057290a64b2e") as SourceT, //cashpers
		}

		this.s.activetransactions = [newtr]

		this.s.newcount = this.m.newtransactions.length + 1

		this.focus_inputmode()

		this.s.infocus = this.s.activetransactions[0]
		this.s.infocusindex = 0
		this.s.index = 0

		this.sc()
	}




	addsplit = () => {
		if (this.s.activetransactions.length === 1) {
			this.s.original_amount = this.s.activetransactions[0].amount
			this.s.infocus.amount  = 0
		}

		const nt = this.m.newtransactions[this.s.index]
		nt.amount = 0
		const n = JSON.parse(JSON.stringify(nt))
		this.s.activetransactions.push(n);
		this.sc();

		( this.shadow.querySelector("#input-cat") as HTMLInputElement ).focus()
	}




	copynewtr = (nt:NewTransactionT) : NewTransactionT => {
		return {
			ynab_id: nt.ynab_id,
			catref: nt.catref,
			date: nt.date,
			notes: nt.notes,
			amount: nt.amount,
			merchant: nt.merchant,
			tags: nt.tags.map(tag => tag),
			source: nt.source,
		} 
	}




	focus_inputmode = () => {
		const inputel = this.shadow.querySelector("#input-" + this.s.inputmode) as HTMLInputElement
		inputel.focus()
	}




	setcat_from_click = (e:MouseEvent) => { 
		Set_Cat_From_Click(this.m, this.s, e); 
		this.save_step('forward'); 
		this.sc(); 
		this.focus_inputmode(); 
	}
	settag_from_click = (e:MouseEvent) => { 
		Set_Tag_From_Click(this.m, this.s, e); 
		this.save_step('forward'); 
		this.sc(); 
		this.focus_inputmode(); 
	}











	template = (_a:AttributesT, _s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; };

}




customElements.define('v-addtr', VAddTr);






export {  }

