// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const CURRENT_MAX_BUTTONS = 6;

// 定义按钮状态上下文
const BUTTON_CONTEXTS = [
	'simple-runner:showButton0',
	'simple-runner:showButton1',
	'simple-runner:showButton2',
	'simple-runner:showButton3',
	'simple-runner:showButton4',
	'simple-runner:showButton5',
];

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	/**
	 * @param {any[]} arr
	 * @param {number} newSize
	 * @param {any} defaultValue
	 */
	function resize(arr, newSize, defaultValue) {
		while (newSize > arr.length)
			arr.push(defaultValue);
		arr.length = newSize;
	}

	/**
	 * @param {string[]} cmds
	 * @param {number} index
	 */
	function register_custom_command(cmds, index) {
		return vscode.commands.registerCommand('simple-runner.executeCommand' + index, async () => {
			// 获取活动终端或创建新终端
			const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
			terminal.show();
			// 执行特定命令
			terminal.sendText(cmds[index]);
		});
	}

	let cmd_disposers = [];

	function load_configuration() {
		// 获取整个配置对象
		const config = vscode.workspace.getConfiguration('simple-runner');

		const cmds = config.get('commands').slice(0, CURRENT_MAX_BUTTONS);
		resize(cmds, CURRENT_MAX_BUTTONS, 'echo "No Command"');

		const activate_indices = config.get('activate_indices').slice(0, CURRENT_MAX_BUTTONS);
		resize(activate_indices, CURRENT_MAX_BUTTONS, false);

		if (cmd_disposers.length > 0) {
			cmd_disposers.forEach(disposer => {
				context.subscriptions.splice(context.subscriptions.indexOf(disposer), 1);
				disposer.dispose();
			});

			cmd_disposers.splice(0);
		}

		// 添加到订阅列表
		for (let i = 0; i < CURRENT_MAX_BUTTONS; i++) {
			cmd_disposers.push(register_custom_command(cmds, i));
			context.subscriptions.concat(cmd_disposers);
		}

		// 初始化所有按钮为设置的状态
		activate_indices.forEach((/** @type {Boolean} */ flag, /** @type {number} */ index) => {
			vscode.commands.executeCommand('setContext', BUTTON_CONTEXTS[index], flag);
		});
	}

	load_configuration();

	// 监听配置变化
	const configDisposable = vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('simple-runner.commands') || e.affectsConfiguration('simple-runner.activate_indices')) {
			load_configuration();
		}
	});

	context.subscriptions.push(configDisposable)
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
