


//import { bool } from '../../../../definitions.js';


declare var Firestore:any
declare var Lit_Render: any;
declare var Lit_Html: any;


type FlashCardT = {
    url: string,
    tags: Array<string>,
    term: string,
}


type State = {
    props: any,
}




class VFlashCards extends HTMLElement {

s:State
flashcards:Array<FlashCardT>
shadow:ShadowRoot




constructor() {   

    super(); 

    this.s = {
        props: {}
    }

    this.flashcards = []

    this.shadow = this.attachShadow({mode: 'open'});
}




async connectedCallback() {

    const results = await Firestore.Retrieve("machines")
    this.flashcards = results[0] as Array<FlashCardT>

    this.sc()

    this.dispatchEvent(new Event('hydrated'))
}




sc(state_changes = {}) {   
    this.s = Object.assign(this.s, state_changes)
    Lit_Render(this.template(this.s, this.flashcards), this.shadow);
}




template = (_s:any, _flashcards:FlashCardT[]) => { return Lit_Html`{--css--}{--html--}`; };

}




customElements.define('v-flashcards', VFlashCards);




export {  }


