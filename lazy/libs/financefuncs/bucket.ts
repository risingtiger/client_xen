


//import { num } from "../../../defs_server_symlink.js";
import { AreaT, TransactionT, CatT  } from '../../../defs.js'




function flattenCats(cats: CatT[]): CatT[] {
    const result: CatT[] = [];
    function helper(cat: CatT) {
        if (cat.subs && cat.subs.length > 0) {
            for (const sub of cat.subs) {
                helper(sub);
            }
        } else {
            result.push(cat);
        }
    }
    for (const cat of cats) {
        helper(cat);
    }
    return result;
}

function bucket_amount_remainder(area:AreaT, cats:CatT[], cattag:number, transactions:TransactionT[]) : {cat:CatT, remainder:number}[] {
    // Flatten and filter categories
    const childCats = flattenCats(cats);
    const filteredCats = childCats.filter(cat =>
        cat.area.id === area.id && cat.tags.includes(cattag)
    );

    // Create set of filtered category IDs for efficient lookup
    const catIdSet = new Set(filteredCats.map(cat => cat.id));

    // Get reference timestamp from area
    const ref_ts_key = `bucketquad${cattag}_ref_ts` as keyof AreaT;
    const ref_ts = area[ref_ts_key] as number;

    // Filter transactions by area and timestamp
    const filteredTransactions = transactions.filter(txn =>
        txn.area.id === area.id && txn.ts >= ref_ts
    );

    // Sum transaction amounts for each category
    const catSums: { [catId: string]: number } = {};
    for (const txn of filteredTransactions) {
        const catId = txn.cat.id;
        if (catIdSet.has(catId)) {
            catSums[catId] = (catSums[catId] || 0) + txn.amount;
        }
    }

    // Calculate remainder for each filtered category
    return filteredCats.map(cat => ({
        cat,
        remainder: (cat.bucket || 0) - (catSums[cat.id] || 0)
    }));
}




export { bucket_amount_remainder }



/*
fill in the `bucket_amount_remainder` function. Returns array of objects of 'cat' and 'remainder'. cat (category) 
 is a reference to CatT. remainder is a number. The 'cats' parameter is an array of all CatT objects, all parents. Each parent contains 'subs' that is child cats of its parent. Flatten the list to ONLY child cats, no need to conta
in reference to parant. The parent cat contains a reference to an area. Make sure to filter OUT any cats that are NOT of the 'area' parameter. Also, filter out any cats that do NOT contain the cattag in its tags property. Once you
 have a list of all child parents that are of 'area', begin to figure out what the remainder of each cat is. The remainder is the amount of a cat's 'bucket' - any transaction amounts that have happened SINCE area['bucketquad'+catt

ag+'_ref_ts timestamp (seconds since EPOCH). Efficiently filter through transactions the best you can, because transactions may contain 10000 or more records. Perhaps try to scope transactions first by area to minimize dataset.
*/
