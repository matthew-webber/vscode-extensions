# Hex2Name

Hex2Name is a Visual Studio Code extension that converts hex color codes in your code to their equivalent (or closest) HTML color names (e.g. `#ff0000` to `red` or `#000` to `black`). For hex values that do not have a direct CSS name, it finds the closest color name using the [ΔE color difference](https://en.wikipedia.org/wiki/Color_difference#CIELAB_%CE%94E*) formula (e.g. `#ff5733` to `tomato` or `#f5fcff` to `aliceblue`).

## Features

- Converts 3-digit (`#fff`) and 6-digit (`#ffffff`) hex codes to their closest CSS color names.
- Works on selected text or the entire document.
- Displays the number of replacements in the status bar.

## Usage

1. Highlight a section of text or leave nothing selected to process the entire document.
2. Run the command **Hex2Name: Convert Selection or All** from the Command Palette (`Cmd+Shift+P`).
3. The hex codes will be replaced with their corresponding color names.