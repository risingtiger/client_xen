

type str = string;   type int = number;   type bool = boolean;


declare var Lit_Render: any;
declare var Lit_Html: any;
declare var InfluxDB: any;




type State = {
    begin: int,
    end: int,
    chip: str
    groups: Status_Group[]
}

type Status_Point = {
    field:str,
    val:bool,
    date:Date,
    placement?:int
}

type Status_Group  = {
    placement:int, 
    badge:str, 
    statuses:Status_Point[]
}
class VCMachineTelemetryStatusRow extends HTMLElement {

    $:any
    s:State

    static get observedAttributes() { return ['begin']; }




    constructor() {   
        super(); 

        this.$ = this.querySelector

        this.s = {
            begin: 0,
            end: 0,
            chip: "",
            groups: []
        }
    }




    async attributeChangedCallback(name:str, oldValue:str|bool|int, newValue:str|bool|int) {

        setTimeout(async ()=>{
            this.s.begin = Number(this.getAttribute("begin"))
            this.s.end = this.s.begin + 86400
            this.s.chip = this.getAttribute("chip")

            if (this.s.begin)
                this.s.groups = await set_status_row(this.s.begin, this.s.end, this.s.chip)
            else
                this.s.groups = []

            this.stateChanged();

            this.dispatchEvent(new Event('hydrated'))
        }, 20)
    }




    stateChanged() {   Lit_Render(this.template(this.s), this);   }




    runit() {
    }



    template = (_s:State) =>  Lit_Html`{--htmlcss--}`
}




customElements.define("vc-machinetelemetry-statusrow", VCMachineTelemetryStatusRow);





async function set_status_row(begin:int, end:int, chip:str) {

    return new Promise<Status_Group[]>(async (res:any,_rej:any)=> {

        const points = await InfluxDB.Retrieve_Points("PWT", [begin], [end], ["STATUS"], ["procpwr,drppan,tnklvl,afltlw,dsppwr1,nzl1,smpovr1,uvblb1,srvdr1,nzl2,smpovr2,uvblb2,srvdr2,loramia"], ["chip:"+chip])

        points.forEach((s:any) => {
            const seconds_into_day = s.date.getHours() * 3600 + s.date.getMinutes() * 60 + s.date.getSeconds()
            const placementpercentage = seconds_into_day / 86400

            s.placement = Math.floor(placementpercentage * 100)
        })

        const groups:Status_Group[] = []

        for(let i=0; i<points.length; i++) {
            const sp = points[i]

            let sg = groups.find((sg:any) => sg.placement <= sp.placement + 3 && sg.placement >= sp.placement - 3)

            if (sg) {
                sg.statuses.push(sp)

            } else {
                groups.push({ placement: sp.placement, badge: sp.val ? "error" : "recovered", statuses: [sp] })
                sg = groups[groups.length-1]
            }
        }
        res(groups)
    })
}

export {  }


