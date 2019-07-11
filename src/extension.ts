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
      vscode.workspace.updateWorkspaceFolders(
        vscode.workspace.workspaceFolders
          ? vscode.workspace.workspaceFolders.length
          : 0,
        null,
        {
          uri: vscode.Uri.parse("sandbox:/"),
          name: "Sandbox"
        }
      );
      const htmlUri = vscode.Uri.parse(`sandbox:/index.html`);
      const cssUri = vscode.Uri.parse(`sandbox:/style.css`);
      const jsUri = vscode.Uri.parse(`sandbox:/script.js`);
      memFs.writeFile(htmlUri, new Uint8Array(0), {
        create: true,
        overwrite: true
      });
      memFs.writeFile(cssUri, new Uint8Array(0), {
        create: true,
        overwrite: true
      });
      memFs.writeFile(jsUri, new Uint8Array(0), {
        create: true,
        overwrite: true
      });
      // // The code you place here will be executed every time your command is executed
      // vscode.workspace.updateWorkspaceFolders(0, 0, {
      //   uri: vscode.Uri.parse("sandbox:/"),
      //   name: "Sandbox"
      // });

      const htmlTextDocument = await vscode.workspace.openTextDocument(htmlUri);
      const cssTextDocument = await vscode.workspace.openTextDocument(cssUri);
      const jsTextDocument = await vscode.workspace.openTextDocument(jsUri);
      await vscode.commands.executeCommand("vscode.setEditorLayout", {
        groups: [
          { groups: [{}, {}], size: 0.5 },
          { groups: [{}, {}], size: 0.5 }
        ]
      });
      await vscode.window.showTextDocument(htmlTextDocument, {
        preview: false,
        viewColumn: vscode.ViewColumn.One
      });
      await vscode.window.showTextDocument(cssTextDocument, {
        preview: false,
        viewColumn: vscode.ViewColumn.Two
      });
      await vscode.window.showTextDocument(jsTextDocument, {
        preview: false,
        viewColumn: vscode.ViewColumn.Three
      });

      const panel = vscode.window.createWebviewPanel(
        "sandboxResult",
        "Result",
        vscode.ViewColumn.Four,
        {}
      );
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
