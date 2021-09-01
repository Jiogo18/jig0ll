import { EmbedMaker } from '../../lib/messageMaker.js';
import { get } from 'https';
import { getFrenchDate } from '../../lib/date.js';

const suaUrl = 'https://sua.faa.gov/sua/schedule.json';
const suaFilter =
	'start=0&limit=20&filter%5B0%5D%5Bfield%5D=type&filter%5B0%5D%5Bdata%5D%5Btype%5D=list&filter%5B0%5D%5Bdata%5D%5Bvalue%5D=CFR%2091.143%20Proximity%20of%20Space%20Flight%20Operations%20-%20SPC&filter%5B1%5D%5Bfield%5D=state&filter%5B1%5D%5Bdata%5D%5Btype%5D=string&filter%5B1%5D%5Bdata%5D%5Bvalue%5D=tx&sort=start_time&dir=DESC';

class TfrData {
	/**
	 * @type {string}
	 * Ex: 'SPC' (CFR 91.143 Space Flight Operactions)
	 */
	type;
	/**
	 * @type {number}
	 * Ex: 0 (?)
	 */
	gid;
	/**
	 * @type {string}
	 * Ex: '1/8002' (TFR ID, SAA / NOTAM ID)
	 */
	airspace_name;
	/**
	 * @type {string}
	 * Ex: '05/02/2021 12:00'
	 * Format: MM/dd/YYYY HH:mm UTC
	 */
	start_time;
	/**
	 * @type {string}
	 * Ex: '05/03/2021 01:00' UTC
	 */
	end_time;
	/**
	 * @type {string}
	 * Ex: 'ZHU' (Houston Air Route Traffic Control Center)
	 */
	CenterID;
	/**
	 * @type {string}
	 * Ex: 'TX' (Texas)
	 */
	state;
	/**
	 * @type {number}
	 * Ex: 0 (100s ft)
	 */
	min_alt;
	/**
	 * @type {number}
	 * Ex: 1 (?)
	 */
	agl;
	/**
	 * @type {number}
	 * Ex: 999 (100s ft)
	 */
	max_alt;
	/**
	 * @type {number}
	 * Ex: 0 (?)
	 */
	max_alt_agl;
	/**
	 * @type {string}
	 * Ex: '!FDC 1/8002 ZHU TX..AIRSPACE BROWNSVILLE, TX..TEMPORARY FLIGHT \n' +
	  'RESTRICTIONS.  \n' +
	  '      PURSUANT TO 14 CFR SECTION 91.143, SPACE OPERATIONS AREA, \n' +
	  'AIRCRAFT OPERATIONS ARE PROHIBITED  WITHIN AN AREA DEFINED AS \n' +
	  '260000N0970200W (BRO067019) TO 255800N0970200W (BRO073018.7) TO \n' +
	  '255600N0970500W (BRO079015.8) TO 255500N0970600W (BRO083014.9) TO \n' +
	  '255500N0970900W (BRO083012.2) TO 255500N0971200W (BRO084009.5) TO \n' +
	  '255700N0971400W (BRO070007.8) TO 260200N0971300W (BRO044010.8) TO \n' +
	  '260300N0971200W (BRO042012.1) TO 260500N0970700W (BRO047016.9) TO \n' +
	  '260400N0970400W (BRO054018.7) TO 260300N0970300W (BRO058019.1) TO \n' +
	  'THE POINT OF ORIGIN SFC-UNL   \n' +
	  'EFFECTIVE 2105021200 UTC (0700 LOCAL 05/02/21) UNTIL 2105030100 UTC \n' +
	  '(2000 LOCAL 05/02/21).  EXCEPT AS SPECIFIED BELOW AND/OR UNLESS \n' +
	  'AUTHORIZED BY ATC: A. FLIGHT LIMITATION IN THE PROXIMITY OF SPACE \n' +
	  'FLIGHT OPS, OPS BY FAA CERT PILOTS OR U.S. REG ACFT ARE PROHIBITED \n' +
	  'WI THE DEFINED AIRSPACE THAT INCLUDES THE AIRSPACE OUTSIDE OF U.S. \n' +
	  'TERRITORY. B. AIRCRAFT SUPPORTING THE RECOVERY OF THE SPACE \n' +
	  'VEHICLE ARE EXEMPT FROM THIS TFR.. C. PILOTS MUST CONSULT ALL \n' +
	  'NOTAMS REGARDING THIS OPS AND MAY CONTACT ZHU FOR CURRENT AIRSPACE \n' +
	  'STATUS.  \n' +
	  'THE HOUSTON /ZHU/ ARTCC, TEL 281-230-5560, IS THE CDN \n' +
	  'FACILITY. \n' +
	  ' 2105021200-2105030100'
	 */
	tfr_short;
	/**
	 * @type {string}
	 * Ex: '-1.0823965154428234E7,2988763.409116885,-1.0801701256269583E7,3009405.799275883'
	 */
	mbr;
	/**
	 * @type {string}
	 * Ex: 'TFR' (Group)
	 */
	type_class;
	/**
	 * @type {string}
	 * Ex: 'New'
	 */
	is_new;
	/**
	 * @type {string}
	 * Ex: '8h_24h'
	 */
	time_box;
	/**
	 * @type {number}
	 * Ex: 0 (?)
	 */
	up_to_not_incl_fl_flag;
}

export default {
	name: 'spacex',
	description:
		'Donne la liste des autoraisations du FAA à BROWNSVILLE, site de lancement des prototypes du Starship, see https://sua.faa.gov/sua/schedule.json',
	interaction: false,

	security: {
		place: 'public',
		hidden: true,
	},

	/**
	 * Executed when there is no valid option
	 * @param {ReceivedCommand} cmdData
	 */
	async execute(cmdData) {
		/**
		 * @type { {total:number, schedule:[TfrData]} }
		 */
		const data = await sendFAARequest();
		if (!data.total) {
			if (data.total == 0) {
				return new EmbedMaker('SpaceX-Starship', 'There is no Space Operation allowed in Texas'); // error
			} else {
				return new EmbedMaker('SpaceX-Starship', data); // error
			}
		}

		var retour = new EmbedMaker('SpaceX-Starship', `${data.total} Space Operation are allowed in Texas`, {
			suffix: 'Source: https://sua.faa.gov/sua/siteFrame.app',
		});
		const tfr_short_max_length = 800 / data.total;
		for (const tfr of data.schedule) {
			var tfr_short = tfr.tfr_short;
			if (tfr_short.indexOf('AIRCRAFT OPERATIONS ARE PROHIBITED') > -1)
				tfr_short = tfr_short.substring(0, tfr_short.indexOf('AIRCRAFT OPERATIONS ARE PROHIBITED') - 1);
			if (tfr_short.indexOf('ACFT OPS ARE PROHIBITED') > -1) tfr_short = tfr_short.substring(0, tfr_short.indexOf('ACFT OPS ARE PROHIBITED') - 1);
			if (tfr_short.indexOf('END PART') > -1) tfr_short = tfr_short.substring(0, tfr_short.indexOf('END PART') - 1);
			if (tfr_short.length > tfr_short_max_length) tfr_short = tfr_short.substring(0, tfr_short_max_length);
			while (tfr_short.endsWith(' ') || tfr_short.endsWith(',')) tfr_short = tfr_short.substr(0, tfr_short.length - 1);

			tfr_short = tfr_short.replace('\n', '');
			const start_date = new Date(tfr.start_time + ' UTC');
			const end_date = new Date(tfr.end_time + ' UTC');

			const etat = getEtat(start_date, end_date);

			retour.addField(
				`Airspace-Name: ${tfr.airspace_name} (${etat})`,
				`Max altitude: ${tfr.max_alt} (100s ft), ${tfr.max_alt * 0.03048} km\n` +
					`Begin: ${tfr.start_time}, End: ${tfr.end_time} (UTC)\n` +
					`Début ${getFrenchDate(start_date, { noTimezone: true })}, Fin ${getFrenchDate(end_date)}\n` +
					`Basic informations: ${tfr_short}`
			);
		}

		return retour;
	},
};

async function sendFAARequest() {
	return new Promise((resolve, reject) =>
		get(`${suaUrl}?${suaFilter}`, response => {
			let data = '';

			// called when a data chunk is received.
			response.on('data', chunk => {
				data += chunk;
			});

			// called when the complete response is received.
			response.on('end', () => {
				resolve(JSON.parse(data));
			});
		}).on('error', error => {
			reject('Error: ' + error.message);
		})
	);
}

function getEtat(start, end) {
	if (Date.now() < start) {
		const msToStart = start - Date.now();
		const seconds = Math.floor(msToStart / 1000);
		const minutes = Math.floor((seconds / 60) * 10) / 10;
		const hours = Math.floor((seconds / 3600) * 10) / 10;
		if (hours >= 1) {
			return `Début dans ${hours} heure${hours >= 2 ? 's' : ''}`;
		} else if (minutes >= 1) {
			return `Début dans ${minutes} minute${minutes >= 2 ? 's' : ''}`;
		} else {
			return `Début dans ${seconds} seconde${seconds >= 2 ? 's' : ''}`;
		}
	} else if (Date.now() < end) {
		return 'En cours';
	} else {
		return 'Terminé';
	}
}
