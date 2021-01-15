const https = require('https');
const meteoColor = 3447003;
const CmdPlenitude = require("./plenitude.js");
const Discord = require('discord.js')

const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
	hour:'2-digit',
	minute:'2-digit',
	hc: 'h24', hour12: false,
	timeZoneName: "short", timeZone: "Europe/Paris"
});







module.exports = {
	name: 'météo',
	description: "La météo actuelle de la ville/région (par openweathermap)",
	interaction: true,
	public: true,
	wip: true,

	options: [{
		name: "location",
		description: "La météo actuelle de la ville/région (par openweathermap)",
		type: 3,
		required: true,

		execute: async function(context) {
			const location = context.getOptionValue(0);
			
			switch(location.toLowerCase()) {
				case "plenitude":
				case "plénitude":
					return await (CmdPlenitude.getMeteo(context));
				default:
					return await (module.exports.sendWeatherRequest(location));
			}
		}
	}],
	sendWeatherRequest: sendRequest,
	getMeteoDate: getMeteoDate
};


//https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
async function getData(location) {
	const data = new Promise((resolve, reject) => {

		https.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.WEATHER_KEY}`, (resp) => {
			let data = '';
	
			// A chunk of data has been recieved.
			resp.on('data', (chunk) => {
				data += chunk;
				resolve(data);
			});
	
			// The whole response has been received.
		})
		.on("error", (err) => {
			console.log(`Socket Error with : api.openweathermap.org ${err.message}`.red);
			resolve({ cod: 404, message: "can not access to api.openweathermap.org" });
		});
	});

	//resolve(onWeather(location, JSON.parse(data)));
	return data;
}


async function sendRequest(location, funcOnData) {
	var data = JSON.parse(await getData(location));
	if(typeof funcOnData == 'function') funcOnData(data);
	
	switch(data.cod) {
	case 200:
		return makeEmbed(data.name, ` le `+(data.date || getMeteoDate(data.dt)), getDescription(data));
	default:
		return makeEmbed(data.name, '', [`Code Error: ${data.cod}`, `Message: ${data.message}`]);
	}
}


function makeEmbed(location, date, desc) {
	return new Discord.MessageEmbed() // Ver 12.2.0 of Discord.js
		.setTitle(`Météo de __${location}__ ${date}`)
		.setColor(meteoColor)
		.setDescription(desc.join('\n'));
		//.addField("This is a field", "this is its description")
}



function getWeekday(date, list = ["Lundi","Mardi","Mecredi","Jeudi","Vendredi","Samedi","Dimanche"]) {
	if(date.getDay()==0) return list[6];
	return list[date.getDay()-1];//décale cars Sunday==0 et Monday==1
}
function getMonth(date, list = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]) {
	return list[date.getMonth()]//January==0
}
function getFrenchTime(date, timezone) {
	if(!date) return;
	const [{ value:hour },,{ value:minute },,{ value:timeZoneName }] = dateTimeFormat.formatToParts(date);
	return `${hour}h${minute}` + (timezone ? ` (${timeZoneName})` : '');
}
function getMeteoDate(datetime, listWeekday, listMonth) {
	var date = new Date(datetime*1000);//s in msec
	return `${getWeekday(date, listWeekday)} ${date.getDate()} ${getMonth(date, listMonth)} à ${getFrenchTime(date, true)}`;
}

function getConditionFr(condition) {
	switch(condition) {
		case "Clouds": return "Nuages";
		case "Rain": return "Pluie";
		case "Clear": return "Dégagé";
		case "Drizzle": return "Pluie fine";
		case "Fog": return "Brouillard";
		case "Mist": return "Brume";
		case "Haze": return "Brume sèche";
		default: return condition;
	}
}
function getDescription(data) {
	var retour=[];
	if(data.main && data.main.temp)
		retour.push(`Température : ${Math.round((data.main.temp-273.15)*10)/10}°C`);
	if(data.weather && data.weather.length>0) {
		var conditions=[];
		data.weather.forEach(element => conditions.push(getConditionFr(element.main)));
		retour.push(`Condition : ${conditions.join(", ")}`);
	}
	//TODO : changer avec les push
	if(data.wind)
		retour.push(`Vitesse du vent : ${data.wind.speed} m/s`);
	if(data.main && data.main.humidity != undefined)
		retour.push(`Humidité de l'air : ${data.main.humidity}%`);
	if(data.sys) {
		let soleilLeve = getFrenchTime(data.sys.sunrise*1000, false);
		let soleilCouche = getFrenchTime(data.sys.sunset*1000, true);
		retour.push(`Présence du soleil : de ${soleilLeve} à ${soleilCouche}`);
	}

	return retour;
}