
type int = number;   

import { str, bool } from "../../../defs_server_symlink.js"
import { $NT } from "../../../defs_client_symlink.js"
import { AreaT, CatT, SourceT, TagT, RawTransactionT } from '../../../defs.js'
import { knit_areas, knit_cats, knit_sources } from '../../libs/financefuncs_knit.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;


const enum InputModeE { Cat, Tag, Note, Amount }

type State = {
    newcount: int,
    rawtransactions: RawTransactionT[],
    focusedindex: number,
    transactionindex: int,
    splittotal: int,
    allow_split: bool,
    keyinput_mode: InputModeE,
    instructions: str
}

type QuickNoteT = {   amount: number, note: string, ts: number   }



class VAddTr extends HTMLElement {

	s:State
	areas: AreaT[]
	cats: CatT[]
	sources: SourceT[]
	tags: TagT[]
	quick_notes: QuickNoteT[]
	latest_raw_transactions: RawTransactionT[]
	shadow:ShadowRoot




	constructor() {   

		super(); 

		this.s = {
			newcount: 0,
			rawtransactions: [],
			focusedindex: 0,
			transactionindex: 0,
			splittotal: 0,
			allow_split: true,
			keyinput_mode: InputModeE.Cat,
			instructions: "category",
		}

		this.areas = []
		this.cats = []
		this.sources = []
		this.tags = []
		this.quick_notes = []
		this.latest_raw_transactions = []

		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {

		this.setAttribute("backhash", "home")

		const promises:any = []

		promises.push($N.Firestore.Retrieve(["areas", "cats", "sources", "quick_notes"]))
		promises.push($N.FetchLassie('/api/xen/finance/get_ynab_raw_transactions', {}))

		const v = await Promise.all(promises)

		this.areas = knit_areas(v[0][0])
		this.cats = knit_cats(this.areas, v[0][1])
		this.sources = knit_sources(v[0][2])
		this.quick_notes = v[0][3]

		const trs:any[] = (localStorage.getItem("user_email") === 'accounts@risingtiger.com') ? v[1].raw_transactions : v[1].raw_transactions.filter((tr:any) => tr.source === "17c0d30d-4e6f-496e-a8e4-91dae1de8b4a")

		this.latest_raw_transactions = trs.map((tr) => {

			const quick_note = this.quick_notes.find(qn=> {
				let fourdays = 518400 // 6 days in seconds
				if ((qn.ts > tr.ts - fourdays && qn.ts < tr.ts + fourdays) && (qn.amount === tr.amount)) {
					return true
				}
				return false;
			})

			return {
				skipsave: false,
				ignore: false,
				preset_area_id: tr.preset_area_id || null,
				preset_cat_name: tr.preset_cat_name || null,
				ynab_id: tr.ynab_id,
				amount: tr.amount,
				cat_id: null,
				cat_name: null,
				tag_ids: [],
				tag_names: [],
				merchant: tr.merchant,
				notes: (tr.notes || quick_note?.note || ""),
				source_id: tr.source_id,
				tags: tr.tags,
				ts: tr.ts


			} as RawTransactionT
		}).sort((a, b) => a.ts - b.ts)

		if (this.latest_raw_transactions.length === 0) {
			alert ("no new transactions")
		}

		else {
			this.s.transactionindex = 0
			this.s.newcount = this.latest_raw_transactions.length

			this.process_next_transaction()

			if (localStorage.getItem("user_email") !== 'accounts@risingtiger.com') {
				this.cats = this.cats.filter(cat => cat.area.name === "fam")
			}

		}

		this.sc()

		this.dispatchEvent(new Event('hydrated'))

		setTimeout(() => {
			const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement
			keycatcher_el.focus()
			keycatcher_el.addEventListener("keyup", this.keyup.bind(this))
		}, 500)
	}




	disconnectedCallback() {
		//
	}




	async process_next_transaction() {

		this.s.focusedindex = 0
		this.s.keyinput_mode = InputModeE.Cat
		this.s.rawtransactions = [this.latest_raw_transactions[this.s.transactionindex]]
		this.s.splittotal = 0
		this.s.allow_split = true
		this.sc()

		const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement
		keycatcher_el.value = ""
		keycatcher_el.focus()
	}




	async save_focused_transaction_and_load_next() {

		const nextit = ()=> {

			if (this.s.transactionindex == this.latest_raw_transactions.length - 1) {
				alert("all transactions processed. DONE")
			}
			else {
				this.s.transactionindex++
				this.process_next_transaction()
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
	}
    



	async keyup(e:KeyboardEvent) {

		const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement
		const val = keycatcher_el.value.toLowerCase()

		if (e.key === "Enter") {

			if (this.s.keyinput_mode === InputModeE.Tag) {

				const tag_strings = val.split("#").filter((t) => t.length > 0).map((t) => t.trim())
				const tags = this.tags.filter(tag => tag_strings.includes(tag.name))

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

					for(const c of this.cats) {
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

				/*
				const n = parseFloat(val)

				if (isNaN(n) || n === 0 || n > this.s.splittotal) {
					alert("split amount exceeded transaction amount or is invalid number")
					keycatcher_el.value = ""
					keycatcher_el.focus()
					return;
				}

				this.s.keyinput_mode = InputModeE.Note
				this.s.instructions = "note"
				keycatcher_el.value = ""
				keycatcher_el.focus()
				this.s.rawtransactions[this.s.focusedindex].amount = n
				this.s.splittotal -= n
				this.sc()
				*/
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
				this.latest_raw_transactions.splice(this.s.transactionindex, 0, JSON.parse(xstr))
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

				const results = await $N.Firestore.Retrieve("tags")
				this.tags = results[0] as Array<TagT>

				this.tags.sort((a, b) => b.ts - a.ts)

				const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement

				this.s.keyinput_mode = InputModeE.Tag

				this.s.instructions = "tags"

				keycatcher_el.value = "#"

				this.sc()

				keycatcher_el.focus()
			}
		}
	}




	save_transaction_and_move_to_next() {

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
	}



	skip_transaction() {
		this.s.rawtransactions[this.s.focusedindex].skipsave = true
		this.save_transaction_and_move_to_next()
	}




	ignore_transaction() {
		this.s.rawtransactions[this.s.focusedindex].ignore = true
		this.save_transaction_and_move_to_next()
	}




	setcat(cat:CatT) {

		const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement

		this.s.allow_split = false // only allow split before having chosen category. Must be first action after new raw transaction pops up

		this.s.rawtransactions[this.s.focusedindex].cat_id = cat.id

		for(const cat of this.cats) {
			const f = cat.subs?.find(sub => sub.id === this.s.rawtransactions[this.s.focusedindex].cat_id)
			if (f) {
				this.s.rawtransactions[this.s.focusedindex].cat_name = f.name
				break
			}
		}

		/*
		if (this.s.rawtransactions.length > 1) {

			this.s.keyinput_mode = InputModeE.Amount
			this.s.instructions = "amount"

			if (this.s.focusedindex == this.s.rawtransactions.length - 1) {
				keycatcher_el.value = this.s.splittotal.toFixed(2)
			} else {
				keycatcher_el.value = ""
			}
		}
		else {
			this.s.keyinput_mode = InputModeE.Note
			this.s.instructions = "note"
			keycatcher_el.value = this.s.rawtransactions[this.s.focusedindex].notes || ""
		}
		*/

		this.highlight_catnames_reset_all();
		this.sc()
		keycatcher_el.focus()
	}




	settags(tag_ids:string[], tag_names:string[]) {

		const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement

		this.s.rawtransactions[this.s.focusedindex].tag_ids = tag_ids
		this.s.rawtransactions[this.s.focusedindex].tag_names = tag_names

		this.s.keyinput_mode = InputModeE.Note
		keycatcher_el.value = ""

		this.s.instructions = "note"

		this.sc()

		keycatcher_el.focus()
	}



	setcat_from_click(e:MouseEvent) {

		const catid = (e.target as HTMLElement).dataset.id as str

		for(const c of this.cats) {
			const f = c.subs?.find(sub => sub.id === catid)
			if (f) {
				this.setcat(f)
				this.save_transaction_and_move_to_next()
				break
			}
		}
	}




	settag_from_click(e:MouseEvent) {

		const tagid = (e.target as HTMLElement).dataset.id as str

		const tag = this.tags.find(tag => tag.id === tagid) 

		this.settags([tag!.id], [tag!.name])
	}




	highlight_catnames(searchstr:str) {

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
	}




	highlight_catnames_reset_all() {
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
	}




	reset_transaction() {
		location.reload()
	}




	sc() {
		render(this.template(this.s, this.areas, this.cats, this.sources, this.tags), this.shadow);
	}




	template = (_s:any, _areas:any, _cats:any, _sources:any, _tags:any) => { return html`{--css--}{--html--}`; };

}




customElements.define('v-addtr', VAddTr);







export {  }

