import http.server
import socketserver
import webbrowser
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

print("=" * 60)
print("  UP Police - BNSS 126/135 Chalani Report Server")
print(f"  Serving on: http://localhost:{PORT}")
print("=" * 60)

try:
    webbrowser.open(f"http://localhost:{PORT}")
except Exception:
    pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
