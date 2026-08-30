extends Node2D
# elderwick-market.gd — first concrete world instance (BOARDROOM advance 2026-08-23).
# Ties the generic World scene (res://world/World.gd) to a real attribution world_id.
# Art assets are PENDING generation by the clean stack (flux.1-schnell -> wan2.2-i2v ->
# chatterbox); this stub documents the hook point and keeps the build non-breaking.
#
# Attribution wiring: when the world is entered and a lesson chosen, the JS app shell
# calls 07-app/core/world-view-tracker.js -> trackWorldView("elderwick-market") to record
# an anonymous content-view event for install/subscription attribution (PocketBase, $0).
# The Godot<->JS bridge is owned by the app shell; this constant is the contract.

const WORLD_ID = "elderwick-market"
const SOURCE_URL = "https://youtu.be/FYmRkScwJ8M"
const CONFIG_PATH = "res://worlds/elderwick-market/world.config.json"

func get_world_id() -> String:
	return WORLD_ID

func _ready() -> void:
	print("Elderwick Market world scaffold loaded (WORLD_ID=%s). Art pending clean-stack generation." % WORLD_ID)
