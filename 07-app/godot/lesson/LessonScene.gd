extends Node2D
# LessonScene.gd — a lesson as a scene inside the world (AMENDMENT-09, updated by AMENDMENT-10).
# Plays the World-1 cold-open clip sequence (B00->B01->B02) and the matching @Sage voice
# over B01/B02. SOURCE = the asset manifest, NOT the engine guessing. Teacher = one character.
#
# The lesson dict (from lesson_manifest.json) supports:
#   clips:        [ "res://.../B00_walkin.mp4", ... ]   (sequenced, played in order)
#   voice_assets: { "B01_meetsage": "res://.../B01_welcome_adult.wav", ... }
#                 keyed by the STEM of the clip filename, so each clip can have its own line.
#   fingering:    [ ... ]  (verified chord-theory data; optional)

# The video sits inside a CanvasLayer -> AspectRatioContainer so a 16:9 clip
# letterboxes inside the 720x1280 portrait viewport instead of drawing at native
# size and spilling off the window. The CanvasLayer is load-bearing: Controls
# parented straight to a Node2D compute to zero size, which scales an expanding
# VideoStreamPlayer down to nothing.
const VIDEO_NODE = "UI/Screen/VideoStreamPlayer"
const AUDIO_NODE = "AudioStreamPlayer"
const FINGER_OVERLAY = "FingeringOverlay"

# Emitted once the last clip in the sequence has played, so the world can put
# something on screen instead of leaving the student staring at a dead frame.
signal lesson_finished(lesson_id: String)

var _lesson: Dictionary = {}
var _clips: Array = []
var _voice_map: Dictionary = {}
var _clip_index: int = 0


func _ready() -> void:
	# Connect the clip-finished signal so the cold open advances B00 -> B01 -> B02.
	var vp := get_node_or_null(VIDEO_NODE)
	if vp != null:
		if not vp.finished.is_connected(_on_VideoStreamPlayer_finished):
			vp.finished.connect(_on_VideoStreamPlayer_finished)


func setup(lesson: Dictionary) -> void:
	_lesson = lesson
	_clips = lesson.get("clips", [])
	_voice_map = lesson.get("voice_assets", {})
	if _clips.is_empty():
		# Fallback: older single-clip shape.
		var single = lesson.get("video_asset", "")
		if single != "":
			_clips = [single]
	_apply_fingering(lesson.get("fingering", []))
	if _clips.is_empty():
		push_warning("Lesson '%s' has no clips to play." % lesson.get("id", "?"))
		return
	_play_current()


func _play_current() -> void:
	if _clip_index >= _clips.size():
		print("Lesson '%s' finished." % _lesson.get("id", "?"))
		# Leave the last frame on screen rather than clearing to black, then tell
		# the world we are done so it can show the entry screen again.
		lesson_finished.emit(String(_lesson.get("id", "")))
		return
	var clip_path: String = _clips[_clip_index]
	var vp := get_node_or_null(VIDEO_NODE)
	if vp == null:
		push_error("Missing %s node" % VIDEO_NODE)
		return
	var stream: VideoStream = load(clip_path)
	if stream == null:
		push_error("Could not load clip: %s" % clip_path)
		return
	vp.stream = stream
	vp.play()

	# Sync the matching voice line (keyed by clip filename stem).
	var stem: String = clip_path.get_file().get_basename()
	if _voice_map.has(stem):
		_play_voice(_voice_map[stem])


func _play_voice(wav_path: String) -> void:
	var ap := get_node_or_null(AUDIO_NODE)
	if ap == null:
		push_warning("Missing %s node" % AUDIO_NODE)
		return
	var audio: AudioStream = load(wav_path)
	if audio == null:
		push_warning("Could not load voice: %s" % wav_path)
		return
	ap.stream = audio
	ap.play()
	print("Voice: %s (Chatterbox MIT)" % wav_path)


func _on_VideoStreamPlayer_finished() -> void:
	# Advance to the next clip in the sequence.
	_clip_index += 1
	_play_current()


# Fingering overlay may be driven from arithmetic-verified data OR AI-drawn art.
# AMENDMENT-10 lifted the old "never AI-drawn" ban. chord-theory-check.js still runs as a
# verification pass, not a hard ban. The engine never invents shapes — it renders data.
func _apply_fingering(fingering: Array) -> void:
	var overlay := get_node_or_null(FINGER_OVERLAY)
	if overlay == null:
		return
	if fingering.is_empty():
		return
	overlay.render(fingering)


func _exit_tree() -> void:
	pass
