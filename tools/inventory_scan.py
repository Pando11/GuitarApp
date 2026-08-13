import json, os, datetime

base = r"C:\Users\The Yoda Trader\Desktop\GuitarApp\07-app\content"
lesson_dir = os.path.join(base, "lessons")
practice_dir = os.path.join(base, "practice")

# ---- LESSONS ----
manifest = json.load(open(os.path.join(lesson_dir, "manifest.json")))
lessons = []
for f in manifest["files"]:
    d = json.load(open(os.path.join(lesson_dir, f)))
    title = d.get("title") or d.get("lesson", {}).get("title") or d.get("name") or "(no title)"
    ex = d.get("exercises", [])
    cobj = d.get("chords", {}) if isinstance(d.get("chords"), dict) else {}
    new_chords = [k for k, v in cobj.items()
                  if not k.startswith("_") and isinstance(v, dict) and v.get("new")]
    qa = set()
    for e in ex:
        if isinstance(e, dict) and e.get("qa_status"):
            qa.add(e["qa_status"])
    for k, v in cobj.items():
        if isinstance(v, dict) and v.get("qa_status"):
            qa.add(v["qa_status"])
    lessons.append({"file": f, "title": title, "num": len(lessons) + 1,
                    "exercises": len(ex), "new_chords": new_chords,
                    "qa": sorted(qa)})

# ---- PRACTICE ----
index = json.load(open(os.path.join(practice_dir, "index.json")))
pairs = index["pairs"]
for p in pairs:
    d = json.load(open(os.path.join(practice_dir, p["file"])))
    p["_engine"] = (d.get("lesson", {}) or {}).get("engine") or d.get("engine")
    p["_minutes"] = (d.get("lesson", {}) or {}).get("estimated_minutes")
    p["_practice_of"] = (d.get("lesson", {}) or {}).get("practice_of")

engines = sorted(set(p["_engine"] for p in pairs if p["_engine"]))

# ---- SONGS / PACKS ----
songs_dir = os.path.join(base, "songs")
l23 = json.load(open(os.path.join(lesson_dir, "guitar-lesson-23-first-three-chord-song.json")))
l23_title = l23.get("title") or (l23.get("lesson", {}) or {}).get("title")
l23_chords = [k for k, v in (l23.get("chords", {}) or {}).items() if not k.startswith("_")]

out = {"generated": datetime.datetime.utcnow().isoformat() + "Z",
       "lesson_dir": lesson_dir, "lessons": lessons,
       "practice_dir": practice_dir, "pairs": pairs, "engines": engines,
       "songs_dir_exists": os.path.isdir(songs_dir),
       "l23_title": l23_title, "l23_chords": l23_chords}
json.dump(out, open(r"C:\Users\The Yoda Trader\Desktop\GuitarApp\tools\inventory_data.json", "w"), indent=2)

print("LESSONS:", len(lessons), "| PRACTICE PAIRS:", len(pairs), "| ENGINES:", engines)
print("SONGS DIR EXISTS:", out["songs_dir_exists"])
print("L23:", l23_title, "| chords:", l23_chords)
