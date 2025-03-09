

import { CatT, TagT } from "../../defs.js"
import { NewTransactionT, InputModeE, QuickNoteT, AttributesT, ModelT, StateT } from "./addtr_defs.js"




export const HandleKeyup = (m:ModelT, s:StateT, inputval:string) => {

	if (s.inputmode === InputModeE.cat) {
		if (!s.highlightcat) return 
		s.activetransaction.cat = s.highlightcat
		s.inputmode = InputModeE.note
		keycatcherel.value = ''
		keycatcherel.focus()
	}
	else if (s.inputmode === InputModeE.note) {
		s.activetransaction.notes = inputval
		s.inputmode = InputModeE.tag
	}
	else if (s.inputmode === InputModeE.tag) {
		s.activetransaction.tags = [s.highlighttag!]
		s.inputmode = InputModeE.amount
	}
	else if (s.inputmode === InputModeE.amount) {
		s.activetransaction.amount = Number(inputval)
		s.inputmode = InputModeE.merchant
	}
	else if (s.inputmode === InputModeE.merchant) {
		s.activetransaction.merchant = inputval
	}
}




const filterdcats = (m:ModelT, s:StateT, inputval:string): CatT[] => {
	
	const filteredcats:CatT[] = []

	for (const cat of m.cats) {
		// Create a copy of the parent cat with empty subs array
		const parentCatCopy: CatT = {...cat, subs: []};
		let isparentcatincluded = false;

		// Only include subcats that match the inputval
		for (const subcat of cat.subs!) {
			if (subcat.name.toLowerCase().includes(inputval.toLowerCase())) {
				isparentcatincluded = true;
				// Add matching subcat to the parent's subs array
				parentCatCopy.subs!.push(subcat);
			}
		}

		// Only include parent cat if at least one of its subcats matched
		if (isparentcatincluded) {
			filteredcats.push(parentCatCopy);
		}
	}

	return filteredcats;
}
