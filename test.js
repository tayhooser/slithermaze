
//function must be async to give us access to await
async function getMap(query = { author: 'Taylor' }) {
    var params = query; 

    //irrelevant to the promise issue, ignore this block
    try {
        var url = new URL('http://164.90.146.219:5000'), params;
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    } catch (error) {
        console.error(error);
        console.log("failed to bind parameters to URL. Make sure query is in correct format");

    }

    //await blocks the fetch() until its done, allowing us to actually print its value. Only possible because entire function is labelled "async"
    //without async, wouldnt be able to remove data from the .then().
    let returning = await fetch(url).then(res => res.json()).then(data => {
        return data;
    });

    //prints okay, value removed from .then()
    console.log(returning);
    //because function is asyncronous, returns a promise instead of a value". 
    return returning;
}
query = { name: 'Mayflower', author: 'Taylor' };

//Wont work, undefined. getMap returns a promise
//let x = getMap(query);
//console.log(x);

//also wont work. .then() does not block, so its not ready by the time we need to use y
var y = "not done yet";
getMap(query).then(map => y = map);
console.log(y);

//Maybe pull all of map into variables, and do it pretty early on? 
//Could also make the function the render function or whatever calls this async. Might cause problems though, we would need to test.




