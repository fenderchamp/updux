import fp from 'lodash/fp';
import u from 'updeep';

import { createStore, applyMiddleware } from 'redux';

import buildMiddleware from './buildMiddleware';

function actionFor(type) {
  return (payload = null, meta = null) => {
    return fp.pickBy(v => v !== null)({type, payload, meta});
  };
}

function buildInitial({initial = {}, subduxes = {}}) {
  let state = initial;

  if (fp.isPlainObject(initial)) {
    initial = fp.mergeAll([
      fp.mapValues(fp.getOr({}, 'initial'), subduxes),
      initial,
    ]);
  }

  return initial;
}

function buildActions({mutations = {}, effects = {}, subduxes = {}}) {
  let actions = fp.mergeAll(fp.map(fp.getOr({}, 'actions'), subduxes)) || {};

  Object.keys(mutations).forEach(type => {
    if (!actions[type]) {
      actions[type] = actionFor(type);
    }
  });

  Object.keys(effects).forEach(type => {
    if (!actions[type]) {
      actions[type] = actionFor(type);
    }
  });

  return actions;
}

const composeMutations = mutations =>
    mutations.reduce( (m1,m2) =>
        (payload=null,action={}) => state => m2(payload,action)(
            m1(payload,action)(state) ));

function buildMutations({mutations = {}, subduxes = {}}) {
  // we have to differentiate the subduxes with '*' than those
  // without, as the root '*' is not the same as any sub-'*'

    const actions = fp.uniq( Object.keys(mutations).concat(
        ...Object.values( subduxes ).map( ({mutations = {}}) => Object.keys(mutations) )
    ) );

    let mergedMutations = {};

    let [ globby, nonGlobby ] = fp.partition(
        ([_,{mutations={}}]) => mutations['*'],
        Object.entries(subduxes)
    );

    globby =
        fp.flow([
            fp.fromPairs,
            fp.mapValues(
        ({reducer}) => (_,action={}) => state =>
            reducer(state,action) ),
        ])(globby);

    const globbyMutation = (payload,action) => u(
        fp.mapValues( mut => mut(payload,action) )(globby)
    );

    actions.forEach( action => {
        mergedMutations[action] = [ globbyMutation ]
    });

    nonGlobby.forEach( ([slice, {mutations={},reducer={}}]) => {
        Object.entries(mutations).forEach(([type,mutation]) => {
            const localized = (payload=null,action={}) => u.updateIn( slice, mutation(payload,action) );

            mergedMutations[type].push(localized);
        })
    });

    Object.entries(mutations).forEach(([type,mutation]) => {
            mergedMutations[type].push(mutation);
    });

    return fp.mapValues( composeMutations )(mergedMutations);

}

function updux(config) {
  const dux = {};

  dux.actions = buildActions(config);

  dux.initial = buildInitial(config);

  dux.mutations = buildMutations(config);

  dux.upreducer = (action={}) => state => {
    if (state === null) state = dux.initial;

    const a =
      dux.mutations[action.type] ||
      dux.mutations['*'] ||
      (() => state => state);

    return a(action.payload, action)(state);
  };

  dux.reducer = (state, action) => {
    return dux.upreducer(action)(state);
  };

  dux.middleware = buildMiddleware(config,dux);

  dux.createStore = () => {
      const store =  createStore( dux.reducer, dux.initial,
          applyMiddleware( dux.middleware)
        );
      for ( let a in dux.actions ) {
          store.dispatch[a] = (...args) => {
              store.dispatch(dux.actions[a](...args))
          };
      }

      return store;
  }



  return dux;
}

export default updux;
