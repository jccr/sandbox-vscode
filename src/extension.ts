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

  let currentOutputPanel: vscode.WebviewPanel;

  function getSandboxWorkspaceFolder() {
    return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse("sandbox:/"));
  }

  async function openDocumentInColumn(
    fileName: string,
    overwrite: boolean,
    column: vscode.ViewColumn,
    focus: boolean = false
  ): Promise<vscode.TextDocument> {
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

    await vscode.window.showTextDocument(doc, {
      preview: false,
      viewColumn: column,
      preserveFocus: !focus
    });

    return doc;
  }

  async function prepareWorkspace(overwrite: boolean) {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    await vscode.commands.executeCommand("vscode.setEditorLayout", {
      groups: [{ groups: [{}, {}], size: 0.5 }, { groups: [{}, {}], size: 0.5 }]
    });

    const docHTML = await openDocumentInColumn(
      "index.html",
      overwrite,
      vscode.ViewColumn.One
    );
    const docJS = await openDocumentInColumn(
      "script.js",
      overwrite,
      vscode.ViewColumn.Two,
      true
    );
    const docCSS = await openDocumentInColumn(
      "style.css",
      overwrite,
      vscode.ViewColumn.Three
    );

    currentOutputPanel = vscode.window.createWebviewPanel(
      "sandboxOutput",
      "Output",
      { viewColumn: vscode.ViewColumn.Four, preserveFocus: true },
      { enableScripts: true }
    );

    const htmlView = new HTMLView(currentOutputPanel.webview, context);

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

  if (getSandboxWorkspaceFolder()) {
    await prepareWorkspace(true);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("sandbox.newSandbox", async () => {
      if (getSandboxWorkspaceFolder()) {
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
      if (!getSandboxWorkspaceFolder()) {
        vscode.window.showInformationMessage(
          "There is currently no sandbox opened to reopen editors for."
        );
        return;
      }

      await prepareWorkspace(false);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("sandbox.closeSandbox", async () => {
      const workspaceFolder = getSandboxWorkspaceFolder();
      if (!workspaceFolder) {
        vscode.window.showInformationMessage(
          "There is currently no sandbox opened in this instance to close."
        );
        return;
      }

      vscode.workspace.updateWorkspaceFolders(workspaceFolder.index, 1);

      for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document.uri.scheme === "sandbox") {
          if (editor.hide) {
            // I know this is deprecated but there's really no alternative right now.
            // See: https://github.com/microsoft/vscode/issues/15178
            editor.hide();
          } else {
            throw new Error("Unable to close sandbox owned editors");
          }
        }
      }

      currentOutputPanel.dispose();
    })
  );
}

export function deactivate() {}
