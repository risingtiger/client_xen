

import { MachineT } from "../../../definitions_xtend.js"
declare var Lit_Render: any;
declare var Lit_Html: any;
declare var Firestore_Live: any;

type str = string;   //type int = number;   //type bool = boolean;




type State = {
  sortby: str,
  filterby: Map<str, str>
}




class VMachines extends HTMLElement {
    s:State
    machines:Array<MachineT>
    filtered_sorted_machines:Array<MachineT>




  constructor() {   

    super()

    let filterbymap = new Map<str, str>([["storename", ""], ["storeid", ""], ["mchId", ""], ["chip", ""], ["serial", ""]])

    let hstack = JSON.parse(localStorage.getItem("hstack")!) as Array<str>
    let fbstr = localStorage.getItem("filterby")!

    if (hstack[hstack.length-1].includes('machine/')   &&   (fbstr && fbstr != "" && fbstr != "{}" && fbstr != "[]")) {
      filterbymap = new Map<str, str>(JSON.parse(fbstr))
    }
    else {
      localStorage.setItem("filterby", "[]")
    }

    this.machines = []
    this.filtered_sorted_machines = []
    this.s = {sortby:"state", filterby: filterbymap}

  }




    async connectedCallback() {   

        const fl = await Firestore_Live.Subscribe(this, "machines")

        this.runit(fl.initialdata[0])

        this.dispatchEvent(new Event('hydrated'))

        fl.ondata((results:any)=> this.runit(results[0]))
    }




    disconnectedCallback() {
        console.log("must put in a custom lint rule to enforce Firestore_Live.Unsubscribe in view/components")
        Firestore_Live.Unsubscribe(this)
    }




    stateChanged() {

        Lit_Render(this.template(this.s, this.filtered_sorted_machines), this);
    }

    


    runit(machines:MachineT[]) {

        this.machines = machines

        add_aux_data_to_machines(machines)

        const filtered_machines = get_filtered_machines(this.s.filterby, machines)

        this.filtered_sorted_machines = get_sorted_machines(this.s.sortby, filtered_machines)

        this.stateChanged()
    }




    FilterKeyUp(e:KeyboardEvent) {

        this.s.filterby = set_filterby(e.currentTarget as HTMLFormElement, e.key, this.s.filterby)

        const filtered_machines = get_filtered_machines(this.s.filterby, this.machines)
        this.filtered_sorted_machines = get_sorted_machines(this.s.sortby, filtered_machines)

        localStorage.setItem("filterby", JSON.stringify(Array.from(this.s.filterby.entries())))

        this.stateChanged()
    }




    FilterFocus(e:KeyboardEvent) {   (e.currentTarget as HTMLFormElement).select()   }




    template = (_s:State, _machines:Array<MachineT>) => { return Lit_Html`{--htmlcss--}`; };
}




customElements.define('v-machines', VMachines);




function add_aux_data_to_machines(machines:MachineT[]) {

  machines.forEach((m:any)=> {
    const now = Date.now()
    console.info("remove m.ts from add_aux_data_to_machines and just use m.modts , then delete m.ts from database -- keep m.tsS")
    const modts = m.modts && m.modts > m.ts ? m.modts : m.ts
    const modts_d = new Date(modts*1000)
    const {errmsg, warnmsg, infomsg} = parse_and_get_states(m.state.latest)
    const chip_num = Number(m.chip)

    m.d = get_last_callin(m.tsS)

    m.stateToShow = 5;
    m.stateToShowColor = "recovered";

    if (!m.state.active) {
      m.stateToShow = 7;
      m.stateToShowColor = "inactive";

    } else if (chip_num > 0 && chip_num < 10) {
      m.stateToShow = 6;
      m.stateToShowColor = "testing";

    } else if (modts_d.getTime() < (now - (86400000*2))) {
      m.stateToShow = 1;
      m.stateToShowColor = "offline";

    } else if (errmsg) {
      m.stateToShow = 2;
      m.stateToShowColor = "error";

    } else if (warnmsg) {
      m.stateToShow = 3;
      m.stateToShowColor = "warn";

    } else if (infomsg) {
      m.stateToShow = 4;
      m.stateToShowColor = "info";
    }

    if (errmsg)
      m.msg = errmsg
    else if (warnmsg)
      m.msg = warnmsg
    else if (infomsg)
      m.msg = infomsg
    else if (m.stateToShow === 1) // offline
      m.msg = "Offline"
    else
      m.msg = "Ok"

  })

}




function get_filtered_machines(filterby:Map<str,str>, machines:MachineT[]) : MachineT[] {

  let m = machines.map((machine:any)=> machine)

  m = m.filter(m=> m.store.name.toLowerCase().includes(filterby.get("storename")))
  m = m.filter(m=> m.store.id.includes(filterby.get("storeid")))
  m = m.filter(m=> m.mchId.toLowerCase().includes(filterby.get("mchId")))
  m = m.filter(m=> m.chip.toLowerCase().includes(filterby.get("chip")))
  m = m.filter(m=> m.particle.serial.toLowerCase().includes(filterby.get("serial")))

  return m

}




function get_sorted_machines(sortby:str, machines:MachineT[]) : MachineT[] {

  const m = machines.map((machine:any)=> machine)

  if (sortby === "state") {
    m.sort((a:any, b:any)=> {
      return a.stateToShow > b.stateToShow ? 1 : -1
    })
  }

  return m

}




function parse_and_get_states(bitStr:str) : {errmsg:str, warnmsg:str, infomsg:str} {

  const snB1 = bitStr.charCodeAt(0);
  const snB2 = bitStr.charCodeAt(1);
  const snB3 = bitStr.charCodeAt(2);

  const bitsXp = {
    procpwr: (snB2 >> 4) & 1,
    drppan:  (snB1 >> 5) & 1,
    tnklvl:  (snB1 >> 4) & 1,
    afltlw:  (snB1 >> 3) & 1,

    dsppwr1: (snB2 >> 5) & 1,
    nzl1:    (snB1 >> 0) & 1,
    smpovr1: (snB1 >> 2) & 1,
    uvblb1:  (snB1 >> 1) & 1,
    srvdr1:  (snB2 >> 3) & 1,

    nzl2:    (snB3 >> 5) & 1,
    smpovr2: (snB2 >> 2) & 1,
    uvblb2:  (snB2 >> 1) & 1,
    srvdr2:  (snB2 >> 0) & 1,

    loramia: (snB3 >> 4) & 1,
  }

  let errmsg = ""
  let warnmsg = ""
  let infomsg = ""

  if (bitsXp.procpwr)
    errmsg = "Processor Power"
  else if (bitsXp.drppan)
    errmsg = "Drip Pan"
  else if (bitsXp.tnklvl)
    warnmsg = "Tank Level"
  else if (bitsXp.afltlw)
    warnmsg = "After Filter"
  else if (bitsXp.dsppwr1)
    warnmsg = "Dispenser Power"
  else if (bitsXp.loramia)
    errmsg = "LoRa MIA"
  else if (bitsXp.nzl1 || bitsXp.nzl2)
    warnmsg = "Nozzle Stuck"
  else if (bitsXp.smpovr1 || bitsXp.smpovr2)
    errmsg = "Sump Over"
  else if (bitsXp.uvblb1 || bitsXp.uvblb2)
    errmsg = "UV Bulb"
  else if (bitsXp.srvdr1 || bitsXp.srvdr1)
    infomsg = "Service Door"
  
  return { errmsg, warnmsg, infomsg }

}




function get_last_callin(machine_tsS:any) {

  const date = new Date(machine_tsS*1000)

  const dstr = month_abbr[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear()

  return dstr

}




function set_filterby(form_element:HTMLFormElement, key:str, filterby:Map<str,str>) : Map<str,str> {

  if (key === "Shift") {
    return filterby
  }

  const fb = new Map<str,str>(filterby.entries())
  
  let val = form_element.value.toLowerCase()  

  if (val.length < 3) {  
    fb.set(form_element.name, "")
  }
  else {
    fb.set(form_element.name, val)
  }

  return fb

}



const month_abbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]



export {  }


