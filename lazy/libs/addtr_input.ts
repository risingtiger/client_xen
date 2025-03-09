

import { CatT, TagT } from "../../defs.js"
import { NewTransactionT, InputModeE, QuickNoteT, AttributesT, ModelT, StateT } from "./addtr_defs.js"




export const To_Next_Mode = (s:StateT, inputval:string, inputEl:HTMLInputElement) => {

	if (s.inputmode === InputModeE.cat) {
		if (!s.highlightcat && inputval.length > 0) {
			// If no cat is highlighted but we have input, try to find a matching cat
			// This is a simplified version - you might want to enhance this logic
		}
		if (s.highlightcat) {
			s.activetransaction.cat = s.highlightcat
		}
		s.inputmode = InputModeE.note
	}
	else if (s.inputmode === InputModeE.note) {
		s.activetransaction.notes = inputval
		s.inputmode = InputModeE.tag
	}
	else if (s.inputmode === InputModeE.tag) {
		if (s.highlighttag) {
			s.activetransaction.tags = [s.highlighttag]
		}
		s.inputmode = InputModeE.amount
	}
	else if (s.inputmode === InputModeE.amount) {
		s.activetransaction.amount = Number(inputval)
		s.inputmode = InputModeE.merchant
	}
	else if (s.inputmode === InputModeE.merchant) {
		s.activetransaction.merchant = inputval
		// Cycle back to cat for the next transaction or complete this one
		s.inputmode = InputModeE.cat
	}
}




const previoused_on_input = (s:StateT) => {

	if (s.inputmode === InputModeE.note) {
		s.inputmode = InputModeE.cat
	}
	else if (s.inputmode === InputModeE.tag) {
		s.inputmode = InputModeE.note
	}
	else if (s.inputmode === InputModeE.amount) {
		s.inputmode = InputModeE.tag
	}
	else if (s.inputmode === InputModeE.merchant) {
		s.inputmode = InputModeE.amount
	}
}

