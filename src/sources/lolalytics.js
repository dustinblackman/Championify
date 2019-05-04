/* eslint-disable indent */
import R from 'ramda';
import {
	cl,
	request,
	shorthandSkills,
	trinksCon
} from '../helpers';

import progressbar from '../progressbar';
import store from '../store';
import T from '../translate.js';

const default_schema = require('../../data/default.json');

let cache;
let cacheAram;
const skills_map = {
	1: 'Q',
	2: 'W',
	3: 'E',
	4: 'R'
};

function getCache() {
	if (cache) return cache;
	cache = request({
		url: `http://championify.lolalytics.com/data/1.0/ranked.json`,
		json: true
	});
	return cache;
}

function getCacheAram() {
	if (cacheAram) return cacheAram;
	cacheAram = request({
		url: `http://championify.lolalytics.com/data/1.0/aram.json`,
		json: true
	});
	return cacheAram;
}

export function getVersion() {
	return getCache()
		.then(R.prop('version'))
		.then(version => {
			const split = version.split('.');
			split.pop();
			return split.join('.');
		})
		.tap(version => store.set('lolalytics_ver', version));
}

function objToItems(title, set_type, obj) {
	let items = R.sortBy(R.prop('rate'), R.map(id => ({
		id,
		count: 1,
		rate: obj[id]
	}), R.keys(obj)));

	return {
		type: `${set_type} ${title}`,
		items: R.reverse(R.map(R.omit(['rate']), items))
	};
}

function mapSkills(skills) {
	if (!skills) return [];

	const skills_list = R.sortBy(R.prop('rate'), R.map(entry => ({
		skills: entry,
		rate: skills[entry]
	}), R.keys(skills)));
	const mapped_skills = R.map(entry => skills_map[entry], R.last(skills_list).skills);

	if (store.get('settings').skillsformat) return shorthandSkills(mapped_skills);
	return mapped_skills;
}

function createJSON(champ, skills, position, blocks, set_type) {
	let title = position;
	if (set_type) title += ` ${set_type}`;
	var map = (set_type === 'ARAM' ? 'HA' : 'SR');
	const riot_json = R.merge(default_schema, {
		champion: champ,
		title: `LAS ${store.get('lolalytics_ver')} ${title}`,
		blocks: trinksCon(blocks, skills),
		map: map
	});

	return {
		champ,
		file_prefix: title.replace(/ /g, '_').toLowerCase(),
		riot_json,
		source: 'lolalytics'
	};
}

function processSets(champ, position, sets) {
	const skills = {
		most_freq: mapSkills(sets.skillpick),
		highest_win: mapSkills(sets.skillwin)
	};

	const mostfreq = {
		starting: objToItems(T.t('starting_items', true), T.t('most_freq', true), sets.startingitempick),
		boots: objToItems(T.t('boots', true), T.t('most_freq', true), sets.bootspick),
		first: objToItems(T.t('first_item', true), T.t('most_freq', true), sets.item1pick),
		second: objToItems(T.t('second_item', true), T.t('most_freq', true), sets.item2pick),
		third: objToItems(T.t('third_item', true), T.t('most_freq', true), sets.item3pick),
		fourth: objToItems(T.t('fourth_item', true), T.t('most_freq', true), sets.item4pick),
		fifth: objToItems(T.t('fifth_item', true), T.t('most_freq', true), sets.item5pick)
	};

	const highestwin = {
		starting: objToItems(T.t('starting_items', true), T.t('highest_win', true), sets.startingitemwin),
		boots: objToItems(T.t('boots', true), T.t('highest_win', true), sets.bootspick),
		first: objToItems(T.t('first_item', true), T.t('highest_win', true), sets.item1win),
		second: objToItems(T.t('second_item', true), T.t('highest_win', true), sets.item2win),
		third: objToItems(T.t('third_item', true), T.t('highest_win', true), sets.item3win),
		fourth: objToItems(T.t('fourth_item', true), T.t('highest_win', true), sets.item4win),
		fifth: objToItems(T.t('fifth_item', true), T.t('highest_win', true), sets.item5win)
	};

	if (store.get('settings').splititems) {
		return [
			createJSON(champ, skills, position, R.values(mostfreq), T.t('most_freq', true)),
			createJSON(champ, skills, position, R.values(highestwin), T.t('highest_win', true))
		];
	}

	return createJSON(champ, skills, position, [
		mostfreq.starting,
		highestwin.starting,
		mostfreq.boots,
		highestwin.boots,
		mostfreq.first,
		highestwin.first,
		mostfreq.second,
		highestwin.second,
		mostfreq.third,
		highestwin.third,
		mostfreq.fourth,
		highestwin.fourth,
		mostfreq.fifth,
		highestwin.fifth
	]);
}

function trimItemSets(sets, count) {
	var trimmedSets = {
		startingitempick: {},
		bootspick: {},
		item1pick: {},
		item2pick: {},
		item3pick: {},
		item4pick: {},
		item5pick: {}
	};
	for (const setName in trimmedSets) {
		try {
			var counter = 0;
			for (var key in sets[setName]) {
				counter++;
				trimmedSets[setName][`${key}`] = sets[setName][key];
				if (counter === count) {
					break;
				}
			}
		} catch (error) {
			cl(`${error}`);
		}
	}
	return trimmedSets;
}

function processAramSets(champ, position, sets) {
	const skills = {
		most_freq: mapSkills(sets.skillpick),
		highest_win: mapSkills(sets.skillwin)
	};

	var trimmedSets = trimItemSets(sets, 6);
	const aramwin = {
		starting: objToItems(T.t('starting_items', true), T.t('aram', true), trimmedSets.startingitempick),
		boots: objToItems(T.t('boots', true), T.t('aram', true), trimmedSets.bootspick),
		first: objToItems(T.t('first_item', true), T.t('aram', true), trimmedSets.item1pick),
		second: objToItems(T.t('second_item', true), T.t('aram', true), trimmedSets.item2pick),
		third: objToItems(T.t('third_item', true), T.t('aram', true), trimmedSets.item3pick),
		fourth: objToItems(T.t('fourth_item', true), T.t('aram', true), trimmedSets.item4pick),
		fifth: objToItems(T.t('fifth_item', true), T.t('aram', true), trimmedSets.item5pick)
	};

	if (store.get('settings').splititems) {
		return [
			createJSON(champ, skills, position, R.values(aramwin), T.t('aram', true))
		];
	}

	return createJSON(champ, skills, position, [
		aramwin.starting,
		aramwin.boots,
		aramwin.first,
		aramwin.second,
		aramwin.third,
		aramwin.fourth,
		aramwin.fifth
	]);
}


export function getSr() {
	if (!store.get('lolalytics_ver')) return getVersion().then(getSr);

	return getCache()
		.then(R.prop('stats'))
		.then(stats => {
			return R.map(champ => {
				cl(`${T.t('processing')} Lolalytics: ${T.t(champ)}`);
				progressbar.incrChamp();

				return R.map(position => {
					return processSets(champ, position, stats[champ][position]);
				}, R.keys(stats[champ]));
			}, R.keys(stats));
		})
		.then(R.flatten)
		.then(data => store.push('sr_itemsets', data));
}

export const source_info = {
	name: 'Lolalytics',
	id: 'lolalytics'
};

export function getAram() {
	if (!store.get('lolalytics_ver')) return getVersion().then(getSr);

	return getCacheAram()
		.then(R.prop('stats'))
		.then(stats => {
			return R.map(champ => {
				cl(`${T.t('processing')} Lolalytics ARAM: ${T.t(champ)}`);
				progressbar.incrChamp();

				return R.map(position => {
					return processAramSets(champ, position, stats[champ][position]);
				}, R.keys(stats[champ]));
			}, R.keys(stats));
		})
		.then(R.flatten)
		.then(aramData => store.set('aram_itemsets', aramData));
}
