# Sandbox

Test your snippets of JavaScript, HTML, and CSS! 

Easily, instantly, and all within your familiar VS Code environment.

![Sandbox in action](assets/demo.gif)

## Features

### Live Code Playground

Prototype, play, and experiment with your web development ideas. No setup required.

1. Create your sandbox with the command: 
   - `Sandbox: New Sandbox`

2. Start coding in the provided text editors. 
3. As you type, the results update in the live preview.

- Need to manually reload? VS Code has a command for us.
  -  `Developer: Reload Webviews`

- Want to debug something? VS Code has that built-in.
  - `Developer: Open Webview Developer Tools`  

## Known Issues

Using the VS Code provided _Webview Developer Tools_ has some quirks. The details are documented [here](https://code.visualstudio.com/api/extension-guides/webview#inspecting-and-debugging-webviews).
  - Elements: Your sandbox DOM is contained in the "active-frame" `iframe` element.
  - Console: To evaluate code in your sandbox, switch to the "active-frame" option using the top-left dropdown. It's set to "top" initially.
  - Sources: For convenience, the script with your JS code is mapped as `script.js` in the file tree and in the "Open file" selector.

## Release Notes

### 1.0.0

Initial release of Sandbox!
