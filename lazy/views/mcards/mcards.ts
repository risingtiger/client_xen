

type str = string; type bool = boolean;  //type int = number;   


declare var Lit_Render: any;
declare var Lit_Html: any;

type CardT = {
    val: int,
    family: str,
    flipped: bool,
    matched: bool,
    isremoved: bool,
}


const ALLCARDS = [1,2,3,4,5,6,7,8,9,10,11,12,13]
const ALLFAMILIES = ["spade", "heart", "club", "diamond"]



type State = {
    cardcount: int,
    cards: CardT[],
    cardlayout:{columnscount:int, width:int, height:int},
    cardsstate: "none"|"one"|"two",
}




class VMCards extends HTMLElement {

    s:State




    constructor() {   
        super(); 

        this.s = {
            cardcount: 8,
            cards: [],
            cardlayout:{columnscount:0, width:0, height:0},
            cardsstate: "none",
        }
    }




    async connectedCallback() {   

        this.init()

        setTimeout(()=> {   this.dispatchEvent(new Event('hydrated'))   }, 100)
    }




    sc(state_changes = {}) {   
        this.s = Object.assign(this.s, state_changes)
        Lit_Render(this.template(this.s), this)   
    }




    init() {

        const uniquecardcount = this.s.cardcount / 2

        let cards:CardT[] = []
        while (cards.length < uniquecardcount) {
            const randomcard = ALLCARDS[Math.floor(Math.random() * ALLCARDS.length)]
            const randomfamily = ALLFAMILIES[Math.floor(Math.random() * ALLFAMILIES.length)]
            if (!cards.find(c => c.val === randomcard)) 
                cards.push({ val: randomcard, family:randomfamily, flipped: false, matched: false, isremoved:false })
        }
        const l = cards.length
        for(let i=0; i<l; i++) {
            const randomfamily = ALLFAMILIES[Math.floor(Math.random() * ALLFAMILIES.length)]
            cards.push({ val: cards[i].val, family:randomfamily, flipped: false, matched: false, isremoved:false })
        }
        cards.sort(() => Math.random() - 0.5)

        this.s.cards = cards
        this.s.cardsstate = "none"
        this.s.cardlayout = get_card_layout(this.s.cardcount)

        this.sc()
    }




    Reset(e:Event) {
        this.init()
    }




    SetCount(cardcount:int) {

        this.s.cardcount = cardcount
        this.init()
    }




    CardClick(e:Event) {

        const card = this.s.cards[parseInt((e.currentTarget as HTMLElement).dataset.cardindex)]

        if (card.flipped || card.matched) return


        if (this.s.cardsstate === "none") {
            card.flipped = true
            this.s.cardsstate = "one"
            this.sc()

        } else if (this.s.cardsstate === "one") {
            this.s.cardsstate = "two"
            card.flipped = true

            const flippedcards = this.s.cards.filter(c => c.flipped)

            if (flippedcards[0].val === flippedcards[1].val) {
                flippedcards[0].matched = true
                flippedcards[1].matched = true
            }

            this.s.cardsstate = "two"

        } else if (this.s.cardsstate === "two") {
            this.s.cards.forEach(c => { c.flipped = false })
            this.s.cards.filter(c=> c.matched === true).forEach(c => { c.isremoved = true })
            card.flipped = true
            this.s.cardsstate = "one"
            this.sc()
        }

        this.sc()
    }




    template = (_s:State) => { return Lit_Html`{--htmlcss--}`; }
}


customElements.define('v-mcards', VMCards);




function get_card_layout(cardcount:int) {
    switch (cardcount) {
        case 8: return {columnscount:4, width:100, height:200}
        case 12: return {columnscount:6, width:100, height:100}
        case 16: return {columnscount:8, width:100, height:100}
        case 24: return {columnscount:8, width:100, height:100}
        default: return {columnscount:0, width:0, height:0}
    }
}





export {  }


