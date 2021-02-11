import DataBase from '../../lib/database.js';
import { EmbedMaker } from '../../lib/messageMaker.js';
import { getFrenchDate } from '../../lib/date.js';
import { sendWeatherRequest } from '../meteo.js';


const PlenWeekdays=["Primidi","Duodi","Tridi","Quartidi","Quintidi","Sextidi","Septidi"];
const PlenMonths=["Pluviôse","Ventôse","Germinal","Floréal","Prairial","Messidor","Thermidor","Fructidor","Vendémiaire","Brumaire","Frimaire","Nivôse"];


const PlenCity = {
	database: new DataBase('PlenCity', 'Bayonne', 10000),

	/**
	 * Get the location of Plénitude
	 * @returns {string} The current location
	 */
	get: async function () {
		return await PlenCity.database.get();
		//you need to set async and await everywhere this function is called
	},
	/**
	 * Change the location of Plénitude
	 * @param {string} location Where you want to move
	 * @returns {string} The new location
	 */
	set: async function (location) {
		const answer = await PlenCity.database.set(location);
		console.log(`La ville de Plénitude est maintenant ${answer}`);
		return answer;
	}
}

/**
 * Get the location of Plénitude
 */
export async function getLocation() { return PlenCity.get(); }
/**
 * Change the location of Plénitude
 * @param {string} l The new location
 */
export async function setLocation(l) { return PlenCity.set(l); }

export default {
	name: 'plénitude',
	description: "Commandes de Plénitude",
	interaction: true,

	security: {
		place: 'public',
	},

	options: [{
		name: 'météo',
		description: 'La météo actuelle de Plénitude',
		type: 1,
		execute: getMeteo
	},{
		name: 'info',
		description: 'Informations sur Plénitude',
		type: 1,
		execute: getInfo
	}],

	execute: getInfo,

	getMeteo,
	getLocation,
	setLocation,
}


/**
 * Get the meteo at Plénitude
 * @returns {EmbedMaker} The meteo in an embed message
 */
export async function getMeteo() {
	return sendWeatherRequest(await PlenCity.get(), onWeatherPlenitude);
}
/**
 * Called when data for the meteo of Plénitude was received
 * @param {*} data The data received by the meteo
 */
function onWeatherPlenitude(data) {
	console.log(`onWeatherPlenitude : PlenCity is "${data.name}"`);
	data.name = "Plénitude";
	data.date = getFrenchDate(data.dt*1000, { listWeekday: PlenWeekdays, listMonth: PlenMonths });
}
/**
 * Get the generic info of Plénitude
 */
function getInfo() {
	return new EmbedMaker('Plénitude', "Plénitude est un lieu fictif avec un climat tropical");
}