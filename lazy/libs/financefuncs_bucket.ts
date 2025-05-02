


//import { num } from "../../../defs_server_symlink.js";
import { AreaT, TransactionT, CatT, CatBucketsInfoT, AreaQuadBucketTotalsT  } from '../../defs.js'





function cat_buckets_info(area:AreaT, cats:CatT[], transactions:TransactionT[]) : CatBucketsInfoT[] {

	const refquad3_ts = area.bucketquad3_ref_ts
	const refquad4_ts = area.bucketquad4_ref_ts

	const tr = [
		transactions.filter(txn => txn.arearef === area && txn.date >= refquad3_ts),
		transactions.filter(txn => txn.arearef === area && txn.date >= refquad4_ts),
	]

	// only subcats and ones that are of quad3 or quad4 and of this specific area
	const allsubcats = cats.filter(c=>c.arearef===area).flatMap(cat => cat.subsref ? cat.subsref : []).filter(cat => { 
		if (cat.tags[0] < 3 || cat.tags[0] > 4) return false   
		if (cat.bucket === null)                return false
		if (cat.bucket === 0)                   return false
		return true
	});

	const info:CatBucketsInfoT[] = allsubcats.map(cat => {
		const spent       = tr[cat.tags[0] - 3].filter(t=>t.catref === cat).reduce((acc, txn) => acc + txn.amount, 0);
		const remainder   = cat.bucket! - spent
		return { catref:cat, spent: Math.round(spent), remainder: Math.round(remainder) }
	})

	return info
}




function area_quad_bucket_totals(area:AreaT, catbuckets:CatBucketsInfoT[], quad:number) : AreaQuadBucketTotalsT {
	const filtered_catbucket = catbuckets.filter(({catref}) => catref.tags[0] === quad)
	const spent      = filtered_catbucket.reduce((acc, {spent}) => acc + (spent || 0), 0)
	const remainder  = area['bucketquad'+quad] - spent
	const assigned   = filtered_catbucket.reduce((acc, {catref}) => acc + (catref.bucket || 0), 0)
	const unassigned = area['bucketquad'+quad] - assigned

	return { remainder, spent, assigned, unassigned }
}




function cat_bucket_remainder(area:AreaT, cat:CatT, transactions:TransactionT[]) : number {

	if (cat.tags.length === 0 || cat.tags[0] < 3 || cat.tags[0] > 4) {
		return 0;
	}

    const ref_ts_key = `bucketquad${cat.tags[0]}_ref_ts` as keyof AreaT;
    let ref_ts = area[ref_ts_key] as number;

    const filteredTransactions = transactions.filter(txn =>
        txn.arearef === area && 
        txn.ts >= ref_ts && 
        txn.catref.id === cat.id
    );

    const totalSpent = filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    
    return Math.round((cat.bucket || 0) - totalSpent);
}

export { cat_buckets_info, cat_bucket_remainder, area_quad_bucket_totals }
