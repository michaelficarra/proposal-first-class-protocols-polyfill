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
    staticProvides: Object.getOwnPropertyDescriptors({
      c() {},
    }),
  });
  t.is(typeof P.a, 'symbol');
  t.is(typeof P.b, 'symbol');
  t.is(typeof P.c, 'symbol');
  t.not(P.a, P.b);
  t.not(P.b, P.c);
  t.not(P.a, P.c);
});

test('existing symbols can be used for provided fields', t => {
  const a = Symbol(), b = Symbol();

  const P = new Protocol({
    provides: Object.getOwnPropertyDescriptors({
      [a]() {},
    }),
    staticProvides: Object.getOwnPropertyDescriptors({
      [b]() {},
    }),
  });

  t.is(typeof P[a], 'symbol');
  t.is(typeof P[b], 'symbol');
  t.not(P[a], P[b]);
  t.is(P[a], a);
  t.is(P[b], b);
});

test('protocols cannot provide a field named "constructor"', t => {
  t.throws(() => {
    new Protocol({
      provides: Object.getOwnPropertyDescriptors({
        constructor: function(){},
      }),
    });
  });
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

test('protocols cannot provide a static field named "prototype"', t => {
  t.throws(() => {
    new Protocol({
      staticProvides: Object.getOwnPropertyDescriptors({
        prototype: {},
      }),
    });
  });
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
    requires: { a: null },
    staticRequires: { b: void 0 },
    provides: Object.getOwnPropertyDescriptors({
      c() {},
      get d() {},
      set e(x) {},
    }),
  });
  t.is(typeof P.a, 'symbol');
  t.is(typeof P.b, 'symbol');
  t.is(typeof P.c, 'symbol');
  t.is(typeof P.d, 'symbol');
  t.is(typeof P.e, 'symbol');
  t.is(P.a.description, 'a');
  t.is(P.b.description, 'b');
  t.is(P.c.description, 'c');
  t.is(P.d.description, 'get d');
  t.is(P.e.description, 'set e');

  const Q = new Protocol({
    name: 'Q',
    requires: { a: null },
    staticRequires: { b: void 0 },
    provides: Object.getOwnPropertyDescriptors({
      c() {},
      get d() {},
      set e(x) {},
    }),
  });
  t.is(typeof Q.a, 'symbol');
  t.is(typeof Q.b, 'symbol');
  t.is(typeof Q.c, 'symbol');
  t.is(typeof Q.d, 'symbol');
  t.is(typeof Q.e, 'symbol');
  t.is(Q.a.description, 'Q.a');
  t.is(Q.b.description, 'Q.b');
  t.is(Q.c.description, 'Q.c');
  t.is(Q.d.description, 'get Q.d');
  t.is(Q.e.description, 'set Q.e');
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

test('Protocol.implement throws on non-constructibles', t => {
  const P = new Protocol;

  Protocol.implement(class {}, P);

  t.throws(() => {
    Protocol.implement(() => {}, P);
  });
});

test('Protocol.implement returns the constructor', t => {
  const P = new Protocol;
  const Q = new Protocol;
  class C {}

  t.is(Protocol.implement(C), C);
  t.is(Protocol.implement(C, P), C);
  t.is(Protocol.implement(C, P, Q), C);
});

test('a class is given provided fields when it implements a protocol', t => {
  const c = Symbol(), d = Symbol();

  const P = new Protocol({
    requires: { a: Symbol() },
    staticRequires: { b: Symbol() },
    provides: Object.getOwnPropertyDescriptors({ c }),
    staticProvides: Object.getOwnPropertyDescriptors({ d }),
  });

  class C {
    [P.a](){}
    static [P.b](){}
  }

  t.is(C.prototype[P.c], void 0);
  t.is(C[P.d], void 0);

  Protocol.implement(C, P);

  t.is(C.prototype[P.c], c);
  t.is(C[P.d], d);
});

test('a class cannot implement protocol if it doesn\t have required fields', t => {
  const P = new Protocol({
    requires: { a: Symbol() },
    staticRequires: { b: Symbol() },
  });

  Protocol.implement(
    class c {
      [P.a](){}
      static [P.b](){}
    },
    P,
  )

  t.throws(() => {
    Protocol.implement(
      class c {},
      P,
    )
  });

  t.throws(() => {
    Protocol.implement(
      class c {
        [P.a](){}
      },
      P,
    )
  });

  t.throws(() => {
    Protocol.implement(
      class c {
        static [P.b](){}
      },
      P,
    )
  });
});
