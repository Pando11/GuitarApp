extends Control
# FingeringOverlay.gd — draws demonstrated fingering.
# AMENDMENT-10 (owner override): AI-drawn fingering is NOW PERMITTED. This overlay may
# render AI-produced fingering art OR data-driven dots. chord-theory-check.js still runs
# as a verification pass (quality gate), not a hard ban.
func render(fingering: Array) -> void:
	for item in fingering:
		print("Fingering dot: string %s fret %s finger %s" % [
			item.get("string"), item.get("fret"), item.get("finger")])
	queue_redraw()
