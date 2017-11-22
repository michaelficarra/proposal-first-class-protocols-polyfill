import implementation from './implementation';
import getPolyfill from './polyfill';
import shim from './shim';

Object.defineProperties(implementation, {
  implementation: { value: implementation, enumerable: false, configurable: true, writable: false },
  getPolyfill: { value: getPolyfill, enumerable: false, configurable: true, writable: false },
  shim: { value: shim, enumerable: false, configurable: true, writable: false },
});

export default implementation;
