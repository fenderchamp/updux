import fp from 'lodash/fp';

import { Dictionary, Mutation, Action } from '../types';

function buildUpreducer<S>(initial: S, mutations: Dictionary<Mutation<S>> ) {
  return (action :Action) => (state: S) => {
    if (state === null) state = initial;

    const a =
      mutations[action.type] ||
      mutations['*'];

    if(!a) return state;

    return a(action.payload, action)(state);
  };
}

export default buildUpreducer;
