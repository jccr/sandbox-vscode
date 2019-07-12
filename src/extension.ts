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

  function isSandboxOpen() {
    return !!vscode.workspace.getWorkspaceFolder(vscode.Uri.parse("sandbox:/"));
  }

  async function openDocumentInColumn(
    fileName: string,
    overwrite: boolean,
    column: vscode.ViewColumn,
    focus: boolean = false
  ): Promise<[vscode.TextDocument, vscode.TextEditor]> {
    let uri = vscode.Uri.parse(`sandbox:/${fileName}`);

    try {
      memFs.writeFile(uri, new Uint8Array(0), {
        create: true,
        overwrite
      });
    } catch (error) {
      console.error(error);
    }

    let doc = await vscode.workspace.openTextDocument(uri);

    let editor = await vscode.window.showTextDocument(doc, {
      preview: false,
      viewColumn: column,
      preserveFocus: !focus
    });
    return [doc, editor];
  }

  async function prepareWorkspace(overwrite: boolean) {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    await vscode.commands.executeCommand("vscode.setEditorLayout", {
      groups: [{ groups: [{}, {}], size: 0.5 }, { groups: [{}, {}], size: 0.5 }]
    });

    const [docHTML, editorHTML] = await openDocumentInColumn(
      "index.html",
      overwrite,
      vscode.ViewColumn.One
    );
    const [docJS, editorJS] = await openDocumentInColumn(
      "script.js",
      overwrite,
      vscode.ViewColumn.Two,
      true
    );
    const [docCSS, editorCSS] = await openDocumentInColumn(
      "style.css",
      overwrite,
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
          if (e.document === docJS) {
            htmlView.js = docJS.getText();
          }
          if (e.document === docCSS) {
            htmlView.css = docCSS.getText();
          }
        }, 750)
      )
    );

    htmlView.html = docHTML.getText();
    htmlView.js = docJS.getText();
    htmlView.css = docCSS.getText();
  }

  if (isSandboxOpen()) {
    await prepareWorkspace(true);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("sandbox.newSandbox", async () => {
      if (isSandboxOpen()) {
        const option = await vscode.window.showWarningMessage(
          "You have an active sandbox. What would you like to do?",
          { modal: true },
          "New Sandbox",
          "Reopen Editors"
        );

        if (option === "New Sandbox") {
          await prepareWorkspace(true);
        } else if (option === "Reopen Editors") {
          await prepareWorkspace(false);
        }

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
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("sandbox.reopenEditors", async () => {
      if (!isSandboxOpen()) {
        vscode.window.showInformationMessage(
          "You need a sandbox to reopen the editors."
        );
        return;
      }

      await prepareWorkspace(false);
    })
  );
}

export function deactivate() {}
