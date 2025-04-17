type Funktion = ((...args: unknown[]) => unknown) & {
  __unwrap?: () => void;
  __wrapped?: true;
  __original?: Funktion;
} & Record<string,unknown>;
type Nodule = Record<string,Funktion>;
type WrapperFunktion = (original: Funktion, name: string) => Funktion;

function isFunction (funktion: unknown) {
  return typeof funktion === 'function'
}

// Default to complaining loudly when things don't go according to plan.
let logger = console.error.bind(console)

// Sets a property on an object, preserving its enumerability.
// This function assumes that the property is already writable.
function defineProperty (obj: Record<string,unknown>, name: string, value: unknown) {
  const enumerable = !!obj[name] && Object.propertyIsEnumerable.call(obj, name)
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: enumerable,
    writable: true,
    value: value
  })
}

// Keep initialization idempotent.
export function init (options?: {
  logger?: () => void;
}): void {
  if (options && options.logger) {
    if (!isFunction(options.logger)) logger("new logger isn't a function, not replacing")
    else logger = options.logger
  }
}

export function wrap (nodule: Nodule, name: string, wrapper: WrapperFunktion): Funktion | undefined {
  if (!nodule || !nodule[name]) {
    logger('no original function ' + name + ' to wrap')
    return
  }

  if (!wrapper) {
    logger('no wrapper function')
    logger((new Error()).stack)
    return
  }

  if (!isFunction(nodule[name]) || !isFunction(wrapper)) {
    logger('original object and wrapper must be functions')
    return
  }

  const original = nodule[name] as Funktion;
  const wrapped = wrapper(original, name)

  defineProperty(wrapped, '__original', original)
  defineProperty(wrapped, '__unwrap', function () {
    if (nodule[name] === wrapped) defineProperty(nodule, name, original)
  })
  defineProperty(wrapped, '__wrapped', true)

  defineProperty(nodule, name, wrapped)
  return wrapped
}

export function massWrap (nodules: Nodule | Nodule[], names: string[], wrapper: WrapperFunktion): void {
  if (!nodules) {
    logger('must provide one or more modules to patch')
    logger((new Error()).stack)
    return
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules]
  }

  if (!(names && Array.isArray(names))) {
    logger('must provide one or more functions to wrap on modules')
    return
  }

  nodules.forEach(function (nodule: Nodule) {
    names.forEach(function (name) {
      wrap(nodule, name, wrapper)
    })
  })
}

export function unwrap (nodule: Nodule, name: string): void {
  if (!nodule || !nodule[name]) {
    logger('no function to unwrap.')
    logger((new Error()).stack)
    return
  }

  if (!nodule[name].__unwrap) {
    logger('no original to unwrap to -- has ' + name + ' already been unwrapped?')
  } else {
    return nodule[name].__unwrap()
  }
}

export function massUnwrap (nodules: Nodule | Nodule[], names: string[]): void {
  if (!nodules) {
    logger('must provide one or more modules to patch')
    logger((new Error()).stack)
    return
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules]
  }

  if (!(names && Array.isArray(names))) {
    logger('must provide one or more functions to unwrap on modules')
    return
  }

  nodules.forEach(function (nodule) {
    names.forEach(function (name) {
      unwrap(nodule, name)
    })
  })
}
