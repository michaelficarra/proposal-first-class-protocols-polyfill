const test = require('ava');

const Protocol = require('../dist/implementation').default;

test('Protocol constructor exists', t => {
  t.is(typeof Protocol, 'function');
});

test('Protocol constructor creates objects', t => {
  const P = new Protocol;
  t.is(typeof P, 'object');
});

test('symbols are generated for each provided field', t => {
  const P = new Protocol({
    provides: Object.getOwnPropertyDescriptors({
      a() {},
      b: 1,
    }),
  });
  t.is(typeof P.a, 'symbol');
  t.is(typeof P.b, 'symbol');
  t.not(P.a, P.b);
});

test('symbols are generated for each static provided field', t => {
  const P = new Protocol({
    staticProvides: Object.getOwnPropertyDescriptors({
      a() {},
      b: 1,
    }),
  });
  t.is(typeof P.a, 'symbol');
  t.is(typeof P.b, 'symbol');
  t.not(P.a, P.b);
});

test('provided fields, static provided fields, required fields, and static required fields must all be unique', t => {
  const P = new Protocol({
    requires: { a: Symbol() },
    staticRequires: { b: Symbol() },
    provides: Object.getOwnPropertyDescriptors({ c() {}, }),
    staticProvides: Object.getOwnPropertyDescriptors({ d() {}, }),
  });
  t.is(typeof P.a, 'symbol');
  t.is(typeof P.b, 'symbol');
  t.is(typeof P.c, 'symbol');
  t.is(typeof P.d, 'symbol');

  t.throws(() => {
    new Protocol({
      requires: { a: Symbol() },
      staticRequires: { a: Symbol() },
    });
  });

  t.throws(() => {
    new Protocol({
      requires: { a: Symbol() },
      provides: Object.getOwnPropertyDescriptors({ a() {} }),
    });
  });

  t.throws(() => {
    new Protocol({
      requires: { a: Symbol() },
      staticProvides: Object.getOwnPropertyDescriptors({ a() {} }),
    });
  });

  t.throws(() => {
    new Protocol({
      staticRequires: { a: Symbol() },
      provides: Object.getOwnPropertyDescriptors({ a() {} }),
    });
  });

  t.throws(() => {
    new Protocol({
      staticRequires: { a: Symbol() },
      staticProvides: Object.getOwnPropertyDescriptors({ a() {} }),
    });
  });

  t.throws(() => {
    new Protocol({
      provides: Object.getOwnPropertyDescriptors({ a() {} }),
      staticProvides: Object.getOwnPropertyDescriptors({ a() {} }),
    });
  });

});

test('protocol name propagates to generated Symbol descriptions', t => {
  const P = new Protocol({
    provides: Object.getOwnPropertyDescriptors({
      a() {},
    }),
  });
  t.is(typeof P.a, 'symbol');
  t.is(P.a.description, 'a');

  const Q = new Protocol({
    name: 'Q',
    provides: Object.getOwnPropertyDescriptors({
      a() {},
    }),
  });
  t.is(typeof Q.a, 'symbol');
  t.is(Q.a.description, 'Q.a');
});

test('protocol name is toString-ed only once', t => {
  let count = 0;
  const P = new Protocol({
    name: { toString() { ++count; } },
    provides: Object.getOwnPropertyDescriptors({
      a() {},
      b() {},
      c() {},
    }),
  });
  t.is(count, 1);
});

test('static implement method exists', t => {
  t.is(typeof Protocol.implement, 'function');
});
