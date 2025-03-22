

import { str,num } from "../../../defs_server_symlink.js"
import { $NT, FetchResultT, CMechLoadStateE, CMechLoadedDataT } from "../../../defs_client_symlink.js"
import { YnabTransactionT } from "../../../defs_instance_server_symlink.js"
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

		//const ynab_transactions = await $N.FetchLassie('/api/xen/finance/get_ynab_transactions', {}) as YnabTransactionT[]


		setTimeout(() => {
			this.m.ynab_transactions = JSON.parse(`[{"ynab_id":"fef97238-ea57-4fd2-b406-fcb3981d7085","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":18.5,"merchant":"QAPITAL Transfer","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1740045600},{"ynab_id":"6f6e8f90-6388-47f0-a177-e069aa998419","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":48,"merchant":"The Daily Wire","notes":"","source_id":"7688adbc-13ef-469f-81d7-1e02098d2d06","tags":[],"ts":1740650400},{"ynab_id":"fc26a9a8-3388-43ec-9fda-6d5ab8e28a79","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":18.5,"merchant":"QAPITAL Transfer","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1740650400},{"ynab_id":"0d3792d0-f8f2-4fea-886a-4c1949949127","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":108.25,"merchant":"Apple Store","notes":"","source_id":"7688adbc-13ef-469f-81d7-1e02098d2d06","tags":[],"ts":1740736800},{"ynab_id":"bb47e7f7-bf8b-4d04-987c-495fcdc28a17","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":0.07,"merchant":"Adjustment","notes":"","source_id":"7688adbc-13ef-469f-81d7-1e02098d2d06","tags":[],"ts":1740909600},{"ynab_id":"e0568dd1-e20b-4ec2-aa63-dfa894a61432","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":48,"merchant":"Adjustment","notes":"","source_id":"7688adbc-13ef-469f-81d7-1e02098d2d06","tags":[],"ts":1740909600},{"ynab_id":"27899296-318d-4b7c-a297-68892861353a","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":0.1,"merchant":"Deposit Transfer","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1740996000},{"ynab_id":"045d777f-4a97-47de-9b99-0b967c623451","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":70,"merchant":"From Share 02","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741082400},{"ynab_id":"9b8be67d-80d5-4e78-bf5d-4ba3a7d03f49","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":15,"merchant":"From Loan 74","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741255200},{"ynab_id":"22642e06-2f74-4890-92cb-6da8e50cf34e","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":10000,"merchant":"Deposit Transfer From HAMMON,DAVIS XXXXXXX4378","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741255200},{"ynab_id":"3259880c-ea01-4dfd-a613-eafd27eeafb0","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":10000,"merchant":"Withdrawal by","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741341600},{"ynab_id":"259b8dd2-6f3e-4a42-ac44-4f3986b0abc8","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":21525,"merchant":"Deposit ACH FP W TYPE: COLL/DISB CO: FP WATER SERVICE Entry Class Code: PPD ACH Trace Number: 6","notes":"","source_id":"59511089-ad45-4439-9dcc-204940f5d5d4","tags":[],"ts":1741341600},{"ynab_id":"dcad8686-6108-46d2-b108-68e7134918bb","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":21529.94,"merchant":"Withdrawal Trans To HAMMON,DAVIS XXXXXXX5230","notes":"","source_id":"59511089-ad45-4439-9dcc-204940f5d5d4","tags":[],"ts":1741514400},{"ynab_id":"df3f7b5a-3b4e-41e2-9f57-7021a7f338f2","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":4787,"merchant":"Withdrawal Trans To HAMMON,DAVIS XXXXXXX4378","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741514400},{"ynab_id":"cb5ae031-0148-48f5-bd41-307bc107c077","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":4392.34,"merchant":"To Loan 74","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741514400},{"ynab_id":"3f2a196e-4f23-4792-9273-dc3b38ecf4a6","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":1600,"merchant":"Withdrawal Debit CASH APP*DAVIS HAMMON Oakland CA Date 03/10/25 30 4829 Card 8038","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741514400},{"ynab_id":"04b656d5-62e4-4510-bf9e-95d419d827fd","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":1600,"merchant":"Withdrawal Debit CASH APP*DAVIS HAMMON Oakland CA Date 03/10/25 60 4829 Card 8038","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741514400},{"ynab_id":"7d811974-b300-4999-ae1f-124278a71070","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":375.78,"merchant":"To Loan 01","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741514400},{"ynab_id":"d665abab-b5c2-4d61-919d-606161a59a7b","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":358.31,"merchant":"To Loan 65","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741514400},{"ynab_id":"84c6a160-88d4-49a7-bbc0-2d6f41aa48b8","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":5947.21,"merchant":"Bill Payment","notes":"","source_id":"7688adbc-13ef-469f-81d7-1e02098d2d06","tags":[],"ts":1741514400},{"ynab_id":"1b6c5978-6d90-4593-8600-a4b6b0768486","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":21529.94,"merchant":"Deposit Transfer From HAMMON,DAVIS XXXXXXX8125","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741514400},{"ynab_id":"3cce5afc-d08c-40fd-a315-927ef946bc11","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":1500.78,"merchant":"Transfer : Chase Card","notes":"","source_id":"61771fdb-4121-4442-bd4f-057290a64b2e","tags":[],"ts":1741600800},{"ynab_id":"7e1c0268-a98d-4952-8cd8-c4126ac3ea11","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":59,"merchant":"Etsy","notes":"","source_id":"7688adbc-13ef-469f-81d7-1e02098d2d06","tags":[],"ts":1741600800},{"ynab_id":"1378475a-fb1d-4d40-83ec-1106a2d047b1","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":18.5,"merchant":"QAPITAL Transfer","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741600800},{"ynab_id":"64b3cdfb-1d87-4d6b-9a5b-96ee96f258cc","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":1500.78,"merchant":"Transfer : Cash Personal","notes":"","source_id":"be68e35d-b273-43c4-98ba-ebe572e7da8e","tags":[],"ts":1741600800},{"ynab_id":"33f8e455-638d-4dad-976e-a3181b5208fb","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":10000,"merchant":"Deposit by Wire Wire Originator INSIGHT TITLE COMPANY","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741600800},{"ynab_id":"7fc5a3a7-914e-45e4-889b-864d9c5acc51","preset_area_id":null,"preset_cat_name":"Skip","amount":5947.21,"merchant":"Apple Card Payment","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741687200},{"ynab_id":"621bef3b-2eda-4771-9eb1-a9364d1000e8","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":1500.78,"merchant":"Withdrawal ACH C TYPE: EPAY CO: CHASE CREDIT CRD NAME: DAVIS L HAMMON Entry Class Code: WEB ACH Trace Number: 0","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741687200},{"ynab_id":"c84284d2-4cf0-44c8-9414-3080cf568579","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":59,"merchant":"Adjustment","notes":"","source_id":"7688adbc-13ef-469f-81d7-1e02098d2d06","tags":[],"ts":1741687200},{"ynab_id":"e65edf86-173e-4f37-9e1d-3ad597766605","preset_area_id":null,"preset_cat_name":"Uncategorized","amount":18.5,"merchant":"QAPITAL Transfer","notes":"","source_id":"91bee654-700c-4694-a2b1-2498ef734397","tags":[],"ts":1741860000},{"ynab_id":"97a2c93b-1b55-4578-b7e2-8af73a4a6404","preset_area_id":"dbb7396b-413f-40d7-9a3f-7c986e485233","preset_cat_name":"Uncategorized","amount":51,"merchant":"Credit Card Payment Received","notes":"","source_id":"47c009d5-31e2-44eb-b077-04858635299e","tags":[],"ts":1741255200},{"ynab_id":"a5155a74-1a33-42b5-aff9-289f64747660","preset_area_id":"dbb7396b-413f-40d7-9a3f-7c986e485233","preset_cat_name":"Uncategorized","amount":4392.34,"merchant":"Credit Card Payment Received","notes":"","source_id":"47c009d5-31e2-44eb-b077-04858635299e","tags":[],"ts":1741514400}]`)
			this.dispatchEvent(new Event('lateloaded'));
		}, 500)
	}




	async attributeChangedCallback(name:string, oldval:string|boolean|number, newval:string|boolean|number) {
		$N.CMech.AttributeChangedCallback(this, name, oldval, newval);
	}




	disconnectedCallback() {   $N.CMech.ViewDisconnectedCallback(this);   }




	kd = (loadeddata: CMechLoadedDataT, loadstate:CMechLoadStateE) => {

		switch (loadstate) {
			case CMechLoadStateE.INITIAL: console.log("INITIAL"); break;
			case CMechLoadStateE.SEARCHCHANGED: console.log("SEARCHCHANGED"); break;
			case CMechLoadStateE.DATACHANGED: console.log("DATACHANGED"); break;
			case CMechLoadStateE.VISIBLED: console.log("VISIBLED"); break;
			case CMechLoadStateE.LATELOADED: console.log("LATELOADED"); break;
		}

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

				return {
					ynab_id: tr.ynab_id,
					cat: this.m.cats.find(cat => cat.name === tr.preset_cat_name) || null,
					notes: tr.notes,
					amount: tr.amount,
					merchant: tr.merchant,
					tags: [],
					source: this.m.sources.find(s => s.id === tr.source_id) as SourceT,
					ts: tr.ts
				}
			}).sort((a, b) => a.ts - b.ts)

			this.s.newcount = this.m.newtransactions.length
			this.s.activetransactions = [JSON.parse(JSON.stringify(this.m.newtransactions[0]))]
			this.s.infocus = this.s.activetransactions[0]
			this.s.infocusindex = 0
			this.s.index = 0

			this.m.tags = this.m.tags.sort((a, b) => b.ts - a.ts)

			this.focus_inputmode()

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
		else if (e.altKey && e.key === 'ArrowUp') {
			console.log("addsplit")
			this.addsplit()
			e.preventDefault();
		}
		else {
			if (inputel.value.length < 2) return;
			ItemHandleKeyup(this.m, this.s, newval)
			this.sc();
		} 
	}




	set_next_focus = (mode:'standard'|'skip'|'delete') => new Promise<void>(async res => {

		if (mode === 'standard' && !this.s.infocus.cat) { alert("missing category"); this.set_cleared(); res(); return; }


		if (mode === 'standard' && this.s.infocusindex == this.s.activetransactions.length-1) {  // either no split or at last split
			await this.save_activetransactions() 
			next_of_newtransactions(this.s, this.m)
		} 
		else if (mode === 'standard') { // there is a split and not at last split
			this.s.infocusindex++
			this.s.infocus = this.s.activetransactions[this.s.infocusindex]
		} 
		else if (mode === 'skip' || mode === 'delete') {
			next_of_newtransactions(this.s, this.m)
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
				s.activetransactions = [JSON.parse(JSON.stringify(m.newtransactions[s.index]))]
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
			if (s.highlightcat) s.infocus!.cat = s.highlightcat

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

		const transactions_to_server = this.s.activetransactions.map((tr) => { return {
			amount: tr.amount,
			cat: tr.cat?.id,
			date: tr.ts, 
			merchant: tr?.merchant,
			notes: tr?.notes,
			source: tr?.source?.id || "",
			tags: tr?.tags.map(tag => tag.id),
			ynab_id: tr?.ynab_id,
			ts: Math.floor(new Date().getTime() / 1000)
		}; })

		const r = await new Promise<num|null>((res) => setTimeout(()=>res(1), 100))
		if (r === null) { alert("couldnt save transaction. throwing up"); throw new Error("timeout"); }

		//await $N.FetchLassie( `/api/xen/finance/save_transaction`, { 
		//	method:"POST", 
		//	body:JSON.stringify(transactions_to_server) 
		//})

		res(1)
	})




	skip = (e:any) => new Promise<void>(async (_res) => {
		this.s.inputmode = InputModeE.skipped
		this.sc()

		await this.set_next_focus('skip')

		this.sc()

		e.detail.resolved()
	})




	delete = (e:any) => new Promise<void>(async (_res) => {

		//const r = await $N.FetchLassie( `/api/xen/finance/ignore_transaction`, { 
		//	method:"POST", 
		//	body:JSON.stringify({ ynab_id: this.s.infocus.ynab_id }) 
		//})

		const r = await new Promise<num|null>((res) => setTimeout(()=>res(1), 100))
		if (r === null) { alert("couldnt delete transaction. throwing up"); throw new Error("timeout"); }

		await this.set_next_focus('delete')
		e.detail.resolved()
		this.sc()
	})




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

