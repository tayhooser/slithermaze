
//function must be async to give us access to await


//Defaults to an official map by Taylor. Query needs to be in key-value pair
//Example: { name: 'Mayflower', author: 'Taylor' }
async function getMap(query = { author: 'Taylor' }) {
    var params = query; 

    
    try {
        var url = new URL('http://slithermaze.com/map'), params;
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    } catch (error) {
        console.error(error);
        console.log("failed to bind parameters to URL. Make sure query is in correct format");

    }

    let returning = await fetch(url).then(res => res.json()).then(data => {
        return data;
    })
    .catch(function(error) {
        throw 500;
    });

    return returning;
}
query = { name: 'Mayflower', author: 'Taylor' };

async function updateBoard(id, name, time) {
    
    fetch("http://slithermaze.com/map", {
    method: "POST",
    body: JSON.stringify({
        id: id,
        name: name,
        time: time
    }),
    headers: {
        "Content-type": "application/json; charset=UTF-8"
    }
    });
}



    
//updateBoard('65a2e95595cc0bf357395887', 'Gonzo', 488)
//Wont work, undefined. getMap returns a promise
//let x = getMap(query);
//console.log(x);

//also wont work. .then() does not block, so its not ready by the time we need to use y
//y = "empty";

getMap(query).then(
    (map) => {
         console.log(map)
    }

    ).catch(function(error) {
        if (error == 500){
            console.log("map not found")
        }
    });






