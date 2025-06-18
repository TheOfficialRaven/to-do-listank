#!/usr/bin/env python3
"""
Egyszerű HTTP szerver a Todo App teszteléséhez
Használat: python server.py
Ezután nyisd meg: http://localhost:8000/test.html
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class CORSHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def start_server():
    print(f"🚀 HTTP szerver indítása a porton: {PORT}")
    print(f"📁 Könyvtár: {os.getcwd()}")
    
    try:
        with socketserver.TCPServer(("", PORT), CORSHandler) as httpd:
            print(f"✅ Szerver sikeresen elindult!")
            print(f"🌐 Teszt oldal: http://localhost:{PORT}/test.html")
            print(f"📱 Todo App: http://localhost:{PORT}/index.html")
            print(f"⚠️  A szerver leállításához nyomd meg a Ctrl+C billentyűt")
            print("-" * 50)
            
            # Automatikus böngésző megnyitás
            try:
                webbrowser.open(f'http://localhost:{PORT}/test.html')
                print("🔗 Böngésző automatikusan megnyitva")
            except:
                print("❌ Böngésző automatikus megnyitása sikertelen")
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Szerver leállítva")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ A {PORT} port már használatban van!")
            print("💡 Próbálkozz egy másik porttal vagy állítsd le a másik szervert")
        else:
            print(f"❌ Szerver hiba: {e}")

if __name__ == "__main__":
    print("🧪 Todo App Test Server")
    print("=" * 30)
    start_server() 