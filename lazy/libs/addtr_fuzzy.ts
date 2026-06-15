import { CatT, TagT } from "../../defs_instance_server_symlink.js"



export const FilterCatsFuzzy = (cats:CatT[], inputval:string) : CatT[] => {

	const normalized_input = normalize_fuzzy_text(inputval)
	if (!normalized_input) return cats

	const filteredcats:{ cat:CatT, score:number }[] = []

	for (const cat of cats) {

		const parentCatCopy: CatT = { ...cat, subsref: [] }
		const matchedsubcats:{ subcat:CatT, score:number }[] = []
		let bestscore = -1

		for (const subcat of cat.subsref!) {
			const subcatname = normalize_fuzzy_text(subcat.name)
			const score = get_fuzzy_match_score(subcatname, normalized_input)
			if (score < 0) continue;

			matchedsubcats.push({ subcat, score })
			if (score > bestscore) bestscore = score
		}

		if (bestscore < 0) continue;

		matchedsubcats.sort((a, b) => b.score - a.score)
		parentCatCopy.subsref = matchedsubcats.map(item => item.subcat)

		filteredcats.push({ cat: parentCatCopy, score: bestscore })
	}

	filteredcats.sort((a, b) => b.score - a.score)
	return filteredcats.map(item => item.cat)
}



export const FilterTagsFuzzy = (tags:TagT[], inputval:string) : TagT[] => {

	const normalized_input = normalize_fuzzy_text(inputval)
	if (!normalized_input) return tags

	const filteredtags:{ tag:TagT, score:number }[] = []

	for (const tag of tags) {
		const score = get_fuzzy_match_score(normalize_fuzzy_text(tag.name), normalized_input)
		if (score < 0) continue;

		filteredtags.push({ tag, score })
	}

	filteredtags.sort((a, b) => b.score - a.score)
	return filteredtags.map(item => item.tag)
}



const get_fuzzy_match_score = (candidate:string, query:string) : number => {

	if (candidate === query) return 10000
	if (candidate.startsWith(query)) return 8000 - (candidate.length - query.length)
	if (candidate.includes(query)) return 6000 - candidate.indexOf(query) * 20 - (candidate.length - query.length)

	let queryindex = 0
	let firstmatchindex = -1
	let lastmatchindex = -1
	let consecutivebonus = 0
	let previousmatchindex = -2

	for (let ii = 0; ii < candidate.length; ii++) {
		const char = candidate[ii]
		if (char !== query[queryindex]) continue;

		if (firstmatchindex === -1) firstmatchindex = ii
		if (previousmatchindex === ii - 1) consecutivebonus += 25
		previousmatchindex = ii
		lastmatchindex = ii
		queryindex++
		if (queryindex === query.length) {
			const span = lastmatchindex - firstmatchindex
			return 3000 - span * 10 - firstmatchindex * 5 - (candidate.length - query.length) + consecutivebonus
		}
	}

	return -1
}



const normalize_fuzzy_text = (value:string) : string => {
	return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}
