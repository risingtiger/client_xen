


import { MachineT, MachineDetailsT, MachineParticleMoreDetailsT } from "../../../definitions_xtend.js"

declare var Lit_Render: any;
declare var Lit_Html: any;




type State = {
  show_particle_more: bool 
}




class CMachineDetails extends HTMLElement {

    $:any
    s:State
    machine!:MachineT
    mdetails!:MachineDetailsT




    static get observedAttributes() { return ['show']; }




    constructor() {   

        super(); 

        this.$ = this.querySelector

        this.s = {
          show_particle_more: false
        } 
        this.machine
        this.mdetails
    }




    async connectedCallback() {   

        const x = await (window as any).Firestore.Retrieve(`machines/${this.getAttribute("machine")}`)      

        this.machine = x[0] 
        this.mdetails = expand(this.machine)

        this.stateChanged()

        this.dispatchEvent(new Event('hydrated'))
    }




    async GetAndShowParticleDeviceDetails() { 

        return new Promise(async res=> {

            const urlstr = `/api/pwt/particle/getchipdetails?particleaccount=${this.machine.particle.account}&particleid=${this.machine.particle.id}`
            this.mdetails.particle_more = await FetchLassie(urlstr) as MachineParticleMoreDetailsT

            this.s.show_particle_more = true

            this.stateChanged()

            res(1)
        })
    }



    stateChanged() {   Lit_Render(this.template(this.s, this.mdetails), this);   }




    template = (_s:State, _mdetails:MachineDetailsT) => { return Lit_Html`{--htmlcss--}`; } 
}


customElements.define('c-machine-details', CMachineDetails);




function expand(machine:MachineT) : MachineDetailsT {

    let dispenser_mode = ""  
    let gps_source = ""
    let particle_account = ""
    let particle_product = ""

    switch (machine.dispenser.mode) {
        case 0: dispenser_mode      = "lora"; break;
        case 1: dispenser_mode      = "discrete"; break;
        case 2: dispenser_mode      = "switchingdiscrete"; break;
        default: dispenser_mode     = "discrete"; break;
    }

    switch (machine.gps[2]) {
        case 0: gps_source          = "none"; break;
        case 2: gps_source          = "onboard"; break;
        default: gps_source         = "none"; break;
    }

    switch (machine.particle.account) {
        case "accounts_risingtiger_com": particle_account = "llc"; break;
        case "rfs_risingtiger_com": particle_account = "east"; break;
        case "west_pwt_risingtiger_com": particle_account = "west"; break;
        default: particle_account = "west"; break;
    }

    switch (machine.particle.product) {
        case 11724: particle_product = "BSeries"; break; //llc account
        case 11723: particle_product = "Boron"; break; //llc account
        case 20406: particle_product = "BSeries"; break; //east account
        case 20405: particle_product = "Boron"; break; //east account
        case 20567: particle_product = "BSeries"; break; //west account
        case 20568: particle_product = "Boron"; break; //west account
        default: particle_product = "BSeries"; break;
    }




    const machine_details:MachineDetailsT = {

        cellsignal: machine.cell[0],
        cellquality: machine.cell[1],
        chip: machine.chip,
        id: machine.id,
        dispenser_mode,
        dispenser_loraversion: dispenser_mode == 'lora' ? machine.dispenser.lora_version.toString() : 'N/A',
        gps_lat: gps_source === "onboard" ? machine.gps[0].toString() : "N/A",
        gps_lon: gps_source === "onboard" ? machine.gps[1].toString() : "N/A",
        gps_ts: machine.gps[3],
        incrs: machine.incrs,
        clientid: machine.clientid,
        mchId: machine.mchId,
        meters: machine.meters,
        particle: {
            account: particle_account,
            codeversion: machine.particle.codeversion,
            id: machine.particle.id,
            product: particle_product,
            serial: machine.particle.serial,
        },
        particle_more: null,
        state_isactive: machine.state.active,
        state_latest: machine.state.latest,
        store_id: machine.store.id,
        store_name: machine.store.name,
        ts: machine.ts,
        tsS: machine.tsS,
    }

    return machine_details
}




