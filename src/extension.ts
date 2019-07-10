// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { MemFS } from "./fileSystemProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "litterbox" is now active!');
  const memFs = new MemFS();
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider("sandbox", memFs, {
      isCaseSensitive: true
    })
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.openSandbox",
    async () => {
      // The code you place here will be executed every time your command is executed
      vscode.workspace.updateWorkspaceFolders(0, 0, {
        uri: vscode.Uri.parse("sandbox:/"),
        name: "Sandbox"
      });

      vscode.workspace.onDidChangeWorkspaceFolders(async event => {
        console.log(event);

        memFs.writeFile(
          vscode.Uri.parse(`sandbox:/file.txt`),
          Buffer.from("foo"),
          {
            create: true,
            overwrite: true
          }
        );

        let doc = await vscode.workspace.openTextDocument(
          vscode.Uri.parse(`sandbox:/file.txt`)
        ); // calls back into the provider
        await vscode.window.showTextDocument(doc, { preview: false });
      });
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
