const fs = require('fs');

function Save(fileName,json){
    const data = JSON.stringify(json);
    fs.writeFileSync(fileName,data,(err)=>{});
}

function Load(fileName){
    const data = fs.readFileSync(fileName);
    const json =  JSON.parse(data.toString());
    return json;
}

module.exports = {
    Save,
    Load
}