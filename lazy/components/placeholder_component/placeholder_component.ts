
type int = number;   

declare var Firestore:any
declare var render: any;
declare var html: any;




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
    render(this.template(this.s), this);
}




template = (_s:any) => { return html`{--htmlcss--}`; };

}




customElements.define('c-finance-bucket', CFinanceBucket);




export {  }

