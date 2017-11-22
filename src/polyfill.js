let global = Function('return this')();
import implementation from './implementation';

export default function() {
  let p = global.Protocol;
  return typeof p === 'function' ? p : implementation;
}
