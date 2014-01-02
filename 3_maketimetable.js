var fs = require('fs');

var rooms = ['saal1', 'saal2', 'saal6', 'saalg'];
var days = []

var schedule = JSON.parse(fs.readFileSync('schedule.json', 'utf8'));
schedule = schedule.schedule.conference.days;

rooms.forEach(function (room) {
	var slides = findSlides(room);

	slides.forEach(function (day, dayNo) {
		day = day.sort(function (a,b) {
			return a.seconds-b.seconds;
		});

		slots = [];
		day.forEach(function (slide) {
			var slot = Math.floor(slide.seconds/600);
			if (slots[slot] === undefined) slots[slot] = [];
			slots[slot].push(slide);
		});

		var table = [];
		for (var t = 0; t < 16*6; t++) {
			var thumbs = slots[t] ? slots[t] : [];
			thumbs = thumbs.map(function (slide) {
				var img = '<img src="../slides_thumb/'+slide.file+'.jpeg" width="64" height="36" />';
				img = '<a href="../slides_jpeg/'+slide.file+'.jpg" target="_blank">'+img+'</a>';
				return img;
			})
			var minute = t + 11*6;
			var h = Math.floor(minute/6) % 24;
			var m = (minute % 6)*10;
			m = (m+100).toFixed(0).substr(1);
			var time = h+':'+m;

			table[t] = [
				false,
				'<td class="time">'+time+'</td>',
				'<td>'+thumbs.join('')+'</td>'
			];
		}

		var roomName = 'Saal '+room.substr(4,1).toUpperCase();
		var plan = schedule[dayNo-1];
		plan = plan.rooms[roomName];

		plan.forEach(function (talk, index) {
			var seconds = (new Date(talk.date)).getTime();
			seconds = (seconds/1000 - 1388052000 - dayNo*86400);
			var slot = Math.floor(seconds/600);

			var speakers = talk.persons.map(function (person) {
				return person.full_public_name;
			}).join(', ')

			table[slot][0] = talk.title+'<br><span class="speakers">('+speakers+')</span>';
		});

		var c = 1;
		for (var i = table.length-1; i >= 0; i--) {
			if (table[i][0]) {
				table[i][0] = '<td rowspan="'+c+'" class="title">'+table[i][0]+'</td>';
				c = 1;
			} else {
				table[i][0] = '';
				c++; // nothing to do with the programming language!
			}
		}

		table = table.map(function (row, index) {
			return '<tr'+(index%6 ? '' : ' class="highlight"')+'>'+row.join('')+'</tr>';
		})

		var html = [
			'<!DOCTYPE html>',
			'<html lang="en">',
			'<head>',
			'<link rel="stylesheet" type="text/css" media="screen" href="style/main.css">',
			'</head>',
			'<body>',
			'<h1>30C3 - Day '+dayNo+' - '+roomName+'</h1>',
			'<table class="timetable">',
			table.join('\n'),
			'</table>',
			'</body>',
			'</html>'
		].join('\n');

		fs.writeFileSync('html/'+room+'_'+dayNo+'.html', html, 'utf8');
	});
});



function findSlides(room) {
	var result = [];

	fs.readdirSync('slides/'+room).forEach(function (file, index) {
		//console.log(file);
		var m = file.match(/(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d)-(\d\d)-(\d\d)/);
		var date = new Date(m[1], parseInt(m[2],10)-1, m[3], m[4], m[5], m[6]);
		var day = parseInt(m[3],10)-26;
		
		if (parseInt(m[4], 10) < 6) day--; // Tag geht bis 6 Uhr.

		if (result[day] === undefined) result[day] = [];

		var seconds = (date.getTime()/1000 - 1388052000 - day*86400);

		result[day].push({
			file:room+'/'+file.substr(0,19),
			room:room,
			date:date,
			day:day,
			seconds:seconds
		})
	})

	return result;
}

