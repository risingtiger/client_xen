import { $NT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var $N: $NT;

type Model = {
    prop: string;
}

type State = {
    checkingTotal: number;
    creditCardTotal: number;
    savingsTotal: number;
    netDifference: number;
}

class VPFinanceBalances extends HTMLElement {
    s: State
    m: Model
    shadow: ShadowRoot

    constructor() {   
        super(); 

        this.m = {
            prop: "",
        }

        this.s = {
            checkingTotal: 0,
            creditCardTotal: 0,
            savingsTotal: 0,
            netDifference: 0
        } 

        this.shadow = this.attachShadow({mode: 'open'});
    }

    async connectedCallback() {   
        this.sc()
        this.dispatchEvent(new Event('hydrated'))
    }

    Show(ynab_accounts: any[]) {
        // Separate accounts by type
        const checkingAccounts = ynab_accounts.filter(acc => acc.type === 'checking');
        const creditCardAccounts = ynab_accounts.filter(acc => acc.type === 'creditCard');
        const savingsAccounts = ynab_accounts.filter(acc => acc.type === 'savings');

        // Sum balances for each type
        const checkingTotal = checkingAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const creditCardTotal = creditCardAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const savingsTotal = savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0);

        // Calculate net difference
        const netDifference = checkingTotal + savingsTotal - creditCardTotal;

        // Update the state
        this.sc({
            checkingTotal,
            creditCardTotal,
            savingsTotal,
            netDifference,
        });
    }

    sc(state_changes = {}) {   
        this.s = Object.assign(this.s, state_changes)
        Lit_Render(this.template(this.s, this.m), this.shadow);   
    }

    template = (_s:State, _m:Model) => { return Lit_Html`{--css--}{--html--}`; } 
}

customElements.define('vp-finance-balances', VPFinanceBalances);
