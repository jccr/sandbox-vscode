import * as vscode from "vscode";
import { MemFS } from "./fileSystemProvider";
import { debounce } from "./debounce";
import { HTMLView } from "./htmlView";

export async function activate(context: vscode.ExtensionContext) {
  const memFs = new MemFS();
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider("sandbox", memFs, {
      isCaseSensitive: true
    })
  );

  async function openDocumentInColumn(
    fileName: string,
    column: vscode.ViewColumn,
    focus: boolean = false
  ): Promise<[vscode.TextDocument, vscode.TextEditor]> {
    let uri = vscode.Uri.parse(`sandbox:/${fileName}`);

    memFs.writeFile(uri, new Uint8Array(0), {
      create: true,
      overwrite: true
    });

    let doc = await vscode.workspace.openTextDocument(uri);

    let editor = await vscode.window.showTextDocument(doc, {
      preview: false,
      viewColumn: column,
      preserveFocus: !focus
    });
    return [doc, editor];
  }

  async function prepareWorkspace() {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    await vscode.commands.executeCommand("vscode.setEditorLayout", {
      groups: [{ groups: [{}, {}], size: 0.5 }, { groups: [{}, {}], size: 0.5 }]
    });

    const [docHTML, editorHTML] = await openDocumentInColumn(
      "index.html",
      vscode.ViewColumn.One
    );
    const [docJS, editorJS] = await openDocumentInColumn(
      "script.js",
      vscode.ViewColumn.Two,
      true
    );
    const [docCSS, editorCSS] = await openDocumentInColumn(
      "style.css",
      vscode.ViewColumn.Three
    );

    const outputPanel = vscode.window.createWebviewPanel(
      "sandboxOutput",
      "Output",
      { viewColumn: vscode.ViewColumn.Four, preserveFocus: true },
      { enableScripts: true }
    );
    
    const htmlView = new HTMLView(outputPanel.webview, context);

    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(
        debounce(e => {
          if (e.document === docHTML) {
            htmlView.html = docHTML.getText();
          }
          if (e.document === docCSS) {
            htmlView.css = docCSS.getText();
          }
          if (e.document === docJS) {
            htmlView.js = docJS.getText();
          }
        }, 750)
      )
    );
  }

  if (vscode.workspace.getWorkspaceFolder(vscode.Uri.parse("sandbox:/"))) {
    await prepareWorkspace();
  }

  let disposable = vscode.commands.registerCommand(
    "litterbox.openSandbox",
    async () => {
      if (vscode.workspace.getWorkspaceFolder(vscode.Uri.parse("sandbox:/"))) {
        return;
      }

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
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
