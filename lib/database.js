import PG from 'pg';
const { Client:PGClient } = PG;

/**
 * PostgreSQL :
 * -- https://www.postgresqltutorial.com/postgresql-insert/
 * -- https://www.postgresqltutorial.com/postgresql-create-table/
 * -- Supprimer la table :
 * DROP TABLE IF EXISTS plenitude;
 * -- Créer la table :
 * CREATE TABLE plenitude (key VARCHAR(20) PRIMARY KEY, value VARCHAR(50) NOT NULL);
 * -- Afficher la table :
 * SELECT * from plenitude;
 * -- Ajouter à la table :
 * INSERT INTO plenitude(key,value) VALUES('PlenCity','Paris');
 * -- Obtenir une variable :
 * SELECT value from plenitude WHERE key = 'PlenCity';
 */


/**
 * @type {KVDataBase}
 * @deprecated TODO: remove it
 */
var plenitude;//global

export const SQLcolumnType = {
	string: (sizeMax = 50) => `VARCHAR(${sizeMax})`,
	number: _ => `SERIAL`,
};


export class PGDatabase extends PGClient {
	/**
	 * Async function to wait until the connection is over
	 * @type {Promise<boolean>}
	 */
	#waitConnect;
	/**
	 * Timer to regulate the flow and not reopen it each time
	 * @type {NodeJS.Timeout}
	 */
	// #timeoutDisconnect;

	/**
	 * A key-value system database
	 * @param {string} url The url of the database
	 */
	constructor(url, config) {
		super({
			connectionString: url,
			ssl: {rejectUnauthorized: false},
			query_timeout: 5000,
			...config,
		});
	}
	/**
	 * Connect to the database
	 */
	async connect() {
		if(this._connecting && this.#waitConnect) return await this.#waitConnect;
		return this.#waitConnect = new Promise(async resolve => {
			await super.connect().catch(e => console.error('Error while connecting to the database'.red, e));
			resolve(this._connected);
		});
	}
	/**
	 * Connect to the database if not connected
	 */
	async safeConnected() {
		// clearTimeout(this.#timeoutDisconnect);
		// this.#timeoutDisconnect = setTimeout(_ => this.end(), 5000);
		if(this._ending) { console.warn('Client was closed and is not queryable'); return false; }
		return this._connected || await this.connect();
	}

	/**
	 * Disconnect from the database
	 * @returns {Promise<boolean>} `true` if disconnected from the database, `false` if already disconnected
	 * @deprecated Once disconnected you can't reconnect
	 */
	async end() { return super.end().catch(e => console.log(`Error while disconnecting from the database`.red, e)); }

	/**
	 * Overload query
	 * @param  {string} queryStream The command for PostgreSQL (like in the CLI)
	 * @returns {Promise<PG.QueryResult<any>>} The result of the database
	 */
	async query(queryStream) {
		if(!await this.safeConnected()) return;
		return super.query(queryStream).catch(e => console.error(`Error with PG.query`.red, e));
	}

	/**
	 * Create a table in the database
	 * @param {string} tableName The table where you work
	 * @param {...SQLcolumnType} columnsTypes Informations about columns of the table
	 * @param {boolean} ifNotExists If the table already exists it won't make an error
	 */
	async createTable(tableName, columnsTypes, ifNotExists = true) { return await this.query(`CREATE TABLE ${ifNotExists?'IF NOT EXISTS':''} ${tableName} ${columnsTypes};`); }

	/**
	 * Get values from rows of the table
	 * @param {string} tableName The table where you work
	 * @param {string} filter Filter which match with the row. `myColumn1 = 'myValueFilter'`
	 * @param {string} columnsName Filter of columns which you want the data. `myColumnName,myColumnCountry` => `{myColumnName:'Jig0ll',myColumnCountry:'France'}`
	 * @returns {Promise<Array>} rows with values of `columnsName`
	 */
	async get(tableName, filter = '', columnsName = '*') { return (await this.query(`SELECT ${columnsName} FROM ${tableName} ${filter ? 'WHERE ' + filter : ''};`))?.rows || []; }
	/**
	 * Insert a row (a line) in the table
	 * @param {string} tableName The table where you work
	 * @param {string | string[]} columnsName The name of the column for which you have data. `['myColumn1','myColumn3']`
	 * @param {string | string[]} rowValues The data for each columns in the order of `columnsName`. `['valueOfColumn1','valueOfColumn3']`
	 * @returns {Promise<Array>} The new row
	 */
	async insert(tableName, columnsName, rowValues) {
		if(Array.isArray(columnsName)) columnsName = columnsName.join(',');
		if(Array.isArray(rowValues)) rowValues = rowValues.map(v => `'${v}'`).join(',');
		return (await this.query(`INSERT INTO ${tableName}(${columnsName}) VALUES(${rowValues}) RETURNING *;`))?.rows?.[0] || [];
	}
	/**
	 * Modify a row of the table
	 * @param {string} tableName The table where you work
	 * @param {string} filter Filter which match with the row. `myColumn = 'myValueFilter'`
	 * @param {string} thingsToSet Things you want to set. `myColumn = 'newValue'`
	 * @returns {Promise<Array>} The modified rows and their values
	 */
	async set(tableName, filter, thingsToSet) { return (await this.query(`UPDATE ${tableName} SET ${thingsToSet} WHERE ${filter} RETURNING *;`))?.rows || []; }

	/**
	 * Delete a row of the table
	 * @param {string} tableName The table where you work
	 * @param {string} filter Filter which match with the row. `myColumn = 'myValueFilter'`
	 * @returns {Promise<Array>} The deleted rows with their values
	 */
	async delete(tableName, filter) { return (await this.query(`DELETE FROM ${tableName} WHERE ${filter} RETURNING *;`))?.rows || []; }
}


export class KVDataBaseConfig {
	insertIfNotExist = false;//insert a row if it doesn't exist
	createTable = false;//create the table if it doesn't exist
	columnsTypes = [];//change the type of columns of this table (N.B. For the moment the `value` can only be a `string`)
	/**
	 * Copy the object config and saves it as a KVDataBaseConfig
	 * Used to have default values
	 * @param {{insertIfNotExist: boolean,
	 * 			createTable: boolean,
	 * 			columnsTypes: string[]
	 * 			}} config 
	 */
	constructor(config = {}) { Object.keys(config).forEach(k => this[k] = config[k]); }
}

export class KVDataBase {
	database;
	tableName;
	config;
	/**
	 * A key-value system for your database
	 * @param {PGDatabase} database The database
	 * @param {string} tableName The name of your table where you work
	 * @param {KVDataBaseConfig} config Config of the table
	 */
	constructor(database, tableName, config = {}) {
		this.tableName = tableName;
		this.config = new KVDataBaseConfig(config);	
		this.setDatabase(database);
	}

	/**
	 * Set the database of this KVDatabase
	 * @param {PGDatabase} database The database you want
	 */
	setDatabase(database) {
		this.database = database;
		if(this.config.createTable) {
			KVDataBase.createTable(this.database, this.tableName, this.config.columnsTypes[0], this.config.columnsTypes[1], true);
			//malheureusement on n'a pas de moyen de savoir si la table a été créé ou si elle existait déjà
		}
	}

	/**
	 * Create the table in the database
	 * @param {string} tableName The name of the table
	 * @param {string} keyType The type of the `key` column (see `SQLcolumnType`)
	 * @param {string} valueType The type of the `value` column (see `SQLcolumnType`)
	 * @param {boolean} ifNotExists At `false` it will make an error if the database has already a table with this name
	 */
	static async createTable(database, tableName, keyType = SQLcolumnType.string(20), valueType = SQLcolumnType.string(50), ifNotExists) {
		return database.createTable(tableName, `(key ${keyType} PRIMARY KEY, value ${valueType} NOT NULL)`, ifNotExists);
	}

	/**
	 * Get every keys of the table
	 */
	async getKeys() { return (await this.database.get(this.tableName, '', 'key'))?.map(row => row.key); }
	/**
	 * Get every values of the table
	 */
	async getValues() { return (await this.database.get(this.tableName, '', 'value'))?.map(row => row.value); }
	/**
	 * Determine whether the table contains a row with the key
	 * @param {string} key The key we want to find in the table
	 * @returns `true` if the table contains a row with this key, `false` otherwise
	 */
	async has(key) { return (await this.database.get(this.tableName, 'value', `key = '${key}'`))?.length > 0; }
	/**
	 * Determine whether the table contains at least one row with the value
	 * @param {string} value The value we want to find in the table
	 * @returns The number of rows which contains the value
	 */
	async hasValue(value) { return (await this.database.get(this.tableName, 'key', `value = '${value}'`))?.length || 0; }
	/**
	 * Get a value of the table
	 * @param {*} key The key of the row we want the value
	 * @returns {Promise<string | null>} The value of the row, `null` if there is no value
	 */
	async get(key) { return (await this.database.get(this.tableName, `key = '${key}'`, 'value'))?.[0]?.value || null; }

	/**
	 * Insert a row in the table
	 * @param {string} key The key of the row (unique in the table)
	 * @param {string} value The value of the row
	 * @returns {Promise<{key:string, value:string} | null>} The new row, `null` if there is no value
	 */
	async insert(key, value) { return (await this.database.insert(this.tableName, `key,value`, [key,value]))?.[0] || null; }
	/**
	 * Modify a row of the table
	 * @param {string} key The key of the row
	 * @param {value} value The new value of the row
	 * @returns {Promise<{key:string, value:string} | null>} The row, `null` if there is no value
	 */
	async set(key, value) {
		const rows = await this.database.set(this.tableName, `key = '${key}'`, `value = '${value}'`);
		if(rows?.length > 0) return rows[0];
		
		if(this.config.insertIfNotExist) {
			console.warn(`Database : the key '${key}' doesn't exist in the table '${this.tableName}' => added`.yellow);
			return this.insert(key, value);
		}
		else {
			console.warn(`Database : the key '${key}' doesn't exist in the table '${this.tableName}. Add it or allow insertIfNotExist`.yellow);
			return null;
		}
	}

	/**
	 * Delete one row of the table
	 * @param {string} key The key of the row
	 * @returns The number of rows deleted
	 */
	async delete(key) {
		const row = await this.database.delete(this.tableName, `key = '${key}'`);
		console.warn(`Database : the key '${key}' has deleted ${row?.length || 0} row(s) in the table '${this.tableName}'`);
		return row?.length || 0;
	}
}






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
		if(this.#lastValue == undefined) return undefined;
		if(this.isTimeout()) { this.#lastValue = undefined; }
		return this.#lastValue;
	}
	set value(value) {
		this.#lastValue = value;
		this.#lastUpdate = Date.now();
		this.#reset = false;
	}

	reset() { this.#reset = true; }


	constructor(timeout = 1000) {
		this.timeout = timeout;
	}
}


export class DataBase {
	#name; get name() { return this.#name; }
	data;
	defaultValue;
	#func;
	#stats;
	

	async getCurrentValue() {
		this.#stats.get++;
		try {
			if(this.#func && typeof this.#func.get == 'function') {
				return await this.#func.get(this.name);
			}
		} catch(e) {
			console.warn(`Database error: can't get the value of '${this.name}'`.yellow, e);
			return this.data.value || this.defaultValue;
		}
	}
	async setCurrentValue(value) {
		this.#stats.set++;
		try {
			if(this.#func && typeof this.#func.set == 'function') {
				return await this.#func.set(this.name, value);
			}
		} catch(e) {
			this.defaultValue = value;
			console.warn(`Database error: can't set the value for '${this.name}'`.yellow, e);
		}
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
		this.defaultValue = this.data.value;//used as previous... TODO: change this
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