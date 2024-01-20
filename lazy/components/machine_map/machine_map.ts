

type str = string;   
type int = number;   
//type bool = boolean;


declare var Lit_Render: any;
declare var Lit_Html: any;




type State = {
  locatedvia: "gpschip"|"celltower"|null
  locatedtime: str|null
}




class CMachineMap extends HTMLElement {

  $:any
  s:State
  lat!:int
  lon!:int
  particleaccount!:str
  particleid!:str




  constructor() {   

    super(); 

    this.$ = this.querySelector

    this.s = {
      locatedvia: null,
      locatedtime: null
    }

  }



    async connectedCallback() {   

        this.particleaccount = this.getAttribute("paccount")!
        this.particleid = this.getAttribute("pid")!

        const lat     = Number(this.getAttribute("lat")) || 0
        const lon     = Number(this.getAttribute("lon")) || 0
        const type    = Number(this.getAttribute("type")) || 0
        const ts      = Number(this.getAttribute("ts")) || 0
        const ts_date = new Date(ts*1000)

        if (type === 2 && lat !== 0 && lon !== 0) {

            this.lat = lat
            this.lon = lon

            this.s.locatedvia = "gpschip"
            this.s.locatedtime = ts_date.toLocaleDateString()
        }

        else {

            const urlstr = `/api/pwt/particle/locatechip_by_celltower?particleaccount=${this.particleaccount}&particleid=${this.particleid}`
            const gpsreturndata = await FetchLassie(urlstr) 

            if (gpsreturndata === "No GPS") {
                this.lat = 0
                this.lon = 0

                this.s.locatedvia  = "celltower"

                alert ("unable to locate chip")
            }

            else {
                this.lat = gpsreturndata[0]
                this.lon = gpsreturndata[1]

                this.s.locatedvia  = "celltower"
            }

        }

        this.stateChanged()
        this.dispatchEvent(new Event('hydrated'))
    }




    stateChanged() {   Lit_Render(this.template(this.s, this.lat, this.lon), this);   }




    template = (_s:State, _lat:int, _lon:int) => { return Lit_Html`{--htmlcss--}`; }
}


customElements.define('c-machine-map', CMachineMap);




export {  }


