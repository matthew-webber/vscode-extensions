# Hex2Name

Hex2Name is a Visual Studio Code extension that converts hex color values in your code to their equivalent (or closest) HTML color names regardless of file type. For hex values that do not have a direct CSS name, it finds the closest color name using the [ΔE color difference](https://en.wikipedia.org/wiki/Color_difference#CIELAB_%CE%94E*) formula.

**_Example:_**

```css
/* Before */
.foo {
  background-color: #000; /* black */
  color: #fff; /* white */
  border: 1px solid #ff5733; /* tomato-ish */
  text-shadow: 1px 1px 2px #f5fcff; /* aliceblue-ish */
}

/* After */
.foo {
  background-color: black;
  color: white;
  border: 1px solid tomato;
  text-shadow: 1px 1px 2px aliceblue;
}
```

## Why?

Sometimes, the **exact** colors don't really matter (e.g. vibe coding, quick prototypes). This extension helps you quickly convert hex values to more readable color names, making your code cleaner and easier to understand at a glance.

## Features

- Converts 3-digit (`#fff`) and 6-digit (`#ffffff`) hex codes to their closest CSS color names.
- Works on selected text or the entire document.
- Displays the number of replacements in the status bar.

## Usage

1. Highlight a section of text or leave nothing selected to process the entire document.
2. Run the command **Hex2Name: Convert Selection or All** from the Command Palette (`Cmd+Shift+P`).
3. The hex codes will be replaced with their corresponding color names.
