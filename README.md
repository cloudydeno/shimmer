## Safer monkeypatching for ~~Node.js~~ Deno

Typescript port of `shimmer` package from NPM.
Published on JSR for usage in modern runtimes e.g. Deno.

### API

All monkeypatched functions have an attribute, `__wrapped`, set to true on
them.

#### shimmer.init(options)

If you pass in an options object containing a function labeled `logger`,
`shimmer` will use it instead of the logger, which defaults to `console.error`.
`shimmer` is built to be as unobtrusive as possible and has no need to run
asynchronously, so it defaults to logging when things fail, instead of
throwing.

#### shimmer.wrap(nodule, name, wrapper)

`shimmer` monkeypatches in place, so it expects to be passed an object.
It accepts either instances, prototypes, or the results of calling
`require`. `name` must be the string key for the field's name on the
object.

`wrapper` is a function that takes a single parameter, which is the original
function to be monkeypatched. `shimmer` assumes that you're adding behavior
to the original method, and not replacing it outright. If you *are* replacing
the original function, feel free to ignore the passed-in function.

If you *aren't* discarding the original, remember these tips:

* call the original with something like `original.apply(this, arguments)`,
  unless your reason for monkeypatching is to transform the arguments.
* always capture and return the return value coming from the original function.
  Today's null-returning callback is tomorrow's error-code returning callback.
* Don't make an asynchronous function synchronous and vice versa.

#### shimmer.massWrap(nodules, names, wrapper)

Just like `wrap`, with the addition that you can wrap multiple methods on
multiple modules. Note that this function expects the list of functions to be
monkeypatched on all of the modules to be the same.

#### shimmer.unwrap(nodule, name)

A convenience function for restoring the function back the way it was before
you started. Won't unwrap if somebody else has monkeypatched the function after
you (but will log in that case). Won't throw if you try to double-unwrap a
function (but will log).

#### shimmer.massUnwrap(nodules, names)

Just like `unwrap`, with the addition that you can unwrap multiple methods on
multiple modules. Note that this function expects the list of functions to be
unwrapped on all of the modules to be the same.
