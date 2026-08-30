import runpy, sys
sys.argv = ["build-world-1.py", "--stage", "1",
           "--out", "/tmp/worlds/emerald-hollow/stills"]
runpy.run_path("/tmp/build-world-1.py", run_name="__main__")
