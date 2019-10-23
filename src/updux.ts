import fp from 'lodash/fp';
import buildActions from './buildActions';
import buildInitial from './buildInitial';
import buildMutations from './buildMutations';

import buildCreateStore from './buildCreateStore';
import buildMiddleware from './buildMiddleware';
import buildUpreducer from './buildUpreducer';
import { UpduxConfig, Dictionary, Action, ActionCreator } from './types';


export class Updux {

    subduxes: Dictionary<Updux>;

    actions: Dictionary<ActionCreator>

    constructor(config: UpduxConfig) {

        this.subduxes = fp.mapValues(
            (value:UpduxConfig|Updux) => fp.isPlainObject(value) ? new Updux(value) : value )(fp.getOr({},'subduxes',config)
        ) as Dictionary<Updux>;


        this.actions = buildActions(
            config.actions,
            config.mutations,
            config.effects,
            Object.values( this.subduxes ).map( ({actions}) => actions ),
        )

        this.initial = buildInitial(
            config.initial, fp.mapValues( ({initial}) => initial )(this.subduxes)
        );

        this.mutations = buildMutations(
            config.mutations, this.subduxes
        );

        this.upreducer = buildUpreducer(
            this.initial, this.mutations
        );

        this.reducer = (state,action) => {
            return this.upreducer(action)(state);
        }

        this.middleware = buildMiddleware(
            config.effects,
            this.actions,
            config.subduxes,
        );

        this.createStore = buildCreateStore(this.reducer,this.initial,this.middleware,this.actions);
    }

}

export default Updux;
