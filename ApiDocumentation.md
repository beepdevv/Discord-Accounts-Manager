Backend API Endpoints
GET /accounts - List all accounts
POST /add_account - Add new account
DELETE /remove/{id} - Remove account
POST /refresh/{id} - Refresh account data
POST /action/{id} - Perform account actions
POST /relationships/{id}/block/{target} - Block user
POST /relationships/{id}/dm/{target} - Send DM
POST /guilds/{id}/join - Join guild
POST /guilds/{id}/leave/{guild_id} - Leave guild
POST /cleaner/{id} - Start token cleaner
POST /builder/compile - Compile C++ executable
GET /builder/download - Download compiled executable
