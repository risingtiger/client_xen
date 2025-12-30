
import { str } from "../../defs_server_symlink.js"
import { CatT, TagT } from "../../defs_instance_server_symlink.js"
import { InputModeE, ModelT, StateT, NewTransactionT } from "./addtr_defs.js"




export const HandleFilteredCatsTagsReset = (m:ModelT, s:StateT) => {
	s.filteredcats = m.cats
	s.highlightcat = null
	s.filteredtags = m.tags
	s.highlighttag = null
}




export const HandleInputChange = (m:ModelT, s:StateT, inputval:string) => {

	if (s.inputmode === InputModeE.cat) {
		filter_cats(m, s, inputval)
		s.highlightcat = s.filteredcats[0]?.subsref![0] ?? s.highlightcat
	}
	else if (s.inputmode === InputModeE.tag) {
		filter_tags(m, s, inputval)
		s.highlighttag = s.filteredtags[0]
	}
}




export const HandleUpdateTransactionFromCurrentInputModeInput = (
	inputmode:InputModeE, 
	shadowdom:any, 
	infocus:NewTransactionT,
	highlightcat: CatT|null,
	highlighttag: TagT|null
) => {

	const inputel = (shadowdom.querySelector(`#input-${inputmode}`) as HTMLInputElement)!

	if (inputmode === InputModeE.cat) {
		if (highlightcat && inputel.value.length > 0) {
			infocus.catref = highlightcat;
		}
	}
	else if (inputmode === InputModeE.note) {
		infocus.notes = inputel.value;
	}
	else if (inputmode === InputModeE.tag && inputel.value.length > 0) {
		if (highlighttag) {
			infocus!.tags = [highlighttag!];
		} else { 
			infocus.tags = [];
		}

	}
	else if (inputmode === InputModeE.amount) {
		if (inputel.value) infocus!.amount = Number(inputel.value);
	}
	else if (inputmode === InputModeE.merchant) {
		if (inputel.value) infocus!.merchant = inputel.value;
	}
	else if (inputmode === InputModeE.date) {
		if (inputel.value && inputel.value !== '--/--') {
			const date = new Date(inputel.value);
			infocus!.date = Math.floor(date.getTime() / 1000);
		} else {
			console.log(new Error("date is in wrong format"))
		}
	}
}




export const Set_Cat_From_Click = (m:ModelT, s:StateT, e:MouseEvent) => {
	const catid = (e.target as HTMLElement).dataset.id as string
	
	for(const c of m.cats) {
		const f = c.subsref?.find(( sub:any ) => sub.id === catid)
		if (f) {
			s.highlightcat = f
			break
		}
	}
}




export const Set_Tag_From_Click = (m:ModelT, s:StateT, e:MouseEvent) => {
	const tagid = (e.target as HTMLElement).dataset.id as string
	const tag = m.tags.find(tag => tag.id === tagid)! 
	s.highlighttag = tag
}




const filter_cats = (m:ModelT, s:StateT, inputval:string) => {
	
	const filteredcats:CatT[] = []

	for (const cat of m.cats) {

		const parentCatCopy: CatT = {...cat, subsref: []};
		let isparentcatincluded = false;

		for (const subcat of cat.subsref!) {
			if (subcat.name.toLowerCase().includes(inputval.toLowerCase())) {
				isparentcatincluded = true;
				parentCatCopy.subsref!.push(subcat);
			}
		}

		if (isparentcatincluded) {
			filteredcats.push(parentCatCopy);
		}
	}

	s.filteredcats = filteredcats;
}




const filter_tags = (m:ModelT, s:StateT, inputval:string) => {
	
	const filteredtags:TagT[] = []

	for (const tag of m.tags) {
		if (tag.name.toLowerCase().includes(inputval.toLowerCase())) {
			filteredtags.push(tag)
		}
	}

	s.filteredtags = filteredtags;
}




