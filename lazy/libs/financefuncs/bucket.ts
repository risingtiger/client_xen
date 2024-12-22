


//import { num } from "../../../defs_server_symlink.js";
import { AreaT, TransactionT, CatT  } from '../../../defs.js'




function bucket_amount_remainder(area:AreaT, cats:CatT[], cattag:number, transactions:TransactionT[]) : {cat:CatT, remainder:number}[] {
}




export { bucket_amount_remainder }



/*
fill in the `bucket_amount_remainder` function. Returns array of objects of 'cat' and 'remainder'. cat (category) 
 is a reference to CatT. remainder is a number. The 'cats' parameter is an array of all CatT objects, all parents. Each parent contains 'subs' that is child cats of its parent. Flatten the list to ONLY child cats, no need to conta
in reference to parant. The parent cat contains a reference to an area. Make sure to filter OUT any cats that are NOT of the 'area' parameter. Also, filter out any cats that do NOT contain the cattag in its tags property. Once you
 have a list of all child parents that are of 'area', begin to figure out what the remainder of each cat is. The remainder is the amount of a cat's 'bucket' - any transaction amounts that have happened SINCE area['bucketquad'+catt

ag+'_ref_ts timestamp (seconds since EPOCH). Efficiently filter through transactions the best you can, because transactions may contain 10000 or more records. Perhaps try to scope transactions first by area to minimize dataset.
*/
