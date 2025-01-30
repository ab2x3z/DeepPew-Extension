"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ollama_1 = __importDefault(require("ollama"));
function activate(context) {
    console.log('Congratulations, your extension "DeepPew" is now active!');
    const disposable = vscode.commands.registerCommand('DeepPew.start', () => {
        const panel = vscode.window.createWebviewPanel('deepChat', 'DeepPew Chat', vscode.ViewColumn.One, { enableScripts: true });
        panel.webview.html = getWebviewContent();
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                let responseText = '';
                try {
                    const streamResponse = await ollama_1.default.chat({
                        model: 'deepseek-r1:8b',
                        messages: [{ role: 'user', content: userPrompt }],
                        stream: true
                    });
                    const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    for await (const part of streamResponse) {
                        responseText += part.message.content;
                        const parsedResponse = parseResponse(responseText);
                        // Send response updates to the webview
                        panel.webview.postMessage({
                            command: 'chatResponse',
                            responseId: id,
                            think: parsedResponse.think,
                            rest: parsedResponse.rest
                        });
                    }
                    // After the full response, signal 'finished'
                    panel.webview.postMessage({ command: 'finished' });
                }
                catch (err) {
                    panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err)}` });
                }
            }
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
function parseResponse(response) {
    const match = response.match(/<think>(.*?)<\/think>/s);
    const think = match ? match[1].trim() : response;
    const rest = match ? response.replace(/<think>.*?<\/think>/s, '').trim() : '';
    return { think, rest };
}
function getWebviewContent() {
    return /*html*/ `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .panel {
                    border: 1px solid #ccc;
                    border-radius: 0.5rem;
                    padding: 2rem;
                    margin-bottom: 1rem;
                    background-color: #2e2e2e;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .chat-container {
                    max-height: 400px;
                    overflow-y: scroll;
                    margin-bottom: 1rem;
                }
                .user-message {
                    background-color: #5c6bc0;
                    color: white;
                    align-self: flex-end;
                }
				.message {
					background-color: black;
					padding: 1rem;
					border-radius: 0.5rem;
					min-height: 5rem;
				}
				.thought {
					background-color:rgb(41, 48, 77);
					padding: 1rem;
					border-radius: 0.5rem;
					min-height: 5rem;
				}
				.response {
					background-color: #595858;
					padding: 1rem;
					border-radius: 0.5rem;
					min-height: 5rem;
				}
                .prompt {
                    width: 98%;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                    border: 1px solid #ccc;
                    border-radius: 0.5rem;
                    font-family: Arial, sans-serif; 
                    color: #c9c9c9;
                    background-color: #757575;
                    resize: none;
                }
            </style>
        </head>
        <body>
            <div class="panel">
                <h3>DeepPew</h3>
                <div class="chat-container" id="chatContainer"></div>
                <textarea id="prompt" class="prompt" placeholder="Enter your prompt..."></textarea>
            </div>
        
            <script>
                const vscode = acquireVsCodeApi();

                // Listen for the Enter key in the textarea
                document.getElementById('prompt').addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        const text = document.getElementById('prompt').value;
                        disableInput(true);
                        vscode.postMessage({ command: 'chat', text });
                        event.preventDefault();
                    }
                });

                window.addEventListener('message', (event) => {
                    const message = event.data;
					
					if (message.command === 'chatResponse') {
                        const chatContainer = document.getElementById('chatContainer');
                        const response = document.getElementById(message.responseId);

						if (response) {
							response.innerHTML = '<div class="thought">' + (message.think || 'N/A') + '</div> <div class="response">' + (message.rest || 'N/A') + '</div>';

							chatContainer.appendChild(response);
						} else {
							const newResponse = document.createElement('div');
                        	newResponse.classList.add('message');
							newResponse.id = message.responseId;

							newResponse.innerHTML = '<div class="thought">' + (message.think || 'N/A') + '</div> <div class="response">' + (message.rest || 'N/A') + '</div>';

							chatContainer.appendChild(newResponse);
						}
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    } 
                    else if (message.command === 'finished') {
                        const textarea = document.getElementById('prompt');
                        textarea.value = "";
                        disableInput(false);
                    }
                });

                function disableInput(disable) {
                    const textarea = document.getElementById('prompt');
                    textarea.disabled = disable;
                }
            </script>
        </body>
        </html>`;
}
//# sourceMappingURL=extension.js.map