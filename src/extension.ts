import * as vscode from 'vscode';
import Ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "DeepPew" is now active!');

	const disposable = vscode.commands.registerCommand('DeepPew.start', () => {
		const panel = vscode.window.createWebviewPanel(
			'deepChat',
			'DeepPew Chat',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);
		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command === 'chat') {
				const userPrompt = message.text;
				let responseText = '';

				try {
					const streamResponse = await Ollama.chat({
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

				} catch (err) {
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err)}` });
				}
			}
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }

function parseResponse(response: string): { think: string; rest: string } {
	const match = response.match(/<think>(.*?)<\/think>/s);
	const think = match ? match[1].trim() : response;
	const rest = match ? response.replace(/<think>.*?<\/think>/s, '').trim() : '';
	return { think, rest };
}

function getWebviewContent(): string {
	return /*html*/`
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
