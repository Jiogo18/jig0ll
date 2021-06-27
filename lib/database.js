import PG from 'pg';
const { Client: PGClient } = PG; // Client as PGClient

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
 * -- Supprimer les éléments d'une table :
 * DELETE FROM plenitude_invite;
 */

/** A type for any keys */
class databaseKey {}
/** A type for any types returned */
class databaseValue {}

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
			ssl: { rejectUnauthorized: false },
			query_timeout: 5000,
			...config,
		});
	}
	/**
	 * Connect to the database
	 */
	async connect() {
		if (this._connecting && this.#waitConnect) return await this.#waitConnect;
		return (this.#waitConnect = new Promise(async resolve => {
			await super.connect().catch(e => process.consoleLogger.internalError('connecting to the database', e));
			resolve(this._connected);
		}));
	}
	/**
	 * Connect to the database if not connected
	 */
	async safeConnected() {
		// clearTimeout(this.#timeoutDisconnect);
		// this.#timeoutDisconnect = setTimeout(_ => this.end(), 5000);
		if (this._ending) {
			console.warn('Client was closed and is not queryable');
			return false;
		}
		return this._connected || (await this.connect());
	}

	/**
	 * Disconnect from the database
	 * @returns {Promise<boolean>} `true` if disconnected from the database, `false` if already disconnected
	 * @deprecated Once disconnected you can't reconnect
	 */
	async end() {
		return super.end().catch(e => process.consoleLogger.internalError(`disconnecting from the database`, e));
	}

	/**
	 * Overload query
	 * @param  {string} queryStream The command for PostgreSQL (like in the CLI)
	 * @returns {Promise<PG.QueryResult<any>>} The result of the database
	 */
	async query(queryStream) {
		if (!(await this.safeConnected())) return;
		return super.query(queryStream).catch(e => process.consoleLogger.internalError(`PG.query`, e));
	}

	/**
	 * Create a table in the database
	 * @param {string} tableName The table where you work
	 * @param {...SQLcolumnType} columnsTypes Informations about columns of the table
	 * @param {boolean} ifNotExists If the table already exists it won't make an error
	 */
	async createTable(tableName, columnsTypes, ifNotExists = true) {
		return await this.query(`CREATE TABLE ${ifNotExists ? 'IF NOT EXISTS' : ''} ${tableName} ${columnsTypes};`);
	}

	/**
	 * Get values from rows of the table
	 * @param {string} tableName The table where you work
	 * @param {string} filter Filter which match with the row. `myColumn1 = 'myValueFilter'`
	 * @param {string} columnsName Filter of columns which you want the data. `myColumnName,myColumnCountry` => `{myColumnName:'Jig0ll',myColumnCountry:'France'}`
	 * @returns {Promise<[Array]>} rows with values of `columnsName`
	 */
	async get(tableName, filter = '', columnsName = '*') {
		return (await this.query(`SELECT ${columnsName} FROM ${tableName} ${filter ? 'WHERE ' + filter : ''};`))?.rows || [];
	}
	/**
	 * Insert a row (a line) in the table
	 * @param {string} tableName The table where you work
	 * @param {string | string[]} columnsName The name of the column for which you have data. `['myColumn1','myColumn3']`
	 * @param {string | string[]} rowValues The data for each columns in the order of `columnsName`. `['valueOfColumn1','valueOfColumn3']`
	 * @returns {Promise<Array>} The new row
	 */
	async insert(tableName, columnsName, rowValues) {
		if (Array.isArray(columnsName)) columnsName = columnsName.join(',');
		if (Array.isArray(rowValues)) rowValues = rowValues.map(v => `'${v}'`).join(',');
		return (await this.query(`INSERT INTO ${tableName}(${columnsName}) VALUES(${rowValues}) RETURNING *;`))?.rows?.[0] || [];
	}
	/**
	 * Modify a row of the table
	 * @param {string} tableName The table where you work
	 * @param {string} filter Filter which match with the row. `myColumn = 'myValueFilter'`
	 * @param {string} thingsToSet Things you want to set. `myColumn = 'newValue'`
	 * @returns {Promise<Array>} The modified rows and their values
	 */
	async set(tableName, filter, thingsToSet) {
		return (await this.query(`UPDATE ${tableName} SET ${thingsToSet} WHERE ${filter} RETURNING *;`))?.rows || [];
	}

	/**
	 * Delete a row of the table
	 * @param {string} tableName The table where you work
	 * @param {string} filter Filter which match with the row. `myColumn = 'myValueFilter'`
	 * @returns {Promise<Array>} The deleted rows with their values
	 */
	async delete(tableName, filter) {
		return (await this.query(`DELETE FROM ${tableName} WHERE ${filter} RETURNING *;`))?.rows || [];
	}
}

export class KVDataBaseConfig {
	insertIfNotExist = false; //insert a row if it doesn't exist
	createTable = false; //create the table if it doesn't exist
	columnsTypes = []; //change the type of columns of this table (N.B. For the moment the `value` can only be a `string`)
	/**
	 * Copy the object config and saves it as a KVDataBaseConfig
	 * Used to have default values
	 * @param {{insertIfNotExist: boolean,
	 * 			createTable: boolean,
	 * 			columnsTypes: string[]
	 * 			}} config Your config of the database
	 */
	constructor(config = {}) {
		Object.keys(config).forEach(k => (this[k] = config[k]));
	}
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
		if (this.config.createTable) {
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
		return database?.createTable(tableName, `(key ${keyType} PRIMARY KEY, value ${valueType} NOT NULL)`, ifNotExists);
	}

	/**
	 * Get every keys of the table
	 */
	async getKeys() {
		return (await this.database.get(this.tableName, '', 'key'))?.map(row => row.key);
	}
	/**
	 * Get every values of the table
	 */
	async getValues() {
		return (await this.database.get(this.tableName, '', 'value'))?.map(row => row.value);
	}
	/**
	 * Determine whether the table contains a row with the key
	 * @param {string} key The key we want to find in the table
	 * @returns `true` if the table contains a row with this key, `false` otherwise
	 */
	async has(key) {
		return (await this.database.get(this.tableName, 'value', `key = '${key}'`))?.length > 0;
	}
	/**
	 * Determine whether the table contains at least one row with the value
	 * @param {string} value The value we want to find in the table
	 * @returns The number of rows which contains the value
	 */
	async hasValue(value) {
		return (await this.database.get(this.tableName, 'key', `value = '${value}'`))?.length || 0;
	}
	/**
	 * Get a value of the table
	 * @param {*} key The key of the row we want the value
	 * @returns {Promise<string | null>} The value of the row, `null` if there is no value
	 */
	async get(key) {
		return (await this.database.get(this.tableName, `key = '${key}'`, 'value'))?.[0]?.value || null;
	}

	/**
	 * Insert a row in the table
	 * @param {string} key The key of the row (unique in the table)
	 * @param {string} value The value of the row
	 * @returns {Promise<{key:string, value:string} | null>} The new row, `null` if there is no value
	 */
	async insert(key, value) {
		return (await this.database.insert(this.tableName, `key,value`, [key, value]))?.[0] || null;
	}
	/**
	 * Modify a row of the table
	 * @param {string} key The key of the row
	 * @param {value} value The new value of the row
	 * @returns {Promise<{key:string, value:string} | null>} The row, `null` if there is no value
	 */
	async set(key, value) {
		const rows = await this.database.set(this.tableName, `key = '${key}'`, `value = '${value}'`);
		if (rows?.length > 0) return rows[0];

		if (this.config.insertIfNotExist) {
			console.warn(`Database : the key '${key}' doesn't exist in the table '${this.tableName}' => added`.yellow);
			return this.insert(key, value);
		} else {
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

/**
 * Return the value of a function
 * @param {Function | databaseValue} func The return of a function or the value
 * @param {databaseValue} previousValue The value before the reset
 * @returns The value of the function or `func` if it's not a function
 */
function getValueOfSupposedFunction(func, previousValue = undefined) {
	return typeof func == 'function' ? func(previousValue) : func;
}

export class TemporaryValue {
	expireTime;
	#lastUpdate = 0;
	#reset = true;
	#resetSoon;
	/**
	 * Is the value can expire with time?
	 * @returns {boolean} `true` if the value can expire with time, `false` if it's only expired with reset()
	 */
	canExpire() {
		return this.expireTime > -1;
	}
	/**
	 * Is the value obsolete?
	 * @returns {boolean} `true` if the value is obsolete, `false` if the value is temporary stored
	 */
	isExpired() {
		return this.#reset || (this.#reset = this.canExpire() && this.#lastUpdate + this.expireTime <= Date.now());
	}

	/**
	 * The latest value returned by the database
	 * @type {databaseValue}
	 * */
	value;
	/**
	 * The latest value set for/by the database
	 * @type {databaseValue}
	 * */
	lastValue;

	/**
	 * Get the last value if not obsolete, or the value of the `get` function
	 * @returns {Promise<databaseValue>} The value or `undefined` if there is no value set
	 */
	async get() {
		if (!this.isExpired()) return this.value;
		this.#reset = false;
		try {
			this.value = await new Promise(async (res, err) => {
				setTimeout(_ => err('timeout'), 5000);
				res(await getValueOfSupposedFunction(this.#obtainFunc?.get, this.value));
			});
			this.lastValue = this.value; //c'est ok, on l'a récupéré
		} catch (err) {
			process.consoleLogger.internalError(`getting a valuefor TemporaryValue`.red, err);
		}
		this.lastUpdate = Date.now();
		return this.value;
	}

	/**
	 * Set the value in the database with the `set` function
	 * @param {databaseValue} value
	 * @returns {Promise<databaseValue>}
	 */
	async set(value) {
		this.lastValue = value;
		this.#reset = true;
		return new Promise(async res => {
			setTimeout(res, 5000);
			res(await this.#obtainFunc?.set?.(value));
		});
	}
	#obtainFunc;
	/**
	 * Reset the value to force the force asking next time
	 */
	reset() {
		this.#reset = true;
	}
	/**
	 * Reset the value
	 * @param {number} timeBeforeReset msec
	 */
	resetSoon(timeBeforeReset = 1000) {
		clearTimeout(this.#resetSoon);
		this.#resetSoon = setTimeout(_ => this.reset(), timeBeforeReset);
	}

	/**
	 * @param {{get: Function, set: Function}} obtainFunc
	 * @param {number} expireTime Time to store the value
	 */
	constructor(obtainFunc, expireTime = 1000) {
		this.expireTime = expireTime;
		this.#obtainFunc = obtainFunc;
	}
}

export class TemporaryList {
	expireTime;
	/**
	 * @type {Map<string,TemporaryValue>}
	 */
	list;
	#obtainFunc;

	/**
	 * Create a TemporaryValue in the list
	 * @param {databaseKey} key The unique key of the value
	 * @returns The new TemporaryValue
	 */
	createKey(key) {
		const tV = new TemporaryValue(
			{
				get: (..._) => this.#obtainFunc?.get?.(key, ..._),
				set: (..._) => this.#obtainFunc?.set?.(key, ..._),
			},
			this.expireTime
		);
		if (!this.list.has(key)) this.list.set(key, tV);
		return tV;
	}
	/**
	 * Get the TemporaryValue of the key
	 * @param {databaseKey} key The unique key of the value
	 * @returns The TemporaryValue of the key
	 */
	getRow(key) {
		return this.list.get(key) || this.createKey(key);
	}
	/**
	 * Get the value of the key
	 * @param {databaseKey} key The unique key of the value
	 * @returns The returns of the `get` function (of obtainFunc in the constructor)
	 */
	async get(key) {
		return this.getRow(key)?.get();
	}
	/**
	 * Set a value for the key
	 * @param {databaseKey} key The unique key of the value
	 * @param {dataBaseValue} value The value you want to store
	 * @returns The returns of the `set` function (of obtainFunc in the constructor)
	 */
	async set(key, value) {
		return this.getRow(key).set(value);
	}
	/**
	 * Reset every value in the list
	 */
	reset() {
		this.list.forEach(v => v.reset());
	}

	/**
	 * @param {{get: Function, set: Function}} obtainFunc The functions to get/set the value
	 * @param {number} expireTime Time to store the value
	 */
	constructor(obtainFunc, expireTime = 1000) {
		this.#obtainFunc = obtainFunc;
		this.expireTime = expireTime;
		this.list = new Map();
	}
}

export class TemporaryKVData extends TemporaryList {
	kvdatabase;
	/**
	 * @param {KVDataBase} kvdatabase The database with the values
	 * @param {number} timeout Time to store the value
	 */
	constructor(kvdatabase, timeout) {
		super(
			{
				get: k => kvdatabase.get(k),
				set: (k, v) => kvdatabase.set(k, v),
			},
			timeout
		);
		this.kvdatabase = kvdatabase;
	}
}

export class TemporaryKVDatabase extends TemporaryKVData {
	/**
	 * @param {PGDatabase} database The database, can be set later
	 * @param {string} tableName The name of the table in the database
	 * @param {KVDataBaseConfig} config The config of the table
	 * @param {number} timeout Time to store the value
	 */
	constructor(database, tableName, config, timeout = 10000) {
		super(new KVDataBase(database, tableName, config), timeout);
	}
	/**
	 * Change database link
	 * @param {PGDatabase} database The database
	 */
	setDatabase(database) {
		return this.kvdatabase.setDatabase(database);
	}
}
