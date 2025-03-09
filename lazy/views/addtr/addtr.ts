

import { str } from "../../../defs_server_symlink.js"
import { $NT } from "../../../defs_client_symlink.js"
import { CatT, SourceT } from '../../../defs.js'
import { knit_areas, knit_cats, knit_sources } from '../../libs/financefuncs_knit.js'
import { NewTransactionT, InputModeE, AttributesT, ModelT, StateT, RawNewTransactionT } from "../../libs/addtr_defs.js"
import { SaveAtMode as InputSaveAtMode } from "../../libs/addtr_input.js"
import { HandleKeyup as ItemHandleKeyup, HandleReset as ItemHandleReset } from "../../libs/addtr_item.js"


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
		setTimeout(()=> {
			const cat_input = this.shadow.querySelector("#input-cat") as HTMLInputElement
			cat_input.focus()
			res()
		},500)
	})




	kd() {
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

		//this.process_next_transaction()
	}




	async process_next_transaction() {
		/*
		this.s.focusedindex = 0
		this.s.inputmode = InputModeE.cat
		this.s.rawtransactions = [this.m.latest_raw_transactions[this.s.transactionindex]]
		this.s.splittotal = 0
		this.s.allow_split = true
		*/
	}




	async save_focused_transaction_and_load_next() {

		/*
		const nextit = ()=> {

			if (this.s.transactionindex == this.m.latest_raw_transactions.length - 1) {
				alert("all transactions processed. DONE")
			}
			else {
				this.s.transactionindex++
				this.process_next_transaction()
				this.sc()
				const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement
				keycatcher_el.value = ""
				keycatcher_el.focus()
			}
		}


		const unskipped_transactions = this.s.rawtransactions.filter(tr => !tr.skipsave)
			
		if (unskipped_transactions.length === 0) {
			nextit()    
			return;

		} else {
			const body = this.s.rawtransactions

			await $N.FetchLassie( `/api/xen/finance/save_transactions`, { 
				method:"POST", 
				body:JSON.stringify(body) 
			})
			nextit()
		}
		*/
	}




	handle_input_keyup(e: KeyboardEvent) {

		const inputel = e.target as HTMLInputElement;

		if (e.key === "Tab") {
			e.preventDefault();
			if (e.shiftKey) {
				// Handle Shift+Tab (backward navigation)
				InputSaveAtMode(this.s, inputel, false);
			} else {
				// Regular Tab (forward navigation)
				InputSaveAtMode(this.s, inputel, true);
			}
			this.sc();

		} 
		else if (e.key === "Backspace") {
			ItemHandleReset(this.m, this.s, inputel);
			this.sc();
		}
		else if (e.key === "Enter") {
			if (inputel.value.length < 2) return;

			InputSaveAtMode(this.s, inputel, false)

			this.completeActiveTransaction(this.s)

			this.sc();
		}
		else {
			ItemHandleKeyup(this.m, this.s, inputel);
			this.sc();
		} 
	}




	completeActiveTransaction(s:StateT) {
	}

	//async keyup(e:KeyboardEvent) {
		// Keeping this method for backward compatibility
		// but it's no longer used with the new input fields

		/*
		const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement
		const val = keycatcher_el.value.toLowerCase()

		if (e.key === "Enter") {

			if (this.s.keyinput_mode === InputModeE.Tag) {

				const tag_strings = val.split("#").filter((t) => t.length > 0).map((t) => t.trim())
				const tags = this.m.tags.filter(tag => tag_strings.includes(tag.name))

				if (tags.length === 0) {
					alert("no tags found")
					keycatcher_el.value = "#"
					keycatcher_el.focus()
					return;
				}

				this.settags(tags.map(tag => tag.id), tags.map(tag => tag.name))
				
			} 

			else if (this.s.keyinput_mode === InputModeE.Cat) {

				if (val.length < 2) {

					alert ("no category selected");
					keycatcher_el.value = ""
					keycatcher_el.focus()
					this.highlight_catnames_reset_all();
				} 

				else {

					const catname_els = this.shadow.querySelectorAll('.subcats > h6:not(.hidden)') as NodeListOf<HTMLElement>
					let foundcat:CatT|null = null
					let catname = catname_els[0].textContent as str

					for(const c of this.m.cats) {
						const f = c.subs?.find(sub => sub.name === catname)
						if (f) {
							foundcat = f
							break
						}
					}

					if (foundcat) {
						this.setcat(foundcat)
						this.save_transaction_and_move_to_next()
					} 

					else {
						alert ("no category found or too many categories found. need to match only one.");
						keycatcher_el.value = ""
						keycatcher_el.focus()
						this.highlight_catnames_reset_all();
					}
				}
			}

			else if (this.s.keyinput_mode === InputModeE.Amount) {

				const numval = Number(val)
				if (isNaN(numval) || numval === 0) {
					alert("invalid number")
					keycatcher_el.value = ""
					keycatcher_el.focus()
					return;
				}
				this.s.rawtransactions[this.s.focusedindex].amount = numval
				this.s.keyinput_mode = InputModeE.Cat
				this.s.instructions = "category"
				keycatcher_el.value = ""
				keycatcher_el.focus()
				this.sc()

			}

			else if (this.s.keyinput_mode === InputModeE.Note) {

				this.s.rawtransactions[this.s.focusedindex].notes = val
				this.s.keyinput_mode = InputModeE.Cat
				this.s.instructions = "category"
				keycatcher_el.value = ""
				keycatcher_el.focus()
				this.sc()
			}
		}

		else if (this.s.keyinput_mode === InputModeE.Cat) {

			if (e.key === "Backspace") {
				this.highlight_catnames_reset_all();
				keycatcher_el.value = ""
				keycatcher_el.focus()
				this.sc()
			}

			else if (keycatcher_el.value === "dd") { // just delete this transaction (sets to ignore and moves to next)
				this.ignore_transaction()
			}

			else if (e.key === " " && keycatcher_el.value === "") { // first character is space

				this.s.keyinput_mode = InputModeE.Note
				this.s.instructions = "note"
				keycatcher_el.value = this.s.rawtransactions[this.s.focusedindex].notes || ""

				this.sc()
			}

			else if (!isNaN(Number(e.key)) && Number(e.key) > 0) {
				this.s.keyinput_mode = InputModeE.Amount
				this.s.instructions = "amount"
				keycatcher_el.value = e.key
				this.sc()
			}

			else if (keycatcher_el.value === "@") {

				const xstr = JSON.stringify(this.s.rawtransactions[this.s.focusedindex])
				this.m.latest_raw_transactions.splice(this.s.transactionindex, 0, JSON.parse(xstr))
				keycatcher_el.value = ""
				this.sc()
			}

			else if (e.key === "." && keycatcher_el.value === ".") {
				this.skip_transaction()
			}

			else { 
				if (val.length > 1) {
					this.highlight_catnames(val)
					this.sc()
				}
			}
		}

		else if (this.s.keyinput_mode === InputModeE.Amount) {
			// nothing
		}

		else if (this.s.keyinput_mode === InputModeE.Note) {

			if (e.key === "#") {

				const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement

				this.s.keyinput_mode = InputModeE.Tag

				this.s.instructions = "tags"

				keycatcher_el.value = "#"

				this.sc()

				keycatcher_el.focus()
			}
		}
		*/
	//}




	save_transaction_and_move_to_next() {

		/*
		const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement

		if (this.s.focusedindex === this.s.rawtransactions.length - 1) {
			keycatcher_el.value = ""
			this.s.instructions = "category"
			keycatcher_el.focus()
			this.sc()

			this.save_focused_transaction_and_load_next()
		}

		else {
			this.s.focusedindex++
			this.s.keyinput_mode = InputModeE.Cat
			this.s.instructions = "category"
			keycatcher_el.value = ""
			keycatcher_el.focus()
			this.sc()
		}
		*/
	}



	skip_transaction() {
		/*
		this.s.rawtransactions[this.s.focusedindex].skipsave = true
		this.save_transaction_and_move_to_next()
		*/
	}




	ignore_transaction() {
		/*
		this.s.rawtransactions[this.s.focusedindex].ignore = true
		this.save_transaction_and_move_to_next()
		*/
	}




	setcat(cat:CatT) {

		/*
		const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement

		this.s.allow_split = false // only allow split before having chosen category. Must be first action after new raw transaction pops up

		this.s.rawtransactions[this.s.focusedindex].cat_id = cat.id

		for(const cat of this.m.cats) {
			const f = cat.subs?.find(sub => sub.id === this.s.rawtransactions[this.s.focusedindex].cat_id)
			if (f) {
				this.s.rawtransactions[this.s.focusedindex].cat_name = f.name
				break
			}
		}


		this.highlight_catnames_reset_all();
		this.sc()
		keycatcher_el.focus()
		*/
	}




	settags(tag_ids:string[], tag_names:string[]) {

		/*
		const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement

		this.s.rawtransactions[this.s.focusedindex].tag_ids = tag_ids
		this.s.rawtransactions[this.s.focusedindex].tag_names = tag_names

		this.s.keyinput_mode = InputModeE.Note
		keycatcher_el.value = ""

		this.s.instructions = "note"

		this.sc()

		keycatcher_el.focus()
		*/
	}



	setcat_from_click(e:MouseEvent) {

		/*
		const catid = (e.target as HTMLElement).dataset.id as str

		for(const c of this.m.cats) {
			const f = c.subs?.find(sub => sub.id === catid)
			if (f) {
				this.setcat(f)
				this.save_transaction_and_move_to_next()
				break
			}
		}
		*/
	}




	settag_from_click(e:MouseEvent) {

		/*
		const tagid = (e.target as HTMLElement).dataset.id as str

		const tag = this.m.tags.find(tag => tag.id === tagid) 

		this.settags([tag!.id], [tag!.name])
		*/
	}




	highlight_catnames(searchstr:str) {

		/*
		const subcatnames = this.shadow.querySelectorAll('.subcats > h6') as NodeListOf<HTMLElement>

		subcatnames.forEach((el) => {
			const t = el.textContent?.toLowerCase() as str
			const startat = t.indexOf(searchstr)

			if (startat === -1) {
				el.innerHTML = t
				el.classList.add("hidden")
			}

			else {
				const endat = startat + searchstr.length

				const before = t.slice(0, startat)
				const after = t.slice(endat)

				const newhtml = `${before}<span class="cathighlight">${searchstr}</span>${after}`

				el.innerHTML = newhtml
			}
		})

		const shown_cats = Array.from(subcatnames).filter((el) => !el.classList.contains("hidden"))
		this.s.rawtransactions[this.s.focusedindex].cat_name = shown_cats[0]?.textContent ?? ""

		const catparentels = this.shadow.querySelectorAll('.catparent') as NodeListOf<HTMLElement>

		catparentels.forEach((el) => {
			const subcatnames = el.querySelectorAll('h6') as NodeListOf<HTMLElement>
			
			// test if every subcatname is hidden
			const allhidden = Array.from(subcatnames).every((el) => el.classList.contains("hidden"))

			if (allhidden) {
				el.classList.add("hidden")
			}
		})
		*/
	}




	highlight_catnames_reset_all() {
		/*
		const subcatnames = this.shadow.querySelectorAll('.subcats > h6') as NodeListOf<HTMLElement>


		subcatnames.forEach((el) => {
			el.innerHTML = el.textContent as str
			el.classList.remove("hidden")
		})

		const catparentels = this.shadow.querySelectorAll('.catparent') as NodeListOf<HTMLElement>

		catparentels.forEach((el) => {
			el.classList.remove("hidden")
		})

		this.s.rawtransactions[this.s.focusedindex].cat_name = ""
		*/
	}




	reset_transaction() {
		/*
		location.reload()
		*/
	}




	sc() {
		render(this.template(this.s, this.m), this.shadow);
	}




	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; };

}




customElements.define('v-addtr', VAddTr);







export {  }

