



import { str, num } from "../../../defs_server_symlink.js"
import { $NT } from "../../../defs_client_symlink.js"
import { AreaT, CatT, SourceT, TagT, PaymentT, TransactionT, CatCalcsT, CatCalcsTotalsT, MonthSnapShotT, FilterT } from '../../../defs.js'

import { get_months  } from '../../libs/financefuncs/gen.js'
import { knit_all } from '../../libs/financefuncs/knit.js'
import { filter_transactions, sort_transactions, current_month_of_filtered_transactions  } from '../../libs/financefuncs/sortfilter.js'
import { catcalcs, catcalc_totals  } from '../../libs/financefuncs/catcalcs.js'
import { bucket_amount_remainder  } from '../../libs/financefuncs/bucket.js'

//import { knit_all, get_months, filter_transactions, sort_transactions, current_month_of_filtered_transactions, catcalcs, catcalc_totals, snapshots, snapshots_for_ui  } from '../../libs/finance_funcs.js'
import './parts/edit_transaction/edit_transaction.js'
import './parts/snapshot/snapshot.js'
import './parts/bucket/bucket.js'

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var $N: $NT;


const dummyArea:AreaT = { id: "1", bucket:0, bucketquad3:0, bucketquad4:0, bucketquad3_ref_ts:0, bucketquad4_ref_ts:0, name: "", longname: "", ynab_savings: 0, ts: 0 }
//const dummyCat:CatT = { id: "1", area: dummyArea, budget: 0, name: "", parent: null, subs: null, tags: [], ts: 0, transfer_state: 0 }


enum KeyE { NONE, MONTHS_COUNT }

type Model = {
	ynab_accounts:any[],
    areas:AreaT[], 
    cats:CatT[], 
    sources:SourceT[], 
    tags: TagT[],
    transactions:TransactionT[], 
    previous_static_monthsnapshots:MonthSnapShotT[],
    filtered_transactions:TransactionT[], 
    current_month_transactions:TransactionT[], 
    catcalcs:CatCalcsT[],
    catcalcstotals: CatCalcsTotalsT,
    payments: PaymentT[],
	data_to_sync: string[]
}

type State = {
	touch_attached: boolean,
    filter: FilterT,
    months: Date[],
    transactiondetails: { show_ui: 0|1|2, t: TransactionT|null },
    catsview: { show_ui: 0|1|2, cats_with_deleteflag: {id:str, name:string}[] },
    paymentsview: { show_ui: 0|1|2 },
    tagsview: { show_ui: 0|1|2, tagtotals: {id:str, name:str, sort:num, total:number}[] },
	editview: { show_ui: 0|1|2, transaction_id: str },
    bucketview: {                                                                                             
		show_ui: 0 | 1 | 2,                                                                                     
		propa: str,                                                                                             
		cat_from_id: string | null,                                                                             
		cat_from_name: string | null,                                                                           
		cat_to_id: string | null,                                                                               
		cat_to_name: string | null,                                                                             
	},
    current_monthsnapshot: MonthSnapShotT,
    months_display_str: string[],
    touch: { isactive:boolean, beginx: number, beginy: number, origin_action:'month'|'catquad'|'area'|'switch_calcs_transactions_view'},
    key: { listen_for: KeyE  },
    prefs: { avgormed: 1|2 },
	calcs_view_size: 'small'|'medium'|'large'
	howmany_months_toshow: number,
}





class VFinance extends HTMLElement {

	m:Model
	s:State
	shadow:ShadowRoot



	constructor() {   

		super(); 

		this.s = {
			touch_attached: false,
			filter: { area: null, parentcat: null, cat: null, source: null, tags: null, daterange: null, merchant: null, note: null, amountrange: null, cattags: [] },
			months: [],
			transactiondetails: { show_ui: 0, t: null },
			catsview: { show_ui: 0, cats_with_deleteflag: [] },
			paymentsview: { show_ui: 0 },
			tagsview: { show_ui: 0, tagtotals: []},
			editview: { show_ui: 0, transaction_id: '' },
			bucketview: { show_ui: 0, propa: '', cat_from_id: null, cat_from_name: null, cat_to_id: null, cat_to_name: null },
			current_monthsnapshot: { area: dummyArea, month: "", bucket: 0, savings: 0, quad1_budget: 0, quad2_budget: 0, quad3_budget: 0, quad4_budget: 0, quad1_spent: 0, quad2_spent: 0, quad3_spent: 0, quad4_spent: 0 },
			months_display_str: [],
			touch: { isactive: false, beginx: 0, beginy: 0, origin_action: 'month'},
			key: { listen_for: KeyE.NONE },
			prefs: { avgormed: 1 },
			calcs_view_size: 'small',
			howmany_months_toshow: 0, // will be set later
		}

		this.m = {
			ynab_accounts: [],
			areas: [],
			cats: [],
			sources: [],
			tags: [],
			transactions: [],
			previous_static_monthsnapshots: [],
			filtered_transactions: [],
			current_month_transactions: [],
			catcalcs: [],
			catcalcstotals: { sums: [], budget: 0, med: 0, avg: 0 },
			payments: [], 
			data_to_sync: ["areas", "cats", "sources", "tags", "payments", "transactions", "monthsnapshots"]
		}

		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {

		this.setAttribute("backhash", "home")

		this.set_calcs_view_size('medium') // keep in mind, will be downgraded to small if window screen is small (aka phone)

		const thismonth = new Date()
		thismonth.setUTCDate(1)
		thismonth.setUTCHours(0, 0, 0, 0)

		this.set_active_month(thismonth)
		this.set_default_cattags()
		this.set_default_except_area_and_date_and_cattags()


		$N.DataSync.Subscribe(this, this.m.data_to_sync, ()=> this.handledata())
		$N.FetchLassie('/api/xen/finance/grab_em').then((data:any)=> {   this.m.ynab_accounts = data.ynab_accounts;   })
	}




	async handledata() {

		console.time("indexeddb getall finance data")
		const idata = await $N.IndexedDB.GetAll(this.m.data_to_sync)
		console.timeEnd("indexeddb getall finance data")

		checkit.bind(this)()
		

		function checkit() {

			if (this.m.ynab_accounts.length) {

				this.runit(idata)

				this.dispatchEvent(new Event('hydrated'))

				const eltoattach = this.shadow.querySelector('.touchroot') as HTMLElement

				if (!this.s.touch_attached) {
					eltoattach.addEventListener("touchstart", this.handle_touch_start.bind(this));
					eltoattach.addEventListener("touchend", this.handle_touch_end.bind(this));
					eltoattach.addEventListener("touchcancel", this.handle_touch_cancel.bind(this));
					eltoattach.addEventListener("touchmove", this.handle_touch_move.bind(this));

					document.addEventListener('keydown', this.handle_keydown.bind(this))

					this.s.touch_attached = true
				}

			} else {
				setTimeout(checkit.bind(this), 10)
			}
		}
	}



	disconnectedCallback() {

		const eltoattach = this.shadow.querySelector('.touchroot') as HTMLElement

		eltoattach.removeEventListener("touchstart", this.handle_touch_start.bind(this));
		eltoattach.removeEventListener("touchend", this.handle_touch_end.bind(this));
		eltoattach.removeEventListener("touchcancel", this.handle_touch_cancel.bind(this));
		eltoattach.removeEventListener("touchmove", this.handle_touch_move.bind(this));

		document.removeEventListener('keydown', this.handle_keydown.bind(this))
	}




	runit(data:any) {

		data.get("areas").forEach((m:any)=> { // loop through areas
			const ynab_account = this.m.ynab_accounts.find((n:any)=> n.id === m.ynab_savings_id)
			m.ynab_savings = ynab_account.balance / 1000
		})

		let k = knit_all(data.get("areas"), data.get("cats"), data.get("sources"), data.get("tags"), data.get("payments"), data.get("transactions"), data.get("monthsnapshots"))

		this.m.areas = k.areas
		this.m.cats = k.cats
		this.m.sources = k.sources
		this.m.tags = k.tags
		this.m.payments = k.payments
		this.m.transactions = k.transactions
		this.m.previous_static_monthsnapshots = k.previous_static_monthsnapshots
		
		this.s.filter.area = this.m.areas.find(area => area.name === 'fam') as AreaT

		this.parse_new_state()
		this.sc()
	}




	reset() {
		document.location.reload()
	}




	parse_new_state() {
		this.s.filter.daterange = [this.s.months[0], this.s.months[this.s.months.length-1]]
		this.m.filtered_transactions = filter_transactions(this.m.transactions, this.s.filter)
		this.m.current_month_transactions = current_month_of_filtered_transactions(this.m.filtered_transactions, this.s.months[this.s.months.length-1])
		this.m.catcalcs = catcalcs(this.m.filtered_transactions, this.s.filter.area as AreaT, this.s.filter.cattags, this.m.cats, this.s.months)
		this.m.catcalcstotals = catcalc_totals(this.m.catcalcs, this.s.filter)

		this.m.current_month_transactions = sort_transactions(this.m.current_month_transactions, "date", "asc")

		const x = bucket_amount_remainder(this.m.areas.find(a=>a.name === this.s.filter.area?.name)!, this.m.cats, 3, this.m.transactions)
		console.log(x)
	}




	set_default_cattags() {   this.s.filter.cattags = [1,2,3,4]   }




	set_default_except_area_and_date_and_cattags() {

		this.s.filter.parentcat = null; this.s.filter.cat = null; this.s.filter.source = null;
		this.s.filter.tags = null; this.s.filter.merchant = null;
		this.s.filter.note = null; this.s.filter.amountrange = null;
	}




	set_area(areaname:string) {

		if(localStorage.getItem("auth_group") === 'admin') {
			this.s.filter.area = this.m.areas.find(area => area.name === areaname) as AreaT
			this.set_default_except_area_and_date_and_cattags()
			this.parse_new_state()
			this.sc()
		} else {
			console.log("not allowed")
		}
	}




	set_active_month(date:Date) {

		this.s.months = get_months(date, this.s.howmany_months_toshow )
		this.s.months_display_str = this.s.months.map(m=> {
			let d = new Date(m)
			d.setUTCDate(d.getUTCDate()+2)
			return d.toLocaleString('default', { month: 'short' })
		})
	}




	filter_by_source(sourcename:string) {
		this.s.filter.source = this.m.sources.find(source => source.name === sourcename) as SourceT
		this.parse_new_state()
		this.sc()
	}




	filter_by_cattag(tags:number[]) {
		this.s.filter.cattags = tags
		this.parse_new_state()
		this.sc()
	}




	filter_by_tag(tag:TagT) {
		this.s.filter.tags = [tag]
		this.parse_new_state()
		this.sc()
	}




	sort_transactions_by(sort_by:string, sort_direction:string) {
		this.m.current_month_transactions = sort_transactions(this.m.current_month_transactions, sort_by, sort_direction)
		this.sc()
	}




	transactionrow_clicked(e:MouseEvent) {
		const el = e.currentTarget as HTMLElement
		this.s.editview.transaction_id = el.dataset.id as string
		this.s.editview.show_ui = 1
		this.sc()
	}




	calcmonth_clicked(e:MouseEvent) {

		const el = e.currentTarget as HTMLElement
		const month_i = Number(el.dataset.month_i)

		if (month_i === 2) {
			return
		}

		const offset = this.s.months.length - 1 - month_i

		const clonedate = this.s.months[this.s.months.length-1]
		clonedate.setUTCMonth(clonedate.getUTCMonth() - offset)

		this.set_active_month(clonedate)

		this.parse_new_state()
		this.sc()
	}




	calccat_clicked(e:MouseEvent) {

		const el = e.currentTarget as HTMLElement
		const i = Number(el.dataset.i)
		const ii = Number(el.dataset.ii || -1)

		let parentcat:CatT|null = null
		let cat:CatT|null       = null

		if (ii !== -1) {
			parentcat = this.m.catcalcs[i].cat
			cat = this.m.catcalcs[i].subs![ii].cat

			if (this.s.filter.parentcat === parentcat && this.s.filter.cat === cat) {
				parentcat = null
				cat = null
			}

		} else { 
			cat = null
			parentcat = this.m.catcalcs[i].cat

			if (this.s.filter.parentcat === parentcat) {
				parentcat = null
				cat = null
			}
		}

		this.s.filter.parentcat = parentcat
		this.s.filter.cat = cat

		this.parse_new_state()

		this.sc()
	}




	avgormed_clicked(_e:MouseEvent) {
		this.s.prefs.avgormed = this.s.prefs.avgormed === 1 ? 2 : 1
		this.sc()
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




	bucket_select(e: MouseEvent) {

		if (this.s.bucketview.cat_to_id !== null) {
			this.s.bucketview.cat_from_id = null;                                                                      
			this.s.bucketview.cat_from_name = null;                                                                    
			this.s.bucketview.cat_to_id = null;                                                                        
			this.s.bucketview.cat_to_name = null;                                                                      
		}

		const el = e.currentTarget as HTMLElement;                                                                   
		const cat_id = el.dataset.id as string;                                                                      
		const cat = this.m.cats.flatMap(c => c.subs ? c.subs : []).find(c => c.id === cat_id);

		if (!cat) return;

		if (!this.s.bucketview.cat_from_id) {                                                                        
			this.s.bucketview.cat_from_id = cat.id;                                                                    
			this.s.bucketview.cat_from_name = cat.name;                                                                

			el.classList.add('selected');                                                                              

		} else if (!this.s.bucketview.cat_to_id && cat.id !== this.s.bucketview.cat_from_id) {                       

			this.s.bucketview.cat_to_id = cat.id;                                                                      
			this.s.bucketview.cat_to_name = cat.name;                                                                  

            const cat_from_bucket_available = this.compute_bucket_available(this.s.bucketview.cat_from_id);
            const cat_to_bucket_available = this.compute_bucket_available(this.s.bucketview.cat_to_id);

            const vpFinanceBucketEl = this.shadow.querySelector('vp-finance-bucket') as any;
            if (vpFinanceBucketEl && typeof vpFinanceBucketEl.show_selector === 'function') {
                vpFinanceBucketEl.show_selector(
                    this.s.bucketview.cat_from_id,
                    this.s.bucketview.cat_from_name,
                    cat_from_bucket_available,
                    this.s.bucketview.cat_to_id,
                    this.s.bucketview.cat_to_name,
                    cat_to_bucket_available
                );
            }

            const prevSelected = this.shadow.querySelector('#calcs td.bucket.transferable.selected');                         
            if (prevSelected) {                                                                                        
                prevSelected.classList.remove('selected');                                                               
            }
		}

		this.sc();                                                                                                   
	}  




	show_snapshot() {
		(this.shadow.querySelector('vp-finance-snapshot') as any).FleshItOut(this.m.areas, this.m.cats, this.m.transactions, this.m.previous_static_monthsnapshots, this.s.months)
	}




	async ynab_sync_categories() {

		const r = await $N.FetchLassie('/api/xen/finance/ynab_sync_categories')

		this.s.catsview.cats_with_deleteflag = r.cats_with_deleteflag

		this.sc()
	}




	async toggle_show_tags() {

		if (this.s.tagsview.show_ui === 1) {
			this.s.tagsview.show_ui = 2
			this.sc()
			return
		}


		const filtered_tags = this.m.tags.filter((tag:any) => tag.area === this.s.filter.area)

		this.s.tagsview.tagtotals = filtered_tags.map(tag => {

			const t = this.m.transactions.filter(tr => tr.tags.find(t=> t.id === tag.id))
			const total = t.reduce((acc, tr) => acc + tr.amount, 0)

			return { id: tag.id, name: tag.name, sort: total, total }
		})

		this.s.tagsview.tagtotals.sort((a,b)=> b.sort - a.sort)

		this.s.tagsview.show_ui = 1

		this.sc()
	}




	async set_calcs_view_size(size:'small'|'medium'|'large') {

		if (window.innerWidth < 768)
			size = 'small'

		if (window.innerWidth < 1024) {
			size = size === 'small' ? 'small' : 'medium'
		}

		this.s.howmany_months_toshow = size === 'small' ? 3 : size === 'medium' ? 6 : 12
		this.s.calcs_view_size = size	
	}




	async set_calcs_view_size_from_ui(size:'small'|'medium'|'large') {
		this.set_calcs_view_size(size)

		const thismonth = new Date()
		thismonth.setUTCDate(1)
		thismonth.setUTCHours(0, 0, 0, 0)
		this.set_active_month(thismonth)

		this.parse_new_state()
		this.sc()
	}




   compute_bucket_available(cat_id: string): number {
       const cat = this.m.cats.flatMap(c => c.subs || []).find(c => c.id === cat_id);
       if (!cat) return 0;
        
       // Placeholder value for bucket available
       const bucketAvailable = 1000; // Replace this with actual computation logic
       return bucketAvailable;
   }

async handle_touch_start(e:TouchEvent) {

    console.log("start")

    const target = e.touches[0].target as HTMLElement

    console.log(target)

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

    else if (target.classList.contains('touch_area')) {
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
                const clonedate = this.s.months[this.s.months.length-1]
                clonedate.setUTCMonth(clonedate.getUTCMonth() + (is_direction_right ? -1 : 1))
                this.set_active_month(clonedate)
                this.parse_new_state()
                this.sc()
            }

            else if (this.s.touch.origin_action === 'catquad') {

                const cat_a_els = Array.from(this.shadow.querySelectorAll('th.cat > a')) as HTMLElement[]
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
                this.sc()
            }

            else if (this.s.touch.origin_action === 'area') {

                if (localStorage.getItem("auth_group") === 'admin') {

                    if (this.s.filter.area?.name === 'fam' && !is_direction_right) 
                        this.set_area('pers')
                    else if (this.s.filter.area?.name === 'pers' && !is_direction_right) 
                        this.set_area('rtm')
                    else if (this.s.filter.area?.name === 'pers' && is_direction_right) 
                        this.set_area('fam')
                    else if (this.s.filter.area?.name === 'rtm' && is_direction_right) 
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

	if (this.shadow.querySelector('.content + c-ol[title="Transaction Details"]')) {
		return
	}


    if ( this.s.key.listen_for === KeyE.NONE) {

        if (e.key === 'h') {
            const clonedate = this.s.months[this.s.months.length-1]
            clonedate.setUTCMonth(clonedate.getUTCMonth() - 1)
            this.set_active_month(clonedate)
            this.parse_new_state()
            this.sc()
        }

        else if (e.key === 'l') {
            const clonedate = this.s.months[this.s.months.length-1]
            clonedate.setUTCMonth(clonedate.getUTCMonth() + 1)
            this.set_active_month(clonedate)
            this.parse_new_state()
            this.sc()
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

        else if (e.key === 'b') {
            this.s.paymentsview.show_ui = this.s.paymentsview.show_ui === 1 ? 2 : 1
            this.sc()
        }

        else if (e.key === 'c') {
            this.s.catsview.show_ui = this.s.catsview.show_ui === 1 ? 2 : 1
            this.sc()
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

        if (e.key === '`') {
            this.filter_by_cattag([1,2,3])
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
        if (e.key === '4') {
            this.filter_by_cattag([4])
        }
        if (e.key === '`') {
            this.filter_by_cattag([1,2,3])
        }
        if (e.key === '5') {
            this.filter_by_cattag([1,2,3,4])
        }
    } 



    else if ( this.s.key.listen_for === KeyE.MONTHS_COUNT) {
		if (e.key === 's') {
			this.s.key.listen_for = KeyE.NONE
			this.set_calcs_view_size_from_ui('small')
		} else if (e.key === 'm') {
			this.s.key.listen_for = KeyE.NONE
			this.set_calcs_view_size_from_ui('medium')
		} else if (e.key === 'l') {
			this.s.key.listen_for = KeyE.NONE
			this.set_calcs_view_size_from_ui('large')
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
		
		s += "area,parent,cat," + months + ",budget," + "\n"

		for (const c of this.m.catcalcs) {
			s += c.cat.area.name + ","
			s += "1,",
			s += c.cat.name + ","
			s += c.sums.map(s=> Math.round(s)).join(",") + ","
			s += c.budget + "\n"

			for (const cs of c.subs!) {
				s += c.cat.area.name + ","
				s += "0,",
				s += cs.cat.name + ","
				s += cs.sums.map(s=> Math.round(s)).join(",") + ","
				s += cs.budget + "\n"
			}
		}

		const blob = new Blob([s], {type: 'text/csv'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'transactions.csv'
		a.click()
		URL.revokeObjectURL(url)
	}



	sc(state_changes = {}) {   

		this.s = Object.assign(this.s, state_changes);

		Lit_Render(this.template(this.s, this.m), this.shadow);
	}

	payments_r(p:PaymentT) {

		let breakdown = p.breakdown.map(b=> {
			let s = b.split(":")
			return {name:s[0], date:s[1], amount:s[2]}
		})

		return Lit_Html`
			<div class="payment ${p.breakdown.length ? 'hasbreakdown' : ''}" @click="${(e:any)=>{let el = e.currentTarget.querySelector('.notes'); el.style.display = el.style.display === 'block' ? 'none' : 'block';}}">
				<h4>${p.payee} ${p.notes ? '..' : ''}</h4>
				<p>
					${ p.is_auto ? Lit_Html`<strong>A</strong>&nbsp;` : '' }
					${ p.is_auto && p.source && p.source.name === 'checkpers' ? Lit_Html`<strong class="extra">B</strong>&nbsp;` : '' }
					${p.day}&nbsp;
					${p.amount ? "$"+p.amount : ''}
				</p>
				<p class="notes">${p.notes}</p>
				${breakdown ? Lit_Html`
					<div class="breakdown">
					   ${breakdown.map(b=> Lit_Html`
							<div class="item">
								<h6>${b.name}</h6>
								<p>${b.date} &nbsp; $${b.amount}</p>	
							</div>
					   `)}
					</div>
				` : ''}
			</div>
		`
	}



	template = (_s:State, _m:any) => { return Lit_Html`{--css--}{--html--}`; };


}




customElements.define('v-finance', VFinance);




export {  }


