/**
 * Copyright (c) 2018 Jed Watson.
 * Licensed under the MIT License (MIT), see:
 *
 * @link http://jedwatson.github.io/classnames
 */

type ClassNamesArg = undefined | null | string | number | boolean | Record<string, boolean> | ClassNamesArg[];

/**
 * A simple JavaScript utility for conditionally joining classNames together.
 *
 * @param args A series of classes or object with key that are class and values
 * that are interpreted as boolean to decide whether or not the class
 * should be included in the final class.
 */
export function classNames(...args: ClassNamesArg[]): string {
  let classes = '';

  for (const arg of args) {
    classes = appendClass(classes, parseValue(arg));
  }

  return classes;
}

function parseValue(arg: ClassNamesArg): string {
  if (typeof arg === 'string') {
    return arg;
  }

  if (typeof arg === 'number') {
    return String(arg);
  }

  if (typeof arg !== 'object' || arg === null) {
    return '';
  }

  if (Array.isArray(arg)) {
    return classNames(...arg);
  }

  let classes = '';

  for (const key in arg) {
    /*
     * Fix: Add hasOwnProperty check to ensure we only process own properties
     * and avoid iterating over inherited properties.
     */
    if (Object.prototype.hasOwnProperty.call(arg, key) && arg[key]) {
      classes = appendClass(classes, key);
    }
  }

  return classes;
}

/*
 * Fix: Change the type of newClass to 'string'.
 * The parseValue function always returns a string (empty or otherwise),
 * so newClass will never actually be `undefined` here.
 */
function appendClass(value: string, newClass: string) {
  if (!newClass) {
    // This correctly handles newClass being an empty string
    return value;
  }

  if (value) {
    return value + ' ' + newClass;
  }

  return value + newClass;
}
