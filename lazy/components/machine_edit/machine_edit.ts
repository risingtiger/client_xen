

type str = string;   
type int = number;   
//type bool = boolean;


import { MachineT } from "../../../definitions_xtend.js"
declare var Lit_Render: any;
declare var Lit_Html: any;




type State = {
  savingState: int, 
}




class CMachineEdit extends HTMLElement {

  $:any
  s:State
  machine!:MachineT




    constructor() {   

        super(); 

        this.$ = this.querySelector

        this.s = {
            savingState: 0
        } 
        this.machine
    }




    async connectedCallback() {   

        this.s.savingState = 0

        const results = await (window as any).Firestore.Retrieve(`machines/${this.getAttribute("machine")}`)

        this.machine = results[0];

        this.stateChanged()

        this.dispatchEvent(new Event('hydrated'))
    }




async Save() {

    const formel = this.querySelector("form[name='machineedit']") as HTMLFormElement

    const { mchId, state, store, incrs, errmsg } = verify_and_correct_input_local(formel.elements) 

    if (errmsg) { 
        alert(errmsg)
        return false
    }

    this.s.savingState = 1
    this.stateChanged()

    const qr = await (window as any).Firestore.Patch(`machines/${this.machine.id}`, ["mchId", "state.active", "store", "incrs"], { mchId, state, store, incrs })
    const tr = new Promise(r=> setTimeout((_:any)=> r(1), 1000))
    await Promise.all([qr, tr])

    this.s.savingState = 2
    this.stateChanged()

    setTimeout((_:any)=> { 
        this.dispatchEvent(new Event('closing'))

    }, 1400)

}




  stateChanged() {

    Lit_Render(this.template(this.s, this.machine), this);

  }




  template = (_s:State, _machine:MachineT) => { return Lit_Html`{--htmlcss--}`; } 

}


customElements.define('c-machine-edit', CMachineEdit);




function verify_and_correct_input_local(els:any) : any {

  let flag = false
  let errmsg = "\n"

  let mchId                 = els.mchid.value
  let state                 = { active: els.isactive.checked }
  let store                 = { id: els.storeid.value, name:els.storename.value }
  let incrs                 = ["store", "pure1", "min1", "pure2", "min2"].map(m=> Number(els["incrs_"+m].value))

  if (mchId.trim().length !== 4 || !(/^[0-9]+$/.test(mchId)) ) { 
    errmsg += ("machine id should contain only numeric characters and should be 4 in length\n")
    flag = true
  }

  if (store.id.length !== 4 || !(/^[0-9]+$/.test(store.id))) {
    errmsg += ("store id should be a number and should be 4 in length\n")
    flag = true
  }

  if (store.name.trim().length === 0 || store.id.length > 30 || (store.name.search(/[^A-Za-z0-9_ ]+/) !== -1) ) {
    errmsg += ("store name should be no longer than 20 characters. And should only contain A-Z or a-z\n")
    flag = true
  } else {
    store.name = store.name.trim()
  }

  incrs.forEach((n:int) => {
    if ( isNaN(n) || !(n === 1 || n === 10 ) ) {
      errmsg += ("gallon increment should be 1 or 10\n")
      flag = true
    }    
  })

  return { mchId, state, store, incrs, errmsg: (flag ? errmsg : "") }

}


