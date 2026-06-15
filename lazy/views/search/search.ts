


import { GenericRowT } from "../../../defs_server_symlink.js"
import { $NT, CMechLoadedDataT, LazyLoadFuncReturnT } from "../../../defs_client_symlink.js"
import { TransactionT, AreaT, SourceT, CatT, TagT } from "../../../defs_instance_server_symlink.js"
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
	sourceIds: string[]
}

type SearchCriterionT = {
  field: SearchFieldT
  val: number | string
}

type ModelT = {
	transactions: TransactionT[]
	areas: AreaT[]
	sources: SourceT[]
	cats: CatT[]
	tags: TagT[]
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
	sourceIds: [],
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
		cats: [],
		tags: [],
	}
	header: null

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
		const ri:any = $N.IDB.GetAll(["sources","areas","cats","tags"]);

		try { 
			const r = await Promise.all([ri]); 
			const areas   = KnitFuncs.knit_areas(r[0].get('areas'))
			const tags    = KnitFuncs.knit_tags(r[0].get('tags'), areas)
			const sources = KnitFuncs.knit_sources(r[0].get('sources'), areas)
			const cats    = KnitFuncs.knit_cats(r[0].get('cats'), areas, [])

			d.set("areas", areas)
			d.set("sources", sources)
			d.set("cats", cats)
			d.set("tags", tags)
		}
		catch { rej(); return; }

		res({ d, refreshon:[]})
	})




	ingest = (loadeddata: CMechLoadedDataT) =>  {
		this.m.transactions = []
		this.m.areas        = loadeddata.get("areas") as AreaT[]
		this.m.sources      = loadeddata.get("sources") as SourceT[]
		this.m.cats         = loadeddata.get("cats") as CatT[]
		this.m.tags         = loadeddata.get("tags") as TagT[]
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
				if (!(target instanceof HTMLSelectElement)) return
				this.s.criteria.sourceIds = Array.from(target.selectedOptions).map(option => option.value).filter(Boolean)
				break
		}
		this.s.stale = this.shouldMarkStale()

		this.render()
	}




	submitSearch = async (event?:Event) => {
		
		if (event) event.preventDefault()
		if (this.s.loading) return

		const baseCriteria: SearchCriterionT[] = []
		if (this.s.criteria.merchant ) baseCriteria.push({ field: "merchant", val: this.s.criteria.merchant })
		if (this.s.criteria.amount !== null && this.s.criteria.amount > 0) baseCriteria.push({ field: "amount", val: this.s.criteria.amount })
		if (this.s.criteria.notes ) baseCriteria.push({ field: "notes", val: this.s.criteria.notes })

		const searchCriteriaSets = this.s.criteria.sourceIds.length
			? this.s.criteria.sourceIds.map(sourceId => [ ...baseCriteria, { field: "source", val: sourceId } as SearchCriterionT ])
			: [ baseCriteria ]

		this.render({
			loading: true,
			error: "",
			stale: false,
			hasSearched: true,
		})

		const searchResponses = await Promise.all(searchCriteriaSets.map(search_criterias => $N.FetchLassie("/api/xen/finance/transactions/search", {
			method: "POST",
			body: JSON.stringify({ search_criterias }),
		})))
		const failedResponse = searchResponses.find(r => !r.ok)
		if (failedResponse) {
			console.error("Search request failed:", failedResponse.status, failedResponse.statusText)
			this.render({
				loading: false,
				error: "Search failed. Please try again.",
				stale: true,
			})
			return
		}

		const rawTransactionsById = new Map<string, any>()
		for (const response of searchResponses) {
			for (const rawTransaction of response.data as any[]) {
				rawTransactionsById.set(rawTransaction.id, rawTransaction)
			}
		}

		const rawTransactions = Array.from(rawTransactionsById.values()).sort((a:any, b:any) => b.date - a.date)
		this.m.transactions = KnitFuncs.knit_transactions(rawTransactions, this.m.cats, this.m.sources, this.m.tags)

		this.render({
			loading: false,
			error: "",
			stale: false,
			hasSearched: true,
			lastExecutedCriteria: { ...this.s.criteria, sourceIds: [ ...this.s.criteria.sourceIds ] },
		})
	}

	shouldMarkStale = () => {
		if (!this.s.hasSearched) return false
		if (!this.s.lastExecutedCriteria) return true

		const a = this.s.criteria
		const b = this.s.lastExecutedCriteria
		const sourceIdsMatch = a.sourceIds.length === b.sourceIds.length && a.sourceIds.every((sourceId, i) => sourceId === b.sourceIds[i])
		return !(a.amount === b.amount && a.merchant === b.merchant && a.notes === b.notes && sourceIdsMatch)
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

	formatCategory = (catref:CatT|null) => {
		if (!catref) return "—"
		if (catref.parentref) return `${catref.parentref.name}:${catref.name}`
		return catref.name
	}

	currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
}




customElements.define('v-search', VSearch);




export { }



