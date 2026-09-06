#!/usr/bin/env bash
set -e
BASE="C:/Users/The Yoda Trader/Desktop/GuitarApp"
OUT="$BASE/03-research/lesson-preview"
T="$OUT/_clips"
mkdir -p "$T" "$OUT/fonts"
cp "/c/Windows/Fonts/arial.ttf" "$OUT/fonts/arial.ttf"
cp "/c/Windows/Fonts/arialbd.ttf" "$OUT/fonts/arialbd.ttf"
FONT="fonts/arial.ttf"
FONTB="fonts/arialbd.ttf"
COACH_M="$BASE/06-prototypes/assets/coach-options/coach-2-man.png"
COACH_W="$BASE/06-prototypes/assets/coach-options/coach-1-woman.png"
FINAL="$OUT/guitarapp-lesson-preview.mp4"

cd "$OUT"

zoom() {
  ffmpeg -y -loop 1 -i "$1" \
    -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0011,1.14)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p" \
    -t "$2" -r 30 -c:v libx264 -pix_fmt yuv420p -preset veryfast "$3"
}
caption() {
  printf '%s' "$2" > cap.txt
  ffmpeg -y -i "$1" \
    -vf "drawtext=fontfile=$FONTB:textfile=cap.txt:fontcolor=white:fontsize=58:x=(w-text_w)/2:y=h*0.82:shadowcolor=black:shadowx=2:shadowy=2" \
    -c:v libx264 -pix_fmt yuv420p -preset veryfast "$3"
}
card() {
  ffmpeg -y -f lavfi -i "color=c=0x123049:s=1080x1920:d=$1" \
    -vf "drawtext=fontfile=$FONTB:text=$2:fontcolor=white:fontsize=118:x=(w-text_w)/2:y=h*0.40,drawtext=fontfile=$FONT:text=$3:fontcolor=0xffd166:fontsize=58:x=(w-text_w)/2:y=h*0.54,drawtext=fontfile=$FONT:text=$4:fontcolor=white:fontsize=88:x=(w-text_w)/2:y=h*0.62" \
    -t "$1" -r 30 -c:v libx264 -pix_fmt yuv420p -preset veryfast "$5"
}

# ---- E-minor chord diagram card (verified data: strings 6..1, finger on A=fret2, D=fret2) ----
# Canvas 1080x1920 navy; draw a fretboard: 6 strings x 4 frets, dots at A(5th) & D(4th) on fret 2.
chordcard() {
  local dur="$1"; local out="$2"
  ffmpeg -y -f lavfi -i "color=c=0x123049:s=1080x1920:d=$dur" \
  -vf "
    drawtext=fontfile=$FONTB:text='E minor':fontcolor=white:fontsize=110:x=(w-text_w)/2:y=180,
    drawtext=fontfile=$FONT:text='your first chord - two fingers':fontcolor=0xffd166:fontsize=46:x=(w-text_w)/2:y=300,
    drawbox=x=240:y=470:w=600:h=14:color=0xffd166:t=fill,
    drawbox=x=240:y=620:w=600:h=4:color=0x4ea1ff:t=fill,
    drawbox=x=240:y=800:w=600:h=4:color=0x4ea1ff:t=fill,
    drawbox=x=240:y=980:w=600:h=4:color=0x4ea1ff:t=fill,
    drawbox=x=240:y=1160:w=600:h=4:color=0x4ea1ff:t=fill,
    drawbox=x=240:y=470:w=4:h=704:color=white:t=fill,
    drawbox=x=360:y=470:w=4:h=704:color=white:t=fill,
    drawbox=x=480:y=470:w=4:h=704:color=white:t=fill,
    drawbox=x=600:y=470:w=4:h=704:color=white:t=fill,
    drawbox=x=720:y=470:w=4:h=704:color=white:t=fill,
    drawbox=x=840:y=470:w=4:h=704:color=white:t=fill,
    drawbox=x=560:y=650:w=80:h=80:color=0x6ee7ff:t=fill,
    drawbox=x=440:y=650:w=80:h=80:color=0x6ee7ff:t=fill,
    drawtext=fontfile=$FONTB:text='O':fontcolor=0x9fe6ff:fontsize=44:x=222:y=410,
    drawtext=fontfile=$FONTB:text='O':fontcolor=0x9fe6ff:fontsize=44:x=822:y=410,
    drawtext=fontfile=$FONTB:text='E':fontcolor=white:fontsize=40:x=228:y=1190,
    drawtext=fontfile=$FONTB:text='A':fontcolor=white:fontsize=40:x=348:y=1190,
    drawtext=fontfile=$FONTB:text='D':fontcolor=white:fontsize=40:x=468:y=1190,
    drawtext=fontfile=$FONTB:text='G':fontcolor=white:fontsize=40:x=588:y=1190,
    drawtext=fontfile=$FONTB:text='B':fontcolor=white:fontsize=40:x=708:y=1190,
    drawtext=fontfile=$FONTB:text='e':fontcolor=white:fontsize=40:x=828:y=1190,
    drawtext=fontfile=$FONT:text='Open low E, G, B, high e. Press A + D on fret 2.':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=1320
  " -t "$dur" -r 30 -c:v libx264 -pix_fmt yuv420p -preset veryfast "$out"
}

zoom "$COACH_M" 4 "$T/z1.mp4"; caption "$T/z1.mp4" "Meet your teacher" "$T/1.mp4"
card 3 "GuitarApp" "Lesson 1 - Your First Chord" "E minor" "$T/2.mp4"
chordcard 4 "$T/3.mp4"
zoom "$COACH_W" 3 "$T/z4.mp4"; caption "$T/z4.mp4" "Let's play!" "$T/4.mp4"

printf "file '%s'\n" "$T/1.mp4" "$T/2.mp4" "$T/3.mp4" "$T/4.mp4" > "$T/list.txt"
ffmpeg -y -f concat -safe 0 -i "$T/list.txt" -c copy "$FINAL"
echo "=== DONE ==="
ffprobe -v error -show_entries format=duration -of csv=p=0 "$FINAL"
ffprobe -v error -show_entries stream=width,height,codec_name,r_frame_rate -of csv=p=0 "$FINAL"
ls -la "$FINAL"
