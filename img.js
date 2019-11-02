const {createCanvas} = require("canvas");
var c = require("canvas");
const axios = require('axios');
const cache = {};

var mapoptions = require("./mapoptions.json");
var width = mapoptions.width;
var height = mapoptions.height;

const download_image = async (url) => {
    let temp = cache[url];
    if (temp == undefined) {
        let response = await axios({
            method: 'get',
            url,
            responseType: 'arraybuffer',
        }); 
        temp = new c.Image();
        temp.src = new Buffer(response.data);
        cache[url] = temp;
    }
    return temp;
}

var biomes = {
    15721648: "desert",
    41704: "ocean",
    2258252: "forest",
    11920925: "plains",
    16744231: "valley",
    16773632: "savannah",
    8355711: "mountains",
    4147404: "snowy",
    8912917: "swamp",
    15539236: "jungle",
    10082794: "taiga",
    12155479: "volcano",
};
var person = null;
var boat = null;
var boattop = null;
var biomeImages = {}

function rivers(map,x,y,px,py,ctx,scale){
    var district = xytodistrict(x,y);

    ctx.drawImage(biomeImages["rivers"],12,12,8,8,(px+0.376)*scale,(py+0.375)*scale,scale*0.25,scale*0.25);

    if(map[district+1].biome == "valley" || map[district+1].biome == "ocean"){
        var i = biomeImages["rivers"];
        ctx.drawImage(i,20,0,12,32,(px+0.5)*scale,py*scale,scale*0.5,scale);
    }

    if(map[district-1].biome == "valley" || map[district-1].biome == "ocean"){
        var i = biomeImages["rivers"];
        ctx.drawImage(i,0,0,12,32,px*scale,py*scale,scale*0.5,scale);
    }

    if(map[district+width].biome == "valley" || map[district+width].biome == "ocean"){
        var i = biomeImages["rivers"];
        ctx.drawImage(i,0,20,32,12,px*scale,(py+0.5)*scale,scale,scale*0.5);
    }

    if(map[district-width].biome == "valley" || map[district-width].biome == "ocean"){
        var i = biomeImages["rivers"];
        ctx.drawImage(i,0,0,32,12,px*scale,py*scale,scale,scale*0.5);
    }
}

function edges(map,x,y,px,py,ctx,scale){
    try{
        var district = xytodistrict(x,y);
        if(map[district].biome != "ocean"){
            if(map[district+1].biome != map[district].biome){
                var i = biomeImages[map[district+1].biome];
                if(map[district+1].biome != "ocean"){
                    ctx.globalAlpha = 0.33;
                    ctx.drawImage(i,16,0,16,32,(px+0.5)*scale,py*scale,scale*0.5,scale);
                    ctx.globalAlpha = 1;
                }
            }

            if(map[district-1].biome != map[district].biome){
                var i = biomeImages[map[district-1].biome];
                if(map[district-1].biome != "ocean"){
                    ctx.globalAlpha = 0.33;
                    ctx.drawImage(i,0,0,16,32,px*scale,py*scale,scale*0.5,scale);
                    ctx.globalAlpha = 1;
                }
            }

            if(map[district+width].biome != map[district].biome){
                var i = biomeImages[map[district+width].biome];
                if(map[district+width].biome != "ocean"){
                    ctx.globalAlpha = 0.33;
                    ctx.drawImage(i,0,16,32,16,px*scale,(py+0.5)*scale,scale,scale*0.5);
                    ctx.globalAlpha = 1;
                }
            }

            if(map[district-width].biome != map[district].biome){
                var i = biomeImages[map[district-width].biome];
                if(map[district-400].biome != "ocean"){
                    ctx.globalAlpha = 0.33;
                    ctx.drawImage(i,0,0,32,16,px*scale,py*scale,scale,scale*0.5);
                    ctx.globalAlpha = 1;
                }
            }

            //beaches
            var beachtype = "beach";
            if(map[district].biome == "mountains" || map[district].biome == "valley"){
                beachtype = "rockbeach";
            }
            if(map[district].biome != "snowy" && map[district].biome != "taiga" && map[district].biome != "swamp"){
                if(map[district+1].biome == "ocean"){
                    var i = biomeImages[beachtype];
                    ctx.drawImage(i,16,0,16,32,(px+0.5)*scale,py*scale,scale*0.5,scale);
                }

                if(map[district-1].biome == "ocean"){
                    var i = biomeImages[beachtype];
                    ctx.drawImage(i,0,0,16,32,px*scale,py*scale,scale*0.5,scale);
                }

                if(map[district+width].biome == "ocean"){
                    var i = biomeImages[beachtype];
                    ctx.drawImage(i,0,16,32,16,px*scale,(py+0.5)*scale,scale,scale*0.5);
                }

                if(map[district-width].biome == "ocean"){
                    var i = biomeImages[beachtype];
                    ctx.drawImage(i,0,0,32,16,px*scale,py*scale,scale,scale*0.5);
                }
            }
        }
    }catch(err){}
}

async function load(){
    person = await c.loadImage('./humanperson.png');
    boat = await c.loadImage('./hdboat.png');
    boattop = await c.loadImage('./hdboattop.png');
    biomeImages["mountains"] = await c.loadImage('./images/mountain.png');
    biomeImages["forest"] = await c.loadImage('./images/forest.png');
    biomeImages["plains"] = await c.loadImage('./images/plains.png');
    biomeImages["savannah"] = await c.loadImage('./images/savannah.png');
    biomeImages["volcano"] = await c.loadImage('./images/valcano.png');
    biomeImages["taiga"] = await c.loadImage('./images/tigia.png');
    biomeImages["snowy"] = await c.loadImage('./images/snowy.png');
    biomeImages["jungle"] = await c.loadImage('./images/jungle.png');
    biomeImages["ocean"] = await c.loadImage('./images/ocean.png');
    biomeImages["valley"] = await c.loadImage('./images/valley.png');
    biomeImages["swamp"] = await c.loadImage('./images/swamp.png');
    biomeImages["desert"] = await c.loadImage('./images/desert.png');
    biomeImages["beach"] = await c.loadImage('./images/beach.png');
    biomeImages["rivers"] = await c.loadImage('./images/rivers.png');
    biomeImages["rockbeach"] = await c.loadImage('./images/rockbeach.png');
}


load();
function xytodistrict(x,y){
    return (y*width)+x;
}

function districttoxy(num){
    return [num%width,Math.floor(num/width)];
}

var colors = {};
async function getImage(url){
    return await c.loadImage(url);
}
for(var k in biomes){
    colors[biomes[k]] = numToHex(k);
}
module.exports = async function imgmap(cx,cy, scale, radius, map, people, client, id){
    if(radius > 100 || scale > 1000){
        radius = 100;
        scale = 1000
    }
    var img = createCanvas(radius * 2 * scale,radius * 2 * scale) //find something to make canvas
    var ctx = img.getContext("2d") // get canvas context 
    ctx.font = scale + "px Serif";
    var px = 0;
    var py = 0;
    for(var y = cy-radius; y < cy+radius;y++){
        for(var x = cx-radius; x < cx+radius;x++){
            var here = xytodistrict(x,y);
            if(map[here] == null){
                ctx.fillStyle = "#000000"
                ctx.fillRect(px * scale, py*scale, scale, scale);
                continue;
            }
            let biome = map[here].biome;
            if(biomeImages[biome] != null){
                var tempimage = biomeImages[biome];
                ctx.drawImage(tempimage,px * scale, py * scale, scale, scale);
            }else{
                ctx.fillStyle = colors[biome] === undefined ? "#000000" : colors[biome];
                ctx.fillRect(px * scale, py * scale, scale, scale);
            }
            edges(map,x,y,px,py,ctx,scale);
            if(biome == "valley"){
                rivers(map,x,y,px,py,ctx,scale);
            }
            px++;
        }
        px = 0;
        py++;
    }
    let promises = Object.entries(people).filter(a => a[0] != id).map(([k,p]) => {
        return doDraw(k);
    });
    await Promise.all(promises);
    await doDraw(id);
    async function doDraw(k) {
        var here = districttoxy(people[k].district);
        
        var x = here[0];
        var y = here[1];
        x = x - cx + radius;
        y = y - cy + radius;
        if(people[k].avatarURL == null || people[k].avatarURL == "./humanperson.png") {
            let user = await client.fetchUser(people[k].id);
            people[k].avatarURL = user.avatarURL;
        }
        if(x * scale < img.width && x * scale > 0 && y * scale < img.height && y * scale > 0) {
            let avatar;
            try {
                avatar = await download_image(people[k].avatarURL)
            }
            catch(e) {
                avatar = person
            }
            if(map[people[k].district].biome == "ocean"){
                ctx.drawImage(boat,x * scale, y * scale,scale,scale);
                ctx.drawImage(avatar,(x * scale)+((scale * 0.33)/2), y * scale,scale*0.67,scale*0.67);
                ctx.drawImage(boattop,x * scale, y * scale,scale,scale);
            }else{
                ctx.drawImage(avatar,(x * scale) + (scale * 0.1), (y * scale) + (scale *0.1 ),scale*0.8,scale*0.8);
            }
        }
    }
    return img.createPNGStream();//("image/png",{ compressionLevel: 3, filters: img.PNG_FILTER_NONE });
}



/**
 * 
 * @param {string} hex
 */
function hexToNum(hex)
{
    if (hex[0] == "#")
    {
        hex = hex.substr(1);
    }
    return parseInt(hex, 16);
}
function rgbToNum(r,g,b)
{
    return (r << 16) | (g << 8) | b;
}
function numToRgb(num)
{
    return [(num >>> 16) & 0xFF, (num >>> 8) & 0xFF, num & 0xFF]
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
  
function numToHex(num) {
    let rgb = numToRgb(num);
    return rgbToHex(rgb[0], rgb[1], rgb[2]);
}