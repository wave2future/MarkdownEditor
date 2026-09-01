const test = require('node:test');
const assert = require('node:assert/strict');

const LOCALES = require('../locales');

const sections = ['menu', 'dialog', 'ui'];
const placeholders = (value) => [...value.matchAll(/\{[^}]+\}/g)].map((match) => match[0]).sort();

test('every locale contains all English translation keys', () => {
  for (const [code, locale] of Object.entries(LOCALES)) {
    assert.equal(typeof locale.name, 'string', `${code}.name`);
    assert.ok(locale.name.length > 0, `${code}.name must not be empty`);

    for (const section of sections) {
      assert.deepEqual(
        Object.keys(locale[section]).sort(),
        Object.keys(LOCALES.en[section]).sort(),
        `${code}.${section} keys`
      );

      for (const [key, value] of Object.entries(locale[section])) {
        assert.equal(typeof value, 'string', `${code}.${section}.${key}`);
        assert.ok(value.length > 0, `${code}.${section}.${key} must not be empty`);
      }
    }
  }
});

test('translated strings preserve interpolation placeholders', () => {
  for (const [code, locale] of Object.entries(LOCALES)) {
    for (const section of sections) {
      for (const key of Object.keys(LOCALES.en[section])) {
        assert.deepEqual(
          placeholders(locale[section][key]),
          placeholders(LOCALES.en[section][key]),
          `${code}.${section}.${key} placeholders`
        );
      }
    }
  }
});
