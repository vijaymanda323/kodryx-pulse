// Polyfill DOMException at the absolute entry point before any other imports
if (typeof global.DOMException === 'undefined') {
  global.DOMException = class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name ?? 'DOMException';
      this.code = 0;
    }
  };
}
if (typeof globalThis.DOMException === 'undefined') {
  globalThis.DOMException = global.DOMException;
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
