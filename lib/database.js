const Keyv = require("keyv");//store PlenCity
var keyv = new Keyv();
keyv = new Keyv(process.env.DATABASE_URL);//with SQLite (local) or Postgre (Heroku)
keyv.on('error', err => console.error('Keyv connection error:', err));


async function getValue(name) { return await keyv.get(name); }
async function setValue(name, value) { return await keyv.set(name, value); }


class DataBaseValue {
	timeout;
	#lastUpdate = 0;
	#lastValue = undefined;
	#reset = true;

	isTimeout() {
		if(this.#reset) return true;
		if(this.#lastUpdate + this.timeout <= Date.now()) {
			this.#reset = true;
			return true;
		}
		return false;
	}

	get value() {
		console.debug(`DataBaseValue get : ${this.#lastUpdate} ${this.#lastValue} ${this.isTimeout()}`.yellow);
		if(this.#lastValue == undefined) return undefined;
		if(this.isTimeout()) { this.#lastValue = undefined; }
		return this.#lastValue;
	}
	set value(value) {
		console.debug(`DataBaseValue set : ${this.#lastUpdate} ${this.#lastValue} ${this.isTimeout()}`.blue);
		this.#lastValue = value;
		this.#lastUpdate = Date.now();
		this.#reset = false;
	}

	reset() { this.#reset = true; }


	constructor(timeout = 1000) {
		this.timeout = timeout;
	}
}


module.exports = class DataBase {
	#name; get name() { return this.#name; }
	data;
	defaultValue;
	#func;
	#stats;
	

	async getCurrentValue() {
		this.#stats.get++;
		if(this.#func && typeof this.#func.get == 'function') {
			return await this.#func.get(this.name);
		}
		return await getValue(this.name);
	}
	async setCurrentValue(value) {
		this.#stats.set++;
		if(this.#func && typeof this.#func.set == 'function') {
			return await this.#func.set(this.name, value);
		}
		return await setValue(this.name, value);
	}

	async get() {
		if(this.data.isTimeout()) {
			this.data.value = await this.getCurrentValue();
		}
		//si on récupère du undefined on attend aussi le timeout !
		return this.data.value || this.defaultValue;
	}


	async set(value) {
		await this.setCurrentValue(value);
		this.data.reset();
		this.data.value = await this.get();
		return this.data.value;
	}



	constructor(name, defaultValue, timeout, func) {
		this.#name = name;
		this.defaultValue = defaultValue || '';
		this.data = new DataBaseValue(timeout);
		this.#func = func;

		this.#stats = { start: Date.now(), get: 0, set: 0 };
	}
}