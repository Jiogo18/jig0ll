import https from 'https';
const meteoColor = 3447003;
import { getMeteo as getMeteoPlenitude } from './plenitude/plenitude.js';
import { EmbedMaker } from '../lib/messageMaker.js';
import { getFrenchDate, getFrenchTime } from '../lib/date.js';


export default {
	name: 'météo',
	description: "La météo actuelle de la ville/région (par openweathermap)",
	interaction: true,
	
	security: {
		place: 'public',
	},

	options: [{
		name: "location",
		description: "La météo actuelle de la ville/région (par openweathermap)",
		type: 3,
		required: true,
	}],
	
	async executeAttribute(cmdData, levelOptions) {
		const location = levelOptions[0].value;
		
		switch(location.toLowerCase()) {
			case "plenitude":
			case "plénitude":
				return await (getMeteoPlenitude(cmdData));
			default:
				return await (sendWeatherRequest(location));
		}
	},
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


export async function sendWeatherRequest(location, funcOnData) {
	var data = JSON.parse(await getData(location));
	if(typeof funcOnData == 'function') funcOnData(data);
	
	switch(data.cod) {
	case 200:
		const date = data.date || getFrenchDate(data.dt * 1000);//s to msec
		return getDescription(makeMeteoEmbed(data.name, date), data);
	default:
		return makeMeteoEmbed(data.name, '', [`Code Error: ${data.cod}`, `Message: ${data.message}`]);
	}
}


function makeMeteoEmbed(location, date, desc) {
	return new EmbedMaker(`Météo de __${location}__ ${date}`, (desc||[]).join('\n'), {color: meteoColor});
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
		case "Snow": return "Neige";
		default: return condition;
	}
}
function getDescription(embed, data) {
	
	if(data.main && data.main.temp) embed.addField('Température', `${Math.round((data.main.temp-273.15)*10)/10} °C`, true);
	if(data.main && data.main.humidity != undefined) embed.addField(`Humidité de l'air`, `${data.main.humidity} %`, true);
	if(data.wind) embed.addField('Vitesse du vent', `${data.wind.speed} m/s`, true);
	
	if(data.weather && data.weather.length>0) {
		var conditions = data.weather.map(e => getConditionFr(e.main));
		embed.addField('Condition', conditions.join(", "), true)
	}
	if(data.sys) {
		let soleilLeve = getFrenchTime(data.sys.sunrise*1000, false);
		let soleilCouche = getFrenchTime(data.sys.sunset*1000, true);
		embed.addField('Présence du soleil', `de ${soleilLeve} à ${soleilCouche}`, true);
	}

	return embed;
}