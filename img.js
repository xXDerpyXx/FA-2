const {createCanvas} = require("canvas");
var c = require("canvas");
const axios = require('axios');

const download_image = (url) =>
  axios({
    method: 'get',
    url: url,
    responseType: 'arraybuffer',
  }).then(
    (response) =>
      {
        var temp = new c.Image();
        temp.src = new Buffer(response.data)
          return temp;
      }
  );

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
async function load(){
    person = await c.loadImage('./humanperson.png');
    boat = await c.loadImage('./humanpersoninboat.png');
    boattop = await c.loadImage('./boattop.png');
}




load();
function xytodistrict(x,y){
    return (y*400)+x;
}

function districttoxy(num){
    return [num%400,Math.floor(num/400)];
}

var colors = {};
/*
Object.entries(biomes).map(a => [a[1], parseInt(a[0])]).forEach(e => {
    colors[e[0]] = e[1];
});
*/
async function getImage(url){
    return await c.loadImage(url);
}
for(var k in biomes){
    colors[biomes[k]] = numToHex(k);
}
module.exports = async function imgmap(cx,cy, scale, radius, map,people){
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
            ctx.fillStyle = colors[biome] === undefined ? "#000000" : colors[biome];
            ctx.fillRect(px * scale, py * scale, scale, scale);
            /*if(x == cx && y == cy){
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("☺", px * scale, (py+1) * scale);
                ctx.fillStyle = "#000000";
                ctx.fillText("☺", (px * scale)+2, ((py+1) * scale)+2);
            }*/
            px++;
        }
        px = 0;
        py++;
    }

    for(var k in people){
        here = districttoxy(people[k].district);
        
        var x = here[0];
        var y = here[1];
        x = x - cx + radius;
        y = y - cy + radius;
        if(map[people[k].district].biome == "ocean"){
            if(people[k].avatarURL == null || people[k].avatarURL == "./humanperson.png")
                ctx.drawImage(boat,x * scale, y * scale,scale,scale);
            else{
                console.log(people[k].avatarURL);
                await download_image(people[k].avatarURL).then((avatar) => {
                    console.log(avatar);
                    ctx.drawImage(boat,x * scale, y * scale,scale,scale);
                    ctx.drawImage(avatar,(x * scale)+((scale * 0.33)/2), y * scale,scale*0.67,scale*0.67);
                    ctx.drawImage(boattop,x * scale, y * scale,scale,scale);
                }).catch((err) => console.log(err));
                
            }
            
        }else{
            if(x * scale < img.width && x * scale > 0 && y * scale < img.height && y * scale > 0){
                if(people[k].avatarURL == null || people[k].avatarURL == "./humanperson.png")
                    ctx.drawImage(person,x * scale, y * scale,scale,scale);
                else{
                    console.log(people[k].avatarURL);
                    await download_image(people[k].avatarURL).then((avatar) => {
                        console.log(avatar);
                        ctx.drawImage(avatar,x * scale, y * scale,scale,scale);
                    }).catch((err) => console.log(err));
                    
                }
            }
        }
        
        //ctx.fillStyle = "#FFFFFF";
        //ctx.fillText("☺", x * scale, y * scale);
        //ctx.fillStyle = "#000000";
        //ctx.fillText("☺", (x * scale)+2, (y * scale)+2);
    }
    return img.createPNGStream()//("image/png",{ compressionLevel: 3, filters: img.PNG_FILTER_NONE });
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