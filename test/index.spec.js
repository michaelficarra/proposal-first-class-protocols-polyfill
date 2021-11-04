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
  new Protocol({
    staticProvides: Object.getOwnPropertyDescriptors({
      constructor: function(){},
    }),
  });

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
  new Protocol({
    provides: Object.getOwnPropertyDescriptors({
      prototype: {},
    }),
  });

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
  class D {}
  class E {}

  t.is(Protocol.implement(C), C);
  t.is(Protocol.implement(D, P), D);
  t.is(Protocol.implement(E, P, Q), E);
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

test('provided fields have the appropriate property descriptors', t => {
  const aDesc = { value: Symbol(), configurable: false, writable: false, enumerable: false },
    bDesc = { value: Symbol(), configurable: false, writable: false, enumerable: true },
    cDesc = { value: Symbol(), configurable: false, writable: true, enumerable: false },
    dDesc = { value: Symbol(), configurable: true, writable: false, enumerable: false },
    eDesc = { get: function(){}, set: void 0, configurable: false, enumerable: false },
    fDesc = { get: void 0, set: function(x){}, configurable: false, enumerable: false };

  const P = new Protocol({
    provides: {
      a: aDesc,
      b: bDesc,
      c: cDesc,
      d: dDesc,
      e: eDesc,
      f: fDesc,
    }
  });
  class C {}
  Protocol.implement(C, P);

  t.deepEqual(Object.getOwnPropertyDescriptor(C.prototype, P.a), aDesc);
  t.deepEqual(Object.getOwnPropertyDescriptor(C.prototype, P.b), bDesc);
  t.deepEqual(Object.getOwnPropertyDescriptor(C.prototype, P.c), cDesc);
  t.deepEqual(Object.getOwnPropertyDescriptor(C.prototype, P.d), dDesc);
  t.deepEqual(Object.getOwnPropertyDescriptor(C.prototype, P.e), eDesc);
  t.deepEqual(Object.getOwnPropertyDescriptor(C.prototype, P.f), fDesc);
});

test('a class cannot implement a protocol if it doesn\t have required fields', t => {
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

test('a protocol can require string-named fields', t => {
  const P = new Protocol({
    requires: { a: 'c' },
    staticRequires: { b: 'd' },
  });

  t.is(P.a, 'c');
  t.is(P.b, 'd');

  Protocol.implement(
    class c {
      [P.a](){}
      static [P.b](){}
    },
    P,
  )

  Protocol.implement(
    class extends (class c {
      [P.a](){}
      static [P.b](){}
    }) {},
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

test('a class can implement multiple protocols', t => {
  const pa = Symbol(), qa = Symbol();
  const P = new Protocol({
    provides: Object.getOwnPropertyDescriptors({
      a: pa,
    }),
  });
  const Q = new Protocol({
    provides: Object.getOwnPropertyDescriptors({
      a: qa,
    }),
  });

  class C {}

  Protocol.implement(C, P, Q);

  t.is(C.prototype[P.a], pa);
  t.is(C.prototype[Q.a], qa);
});

test('a class can implement multiple protocols that provide conflicting fields', t => {
  const a = Symbol(), b = Symbol(), c = Symbol();
  const P = new Protocol({
    provides: Object.getOwnPropertyDescriptors({
      [a]: b,
    }),
  });
  const Q = new Protocol({
    provides: Object.getOwnPropertyDescriptors({
      [a]: c,
    }),
  });

  class C {}
  class D {}

  Protocol.implement(C, P, Q);
  Protocol.implement(D, Q, P);

  t.is(P[a], a);
  t.is(P[a], Q[a]);

  t.is(C.prototype[a], b);
  t.is(D.prototype[a], c);
});

test('protocols can extend other protocols and inherit their required/provided fields', t => {
  const c = Symbol(), d = Symbol(), g = Symbol(), h = Symbol();
  const P = new Protocol({
    requires: { a: null },
    staticRequires: { b: null },
    provides: Object.getOwnPropertyDescriptors({ c }),
    staticProvides: Object.getOwnPropertyDescriptors({ d }),
  });
  const Q = new Protocol({
    extends: [P],
    requires: { e: null },
    staticRequires: { f: null },
    provides: Object.getOwnPropertyDescriptors({ g }),
    staticProvides: Object.getOwnPropertyDescriptors({ h }),
  });

  class C {
    [P.a](){}
    static [P.b](){}
    [Q.e](){}
    static [Q.f](){}
  }
  Protocol.implement(C, Q);

  t.is(C.prototype[P.c], c);
  t.is(C[P.d], d);
  t.is(C.prototype[Q.g], g);
  t.is(C[Q.h], h);

  t.throws(() => {
    Protocol.implement(class {
      static [P.b](){}
      [Q.e](){}
      static [Q.f](){}
    }, Q);
  });

  t.throws(() => {
    Protocol.implement(class {
      [P.a](){}
      [Q.e](){}
      static [Q.f](){}
    }, Q);
  });

  t.throws(() => {
    Protocol.implement(class {
      [P.a](){}
      static [P.b](){}
      static [Q.f](){}
    }, Q);
  });

  t.throws(() => {
    Protocol.implement(class {
      [P.a](){}
      static [P.b](){}
      [Q.e](){}
    }, Q);
  });
});

test('protocols inheritance supports "minimal implementation" patterns', t => {
  const Functor = new Protocol({
    name: "Functor",
    requires: { map: null },
  });
  const Applicative = new Protocol({
    name: "Applicative",
    extends: [Functor],
    requires: { pure: null, apply: null },
  });
  const Monad = new Protocol({
    name: "Monad",
    extends: [Applicative],
    requires: { bind: null, join: null },
    provides: Object.getOwnPropertyDescriptors({
      kleisli() {},
    }),
  });

  const MonadViaBind = new Protocol({
    extends: [Monad],
    provides: Object.getOwnPropertyDescriptors({
      [Monad.join]() { /* implemented in terms of Monad.bind */ },
    }),
  });
  const MonadViaJoin = new Protocol({
    extends: [Monad],
    provides: Object.getOwnPropertyDescriptors({
      [Monad.bind]() { /* implemented in terms of Monad.join */ },
    }),
  });

  class C {
    [Functor.map]() {}
    [Applicative.pure]() {}
    [Applicative.apply]() {}
    [Monad.bind]() {}
  }

  t.throws(() => {
    Protocol.implement(C, Monad);
  });

  t.throws(() => {
    Protocol.implement(C, MonadViaJoin);
  });

  Protocol.implement(C, MonadViaBind);
  t.is(typeof C.prototype[Monad.join], 'function');
  t.is(typeof C.prototype[Monad.kleisli], 'function');

  class D {
    [Functor.map]() {}
    [Applicative.pure]() {}
    [Applicative.apply]() {}
    [Monad.join]() {}
  }

  t.throws(() => {
    Protocol.implement(D, Monad);
  });

  t.throws(() => {
    Protocol.implement(D, MonadViaBind);
  });

  Protocol.implement(D, MonadViaJoin);
  t.is(typeof C.prototype[Monad.bind], 'function');
  t.is(typeof C.prototype[Monad.kleisli], 'function');
});

test('protocol-provided fields do not replace existing class fields', t => {
  const P = new Protocol({
    provides: Object.getOwnPropertyDescriptors({
      a() { return 0; },
    }),
    staticProvides: Object.getOwnPropertyDescriptors({
      b() { return 0; },
    }),
  });

  class C {
    [P.a]() { return 1; }
    static [P.b]() { return 1; }
  }

  t.is(new C()[P.a](), 1);
  t.is(C[P.b](), 1);
  Protocol.implement(C, P);
  t.is(new C()[P.a](), 1);
  t.is(C[P.b](), 1);
});

test('diamond pattern dependencies where one side introduces a needed field', t => {
  const A = new Protocol({
    requires: { a: null },
    provides: Object.getOwnPropertyDescriptors({
      success() { return 'success'; },
    }),
  });
  const B0 = new Protocol({
    extends: [A],
    requires: { b0: null },
  });
  const B1 = new Protocol({
    extends: [A],
    requires: { b1: null },
    provides: Object.getOwnPropertyDescriptors({
      [A.a]() {},
    }),
  });
  const C = new Protocol({
    extends: [B0, B1],
    requires: { c: null },
  });

  class X {
    [B0.b0]() {}
    [B1.b1]() {}
    [C.c]() {}
  }
  Protocol.implement(X, C);

  t.is(typeof X.prototype[A.success], 'function');
  t.is(typeof X.prototype[A.a], 'function');
});
