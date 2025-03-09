

import { CatT, TagT } from "../../defs.js"
import { NewTransactionT, InputModeE, QuickNoteT, AttributesT, ModelT, StateT } from "./addtr_defs.js"




export const To_Next_Mode = (s:StateT, inputval:string, keycatcherel:HTMLInputElement) => {

	if (s.inputmode === InputModeE.cat) {
		if (!s.highlightcat) return 
		s.activetransaction.cat = s.highlightcat
		s.inputmode = InputModeE.note
		keycatcherel.value = ''
	}
	else if (s.inputmode === InputModeE.note) {
		s.activetransaction.notes = inputval
		s.inputmode = InputModeE.tag
		keycatcherel.value = ''
	}
	else if (s.inputmode === InputModeE.tag) {
		s.activetransaction.tags = [s.highlighttag!]
		s.inputmode = InputModeE.amount
		keycatcherel.value = s.activetransaction.amount.toString()
	}
	else if (s.inputmode === InputModeE.amount) {
		s.activetransaction.amount = Number(inputval)
		s.inputmode = InputModeE.merchant
		keycatcherel.value = s.activetransaction.merchant
	}
	else if (s.inputmode === InputModeE.merchant) {
		s.activetransaction.merchant = inputval
	}

	keycatcherel.focus()
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

