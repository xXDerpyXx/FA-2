const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
var prefix = "$";
var people = require("./people.json");
var imgobj = require("./imgobj.js");
var mapmagic = require("./img.js");
var buildings = require("./buildings.json");


function xytodistrict(x,y){
    return (y*400)+x;
}

function districttoxy(num){
    return [num%400,Math.floor(num/400)];
}

function stringmap(cx,cy,size){
    var temp = "```\n";
    for(var y = cy-size; y < cy+size;y++){
        for(var x = cx-size; x < cx+size;x++){
            var here = xytodistrict(x,y);
            if(map[here] == null){
                temp+="x";
            }
            else if(x == cx && y == cy){
                temp += "☺"
            }else if(map[here].biome == "ocean"){
                temp += "~";
            }else if(map[here].biome == "mountains"){
                temp += "⋀";
            }else if(map[here].biome == "forest"){
                temp += "f";
            }else{
                temp += map[here].biome.charAt(0);
            }
        }
        temp+="\n";
    }
    return temp + "```";
}

//var biomes = {15721648:"desert",8355711:"mountain"};
imgobj("./map.png", function(rgbs)
{
    for(i = 0; i < rgbs.length; i++)
    {
        var r = rgbs[i][0];
        var g = rgbs[i][1];
        var b = rgbs[i][2];
        
        if(r == 239 && g == 228 && b == 176){
            map[i] = new District(i,[],"desert")
        }

        if(r == 0 && g == 162 && b == 232){
            map[i] = new District(i,[],"ocean")
        }

        if(r == 34 && g == 177 && b == 76){
            map[i] = new District(i,[],"forest")
        }

        if(r == 181 && g == 230 && b == 29){
            map[i] = new District(i,[],"plains")
        }

        if(r == 255 && g == 127 && b == 39){
            map[i] = new District(i,[],"valley")
        }

        if(r == 255 && g == 242 && b == 0){
            map[i] = new District(i,[],"savannah")
        }
        if(r == 127 && g == 127 && b == 127){
            map[i] = new District(i,[],"mountains")
        }

        if(r == 185 && g == 122 && b == 87){
            map[i] = new District(i,[],"valcano")
        }

        if(r == 63 && g == 72 && b == 204){
            map[i] = new District(i,[],"snowy")
        }

        if(r == 136 && g == 0 && b == 21){
            map[i] = new District(i,[],"swamp")
        }

        if(r == 237 && g == 28 && b == 36){
            map[i] = new District(i,[],"jungle")
        }

        if(r == 153 && g == 217 && b == 234){
            map[i] = new District(i,[],"taiga")
        }
        if(map[i] == undefined){
            map[i] = new District(i,[],"ocean")
        }

        map[i].neighbors.push(i-1);
        map[i].neighbors.push(i+1);
        if(i < 39600)
            map[i].neighbors.push(i+400);
        if(i > 400)
            map[i].neighbors.push(i-400);
    }
});

function peopleInDistrict(d){
    var output = [];
    for(var k in people){
        if(people[k].district == d){
            output.push(k);
        }
    }
    return output;
}

var mappng = null;
var recipes = require("./recipes.json");
console.log("making map");
//var map = imgobj.imageToObj("./map.png",biomes)
console.log("map made");

function arraysEqual(_arr1, _arr2) {
    if (!Array.isArray(_arr1) || ! Array.isArray(_arr2) || _arr1.length !== _arr2.length)
      return false;
    var arr1 = _arr1.concat().sort();
    var arr2 = _arr2.concat().sort();
    for (var i = 0; i < arr1.length; i++) {

        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

function save(){
    let data = JSON.stringify(people);
    fs.writeFileSync('people.json', data);
    data = JSON.stringify(buildings);
    fs.writeFileSync('buildings.json', data);
}

class District
{
    /**
     * 
     * @param {number} id
     * @param {number[]} neighbor
     */
    constructor(id, neighbors,biome)
    {
        this.id = id;
        this.neighbors = neighbors;
        this.biome = biome;
        this.infrastructure = 0;
    }
}

class Item
{
    /**
     * 
     * @param {boolean|undefined} stackable 
     * @param {string} name
     */
    constructor(stackable, name)
    {
        this.type = "item";
        if (stackable === undefined)
            this.stackable = true;
        this.name = name;
    }
}

class Tool extends Item
{
    /**
     * 
     * @param {boolean|undefined} stackable
     * @param {number} durability
     * @param {function(number):string} loot loottable
     * @param {string} biomeNeeded
     * @param {number} foodPerUse
     */
    constructor(stackable, name, durability, loot, biomeNeeded, foodPerUse)
    {
        super(stackable, name)
        this.type = "tool";
        this.durability = durability;
        this.lootTable = loot;
        this.biomeNeeded = biomeNeeded;
        this.foodUse = foodPerUse;
    }
}

class Food extends Item
{
    /**
     * 
     * @param {boolean|undefined} stackable 
     * @param {string} name 
     * @param {number} replenishAmt 
     */
    constructor(stackable, name, replenishAmt)
    {
        super(stackable, name);
        this.type = "food";
        this.replenishAmt = replenishAmt;
    }
}

class Vehicle extends Item
{
    /**
     * 
     * @param {boolean|undefined} stackable 
     * @param {string} name 
     * @param {boolean} water 
     * @param {boolean} land 
     * @param {number} fuelUsedPerTile 
     * @param {boolean} roadOnly 
     * @param {number} cooldown cooldown between uses
     * @param {number} foodPerTile food used per tile
     * @param {number} danger 0-1 decimal chance in unclaimed tiles
     */
    constructor(stackable, name, water, land, fuelUsedPerTile, roadOnly, cooldown, foodPerTile, danger)
    {
        super(stackable, name);
        this.type = "vehicle";
        this.canWater = water;
        this.canLand = land;
        this.fuelUse = fuelUsedPerTile;
        this.roadOnly = roadOnly;
        this.cooldown = cooldown;
        this.foodUse = foodPerTile;
        this.dangerChance = danger;
        this.movementOverride = null;
    }
}

class Resource extends Item
{
    constructor(stackable, name)
    {
        super(stackable, name);
        this.type = "resource";
    }
}



function hasItems(inv,parts,msg){
    var tinv = {};
    Object.assign(tinv,inv);
    for(var i = 0; i < parts.length; i++){
        tinv[parts[i]]--;
        if(tinv[parts[i]] < 0){
            msg.channel.send("you dont have enough "+parts[i]+" for that");
            return false;
        }
    }
    return true;
}

function randOre(biome){
    if(biome == "desert"){
        if(Math.random() < 0.01){
            return "diamond";
        }else if(Math.random() < 0.05){
            return "gold_ore";
        }else if(Math.random() < 0.2){
            return "copper_ore";
        }else if(Math.random() < 0.5){
            return "sand";
        }else{
            return "sandstone";
        }
    }

    if(biome == "jungle"){
        if(Math.random() < 0.05){
            return "jade";
        }else if(Math.random() < 0.1){
            return "gold_ore";
        }else if(Math.random() < 0.1){
            return "copper_ore";
        }else if(Math.random() < 0.5){
            return "rock";
        }else{
            return "rock";
        }
    }

    if(biome == "plains"){
        if(Math.random() < 0.01){
            return "gold_ore";
        }else if(Math.random() < 0.1){
            return "tin_ore";
        }else if(Math.random() < 0.3){
            return "copper_ore";
        }else if(Math.random() < 0.5){
            return "iron_ore";
        }else{
            return "rock";
        }
    }

    if(biome == "forest"){
        if(Math.random() < 0.01){
            return "gold_ore";
        }else if(Math.random() < 0.1){
            return "tin_ore";
        }else if(Math.random() < 0.3){
            return "copper_ore";
        }else if(Math.random() < 0.8){
            return "coal";
        }else{
            return "rock";
        }
    }

    if(biome == "mountains"){
        if(Math.random() < 0.01){
            return "gold_ore";
        }else if(Math.random() < 0.5){
            return "iron_ore";
        }else if(Math.random() < 0.1){
            return "copper_ore";
        }else if(Math.random() < 0.8){
            return "coal";
        }else{
            return "rock";
        }
    }

    if(biome == "valley"){
        if(Math.random() < 0.02){
            return "gold_ore";
        }else if(Math.random() < 0.25){
            return "saltpeter";
        }else if(Math.random() < 0.3){
            return "copper_ore";
        }else if(Math.random() < 0.5){
            return "coal";
        }else if(Math.random() < 0.05){
            return "quartz";
        }else{
            return "rock";
        }
    }

    if(biome == "valcano"){
        if(Math.random() < 0.05){
            return "gold_ore";
        }else if(Math.random() < 0.5){
            return "sulfur";
        }else{
            return "obsidian";
        }
    }
}

function randGather(biome){
    var output = [];
    if(biome == "jungle"){ 
        if(Math.random() > 0.25){
            output[0] = "cocoa_beans";
            output[1] = "you find some cocoa beans in some trees";
        }else if(Math.random() > 0.5){
            output[0] = "berry";
            output[1] = "you find a berry on a bush";
        }else if(Math.random() > 0.5){
            output[0] = "orange";
            output[1] = "you find an orange in the trees";
        }else{
            output[0] = "rice";
            output[1] = "you find rice in a marsh";
        }
    }else if(biome == "plains"){
        if(Math.random() > 0.5){
            output[0] = "corn";
            output[1] = "you find corn in a field";
        }else{
            output[0] = "wheat";
            output[1] = "you find a wheat in a field";
        }
    }else if(biome == "savannah"){
        output[0] = "wheat";
        output[1] = "you find a wheat in a field";
    }else if(biome == "swamp"){
        if(Math.random() > 0.75){
            output[0] = "onion";
            output[1] = "you find an onion in the ground";
        }else if(Math.random() > 0.5){
            output[0] = "peanuts";
            output[1] = "you find peanuts on a bush";
        }else if(Math.random() > 0.5){
            output[0] = "root";
            output[1] = "you find a root in the ground";
        }else{
            output[0] = "sugar_cane";
            output[1] = "you find sugar cane on a shore";
        }
    }else if(biome == "forest"){
        if(Math.random() > 0.25){
            output[0] = "berry";
            output[1] = "you find a berry on a bush";
        }else if(Math.random() > 0.5){
            output[0] = "corn";
            output[1] = "you find corn in a clearing";
        }else{
            output[0] = "apple";
            output[1] = "you find an apple in the trees";
        }
    }else if(biome == "desert"){
        output[0] = "cactus";
        output[1] = "you find a cactus in the middle of nowhere";
    }else if(biome == "valley"){
        output[0] = "berry";
        output[1] = "you find a berry on a bush";
    }else{
        return null;
    }
    return output;
}

var items = {};
items["log"] = new Resource(true,"log");
items["rock"] = new Resource(true,"rock");
items["sand"] = new Resource(true,"sand");
items["glass"] = new Resource(true,"glass");
items["glass_tank"] = new Resource(true,"glass_tank");
items["sandstone"] = new Resource(true,"sandstone");
items["gold_ore"] = new Resource(true,"gold_ore");
items["iron_ore"] = new Resource(true,"iron_ore");
items["copper_ore"] = new Resource(true,"copper_ore");
items["tin_ore"] = new Resource(true,"tin_ore");
items["coal"] = new Resource(true,"coal");
items["charcoal"] = new Resource(true,"charcoal");
items["wheat"] = new Resource(true,"wheat");
items["dough"] = new Resource(true,"dough");
items["flour"] = new Resource(true,"flour");
items["iron_plate"] = new Resource(true,"iron_plate");
items["gold_coin"] = new Resource(true,"gold_coin");
items["boiler"] = new Resource(true,"boiler");
items["steam_engine"] = new Resource(true,"steam_engine");
items["quartz"] = new Resource(true,"quartz");
items["gold_ingot"] = new Resource(true,"gold_ingot");
items["iron_ingot"] = new Resource(true,"iron_ingot");
items["copper_ingot"] = new Resource(true,"copper_ingot");
items["tin_ingot"] = new Resource(true,"tin_ingot");
items["water"] = new Resource(true,"water");
items["bronze_ingot"] = new Resource(true,"bronze_ingot");
items["crude_oil"] = new Resource(true,"crude_oil");
items["sulfur"] = new Resource(true,"sulfur");
items["obsidian"] = new Resource(true,"obsidian");
items["tears"] = new Resource(true,"tears");
items["salt"] = new Resource(true,"salt");
items["saltpeter"] = new Resource(true,"saltpeter");
items["gunpowder"] = new Resource(true,"gunpowder");



items["worktable"] = new Resource(true,"worktable");
items["furnace"] = new Resource(true,"furnace");
items["carbonator"] = new Resource(true,"carbonator");
items["hammer"] = new Resource(true,"hammer");

items["row_boat"] = new Vehicle(false,"row_boat",true,false,0,false,0,5,0.01);
items["steam_boat"] = new Vehicle(false,"steam_boat",true,false,0,false,0,1,0.01);
items.steam_boat.movementOverride = function(person,msg){
    var content = msg.content.split(" ");
    var destination = parseInt(content[2]);
    while(person.district != destination && person.hunger > 0){
        var here = districttoxy(person.district);
        var there = districttoxy(destination);
        person.hunger -= this.foodUse;
        var newSpot = person.district;
        try{
            if(there[0] > here[0]){
                newSpot = xytodistrict(here[0]+1,here[1]);
            }else if(there[0] < here[0]){
                newSpot = xytodistrict(here[0]-1,here[1]);
            }else if(there[1] > here[1]){
                newSpot = xytodistrict(here[0],here[1]+1);
            }else if(there[1] < here[1]){
                newSpot = xytodistrict(here[0],here[1]-1);
            }
            if(map[newSpot].biome == "ocean"){
                person.district = newSpot;
            }else{
                msg.channel.send("you've hit land!");
                return person;
            }
        }catch(err){
            msg.channel.send("you've reached the pole!");
            return person;
        }
    }
    msg.channel.send("you travel for a while, and you've reached "+person.district);
    return person;
};

items.row_boat.movementOverride = items.steam_boat.movementOverride;

items["cocoa_beans"] = new Food(true,"cocoa_beans",7)
items["root"] = new Food(true,"root",10)
items["corn"] = new Food(true,"corn",7)
items["rice"] = new Food(true,"rice",7)
items["peanuts"] = new Food(true,"peanuts",10)
items["peanut_butter"] = new Food(true,"peanut_butter",15)
items["jelly"] = new Food(true,"jelly",15)
items["pbj"] = new Food(true,"pbj",50)
items["apple_sauce"] = new Food(true,"apple_sauce",40)
items["caramel_apple"] = new Food(true,"caramel_apple",50)

items["sugar_cane"] = new Food(true,"sugar_cane",5)
items["sugar"] = new Food(true,"sugar",7)
items["beans"] = new Food(true,"beans",5)
items["onion"] = new Food(true,"onion",5)
items["carrot"] = new Food(true,"carrot",7)
items["caramel "] = new Food(true,"caramel ",15)
items["ginger_tea"] = new Food(true,"ginger_tea",25)
items["berry"] = new Food(true,"berry",10)
items["apple"] = new Food(true,"apple",15)
items["orange"] = new Food(true,"orange",17)
items["orange_juice"] = new Food(true,"orange_juice",40)
items["apple_juice"] = new Food(true,"apple_juice",35)
items["berry_juice"] = new Food(true,"berry_juice",30)

items["cactus"] = new Food(true,"cactus",3)
items["cactus_juice"] = new Food(true,"cactus_juice",15)
items["bread"] = new Food(true,"bread",20)
items["berry_pie"] = new Food(true,"berry_pie",50)
items["apple_pie"] = new Food(true,"apple_pie",60)
items["fizzy_water"] = new Food(true,"fizzy_water",10)
items["fruit_soda"] = new Food(true,"fruit_soda",60)
items["ginger_ale"] = new Food(true,"ginger_ale",40)
items["berry_soda"] = new Food(true,"berry_soda",30)
items["apple_soda"] = new Food(true,"apple_soda",40)
items["cactus_soda"] = new Food(true,"cactus_soda",50)
items["orange_soda"] = new Food(true,"orange_soda",50)


items["oil_rig"] = new Tool(false,"oil_rig",50, function(id,msg){
    if(people[id].inventory["bucket"] != null && people[id].inventory["coal"] != null){
        if(people[id].inventory["bucket"] > 0 && people[id].inventory["coal"] > 0){
            if(map[people[id].district].biome == "desert"){
                msg.channel.send("you yoinked an oil");
                people[id].inventory["bucket"]--;
                people[id].inventory["coal"]--;
                return "crude_oil";
            }else{
                msg.channel.send("this isn't a desert");
                return null;
            }
        }
    }
    msg.channel.send("you need a bucket and coal!");
    return null;
        

},"desert",5);

items["stone_pickaxe"] = new Tool(false,"stone_pickaxe",50, function(id,msg){
    if(Math.random() < 0.9){
        msg.channel.send("you dug up a rock");
        return "rock";
    }else{
        var ore = randOre(map[id].biome);
        msg.channel.send("you dug up "+ore);
        return ore;
    }
},"any",5);

items["bucket"] = new Tool(false,"bucket",20, function(id,msg){
    msg.channel.send("you got some water");
    return "water";
},"any",5);

items["copper_pickaxe"] = new Tool(false,"copper_pickaxe",200, function(id,msg){
    if(Math.random() < 0.5){
        msg.channel.send("you dug up a rock");
        return "rock";
    }else{
        var ore = randOre(map[id].biome);
        msg.channel.send("you dug up "+ore);
        return ore;
    }
},"any",5);

items["bronze_pickaxe"] = new Tool(false,"bronze_pickaxe",500, function(id,msg){
    if(Math.random() < 0.3){
        msg.channel.send("you dug up a rock");
        return "rock";
    }else{
        var ore = randOre(map[id].biome);
        msg.channel.send("you dug up "+ore);
        return ore;
    }
},"any",2);

map = [];/*
map[0] = new District(0,[1,2,3,4],"desert");
map[1] = new District(0,[0,2,3],"forest");
map[2] = new District(0,[1,3,0,4],"plains");
map[3] = new District(0,[0,1,2],"jungle");
map[4] = new District(0,[0,2],"mountains");
*/
class Person 
{   
    /**
     * 
     * @param {number} district 
     * @param {Object<string,number>} inventory 
     * @param {string} nationality 
     */
    constructor(district, id, nationality)
    {
        this.id = id;
        this.district = district;
        this.inventory = {};
        this.nationality = nationality;
        this.hunger = 100;
    }

    /**
     * 
     * @param {string} name 
     * @param {number|undefined} count
     */
    addItem(name, count)
    {
        if (this.inventory[name] == undefined)
        {
            this.inventory[name] = count;
        }
        else this.inventory[name]+=count;
    }

    /**
     * 
     * @param {string} name 
     * @param {number|undefined} count 
     */
    removeItem(name, count)
    {
        if (this.inventory[name] !== undefined)
        {
            if (this.inventory[name] < count) return false;
            if (this.inventory[name] >= count) 
            {
                this.inventory[name] -= count === undefined ? 1 : count;
                if(this.inventory[name] == 0) {
                    delete this.inventory[name];
                }
                return true;
            }
        }
    }
}

for(var k in people){
    people[k].addItem = function(name, count)
    {
        if (this.inventory[name] == undefined)
        {
            this.inventory[name] = count;
        }
        else this.inventory[name]+=count;
    }
    for(var i in people[k].inventory){
        if(people[k].inventory[i] == undefined){
            people[k].inventory[i] = 0;
        }
    }
}

client.on('message', msg => {
    try{
        if(msg.author.id == 499635978223353877){
            return;
        }
        var content = msg.content.split(" ");
        var id = msg.author.id;
        
        if(content[0] == prefix+"xy"){
            if(content[1] != null && content[2] != null){
                var x = parseInt(content[1]);
                var y = parseInt(content[2]);
                console.log("("+x+","+y+")");
                msg.channel.send("that district is district #"+(x+Math.floor(y*400)));
            }else{
                msg.channel.send("you need to specify an x and y, "+prefix+" [x] [y]");
            }
        }

        if(content[0] == prefix+"invite"){
            msg.channel.send("https://discordapp.com/oauth2/authorize?client_id=499635978223353877&scope=bot&permissions=0");
        }
        
        
        
        if(people[msg.author.id] == null){
            if(content[0] == prefix+"join"){
                if(content[1] != null && map[content[1]] != null){
                    if(map[content[1]].biome != "ocean"){
                        people[msg.author.id] = new Person(parseInt(content[1]),msg.author.id,"");
                        msg.channel.send("you have been born! welcome to the world! you are in district "+content[1]+", a "+map[content[1]].biome);
                    }else{
                        msg.channel.send("that be ocean, you cant start there");
                    }

                }else{
                    msg.channel.send("you need to pick a district to start in, use $xy and map coordinates to get the district number");
                }
            }
            
        }else{

            if(id == 246589957165023232){
                if(content[0] == prefix+"add"){
                    if(content[1] != null && content[2] != null){
                        people[id].addItem(content[2],parseInt(content[1]));
                        msg.channel.send("given item");
                    }
                }
            }
            if(people[id].district == null){
                if(content[0] == prefix+"join"){
                    if(content[1] != null && map[content[1]] != null){
                        people[msg.author.id].district = parseInt(content[1]);
                        msg.channel.send("you have been born! welcome to the world! you are in district "+content[1]+", a "+map[content[1]].biome);
                    }else{
                        msg.channel.send("you need to pick a district to start in, use $xy and map coordinates to get the district number");
                    }
                }
                return;
            }
            var biome = map[people[id].district].biome;

            if(content[0] == prefix+"say"){
                var list = peopleInDistrict(people[id].district);
                for(var  i = 0; i < list.length; i++){
                    client.users.get(list[i]).send(msg.author.tag+": "+msg.content.substring(4));
                }
            }

            if(content[0] == prefix+"die"){
                delete people[id];
                msg.channel.send("oh no, you died, oof");
            }

            if(content[0] == prefix+"top"){
                var temp = "";
                var list = [];
                for(var k in people){
                    if(people[k].inventory["gold_coin"] != null){
                        var t = {};
                        t.name = client.users.find("id",k).tag;
                        t.value = people[k].inventory["gold_coin"];
                        list.push(t);
                    }
                }


                for(var i = 0; i < list.length; i++){
                    for(var j = 0; j < list.length-1; j++){
                        if(list[j].value < list[j+1].value){
                            var l = list[j];
                            list[j] = list[j+1];
                            list[j+1] = l;
                        }
                    }
                }

                for(var i = 1; i < list.length; i++){
                    temp += list[i].name+": "+list[i].value+"\n";
                }

                msg.channel.send("The richest person alive: "+list[0].name+", with "+list[0].value+" gold\nand the peasants:\n"+temp);
            }

            if(content[0] == prefix+"search"){
                if(msg.mentions.members.first() == null){
                    msg.channel.send("you gotta specify the person")
                    return;
                }
                var oid = msg.mentions.members.first().user.id;
                if(people[oid] == null){
                    msg.channel.send("they dont exist");
                    return;
                }
                if(people[oid].district == people[id].district){
                    var temp = "they have:\n"
                    for(var k in people[oid].inventory){
                        if(people[oid].inventory[k] > 0){
                            if(Math.random() > 0.5)
                                temp+= k+": "+people[oid].inventory[k]+"\n";
                            else
                                temp += "????????\n";
                        }
                    }
                    msg.channel.send(temp);
                }else{
                    msg.channel.send("they arent in your district");
                }
                
            }

            if(content[0] == prefix+"inv"){
                var temp = "you have:\n"
                for(var k in people[id].inventory){
                    if(people[id].inventory[k] > 0){
                        if(content[1] != null){
                            if(k.includes(content[1])){
                                temp+= k+": "+people[id].inventory[k]+"\n";
                            }
                        }else
                            temp+= k+": "+people[id].inventory[k]+"\n";
                    }
                }
                msg.channel.send(temp);
            }
            if(content[0] == prefix+"here"){
                var here = districttoxy(people[id].district);
                var peopleList = "";
                for(var k in people){
                    if(client.users.find("id",k) != null){
                        if(people[k].district == people[id].district){
                            peopleList += client.users.find("id",k).tag+"\n";
                        }
                    }
                }
                msg.channel.send(map[people[id].district].biome+", district "+people[id].district+" at ("+here[0]+","+here[1]+")\n"+peopleList);
            }

            if(content[0] == prefix+"map"){
                
                if(content[1] == null)
                    content[1] = people[id].district;
                var here = districttoxy(parseInt(content[1]));
                if(content[2] == null)
                    content[2] = 5;
                content[2] = parseInt(content[2]);

                var temp = mapmagic(here[0],here[1], 100, content[2], map,people);
                msg.channel.send(new Discord.Attachment(temp, ""));
                /*
                msg.channel.send(stringmap(here[0],here[1],content[2]));
                */
            }

            if(content[0] == prefix+"dig"){
                if(people[id].hunger > 0){
                    people[id].addItem("rock",1)
                    msg.channel.send("you find a rock on the ground");
                    people[id].hunger -= 5;
                }else{
                    msg.channel.send("you're too hungry to work");
                }
            }
            

            if(content[0] == prefix+"chop"){
                if(biome != "desert" && biome != "plains" && biome != "mountains"){
                    if(people[id].hunger > 0){
                        people[id].addItem("log",1)
                        msg.channel.send("you find a log on the ground");
                        people[id].hunger -= 5;
                    }else{
                        msg.channel.send("you're too hungry to work");
                    }
                }else{
                    msg.channel.send("there are no trees here");
                }   
            }

            if(content[0] == prefix+"cry"){
                if(biome != "desert" && biome != "savannah" && biome != "snow"){
                    if(people[id].hunger > 0){
                        people[id].addItem("tears",1)
                        msg.channel.send("you cry really hard");
                        people[id].hunger -= 1;
                    }else{
                        msg.channel.send("you're too hungry to cry");
                    }
                }else{
                    msg.channel.send("its too dry or cold to cry here");
                }   
            }

            if(content[0] == prefix+"gather"){
                if(people[id].hunger > 0){
                    var output = randGather(map[people[id].district].biome);
                    if(output == null){
                        msg.channel.send("there are no plants here")
                    }else{
                        people[id].addItem(output[0],1);
                        msg.channel.send(output[1]);
                        people[id].hunger -= 5;
                    }
                }else{
                    msg.channel.send("you're too hungry to work");
                }
                
            }


            if(content[0] == prefix+"neighbors"){
                msg.channel.send(map[people[id].district].neighbors);
            }

            if(content[0] == prefix+"give"){
                if(content[1] != null){
                    if(content[2] != null){
                        if(content[3] != null){
                            if(people[id].inventory[content[3]] >= parseInt(content[2])){
                                if(msg.mentions.users.first() != null){
                                    var rid = msg.mentions.users.first().id;
                                    if(people[rid] != null){
                                        if(people[rid].district == people[id].district){
                                            people[rid].addItem(content[3],parseInt(content[2]));
                                            people[id].inventory[content[3]] -= parseInt(content[2]);
                                            msg.channel.send("you gave them "+content[2]+" "+content[3]);
                                        }else{
                                            msg.channel.send("they are in district "+people[rid].district)
                                        }
                                    }else{
                                        msg.channel.send("they arent in the economy")
                                    }
                                }else{
                                    msg.channel.send("you need to specify a real person")
                                }
                            }else{
                                msg.channel.send("you dont have "+content[2]+" "+content[3]+" to give");
                            }
                        }else{
                            msg.channel.send("specify the item");
                        }
                    }else{
                        msg.channel.send("specify the amount");
                    }
                }else{
                    msg.channel.send("specify the recipient");
                }
            }

            if(content[0] == prefix+"walk"){
                if(people[id].hunger >= 10){
                    if(content[1] != null){
                        if(content[2] == null)
                            var destination = parseInt(content[1]);
                        else
                            var destination = xytodistrict(parseInt(content[1]),parseInt(content[2]));
                        while(people[id].district != destination && people[id].hunger > 10){
                            var here = districttoxy(people[id].district);
                            var there = districttoxy(destination);
                            
                            var newSpot = people[id].district;
                            if(there[0] > here[0]){
                                newSpot = xytodistrict(here[0]+1,here[1]);
                            }else if(there[0] < here[0]){
                                newSpot = xytodistrict(here[0]-1,here[1]);
                            }else if(there[1] > here[1]){
                                newSpot = xytodistrict(here[0],here[1]+1);
                            }else if(there[1] < here[1]){
                                newSpot = xytodistrict(here[0],here[1]-1);
                            }
                            if(map[newSpot].biome == "ocean"){
                                msg.channel.send("you've reached shore!");
                                return;
                            }else{
                                people[id].district = newSpot;
                                people[id].hunger -= 10;
                            }
                        }
                        msg.channel.send("you've wandered a while and you've ended up at district "+people[id].district);
                    }else{
                        msg.channel.send("you need a destination");
                    }
                }else{
                    msg.channel.send("you're too hungry to walk that far");
                }
            }

            if(msg.content == prefix+"hunger"){
                msg.channel.send(people[id].hunger+"/100");
            }

            if(msg.content == prefix+"help"){
                msg.channel.send("you can $gather, $use, $craft, $dig, $inv, $chop, $walk, $neighbors, $here, this will be upgraded later\nyou can trade using $give [@user] [amount] [item name, no spaces]");
            }

            if(content[0] == prefix+"craft"){
                if(content[1] != null){
                    var p = [];
                    for(var i = 1; i < content.length; i++){
                        p.push(content[i]);
                    }
                    for(var k in recipes){
                        if(arraysEqual(recipes[k].parts,p)){
                            if(hasItems(people[id].inventory,recipes[k].parts,msg)){
                                if(people[id].inventory[recipes[k].station] != null || recipes[k].station == null){
                                    if(items[k].type == "tool"){
                                        people[id].addItem(k,items[k].durability);
                                    }else{
                                        people[id].addItem(k,recipes[k].count);
                                    }

                                    for(var j = 0; j < recipes[k].parts.length; j++){
                                        people[id].inventory[recipes[k].parts[j]]--;
                                    }
                                    msg.channel.send("crafted "+recipes[k].count+" "+k+"!");
                                    return;
                                }else{
                                    msg.channel.send("you dont have the workstation for that");
                                }
                            }/*else{
                                msg.channel.send("you dont have the resources for that");
                            }*/
                        }/*else{
                            msg.channel.send("not a recipe");
                        }*/
                    }
                    msg.channel.send("that doesn't make anything");
                }else{
                    msg.channel.send("you need atleast 1 item to craft");
                }
            }

            if(content[0] == prefix+"use"){
                if(content[1] != null){
                    if(people[id].inventory[content[1]] != null){
                        if(people[id].inventory[content[1]] > 0){
                            if(items[content[1]].type == "vehicle"){
                                if(content[2] != null){
                                    if(items[content[1]].movementOverride != null){
                                        people[id] = items[content[1]].movementOverride(people[id],msg);
                                    }else{
                                        if(map[people[id].district].neighbors.includes(parseInt(content[2]))){
                                            if(people[id].hunger >= items[content[1]].foodUse){
                                                if(map[content[2]].biome == "ocean"){
                                                    if(items[content[1]].canWater == false){
                                                        msg.channel.send("you cant go in water!");
                                                        return;
                                                    }
                                                }else{
                                                    if(items[content[1]].canLand == false){
                                                        msg.channel.send("you cant go on land!");
                                                        return;
                                                    }
                                                }
                                                people[id].hunger -=items[content[1]].foodUse;
                                                people[id].district = parseInt(content[2]);
                                                msg.channel.send("you traveled to "+parseInt(content[2]));
                                            }else{
                                                msg.channel.send("you're too hungry to use your "+content[1]+ " you drift randomly");
                                                people[id].district = map[people[id].district].neighbors[Math.floor(Math.random()*map[people[id].district].neighbors.length)];
                                            }
                                        }else{
                                            msg.channel.send("not a neighboring district");
                                        }
                                    }
                                }else{
                                    msg.channel.send("you have to specify a destination");
                                }
                            }
                            else if(items[content[1]].type == "tool"){
                                if(people[id].hunger > 0){
                                    var output = items[content[1]].lootTable(people[id].district,msg);
                                    if(output != undefined){
                                        people[id].addItem(output,1);
                                    }
                                    people[id].hunger -= items[content[1]].foodUse;
                                    people[id].inventory[content[1]]--;
                                    if(people[id].inventory[content[1]] <= 0){
                                        delete people[id].inventory[content[1]];
                                        msg.channel.send("your tool broke!");
                                    }
                                }else{
                                    msg.channel.send("you're too hungry to work!");
                                }
                            }else if(items[content[1]].type == "food"){
                                people[id].hunger += items[content[1]].replenishAmt;
                                if(people[id].hunger > 100){
                                    people[id].hunger = 100;
                                }
                                people[id].inventory[content[1]]--;
                                msg.channel.send("mmm, you gained "+items[content[1]].replenishAmt+" hunger");
                            }
                            
                        }else{
                            msg.channel.send("you dont have "+content[1]);
                        }
                    }else{
                        msg.channel.send("you dont have "+content[1]);
                    }
                }else{
                    msg.channel.send("specify an item");
                }
            }

        }

        save();
    }catch(err){
        msg.channel.send("oof, mention this to derpy");
        console.log(err);
    }
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  const token = require("./token.js");
client.login(token);