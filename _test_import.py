import traceback
try:
    from backend.routes.game import router
    print("SUCCESS")
except Exception as e:
    traceback.print_exc()
