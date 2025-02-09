import { a as kTrue, b as string$1, c as array$1, d as stringableFunc, e as func, f as symbol$1, g as CHANNEL_END_TYPE, h as expanding, i as check, j as buffer, k as none, l as once, m as MULTICAST, n as notUndef, o as MATCH, p as remove, q as SAGA_ACTION, r as internalErr, s as CANCEL, t as TAKE, u as PUT, v as ALL, w as RACE, x as CALL, y as CPS, z as FORK, A as JOIN, B as CANCEL$1, C as SELECT, D as ACTION_CHANNEL, E as CANCELLED$1, F as FLUSH, G as GET_CONTEXT, H as SET_CONTEXT, I as promise, J as iterator, K as getMetaInfo, L as noop, M as createAllStyleChildCallbacks, N as SELF_CANCELLATION, O as createEmptyArray, P as assignWithSymbols, Q as makeIterator, R as TERMINATE, S as undef, T as shouldComplete, U as flatMap, V as getLocation, W as TASK, X as TASK_CANCEL, Y as object, Z as createSetContextWarning, _ as asyncIteratorSymbol, $ as shouldCancel, a0 as shouldTerminate, a1 as IO, a2 as logError, a3 as wrapSagaDispatch, a4 as identity, a5 as channel$1, a6 as _extends } from './chunk-9e86d186.js';
export { af as buffers, s as CANCEL, ag as SAGA_LOCATION, ah as detach } from './chunk-9e86d186.js';

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

const queue = [];
/**
  Variable to hold a counting semaphore
  - Incrementing adds a lock and puts the scheduler in a `suspended` state (if it's not
    already suspended)
  - Decrementing releases a lock. Zero locks puts the scheduler in a `released` state. This
    triggers flushing the queued tasks.
**/

let semaphore = 0;
/**
  Executes a task 'atomically'. Tasks scheduled during this execution will be queued
  and flushed after this task has finished (assuming the scheduler endup in a released
  state).
**/

function exec(task) {
  try {
    suspend();
    task();
  } finally {
    release();
  }
}
/**
  Executes or queues a task depending on the state of the scheduler (`suspended` or `released`)
**/


function asap(task) {
  queue.push(task);

  if (!semaphore) {
    suspend();
    flush();
  }
}
/**
 * Puts the scheduler in a `suspended` state and executes a task immediately.
 */

function immediately(task) {
  try {
    suspend();
    return task();
  } finally {
    flush();
  }
}
/**
  Puts the scheduler in a `suspended` state. Scheduled tasks will be queued until the
  scheduler is released.
**/

function suspend() {
  semaphore++;
}
/**
  Puts the scheduler in a `released` state.
**/


function release() {
  semaphore--;
}
/**
  Releases the current lock. Executes all queued tasks if the scheduler is in the released state.
**/


function flush() {
  release();
  let task;

  while (!semaphore && (task = queue.shift()) !== undefined) {
    exec(task);
  }
}

const array = patterns => input => patterns.some(p => matcher(p)(input));
const predicate = predicate => input => predicate(input);
const string = pattern => input => input.type === String(pattern);
const symbol = pattern => input => input.type === pattern;
const wildcard = () => kTrue;
function matcher(pattern) {
  // prettier-ignore
  const matcherCreator = pattern === '*' ? wildcard : string$1(pattern) ? string : array$1(pattern) ? array : stringableFunc(pattern) ? string : func(pattern) ? predicate : symbol$1(pattern) ? symbol : null;

  if (matcherCreator === null) {
    throw new Error(`invalid pattern: ${pattern}`);
  }

  return matcherCreator(pattern);
}

const END = {
  type: CHANNEL_END_TYPE
};
const isEnd = a => a && a.type === CHANNEL_END_TYPE;
const CLOSED_CHANNEL_WITH_TAKERS = 'Cannot have a closed channel with pending takers';
const INVALID_BUFFER = 'invalid buffer passed to channel factory function';
const UNDEFINED_INPUT_ERROR = `Saga or channel was provided with an undefined action
Hints:
  - check that your Action Creator returns a non-undefined value
  - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners`;
function channel(buffer$1) {
  if (buffer$1 === void 0) {
    buffer$1 = expanding();
  }

  let closed = false;
  let takers = [];

  {
    check(buffer$1, buffer, INVALID_BUFFER);
  }

  function checkForbiddenStates() {
    if (closed && takers.length) {
      throw internalErr(CLOSED_CHANNEL_WITH_TAKERS);
    }

    if (takers.length && !buffer$1.isEmpty()) {
      throw internalErr('Cannot have pending takers with non empty buffer');
    }
  }

  function put(input) {
    {
      checkForbiddenStates();
      check(input, notUndef, UNDEFINED_INPUT_ERROR);
    }

    if (closed) {
      return;
    }

    if (takers.length === 0) {
      return buffer$1.put(input);
    }

    const cb = takers.shift();
    cb(input);
  }

  function take(cb) {
    {
      checkForbiddenStates();
      check(cb, func, "channel.take's callback must be a function");
    }

    if (closed && buffer$1.isEmpty()) {
      cb(END);
    } else if (!buffer$1.isEmpty()) {
      cb(buffer$1.take());
    } else {
      takers.push(cb);

      cb.cancel = () => {
        remove(takers, cb);
      };
    }
  }

  function flush(cb) {
    {
      checkForbiddenStates();
      check(cb, func, "channel.flush' callback must be a function");
    }

    if (closed && buffer$1.isEmpty()) {
      cb(END);
      return;
    }

    cb(buffer$1.flush());
  }

  function close() {
    {
      checkForbiddenStates();
    }

    if (closed) {
      return;
    }

    closed = true;
    const arr = takers;
    takers = [];

    for (let i = 0, len = arr.length; i < len; i++) {
      const taker = arr[i];
      taker(END);
    }
  }

  return {
    take,
    put,
    flush,
    close
  };
}
function eventChannel(subscribe, buffer) {
  if (buffer === void 0) {
    buffer = none();
  }

  let closed = false;
  let unsubscribe;
  const chan = channel(buffer);

  const close = () => {
    if (closed) {
      return;
    }

    closed = true;

    if (func(unsubscribe)) {
      unsubscribe();
    }

    chan.close();
  };

  unsubscribe = subscribe(input => {
    if (isEnd(input)) {
      close();
      return;
    }

    chan.put(input);
  });

  {
    check(unsubscribe, func, 'in eventChannel: subscribe should return a function to unsubscribe');
  }

  unsubscribe = once(unsubscribe);

  if (closed) {
    unsubscribe();
  }

  return {
    take: chan.take,
    flush: chan.flush,
    close
  };
}
function multicastChannel() {
  let closed = false;
  let currentTakers = [];
  let nextTakers = currentTakers;

  function checkForbiddenStates() {
    if (closed && nextTakers.length) {
      throw internalErr(CLOSED_CHANNEL_WITH_TAKERS);
    }
  }

  const ensureCanMutateNextTakers = () => {
    if (nextTakers !== currentTakers) {
      return;
    }

    nextTakers = currentTakers.slice();
  };

  const close = () => {
    {
      checkForbiddenStates();
    }

    closed = true;
    const takers = currentTakers = nextTakers;
    nextTakers = [];
    takers.forEach(taker => {
      taker(END);
    });
  };

  return {
    [MULTICAST]: true,

    put(input) {
      {
        checkForbiddenStates();
        check(input, notUndef, UNDEFINED_INPUT_ERROR);
      }

      if (closed) {
        return;
      }

      if (isEnd(input)) {
        close();
        return;
      }

      const takers = currentTakers = nextTakers;

      for (let i = 0, len = takers.length; i < len; i++) {
        const taker = takers[i];

        if (taker[MATCH](input)) {
          taker.cancel();
          taker(input);
        }
      }
    },

    take(cb, matcher) {
      if (matcher === void 0) {
        matcher = wildcard;
      }

      {
        checkForbiddenStates();
      }

      if (closed) {
        cb(END);
        return;
      }

      cb[MATCH] = matcher;
      ensureCanMutateNextTakers();
      nextTakers.push(cb);
      cb.cancel = once(() => {
        ensureCanMutateNextTakers();
        remove(nextTakers, cb);
      });
    },

    close
  };
}
function stdChannel() {
  const chan = multicastChannel();
  const put = chan.put;

  chan.put = input => {
    if (input[SAGA_ACTION]) {
      put(input);
      return;
    }

    asap(() => {
      put(input);
    });
  };

  return chan;
}

function symbolObservablePonyfill(root) {
  var result;
  var Symbol = root.Symbol;

  if (typeof Symbol === 'function') {
    if (Symbol.observable) {
      result = Symbol.observable;
    } else {
      result = Symbol('observable');
      Symbol.observable = result;
    }
  } else {
    result = '@@observable';
  }

  return result;
}

/* global window */
var root;

if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (typeof module !== 'undefined') {
  root = module;
} else {
  root = Function('return this')();
}

var result = symbolObservablePonyfill(root);

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */

var randomString = function randomString() {
  return Math.random().toString(36).substring(7).split('').join('.');
};

var ActionTypes = {
  INIT: "@@redux/INIT" + randomString(),
  REPLACE: "@@redux/REPLACE" + randomString(),
  PROBE_UNKNOWN_ACTION: function PROBE_UNKNOWN_ACTION() {
    return "@@redux/PROBE_UNKNOWN_ACTION" + randomString();
  }
};
/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */


function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }
  /* eslint-enable no-console */


  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
  } catch (e) {} // eslint-disable-line no-empty

}
/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */


function compose() {
  for (var _len = arguments.length, funcs = new Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce(function (a, b) {
    return function () {
      return a(b.apply(void 0, arguments));
    };
  });
}
/*
 * This is a dummy function to check if the function name has been altered by minification.
 * If the function has been minified and NODE_ENV !== 'production', warn the user.
 */


function isCrushed() {}

if (typeof isCrushed.name === 'string' && isCrushed.name !== 'isCrushed') {
  warning('You are currently using minified code outside of NODE_ENV === "production". ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or setting mode to production in webpack (https://webpack.js.org/concepts/mode/) ' + 'to ensure you have the correct code for your production build.');
}

const RUNNING = 0;
const CANCELLED = 1;
const ABORTED = 2;
const DONE = 3;

function resolvePromise(promise, cb) {
  const cancelPromise = promise[CANCEL];

  if (func(cancelPromise)) {
    cb.cancel = cancelPromise;
  }

  promise.then(cb, error => {
    cb(error, true);
  });
}

let current = 0;
var nextEffectId = (() => ++current);

function getIteratorMetaInfo(iterator, fn) {
  if (iterator.isSagaIterator) {
    return {
      name: iterator.meta.name
    };
  }

  return getMetaInfo(fn);
}

function createTaskIterator(_ref) {
  let context = _ref.context,
      fn = _ref.fn,
      args = _ref.args;

  // catch synchronous failures; see #152 and #441
  try {
    const result = fn.apply(context, args); // i.e. a generator function returns an iterator

    if (iterator(result)) {
      return result;
    }

    let resolved = false;

    const next = arg => {
      if (!resolved) {
        resolved = true; // Only promises returned from fork will be interpreted. See #1573

        return {
          value: result,
          done: !promise(result)
        };
      } else {
        return {
          value: arg,
          done: true
        };
      }
    };

    return makeIterator(next);
  } catch (err) {
    // do not bubble up synchronous failures for detached forks
    // instead create a failed task. See #152 and #441
    return makeIterator(() => {
      throw err;
    });
  }
}

function runPutEffect(env, _ref2, cb) {
  let channel = _ref2.channel,
      action = _ref2.action,
      resolve = _ref2.resolve;

  /**
   Schedule the put in case another saga is holding a lock.
   The put will be executed atomically. ie nested puts will execute after
   this put has terminated.
   **/
  asap(() => {
    let result;

    try {
      result = (channel ? channel.put : env.dispatch)(action);
    } catch (error) {
      cb(error, true);
      return;
    }

    if (resolve && promise(result)) {
      resolvePromise(result, cb);
    } else {
      cb(result);
    }
  }); // Put effects are non cancellables
}

function runTakeEffect(env, _ref3, cb) {
  let _ref3$channel = _ref3.channel,
      channel = _ref3$channel === void 0 ? env.channel : _ref3$channel,
      pattern = _ref3.pattern,
      maybe = _ref3.maybe;

  const takeCb = input => {
    if (input instanceof Error) {
      cb(input, true);
      return;
    }

    if (isEnd(input) && !maybe) {
      cb(TERMINATE);
      return;
    }

    cb(input);
  };

  try {
    channel.take(takeCb, notUndef(pattern) ? matcher(pattern) : null);
  } catch (err) {
    cb(err, true);
    return;
  }

  cb.cancel = takeCb.cancel;
}

function runCallEffect(env, _ref4, cb, _ref5) {
  let context = _ref4.context,
      fn = _ref4.fn,
      args = _ref4.args;
  let task = _ref5.task;

  // catch synchronous failures; see #152
  try {
    const result = fn.apply(context, args);

    if (promise(result)) {
      resolvePromise(result, cb);
      return;
    }

    if (iterator(result)) {
      // resolve iterator
      proc(env, result, task.context, current, getMetaInfo(fn),
      /* isRoot */
      false, cb);
      return;
    }

    cb(result);
  } catch (error) {
    cb(error, true);
  }
}

function runCPSEffect(env, _ref6, cb) {
  let context = _ref6.context,
      fn = _ref6.fn,
      args = _ref6.args;

  // CPS (ie node style functions) can define their own cancellation logic
  // by setting cancel field on the cb
  // catch synchronous failures; see #152
  try {
    const cpsCb = (err, res) => {
      if (undef(err)) {
        cb(res);
      } else {
        cb(err, true);
      }
    };

    fn.apply(context, args.concat(cpsCb));

    if (cpsCb.cancel) {
      cb.cancel = cpsCb.cancel;
    }
  } catch (error) {
    cb(error, true);
  }
}

function runForkEffect(env, _ref7, cb, _ref8) {
  let context = _ref7.context,
      fn = _ref7.fn,
      args = _ref7.args,
      detached = _ref7.detached;
  let parent = _ref8.task;
  const taskIterator = createTaskIterator({
    context,
    fn,
    args
  });
  const meta = getIteratorMetaInfo(taskIterator, fn);
  immediately(() => {
    const child = proc(env, taskIterator, parent.context, current, meta, detached, noop);

    if (detached) {
      cb(child);
    } else {
      if (child.isRunning()) {
        parent.queue.addTask(child);
        cb(child);
      } else if (child.isAborted()) {
        parent.queue.abort(child.error());
      } else {
        cb(child);
      }
    }
  }); // Fork effects are non cancellables
}

function runJoinEffect(env, taskOrTasks, cb, _ref9) {
  let task = _ref9.task;

  const joinSingleTask = (taskToJoin, cb) => {
    if (taskToJoin.isRunning()) {
      const joiner = {
        task,
        cb
      };

      cb.cancel = () => {
        if (taskToJoin.isRunning()) remove(taskToJoin.joiners, joiner);
      };

      taskToJoin.joiners.push(joiner);
    } else {
      if (taskToJoin.isAborted()) {
        cb(taskToJoin.error(), true);
      } else {
        cb(taskToJoin.result());
      }
    }
  };

  if (array$1(taskOrTasks)) {
    if (taskOrTasks.length === 0) {
      cb([]);
      return;
    }

    const childCallbacks = createAllStyleChildCallbacks(taskOrTasks, cb);
    taskOrTasks.forEach((t, i) => {
      joinSingleTask(t, childCallbacks[i]);
    });
  } else {
    joinSingleTask(taskOrTasks, cb);
  }
}

function cancelSingleTask(taskToCancel) {
  if (taskToCancel.isRunning()) {
    taskToCancel.cancel();
  }
}

function runCancelEffect(env, taskOrTasks, cb, _ref10) {
  let task = _ref10.task;

  if (taskOrTasks === SELF_CANCELLATION) {
    cancelSingleTask(task);
  } else if (array$1(taskOrTasks)) {
    taskOrTasks.forEach(cancelSingleTask);
  } else {
    cancelSingleTask(taskOrTasks);
  }

  cb(); // cancel effects are non cancellables
}

function runAllEffect(env, effects, cb, _ref11) {
  let digestEffect = _ref11.digestEffect;
  const effectId = current;
  const keys = Object.keys(effects);

  if (keys.length === 0) {
    cb(array$1(effects) ? [] : {});
    return;
  }

  const childCallbacks = createAllStyleChildCallbacks(effects, cb);
  keys.forEach(key => {
    digestEffect(effects[key], effectId, childCallbacks[key], key);
  });
}

function runRaceEffect(env, effects, cb, _ref12) {
  let digestEffect = _ref12.digestEffect;
  const effectId = current;
  const keys = Object.keys(effects);
  const response = array$1(effects) ? createEmptyArray(keys.length) : {};
  const childCbs = {};
  let completed = false;
  keys.forEach(key => {
    const chCbAtKey = (res, isErr) => {
      if (completed) {
        return;
      }

      if (isErr || shouldComplete(res)) {
        // Race Auto cancellation
        cb.cancel();
        cb(res, isErr);
      } else {
        cb.cancel();
        completed = true;
        response[key] = res;
        cb(response);
      }
    };

    chCbAtKey.cancel = noop;
    childCbs[key] = chCbAtKey;
  });

  cb.cancel = () => {
    // prevents unnecessary cancellation
    if (!completed) {
      completed = true;
      keys.forEach(key => childCbs[key].cancel());
    }
  };

  keys.forEach(key => {
    if (completed) {
      return;
    }

    digestEffect(effects[key], effectId, childCbs[key], key);
  });
}

function runSelectEffect(env, _ref13, cb) {
  let selector = _ref13.selector,
      args = _ref13.args;

  try {
    const state = selector(env.getState(), ...args);
    cb(state);
  } catch (error) {
    cb(error, true);
  }
}

function runChannelEffect(env, _ref14, cb) {
  let pattern = _ref14.pattern,
      buffer = _ref14.buffer;
  const chan = channel(buffer);
  const match = matcher(pattern);

  const taker = action => {
    if (!isEnd(action)) {
      env.channel.take(taker, match);
    }

    chan.put(action);
  };

  const close = chan.close;

  chan.close = () => {
    taker.cancel();
    close();
  };

  env.channel.take(taker, match);
  cb(chan);
}

function runCancelledEffect(env, data, cb, _ref15) {
  let task = _ref15.task;
  cb(task.isCancelled());
}

function runFlushEffect(env, channel, cb) {
  channel.flush(cb);
}

function runGetContextEffect(env, prop, cb, _ref16) {
  let task = _ref16.task;
  cb(task.context[prop]);
}

function runSetContextEffect(env, props, cb, _ref17) {
  let task = _ref17.task;
  assignWithSymbols(task.context, props);
  cb();
}

const effectRunnerMap = {
  [TAKE]: runTakeEffect,
  [PUT]: runPutEffect,
  [ALL]: runAllEffect,
  [RACE]: runRaceEffect,
  [CALL]: runCallEffect,
  [CPS]: runCPSEffect,
  [FORK]: runForkEffect,
  [JOIN]: runJoinEffect,
  [CANCEL$1]: runCancelEffect,
  [SELECT]: runSelectEffect,
  [ACTION_CHANNEL]: runChannelEffect,
  [CANCELLED$1]: runCancelledEffect,
  [FLUSH]: runFlushEffect,
  [GET_CONTEXT]: runGetContextEffect,
  [SET_CONTEXT]: runSetContextEffect
};

function deferred() {
  const def = {};
  def.promise = new Promise((resolve, reject) => {
    def.resolve = resolve;
    def.reject = reject;
  });
  return def;
}

/**
 Used to track a parent task and its forks
 In the fork model, forked tasks are attached by default to their parent
 We model this using the concept of Parent task && main Task
 main task is the main flow of the current Generator, the parent tasks is the
 aggregation of the main tasks + all its forked tasks.
 Thus the whole model represents an execution tree with multiple branches (vs the
 linear execution tree in sequential (non parallel) programming)

 A parent tasks has the following semantics
 - It completes if all its forks either complete or all cancelled
 - If it's cancelled, all forks are cancelled as well
 - It aborts if any uncaught error bubbles up from forks
 - If it completes, the return value is the one returned by the main task
 **/

function forkQueue(mainTask, onAbort, cont) {
  let tasks = [];
  let result;
  let completed = false;
  addTask(mainTask);

  const getTasks = () => tasks;

  function abort(err) {
    onAbort();
    cancelAll();
    cont(err, true);
  }

  function addTask(task) {
    tasks.push(task);

    task.cont = (res, isErr) => {
      if (completed) {
        return;
      }

      remove(tasks, task);
      task.cont = noop;

      if (isErr) {
        abort(res);
      } else {
        if (task === mainTask) {
          result = res;
        }

        if (!tasks.length) {
          completed = true;
          cont(result);
        }
      }
    };
  }

  function cancelAll() {
    if (completed) {
      return;
    }

    completed = true;
    tasks.forEach(t => {
      t.cont = noop;
      t.cancel();
    });
    tasks = [];
  }

  return {
    addTask,
    cancelAll,
    abort,
    getTasks
  };
}

// there can be only a single saga error created at any given moment

function formatLocation(fileName, lineNumber) {
  return `${fileName}?${lineNumber}`;
}

function effectLocationAsString(effect) {
  const location = getLocation(effect);

  if (location) {
    const code = location.code,
          fileName = location.fileName,
          lineNumber = location.lineNumber;
    const source = `${code}  ${formatLocation(fileName, lineNumber)}`;
    return source;
  }

  return '';
}

function sagaLocationAsString(sagaMeta) {
  const name = sagaMeta.name,
        location = sagaMeta.location;

  if (location) {
    return `${name}  ${formatLocation(location.fileName, location.lineNumber)}`;
  }

  return name;
}

function cancelledTasksAsString(sagaStack) {
  const cancelledTasks = flatMap(i => i.cancelledTasks, sagaStack);

  if (!cancelledTasks.length) {
    return '';
  }

  return ['Tasks cancelled due to error:', ...cancelledTasks].join('\n');
}

let crashedEffect = null;
const sagaStack = [];
const addSagaFrame = frame => {
  frame.crashedEffect = crashedEffect;
  sagaStack.push(frame);
};
const clear = () => {
  crashedEffect = null;
  sagaStack.length = 0;
}; // this sets crashed effect for the soon-to-be-reported saga frame
// this slightly streatches the singleton nature of this module into wrong direction
// as it's even less obvious what's the data flow here, but it is what it is for now

const setCrashedEffect = effect => {
  crashedEffect = effect;
};
/**
  @returns {string}

  @example
  The above error occurred in task errorInPutSaga {pathToFile}
  when executing effect put({type: 'REDUCER_ACTION_ERROR_IN_PUT'}) {pathToFile}
      created by fetchSaga {pathToFile}
      created by rootSaga {pathToFile}
*/

const toString = () => {
  const firstSaga = sagaStack[0],
        otherSagas = sagaStack.slice(1);
  const crashedEffectLocation = firstSaga.crashedEffect ? effectLocationAsString(firstSaga.crashedEffect) : null;
  const errorMessage = `The above error occurred in task ${sagaLocationAsString(firstSaga.meta)}${crashedEffectLocation ? ` \n when executing effect ${crashedEffectLocation}` : ''}`;
  return [errorMessage, ...otherSagas.map(s => `    created by ${sagaLocationAsString(s.meta)}`), cancelledTasksAsString(sagaStack)].join('\n');
};

function newTask(env, mainTask, parentContext, parentEffectId, meta, isRoot, cont) {
  let status = RUNNING;
  let taskResult;
  let taskError;
  let deferredEnd = null;
  const cancelledDueToErrorTasks = [];
  const context = Object.create(parentContext);
  const queue = forkQueue(mainTask, function onAbort() {
    cancelledDueToErrorTasks.push(...queue.getTasks().map(t => t.meta.name));
  }, end);
  /**
   This may be called by a parent generator to trigger/propagate cancellation
   cancel all pending tasks (including the main task), then end the current task.
    Cancellation propagates down to the whole execution tree held by this Parent task
   It's also propagated to all joiners of this task and their execution tree/joiners
    Cancellation is noop for terminated/Cancelled tasks tasks
   **/

  function cancel() {
    if (status === RUNNING) {
      // Setting status to CANCELLED does not necessarily mean that the task/iterators are stopped
      // effects in the iterator's finally block will still be executed
      status = CANCELLED;
      queue.cancelAll(); // Ending with a TASK_CANCEL will propagate the Cancellation to all joiners

      end(TASK_CANCEL, false);
    }
  }

  function end(result, isErr) {
    if (!isErr) {
      // The status here may be RUNNING or CANCELLED
      // If the status is CANCELLED, then we do not need to change it here
      if (result === TASK_CANCEL) {
        status = CANCELLED;
      } else if (status !== CANCELLED) {
        status = DONE;
      }

      taskResult = result;
      deferredEnd && deferredEnd.resolve(result);
    } else {
      status = ABORTED;
      addSagaFrame({
        meta,
        cancelledTasks: cancelledDueToErrorTasks
      });

      if (task.isRoot) {
        const sagaStack = toString(); // we've dumped the saga stack to string and are passing it to user's code
        // we know that it won't be needed anymore and we need to clear it

        clear();
        env.onError(result, {
          sagaStack
        });
      }

      taskError = result;
      deferredEnd && deferredEnd.reject(result);
    }

    task.cont(result, isErr);
    task.joiners.forEach(joiner => {
      joiner.cb(result, isErr);
    });
    task.joiners = null;
  }

  function setContext(props) {
    {
      check(props, object, createSetContextWarning('task', props));
    }

    assignWithSymbols(context, props);
  }

  function toPromise() {
    if (deferredEnd) {
      return deferredEnd.promise;
    }

    deferredEnd = deferred();

    if (status === ABORTED) {
      deferredEnd.reject(taskError);
    } else if (status !== RUNNING) {
      deferredEnd.resolve(taskResult);
    }

    return deferredEnd.promise;
  }

  const task = {
    // fields
    [TASK]: true,
    id: parentEffectId,
    meta,
    isRoot,
    context,
    joiners: [],
    queue,
    // methods
    cancel,
    cont,
    end,
    setContext,
    toPromise,
    isRunning: () => status === RUNNING,

    /*
      This method is used both for answering the cancellation status of the task and answering for CANCELLED effects.
      In most cases, the cancellation of a task propagates to all its unfinished children (including
      all forked tasks and the mainTask), so a naive implementation of this method would be:
        `() => status === CANCELLED || mainTask.status === CANCELLED`
       But there are cases that the task is aborted by an error and the abortion caused the mainTask to be cancelled.
      In such cases, the task is supposed to be aborted rather than cancelled, however the above naive implementation
      would return true for `task.isCancelled()`. So we need make sure that the task is running before accessing
      mainTask.status.
       There are cases that the task is cancelled when the mainTask is done (the task is waiting for forked children
      when cancellation occurs). In such cases, you may wonder `yield io.cancelled()` would return true because
      `status === CANCELLED` holds, and which is wrong. However, after the mainTask is done, the iterator cannot yield
      any further effects, so we can ignore such cases.
       See discussions in #1704
     */
    isCancelled: () => status === CANCELLED || status === RUNNING && mainTask.status === CANCELLED,
    isAborted: () => status === ABORTED,
    result: () => taskResult,
    error: () => taskError
  };
  return task;
}

function proc(env, iterator$1, parentContext, parentEffectId, meta, isRoot, cont) {
  if (iterator$1[asyncIteratorSymbol]) {
    throw new Error("redux-saga doesn't support async generators, please use only regular ones");
  }

  const finalRunEffect = env.finalizeRunEffect(runEffect);
  /**
    Tracks the current effect cancellation
    Each time the generator progresses. calling runEffect will set a new value
    on it. It allows propagating cancellation to child effects
  **/

  next.cancel = noop;
  /** Creates a main task to track the main flow */

  const mainTask = {
    meta,
    cancel: cancelMain,
    status: RUNNING
    /**
     Creates a new task descriptor for this generator.
     A task is the aggregation of it's mainTask and all it's forked tasks.
     **/

  };
  const task = newTask(env, mainTask, parentContext, parentEffectId, meta, isRoot, cont);
  const executingContext = {
    task,
    digestEffect
    /**
      cancellation of the main task. We'll simply resume the Generator with a TASK_CANCEL
    **/

  };

  function cancelMain() {
    if (mainTask.status === RUNNING) {
      mainTask.status = CANCELLED;
      next(TASK_CANCEL);
    }
  }
  /**
    attaches cancellation logic to this task's continuation
    this will permit cancellation to propagate down the call chain
  **/


  cont.cancel = task.cancel; // kicks up the generator

  next(); // then return the task descriptor to the caller

  return task;
  /**
   * This is the generator driver
   * It's a recursive async/continuation function which calls itself
   * until the generator terminates or throws
   * @param {internal commands(TASK_CANCEL | TERMINATE) | any} arg - value, generator will be resumed with.
   * @param {boolean} isErr - the flag shows if effect finished with an error
   *
   * receives either (command | effect result, false) or (any thrown thing, true)
   */

  function next(arg, isErr) {
    try {
      let result;

      if (isErr) {
        result = iterator$1.throw(arg); // user handled the error, we can clear bookkept values

        clear();
      } else if (shouldCancel(arg)) {
        /**
          getting TASK_CANCEL automatically cancels the main task
          We can get this value here
           - By cancelling the parent task manually
          - By joining a Cancelled task
        **/
        mainTask.status = CANCELLED;
        /**
          Cancels the current effect; this will propagate the cancellation down to any called tasks
        **/

        next.cancel();
        /**
          If this Generator has a `return` method then invokes it
          This will jump to the finally block
        **/

        result = func(iterator$1.return) ? iterator$1.return(TASK_CANCEL) : {
          done: true,
          value: TASK_CANCEL
        };
      } else if (shouldTerminate(arg)) {
        // We get TERMINATE flag, i.e. by taking from a channel that ended using `take` (and not `takem` used to trap End of channels)
        result = func(iterator$1.return) ? iterator$1.return() : {
          done: true
        };
      } else {
        result = iterator$1.next(arg);
      }

      if (!result.done) {
        digestEffect(result.value, parentEffectId, next);
      } else {
        /**
          This Generator has ended, terminate the main task and notify the fork queue
        **/
        if (mainTask.status !== CANCELLED) {
          mainTask.status = DONE;
        }

        mainTask.cont(result.value);
      }
    } catch (error) {
      if (mainTask.status === CANCELLED) {
        throw error;
      }

      mainTask.status = ABORTED;
      mainTask.cont(error, true);
    }
  }

  function runEffect(effect, effectId, currCb) {
    /**
      each effect runner must attach its own logic of cancellation to the provided callback
      it allows this generator to propagate cancellation downward.
       ATTENTION! effect runners must setup the cancel logic by setting cb.cancel = [cancelMethod]
      And the setup must occur before calling the callback
       This is a sort of inversion of control: called async functions are responsible
      of completing the flow by calling the provided continuation; while caller functions
      are responsible for aborting the current flow by calling the attached cancel function
       Library users can attach their own cancellation logic to promises by defining a
      promise[CANCEL] method in their returned promises
      ATTENTION! calling cancel must have no effect on an already completed or cancelled effect
    **/
    if (promise(effect)) {
      resolvePromise(effect, currCb);
    } else if (iterator(effect)) {
      // resolve iterator
      proc(env, effect, task.context, effectId, meta,
      /* isRoot */
      false, currCb);
    } else if (effect && effect[IO]) {
      const effectRunner = effectRunnerMap[effect.type];
      effectRunner(env, effect.payload, currCb, executingContext);
    } else {
      // anything else returned as is
      currCb(effect);
    }
  }

  function digestEffect(effect, parentEffectId, cb, label) {
    if (label === void 0) {
      label = '';
    }

    const effectId = nextEffectId();
    env.sagaMonitor && env.sagaMonitor.effectTriggered({
      effectId,
      parentEffectId,
      label,
      effect
    });
    /**
      completion callback and cancel callback are mutually exclusive
      We can't cancel an already completed effect
      And We can't complete an already cancelled effectId
    **/

    let effectSettled; // Completion callback passed to the appropriate effect runner

    function currCb(res, isErr) {
      if (effectSettled) {
        return;
      }

      effectSettled = true;
      cb.cancel = noop; // defensive measure

      if (env.sagaMonitor) {
        if (isErr) {
          env.sagaMonitor.effectRejected(effectId, res);
        } else {
          env.sagaMonitor.effectResolved(effectId, res);
        }
      }

      if (isErr) {
        setCrashedEffect(effect);
      }

      cb(res, isErr);
    } // tracks down the current cancel


    currCb.cancel = noop; // setup cancellation logic on the parent cb

    cb.cancel = () => {
      // prevents cancelling an already completed effect
      if (effectSettled) {
        return;
      }

      effectSettled = true;
      currCb.cancel(); // propagates cancel downward

      currCb.cancel = noop; // defensive measure

      env.sagaMonitor && env.sagaMonitor.effectCancelled(effectId);
    };

    finalRunEffect(effect, effectId, currCb);
  }
}

const RUN_SAGA_SIGNATURE = 'runSaga(options, saga, ...args)';
const NON_GENERATOR_ERR = `${RUN_SAGA_SIGNATURE}: saga argument must be a Generator function!`;
function runSaga(_ref, saga) {
  let _ref$channel = _ref.channel,
      channel = _ref$channel === void 0 ? stdChannel() : _ref$channel,
      dispatch = _ref.dispatch,
      getState = _ref.getState,
      _ref$context = _ref.context,
      context = _ref$context === void 0 ? {} : _ref$context,
      sagaMonitor = _ref.sagaMonitor,
      effectMiddlewares = _ref.effectMiddlewares,
      _ref$onError = _ref.onError,
      onError = _ref$onError === void 0 ? logError : _ref$onError;

  for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  {
    check(saga, func, NON_GENERATOR_ERR);
  }

  const iterator$1 = saga(...args);

  {
    check(iterator$1, iterator, NON_GENERATOR_ERR);
  }

  const effectId = nextEffectId();

  if (sagaMonitor) {
    // monitors are expected to have a certain interface, let's fill-in any missing ones
    sagaMonitor.rootSagaStarted = sagaMonitor.rootSagaStarted || noop;
    sagaMonitor.effectTriggered = sagaMonitor.effectTriggered || noop;
    sagaMonitor.effectResolved = sagaMonitor.effectResolved || noop;
    sagaMonitor.effectRejected = sagaMonitor.effectRejected || noop;
    sagaMonitor.effectCancelled = sagaMonitor.effectCancelled || noop;
    sagaMonitor.actionDispatched = sagaMonitor.actionDispatched || noop;
    sagaMonitor.rootSagaStarted({
      effectId,
      saga,
      args
    });
  }

  {
    if (notUndef(dispatch)) {
      check(dispatch, func, 'dispatch must be a function');
    }

    if (notUndef(getState)) {
      check(getState, func, 'getState must be a function');
    }

    if (notUndef(effectMiddlewares)) {
      const MIDDLEWARE_TYPE_ERROR = 'effectMiddlewares must be an array of functions';
      check(effectMiddlewares, array$1, MIDDLEWARE_TYPE_ERROR);
      effectMiddlewares.forEach(effectMiddleware => check(effectMiddleware, func, MIDDLEWARE_TYPE_ERROR));
    }

    check(onError, func, 'onError passed to the redux-saga is not a function!');
  }

  let finalizeRunEffect;

  if (effectMiddlewares) {
    const middleware = compose(...effectMiddlewares);

    finalizeRunEffect = runEffect => {
      return (effect, effectId, currCb) => {
        const plainRunEffect = eff => runEffect(eff, effectId, currCb);

        return middleware(plainRunEffect)(effect);
      };
    };
  } else {
    finalizeRunEffect = identity;
  }

  const env = {
    channel,
    dispatch: wrapSagaDispatch(dispatch),
    getState,
    sagaMonitor,
    onError,
    finalizeRunEffect
  };
  return immediately(() => {
    const task = proc(env, iterator$1, context, effectId, getMetaInfo(saga),
    /* isRoot */
    true, noop);

    if (sagaMonitor) {
      sagaMonitor.effectResolved(effectId, task);
    }

    return task;
  });
}

function sagaMiddlewareFactory(_ref) {
  if (_ref === void 0) {
    _ref = {};
  }

  let _ref2 = _ref,
      _ref2$context = _ref2.context,
      context = _ref2$context === void 0 ? {} : _ref2$context,
      _ref2$channel = _ref2.channel,
      channel = _ref2$channel === void 0 ? stdChannel() : _ref2$channel,
      sagaMonitor = _ref2.sagaMonitor,
      options = _objectWithoutPropertiesLoose(_ref2, ["context", "channel", "sagaMonitor"]);

  let boundRunSaga;

  {
    check(channel, channel$1, 'options.channel passed to the Saga middleware is not a channel');
  }

  function sagaMiddleware(_ref3) {
    let getState = _ref3.getState,
        dispatch = _ref3.dispatch;
    boundRunSaga = runSaga.bind(null, _extends({}, options, {
      context,
      channel,
      dispatch,
      getState,
      sagaMonitor
    }));
    return next => action => {
      if (sagaMonitor && sagaMonitor.actionDispatched) {
        sagaMonitor.actionDispatched(action);
      }

      const result = next(action); // hit reducers

      channel.put(action);
      return result;
    };
  }

  sagaMiddleware.run = function () {
    if (!boundRunSaga) {
      throw new Error('Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware');
    }

    return boundRunSaga(...arguments);
  };

  sagaMiddleware.setContext = props => {
    {
      check(props, object, createSetContextWarning('sagaMiddleware', props));
    }

    assignWithSymbols(context, props);
  };

  return sagaMiddleware;
}

export default sagaMiddlewareFactory;
export { runSaga, END, isEnd, eventChannel, channel, multicastChannel, stdChannel };
