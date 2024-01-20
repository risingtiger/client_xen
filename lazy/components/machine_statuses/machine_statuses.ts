

type str = string;   type int = number;   type bool = boolean;




//import { MachineT } from "../../../definitions_xtend.js"
declare var Lit_Render: any;
declare var Lit_Html: any;
declare var SSEvents: any;

enum Meter_Name {
  Store = "Store",
  Pure1 = "Pure1",
  Mineral1 = "Mineral1",
  Pure2 = "Pure2",
  Mineral2 = "Mineral2"
}

type Raw_Status = {
  id:str,
  bits:str,
  meterIncrs:[int, int, int, int, int],
  modts:int
}

type Parsed_Status = {
    id:any,
    bits_xp:any,
    indicators?:any,
    meters:Map<Meter_Name, int>,
    datestr:str,
    timestr:str,
    date: Date,
    day_of_month: int,
    month: int,
    day_summary?: Day_Summary
    modts: int
}

type Day_Summary = {
    day_of_month:int,
    month:int,
    meters:Map<Meter_Name, int>,
}

type Day_Group = {
    summary:Day_Summary,
    statuses:Parsed_Status[],
    modts:int,
}

type State = {
  machineid: str,
  timezone: str,
  timezone_at_machine: str,
  timezone_at_headquarters: str,
  timezone_set_to_headquarters: bool,
  totalmeters: number[],
  incrs: number[] 
}




const DAY_IN_SECONDS = 86400
const DAILY_STATUS_CALLIN_IN_SECONDS = 8 * 3600




class CMachineStatuses extends HTMLElement {

$:any
s:State

parsed_statuses:Parsed_Status[]
day_groups:Day_Group[]




static get observedAttributes() { return ['refresh']; }




constructor() {   

    super(); 

    this.$ = this.querySelector

    this.s = {
        timezone: "",
        timezone_at_machine: "",
        timezone_at_headquarters: "Denver",
        timezone_set_to_headquarters: false,
        machineid: "",
        totalmeters: [],
        incrs: []
    }

    this.parsed_statuses = []
    this.day_groups = []

}




async connectedCallback() {

    this.s.machineid           = this.getAttribute("machineid")!
    this.s.timezone            = this.getAttribute("timezone")!
    this.s.timezone_at_machine = this.s.timezone
    this.s.totalmeters         = JSON.parse(this.getAttribute("totalmeters")!) as number[]
    this.s.incrs               = JSON.parse(this.getAttribute("incrs")!) as number[]

    await this.runit()

    this.dispatchEvent(new Event('hydrated'))

    SSEvents.Add_Listener(this.tagName.toLowerCase(), SSEvents.SSE_Triggers.FIRESTORE, (paths:str[])=> {
        console.log(paths)
        this.runit()
    })
}




disconnectedCallback() {
    console.log("put rule into linting that throws error if SSEvents Add Listener detected but not a Remove Listener")
    SSEvents.Remove_Listener(this.tagName.toLowerCase())
}




async attributeChangedCallback(name:str, _oldValue:str|bool|int, _newValue:str|bool|int) {

    if (name === "refresh") {
        this.runit()
    }
}




stateChanged() {

    const totalStoreMeters = this.s.totalmeters[0]
    const totalPureMeters = this.s.totalmeters[1] + this.s.totalmeters[3]
    const totalMinMeters = this.s.totalmeters[2] + this.s.totalmeters[4]

    Lit_Render(this.template(this.s, this.day_groups, totalStoreMeters, totalPureMeters, totalMinMeters), this)
}




async Switch_Time_Zone() {

    this.s.timezone_set_to_headquarters = this.s.timezone_set_to_headquarters ? false : true
    this.s.timezone = this.s.timezone_set_to_headquarters ? this.s.timezone_at_headquarters : this.s.timezone_at_machine

    this.runit()
}




runit() { return new Promise(async r=> {

    this.parsed_statuses = await get_parsed_statuses(this.s.machineid, this.s.incrs, this.s.timezone)
    this.day_groups = set_day_groups(this.parsed_statuses)
    this.stateChanged()
    r(1)
})}




template = (_s:State, _day_groups:Day_Group[], _totalStoreMeters:int, _totalPureMeters:int, _totalMinMeters:int) => { return Lit_Html`{--htmlcss--}`; }

}

customElements.define('c-machine-statuses', CMachineStatuses);










function get_parsed_statuses(machineid:str, incrs:int[], timezone:str) { return new Promise<Parsed_Status[]>(async r=> {

    const results = await (window as any).Firestore.Retrieve(`machines/${machineid}/statuses`, {limit: 200, order_by: "modts,desc"})

    if (results[0].length) {
        const raw_statuses = results[0]
        raw_statuses.forEach((s:any)=> s.modts = s.modts ? s.modts : s.ts)
        console.info("remove m.ts from get_parsed_statuses and just use m.modts in get_parsed_statuses")
        const parsed_statuses = parse_statuses(raw_statuses, incrs, timezone)

        r(parsed_statuses)
    }

    else { 
        r([])
    }

})}




function parse_statuses(raw_statuses:Raw_Status[], incrs:int[], timezone:str) : Parsed_Status[] {

    const parsed_statuses:Parsed_Status[] = []

    raw_statuses.forEach(s=> {

        const date = new Date(s.modts*1000)

        const x = date.toLocaleDateString("en-US", { timeZone: "America/" + timezone })
        const y = x.split("/")
        y[0] = y[0].padStart(2,"0")
        y[1] = y[1].padStart(2,"0")

        const day_of_month = Number(y[1])
        const month = Number(y[0])

        const datestr = y[0]+"/"+y[1]
        const timestr = date.toLocaleTimeString("en-US", { hour12: false, timeZone: "America/" + timezone })

        const meters = new Map([
            [Meter_Name.Store, s.meterIncrs[0]*incrs[0]],
            [Meter_Name.Pure1, s.meterIncrs[1]*incrs[1]],
            [Meter_Name.Mineral1, s.meterIncrs[2]*incrs[2]],
            [Meter_Name.Pure2, s.meterIncrs[3]*incrs[3]],
            [Meter_Name.Mineral2, s.meterIncrs[4]*incrs[4]]
        ])

        const bits_xp = parse_bits(s.bits)

        parsed_statuses.push({   id: s.id, bits_xp, meters, datestr, timestr, date, day_of_month, month, day_summary:null, modts: s.modts   })
    })

    for (let i = parsed_statuses.length - 1; i >= 0; i--) {
        const s     = parsed_statuses[i]
        const snext = parsed_statuses[i + 1] || null

        s.indicators = parse_indicators(s.bits_xp, snext?.bits_xp)
    }

    return parsed_statuses  
}




function parse_bits(bitStr:str) : any {

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


    return bitsXp

}



  
function parse_indicators(sBitsXp:any, sNextBitsXp:any|null) : any {

    const procpwr = htmlstr(1, "error", sBitsXp.procpwr, sNextBitsXp?.procpwr, null, null )
    const drppan  = htmlstr(1, "error", sBitsXp.drppan, sNextBitsXp?.drppan, null, null )
    const tnklvl  = htmlstr(1, "warn",  sBitsXp.tnklvl, sNextBitsXp?.tnklvl, null, null )
    const afltlw  = htmlstr(1, "warn",  sBitsXp.afltlw, sNextBitsXp?.afltlw, null, null )

    const dsppwr  = htmlstr(1, "warn",  sBitsXp.dsppwr1, sNextBitsXp?.dsppwr1, null, null )
    const nzl     = htmlstr(2, "warn", sBitsXp.nzl1, sNextBitsXp?.nzl1, sBitsXp.nzl2, sNextBitsXp?.nzl2)
    const smpovr  = htmlstr(2, "error", sBitsXp.smpovr1, sNextBitsXp?.smpovr1, sBitsXp.smpovr2, sNextBitsXp?.smpovr2)
    const uvblb   = htmlstr(2, "error", sBitsXp.uvblb1, sNextBitsXp?.uvblb1, sBitsXp.uvblb2, sNextBitsXp?.uvblb2)
    const srvdr   = htmlstr(2, "info",  sBitsXp.srvdr1, sNextBitsXp?.srvdr1, sBitsXp.srvdr2, sNextBitsXp?.srvdr2)

    const loramia = htmlstr(1, "error", sBitsXp.loramia, sBitsXp?.loramia, null, null)

    return {  procpwr, drppan, tnklvl, afltlw, dsppwr, nzl, smpovr, uvblb, srvdr, loramia   }



    function htmlstr(classt:int, wstr:str, bit1:bool, nbit1:bool, bit2:bool|null, nbit2:bool|null) {

        let str = ""

        if (classt === 1) {
            const x = bit1 ? wstr : nbit1 ? "recovered" : ""
            str = x ? `<span class='single'><img src='/assets/media/bubble_${x}.svg' /></span>` : ""
        }

        else if (classt === 2) {
            if (!bit1 && !nbit1 && !bit2 && !nbit2) {
                str = ""
            }

            else {
                const x1 = bit1 ? wstr : nbit1 ? "recovered" : "ok"
                const x2 = bit2 ? wstr : nbit2 ? "recovered" : "ok"

                str =  `<span class='double ${x1}'><img src='/assets/media/bubble_${x1}.svg' /></span>`
                str += `<span class='double ${x2}'><img src='/assets/media/bubble_${x2}.svg' /></span>`
            }
        }

        return str
    }

}




function set_day_groups(parsed_statuses:Parsed_Status[]) : Day_Group[] {

    const day_groups:Day_Group[] = []

    parsed_statuses.forEach((s,index)=> {

        const day_group_ts = calculate_day_group_ts(s.modts)

        let day_group = day_groups.find(dg=> dg.modts === day_group_ts) 

        if (!day_group) {
            day_groups.push({
                modts: day_group_ts,
                summary: {
                    day_of_month: s.day_of_month,
                    month: s.month,
                    meters: new Map([ 
                        [ Meter_Name.Store, 0 ],
                        [ Meter_Name.Pure1, 0 ],
                        [ Meter_Name.Mineral1, 0 ],
                        [ Meter_Name.Pure2, 0 ],
                        [ Meter_Name.Mineral2, 0 ]
                    ])
                }, 
                statuses: get_statuses_for_day_group(parsed_statuses, index, day_group_ts)
            })

            day_group = day_groups[day_groups.length-1]
        }
    })
        
    day_groups.forEach(calc_day_group_meter_totals)

    return day_groups



    function calc_day_group_meter_totals(day_group:Day_Group) {

        day_group.statuses.forEach(s=> {
            //@ts-ignore
            for (let [key, value] of day_group.summary.meters) {
                day_group.summary.meters.set(key, value + s.meters.get(key))
            }
        })
    }


    function get_statuses_for_day_group(parsed_statuses:Parsed_Status[], index:int, day_group_ts:int) {

        const day_group_statuses:Parsed_Status[] = []

        for (let i=index; i<parsed_statuses.length; i++) {
            const s = parsed_statuses[i]

            if (s.modts >= day_group_ts && s.ts < day_group_ts + DAY_IN_SECONDS) {
                day_group_statuses.push(s)
            }
        }

        return day_group_statuses
    }


    function calculate_day_group_ts(status_ts:int) {

        let ts_last_daily_callin = 0

        let ts_seconds_into_day = status_ts % DAY_IN_SECONDS
        
        if (ts_seconds_into_day > DAILY_STATUS_CALLIN_IN_SECONDS) {
            const last_midnight = status_ts - ts_seconds_into_day
            ts_last_daily_callin = last_midnight + DAILY_STATUS_CALLIN_IN_SECONDS 
        }

        else {
            const two_midnights_ago = status_ts - ts_seconds_into_day - DAY_IN_SECONDS 
            ts_last_daily_callin = two_midnights_ago + DAILY_STATUS_CALLIN_IN_SECONDS 
        }

        return ts_last_daily_callin
    }

}




export {  }


