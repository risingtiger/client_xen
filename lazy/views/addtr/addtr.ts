
type str = string; type bool = boolean; type int = number;   

import { AreaT, CatT, SourceT, TagT, RawTransactionT, TransactionT, FilterT } from '../../../finance_defs.js'
import { knit_areas, knit_cats, knit_sources, knit_tags } from '../../libs/finance_funcs.js'

declare var FetchLassie:any
declare var Firestore:any
declare var Lit_Render: any;
declare var Lit_Html: any;
declare var SetDistCSS: any;



enum InputModeE { Cat, Note, Amount }

type State = {
    newcount: int,
    rawtransactions: RawTransactionT[],
    focusedindex: number,
    transactionindex: int,
    splittotal: int,
    allow_split: bool,
    keyinput_mode: InputModeE
}




let distcss = `{--distcss--}`;




class VAddTr extends HTMLElement {

s:State
areas: AreaT[]
cats: CatT[]
sources: SourceT[]
tags: TagT[]
latest_raw_transactions: RawTransactionT[]
shadow:ShadowRoot




constructor() {   

    super(); 

    this.s = {
        newcount: 0,
        rawtransactions: [{ id: "", sourcename: "", long_desc: "", short_desc: "", amount: 0, ts: 0, note: ""}],
        focusedindex: 0,
        transactionindex: 0,
        splittotal: 0,
        allow_split: true,
        keyinput_mode: InputModeE.Cat
    }

    this.areas = []
    this.cats = []
    this.sources = []
    this.tags = []
    this.latest_raw_transactions = []

    this.shadow = this.attachShadow({mode: 'open'});

    SetDistCSS(this.shadow, distcss)
}




async connectedCallback() {

    const promises:any = []

    await this.sync_latest()

    const firestoredata = Firestore.Retrieve(["areas", "cats", "sources", "tags"])
    const latest = FetchLassie('/api/xen/finance/get_latest_raw_transactions')

    promises.push(firestoredata)
    promises.push(latest)

    const v = await Promise.all(promises)

    this.areas = knit_areas(v[0][0])
    this.cats = knit_cats(this.areas, v[0][1])
    this.sources = knit_sources(v[0][2])
    this.tags = knit_tags(v[0][3])

    if (localStorage.getItem("user_email") === 'accounts@risingtiger.com') {
        this.latest_raw_transactions = v[1] as RawTransactionT[]
    } else {
        this.latest_raw_transactions = v[1].filter((tr:RawTransactionT) => tr.sourcename === "barclay") as RawTransactionT[]
    }

    this.latest_raw_transactions.forEach((tr) => {
        tr.source = this.sources.find(source => source.name === tr.sourcename) as SourceT
    })

    if (this.latest_raw_transactions.length === 0) {
        alert ("no new transactions")
        return this.sc()
    }

    this.s.transactionindex = 0
    this.s.newcount = this.latest_raw_transactions.length
    this.process_next_transaction()

    if (localStorage.getItem("user_email") !== 'accounts@risingtiger.com') {
        this.cats = this.cats.filter(cat => cat.area.name === "fam")
    }

    const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement
    keycatcher_el.focus()
    keycatcher_el.addEventListener("keyup", this.keyup.bind(this))

    this.sc()

    this.dispatchEvent(new Event('hydrated'))
}




disconnectedCallback() {
    //
}




async sync_latest() { return new Promise(async (resolve, _reject) => {
    await FetchLassie('/api/xen/finance/sync_latest_gsheet', {})
    resolve(1)
})}




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

    const trs = this.s.rawtransactions

    const transaction_raw_id = trs[0].id
    
    const newtransactions:any[] = trs.map((tr) => {
        return {
            amount: Math.round(tr.amount * 100) / 100,
            catid: tr.cat?.id,
            merchant: tr.long_desc,
            notes: tr.note,
            sourceid: tr.source?.id,
            tagids: [],
            ts: tr.ts
        }
    })

    const body = {
        transaction_raw_id,
        newtransactions
    }

    await FetchLassie('/api/xen/finance/save_raw_transaction', {method:"POST", body:JSON.stringify(body) })

    if (this.s.transactionindex == this.latest_raw_transactions.length - 1) {
        alert("all transactions processed. DONE")
    }
    else {
        this.s.transactionindex++
        this.process_next_transaction()
    }
}
    



keyup(e:KeyboardEvent) {

    const keycatcher_el = this.shadow.querySelector("#keycatcher") as HTMLInputElement
    const val = keycatcher_el.value.toLowerCase()

    if (e.key === "Enter") {

        if (this.s.keyinput_mode === InputModeE.Cat) {

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

                    this.s.allow_split = false // only allow split before having chosen category. Must be first action after new raw transaction pops up

                    this.s.rawtransactions[this.s.focusedindex].cat = foundcat

                    if (this.s.rawtransactions.length > 1) {

                        this.s.keyinput_mode = InputModeE.Amount

                        if (this.s.focusedindex == this.s.rawtransactions.length - 1) {
                            keycatcher_el.value = this.s.splittotal.toFixed(2)
                        } else {
                            keycatcher_el.value = ""
                        }
                    }
                    else {
                        this.s.keyinput_mode = InputModeE.Note
                        keycatcher_el.value = ""
                    }

                    this.highlight_catnames_reset_all();
                    this.sc()
                    keycatcher_el.focus()
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

            if (this.s.focusedindex == this.s.rawtransactions.length - 1) {
                this.s.rawtransactions[this.s.focusedindex].amount = this.s.splittotal
                this.s.keyinput_mode = InputModeE.Note
                keycatcher_el.value = ""
                keycatcher_el.focus()
                this.sc()
            }

            const n = parseFloat(val)

            if (isNaN(n) || n === 0 || n > this.s.splittotal) {
                alert("split amount exceeded transaction amount or is invalid number")
                keycatcher_el.value = ""
                keycatcher_el.focus()
                return;
            }

            this.s.keyinput_mode = InputModeE.Note
            keycatcher_el.value = ""
            keycatcher_el.focus()
            this.s.rawtransactions[this.s.focusedindex].amount = n
            this.s.splittotal -= n
            this.sc()
        }

        else if (this.s.keyinput_mode === InputModeE.Note) {

            this.s.rawtransactions[this.s.focusedindex].note = val

            if (this.s.focusedindex === this.s.rawtransactions.length - 1) {
                keycatcher_el.value = ""
                keycatcher_el.focus()
                this.sc()

                this.save_focused_transaction_and_load_next()
            }

            else {
                this.s.focusedindex++
                this.s.keyinput_mode = InputModeE.Cat
                keycatcher_el.value = ""
                keycatcher_el.focus()
                this.sc()
            }
        }
    }

    else if (this.s.keyinput_mode === InputModeE.Cat) {

        if (e.key === "Backspace") {
            this.highlight_catnames_reset_all();
            keycatcher_el.value = ""
            keycatcher_el.focus()
        }

        else if (e.key === "@") {
            if (!this.s.allow_split) {
                alert("try to split fist, before choosing category")
                keycatcher_el.value = ""
                keycatcher_el.focus()
                this.highlight_catnames_reset_all();
                return;
            } 

            const xstr = JSON.stringify(this.s.rawtransactions[this.s.focusedindex])
            this.s.rawtransactions.push(JSON.parse(xstr))
            keycatcher_el.value = ""

            for(let i = 1; i < this.s.rawtransactions.length; i++) {
                this.s.rawtransactions[i].amount = 0
            }
            this.s.splittotal = this.s.rawtransactions[0].amount 

            this.sc()
        }

        else { 
            if (val.length > 1) {
                this.highlight_catnames(val)
            }
        }
    }

    else if (this.s.keyinput_mode === InputModeE.Amount) {
        // nothing
    }

    else if (this.s.keyinput_mode === InputModeE.Note) {
        // nothing
    }
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
}




reset_transaction() {
    location.reload()
}




sc() {
    Lit_Render(this.template(this.s, this.areas, this.cats, this.sources, this.tags), this.shadow);
}




template = (_s:any, _areas:any, _cats:any, _sources:any, _tags:any) => { return Lit_Html`{--devservercss--}{--html--}`; };

}




customElements.define('v-addtr', VAddTr);







export {  }

