import getPolyfill from './polyfill';

let global = Function('return this')();

export default function shim() {
  let p = getPolyfill();
  if (global.Protocol !== p) {
    Object.defineProperty(global, 'Protocol', { value: p, enumerable: false, configurable: true, writable: false });
  }
}
