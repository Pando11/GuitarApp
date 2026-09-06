extends Node2D
# World.gd — the game-like story-world root (AMENDMENT-09).
# The student "enters" here. Lessons are data-driven: this node reads lesson_manifest.json
# and instantiates a LessonScene when the student chooses a lesson. The teacher is ONE
# character in the world, not the whole product.

const LessonScene = preload("res://lesson/LessonScene.tscn")
const MANIFEST_PATH = "res://data/lesson_manifest.json"

var lessons: Array = []
var current_scene: Node = null

func _ready() -> void:
	# In a real build this is wired to the Supabase curriculum feed. Scaffold loads local JSON.
	_load_manifest()
	_build_world_entry()
	# DEMO HOOK: auto-enter the World-1 cold open so F5 shows the video + @Sage voice.
	# Remove this line once a real lesson menu/UI calls enter_lesson().
	enter_lesson("W1-coldopen")

func _load_manifest() -> void:
	if not FileAccess.file_exists(MANIFEST_PATH):
		push_warning("lesson_manifest.json missing at %s" % MANIFEST_PATH)
		return
	var f := FileAccess.open(MANIFEST_PATH, FileAccess.READ)
	var txt := f.get_as_text()
	f.close()
	var parsed: Variant = JSON.parse_string(txt)
	if typeof(parsed) != TYPE_ARRAY:
		push_error("lesson_manifest.json must be a JSON array")
		return
	lessons = parsed

func _build_world_entry() -> void:
	# Placeholder world: a list of lesson "doors". Real art = Flux still + Wan2.2 motion.
	for entry in lessons:
		if entry is Dictionary:
			print("World door: %s (%s)" % [entry.get("title", "?"), entry.get("id", "?")])

# Called by UI when the student picks a lesson. Triggers the lesson scene.
func enter_lesson(lesson_id: String) -> void:
	var data: Dictionary = {}
	for l in lessons:
		if l is Dictionary and l.get("id") == lesson_id:
			data = l
	if data.is_empty():
		push_error("Unknown lesson_id: %s" % lesson_id)
		return
	if current_scene != null:
		current_scene.queue_free()
	current_scene = LessonScene.instantiate()
	add_child(current_scene)
	# Defer setup so the lesson scene has entered the tree (VideoStreamPlayer.play()
	# requires the node to be inside the tree). add_child() during _ready() defers the
	# child's enter_tree to the next frame, so call setup on the next idle tick.
	current_scene.call_deferred("setup", data)
