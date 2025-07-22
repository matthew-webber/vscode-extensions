import * as assert from 'assert';
import { findHexReplacements, hexToRgb, closestColorName } from '../color-utils';

suite('Color Utils Test Suite', () => {

	suite('hexToRgb', () => {
		test('should convert a 6-digit hex code to an RGB object', () => {
			assert.deepStrictEqual(hexToRgb('#ffffff'), { r: 255, g: 255, b: 255 });
			assert.deepStrictEqual(hexToRgb('#000000'), { r: 0, g: 0, b: 0 });
			assert.deepStrictEqual(hexToRgb('#ff0000'), { r: 255, g: 0, b: 0 });
			assert.deepStrictEqual(hexToRgb('#00A86B'), { r: 0, g: 168, b: 107 });
		});
	});

	suite('closestColorName', () => {
		test('should find the exact color name for a given hex', () => {
			assert.strictEqual(closestColorName('#FFFFFF')['lab'], 'white');
			assert.strictEqual(closestColorName('#000000')['lab'], 'black');
			assert.strictEqual(closestColorName('#FF0000')['lab'], 'red');
		});

		test('should find the closest color name for a given hex', () => {
			// A slightly off-red
			assert.strictEqual(closestColorName('#FE0000')['lab'], 'red');
		});
	});

	suite('findHexReplacements', () => {
		test('should return an empty array when no hex codes are present', () => {
			const text = 'this is a string with no colors.';
			assert.deepStrictEqual(findHexReplacements(text), []);
		});

		test('should find a single 6-digit hex code', () => {
			const text = 'color: #ffffff;';
			const replacements = findHexReplacements(text);
			assert.strictEqual(replacements.length, 1);
			assert.deepStrictEqual(replacements[0], {
				index: 7,
				originalText: '#ffffff',
				newText: 'white'
			});
		});

		test('should find a single 3-digit hex code', () => {
			const text = 'color: #fff;';
			const replacements = findHexReplacements(text);
			assert.strictEqual(replacements.length, 1);
			assert.deepStrictEqual(replacements[0], {
				index: 7,
				originalText: '#fff',
				newText: 'white'
			});
		});

		test('should find multiple hex codes of both 3 and 6 digits', () => {
			const text = 'body { color: #f00; background: #000000; }';
			const replacements = findHexReplacements(text);
			assert.strictEqual(replacements.length, 2);
			assert.deepStrictEqual(replacements[0], {
				index: 14,
				originalText: '#f00',
				newText: 'red'
			});
			assert.deepStrictEqual(replacements[1], {
				index: 32,
				originalText: '#000000',
				newText: 'black'
			});
		});

		test('should not match hex codes that are part of other words', () => {
			const text = 'this is a bad#ffffffidentifier';
			assert.deepStrictEqual(findHexReplacements(text), []);
		});

		test('should correctly handle hex codes at the start and end of the string', () => {
			const text = '#0000FF is blue and red is #f00';
			const replacements = findHexReplacements(text);
			assert.strictEqual(replacements.length, 2);
			assert.deepStrictEqual(replacements[0], {
				index: 0,
				originalText: '#0000FF',
				newText: 'blue'
			});
			assert.deepStrictEqual(replacements[1], {
				index: 27,
				originalText: '#f00',
				newText: 'red'
			});
		});
	});

	suite('Ensure lab calculation matches expectations for non-standard colors', () => {
		test('should return color names which match expected names for given hex values', () => {

			const hex = [
				'#336a33', // darkgreen
				'#012800', // darkgreen
				'#846586', // mediumorchid
				'#114591', // darkslateblue
				'#083d90', // darkslateblue
				'#2adc89', // mediumspringgreen
				'#846586', // mediumorchid,
				'#ff5733', // tomato
				'#f5fcff', // aliceblue
			];

			const results = hex.map(color => closestColorName(color));

			const expected = [
				'darkgreen',
				'darkgreen',
				'mediumorchid',
				'darkslateblue',
				'darkslateblue',
				'mediumspringgreen',
				'mediumorchid',
				'tomato',
				'aliceblue'
			];

			assert.deepStrictEqual(results.map(r => r.lab), expected);
		});
	});
});