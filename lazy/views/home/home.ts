

type str = string;   //type int = number;   //type bool = boolean;

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var FetchLassie: any;
declare var SetDistCSS: any;


type State = {
    admin_return_str:str
}




let distcss = `{--distcss--}`;




class VHome extends HTMLElement {

$:any
s:State
shadow:ShadowRoot



constructor() {   

    super(); 

    this.$ = this.querySelector

    this.s = {
        admin_return_str: "",
    }

    this.shadow = this.attachShadow( { mode: 'open' } );

    SetDistCSS(this.shadow, distcss)
}




connectedCallback() {

    this.sc()
    setTimeout(()=> {   this.dispatchEvent(new Event('hydrated'))   }, 100)
}




sc() {
    Lit_Render(this.template(this.s), this.shadow);
}




async adminetc(api:str, method: "POST" | "GET" = "GET") {

    if (confirm("Are you sure you want to run admin: " + api)) {

        const returndata = await FetchLassie("/api/xen/admin/" + api, { method })
        if (returndata.return_str) {
            this.s.admin_return_str = returndata.return_str.includes("--") ? returndata.return_str.split("--") : returndata.return_str
        }

        this.sc()
    }
}




template = (_s:any) => { return Lit_Html`{--devservercss--}{--html--}`; };

}




customElements.define('v-home', VHome);




export {  }


