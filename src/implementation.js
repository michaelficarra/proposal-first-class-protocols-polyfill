function _foldToObject(memo, [k, v]) {
  memo[k] = v;
  return memo;
}

function _objectMap(obj, fn) {
  return _entries(obj).map(fn).reduce(_foldToObject, {});
}

function _entries(obj) {
  return _allOwnProps(obj).map(p => [p, obj[p]]);
}

function _allOwnProps(obj) {
  return [
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj),
  ];
}

function _containsDuplicates(xs) {
  return new Set(xs).size !== Array.from(xs).length;
}

function noop() {}

export default class Protocol {
  constructor({
    name: protocolName,
    extends: _extends = [],
    requires = {},
    staticRequires = {},
    provides = {},
    staticProvides = {},
  } = {}) {
    if (_containsDuplicates([..._allOwnProps(requires), ..._allOwnProps(staticRequires), ..._allOwnProps(provides), ..._allOwnProps(staticProvides)])) {
      throw new Error('conflicting protocol entry names');
    }
    if (Object.getOwnPropertyNames(provides).includes('constructor')) {
      throw new Error('illegal prototype property named "constructor"');
    }
    if (Object.getOwnPropertyNames(staticProvides).includes('prototype')) {
      throw new Error('illegal static property named "prototype"');
    }
    this._name = protocolName == null ? protocolName : String(protocolName);
    this._extends = _extends;
    this._requires = _objectMap(requires, ([name, sym]) => [name, sym == null ? this._createSymbol(name, { value: sym }) : sym]);
    this._staticRequires = _objectMap(staticRequires, ([name, sym]) => [name, sym == null ? this._createSymbol(name, { value: sym }) : sym]);
    this._provides = provides;
    this._staticProvides = staticProvides;
    Object.assign(
      this,
      this._requires,
      this._staticRequires,
      _objectMap(provides, ([name, desc]) => [name, this._createSymbol(name, desc)]),
      _objectMap(staticProvides, ([name, desc]) => [name, this._createSymbol(name, desc)]),
    );
  }

  static implement(C, ...is) {
    try {
      Reflect.construct(noop, [], C);
    } catch (unused) {
      throw new TypeError('first parameter must have a [[Construct]] internal slot');
    }
    for (let i of is) {
      i._mixin(C);
    }
    return C;
  }

  _createSymbol(propName, propDescriptor) {
    if (typeof propName === 'symbol') return propName;
    let interfaceName = this._name == null ? '' : `${this._name}.`;
    let description = `${interfaceName}${propName}`;
    if (propDescriptor.get != null && propDescriptor.set == null) {
      description = `get ${description}`;
    } else if (propDescriptor.get == null && propDescriptor.set != null) {
      description = `set ${description}`;
    }
    return Symbol(description);
  }

  _isImplementedBy(klass) {
    return [
      ...Object.values(this._requires),
      ...Object.keys(this._provides).map(name => this[name]),
    ].every(sym => sym in klass.prototype) &&
    [
      ...Object.values(this._staticRequires),
      ...Object.keys(this._staticProvides).map(name => this[name]),
    ].every(sym => sym in klass);
  }

  _unimplemented(klass) {
    let protoSymbolsWhichWillBeInherited = this._collect(i => Object.getOwnPropertySymbols(i._provides));
    let staticRequiresWhichWillBeInherited = this._collect(i => Object.getOwnPropertySymbols(i._staticProvides));
    return this._collect(i => i._unimplementedHelper(klass, protoSymbolsWhichWillBeInherited, staticRequiresWhichWillBeInherited));
  }

  _unimplementedHelper(klass, protoSymbolsWhichWillBeInherited, staticRequiresWhichWillBeInherited) {
    let protoSymbolsWhichMustBeImplemented = Object.values(this._requires);
    let staticRequiresWhichMustBeImplemented = Object.values(this._staticRequires);
    let unimplemented = [];
    for (let symbol of protoSymbolsWhichMustBeImplemented) {
      if (!(symbol in klass.prototype) && !protoSymbolsWhichWillBeInherited.includes(symbol)) {
        unimplemented.push(symbol);
      }
    }
    for (let symbol of staticRequiresWhichMustBeImplemented) {
      if (!(symbol in klass) && !staticRequiresWhichWillBeInherited.includes(symbol)) {
        unimplemented.push(symbol);
      }
    }
    return unimplemented;
  }

  _collect(fn) {
    return [...fn(this), ...[].concat.apply([], this._extends.map(i => i._collect(fn)))];
  }

  _mixin(klass) {
    let unimplementedSymbols = this._unimplemented(klass);
    if (unimplementedSymbols.length > 0) {
      throw new Error(
        unimplementedSymbols.map(s => s.toString()).join(', ') + ' not implemented by ' + klass
      );
    }

    Object.defineProperties(
      klass.prototype,
      this._collect(i => {
        return _entries(i._provides)
          .filter(([name]) => !(name in klass.prototype))
          .map(([name, desc]) => [i[name], desc]);
      }).reduceRight(_foldToObject, {})
    );

    Object.defineProperties(
      klass,
      this._collect(i =>
        _entries(i._staticProvides)
          .filter(([name]) => !(name in klass))
          .map(([name, desc]) => [i[name], desc])
      ).reduceRight(_foldToObject, {})
    );

    return klass;
  }
}

Object.setPrototypeOf(Protocol.prototype, null);
