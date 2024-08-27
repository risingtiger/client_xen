





const dummyArea:AreaT = { id: "1", bucket:0, name: "", longname: "", ynab_savings: 0, ts: 0 }
//const dummyCat:CatT = { id: "1", area: dummyArea, budget: 0, name: "", parent: null, subs: null, tags: [], ts: 0, transfer_state: 0 }









import { str,int } from "../../../../definitions.js"

import { AreaT, CatT, SourceT, TagT, TransactionT, CatCalcsT, TotalsT, MonthSnapShotT, FilterT, PaymentT } from '../../../finance_defs.js'
import { knit_all, get_months, filter_transactions, sort_transactions, current_month_of_filtered_transactions, catcalcs, totals, monthsnapshot  } from '../../libs/finance_funcs.js'

declare var FetchLassie:any
declare var Lit_Render: any;
declare var Lit_Html: any;
declare var SetDistCSS: any;




enum KeyE { NONE }
type State = {
    filter: FilterT,
    months: Date[],
    transactiondetails: { show_ui: 0|1|2, t: TransactionT|null },
    catsview: { show_ui: 0|1|2, cats_with_deleteflag: {id:str, name:string}[] },
    paymentsview: { show_ui: 0|1|2 },
    tagsview: { show_ui: 0|1|2, tagtotals: {id:str, name:str, sort:int, total:number}[] },
    current_monthsnapshot: MonthSnapShotT,
    months_display_str: string[],
    touch: { isactive:boolean, beginx: number, beginy: number, origin_action:'month'|'catquad'|'area'|'switch_calcs_transactions_view'},
    key: { listen_for: KeyE  },
    prefs: { avgormed: 1|2 }
}




let distcss = `{--distcss--}`;




class VFinance extends HTMLElement {

s:State
shadow:ShadowRoot

m:{
    areas:AreaT[], 
    cats:CatT[], 
    sources:SourceT[], 
    tags: TagT[],
    transactions:TransactionT[], 
    previous_static_monthsnapshots:MonthSnapShotT[],
    filtered_transactions:TransactionT[], 
    current_month_transactions:TransactionT[], 
    catcalcs:CatCalcsT[],
    totals: TotalsT,
    payments: PaymentT[]
}



constructor() {   

    super(); 

    this.s = {
        filter: { area: null, parentcat: null, cat: null, source: null, tags: null, daterange: null, merchant: null, note: null, amountrange: null, cattags: [] },
        months: [],
        transactiondetails: { show_ui: 0, t: null },
        catsview: { show_ui: 0, cats_with_deleteflag: [] },
        paymentsview: { show_ui: 0 },
        tagsview: { show_ui: 0, tagtotals: []},
        current_monthsnapshot: { area: dummyArea, month: "", bucket: 0, budget: 0, savings: 0 },
        months_display_str: [],
        touch: { isactive: false, beginx: 0, beginy: 0, origin_action: 'month'},
        key: { listen_for: KeyE.NONE },
        prefs: { avgormed: 1 }
    }

    this.m = {
        areas: [],
        cats: [],
        sources: [],
        tags: [],
        transactions: [],
        previous_static_monthsnapshots: [],
        filtered_transactions: [],
        current_month_transactions: [],
        catcalcs: [],
        totals: { sums: [], budget: 0, med: 0, avg: 0 },
        payments: []
    }

    this.shadow = this.attachShadow({mode: 'open'});

    SetDistCSS(this.shadow, distcss)
}




async connectedCallback() {

    await this.grabfresh()

    const eltoattach = this.shadow.querySelector('.touchroot') as HTMLElement

    eltoattach.addEventListener("touchstart", this.handle_touch_start.bind(this));
    eltoattach.addEventListener("touchend", this.handle_touch_end.bind(this));
    eltoattach.addEventListener("touchcancel", this.handle_touch_cancel.bind(this));
    eltoattach.addEventListener("touchmove", this.handle_touch_move.bind(this));

    document.addEventListener('keydown', this.handle_keydown.bind(this))

    this.dispatchEvent(new Event('hydrated'))
}




disconnectedCallback() {

    const eltoattach = this.shadow.querySelector('.touchroot') as HTMLElement

    eltoattach.removeEventListener("touchstart", this.handle_touch_start.bind(this));
    eltoattach.removeEventListener("touchend", this.handle_touch_end.bind(this));
    eltoattach.removeEventListener("touchcancel", this.handle_touch_cancel.bind(this));
    eltoattach.removeEventListener("touchmove", this.handle_touch_move.bind(this));

    document.removeEventListener('keydown', this.handle_keydown.bind(this))
}




grabfresh() { return new Promise(async (res,_rej)=> {

    let results = await FetchLassie('/api/xen/finance/grab_em')

    let k = knit_all(results.areas, results.cats, results.sources, results.tags, results.transactions, results.previous_static_monthsnapshots)

    this.m.areas = k.areas
    this.m.cats = k.cats
    this.m.sources = k.sources
    this.m.tags = k.tags
    this.m.transactions = k.transactions
    this.m.previous_static_monthsnapshots = k.previous_static_monthsnapshots


    if (this.s.filter.area === null) 
        this.s.filter.area = this.m.areas.find(area => area.name === 'fam') as AreaT

    this.set_default_date()
    this.set_default_cattags()
    this.set_default_except_area_and_date_and_cattags()
    
    this.parse_new_state()

    this.m.payments = [
        {
            id: "1",
            payee: "Apple",
            type: "creditcard",
            cat: null,
            recurence: "monthly",
            day: 1,
            amount: 0,
            varies: true,
            is_auto: false,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "3",
            payee: "Chase",
            type: "creditcard",
            cat: null,
            recurence: "monthly",
            day: 1,
            amount: 0,
            varies: true,
            is_auto: false,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "6",
            payee: "Visa 36K",
            type: "creditcard",
            cat: null,
            recurence: "monthly",
            day: 30,
            amount: 0,
            varies: true,
            is_auto: false,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "7",
            payee: "Visa Family",
            type: "creditcard",
            cat: null,
            recurence: "monthly",
            day: 30,
            amount: 0,
            varies: true,
            is_auto: false,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "8",
            payee: "Paypal",
            type: "creditcard",
            cat: null, 
            recurence: "monthly",
            day: 8,
            amount: 0,
            varies: false,
            is_auto: true,
            payment_source: this.m.sources.find(source => source.name === "checkpers") as SourceT,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "9",
            payee: "Wells Fargo",
            type: "creditcard",
            cat: null, 
            recurence: "monthly",
            day: 18,
            amount: 200,
            varies: false,
            is_auto: true,
            payment_source: this.m.sources.find(source => source.name === "checkpers") as SourceT,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "9",
            payee: "Prime Store",
            type: "creditcard",
            cat: null, 
            recurence: "monthly",
            day: 25,
            amount: 0,
            varies: true,
            is_auto: false,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "5",
            payee: "Barclay",
            type: "creditcard",
            cat: null,
            recurence: "monthly",
            day: 20,
            amount: 0,
            varies: true,
            is_auto: false,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 

        {
            id: "20",
            payee: "4Runner",
            type: "carloan",
            cat: null,
            recurence: "monthly",
            day: 7,
            amount: 358,
            varies: false,
            is_auto: false,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "21",
            payee: "Subaru",
            type: "carloan",
            cat: null,
            recurence: "monthly",
            day: 9,
            amount: 375,
            varies: false,
            is_auto: false,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 


        {
            id: "25",
            payee: "Verizon",
            type: "bill",
            cat: null,
            recurence: "monthly",
            day: 1,
            amount: 116,
            varies: false,
            is_auto: true,
            payment_source: this.m.sources.find(source => source.name === "checkpers") as SourceT,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "26",
            payee: "South Central",
            type: "bill",
            cat: null,
            recurence: "monthly",
            day: 15,
            amount: 101,
            varies: false,
            is_auto: true,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "27",
            payee: "Garkane Electric",
            type: "bill",
            cat: null,
            recurence: "monthly",
            day: 14,
            amount: 200,
            varies: true,
            is_auto: true,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "28",
            payee: "Hildale Utilities",
            type: "bill",
            cat: null,
            recurence: "monthly",
            day: 1,
            amount: 60,
            varies: true,
            is_auto: true,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "29",
            payee: "House Rent",
            type: "bill",
            cat: null,
            recurence: "monthly",
            day: 1,
            amount: 1550,
            varies: false,
            is_auto: false,
            payment_source: null,
            breakdown: [],
            notes: ""
        }, 
        {
            id: "30",
            payee: "Aggregate on Apple Card",
            type: "bill",
            cat: null,
            recurence: "monthly",
            day: 1,
            amount: 102,
            varies: true,
            is_auto: true,
            payment_source: null,
            breakdown: [
                'GitHub Pro:4',
                'GitHub CoPilot:12',
                'Youtube:24',
                'iCloud:1',
                'Google Workspace:8',
                'Patreon:5',
                'Google Cloud:19',
                'InfluxDB:2',
                'ChatGPT:22',
            ],
            notes: ""
        }, 
    ]

    this.sc()

    res(1)
})}




reset() {
    this.set_default_cattags()
    this.set_default_date()
    this.set_default_except_area_and_date_and_cattags()
    this.parse_new_state()
    this.sc()
}




parse_new_state() {
    this.s.filter.daterange = [this.s.months[0], this.s.months[this.s.months.length-1]]
    this.m.filtered_transactions = filter_transactions(this.m.transactions, this.s.filter)
    this.m.current_month_transactions = current_month_of_filtered_transactions(this.m.filtered_transactions, this.s.months[this.s.months.length-1])
    this.m.catcalcs = catcalcs(this.m.filtered_transactions, this.s.filter.area as AreaT, this.s.filter.cattags, this.m.cats, this.s.months)
    this.m.totals = totals(this.m.catcalcs, this.s.filter)
 
    this.s.current_monthsnapshot = monthsnapshot(this.s.filter.daterange[1], this.s.filter.area!, this.m.cats, this.m.transactions, this.m.previous_static_monthsnapshots)

    this.m.current_month_transactions = sort_transactions(this.m.current_month_transactions, "ts", "desc")
}




set_default_cattags() {   this.s.filter.cattags = [1,2,3,4]   }




set_default_date() {

    const thismonth = new Date()
    thismonth.setUTCDate(1)
    thismonth.setUTCHours(0, 0, 0, 0)

    this.set_active_month(thismonth)
}




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

    this.s.months = get_months(date, 3 )
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
    this.s.transactiondetails.t = this.m.transactions.find(t => t.id === el.dataset.id) as TransactionT
    this.s.transactiondetails.show_ui = 1
    this.sc()
}
transactiondetails_close() { 
    this.s.transactiondetails.show_ui = 0
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




async ynab_sync_categories() {

    const r = await FetchLassie('/api/xen/finance/ynab_sync_categories')

    this.s.catsview.cats_with_deleteflag = r.cats_with_deleteflag

    this.sc()
}




async toggle_show_tags() {

    if (this.s.tagsview.show_ui === 1) {
        this.s.tagsview.show_ui = 2
        this.sc()
        return
    }


    const filtered_tags = this.m.tags.filter(tag => tag.area === this.s.filter.area)

    this.s.tagsview.tagtotals = filtered_tags.map(tag => {

        const t = this.m.transactions.filter(tr => tr.tags.find(t=> t.id === tag.id))
        const total = t.reduce((acc, tr) => acc + tr.amount, 0)

        return { id: tag.id, name: tag.name, sort: total, total }
    })

    this.s.tagsview.tagtotals.sort((a,b)=> b.sort - a.sort)

    this.s.tagsview.show_ui = 1

    this.sc()
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

async handle_touch_move(e:TouchEvent) {
}




async handle_keydown(e:KeyboardEvent) {

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
            this.reset()
        }

        else if (e.key === 's') {
            //this.grabfresh()
            document.location.reload()
        }

        else if (e.key === 't') {
            this.toggle_show_tags()
        }

        else if (e.key === 'c') {
            this.s.catsview.show_ui = this.s.catsview.show_ui === 1 ? 2 : 1
            this.sc()
        }

        else if (e.key === 'p') {
            this.s.paymentsview.show_ui = this.s.paymentsview.show_ui === 1 ? 2 : 1
            this.sc()
        }

        if (e.key === '6') {
            this.set_area('fam')
        }
        if (e.key === '7') {
            this.set_area('pers')
        }
        if (e.key === '8') {
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



    /*
    else if ( this.s.key.listen_for === KeyE.NONE && e.key === 'a') {
        this.s.key.listen_for = KeyE.LISTEN_FOR_AREA
    } 

    else if ( this.s.key.listen_for === KeyE.NONE && e.key === 'q') {
        this.s.key.listen_for = KeyE.LISTEN_FOR_QUADRANT
    } 
    */

        /*
    else if ( this.s.key.listen_for === KeyE.SOMEPRIMARYKEY_COMBO_TO_DRIVE_ACTION) {

    }
        */
}



sc(state_changes = {}) {   

    this.s = Object.assign(this.s, state_changes);

    Lit_Render(this.template(this.s, this.m), this.shadow);
}

payments_r(p:PaymentT) {

    return Lit_Html`
        <div class="payment ${p.breakdown.length ? 'hasbreakdown' : ''}" @click="${(e:any)=>{let el = e.currentTarget.querySelector('.notes'); el.style.display = el.style.display === 'block' ? 'none' : 'block';}}">
            <h4>${p.payee} ${p.notes ? '..' : ''}</h4>
            <p>
                ${ p.is_auto ? Lit_Html`<strong>A</strong>&nbsp;` : '' }
                ${ p.is_auto && p.payment_source && p.payment_source.name === 'checkpers' ? Lit_Html`<strong class="extra">B</strong>&nbsp;` : '' }
                ${p.day}&nbsp;
                ${p.amount ? "$"+p.amount : ''}
            </p>
            <p class="notes">${p.notes}</p>
            ${p.breakdown.length ? Lit_Html`
                <div class="breakdown">
                   ${p.breakdown.map(b=> Lit_Html`
                        <b>${b}</b>
                   `)}
                </div>
            ` : ''}
        </div>
    `
}



template = (_s:State, _m:any) => { return Lit_Html`{--devservercss--}{--html--}`; };


}




customElements.define('v-finance', VFinance);




export {  }


