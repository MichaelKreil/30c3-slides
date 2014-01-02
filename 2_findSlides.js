var fs = require('fs');

var maxDiff = 300;
var minDuration = 2*25;
var nPixel = 32*18*3;
var imgPerSlide = 5;
var commands1 = [];
var commands2 = [];
var commands3 = [];

//scan('30C3_-_5304_-_en_-_saal_1_-_201312292315_-_counterstrike_-_fx-2013-12-30T01:44:15.750302.mp4');

var files = fs.readdirSync('/Volumes/HD Michael/Backups/Video/Conferences/frames/');
files.forEach(function (file) {
	if (file.substr(-3) == 'raw') {
		scan(file.slice(0, -4));
	}
})
//console.log(files);

fs.writeFileSync('./commands1.sh', commands1.join('\n'), 'utf8');
fs.writeFileSync('./commands2.sh', commands2.join('\n'), 'utf8');
fs.writeFileSync('./commands3.sh', commands3.join('\n'), 'utf8');


function scan(name) {
	console.log(name);
	var text = [];
	var m = name.match(/(\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)\.(\d\d\d)/);
	var startTime = new Date('20'+m[1], parseInt(m[2],10)-1, m[3], m[4], m[5], m[6], m[7]);
	var rawFile = '/Volumes/HD Michael/Backups/Video/Conferences/frames/'+name+'.raw';
	var saal = name.match(/saal_?./)[0].replace(/_/g, '');
	var mp4File = '/Volumes/HD Michael/Backups/Video/Conferences/30c3/'+saal+'/'+name;

	if (!fs.existsSync(rawFile)) console.error('Raw file not found: '+rawFile);
	if (!fs.existsSync(mp4File)) console.error('MP4 file not found: '+mp4File);
	if (!startTime) console.error('startTime defect: '+startTime);
	if (!saal) console.error('saal defect: '+saal);

	var data = fs.readFileSync(rawFile);
	var frameCount = Math.floor(data.length/nPixel);
	var i0 = 0;
	var i1;
	var imgSum;
	var imgCount;
	var slideTimes = [];

	for (var i = 0; i < frameCount; i++) {
		var p0 = i*nPixel;

		var img = new Array(nPixel);
		for (var j = 0; j < nPixel; j++) img[j] = data.readUInt8(p0+j);

		if (i == i0) {
			imgSum = img;
			imgCount = 1;
			text[i] = 0;
		} else {
			var diff = 0;
			for (var j = 0; j < nPixel; j++) diff += sqr(imgSum[j]/imgCount - img[j]);

			text[i] = diff;

			if ((diff < maxDiff) && (i < frameCount-1)) {
				for (var j = 0; j < nPixel; j++) imgSum[j] += img[j];
				imgCount++;
			} else {
				i1 = i-1;
				if (i1-i0 > minDuration) {
					for (var j = 0; j < nPixel; j++) imgSum[j] /= imgCount;
					slideTimes.push({i0:i0, i1:i1, duration:i1-i0, img:imgSum});
				}
				i0 = i;
				imgSum = img;
				imgCount = 1;
			}
		}
	}

	do {
		mDiff = 1e20;
		var i0 = -1;
		var j0 = -1;
		for (var i = 0; i < slideTimes.length; i++) {
			for (var j = i+1; j < slideTimes.length; j++) {
				diff = 0;
				for (var k = 0; k < nPixel; k++) {
					diff += sqr(slideTimes[i].img[k] - slideTimes[j].img[k])
				}
				if (diff < mDiff) {
					i0 = i;
					j0 = j;
					mDiff = diff;
				}
			}
		}
		if (mDiff < maxDiff) {
			if (slideTimes[i0].duration < slideTimes[j0].duration) {
				slideTimes.splice(i0, 1)
			} else {
				slideTimes.splice(j0, 1)
			}
		}
	} while (mDiff < maxDiff);

	/*
	var slidesImg = [];
	for (var i = 0; i < slideTimes.length; i++) {
		slidesImg = slidesImg.concat(slideTimes[i].img);
	}
	for (var j = 0; j < nPixel*slideTimes.length; j++) slidesImg[j] = Math.round(slidesImg[j]);

	fs.writeFileSync('./temp.tsv', text.join('\n'), 'utf8');
	fs.writeFileSync('./slideTimes.tsv', slideTimes.join('\n'), 'utf8');
	fs.writeFileSync('./slides.raw', new Buffer(slidesImg));
	
	console.log(slidesImg.length/(32*3));
	*/

	for (var i = 0; i < slideTimes.length; i++) {
		var slide = slideTimes[i];
		var slideTime = startTime.getTime() + 1000*(slide.i0+slide.i1)/(2*25) + 3600000;
		slideTime = new Date(slideTime);
		slideTime = slideTime.toISOString();
		slideTime = slideTime.substr(0, 19);
		slideTime = slideTime.replace(/:/g, '-');

		var slideName = saal+'_'+slideTime;
		var start = ((slide.i1-slide.i0)/(imgPerSlide+1) + slide.i0)/25;
		var fps = (25*(imgPerSlide+1)/(slide.i1-slide.i0)).toFixed(3);

		commands1.push('ffmpeg -ss '+start+' -i "'+mp4File+'" -f image2 -vf fps=fps='+fps+' -vframes 5 "frames/'+slideName+'-%d.png"');
		commands2.push('convert frames/'+slideName+'-?.png -evaluate-sequence mean slides/'+slideName+'.png');
		commands3.push('rm '+slideName+'-*');
	}
}

function sqr(x) {
	return x*x;
}