
type str = string;   
//type int = number;   
type bool = boolean;

declare var Lit_Render: any;
declare var Lit_Html: any;



type State = {
    showAuth: bool,
    showTesty: bool,
}




class VIndex extends HTMLElement {

  $:any
  s:State
  reconcile_return_str: str
  



    constructor() {   

        super(); 

        this.$ = this.querySelector

        this.s = {
            showAuth: false,
            showTesty: false,
        }

        this.reconcile_return_str = ""

    }




  connectedCallback() {

    this.stateChanged()

    setTimeout(()=> {   this.dispatchEvent(new Event('hydrated'))   }, 100)

  }




  stateChanged() {

    Lit_Render(this.template(this.s, this.reconcile_return_str), this);

  }




  async Logout() {

    localStorage.removeItem("id_token")
    localStorage.removeItem("token_expires_at")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("auth_group")
    localStorage.removeItem("user_email")

    this.stateChanged()

  }



  async Reconcile() {

    const returndataP = await fetch(`/api/reconcile`)
    const returndata = await returndataP.json()

    this.reconcile_return_str = returndata.return_str

    this.stateChanged()
  }




  async Admin_Firestore_Update_Collection_Docs() {

    if (confirm("Are you sure you want to update the machines?")) {
      const returndataP = await fetch(`/api/admin_firestore_update_collection_docs`)
      const returndata = await returndataP.json()

      this.reconcile_return_str = returndata.return_str

      this.stateChanged()
    }

  }




async Data_Usage(account:str) {

    if (confirm("Are you sure you want to run data usage queries. LOTS of hits to particles servers?")) {
        const returndataP = await fetch(`/api/data_usage/${account}`)
        const returndata = await returndataP.json()

        this.reconcile_return_str = returndata.return_str

        this.stateChanged()
    }

}




async Status_Stats() {
    if (confirm("Are you sure you want to run status stats. LOTS of hits to database?")) {
        const returndataP = await fetch(`/api/getstatusstats`)
        const returndata = await returndataP.json()

        console.info(returndata)

        this.stateChanged()
    }
}




async Location_Match() {
    if (confirm("Are you sure you want to run status stats. LOTS of hits to database?")) {
        const returndataP = await fetch(`/api/location_match`)
        const returndata = await returndataP.json()

        console.info(returndata)

        this.stateChanged()
    }
}




  async Misc_Quicky() {

    if (confirm("Are you sure you want to run the quicky?")) {
      const returndataP = await fetch(`/api/misc_quicky`)
      const returndata = await returndataP.json()

      this.reconcile_return_str = returndata.return_str

      this.stateChanged()
    }

  }




    async Firestore_Admin_Misc_Get() {

        if (confirm("Are you sure you want to run firestore admin misc get?")) {
            const returndataP = await fetch(`/api/admin_firestore_misc_get`)
            const returndata = await returndataP.json()

            this.reconcile_return_str = returndata.return_str

            this.stateChanged()
        }
    }




    async Misc_Admin_Particle() {

        if (confirm("Are you sure you want to run the msc admin particle?")) {
          const returndataP = await fetch(`/api/admin_particle_rename`)
          const returndata = await returndataP.json()

          this.reconcile_return_str = returndata.return_str

          this.stateChanged()
        }
    }



    async WebPush_Send_Msg() {

        if (confirm("Are you sure you want to send to topic?")) {

            const returndataP = await fetch(`/api/webpush_send_msg`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: "This is a Test",
                    body: 'Sending to all testing devices',
                    tags: ['testing']
                })
            })

            const returndata = await returndataP.json()

            this.reconcile_return_str = returndata.return_str

            this.stateChanged()
        }
    }




    async Listen_Test_Trigger() {

        const returndataP = await fetch(`/api/listen_test_trigger`, {
            method: 'GET',
        })

        const returndata = await returndataP.json()

        console.info(returndata)

        this.reconcile_return_str = returndata.message

        this.stateChanged()
    }




    async RunAdminAPI(adminapi_str:str) {

        if (confirm("Run admin api: " + adminapi_str + "?")) {
            const returndataP = await fetch(`/api/admin/${adminapi_str}`)
            const returndata = await returndataP.json()

            this.reconcile_return_str = returndata.return_str

            this.stateChanged()
        }
    }




template = (_s:any, _reconcile_return_str:any) => { return Lit_Html`{--htmlcss--}`; };


}




customElements.define('v-index', VIndex);




export {  }


