

declare var Lit_Directive: any;
declare var Lit_directive: any;


type State = {
    prop: number
}




class PlaceHolderDirective extends Lit_Directive {

    s:State

    constructor(part: any) {
        super(part);

        this.s = { prop: 0 }
    }




    update(_part: any, [_a, _b]: any) {

        console.log("update")

        return this.state;
    }
}



const dplaceholderdirective = Lit_directive(PlaceHolderDirective);

export { dplaceholderdirective }



