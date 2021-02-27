import express from 'express';
import favicon from 'serve-favicon';

const app = express();
const __dirname = process.env.INIT_CWD;
app.use(favicon(__dirname + '/favicon.ico'));

/**
 * Create a link between the url and a file
 * @param {string} webPath The relative path in the url
 * @param {string} filePath The relative path of the file
 */
function registerWeb(webPath, filePath) {
	app.get(webPath, (req, res) => {
		if (!filePath.startsWith('/')) filePath = '/' + filePath;
		res.sendFile(__dirname + filePath, undefined, (err) => {
			if (!err) return;
			if (err.errno == -4058) {
				res.send(`File not found : ${filePath}`);
				console.log(`File not found : '${err.path}'`.red);
			}
			else {
				res.send(`An error occurred, please try again later (${err.status})`);
				console.error(err);
			}
		})
	});
}

//l'ordre est important : les premiers sont prioritaires
registerWeb('/', '/web/index.html');
registerWeb('/main.css', '/web/css/main.css');
//registerWeb('/main.js', '/web/js/main.js');


// page unknow
app.use((req, res) => {
	res.status(404);
	res.sendFile(__dirname + '/web/unknow.html', undefined, (error) => {
		if (!error) return;
		if (error.errno == -4058) {
			res.send(`File not found`);
			console.log(`File not found : '${error.path}'`.red);
		}
		else {
			res.send(`An error occurred, please try again later (${error.status})`);
			console.error(error);
		}
	});
});




//TODO: tests pour Heroku
import os, { networkInterfaces } from 'os';
import dns from 'dns';
const nets = networkInterfaces();


export default {
	start() {
		const port = parseInt(process.env.PORT) || 80;
		app.listen(port, () => {
			console.log(`Network Interaces : `, nets);
			dns.lookup(os.hostname(), function (err, add, fam) {
				console.log('addr: ' + add);
			})
			var ipv4Addr = Object.values(nets)?.[0]?.find(c => c.family === 'IPv4')?.address;
			console.log(`Server running at http://${ipv4Addr}:${port}/`.blue);
		});
	},
};