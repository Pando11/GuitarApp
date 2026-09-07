extends Node2D
# World.gd — the game-like story-world root (AMENDMENT-09).
# The student "enters" here. Lessons are data-driven: this node reads lesson_manifest.json
# and instantiates a LessonScene when the student chooses a lesson. The teacher is ONE
# character in the world, not the whole product.

const LessonScene = preload("res://lesson/LessonScene.tscn")
const MANIFEST_PATH = "res://data/lesson_manifest.json"
const ENTRY_UI = "EntryUI"
const LESSON_LIST = "EntryUI/LessonList"

var lessons: Array = []
var current_scene: Node = null

func _ready() -> void:
	# In a real build this is wired to the Supabase curriculum feed. Scaffold loads local JSON.
	_load_manifest()
	_build_world_entry()
	# Opening narrative beat: walk in, meet Sage. enter_lesson() below wires up
	# lesson_finished so the entry screen (built above) appears once it ends.
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
	# Real world entry: one Button per lesson "door", listed in EntryUI/LessonList.
	# Real art = Flux still (backdrop) + Wan2.2 motion (the lesson clips themselves).
	var list := get_node_or_null(LESSON_LIST)
	if list == null:
		push_warning("Missing %s node; cannot build lesson doors." % LESSON_LIST)
		return
	for entry in lessons:
		if not (entry is Dictionary):
			continue
		if entry.has("clips"):
			# Sequenced world cutscenes (the cold open, etc.) are narrative beats
			# that play automatically, not doors the student re-enters from a menu.
			continue
		var lesson_id: String = entry.get("id", "")
		if lesson_id == "":
			continue
		var door := Button.new()
		door.text = entry.get("title", "?")
		door.pressed.connect(_on_lesson_door_pressed.bind(lesson_id))
		list.add_child(door)

func _on_lesson_door_pressed(lesson_id: String) -> void:
	_hide_entry_ui()
	enter_lesson(lesson_id)

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
	if not current_scene.lesson_finished.is_connected(_on_lesson_finished):
		current_scene.lesson_finished.connect(_on_lesson_finished)
	# Defer setup so the lesson scene has entered the tree (VideoStreamPlayer.play()
	# requires the node to be inside the tree). add_child() during _ready() defers the
	# child's enter_tree to the next frame, so call setup on the next idle tick.
	current_scene.call_deferred("setup", data)

# Any lesson/cutscene (cold open included) reports back here when its clip
# sequence finishes, so the student sees the entry screen instead of a dead frame.
func _on_lesson_finished(_lesson_id: String) -> void:
	if current_scene != null:
		current_scene.queue_free()
		current_scene = null
	_show_entry_ui()

func _show_entry_ui() -> void:
	var ui := get_node_or_null(ENTRY_UI)
	if ui != null:
		ui.visible = true

func _hide_entry_ui() -> void:
	var ui := get_node_or_null(ENTRY_UI)
	if ui != null:
		ui.visible = false
