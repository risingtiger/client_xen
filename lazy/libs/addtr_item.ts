

import { CatT, TagT } from "../../defs.js"
import { InputModeE, ModelT, StateT } from "./addtr_defs.js"




export const HandleReset = (m:ModelT, s:StateT) => {
	if (s.inputmode === InputModeE.cat || s.inputmode === InputModeE.tag) {
		s.filteredcats = m.cats
		s.highlightcat = null
		s.filteredtags = m.tags
		s.highlighttag = null
	}
}




export const HandleKeyup = (m:ModelT, s:StateT, inputval:string) => {

	if (s.inputmode === InputModeE.cat) {
		filter_cats(m, s, inputval)
		s.highlightcat = s.filteredcats[0]?.subsref![0] ?? s.highlightcat
	}
	else if (s.inputmode === InputModeE.tag) {
		filter_tags(m, s, inputval)
		s.highlighttag = s.filteredtags[0]
	}
}




export const Set_Cat_From_Click = (m:ModelT, s:StateT, e:MouseEvent) => {
	const catid = (e.target as HTMLElement).dataset.id as string
	
	for(const c of m.cats) {
		const f = c.subsref?.find(sub => sub.id === catid)
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




