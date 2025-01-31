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
    const think = match ? match[1].trim() : '<p class="thinking">Thinking...</p><br><br>' + response;
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
				    display: flex;
				    flex-direction: column;
				    align-items: flex-start; /* Aligns messages to the left by default */
				    min-height: 25rem;
				    overflow-y: scroll;
				    scrollbar-width: none;
				    margin-bottom: 1rem;
				    background-color: #1e1e1e;
				    border-radius: 0.5rem;
				    padding: 1rem;
				}
				
				.user-prompt {
				    background-color: rgb(107, 107, 107);
				    min-width: 15%;
				    max-width: 70%;
				    padding: 0.5rem;
				    margin: 1rem;
				    border-radius: 0.5rem;
				    min-height: 2rem;
				    margin-left: auto; /* Moves it to the right */
				}

				.message {
					background-color: #424242;
					min-width: 15%;
					max-width: 70%;
					padding: 0rem;
					margin: 1rem;
					border-radius: 0.5rem;
					min-height: 2rem;
				}
				.thinking {
					color: #007acc;
					font-weight: bold;
				}
				.thought {
					background-color:rgb(41, 48, 77);
					padding: 1rem;
					min-height: 2rem;
					border-top-left-radius: 0.5rem;
					border-top-right-radius: 0.5rem;
					border-bottom-left-radius: 0;
					border-bottom-right-radius: 0;
				}
				.response {
					background-color: #424242;
					padding: 1rem;
					min-height: 2rem;
					border-top-left-radius: 0;
					border-top-right-radius: 0;
					border-bottom-left-radius: 0.5rem;
					border-bottom-right-radius: 0.5rem;
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

				.thought h1, .response h1 { font-size: 2em; font-weight: bold; color: #7d76f2; }
				.thought h2, .response h2 { font-size: 1.5em; font-weight: bold; color: #62bbf1; }
				.thought h3, .response h3 { font-size: 1.2em; font-weight: bold; color: #00d4ff; }
				.thought p, .response p { margin: 0.5rem 0; }
				.thought code, .response code { background-color: #333; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
				.thought pre, .response pre { background-color: #222; padding: 1rem; border-radius: 8px; overflow-x: auto; }

            </style>
        </head>
        <body>
            <div class="panel">
                <h3>DeepPew</h3>
                <div class="chat-container" id="chatContainer"></div>
                <textarea id="prompt" class="prompt" placeholder="Enter your prompt..."></textarea>
            </div>

			<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
			<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
            <script>
                const vscode = acquireVsCodeApi();

                // Listen for the Enter key in the textarea
                document.getElementById('prompt').addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        const text = document.getElementById('prompt').value;

						const userPrompt = document.createElement('div');
                        userPrompt.classList.add('user-prompt');
						userPrompt.innerHTML = DOMPurify.sanitize(marked.parse(text || ''));
                        document.getElementById('prompt').value = "";

						chatContainer.appendChild(userPrompt);

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

						// Ensure Markdown is converted correctly
            			let thinkHTML = DOMPurify.sanitize(marked.parse(message.think || ''));
            			let restHTML = DOMPurify.sanitize(marked.parse(message.rest || ''));


						if (response) {
							if (thinkHTML){
								response.innerHTML = '<div class="thought">' + thinkHTML + '</div> <div class="response">' + (restHTML || '') + '</div>';
							} else {
								response.innerHTML = '<div class="response" style="border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem;">' + (restHTML || '') + '</div>';
							}
							chatContainer.appendChild(response);
						} else {
							const newResponse = document.createElement('div');
                        	newResponse.classList.add('message');
							newResponse.id = message.responseId;

							if (thinkHTML){
								newResponse.innerHTML = '<div class="thought">' + thinkHTML + '</div> <div class="response">' + (restHTML || '') + '</div>';
							} else {
								newResponse.innerHTML = '<div class="response" style="border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem;">' + (restHTML || '') + '</div>';
							}

							chatContainer.appendChild(newResponse);
						}
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    } 
                    else if (message.command === 'finished') {
                        const textarea = document.getElementById('prompt');
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