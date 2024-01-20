

type str = string;   type int = number;   type bool = boolean;

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var InfluxDB: any;




type State = {
    measurement: str,
    fields: str,
    chip: str,
    aggregate_fn: str,
    unitterms:str,
    medians: Median[],
}

type Median = {
    field: str,
    median: int,
}

class VCMachineTelemetryMedians extends HTMLElement {

    $:any
    s:State

    static get observedAttributes() { return ['fields']; }




    constructor() {   
        super(); 

        this.$ = this.querySelector

        this.s = {
            measurement: "",
            fields: "",
            chip: "",
            aggregate_fn: "",
            unitterms: "",
            medians: [],
        }
    }




    async attributeChangedCallback(_name:str, _oldValue:str|bool|int, _newValue:str|bool|int) {

        setTimeout(async ()=>{

            this.s.fields = this.getAttribute("fields")
            this.s.chip = this.getAttribute("chip")
            this.s.aggregate_fn = this.getAttribute("aggregate_fn")
            this.s.unitterms = this.getAttribute("unitterms")
            this.s.measurement = this.getAttribute("measurement")

            const end = Math.floor(Date.now() / 1000)
            const begin = end - 86400 * 30

            if (this.s.fields)
                this.s.medians = await get_medians(begin, end, this.s.measurement, this.s.fields, this.s.chip, this.s.aggregate_fn)
            else
                this.s.medians = []

            this.stateChanged();

            this.dispatchEvent(new Event('hydrated'))
        }, 20)
    }




    stateChanged() {   Lit_Render(this.template(this.s), this);   }




    runit() {
    }



    template = (_s:State) =>  Lit_Html`{--htmlcss--}`
}




customElements.define("vc-machinetelemetry-medians", VCMachineTelemetryMedians);




function get_medians(begin:int, end:int, measurement:str, fields:str, chip:str, aggregate_fn:str) {

    return new Promise<Median[]>(async (res:any,_rej:any)=> {
        const m = await InfluxDB.Retrieve_Medians("PWT", [begin], [end], [1], ['d'], [measurement], [fields], ["chip:"+chip], [aggregate_fn])
        const medians = m[0]
        res(medians)
    })
}





export {  }


