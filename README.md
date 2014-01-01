# 30c3-slides

Extracting all slides from all 30c3 talks.

## 1. What I need

Is there any way to match the found slides to the corresponding talk (e.g. by date and time) and create something like folders or PDFs for each talk?

Problem is that because of delays we don't know which talk was exactly at which time.
Also the filenames of the streams seem to be incorrect.

Does the information exists, at which exact time each talk started?

## 2. Current state

Now I have a lot of png files of every automatically found slide. Every file has a filename containing the room (e.g. `saal1`) and the time (e.g. `2013-12-27T20-19-34`) when it was shown.

## 3. What I did

I rsynced all 30c3-streams to my hard drive.

With `1_getFrames.js` I scanned for all mp4 files. Than I converted them with:

    ffmpeg -i "...mp4" -an -s 32x18 -pix_fmt rgb24 -vcodec rawvideo -f rawvideo "...mp4.raw"

These .raw files contain all frames in very low resolution (32x18) as 8-Bit-RGB.

With `2_findSlides.js` I scanned all these .raw files and checked, when frames are showing slides (by calculating the differences between frames - sum of squared differences between pixel colors). A slide must be shown for at least 2 seconds.

The resulting slides are filtered additionally to remove duplicates.

These slide informations are then exported as three bash scripts:

- `commands1.sh` uses `ffmpeg` to extract 5 frames per slide as pngs
- `commands2.sh` uses `imagemagick convert` to merge these 5 frames to one slide (for noise reduction).
- `commands3.sh` removes these temporary frames.
