import { MessageMaker } from '../../lib/messageMaker.js';

export default {
	name: 'calc',
	description: 'Calculs et lancés de dés',
	alts: ['r'],
	interactions: true,
	
	security: {
		place: 'public'
	},

	options: [{
		name: 'ligne_de_calcul',
		description: 'Le calcul à faire',
		type: 3,
		required: true
	}],


	executeAttribute(cmdData, levelOptions) {
		var lineCalc = levelOptions.map(o => o.value).join(' ');

		const comment = lineCalc.match(/#.*$/)?.[0] || '';
		if(comment.length) {
			lineCalc = lineCalc.substr(0, lineCalc.length - comment.length);
		}
		const space = comment.length ? ' ' : '';
		lineCalc = lineCalc.replace(/ +$/, '');


		return new MessageMaker(`\`${lineCalc}\`${space}${comment} = ${calculate(lineCalc)}`);
	}

}


function getRandomInt(max) { return Math.floor(Math.random() * Math.floor(max)); }

const diceMatch = '(\\d*)d(\\d*)';
function rollDices(dices = 1, max = 6) {
	return new Array(parseInt(dices || 1)).fill(0)
		.map(_ => getRandomInt(parseInt(max || 6))+1);
}

const specialCalc = [
	[diceMatch+' ?>(\\d*)', (match) => rollDices(match).map(v => v > match[3] ? v : `~~${v}~~`).join('+')],
	[diceMatch+' ?>=(\\d*)', (match) => rollDices(match).map(v => v >= match[3] ? v : `~~${v}~~`).join('+')],
	[diceMatch+' ?=(\\d*)', (match) => rollDices(match).map(v => v == match[3] ? v : `~~${v}~~`).join('+')],
	[diceMatch+' ?==(\\d*)', (match) => rollDices(match).map(v => v == match[3] ? v : `~~${v}~~`).join('+')],
	[diceMatch+' ?<=(\\d*)', (match) => rollDices(match).map(v => v <= match[3] ? v : `~~${v}~~`).join('+')],
	[diceMatch+' ?<(\\d*)', (match) => rollDices(match).map(v => v < match[3] ? v : `~~${v}~~`).join('+')],
	[diceMatch, (match) => rollDices(match[1], match[2]).join('+')],
]

const basicCalc = [
	[/~~\d*~~/, _ => ''],//deleted number
	[/(\d*)\*(\d*)/, (match) => parseInt(match[1] || 0) * parseInt(match[2] || 0)],
	[/(\d*)\/(\d*)/, (match) => parseInt(match[1] || 0) / parseInt(match[2] || 0)],
	[/(\d*)\+(\d*)/, (match) => parseInt(match[1] || 0) + parseInt(match[2] || 0)],
	[/(\d*)\-(\d*)/, (match) => parseInt(match[1] || 0) - parseInt(match[2] || 0)],
]


function calculate(line) {

	line = line.replace(/(\d) +(\d)/g,'$1+$2').replace(/ /g, '');
	//`!r 1++2 * 5` donne `1+2*5`

	
	line = applyTransfo(line, specialCalc);
	var result = applyTransfo(line, basicCalc);

	//console.log('result:', { line, result});


	return `(${line}) = ${result}`;
}


function applyTransfo(line, rules) {

	var i = 0;

	for(const special of rules) {
		const regex = new RegExp(special[0]);
		var match;
		while(match = line.match(regex)) {

			const replacement = special[1](line.match(regex));
			line = line.replace(match[0], replacement);
			
			//console.log('replacement:', {regex, match: match[0], replacement, line});
			
			
			
			//TODO: remove this limit
			i++;
			if(i > 100) break;
		}
	}
	return line;
}