# 🚀 Backend API Documentation

Welcome to the **Backend API** — a powerful system for managing accounts, relationships, guild interactions, and building executables.

---

## 📦 **Base Overview**

This API provides endpoints to:

* Manage user accounts 🧑‍💻
* Perform automated actions ⚙️
* Handle relationships 💬
* Interact with guilds 🏠
* Clean tokens 🧹
* Compile & download executables 🛠️

---

## 🔑 **Endpoints**

### 📂 **Accounts**

Manage and control user accounts.

```http
GET /accounts
```

➡️ **Description:** Fetch a list of all accounts

```http
POST /add_account
```

➡️ **Description:** Add a new account

```http
DELETE /remove/{id}
```

➡️ **Description:** Remove an account by ID

```http
POST /refresh/{id}
```

➡️ **Description:** Refresh account data

---

### ⚡ **Actions**

Execute actions on specific accounts.

```http
POST /action/{id}
```

➡️ **Description:** Perform custom actions on an account

---

### 💬 **Relationships**

Control interactions between users.

```http
POST /relationships/{id}/block/{target}
```

➡️ **Description:** Block a target user

```http
POST /relationships/{id}/dm/{target}
```

➡️ **Description:** Send a direct message to a target user

---

### 🏠 **Guilds**

Join or leave guilds (servers).

```http
POST /guilds/{id}/join
```

➡️ **Description:** Join a guild

```http
POST /guilds/{id}/leave/{guild_id}
```

➡️ **Description:** Leave a guild

---

### 🧹 **Token Cleaner**

Clean and secure account tokens.

```http
POST /cleaner/{id}
```

➡️ **Description:** Start token cleaning process

---

### 🛠️ **Builder**

Compile and download executables.

```http
POST /builder/compile
```

➡️ **Description:** Compile a C++ executable

```http
GET /builder/download
```

➡️ **Description:** Download the compiled executable

---



> Made with :heart: by beepdev!
