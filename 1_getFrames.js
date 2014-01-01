var fs = require('fs');

scan('saal1');
scan('saal2');
scan('saal6');
scan('saalg');

//ffmpeg -i "/Volumes/HD Michael/Backups/Video/Conferences/30c3/saal1/30C3_-_5192_-_en_-_saal_1_-_201312291600_-_android_ddi_-_collin_mulliner-2013-12-29T15:50:12.156207.mp4" -an -s 32x18 -pix_fmt rgb24 -vcodec rawvideo -f rawvideo "/Volumes/HD Michael/Backups/Video/Conferences/frames/30C3_-_5192_-_en_-_saal_1_-_201312291600_-_android_ddi_-_collin_mulliner-2013-12-29T15:50:12.156207.mp4.raw"

function scan(name) {
	var folder = '/Volumes/HD Michael/Backups/Video/Conferences/30c3/'+name+'/';
	var files = fs.readdirSync(folder);
	files.forEach(function (file) {
		var end = file.match(/(2013-12-..T.*?)$/);
		if (!end) {
			//console.log(file);
			return;
		} else {
			end = end[1];
		}
		var extension = end.match(/\.([^\.]*?)$/)[1];
		var size = fs.statSync(folder+file).size;
		if (size > 4096) {
			console.log(folder+file);
		}

		//var size
		//console.log(end);
	})
}
fs.read