
type str = string; type bool = boolean; type int = number;   

declare var Firestore:any
declare var Lit_Render: any;
declare var Lit_Html: any;




type State = {
    propa: int
}




class CFinanceBucket extends HTMLElement {

s:State




constructor() {   

    super(); 

    this.s = {
        propa: 1
    }
}




async connectedCallback() {

    this.dispatchEvent(new Event('hydrated'))
}




async mousedowned(e:any) { 

    console.log('mousedowned')
    //bucket.transfer_ui_mousedown(e) 
}

async mouseupped(e:any) { 

    console.log('mouseupped')
    //bucket.transfer_ui_mouseup(e)   
}

async mousemoved(e:any) { 

    console.log('mousemoved')
}




sc() {
    Lit_Render(this.template(this.s), this);
}




template = (_s:any) => { return Lit_Html`{--htmlcss--}`; };

}




customElements.define('c-finance-bucket', CFinanceBucket);




export {  }

