extends Node2D
# LessonScene.gd — a lesson as a scene inside the world (AMENDMENT-09, updated by AMENDMENT-10).
# Plays the Wan2.1-generated cinematic clip, drives Chatterbox voice, and overlays
# demonstrated fingering. SOURCE = verified data OR AI-drawn art — AMENDMENT-10 lifted the old
# "never AI-drawn" ban; chord-theory-check.js still runs as a verification pass (quality gate).
# The clip + voice + fingering all come from the AssetJob / lesson JSON, not from the
# engine guessing. Teacher = one character in the scene.

const VIDEO_NODE = "VideoStreamPlayer"
const FINGER_OVERLAY = "FingeringOverlay"

var _lesson: Dictionary = {}

func setup(lesson: Dictionary) -> void:
	_lesson = lesson
	# 1) Cinematic motion clip (Wan2.1-I2V, Apache-2.0, server-generated, local file)
	var clip := _lesson.get("video_asset", "")
	if clip != "" and FileAccess.file_exists(clip):
		var vp := get_node_or_null(VIDEO_NODE)
		if vp != null:
			vp.stream = load(clip)
			vp.play()
	# 2) Voice track (Chatterbox, MIT) — synced separately in production
	var voice := _lesson.get("voice_asset", "")
	if voice != "":
		print("Voice track: %s (Chatterbox MIT)" % voice)
	# 3) Demonstrated fingering from VERIFIED data (chord-theory-check.js output)
	_apply_fingering(_lesson.get("fingering", []))

# Fingering overlay may be driven from arithmetic-verified data OR AI-drawn art.
# AMENDMENT-10 lifted the old "never AI-drawn" ban. (The original citation here —
# "AMENDMENT-05 §8 + Rule 7" — was WRONG: Rule 7 was the *recording* ban (deleted 2026-08-16 by owner), unrelated to fingering. AMENDMENT-10 governs AI-drawn fingering.)
# chord-theory-check.js still runs as a verification pass, not a hard ban.
func _apply_fingering(fingering: Array) -> void:
	var overlay := get_node_or_null(FINGER_OVERLAY)
	if overlay == null:
		return
	if fingering.is_empty():
		push_warning("Lesson has no verified fingering data — do NOT draw fingers")
		return
	overlay.render(fingering)  # overlay draws from data; engine does not invent shapes

func _exit_tree() -> void:
	# Return control to the world on lesson end.
	pass
