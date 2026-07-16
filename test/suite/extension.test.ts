import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import * as vscode from 'vscode';

suite('Selectra extension', () => {
  test('activates and registers its commands', async () => {
    const extension = vscode.extensions.getExtension('local.selectra');
    assert.ok(extension, 'The Selectra extension should be installed in the test host.');
    await extension.activate();

    const commands = await vscode.commands.getCommands(true);
    for (const command of [
      'selectra.find',
      'selectra.refresh',
      'selectra.clear',
      'selectra.openSettings',
      'selectra.openMatch',
    ]) {
      assert.ok(commands.includes(command), `${command} should be registered.`);
    }
  });

  test('contributes language-agnostic default glob settings', () => {
    const config = vscode.workspace.getConfiguration('selectra');
    assert.deepEqual(config.get('include'), [
      '**/*.{html,htm,jsx,tsx,vue,svelte,astro,php,erb,ejs,hbs,twig}',
    ]);
    assert.equal(config.get('maxResults'), 5000);
  });

  test('opens a result at its exact source location', async () => {
    const uri = vscode.Uri.file(
      path.resolve(__dirname, '..', '..', 'test', 'fixtures', 'workspace', 'sample.html'),
    );

    await vscode.commands.executeCommand('selectra.openMatch', {
      uri,
      workspaceName: 'workspace',
      relativePath: 'sample.html',
      startOffset: 42,
      endOffset: 72,
      start: { line: 1, character: 2 },
      end: { line: 1, character: 32 },
      openingTag: '<div class="details">',
      preview: '<div class="details">Ada</div>',
    });

    assert.equal(vscode.window.activeTextEditor?.document.uri.toString(), uri.toString());
    assert.deepEqual(vscode.window.activeTextEditor?.selection.active, new vscode.Position(1, 2));
  });
});
