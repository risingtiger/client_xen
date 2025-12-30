


import { GenericRowT } from "../../../defs_server_symlink.js"
import { $NT, CMechLoadedDataT, LazyLoadFuncReturnT } from "../../../defs_client_symlink.js"
import { TransactionT, AreaT, SourceT } from "../../../defs_instance_server_symlink.js"
import KnitFuncs from "../../libs/knitfuncs.js"

declare var render: any;
declare var html: any;
declare var $N: $NT;

export type AttributesT = {}

type SearchFieldT = "amount" | "merchant" | "notes" | "source"

type CriteriaValuesT = {
  amount: number|null
  merchant: string
  notes: string
  sourceId: string|null
}

type SearchCriterionT = {
  field: SearchFieldT
  val: number | string
}

type ModelT = {
	transactions: TransactionT[]
	areas: AreaT[]
	sources: SourceT[]
}

type StateT = {
  criteria: CriteriaValuesT
  lastExecutedCriteria: CriteriaValuesT | null
  loading: boolean
  error: string
  stale: boolean
  hasSearched: boolean
}

const ATTRIBUTES:AttributesT = {}

const DEFAULT_CRITERIA:CriteriaValuesT = {
  amount: null,
  merchant: "",
  notes: "",
  sourceId: null,
}

class VSearch extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES }
	s:StateT = {
		criteria: { ...DEFAULT_CRITERIA },
		lastExecutedCriteria: null,
		loading: false,
		error: "",
		stale: false,
		hasSearched: false,
	}
	m:ModelT = {
		transactions: [],
		areas: [],
		sources: [],
	}

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




	disconnectedCallback() {
		$N.CMech.ViewDisconnectedCallback(this);
	}




	static load = (_pathparams:GenericRowT, _searchparams:GenericRowT) => new Promise<LazyLoadFuncReturnT>(async (res, rej) => {

		const d = new Map<string,GenericRowT[]>()
		const promises:Promise<any>[] = []
		const ri:any  = $N.IDB.GetAll(["sources","areas"]);
		promises.push(ri)

		try { 
			const r = await Promise.all(promises); 
			d.set( "areas",   KnitFuncs.knit_areas(r[0].get('areas')))
			d.set( "sources", KnitFuncs.knit_sources(r[0].get('sources'), d.get('areas') as AreaT[]))
		}
		catch { rej(); return;   }

		res({ d, refreshon:[]})
	})




	ingest = (loadeddata: CMechLoadedDataT, _pathparams:GenericRowT, _searchparams:GenericRowT) =>  {
		this.m.transactions = []
		this.m.areas        = loadeddata.get("areas") as AreaT[]
		this.m.sources      = loadeddata.get("sources") as SourceT[]
		this.render()
	}




	render(state_changes?:Partial<StateT>) {
		this.s = Object.assign(this.s, state_changes);
		render(this.template(this.s, this.m), this.shadow);
	}




	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; };




	onCriteriaInput = (field:SearchFieldT, event:Event) => {

		const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
		if (!target) return

		switch (field) {
			case "amount":
				const valstr:string = target.value.trim().replace(/[^\d.]/g, "")
				const valnum:number|null = valstr ? Number(valstr) || null : null
				this.s.criteria.amount = valnum
				break

			case "merchant":
				this.s.criteria.merchant = target.value.trim()
				break

			case "notes":
				this.s.criteria.notes = target.value.trim()
				break

			case "source":
				const sourceValue = target.value.trim()
				this.s.criteria.sourceId = sourceValue ? sourceValue : null
				break
		}
		this.s.stale = this.shouldMarkStale()

		this.render()
	}




	submitSearch = async (event?:Event) => {

		if (event) event.preventDefault()
		if (this.s.loading) return

		const scr: SearchCriterionT[] = []
		if (this.s.criteria.merchant ) scr.push({ field: "merchant", val: this.s.criteria.merchant })
		if (this.s.criteria.amount !== null && this.s.criteria.amount > 0) scr.push({ field: "amount", val: this.s.criteria.amount })
		if (this.s.criteria.notes ) scr.push({ field: "notes", val: this.s.criteria.notes })
		if (this.s.criteria.sourceId) scr.push({ field: "source", val: this.s.criteria.sourceId })

		this.render({
			loading: true,
			error: "",
			stale: false,
			hasSearched: true,
		})

		try {
			const r = await $N.FetchLassie("/api/xen/finance/transactions/search", {
				method: "POST",
				body: JSON.stringify({ search_criterias: scr }),
			})

			if (!r.ok) {
				console.error("Search request failed:", r.status, r.statusText)
				this.render({
					loading: false,
					error: "Search failed. Please try again.",
					stale: true,
				})
				return
			}

			this.m.transactions = r.data as TransactionT[]

			this.render({
				loading: false,
				error: "",
				stale: false,
				hasSearched: true,
				lastExecutedCriteria: { ...this.s.criteria },
			})

		} catch (error) {
			console.error("Search request error:", error)
			this.render({
				loading: false,
				error: "Unable to search transactions. Please try again.",
				stale: true,
				hasSearched: true,
			})
		}
	}

	shouldMarkStale = () => {
		if (!this.s.hasSearched) return false
		if (!this.s.lastExecutedCriteria) return true

		const a = this.s.criteria
		const b = this.s.lastExecutedCriteria
		return a.amount === b.amount && a.merchant === b.merchant && a.notes === b.notes && a.sourceId === b.sourceId
	}


	formatDate = (epochSeconds:number) => {
		if (!Number.isFinite(epochSeconds)) return "—"
		return new Date(epochSeconds * 1000).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "2-digit",
		})
	}

	formatAmount = (amount:number) => {
		if (!Number.isFinite(amount)) return "—"
		return this.currencyFormatter.format(amount)
	}

	formatNotes = (notes:string) => {
		if (!notes) return "—"
		return notes
	}

	currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
}




customElements.define('v-search', VSearch);




export { }



