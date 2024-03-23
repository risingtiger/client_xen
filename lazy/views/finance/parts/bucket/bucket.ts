

import { str } from "../../../../../../definitions.js"
import { CatT } from '../../../../../finance_defs'

declare var Firestore:any
declare var Lit_Render: any;
declare var Lit_Html: any;
declare var SetDistCSS: any;




type State = {
    fromcat: CatT|null,
    tocat: CatT|null,
    fromnewval: number,
    tonewval: number,
    fromcatdiffs: str[],
    tocatdiffs: str[],
    transfer_amount: number,
}



let distcss = `{--distcss--}`;




class VPFinanceBucket extends HTMLElement {

s:State
shadow:ShadowRoot




constructor() {   

    super(); 

    this.s = {
        fromcat: null,
        tocat: null,
        fromnewval: 0,
        tonewval: 0,
        fromcatdiffs: [],
        tocatdiffs: [],
        transfer_amount: 0,
    }

    this.shadow = this.attachShadow({mode: 'open'});

    SetDistCSS(this.shadow, distcss)
}




async connectedCallback() {

    let res = await Firestore.Retrieve(['cats']) 

    let cats = res[0]

    const fromid = this.getAttribute('cat_from')
    const toid = this.getAttribute('cat_to')

    this.s.fromcat = cats.find((cat:CatT) => cat.id == fromid)
    this.s.tocat = cats.find((cat:CatT) => cat.id == toid)

    this.s.fromnewval = this.s.fromcat!.bucket.val!
    this.s.tonewval = this.s.tocat!.bucket.val!

    const d = new Date()
    const one_month_ago = new Date(d.getFullYear(), d.getMonth()-1, 1)
    const two_months_ago = new Date(d.getFullYear(), d.getMonth()-2, 1)

    const d_short = d.toLocaleString('default', { month: 'short' })
    const one_month_ago_short = one_month_ago.toLocaleString('default', { month: 'short' })
    const two_months_ago_short = two_months_ago.toLocaleString('default', { month: 'short' })

    //this.s.fromcatdiffs = [`${two_months_ago_short} ${this.s.fromcat!.bucket.diffs![0]}`, `${one_month_ago_short} ${this.s.fromcat!.bucket.diffs![1]}`, `${d_short} ${this.s.fromcat!.bucket.diffs![2]}`]
    //this.s.tocatdiffs   = [`${two_months_ago_short} ${this.s.tocat!.bucket.diffs![0]}`, `${one_month_ago_short} ${this.s.tocat!.bucket.diffs![1]}`, `${d_short} ${this.s.tocat!.bucket.diffs![2]}`]

    this.s.fromcatdiffs = [`${this.s.fromcat!.bucket.diffs![0]} -- `, `${this.s.fromcat!.bucket.diffs![1]} -- `, `${this.s.fromcat!.bucket.diffs![2]}`]
    this.s.tocatdiffs   = [`${this.s.tocat!.bucket.diffs![0]} -- `, `${this.s.tocat!.bucket.diffs![1]} -- `, `${this.s.tocat!.bucket.diffs![2]}`]

    this.sc()
    this.dispatchEvent(new Event('hydrated'))
}




async rangechange(e:any) { 

    const val = e.target.value

    this.s.transfer_amount = Math.ceil(this.s.fromcat!.bucket.val! * val / 100)

    this.s.fromnewval = this.s.fromcat!.bucket.val! - this.s.transfer_amount
    this.s.tonewval = this.s.tocat!.bucket.val! + this.s.transfer_amount

    this.sc()
}




async save() {

    const frompath = "cats/"+this.s.fromcat!.id
    const topath   = "cats/"+this.s.tocat!.id

    const frombucket = this.s.fromcat!.bucket
    const tobucket   = this.s.tocat!.bucket

    frombucket.val = this.s.fromnewval
    tobucket.val   = this.s.tonewval

    frombucket.diffs![2] = frombucket.diffs![2] - this.s.transfer_amount
    tobucket.diffs![2]   = tobucket.diffs![2] + this.s.transfer_amount

    const rs = await Firestore.Patch([frompath, topath], [{ bucket: frombucket }, { bucket: tobucket }])

    this.dispatchEvent(new CustomEvent('saved', { 'detail': { fromnewval: this.s.fromnewval, tonewval: this.s.tonewval } }))

    setTimeout(() => { this.dispatchEvent(new Event('close')) }, 300)  
}




sc() {
    Lit_Render(this.template(this.s), this.shadow);
}




  template = (_s:State) => { return Lit_Html`{--devservercss--}{--html--}`; } 

}




customElements.define('vp-finance-bucket', VPFinanceBucket);




export {  }

