

type str = string;   
//type int = number;   
type bool = boolean;


import { MachineT } from "../../../definitions_xtend.js"
declare var Lit_Render: any;
declare var Lit_Html: any;
declare var Firestore_Live: any;




type State = {
    show_details: int 
    show_edit: int 
    show_map: int 
}




class VMachine extends HTMLElement {

    $:any
    s:State
    machine:MachineT|null




    constructor() {   
        super(); 

        this.$ = this.querySelector

        this.s = {
            show_details: 0,
            show_edit: 0,
            show_map: 0
        }

        this.machine = null
    }




    async connectedCallback() {   

        const machineid = this.getAttribute("urlmatches")!;

        const fl = await Firestore_Live.Subscribe(this, "machines/"+machineid)
        
        this.machine = fl.initialdata[0] as MachineT

        this.sc()

        this.$("c-machine-statuses").addEventListener("hydrated", ()=> this.dispatchEvent(new Event('hydrated')) )

        fl.ondata((results:any)=> {
            this.machine = results[0]
            this.sc()
        })
    }




    disconnectedCallback() {   
        console.log("must put in a custom lint rule to enforce Firestore_Live.Unsubscribe in view/components")
        Firestore_Live.Unsubscribe(this)
    }




    sc(state_changes = {}) {   
        this.s = Object.assign(this.s, state_changes)
        Lit_Render(this.template(this.s, this.machine), this)   
    }




    ShowDetailsUI() {

        this.s.show_details = 1
        this.sc()

    }




    ShowEditUI() {

        this.s.show_edit = 1
        this.sc()
    }




    async ShowMap() {

        this.s.show_map = 1
        this.sc()
    }




    ShowTelemetry() {

        if (this.machine.chip === "0000") {
            alert("This machine has no telemetry")
            return

        } else {
            window.location.hash = `machinetelemetry/${this.machine.chip}`
        }
    }




    template = (_s:State, _machine:MachineT|null) => { return Lit_Html`{--htmlcss--}`; }
}


customElements.define('v-machine', VMachine);




export {  }


