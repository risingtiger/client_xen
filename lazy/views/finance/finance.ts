


import { bool } from "../../../../definitions.js"

import { AreaT, CatT, TagT, SourceT, TransactionT, CatCalcsT, GroupCalcsT, FilterT } from '../../../finance_defs.js'
import { knit_all, get_months, filter_transactions, sort_transactions, current_month_of_filtered_transactions, catcalcs } from '../../libs/finance_funcs.js'
import './parts/bucket/bucket.js'

declare var Firestore:any
declare var Lit_Render: any;
declare var Lit_Html: any;
declare var SetDistCSS: any;




type State = {
    filter: FilterT,
    months: Date[],
    bucket_transfer: { fromcat: CatT|null, tocat: CatT|null, show_ui: 0|1|2 },
    transactiondetails: { show_ui: 0|1|2, t: TransactionT|null }
}




let distcss = `{--distcss--}`;




class VFinance extends HTMLElement {

s:State
shadow:ShadowRoot

m:{
    areas:AreaT[], 
    cats:CatT[], 
    tags:TagT[], 
    sources:SourceT[], 
    transactions:TransactionT[], 
    filtered_transactions:TransactionT[], 
    current_month_transactions:TransactionT[], 
    catcalcs:CatCalcsT[],
    groupcalcs: GroupCalcsT[]
}



constructor() {   

    super(); 

    this.s = {
        filter: { area: null, parentcat:null, cat: null, source: null, tags: null, daterange: null, merchant: null, note: null, amountrange: null },
        months: [],
        bucket_transfer: { fromcat: null, tocat: null, show_ui: 0 },        
        transactiondetails: { show_ui: 0, t: null }
    }

    this.m = {
        areas: [],
        cats: [],
        tags: [],
        sources: [],
        transactions: [],
        filtered_transactions: [],
        current_month_transactions: [],
        catcalcs: [],
        groupcalcs: [
            {
                name: "fokes",
                parentcats: ["personal","supplies"],
                subcats: ["family:laura","family:rent"],
                sums: []
            }
        ]
    }

    this.shadow = this.attachShadow({mode: 'open'});

    SetDistCSS(this.shadow, distcss)
}




async connectedCallback() {

    let res = await Firestore.Retrieve(['areas', 'cats', 'tags', 'sources', 'transactions']) 
    let k = knit_all(res[0], res[1], res[2], res[3], res[4])

    this.m.areas = k.areas
    this.m.cats = k.cats
    this.m.tags = k.tags
    this.m.sources = k.sources
    this.m.transactions = k.transactions

    this.s.filter.area = this.m.areas.find(area => area.name === "fam") as AreaT

    this.reset_except_area()
    
    this.parse_new_state()

    this.sc()

    this.dispatchEvent(new Event('hydrated'))
}




parse_new_state() {
    this.s.filter.daterange = [this.s.months[0], this.s.months[this.s.months.length-1]]
    this.m.filtered_transactions = filter_transactions(this.m.transactions, this.s.filter)
    this.m.current_month_transactions = current_month_of_filtered_transactions(this.m.filtered_transactions, this.s.months[this.s.months.length-1])
    this.m.catcalcs = catcalcs(this.m.current_month_transactions, this.s.filter.area as AreaT, this.m.cats, this.s.months)
    this.catcalc_custom_groups();
}




reset_except_area() {

    const thismonth = new Date()
    thismonth.setDate(1)
    thismonth.setHours(0, 0, 0, 0)

    this.s.months = get_months(thismonth, 3 )

    this.s.filter.parentcat = null; this.s.filter.cat = null; this.s.filter.source = null;
    this.s.filter.tags = null; this.s.filter.daterange = null; this.s.filter.merchant = null;
    this.s.filter.note = null; this.s.filter.amountrange = null;
}




set_area(areaname:string) {
    this.reset_except_area()
    this.s.filter.area = this.m.areas.find(area => area.name === areaname) as AreaT
    this.parse_new_state()
    this.sc()
}




filter_by_source(sourcename:string) {
    this.s.filter.source = this.m.sources.find(source => source.name === sourcename) as SourceT
    this.parse_new_state()
    this.sc()
}




sort_transactions_by(sort_by:string, sort_direction:string) {
    this.m.current_month_transactions = sort_transactions(this.m.current_month_transactions, sort_by, sort_direction)
    this.sc()
}




catcalc_custom_groups() {

    for(const customgroup of this.m.groupcalcs) {
        customgroup.sums = Array(this.s.months.length).fill(0)

        const customgroup_subcats = customgroup.subcats.map(sc => {
            let x = sc.split(":");
            return { parent: x[0], sub: x[1] }
        })

        for(const catcalc of this.m.catcalcs) {

            if (customgroup.parentcats.includes(catcalc.cat.name)) {
                for(let i=0; i<customgroup.sums.length; i++) {
                    customgroup.sums[i] += catcalc.sums[i]
                }
            }

            for(const customgroup_subcat of customgroup_subcats) {
                if (catcalc.cat.name === customgroup_subcat.parent) {
                    const catcalc_sub = catcalc.subs!.find(sub => sub.cat.name === customgroup_subcat.sub)

                    for(let i=0; i<customgroup.sums.length; i++) {
                        customgroup.sums[i] += catcalc_sub!.sums[i]
                    }
                }
            }

        }
    }
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

    this.s.months = get_months(this.s.months[month_i], 3)

    this.parse_new_state()

    this.sc()
}




calccat_clicked(e:MouseEvent) {
    const el = e.currentTarget as HTMLElement
    const i = Number(el.dataset.i)
    const ii = Number(el.dataset.ii || -1)

    if (ii === -1) {
        this.s.filter.parentcat = this.m.cats[i]
        this.s.filter.cat = null
    } else { 
        this.s.filter.cat = this.m.cats[i].subs![ii] as CatT
        this.s.filter.parentcat = null
    }

    this.parse_new_state()

    this.sc()
}




async bucket_amount_clicked(e:any) {

    const el = e.currentTarget!.closest("[data-catcalc_sub_index]")
    const cat_index = Number(el.dataset.catcalc_index)
    const subcat_index = Number(el.dataset.catcalc_sub_index)
    const cat = this.m.cats[cat_index].subs![subcat_index]

    let transfer_from_cat:CatT|null = null

    for(const c of this.m.cats) {
        const cat_ = c.subs?.find((c:any) => c.transfer_state === 1)
        if(cat_) { transfer_from_cat = cat_; break }
    }

    if (transfer_from_cat) {
        cat.transfer_state = 2
        this.s.bucket_transfer.tocat = cat
        this.s.bucket_transfer.show_ui = 1

    } else {
        cat.transfer_state = 1
        this.s.bucket_transfer.fromcat = cat
    }

    this.sc()
}




async bucket_saved(e:any) {

    this.s.bucket_transfer.fromcat!.bucket.val = e.detail.fromnewval
    this.s.bucket_transfer.tocat!.bucket.val = e.detail.tonewval

    this.sc()
}




async bucket_closed(_e:Event) {

    this.s.bucket_transfer.show_ui = 0; 

    this.sc();

    setTimeout(() => {
        this.s.bucket_transfer.fromcat!.transfer_state = 0
        this.s.bucket_transfer.tocat!.transfer_state = 0
        this.sc()
    }, 1000)
}




sc(state_changes = {}) {   

    this.s = Object.assign(this.s, state_changes);

    Lit_Render(this.template(this.s, this.m), this.shadow);
}




template = (_s:State, _m:any) => { return Lit_Html`{--devservercss--}{--html--}`; };


}




customElements.define('v-finance', VFinance);




export {  }


