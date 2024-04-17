

import { str } from "../../../../definitions.js"

import { AreaT, CatT, TagT, SourceT, TransactionT, CatCalcsT, TotalsT, SummaryT, FilterT } from '../../../finance_defs.js'
import { knit_all, get_months, filter_transactions, sort_transactions, current_month_of_filtered_transactions, catcalcs, totals, summary } from '../../libs/finance_funcs.js'

declare var FetchLassie:any
declare var Lit_Render: any;
declare var Lit_Html: any;
declare var Lit_Directive: any;
//declare var Lit_directive: any;
declare var Lit_noChange: any;
declare var SetDistCSS: any;




enum KeyE { NONE, LISTEN_FOR_AREA }
type State = {
    filter: FilterT,
    months: Date[],
    transactiondetails: { show_ui: 0|1|2, t: TransactionT|null },
    catsview: { show_ui: 0|1|2, cats_with_deleteflag: {id:str, name:string}[] },
    key: { listen_for: KeyE  },
    tempe_showui: AnimateioStateE,
    bumpe_showui: AnimateioStateE
}




enum AnimateioStateE  { PRELIM, INERT, NONE, HIDE, STEP1, STEP2 }
enum AnimateioStylesE { FADE, SLIDE, PULSE }

type AnimateioStyleT = {
    name: string,
    props: any[],
    opts: KeyframeEffectOptions
}

const animateio_styles:AnimateioStyleT[] = [
    {
        name: "fade",
        props: [
            {opacity: "0", transform: "scale(1) translate3d(0px, 0px, 0px)"},
            {opacity: "1", transform: "scale(2) translate3d(80px, 0px, 0px)"}
        ],
        opts: {
            duration: 420,
            easing: "cubic-bezier(.18,.24,.15,1)",
            fill: "both",
            iterations: 1,
        }
    },
    {
        name: "slide",
        props: [
            {transform: "scale(1)"},
            {transform: "scale(2)"},
        ],
        opts: {
            duration: 420,
            easing: "ease-in-out",
            fill: "both",
            iterations: 1,
        }
    },
    {
        name: "pulse",
        props: [
            {transform: "scale(1)"},
            {transform: "scale(0.3)"},
            {transform: "scale(1)"},
        ],
        opts: {
            duration: 420,
            easing: "ease-in-out",
            fill: "both",
            iterations: 1,
        }
    }
]



let distcss = `{--distcss--}`;


class Animateio extends Lit_Directive {

    state = AnimateioStateE.PRELIM;
    initial_state = AnimateioStateE.HIDE;
    animatehandle:any = null;
    element:HTMLElement = document.body;
    styleindex:AnimateioStylesE = AnimateioStylesE.FADE;
    keyframe_effects: KeyframeEffect;

    constructor(part: any) {
        super(part);
        this.element = part.element
        console.log("animateio constructor")

        this.element.style.display = "none"
        this.element.style.visibility = "invisible"
    }

    update(part: any, [new_state, styleindex]: any) {

        console.log("animateio update")

        if ( (this.state === AnimateioStateE.INERT && new_state <= AnimateioStateE.HIDE ) || new_state === this.state) {
            console.log("animateio none")
            return Lit_noChange;
        }


        if (this.state === AnimateioStateE.PRELIM) {

            console.log("prelim")
            this.state = AnimateioStateE.INERT
            this.initial_state = new_state

            if (this.initial_state === AnimateioStateE.NONE) {
                part.element.style.display = "none"
                part.element.style.visibility = "inherit"
            } else if (this.initial_state === AnimateioStateE.HIDE) {
                part.element.style.visibility = "hidden"
                part.element.style.display = "inherit"
            }

        } else if (this.state === AnimateioStateE.INERT) {

            console.log("inert")

            this.keyframe_effects = new KeyframeEffect(
                part.element,
                animateio_styles[styleindex].props,
                animateio_styles[styleindex].opts
            )

            this.animatehandle = new Animation(this.keyframe_effects, document.timeline);

            this.animatehandle.onfinish = this.finished.bind(this)

            this.state = this.initial_state
        }


        if (this.state === AnimateioStateE.HIDE && new_state > AnimateioStateE.HIDE) {
            console.log("show visibility")
            this.state = new_state
            part.element.style.visibility = "visible";
            this.startanim(this.animatehandle)

        } else if (this.state === AnimateioStateE.NONE && new_state > AnimateioStateE.HIDE) {
            console.log("show block")
            this.state = new_state
            part.element.style.display = "block";
            part.element.offsetHeight; // trigger reflow
            this.startanim(this.animatehandle)

        } else if (this.state == AnimateioStateE.STEP1 && ( new_state === AnimateioStateE.NONE || new_state === AnimateioStateE.HIDE ) ) {
            console.log("animate back")
            this.state = new_state
            this.animatehandle!.reverse()

        } else if (this.state == AnimateioStateE.STEP1 && new_state === AnimateioStateE.STEP2 ) {
            console.log("animate from step 1 to step 2")
            this.state = new_state
            this.animatehandle!.play()

        } else if (this.state == AnimateioStateE.STEP2 && new_state === AnimateioStateE.STEP1 ) {
            console.log("animate from step 2 to step 1")
            this.state = new_state
            this.animatehandle!.reverse()
        }

        return this.state;
    }


    startanim(animatehandle:Animation) {
        animatehandle.playbackRate = 1
        animatehandle.currentTime = 0
        animatehandle.play()
    }

    finished() {

        if(this.animatehandle.currentTime === 0) {
            console.log("finished animation back to start")
            if (this.state === AnimateioStateE.HIDE) {
                this.element.style.visibility = "hidden"
            } else if (this.state === AnimateioStateE.NONE) {
                this.element.style.display = "none"
            }
        }
    }
}

//const animateio = Lit_directive(Animateio);


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
    totals: TotalsT,
    summary: SummaryT,
}



constructor() {   

    super(); 

    this.s = {
        filter: { area: null, parentcat:null, cat: null, cattags: [1,2,3], source: null, tags: null, daterange: null, merchant: null, note: null, amountrange: null },
        months: [],
        transactiondetails: { show_ui: 0, t: null },
        catsview: { show_ui: 0, cats_with_deleteflag: [] },
        key: { listen_for: KeyE.NONE },
        tempe_showui: AnimateioStateE.NONE,
        bumpe_showui: AnimateioStateE.HIDE
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
        totals: { sums: [], budget: 0, med: 0, avg: 0 },
        summary: { bucketin: 0, bucket_budget_diff: 0, bucket_sum_diff: 0, savings: 0 }
    }

    this.shadow = this.attachShadow({mode: 'open'});

    SetDistCSS(this.shadow, distcss)
}




async connectedCallback() {

    await this.grabfresh()

    document.addEventListener('keydown', this.handle_keydown.bind(this))

    this.dispatchEvent(new Event('hydrated'))
}




disconnectedCallback() {
    document.removeEventListener('keydown', this.handle_keydown.bind(this))
}




grabfresh() { return new Promise(async (res,_rej)=> {

    let results = await FetchLassie('/api/xen/finance/grab_em')

    let k = knit_all(results.areas, results.cats, results.tags, results.sources, results.transactions)

    this.m.areas = k.areas
    this.m.cats = k.cats
    this.m.tags = k.tags
    this.m.sources = k.sources
    this.m.transactions = k.transactions

    if (this.s.filter.area === null) 
        this.s.filter.area = this.m.areas.find(area => area.name === 'fam') as AreaT

    this.set_default_except_area()
    
    this.parse_new_state()

    this.sc()

    res(1)
})}




parse_new_state() {
    this.s.filter.daterange = [this.s.months[0], this.s.months[this.s.months.length-1]]
    this.m.filtered_transactions = filter_transactions(this.m.transactions, this.s.filter)
    this.m.current_month_transactions = current_month_of_filtered_transactions(this.m.filtered_transactions, this.s.months[this.s.months.length-1])
    this.m.catcalcs = catcalcs(this.m.current_month_transactions, this.s.filter.area as AreaT, this.s.filter.cattags, this.m.cats, this.s.months)
    this.m.totals = totals(this.m.catcalcs, this.s.filter)
    this.m.summary = summary(this.m.totals, this.s.filter.area!)
}




set_default_except_area() {

    const thismonth = new Date()
    thismonth.setDate(1)
    thismonth.setHours(0, 0, 0, 0)

    this.s.months = get_months(thismonth, 3 )

    this.s.filter.parentcat = null; this.s.filter.cat = null; this.s.filter.source = null;
    this.s.filter.tags = null; this.s.filter.daterange = null; this.s.filter.merchant = null;
    this.s.filter.note = null; this.s.filter.amountrange = null;
    this.s.filter.cattags = [1,2,3]
}




set_area(areaname:string) {
    this.set_default_except_area()
    this.s.filter.area = this.m.areas.find(area => area.name === areaname) as AreaT
    this.parse_new_state()
    this.sc()
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




async ynab_sync_categories() {

    const r = await FetchLassie('/api/xen/finance/ynab_sync_categories')

    this.s.catsview.cats_with_deleteflag = r.cats_with_deleteflag

    this.sc()
}




async handle_keydown(e:KeyboardEvent) {

    if ( this.s.key.listen_for === KeyE.NONE && e.key === 'r') {
        this.set_default_except_area()
        this.parse_new_state()
        this.sc()
    } 

    else if ( this.s.key.listen_for === KeyE.NONE && e.key === 's') {
        this.grabfresh()
    }

    else if ( this.s.key.listen_for === KeyE.NONE && e.key === 'c') {
        this.s.catsview.show_ui = this.s.catsview.show_ui === 1 ? 2 : 1
        this.sc()
    }

    else if ( this.s.key.listen_for === KeyE.NONE && e.key === 'a') {
        this.s.key.listen_for = KeyE.LISTEN_FOR_AREA
    } 

    else if ( this.s.key.listen_for === KeyE.LISTEN_FOR_AREA) {

        if (e.key === '6') 
            this.set_area('fam')
        else if (e.key === '7')
            this.set_area('pers')
        else if (e.key === '8')
            this.set_area('rtm')
       
        this.s.key.listen_for = KeyE.NONE
    }
}



sc(state_changes = {}) {   

    this.s = Object.assign(this.s, state_changes);

    Lit_Render(this.template(this.s, this.m), this.shadow);
}




template = (_s:State, _m:any) => { return Lit_Html`{--devservercss--}{--html--}`; };


}




customElements.define('v-finance', VFinance);




export {  }


