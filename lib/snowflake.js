//https://discord.js.org/#/docs/main/stable/typedef/Snowflake

//Discord epoch : 01/01/2015 = 1420070400 sec since epoch (01/01/1970)
const timestampDiscordEpoch = 1420070400 * 1000;

export class Snowflake {
	snowflake;
	get snowflakeBin() {
		var bin = this.convertBase(this.snowflake, 10, 2);
		while (bin.length < 64) bin = '0' + bin;
		return bin;
	}
	/**
	 * @param {string} bigint String
	 * @param {number} base Same base for the BigInt and the String
	 * @returns BigInt
	 * @source https://stackoverflow.com/a/39338012
	 */
	parseBigInt(bigint, base) {
		//convert bigint string to array of digit values
		for (var values = [], i = 0; i < bigint.length; i++) {
			values[i] = parseInt(bigint.charAt(i), base);
		}
		return values;
	}
	/**
	 * @param {number[]} values BigInt
	 * @param {number} base Same base for the BigInt and the String
	 * @returns String
	 * @source https://stackoverflow.com/a/39338012
	 */
	formatBigInt(values, base) {
		//convert array of digit values to bigint string
		for (var bigint = '', i = 0; i < values.length; i++) {
			bigint += values[i].toString(base);
		}
		return bigint;
	}
	/**
	 * @param {string} bigint
	 * @param {number} inputBase
	 * @param {number} outputBase
	 * @returns BigInt
	 * @source https://stackoverflow.com/a/39338012
	 */
	convertBase(bigint, inputBase, outputBase) {
		//takes a bigint string and converts to different base
		var inputValues = this.parseBigInt(bigint, inputBase),
			outputValues = [], //output array, little-endian/lsd order
			remainder,
			len = inputValues.length,
			pos = 0,
			i;
		while (pos < len) { //while digits left in input array
			remainder = 0; //set remainder to 0
			for (i = pos; i < len; i++) {
				//long integer division of input values divided by output base
				//remainder is added to output array
				remainder = inputValues[i] + remainder * inputBase;
				inputValues[i] = Math.floor(remainder / outputBase);
				remainder -= inputValues[i] * outputBase;
				if (inputValues[i] == 0 && i == pos) {
				pos++;
				}
			}
			outputValues.push(remainder);
		}
		outputValues.reverse(); //transform to big-endian/msd order
		return this.formatBigInt(outputValues, outputBase);
	}
	getSnowflakePart(start, nb_bits) {
		return parseInt(this.snowflakeBin.substr(start, nb_bits), 2);
	}

	get msecSinceDiscord() { return this.getSnowflakePart(0, 42); }
	get msecSinceEpoch() { return this.msecSinceDiscord + timestampDiscordEpoch; }
	get timestamp() { return this.msecSinceEpoch; }
	get secSinceEpoch() { return Math.floor(this.msecSinceEpoch / 1000); }

	get worker() { return this.getSnowflakePart(42, 5); }
	get pid() { return this.getSnowflakePart(47, 5); }
	get increment() { return this.getSnowflakePart(52, 12); }

	constructor(snowflake) { this.snowflake = snowflake; }
}

export function getDateSinceDiscord(snowflake) {
	return new Snowflake(snowflake).msecSinceDiscord;
}
export function getDateSinceEpoch(snowflake) {
	return new Snowflake(snowflake).msecSinceEpoch;
}
export function isSnowflake(text) {
	return typeof text == 'string' && text.match(/^\d{10,30}$/) != null;
}

export default {
	Snowflake,
	timestampDiscordEpoch,

	getDateSinceDiscord,
	getDateSinceEpoch,
	getWorker: snowflake => new Snowflake(snowflake).worker,
	getPid: snowflake => new Snowflake(snowflake).pid,
	getIncrement: snowflake => new Snowflake(snowflake).increment,

	isSnowflake,
};
