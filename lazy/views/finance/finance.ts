


import { str, num, GenericRowT } from "../../../defs_server_symlink.js"
import { $NT, CMechLoadedDataT, LazyLoadFuncReturnT } from "../../../defs_client_symlink.js"
import { AreaT, CatT, SourceT, TagT, PaymentT, TransactionT, CatCalcsT, CatCalcsTotalsT, MonthSnapShotT, FilterT, CatBucketsInfoT, AreaQuadBucketTotalsT } from '../../../defs_instance_server_symlink.js'
import KnitFuncs from "../../libs/knitfuncs.js"


import { get_months  } from '../../libs/financefuncs_gen.js'
import { filter_transactions, sort_transactions, current_month_of_filtered_transactions  } from '../../libs/financefuncs_sortfilter.js'
import { CatCalcs, CatCalcTotalsOfCatTag, CatCalcTotalsOfFilter, CatCalcTotalsCombined  } from '../../libs/financefuncs_catcalcs.js'

//import { knit_all, get_months, filter_transactions, sort_transactions, current_month_of_filtered_transactions, catcalcs, catcalc_totals, snapshots, snapshots_for_ui  } from '../../libs/finance_funcs.js'
import './parts/edit_transaction/edit_transaction.js'
import './parts/balances/balances.js'
import './parts/payments/payments.js'
import './parts/sources/sources.js'
import './parts/cats/cats.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;



enum KeyE { NONE, MONTHS_COUNT }

export type AttributesT = {
    propa: str,
}

type ModelT = {
	ynab_accounts:any[],
    areas:AreaT[], 
    cats:CatT[], 
    sources:SourceT[], 
    tags: TagT[],
    users: any[],
	payments: PaymentT[],
    transactions:TransactionT[], 
	monthsnapshots: MonthSnapShotT[],
    previous_static_monthsnapshots:MonthSnapShotT[],
    filtered_transactions:TransactionT[], 
    current_month_transactions:TransactionT[], 
    catcalcs:CatCalcsT[],
    catcalcstotals: CatCalcsTotalsT,
    catcalcstotals1: CatCalcsTotalsT,
    catcalcstotals2: CatCalcsTotalsT,
    catcalcstotals3: CatCalcsTotalsT,
    catcalcstotals1_2: CatCalcsTotalsT,
    catcalcstotals1_2_3: CatCalcsTotalsT,
	data_to_sync: string[]
}

type StateT = {
	touch_attached: boolean,
    filter: FilterT,
    months: Date[],
    transactiondetails: { show_ui: 0|1|2, t: TransactionT|null },
	cat_buckets: CatBucketsInfoT[],
	area_quad_bucket_totals: AreaQuadBucketTotalsT,
    catsview: { show_ui: 0|1|2, mode:'view'|'edit', editing_cat_id:str|null, cats_with_deleteflag: {id:str, name:string}[] },
    sourcesview: { show_ui: 0|1|2, mode:'view'|'edit', editing_source_id:str|null },
	paymentsview: { show_ui: 0|1|2 },
	tagsview: { show_ui: 0|1|2, tagtotals: {id:str, name:str, sort:num, total:number}[] },
	editview: { show_ui: 0|1|2, transaction_id: str },
	snapshotview_showui: 0|1|2,
	bucketview_showui: 0|1|2,
	balancesview: { show_ui: 0|1|2 },
    months_display_str: string[],
    touch: { isactive:boolean, beginx: number, beginy: number, origin_action:'month'|'catquad'|'area'|'switch_calcs_transactions_view'},
    key: { listen_for: KeyE  },
    prefs: { avgormed: 1|2 },
	calcs_month_columns_count: number,
	split_mode:'catcalcs'|'transactions'|'both'|'unknown'
	allotment_left:number
	allotment_left1_2:number
	burnamountleft:number
}




const ATTRIBUTES:AttributesT = { propa: "" }




class VFinance extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES }
	s:StateT = {
		touch_attached: false,
		filter: { arearef: null, parentcatref: null, catref: null, sourceref: null, tagsref: null, daterange: null, merchant: null, note: null, amountrange: null, cattags: [] },
		months: [],
		transactiondetails: { show_ui: 0, t: null },
		cat_buckets: [],
		area_quad_bucket_totals: { remainder: 0, spent: 0, assigned: 0, unassigned: 0 },
		catsview: { show_ui: 0, mode:'view', editing_cat_id:null, cats_with_deleteflag: [] },
		paymentsview: { show_ui: 0 },
		sourcesview: { show_ui: 0, mode:'view', editing_source_id:null },
		tagsview: { show_ui: 0, tagtotals: []},
		editview: { show_ui: 0, transaction_id: '' },
		bucketview_showui: 0,
		balancesview: { show_ui: 0 },
		snapshotview_showui: 0,
		months_display_str: [],
		touch: { isactive: false, beginx: 0, beginy: 0, origin_action: 'month'},
		key: { listen_for: KeyE.NONE },
		prefs: { avgormed: 1 },
		calcs_month_columns_count: 0, // will be set later
		split_mode: 'unknown',
		allotment_left: 0,
		allotment_left1_2: 0,
		burnamountleft: 0
	}
	m:ModelT = {
		ynab_accounts: [],
		areas: [],
		cats: [],
		sources: [],
		tags: [],
		users:[],
		transactions: [],
		monthsnapshots: [],
		previous_static_monthsnapshots: [],
		filtered_transactions: [],
		current_month_transactions: [],
		catcalcs: [],
		catcalcstotals: { sums: [], allotment: 0, allotment_left: 0, med: 0, avg: 0 },
		catcalcstotals1: { sums: [], allotment: 0, allotment_left: 0, med: 0, avg: 0 },
		catcalcstotals2: { sums: [], allotment: 0, allotment_left: 0, med: 0, avg: 0 },
		catcalcstotals3: { sums: [], allotment: 0, allotment_left: 0, med: 0, avg: 0 },
		catcalcstotals1_2: { sums: [], allotment: 0, allotment_left: 0, med: 0, avg: 0 },
		catcalcstotals1_2_3: { sums: [], allotment: 0, allotment_left: 0, med: 0, avg: 0 },
		payments: [], 
		data_to_sync: ["areas", "cats", "sources", "tags", "payments", "transactions", "monthsnapshots"]
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

		const eltoattach = this.shadow.querySelector('.touchroot') as HTMLElement

		eltoattach.removeEventListener("touchstart", this.handle_touch_start.bind(this));
		eltoattach.removeEventListener("touchend", this.handle_touch_end.bind(this));
		eltoattach.removeEventListener("touchcancel", this.handle_touch_cancel.bind(this));
		eltoattach.removeEventListener("touchmove", this.handle_touch_move.bind(this));

		document.removeEventListener('keydown', this.handle_keydown.bind(this))
	}




	static load = (_pathparams:GenericRowT, searchparams:GenericRowT) => new Promise<LazyLoadFuncReturnT>(async (res, rej) => {

		let   r:any;
		const d                        = new Map<str,GenericRowT[]>()
		const promises:Promise<any>[] = []

		const today = new Date()
		const todayFormatted = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`
		const enddate = (searchparams.enddate || todayFormatted).split("-")
		let   enddate_year = Number(enddate[0])
		let   enddate_month = Number(enddate[1])
		let   monthcount = searchparams.monthcount || "default";
		
		if (monthcount === 'default') {
			monthcount = window.innerWidth < 768 ? 3 : 6
		} else {
			monthcount = Number(searchparams.monthcount)
		}

		const tomonth = new Date()
		tomonth.setUTCFullYear(enddate_year)
		tomonth.setUTCMonth(enddate_month-1)
		tomonth.setUTCDate(1)
		tomonth.setUTCHours(0, 0, 0, 0)
		tomonth.setUTCMonth(tomonth.getUTCMonth() + 1)
		tomonth.setUTCDate(0)
		tomonth.setUTCHours(23, 59, 59, 999)


		const frommonth = new Date()
		frommonth.setUTCFullYear(enddate_year)
		frommonth.setUTCMonth(enddate_month-monthcount)
		frommonth.setUTCDate(1)
		frommonth.setUTCHours(0, 0, 0, 0)

		const lower_bound = Math.floor( frommonth.getTime()/1000 )	
		const upper_bound = Math.floor( tomonth.getTime()/1000 )

		const ri:any  = $N.IDB.GetAll(["areas","cats","sources","tags","payments"]);
		const rii:any = $N.IDB.GetRangeAll(["transactions"], ['date'], [lower_bound], [upper_bound])

		promises.push(ri)
		promises.push(rii)
		try   { r = await Promise.all(promises); }
		catch { rej(); return; }

		const areas        = KnitFuncs.knit_areas(r[0].get("areas"))
		const tags         = KnitFuncs.knit_tags(r[0].get("tags"), areas)
		const sources      = KnitFuncs.knit_sources(r[0].get("sources"), areas)
		const cats         = KnitFuncs.knit_cats(r[0].get("cats"), areas, r[0].get('payments'))

		const payments     = KnitFuncs.knit_payments(r[0].get("payments"), sources, cats)
		const transactions = KnitFuncs.knit_transactions(r[1].get("transactions"), cats, sources, tags)

		d.set( "areas", areas )
		d.set( "cats", cats )
		d.set( "sources", sources )
		d.set( "tags", tags )
		d.set( "payments", payments )
		d.set( "transactions", transactions)

		tomonth.setUTCDate(1)
		tomonth.setUTCHours(0, 0, 0, 0)

		d.set( "calculated_params", [ { monthcount, tomonth}])

		res({ d, refreshon: [ "areas", "cats", "sources", "tags", "payments", "transactions", "users" ] })
		console.log("finance lazyload done")
	})




	ingest = (loadeddata: CMechLoadedDataT, _pathparams:GenericRowT, searchparams:GenericRowT) =>  {

		this.m.areas          = loadeddata.get("areas")! as AreaT[]
		this.m.cats           = loadeddata.get('cats') as CatT[]
		this.m.sources        = loadeddata.get("sources") as SourceT[]
		this.m.tags           = loadeddata.get("tags") as TagT[]
		this.m.payments       = loadeddata.get("payments") as PaymentT[]
		this.m.transactions   = loadeddata.get("transactions") as TransactionT[]
		this.m.users          = loadeddata.get("users") as any[]

		const calculated_params = loadeddata.get("calculated_params")![0] as any

		const defaultareaname = localStorage.getItem("user_email") === 'rfs@risingtiger.com' ? 'pers' : 'fam' 

		this.s.filter.arearef =  this.m.areas.find(a=>a.name === ( searchparams.areaname||defaultareaname )) || null

		this.s.filter.cattags = this.s.filter.cattags.length ? this.s.filter.cattags : [2]

		this.s.calcs_month_columns_count = calculated_params.monthcount
		if (this.s.split_mode === 'unknown') this.set_split_mode(false, 'both')

		this.set_active_month(calculated_params.tomonth)
		this.parse_new_state()
	}




	hydrated = () => {
		
		const eltoattach = this.shadow.querySelector('.touchroot') as HTMLElement

		if (!this.s.touch_attached) {
			eltoattach.addEventListener("touchstart", this.handle_touch_start.bind(this));
			eltoattach.addEventListener("touchend", this.handle_touch_end.bind(this));
			eltoattach.addEventListener("touchcancel", this.handle_touch_cancel.bind(this));
			eltoattach.addEventListener("touchmove", this.handle_touch_move.bind(this));
			document.addEventListener('keydown', this.handle_keydown.bind(this))
			this.s.touch_attached = true
		}
	}




	render(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes);
		render(this.template(this.s, this.m), this.shadow);
	}




	reset() {
		document.location.reload()
	}




	parse_new_state() {
		this.s.filter.daterange                 = [this.s.months[0], this.s.months[this.s.months.length-1]];
		this.m.filtered_transactions            = filter_transactions(this.m.transactions, this.s.filter);
		this.m.current_month_transactions       = current_month_of_filtered_transactions(this.m.filtered_transactions, this.s.months[this.s.months.length-1]);
		this.m.catcalcs                         = CatCalcs(this.m.filtered_transactions, this.s.filter.arearef as AreaT, this.s.filter.cattags, this.m.cats, this.s.months);
		this.m.catcalcstotals                   = CatCalcTotalsOfFilter(this.m.transactions, this.m.cats, this.s.months, this.s.filter);
		this.m.catcalcstotals1                  = CatCalcTotalsOfCatTag(this.m.transactions, this.m.cats, this.s.months, this.s.filter.arearef as AreaT, this.s.filter.daterange as [Date, Date], 1)
		this.m.catcalcstotals2                  = CatCalcTotalsOfCatTag(this.m.transactions, this.m.cats, this.s.months, this.s.filter.arearef as AreaT, this.s.filter.daterange as [Date, Date], 2)
		this.m.catcalcstotals3                  = CatCalcTotalsOfCatTag(this.m.transactions, this.m.cats, this.s.months, this.s.filter.arearef as AreaT, this.s.filter.daterange as [Date, Date], 3)
		this.m.catcalcstotals1_2                = CatCalcTotalsCombined([ this.m.catcalcstotals1, this.m.catcalcstotals2 ])
		this.m.catcalcstotals1_2_3              = CatCalcTotalsCombined([ this.m.catcalcstotals1, this.m.catcalcstotals2, this.m.catcalcstotals3 ])
		this.m.current_month_transactions       = sort_transactions(this.m.current_month_transactions, "date", "asc")

//_s.filter.cattags.length === 1 && _s.filter.cattags[0] === 2 ? Math.round(_s.filter.arearef.unfixedcosts  -  _m.catcalcstotals.sums[_m.catcalcstotals.sums.length-1]) : (_s.filter.cattags.length === 1 && _s.filter.cattags[0] === 1 ? Math.round(_m.catcalcstotals.costs - _m.catcalcstotals.sums[_m.catcalcstotals.sums.length-1]) : '') 

		let allotment_left = 0;
		if (this.s.filter.cattags && this.s.filter.cattags.length === 1 && this.s.filter.cattags[0] === 1) {
			allotment_left = this.m.catcalcstotals1.allotment_left
		} else if (this.s.filter.cattags && this.s.filter.cattags.length === 1 && this.s.filter.cattags[0] === 2) {
			allotment_left = this.m.catcalcstotals2.allotment_left
		}
		this.s.allotment_left = allotment_left
		this.s.allotment_left1_2 = this.m.catcalcstotals1_2.allotment_left
	}




	set_default_except_area_and_date_and_cattags() {

		this.s.filter.parentcatref = null; this.s.filter.catref = null; this.s.filter.sourceref = null;
		this.s.filter.tagsref = null; this.s.filter.merchant = null;
		this.s.filter.note = null; this.s.filter.amountrange = null;
	}




	set_area(areaname:string) {

		if(localStorage.getItem("user_email") === 'rfs@risingtiger.com') {
			this.s.filter.arearef = this.m.areas.find(area => area.name === areaname) as AreaT
			this.set_default_except_area_and_date_and_cattags()
			this.parse_new_state()
			this.render()

			// http://localhost:3008/v/finance?enddate=2025-08&monthcount=default&areaname=rtm
			const lastMonth = this.s.months[this.s.months.length - 1];
			const enddate = `${lastMonth.getUTCFullYear()}-${String(lastMonth.getUTCMonth() + 1).padStart(2, '0')}`;
			const monthcount = String(this.s.calcs_month_columns_count);
			$N.SwitchStation.GoTo(`finance/1234/quicktest/5432?enddate=${enddate}&monthcount=${monthcount}&areaname=${areaname}`)
		} else {
			console.log("not allowed")
		}
	}




	set_active_month(date:Date) {

		this.s.months = get_months(date, this.s.calcs_month_columns_count )
		this.s.months_display_str = this.s.months.map(m=> {
			let d = new Date(m)
			d.setUTCDate(d.getUTCDate()+2)
			return d.toLocaleString('default', { month: 'short' })
		})
	}




	set_active_month_from_offset(offset:number) {

		let clonedate:Date|null = null

		if  (offset < 0) {
			clonedate = this.s.months[this.s.months.length-1]
			clonedate.setUTCMonth(clonedate.getUTCMonth() + offset)
		} else {
			clonedate = this.s.months[this.s.months.length-1]
			clonedate.setUTCMonth(clonedate.getUTCMonth() + offset)
		}

		const year = clonedate.getUTCFullYear()
		const month = String(clonedate.getUTCMonth() + 1).padStart(2, '0')
		const yearMonthString = `${year}-${month}`
		
		$N.SwitchStation.GoTo(`finance/1234/s/quicktest/5432?enddate=${yearMonthString}&monthcount=${this.s.calcs_month_columns_count}&areaname=${this.s.filter.arearef?.name}`)
	}



	async set_split_mode(toggle:boolean, desired_split?:'catcalcs'|'transactions'|'both', fallback_if_both_cant_fit?:'catcalcs'|'transactions') {

		let split = desired_split || this.s.split_mode || 'both'

		if (toggle) {
			if (split === 'both') {
				split = 'catcalcs'
			} else if (split === 'catcalcs') {
				split = 'transactions'
			} else if (split === 'transactions') {
				split = 'both'
			}
		}

		this.s.split_mode = window.innerWidth < 768 && split === 'both' ? fallback_if_both_cant_fit || 'catcalcs' : split
	}




	filter_by_source(sourcename:string) {
		this.s.filter.sourceref = this.m.sources.find(source => source.name === sourcename) as SourceT
		this.parse_new_state()
		this.render()
	}




	filter_by_cattag(tags:number[]) {
		this.s.filter.cattags = tags
		this.parse_new_state()
		this.render()
	}




	filter_by_tag(tag:TagT) {
		this.s.filter.tagsref = [tag]
		this.parse_new_state()
		this.render()
	}




	sort_transactions_by(sort_by:string, sort_direction:string) {
		this.m.current_month_transactions = sort_transactions(this.m.current_month_transactions, sort_by, sort_direction)
		this.render()
	}




	transactionrow_clicked(e:MouseEvent) {
		const el = e.currentTarget as HTMLElement
		this.s.editview.transaction_id = el.dataset.id as string
		this.s.editview.show_ui = 1
		this.render()
	}




	calcmonth_clicked(e:MouseEvent) {
		const el = e.currentTarget as HTMLElement
		const month_i = Number(el.dataset.month_i)

		const offset = month_i - (this.s.months.length - 1)

		this.set_active_month_from_offset(offset)
	}




	calcamount__clicked(e:MouseEvent) {

		const el = e.currentTarget as HTMLElement
		const i  = Number(el.dataset.i)
		const ii = Number(el.dataset.ii || -1)

		let parentcat:CatT|null = null
		let cat:CatT|null       = null

		parentcat = this.m.catcalcs[i].catref
		cat = this.m.catcalcs[i].subsref![ii].catref

		if (this.s.filter.parentcatref === parentcat && this.s.filter.catref === cat) {
			parentcat = null
			cat = null
		}

		this.s.filter.parentcatref = parentcat
		this.s.filter.catref = cat

		this.set_split_mode(false, 'both', 'transactions')
		this.parse_new_state()
		this.render()
	}




	calccatname_clicked(e:MouseEvent) {

		const el = e.currentTarget as HTMLElement
		const i = Number(el.dataset.i)
		const ii = Number(el.dataset.ii || -1)

		const cat = this.m.catcalcs[i].subsref![ii].catref

		this.s.catsview.show_ui = 1
		this.s.catsview.mode = 'edit'
		this.s.catsview.editing_cat_id = cat.id

		this.render()
	}




	avgormed_clicked(_e:MouseEvent) {
		this.s.prefs.avgormed = this.s.prefs.avgormed === 1 ? 2 : 1
		this.render()
	}
		



	transaction_tag_clicked(e:MouseEvent) {

		const el = e.currentTarget as HTMLElement
		const tag = this.m.tags.find(t=> t.id === el.dataset.id) as TagT

		this.filter_by_tag(tag)

		e.stopPropagation()
	}




	tagsview_tag_clicked(e:MouseEvent) {

		const el = e.currentTarget as HTMLElement
		const tag = this.m.tags.find(t=> t.id === el.dataset.id) as TagT

		this.s.tagsview.show_ui = 2
			
		this.filter_by_tag(tag)
	}




	show_balances = () => { 
		this.s.balancesview.show_ui = 1
		this.render()
	}



	bucket_manage(_e: MouseEvent) { 
		this.s.bucketview_showui = 1
		this.render()
		setTimeout(()=> {
			const el = (this.shadow.querySelector('vp-finance-bucket') as any)
			el.showManageUI(this.m.areas.find(a=>a === this.s.filter.arearef)!, this.s.filter.cattags, this.s.cat_buckets, this.s.area_quad_bucket_totals)
			el.addEventListener('close', ()=> this.render({ bucketview_showui: 0 }))
		}, 30)
	}




	bucket_select(e: MouseEvent) {
		this.s.bucketview_showui = 1
		const el = e.currentTarget as HTMLElement; const catId = el.dataset.cat_id as string; const elId = el.id as string
		this.render()
		setTimeout(()=> {
			const el = (this.shadow.querySelector('vp-finance-bucket') as any)
			el.twoStepClicks(
				catId, 
				elId,
				this.m.areas.find(a=>a === this.s.filter.arearef)!, 
				this.m.cats, 
				this.m.transactions,
				this.s.filter.cattags,
				this.s.area_quad_bucket_totals
			);
			el.addEventListener('close', ()=> this.render({ bucketview_showui: 0 }))
		}, 30)
	}  




	show_snapshot() {
		this.s.snapshotview_showui = 1;
		this.render();
		setTimeout(()=> {
			const el = (this.shadow.querySelector('vp-finance-snapshot') as any)
			el.FleshItOut(this.m.areas, this.m.cats, this.m.transactions, this.m.previous_static_monthsnapshots, this.s.months)
			el.addEventListener('close', ()=> this.render({ snapshotview_showui: 0 }))
		}, 30)
	}




	async ynab_sync_categories() {

		const r = await $N.FetchLassie('/api/xen/finance/ynab_sync_categories')
		if (!r.ok) { alert("couldnt get ynab categories"); return }

		this.s.catsview.cats_with_deleteflag = (r.data as any).cats_with_deleteflag

		this.render()
	}




	async toggle_show_tags() {

		if (this.s.tagsview.show_ui === 1) {
			this.s.tagsview.show_ui = 2
			this.render()
			return
		}


		const filtered_tags = this.m.tags.filter((tag:any) => tag.arearef === this.s.filter.arearef)

		this.s.tagsview.tagtotals = filtered_tags.map(tag => {

			const t = this.m.transactions.filter(tr => tr.tagsref.find(t=> t.id === tag.id))
			const total = t.reduce((acc, tr) => acc + tr.amount, 0)

			return { id: tag.id, name: tag.name, sort: total, total }
		})

		this.s.tagsview.tagtotals.sort((a,b)=> b.sort - a.sort)

		this.s.tagsview.show_ui = 1

		this.render()
	}







	async set_calcs_month_columns_count(desired_count:number) {

		let count = desired_count;

		if (window.innerWidth < 768) {
			count = 3;
		}

		this.s.calcs_month_columns_count = count

		const thismonth = new Date()
		thismonth.setUTCDate(1)
		thismonth.setUTCHours(0, 0, 0, 0)
		this.set_active_month(thismonth)

		this.parse_new_state()
		this.render()
	}




async handle_touch_start(e:TouchEvent) {

    const target = e.touches[0].target as HTMLElement

    if (target.classList.contains('touch_month')) {
        this.s.touch.isactive = true
        this.s.touch.beginx = e.touches[0].clientX
        this.s.touch.beginy = e.touches[0].clientY
        this.s.touch.origin_action = 'month'
    }

    else if (target.classList.contains('touch_catquad')) {
        this.s.touch.isactive = true
        this.s.touch.beginx = e.touches[0].clientX
        this.s.touch.beginy = e.touches[0].clientY
        this.s.touch.origin_action = 'catquad'
    }

    else if (target.classList.contains('touch_avgmed')) {
        this.s.touch.isactive = true
        this.s.touch.beginx = e.touches[0].clientX
        this.s.touch.beginy = e.touches[0].clientY
        this.s.touch.origin_action = 'area'
    }

    else if (target.closest('.touch_switch_calcs_transactions')) {
        this.s.touch.isactive = true
        this.s.touch.beginx = e.touches[0].clientX
        this.s.touch.beginy = e.touches[0].clientY
        this.s.touch.origin_action = 'switch_calcs_transactions_view'
    }

    else {
        this.s.touch.isactive = false
    }
}

async handle_touch_end(e:TouchEvent) {
    
    if (this.s.touch.isactive) {

        this.s.touch.isactive = false

        const xdelta = e.changedTouches[0].clientX - this.s.touch.beginx
        const ydelta = e.changedTouches[0].clientY - this.s.touch.beginy

        if (Math.abs(xdelta) > 50 && Math.abs(xdelta) > Math.abs(ydelta)) {

            let is_direction_right = xdelta > 0 ? true : false

            if (this.s.touch.origin_action === 'month') {
				this.set_active_month_from_offset( is_direction_right ? -1 : 1 )
            }

            else if (this.s.touch.origin_action === 'catquad') {

                const cat_a_els = Array.from(this.shadow.querySelectorAll('#calcs .grid-header .col-cat > a')) as HTMLElement[]
                const cat_a_active_index = cat_a_els.findIndex(el => el.classList.contains('active'))

                if (is_direction_right && cat_a_active_index > 0 && cat_a_active_index < cat_a_els.length) {

                    const ary = cat_a_els[cat_a_active_index - 1].dataset.cattags?.split(',').map(Number) as number[]
                    this.s.filter.cattags = ary
                } 
                else if (!is_direction_right && cat_a_active_index < cat_a_els.length-1) {

                    const ary = cat_a_els[cat_a_active_index + 1].dataset.cattags?.split(',').map(Number) as number[]
                    this.s.filter.cattags = ary
                }

                this.parse_new_state()
                this.render()
            }

            else if (this.s.touch.origin_action === 'area') {

                if (localStorage.getItem("user_email") === 'rfs@risingtiger.com') {

                    if (this.s.filter.arearef?.name === 'fam' && !is_direction_right) 
                        this.set_area('pers')
                    else if (this.s.filter.arearef?.name === 'pers' && !is_direction_right) 
                        this.set_area('rtm')
                    else if (this.s.filter.arearef?.name === 'pers' && is_direction_right) 
                        this.set_area('fam')
                    else if (this.s.filter.arearef?.name === 'rtm' && is_direction_right) 
                        this.set_area('pers')
                }
            }

            else if (this.s.touch.origin_action === 'switch_calcs_transactions_view') {

                const elcalcs = this.shadow.querySelector('#calcs') as HTMLElement
                const eltransactions = this.shadow.querySelector('#transactions') as HTMLElement

                if (!is_direction_right) {
                    elcalcs.style.display = 'none'
                    eltransactions.style.display = 'block'
                    eltransactions.style.width = '100%'
                } else {
                    elcalcs.style.display = 'block'
                    elcalcs.style.width = '100%'
                    eltransactions.style.display = 'none'
                }
            }
        }
    }
}

async handle_touch_cancel(e:TouchEvent) {
    console.log("cancel")
    console.log("target, x, y", e.changedTouches[0].target, e.changedTouches[0].clientX, e.changedTouches[0].clientY)
}

async handle_touch_move(_e:TouchEvent) {
}




async handle_keydown(e:KeyboardEvent) {

	if (!e.ctrlKey) {
		return
	}

    if ( this.s.key.listen_for === KeyE.NONE) {

        if (e.key === 'h') {
			this.set_active_month_from_offset(-1)
        }

        else if (e.key === 'l') {
			this.set_active_month_from_offset(1)
        }

        else if (e.key === 'j') {
            // go down a row
        }

        else if (e.key === 'k') {
            // go up a row
        }

        else if (e.key === 'r') {
            document.location.reload()
        }

        else if (e.key === 't') {
            this.toggle_show_tags()
        }

        else if (e.key === 'p') {
            this.s.paymentsview.show_ui = this.s.paymentsview.show_ui === 1 ? 2 : 1
            this.render()
        }

        else if (e.key === 'c') {
            this.s.catsview.show_ui = this.s.catsview.show_ui === 1 ? 2 : 1
            this.render()
        }

		else if (e.key === 'b') {
			if (this.s.balancesview.show_ui === 0) {
				this.show_balances()
			} else {
				this.s.balancesview.show_ui = 0
				this.render()
			}
		}


        else if (e.key === 's') {
            this.s.sourcesview.show_ui = this.s.sourcesview.show_ui === 1 ? 2 : 1
            this.render()
        }

        else if (e.key === 'v') {
            this.set_split_mode(true)
            this.render()
        }

        else if (e.key === 'd') {
            this.download_csv();
        }

        else if (e.key === 'm') {
			this.s.key.listen_for = KeyE.MONTHS_COUNT
        }


        if (e.key === 'u') {
            this.set_area('fam')
        }
        if (e.key === 'i') {

            this.set_area('pers')
        }
        if (e.key === 'o') {
            this.set_area('rtm')
        }

        if (e.key === '1') {
            this.filter_by_cattag([1])
        }
        if (e.key === '2') {
            this.filter_by_cattag([2])
        }
        if (e.key === '3') {
            this.filter_by_cattag([3])
        }
        if (e.key === '`') {
            this.filter_by_cattag([1,2])
        }
    } 



    else if ( this.s.key.listen_for === KeyE.MONTHS_COUNT) {
		if (e.key === 's') {
			this.s.key.listen_for = KeyE.NONE
			this.set_calcs_month_columns_count(3)
		} else if (e.key === 'l') {
			this.s.key.listen_for = KeyE.NONE
			this.set_calcs_month_columns_count(12)
		}
    } 

    /*
    else if ( this.s.key.listen_for === KeyE.NONE && e.key === 'q') {
        this.s.key.listen_for = KeyE.LISTEN_FOR_QUADRANT
    } 
    */

        /*
    else if ( this.s.key.listen_for === KeyE.SOMEPRIMARYKEY_COMBO_TO_DRIVE_ACTION) {

    }
        */
}




	download_csv() {

		let s = ""

		const months = this.s.months.map(m=> m.getUTCFullYear() + "-" + (Number(m.getUTCMonth() + 1).toString().padStart(2,"0")) + "-01").join(",")
		
		s += "area,parent,cat," + months + ",costs,goal," + "\n"

		for (const c of this.m.catcalcs) {
			s += c.catref.arearef!.name + ","
			s += "1,",
			s += c.catref.name + ","
			s += c.sums.map(s=> Math.round(s)).join(",") + ","
			s += c.costs,
			s += c.goal + "\n"

			for (const cs of c.subsref!) {
				s += c.catref.arearef!.name + ","
				s += "0,",
				s += cs.catref.name + ","
				s += cs.sums.map(s=> Math.round(s)).join(",") + ","
				s += cs.costs,
				s += cs.costs + "\n"
			}
		}

		const blob = new Blob([s], {type: 'text/csv'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'transactions_catcalcs.csv'
		a.click()
		URL.revokeObjectURL(url)
	}




	download_transactions_to_csv = () => new Promise<void>(async (_res, _rej) => {

		const https = { headers: { 'Content-Type': 'text/csv' } }
		const csvstr = await $N.FetchLassie('/api/xen/finance/download_csv/transactions', https)
		if (!csvstr.ok) { alert("couldnt get transactions"); return }

		const blob = new Blob([csvstr.data as string], {type: 'text/csv'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'transactions.csv'
		a.click()
		URL.revokeObjectURL(url)
	})








	chat_about_transactions = (_p:PaymentT) => new Promise<void>((res:any, _rej:any) => {

		const chatWrapper = document.createElement('div');
		chatWrapper.style.position = 'absolute';
		chatWrapper.style.top = '50%';
		chatWrapper.style.left = '50%';
		chatWrapper.style.transform = 'translate(-50%, -50%)';
		chatWrapper.style.width = '80%';
		chatWrapper.style.maxWidth = '600px';
		chatWrapper.style.backgroundColor = '#fff';
		chatWrapper.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
		chatWrapper.style.borderRadius = '8px';
		chatWrapper.style.padding = '16px';
		chatWrapper.style.zIndex = '1000';
		
		// Create textarea for chat
		const chatTextarea = document.createElement('textarea');
		chatTextarea.style.width = '100%';
		chatTextarea.style.height = '300px';
		chatTextarea.style.padding = '8px';
		chatTextarea.style.border = '1px solid #ccc';
		chatTextarea.style.borderRadius = '4px';
		chatTextarea.style.resize = 'none';
		chatTextarea.style.marginBottom = '8px';
		chatTextarea.placeholder = 'Ask a question about this transaction...';
		
		// Create close button
		const closeButton = document.createElement('button');
		closeButton.textContent = 'Close';
		closeButton.style.padding = '8px 16px';
		closeButton.style.marginTop = '8px';
		closeButton.style.backgroundColor = '#f44336';
		closeButton.style.color = 'white';
		closeButton.style.border = 'none';
		closeButton.style.borderRadius = '4px';
		closeButton.style.cursor = 'pointer';
		
		// Add elements to wrapper
		chatWrapper.appendChild(chatTextarea);
		chatWrapper.appendChild(closeButton);
		
		// Add wrapper to content div
		const contentDiv = this.shadow.querySelector('.content');
		if (contentDiv) {
			contentDiv.appendChild(chatWrapper);
		}
		
		// Focus the textarea
		chatTextarea.focus();
		
		// Handle keyup event for Enter key
		chatTextarea.addEventListener('keyup', async (e) => {
			e.stopPropagation(); // Stop propagation to prevent other app components from responding
			
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				
				const question = chatTextarea.value.trim();
				if (question) {
					// Add a visual indicator that we're waiting for a response
					chatTextarea.value += '\n\nWaiting for response...\n';
					chatTextarea.scrollTop = chatTextarea.scrollHeight;
					
					const response = await $N.FetchLassie('/api/xen/finance/ai/chat_about_transactions', {
						method: 'POST',
						body: JSON.stringify({ question })
					});
					if (!response.ok) {   alert ("couldnt get response"); return;   }
					
					chatTextarea.value = chatTextarea.value.replace('\n\nWaiting for response...\n', '');
					
					if (response && ( response.data as any ).answer) {
						chatTextarea.value += '\n\n' + ( response.data as any ).answer;
						chatTextarea.scrollTop = chatTextarea.scrollHeight;
					} else {
						chatTextarea.value += '\n\nNo answer received from the server.';
						chatTextarea.scrollTop = chatTextarea.scrollHeight;
					}
				}
			}
		});
		
		closeButton.addEventListener('click', () => {
			if (contentDiv) {
				contentDiv.removeChild(chatWrapper);
			}
			res();
		});
	})



	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; };


}




customElements.define('v-finance', VFinance);








export {  }


