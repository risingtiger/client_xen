

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
		s.highlightcat = s.filteredcats[0].subs![0]
	}
	else if (s.inputmode === InputModeE.tag) {
		filter_tags(m, s, inputval)
		s.highlighttag = s.filteredtags[0]
	}
}




export const SetCatHighlightNext = (m:ModelT, s:StateT, inputval:string) => {
    if (!s.highlightcat || s.filteredcats.length === 0) {
        return;
    }

    const currentCatId = s.highlightcat.id;
    let foundCurrentCat = false;
    let nextCatFound = false;

    // Loop through all filtered parent categories
    for (let i = 0; i < s.filteredcats.length; i++) {
        const parentCat = s.filteredcats[i];
        
        // Skip if no subcategories
        if (!parentCat.subs || parentCat.subs.length === 0) {
            continue;
        }

        // Look for the current highlighted category in this parent
        for (let j = 0; j < parentCat.subs.length; j++) {
            const subCat = parentCat.subs[j];
            
            if (foundCurrentCat) {
                // We already found the current cat, so this is the next one
                s.highlightcat = subCat;
                nextCatFound = true;
                return;
            }
            
            if (subCat.id === currentCatId) {
                foundCurrentCat = true;
                
                // If this is the last sub in this parent, we'll need to check the next parent
                if (j === parentCat.subs.length - 1) {
                    continue;
                }
                
                // Otherwise, the next sub in this parent is our next cat
                s.highlightcat = parentCat.subs[j + 1];
                nextCatFound = true;
                return;
            }
        }
    }
    
    // If we've gone through all categories and haven't found a next one,
    // we can wrap around to the first subcategory of the first parent
    if (foundCurrentCat && !nextCatFound && s.filteredcats.length > 0 && 
        s.filteredcats[0].subs && s.filteredcats[0].subs.length > 0) {
        s.highlightcat = s.filteredcats[0].subs[0];
    }
}




export const Set_Cat_From_Click = (m:ModelT, s:StateT, e:MouseEvent) => {
	const catid = (e.target as HTMLElement).dataset.id as string
	
	for(const c of m.cats) {
		const f = c.subs?.find(sub => sub.id === catid)
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
		const parentCatCopy: CatT = {...cat, subs: []};
		let isparentcatincluded = false;

		for (const subcat of cat.subs!) {
			if (subcat.name.toLowerCase().includes(inputval.toLowerCase())) {
				isparentcatincluded = true;
				parentCatCopy.subs!.push(subcat);
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




